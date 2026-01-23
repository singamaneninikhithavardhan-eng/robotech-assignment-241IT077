from django.contrib.auth.models import AbstractUser
from django.db import models

# 1. Dynamic SIG Model
class Sig(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

# 2. Team Position
class TeamPosition(models.Model):
    name = models.CharField(max_length=100, unique=True)
    rank = models.IntegerField(default=100) 
    
    class Meta:
        ordering = ['rank', 'name']
        
    def __str__(self):
        return self.name

# 3. Dynamic Profile Fields
class ProfileFieldDefinition(models.Model):
    FIELD_TYPES = [
        ('text', 'Text Input'),
        ('url', 'URL Link'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('textarea', 'Long Text'),
    ]
    
    label = models.CharField(max_length=100)
    key = models.SlugField(max_length=100, unique=True)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES, default='text')
    is_required = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    limit_to_sig = models.ForeignKey(Sig, null=True, blank=True, on_delete=models.CASCADE, related_name='custom_fields')
    
    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.label

# 4. Role Model (Permissions) - Added Security Perm
class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    can_manage_users = models.BooleanField(default=False)
    can_manage_projects = models.BooleanField(default=False)
    can_manage_events = models.BooleanField(default=False)
    can_manage_team = models.BooleanField(default=False)
    can_manage_gallery = models.BooleanField(default=False)
    can_manage_announcements = models.BooleanField(default=False)
    can_manage_security = models.BooleanField(default=False) # NEW
    
    def __str__(self):
        return self.name

class User(AbstractUser):
    class Roles(models.TextChoices):
        WEB_LEAD = 'WEB_LEAD', 'Web Lead'
        CONVENOR = 'CONVENOR', 'Convenor'
        FACULTY_ADVISOR = 'FACULTY', 'Faculty Advisor'
        SIG_HEAD = 'SIG_HEAD', 'SIG Head'
        CANDIDATE = 'CANDIDATE', 'Candidate'

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CANDIDATE)
    user_roles = models.ManyToManyField(Role, blank=True, related_name="users")

    def __str__(self):
        return f"{self.username}"

# 5. Member Profile
class MemberProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', null=True, blank=True)
    
    full_name = models.CharField(max_length=100)
    roll_number = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True) 
    year_of_joining = models.IntegerField(null=True, blank=True)
    
    sig = models.CharField(max_length=100, blank=True) 
    position = models.CharField(max_length=100) 
    team_name = models.CharField(max_length=100, blank=True) 
    
    is_public = models.BooleanField(default=True) 
    is_alumni = models.BooleanField(default=False) 
    order = models.IntegerField(default=0) 
    
    image = models.ImageField(upload_to='team/', blank=True, null=True)
    description = models.TextField(blank=True)
    
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    email = models.EmailField(blank=True) 
    
    year = models.CharField(max_length=50, blank=True) 
    branch = models.CharField(max_length=100, blank=True) 

    custom_fields = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['order', 'full_name']

    def __str__(self):
        return f"{self.full_name}"

# 6. Audit Log (NEW)
class AuditLog(models.Model):
    event_type = models.CharField(max_length=50) # e.g. "USER_MODIFIED", "ROLE_CHANGED"
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='actions')
    target = models.CharField(max_length=255) # e.g. "Updated User: aditya"
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.TextField(blank=True) # JSON or text summary
    success = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} by {self.actor} at {self.created_at}"
