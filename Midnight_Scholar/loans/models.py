from django.db import models
from django.conf import settings


class Loan(models.Model):
    STATUS_CHOICES = [
        ('reserved', 'Reserved'),   # user clicked reserve, waiting for pickup
        ('borrowed', 'Borrowed'),   # admin handed it over
        ('returned', 'Returned'),   # book is back in library
        ('cancelled', 'Cancelled'), # user didn't show up
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='reserved')
    
    reserved_at = models.DateTimeField(auto_now_add=True)
    borrow_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    
    is_extended = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.book.title} - {self.status}"