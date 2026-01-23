from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    image_path = serializers.SerializerMethodField() # For frontend compatibility

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'project_lead', 'is_open_source', 'github_url', 'cover_image', 'image_path', 'created_at']
        extra_kwargs = {
            'cover_image': {'write_only': True} # Use cover_image for upload, image_path for display
        }

    def get_image_path(self, obj):
        if obj.cover_image:
            return obj.cover_image.url
        return None
