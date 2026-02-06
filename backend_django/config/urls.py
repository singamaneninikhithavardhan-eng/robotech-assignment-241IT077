from django.contrib import admin
from django.urls import path, include
from django_prometheus import exports
from django.conf import settings
from django.conf.urls.static import static


from django.http import HttpResponse

# Import URL patterns from apps
from users import urls as user_urls
from projects import urls as project_urls
from events import urls as events_urls
from core import urls as core_urls
from quizzes import urls as quizzes_urls
from recruitment import urls as recruitment_urls

# Merge patterns for /api/
# This allows 'users' and 'projects' to both register routes under /api/
# without one shadowing the other, assuming their router paths don't conflict.
api_patterns = user_urls.urlpatterns + project_urls.urlpatterns + events_urls.urlpatterns + core_urls.urlpatterns + quizzes_urls.urlpatterns + recruitment_urls.urlpatterns

urlpatterns = [
#added for confirmation
    path("", lambda request: HttpResponse("Nikhitha VArdhan-Backend running")),
    path('internal-v1-secret-admin/', admin.site.urls),
    path('api/', include(api_patterns)),
    path('api/recruitment/', include(recruitment_urls)),
#added the location point of metrics
    path("metrics/", exports.ExportToDjangoView),
    path('api/attendance/', include('attendance.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
