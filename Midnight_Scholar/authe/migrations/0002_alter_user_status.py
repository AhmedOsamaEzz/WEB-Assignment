from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authe', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='status',
            field=models.CharField(
                max_length=15,
                choices=[
                    ('pending', 'Pending'),
                    ('approved', 'Approved'),
                    ('denied', 'Denied'),
                    ('banned', 'Banned'),
                ],
                default='pending',
            ),
        ),
    ]
