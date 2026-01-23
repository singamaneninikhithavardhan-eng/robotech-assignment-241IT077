from rest_framework import permissions
from .models import User

class IsWebLead(permissions.BasePermission):
    """
    Full access + Sudo powers (managed in views, but this allows access to sensitive endpoints).
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Roles.WEB_LEAD

class IsConvenorOrFaculty(permissions.BasePermission):
    """
    Full access except sudo powers.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in [User.Roles.WEB_LEAD, User.Roles.CONVENOR, User.Roles.FACULTY_ADVISOR]

class IsSIGHead(permissions.BasePermission):
    """
    SIG Heads access.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in [
            User.Roles.WEB_LEAD, 
            User.Roles.CONVENOR, 
            User.Roles.FACULTY_ADVISOR, 
            User.Roles.SIG_HEAD
        ]
