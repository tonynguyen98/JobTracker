from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0003_alter_job_created_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='job',
            name='job_link',
            field=models.URLField(blank=True, max_length=2000),
        ),
    ]
