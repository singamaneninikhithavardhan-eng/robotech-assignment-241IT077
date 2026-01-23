from rest_framework import generics, permissions
from .models import Project
from .serializers import ProjectSerializer
from users.permissions import IsWebLead, IsConvenorOrFaculty

class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsWebLead() | IsConvenorOrFaculty()] # Only admins can add
        return [permissions.AllowAny()] # Public can view

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsWebLead | IsConvenorOrFaculty] # Only admins can edit/delete
