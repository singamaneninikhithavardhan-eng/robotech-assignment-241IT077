from django.contrib.auth import get_user_model
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

User = get_user_model()

if not User.objects.filter(username='admin').exists():
    print("Creating superuser 'admin'...")
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123', role=User.Roles.WEB_LEAD)
    print("Superuser created.")
else:
    print("Superuser already exists.")
