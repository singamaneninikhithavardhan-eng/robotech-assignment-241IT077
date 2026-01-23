from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Role, MemberProfile, Sig, ProfileFieldDefinition, TeamPosition, AuditLog

User = get_user_model()

class SigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sig
        fields = '__all__'

class TeamPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamPosition
        fields = '__all__'

class ProfileFieldDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileFieldDefinition
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'

class MemberProfileSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    custom_fields = serializers.JSONField(required=False)
    
    class Meta:
        model = MemberProfile
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    user_roles = RoleSerializer(many=True, read_only=True)
    profile = MemberProfileSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'user_roles', 'profile', 'is_active', 'permissions')

    def get_permissions(self, obj):
        perms = set()
        for r in obj.user_roles.all():
            if r.can_manage_users: perms.add('can_manage_users')
            if r.can_manage_projects: perms.add('can_manage_projects')
            if r.can_manage_events: perms.add('can_manage_events')
            if r.can_manage_team: perms.add('can_manage_team')
            if r.can_manage_gallery: perms.add('can_manage_gallery')
            if r.can_manage_announcements: perms.add('can_manage_announcements')
            if r.can_manage_security: perms.add('can_manage_security')
            if r.name == 'WEB_LEAD': perms.add('can_manage_everything') 
        return list(perms)
