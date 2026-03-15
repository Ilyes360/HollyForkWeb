# Generated manually for PIN code feature

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('staff', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='employe',
            name='pin_code',
            field=models.CharField(
                blank=True,
                help_text='PIN code unique par restaurant (4 chiffres)',
                max_length=4,
                null=True,
                validators=[django.core.validators.RegexValidator('^\\d{4}$', 'Le code PIN doit contenir 4 chiffres.')]
            ),
        ),
    ]