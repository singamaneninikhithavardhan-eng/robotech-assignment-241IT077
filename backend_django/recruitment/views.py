from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RecruitmentDrive, TimelineEvent
from .serializers import RecruitmentDriveSerializer, TimelineEventSerializer
from django.db import transaction

class RecruitmentDriveViewSet(viewsets.ModelViewSet):
    queryset = RecruitmentDrive.objects.all().order_by('-created_at')
    serializer_class = RecruitmentDriveSerializer
    # permission_classes = [GlobalPermission] -> Moved to get_permissions

    def get_permissions(self):
        if self.action == 'active_public':
            return [permissions.AllowAny()]
        from users.permissions import GlobalPermission
        return [GlobalPermission()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def active_public(self, request):
        """Public endpoint to get the current active recruitment drive"""
        drive = RecruitmentDrive.objects.filter(is_active=True, is_public=True).first()
        if drive:
            return Response(RecruitmentDriveSerializer(drive).data)
        return Response(None)

class TimelineEventViewSet(viewsets.ModelViewSet):
    queryset = TimelineEvent.objects.all()
    serializer_class = TimelineEventSerializer
    # permission_classes = [GlobalPermission] -> Moved to get_permissions
    
    def get_permissions(self):
        from users.permissions import GlobalPermission
        return [GlobalPermission()]

    def perform_update(self, serializer):
        # Check if date changed, if so, update original_date if it wasn't set
        instance = self.get_object()
        new_date = serializer.validated_data.get('date')
        
        if new_date and instance.date != new_date and not instance.original_date:
             # Store the old date as original before updating
             serializer.save(original_date=instance.date)
        else:
             serializer.save()
