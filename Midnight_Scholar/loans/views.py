from django.http import JsonResponse
from loans.models import Loan


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
