from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet, UserViewSet, UserProfileView, PublicTeamView, 
    SigViewSet, ProfileFieldViewSet, TeamPositionViewSet, AuditLogViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='roles')
router.register(r'management', UserViewSet, basename='user_management')
router.register(r'sigs', SigViewSet, basename='sigs') 
router.register(r'positions', TeamPositionViewSet, basename='positions') 
router.register(r'profile-fields', ProfileFieldViewSet, basename='profile_fields') 
# New
router.register(r'admin/audit-logs', AuditLogViewSet, basename='audit_logs')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('team/public/', PublicTeamView.as_view(), name='team_public'),
]
