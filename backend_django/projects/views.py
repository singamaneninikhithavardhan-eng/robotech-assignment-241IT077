from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project, Task, TaskComment, ProjectRequest, ProjectThread, ThreadMessage
from .serializers import (
    ProjectSerializer, TaskSerializer, TaskCommentSerializer,
    ProjectRequestSerializer, ProjectThreadSerializer, ThreadMessageSerializer
)
from users.permissions import GlobalPermission
from .permissions import IsProjectMember
from rest_framework.permissions import IsAuthenticated

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [GlobalPermission]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Project.objects.all().order_by('-created_at')
        return Project.objects.filter(models.Q(lead=user) | models.Q(members=user)).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        # Save project first
        project = serializer.save()
        
        # Auto-assign creator as Lead if no lead specified
        if not project.lead and self.request.user:
             project.lead = self.request.user
             project.save()
        
        # Auto-add creator to members so they can access it immediately
        if self.request.user:
            project.members.add(self.request.user)

    @action(detail=True, methods=['post'])
    def request_status(self, request, pk=None):
        project = self.get_object()
        project.status_update_requested = True
        project.status_requested_by = request.user
        project.save()
        return Response({'status': 'Status update requested'})

    @action(detail=True, methods=['post'])
    def submit_status(self, request, pk=None):
        project = self.get_object()
        update_text = request.data.get('update_text')
        if update_text:
            project.last_status_update = update_text
            project.status_update_requested = False
            project.save()
            return Response({'status': 'Status updated'})
        return Response({'error': 'No text provided'}, status=400)

    @action(detail=True, methods=['post'])
    def request_join(self, request, pk=None):
        project = self.get_object()
        user = request.user
        message = request.data.get('message', '')
        
        if project.members.filter(id=user.id).exists():
            return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)
            
        obj, created = ProjectRequest.objects.get_or_create(
            project=project, user=user,
            defaults={'message': message}
        )
        if not created:
            return Response({'error': 'Request already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'status': 'Join request sent'})

    @action(detail=True, methods=['get'])
    def sync_state(self, request, pk=None):
        """
        Lightweight endpoint for polling.
        Returns:
        - members_status: { id: last_login } for all members + lead
        - threads_hash: { thread_id: last_message_id } to detect new messages
        """
        try:
            project = self.get_object()
            
            # 1. Members Status
            members = list(project.members.all())
            if project.lead: members.append(project.lead)
            members_status = {m.id: m.last_login for m in members}
            
            # 2. Threads State
            threads_state = {}
            for t in project.threads.all():
                last_msg = t.messages.last()
                threads_state[t.id] = last_msg.id if last_msg else 0
                
            return Response({
                "members_status": members_status,
                "threads_state": threads_state
            })
        except Exception as e:
            print(f"Sync State Error: {e}")
            return Response({'error': str(e)}, status=500)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [GlobalPermission]

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            return Task.objects.all()
        return Task.objects.none()

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        task = self.get_object()
        content = request.data.get('content')
        if not content: return Response({'error': 'Content required'}, status=400)
        
        TaskComment.objects.create(task=task, author=request.user, content=content)
        return Response({'status': 'Comment added'})

class ProjectRequestViewSet(viewsets.ModelViewSet):
    queryset = ProjectRequest.objects.all()
    serializer_class = ProjectRequestSerializer
    permission_classes = [GlobalPermission]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        join_req = self.get_object()
        # Verify if requester is lead or admin
        user = request.user
        is_lead = join_req.project.lead == user
        has_perm = user.user_roles.filter(can_manage_projects=True).exists()
        is_web_lead = user.user_roles.filter(name='WEB_LEAD').exists()
        
        if not (user.is_superuser or is_lead or has_perm or is_web_lead):
             return Response({"error": "Unauthorized"}, status=403)
             
        join_req.status = 'APPROVED'
        join_req.save()
        join_req.project.members.add(join_req.user)
        return Response({"status": "approved"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        join_req = self.get_object()
        user = request.user
        if not (user.is_superuser or join_req.project.lead == user or user.user_roles.filter(can_manage_projects=True).exists() or user.user_roles.filter(name='WEB_LEAD').exists()):
             return Response({"error": "Unauthorized"}, status=403)
        join_req.status = 'REJECTED'
        join_req.save()
        return Response({"status": "rejected"})

class ProjectThreadViewSet(viewsets.ModelViewSet):
    queryset = ProjectThread.objects.all()
    serializer_class = ProjectThreadSerializer
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return ProjectThread.objects.all()
        return ProjectThread.objects.filter(models.Q(project__lead=user) | models.Q(project__members=user)).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data.get('project')
        if project and not (self.request.user == project.lead or self.request.user in project.members.all()):
            raise permissions.PermissionDenied("Must be a project member.")
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_ephemeral(self, request, pk=None):
        thread = self.get_object()
        thread.is_ephemeral = not thread.is_ephemeral
        thread.save()
        return Response({'is_ephemeral': thread.is_ephemeral})

    @action(detail=True, methods=['post'])
    def purge_messages(self, request, pk=None):
        thread = self.get_object()
        user = request.user
        # Logic: Only Lead or Admin can nuke history
        if not (user.is_superuser or user == thread.project.lead):
             return Response({"error": "Only the Project Lead can wipe history."}, status=403)
             
        count = thread.messages.all().delete()[0]
        return Response({'status': 'purged', 'count': count})

    @action(detail=True, methods=['post'])
    def signal_typing(self, request, pk=None):
        try:
            from django.core.cache import cache
            thread = self.get_object()
            user_id = request.user.id
            key = f"typing:{thread.id}:{user_id}"
            cache.set(key, request.user.username, timeout=4)
            return Response({'status': 'ok'})
        except Exception as e:
            print(f"Typing Signal Error: {e}")
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['get'])
    def get_typing_status(self, request, pk=None):
        try:
            from django.core.cache import cache
            thread = self.get_object()
            
            active_typers = []
            members = list(thread.project.members.all())
            if thread.project.lead: members.append(thread.project.lead)
            
            for m in members:
                if m.id == request.user.id: continue
                key = f"typing:{thread.id}:{m.id}"
                username = cache.get(key)
                if username:
                    active_typers.append({'id': m.id, 'username': username})
                    
            return Response({'typers': active_typers})
        except Exception as e:
            print(f"Typing Status Error: {e}")
            return Response({'error': str(e)}, status=500)

class ThreadMessageViewSet(viewsets.ModelViewSet):
    queryset = ThreadMessage.objects.all()
    serializer_class = ThreadMessageSerializer
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return ThreadMessage.objects.all()
        return ThreadMessage.objects.filter(models.Q(thread__project__lead=user) | models.Q(thread__project__members=user)).distinct()

    def perform_create(self, serializer):
        thread = serializer.validated_data.get('thread')
        if thread and not (self.request.user == thread.project.lead or self.request.user in thread.project.members.all()):
            raise permissions.PermissionDenied("Must be a project member.")
        message = serializer.save(author=self.request.user)
        
        # EPHEMERAL CLEANUP: If thread is ephemeral, delete messages older than 1 hour
        if message.thread.is_ephemeral:
            from django.utils import timezone
            from datetime import timedelta
            expiry = timezone.now() - timedelta(hours=1)
            ThreadMessage.objects.filter(thread=message.thread, created_at__lt=expiry).delete()
            # Also log for audit
            print(f"Cleanup performed for ephemeral thread: {message.thread.title}")
