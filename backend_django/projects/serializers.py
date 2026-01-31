from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Project, Task, TaskComment, ProjectRequest, ProjectThread, ThreadMessage

class ThreadMessageSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    class Meta:
        model = ThreadMessage
        fields = '__all__'
        read_only_fields = ['author']

class ProjectThreadSerializer(serializers.ModelSerializer):
    messages = ThreadMessageSerializer(many=True, read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    class Meta:
        model = ProjectThread
        fields = '__all__'

class ProjectRequestSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    user_position = serializers.CharField(source='user.profile.position', read_only=True)
    class Meta:
        model = ProjectRequest
        fields = '__all__'

class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = '__all__'
        read_only_fields = ['author']

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    lead_details = UserSerializer(source='lead', read_only=True)
    members_details = UserSerializer(source='members', many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    threads = ProjectThreadSerializer(many=True, read_only=True)
    join_requests = ProjectRequestSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        # Security: Only show inner details to members/leads or staff
        is_member = False
        if request and request.user.is_authenticated:
            user = request.user
            if user.is_superuser or instance.lead == user or instance.members.filter(id=user.id).exists():
                is_member = True
        
        if not is_member:
            # Strip sensitive management data for public view
            ret.pop('threads', None)
            ret.pop('tasks', None)
            ret.pop('join_requests', None)
            ret.pop('status_update_requested', None)
            ret.pop('status_requested_by', None)
            
        return ret
