# Recreated to match the migration chain already applied in the field --
# see docs/ARCHITECTURE.md. This file must keep this exact name so it
# lines up with databases that already have it recorded as applied.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='property',
            options={'ordering': ['name'], 'verbose_name_plural': 'Properties'},
        ),
    ]
