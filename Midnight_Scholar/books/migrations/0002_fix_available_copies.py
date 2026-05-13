from django.db import migrations


def fix_available_copies(apps, schema_editor):
    Book = apps.get_model('books', 'Book')
    Loan = apps.get_model('loans', 'Loan')

    for book in Book.objects.all():
        active = Loan.objects.filter(
            book=book,
            status__in=['reserved', 'borrowed']
        ).count()
        book.available_copies = max(0, book.total_copies - active)
        book.save()


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0001_initial'),
        ('loans', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(fix_available_copies, migrations.RunPython.noop),
    ]
