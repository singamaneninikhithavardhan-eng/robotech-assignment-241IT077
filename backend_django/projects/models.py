from django.db import models

class Project(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    project_lead = models.CharField(max_length=100)
    is_open_source = models.BooleanField(default=False)
    github_url = models.URLField(blank=True, null=True)
    cover_image = models.ImageField(upload_to='projects/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
