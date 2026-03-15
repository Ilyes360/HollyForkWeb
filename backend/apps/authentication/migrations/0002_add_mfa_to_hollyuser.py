# Generated manually - MFA (TOTP) fields for HollyUser

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='hollyuser',
            name='totp_secret',
            field=models.CharField(blank=True, default='', max_length=32, verbose_name='Secret TOTP'),
        ),
        migrations.AddField(
            model_name='hollyuser',
            name='mfa_enabled',
            field=models.BooleanField(default=False, verbose_name='MFA activé'),
        ),
    ]
