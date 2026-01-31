from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from .models import AuditLog

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    AuditLog.objects.create(
        event_type="USER_LOGIN",
        actor=user,
        target=f"User Login: {user.username}",
        ip_address=ip,
        details="User logged in successfully"
    )

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    if user:
        ip = request.META.get('REMOTE_ADDR')
        AuditLog.objects.create(
            event_type="USER_LOGOUT",
            actor=user,
            target=f"User Logout: {user.username}",
            ip_address=ip,
            details="User logged out successfully"
        )
