from django.urls import path
from .views import ProjectListCreateView, ProjectDetailView

urlpatterns = [
    # Public & Admin combined (permissions handled in view)
    path('', ProjectListCreateView.as_view(), name='project-list-create'),
    path('<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
]
