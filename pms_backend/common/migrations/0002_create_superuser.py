from django.db import migrations
from django.contrib.auth import get_user_model

def create_admin_user(apps, schema_editor):
    User = get_user_model()
    if not User.objects.filter(username="admin").exists():
        User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="AdminPass123"
        )

class Migration(migrations.Migration):

    dependencies = [
        ('common', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_admin_user),
    ]