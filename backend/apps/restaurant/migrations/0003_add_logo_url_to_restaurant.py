# Generated manually for logo_url field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurant', '0002_add_pin_restaurant'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='logo_url',
            field=models.URLField(
                blank=True,
                help_text='URL du logo du restaurant',
                max_length=500,
                null=True
            ),
        ),
    ]

