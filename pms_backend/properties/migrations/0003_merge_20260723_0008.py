# Merge migration reconciling the two parallel 0002 branches
# (0002_alter_property_options and 0002_alter_property_options_and_more).
# No operations -- this file exists purely to resolve the migration
# graph into one linear chain. Keep this exact filename: it must match
# what's already recorded as applied on databases that hit the original
# conflict and ran `makemigrations --merge` themselves.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0002_alter_property_options'),
        ('properties', '0002_alter_property_options_and_more'),
    ]

    operations = []
