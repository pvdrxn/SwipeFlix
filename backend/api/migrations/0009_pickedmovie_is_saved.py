from django.db import migrations, models


def migrate_saved_choice_to_is_saved(apps, schema_editor):
    PickedMovie = apps.get_model("api", "PickedMovie")
    PickedMovie.objects.filter(choice="saved").update(is_saved=True)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0008_alter_pickedmovie_choice"),
    ]

    operations = [
        migrations.AddField(
            model_name="pickedmovie",
            name="is_saved",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(migrate_saved_choice_to_is_saved, migrations.RunPython.noop),
    ]
