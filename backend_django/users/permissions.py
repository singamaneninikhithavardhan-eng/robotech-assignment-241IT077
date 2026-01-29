from rest_framework import permissions

class GlobalPermission(permissions.BasePermission):
    """
    Role-Based Access Control via Structure Positions & Roles:
    - READ: Shared Visibility for all authenticated team members.
    - WRITE: Based on permission flags in the user's assigned Roles 
      OR the Role linked to their 'Structure Position'.
    """
    def has_permission(self, request, view):
        user = request.user
        view_name = view.__class__.__name__
        # Safe debug logging
        user_roles = []
        if user and user.is_authenticated:
             user_roles = [r.name for r in user.user_roles.all()]
        print(f"DEBUG: Permission check for {view_name} [{request.method}] User: {user} Roles: {user_roles}")
        
        # 0. Public Bypass for Submissions (Unauthenticated ok)
        public_post_views = [
            'FormResponseViewSet', 
            'ContactMessageViewSet', 
            'SponsorshipViewSet'
        ]
        
        # 0.1 Public Bypass for Reading (Landing page etc)
        public_read_views = [
            'ProjectViewSet',
            'GalleryViewSet',
            'announcements/public/',
            'gallery/public-grouped/',
            'recruitment/drives/active_public/',
            'AnnouncementViewSet',
            'EventViewSet',
            'SponsorshipViewSet', # Might want to see current sponsors
            'FormViewSet',        # Need to see form structure to submit
            'FormSectionViewSet',
            'FormFieldViewSet',
            'SigViewSet',
            'TeamPositionViewSet'
        ]

        if view_name in public_post_views and request.method == 'POST':
            return True
            
        if view_name in public_read_views and request.method in permissions.SAFE_METHODS:
            return True

        if not user or not user.is_authenticated:
            return False
        
        # 1. Superuser/Admin Bypass
        if user.is_superuser:
            return True

        # Helper: check for specific flag across all sources
        def check_flag(flag_name):
            # A. Check explicitly assigned roles
            if user.user_roles.filter(**{flag_name: True}).exists():
                return True
            
            # B. Check Role linked to user's Position (Structure Management)
            try:
                from .models import TeamPosition
                pos_name = getattr(user.profile, 'position', None)
                if pos_name:
                    pos = TeamPosition.objects.filter(name__iexact=pos_name).first()
                    if pos and pos.role_link and getattr(pos.role_link, flag_name):
                        return True
            except: pass
            
            return False
            
        # 3. Web Lead / Security Manager check (Full Access)
        if check_flag('can_manage_security'):
            return True

        # 4. Shared Visibility Check removed to enforce Strict RBAC
        # if request.method in permissions.SAFE_METHODS:
        #    return True

        # 5. Mutation Mapping
        perm_map = {
            'UserViewSet': 'can_manage_users',
            'RoleViewSet': 'can_manage_security',
            'SigViewSet': 'can_manage_security',
            'TeamPositionViewSet': 'can_manage_security',
            'ProfileFieldViewSet': 'can_manage_security',
            'ProjectViewSet': 'can_manage_projects',
            'TaskViewSet': 'can_manage_projects',
            'EventViewSet': 'can_manage_events',
            'AttendanceSessionViewSet': 'can_manage_events',
            'AttendanceRecordViewSet': 'can_manage_events',
            'AnnouncementViewSet': 'can_manage_announcements',
            'GalleryViewSet': 'can_manage_gallery',
            'SponsorshipViewSet': 'can_manage_sponsorship',
            'ContactMessageViewSet': 'can_manage_messages',
            'ProjectThreadViewSet': 'can_manage_projects',
            'ThreadMessageViewSet': 'can_manage_projects',
            'AuditLogViewSet': 'can_manage_security',
            'FormViewSet': 'can_manage_forms',
            'FormSectionViewSet': 'can_manage_forms',
            'FormFieldViewSet': 'can_manage_forms',
            'QuizViewSet': 'can_manage_forms',
            'QuestionViewSet': 'can_manage_forms',
            'QuizAttemptViewSet': 'can_manage_forms',
        }

        flag = perm_map.get(view_name)
        if not flag:
            return False # Strictly deny unmapped write actions
            
        if check_flag(flag):
            return True
            
        # 6. 'can_manage_content' Super-flag (Content CMS)
        content_related_flags = [
            'can_manage_events',
            'can_manage_announcements',
            'can_manage_gallery',
            'can_manage_sponsorship',
            'can_manage_messages',
            'can_manage_forms'
        ]
        if flag in content_related_flags and check_flag('can_manage_content'):
            return True
            
        return False

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

class IsWebLead(permissions.BasePermission):
    """Fallback/Specific check for highest level"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated: return False
        if request.user.is_superuser: return True
        return request.user.user_roles.filter(can_manage_security=True).exists()
