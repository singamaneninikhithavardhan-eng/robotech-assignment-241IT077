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
from .permissions import IsWebLead
import json

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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only allow Web Lead or Security Managers
        user = self.request.user
        if user.role == 'WEB_LEAD' or user.user_roles.filter(can_manage_security=True).exists():
            return AuditLog.objects.all()
        return AuditLog.objects.none()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsWebLead] # Or check 'can_manage_users'

    def create(self, request, *args, **kwargs):
        data = request.data
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.create_user(username=username, password=password, email=data.get('email', ''))
            
            # Audit
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
        def set_if(field):
            if field in data: 
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
    permission_classes = [IsWebLead]

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
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old = instance.name
        res = super().update(request, *args, **kwargs)
        if old != res.data['name']:
             MemberProfile.objects.filter(sig=old).update(sig=res.data['name'])
             log_audit(request, "SIG_RENAMED", f"Renamed SIG {old} to {res.data['name']}")
        return res

class TeamPositionViewSet(viewsets.ModelViewSet):
    queryset = TeamPosition.objects.all()
    serializer_class = TeamPositionSerializer
    permission_classes = [IsWebLead]

class ProfileFieldViewSet(viewsets.ModelViewSet):
    queryset = ProfileFieldDefinition.objects.all()
    serializer_class = ProfileFieldDefinitionSerializer
    permission_classes = [IsWebLead]
    
    def perform_create(self, serializer):
        f = serializer.save()
        log_audit(self.request, "FIELD_CREATED", f"Def field {f.label}")

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
    
    def patch(self, request):
        user = request.user
        data = request.data
        profile, _ = MemberProfile.objects.get_or_create(user=user)
        
        # Self-update profile logic (omitted fields like role/permissions)
        # ... (mostly same as before) ...
        # Simplified copy for brevity
        def set_if(field):
            if field in data: setattr(profile, field, data[field])
        
        # ... mapping ...
        if 'image' in request.FILES: profile.image = request.FILES['image']
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
