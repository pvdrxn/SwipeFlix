from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0009_pickedmovie_is_saved"),
    ]

    operations = [
        migrations.AlterField(
            model_name="pickedmovie",
            name="choice",
            field=models.CharField(
                blank=True,
                choices=[("saved", "Saved"), ("liked", "Liked"), ("pass", "Pass")],
                max_length=10,
                null=True,
            ),
        ),
    ]
