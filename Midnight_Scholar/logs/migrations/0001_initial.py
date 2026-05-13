from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Log',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('what', models.CharField(max_length=50)),
                ('who', models.CharField(max_length=150)),
                ('info', models.TextField()),
                ('when', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-when'],
            },
        ),
    ]
