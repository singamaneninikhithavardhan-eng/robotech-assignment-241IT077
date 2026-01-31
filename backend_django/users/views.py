from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Role, MemberProfile, Sig, ProfileFieldDefinition, TeamPosition, AuditLog
from .serializers import (
    UserSerializer, RoleSerializer, MemberProfileSerializer, 
    SigSerializer, ProfileFieldDefinitionSerializer, TeamPositionSerializer, AuditLogSerializer
)
from .permissions import GlobalPermission
import json
import csv
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

# --- HELPER: AUDIT LOGGER ---
def log_audit(request, event, target, details=""):
    try:
        ip = request.META.get('REMOTE_ADDR')
        AuditLog.objects.create(
            event_type=event,
            actor=request.user if request.user.is_authenticated else None,
            target=target,
            ip_address=ip,
            details=str(details)
        )
    except: pass

# --- VIEWSETS ---

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [GlobalPermission]

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_logs.csv"'

        writer = csv.writer(response)
        writer.writerow(['Event Type', 'Actor', 'Target', 'IP Address', 'Details', 'Created At'])

        for log in self.queryset.all():
            writer.writerow([
                log.event_type,
                log.actor.username if log.actor else 'System/Proton',
                log.target,
                log.ip_address,
                log.details,
                log.created_at.strftime("%Y-%m-%d %H:%M:%S")
            ])
        return response

    @action(detail=False, methods=['post'])
    def delete_old_logs(self, request):
        days = request.data.get('days')
        if not days:
            return Response({"error": "Days parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            days = int(days)
            cutoff_date = timezone.now() - timedelta(days=days)
            deleted_count, _ = AuditLog.objects.filter(created_at__lt=cutoff_date).delete()
            log_audit(request, "LOGS_CLEANED", f"Deleted {deleted_count} logs older than {days} days")
            return Response({"status": "success", "deleted_count": deleted_count})
        except ValueError:
             return Response({"error": "Invalid days parameter"}, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [GlobalPermission]

    def create(self, request, *args, **kwargs):
        data = request.data
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.create_user(username=username, password=password, email=data.get('email', ''))
            # role logic removed as per structure-driven RBAC request
            log_audit(request, "USER_CREATED", f"Created user {username}")
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        self._assign_roles(user, data.getlist('role_ids') if hasattr(data, 'getlist') else data.get('role_ids', []))
        self._update_profile(user, data, request.FILES.get('image'))
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        data = request.data
        changes = []
        
        if 'username' in data and data['username'] != user.username:
            changes.append(f"Username changed from {user.username} to {data['username']}")
            user.username = data['username']
        
        if 'email' in data and data['email'] != user.email:
            user.email = data['email']
            
        if 'is_active' in data: 
            val = data['is_active']
            new_status = val.lower() == 'true' if isinstance(val, str) else bool(val)
            if user.is_active != new_status:
                changes.append(f"Active status changed to {new_status}")
                user.is_active = new_status

        if 'password' in data and data['password']:
            user.set_password(data['password'])
            changes.append("Password updated")

        user.save()

        if 'role_ids' in data:
            old_role_ids = list(user.user_roles.values_list('id', flat=True))
            self._assign_roles(user, data.getlist('role_ids') if hasattr(data, 'getlist') else data.get('role_ids', []))
            new_role_ids = list(user.user_roles.values_list('id', flat=True))
            if set(old_role_ids) != set(new_role_ids):
                changes.append(f"Roles updated from {old_role_ids} to {new_role_ids}")

        self._update_profile(user, data, request.FILES.get('image'))
        
        if changes:
             log_audit(request, "USER_MODIFIED", f"Modified user {user.username}", ", ".join(changes))

        return Response(UserSerializer(user).data)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="users.csv"'

        writer = csv.writer(response)
        writer.writerow(['Username', 'Email', 'Full Name', 'Role', 'Team Position', 'SIG', 'Status'])

        for user in self.queryset.all():
            profile = getattr(user, 'profile', None)
            writer.writerow([
                user.username,
                user.email,
                profile.full_name if profile else '',
                user.role,
                profile.position if profile else '',
                profile.sig if profile else '',
                'Active' if user.is_active else 'Inactive'
            ])
        return response

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        log_audit(request, "USER_DELETED", f"Deleted user {user.username}")
        return super().destroy(request, *args, **kwargs)

    def _assign_roles(self, user, role_ids):
        if role_ids is None: return
        valid_ids = [rid for rid in role_ids if rid]
        if valid_ids:
            roles = Role.objects.filter(id__in=valid_ids)
            user.user_roles.set(roles)
        else:
            user.user_roles.clear()

    def _update_profile(self, user, data, image_file):
        profile, created = MemberProfile.objects.get_or_create(user=user)
        request_user = self.request.user
        
        # Security permission check helper
        has_security_perm = (
            request_user.is_superuser or 
            request_user.user_roles.filter(can_manage_security=True).exists()
        )

        def set_if(field):
            if field in data: 
                # SENSITIVE FIELDS GUARD
                if field in ['position', 'role', 'sig'] and not has_security_perm:
                    return # Skip update if no permission
                    
                val = data[field]
                if field == 'year_of_joining':
                     try: val = int(val)
                     except: val = None
                setattr(profile, field, val)
        
        fields = ['full_name', 'roll_number', 'department', 'position', 'team_name', 
                  'sig', 'year', 'year_of_joining', 'branch', 'description', 
                  'linkedin_url', 'github_url', 'instagram_url', 'email']
        for f in fields: set_if(f)

        if 'is_public' in data:
             val = data['is_public']
             profile.is_public = (val == 'true' or val is True)
        
        if 'is_alumni' in data:
             val = data['is_alumni']
             profile.is_alumni = (val == 'true' or val is True)

        if 'custom_fields' in data:
            try:
                cf = data['custom_fields']
                if isinstance(cf, str): cf = json.loads(cf)
                profile.custom_fields = cf
            except: pass

        if 'sigs' in data:
            if has_security_perm:
                try:
                    # Expecting list of IDs
                    s_ids = data['sigs']
                    if hasattr(data, 'getlist'): s_ids = data.getlist('sigs')
                    
                    # If json string
                    if isinstance(s_ids, str): 
                        try: s_ids = json.loads(s_ids)
                        except: pass
                    
                    if isinstance(s_ids, list):
                        # Ensure IDs are ints
                        valid_ids = []
                        for i in s_ids:
                            try: valid_ids.append(int(i))
                            except: pass
                        profile.sigs.set(valid_ids)
                except Exception as e:
                    print("Error setting SIGs in UserViewSet:", e)
            else:
                pass # Ignore sigs update attempt if not admin

        if image_file: profile.image = image_file
        
        if profile.position:
             try:
                 tp = TeamPosition.objects.filter(name__iexact=profile.position).first()
                 if tp: profile.order = tp.rank
                 else: profile.order = 100 
             except: pass
        
        profile.save()
        
    @action(detail=False, methods=['post'], url_path='reorder-team')
    def reorder_team(self, request):
        items = request.data.get('items', [])
        with transaction.atomic():
            for item in items:
                 uid = item.get('id')
                 order = item.get('order')
                 if uid and order is not None:
                     MemberProfile.objects.filter(user_id=uid).update(order=order)
        return Response({"status": "updated"})


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [GlobalPermission]

    def perform_create(self, serializer):
        r = serializer.save()
        log_audit(self.request, "ROLE_CREATED", f"Created role {r.name}")

    def perform_update(self, serializer):
        r = serializer.save()
        log_audit(self.request, "ROLE_MODIFIED", f"Updated role {r.name}")

    def perform_destroy(self, instance):
        log_audit(self.request, "ROLE_DELETED", f"Deleted role {instance.name}")
        instance.delete()

# CMS & Taxonomy

class SigViewSet(viewsets.ModelViewSet):
    queryset = Sig.objects.all()
    serializer_class = SigSerializer
    permission_classes = [GlobalPermission]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old = instance.name
        res = super().update(request, *args, **kwargs)
        if old != res.data['name']:
             MemberProfile.objects.filter(sig=old).update(sig=res.data['name'])
             log_audit(request, "SIG_RENAMED", f"Renamed SIG {old} to {res.data['name']}")
        return res

    @action(detail=False, methods=['post'], url_path='reorder-sigs')
    def reorder_sigs(self, request):
        items = request.data.get('items', [])
        with transaction.atomic():
            for item in items:
                 uid = item.get('id')
                 order = item.get('order')
                 if uid and order is not None:
                     Sig.objects.filter(id=uid).update(order=order)
        return Response({"status": "updated"})

class TeamPositionViewSet(viewsets.ModelViewSet):
    queryset = TeamPosition.objects.all()
    serializer_class = TeamPositionSerializer
    permission_classes = [GlobalPermission]

class ProfileFieldViewSet(viewsets.ModelViewSet):
    queryset = ProfileFieldDefinition.objects.all()
    serializer_class = ProfileFieldDefinitionSerializer
    permission_classes = [GlobalPermission]
    
    def perform_create(self, serializer):
        f = serializer.save()
        log_audit(self.request, "FIELD_CREATED", f"Def field {f.label}")

    @action(detail=False, methods=['post'], url_path='reorder-fields')
    def reorder_fields(self, request):
        items = request.data.get('items', [])
        with transaction.atomic():
            for item in items:
                 uid = item.get('id')
                 order = item.get('order')
                 if uid and order is not None:
                     ProfileFieldDefinition.objects.filter(id=uid).update(order=order)
        return Response({"status": "updated"})

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Bypass GlobalPermission, handled by method logic

    def get(self, request):
        return Response(UserSerializer(request.user).data)
    
    def patch(self, request):
        user = request.user
        data = request.data
        profile, _ = MemberProfile.objects.get_or_create(user=user)
        
        # User core fields
        if 'email' in data:
             user.email = data['email']
             user.save()

        def set_if(field):
            if field in data:
                val = data[field]
                if field == 'year_of_joining' and val:
                    try: val = int(val)
                    except: val = None
                setattr(profile, field, val)
        
        fields = ['full_name', 'roll_number', 'department', 'sig', 'year', 
                  'year_of_joining', 'description', 'linkedin_url', 
                  'github_url', 'instagram_url']
        
        for f in fields: set_if(f)

        if 'is_public' in data:
            val = data['is_public']
            if isinstance(val, bool):
                profile.is_public = val
            elif isinstance(val, str):
                profile.is_public = val.lower() == 'true'
            else:
                 # Default fallback if unknown type
                 profile.is_public = True

        if 'image' in request.FILES: profile.image = request.FILES['image']

        if 'sigs' in data:
            # Self-update of SIGs is usually NOT allowed. 
            # User can only request, but direct update is restricted.
            # Assuming 'sigs' update is blocked here for security unless explicitly allowed policy.
            # For now, we block it in self-profile update to match strict policy.
            pass 
        
        profile.save()
        
        log_audit(request, "PROFILE_SELF_UPDATE", f"User {user.username} updated own profile")
        return Response(UserSerializer(user).data)

class PublicTeamView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    def get_queryset(self):
        qs = User.objects.filter(is_active=True, profile__is_public=True).select_related('profile').prefetch_related('user_roles')
        m_type = self.request.query_params.get('type')
        if m_type == 'alumni': qs = qs.filter(profile__is_alumni=True)
        else: qs = qs.filter(profile__is_alumni=False)
        return qs.order_by('profile__order', 'profile__full_name')
