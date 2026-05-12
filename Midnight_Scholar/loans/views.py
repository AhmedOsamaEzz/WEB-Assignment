from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db import transaction
from loans.models import Loan
from books.models import Book
from datetime import date, timedelta


def borrowed_books(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    loans = (
        Loan.objects
        .filter(user=request.user, status='borrowed')
        .select_related('book')
        .order_by('-borrow_date')
    )

    data = [
        {
            'isbn': loan.book.isbn,
            'title': loan.book.title,
            'author': loan.book.author,
            'cover': loan.book.cover_image.url if loan.book.cover_image else '',
            'borrowedAt': (
                loan.borrow_date.isoformat()
                if loan.borrow_date
                else loan.reserved_at.date().isoformat()
            ),
            'dueDate': loan.due_date.isoformat() if loan.due_date else None,
            'extended': loan.is_extended,
        }
        for loan in loans
    ]
    return JsonResponse(data, safe=False)


@require_POST
def borrow_book(request, isbn):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required'}, status=401)

    with transaction.atomic():
        try:
            book = Book.objects.select_for_update().get(isbn=isbn)
        except Book.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Book not found'}, status=404)

        if book.available_copies <= 0:
            return JsonResponse({'success': False, 'message': 'No copies available'}, status=400)

        if Loan.objects.filter(user=request.user, book=book, status='borrowed').exists():
            return JsonResponse({'success': False, 'message': 'You already have this book borrowed'}, status=400)

        today = date.today()
        loan = Loan.objects.create(
            user=request.user,
            book=book,
            status='borrowed',
            borrow_date=today,
            due_date=today + timedelta(days=14),
        )

        book.available_copies -= 1
        book.save(update_fields=['available_copies'])

    return JsonResponse({
        'success': True,
        'message': 'Book borrowed successfully',
        'dueDate': loan.due_date.isoformat(),
    })
