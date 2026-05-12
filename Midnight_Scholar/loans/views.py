from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from loans.models import Loan
import json
from django.core.paginator import Paginator
import datetime 
from books.models import Book

def loan_list(request):
    status = request.GET.get('status', 'all')
    loan_book_list = Loan.objects.select_related('user', 'book')
    if status == 'reserved':
        loan_book_list = loan_book_list.filter(status='reserved')
    elif status == 'borrowed':
        loan_book_list = loan_book_list.filter(status='borrowed')
    else:
        loan_book_list = loan_book_list.filter(status__in=['reserved', 'borrowed'])
    paginator = Paginator(loan_book_list.order_by('-reserved_at'), 15)
    page_to_show = paginator.get_page(request.GET.get('page'))
    return render(request, 'admin/loanList.html', {
        'page_to_show': page_to_show,
        'current_status': status,
        'today': datetime.date.today(),
    })


def loan_action(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=405)
    try:
        loan = Loan.objects.get(id=request.POST['loan_id'])
        action = request.POST['action']
        if action == 'loan' and loan.status == 'reserved':
            loan.status = 'borrowed'
            loan.borrow_date = datetime.date.today()
            loan.due_date = datetime.date.today() + datetime.timedelta(days=10)
            loan.save()
            return JsonResponse({'success': True, 'message': 'Book loaned successfully.'}, status=200)
        elif action == 'return' and loan.status == 'borrowed':
            loan.status = 'returned'
            loan.return_date = datetime.date.today()
            loan.save()
            return JsonResponse({'success': True, 'message': 'Book returned successfully.'}, status=200)
        else:
            return JsonResponse({'success': False, 'message': 'Invalid action for current loan status.'}, status=400)
    except Loan.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Loan not found.'}, status=404)

def borrowed_books(request):
    # if not request.user.is_authenticated:
    #     return JsonResponse({'error': 'Authentication required'}, status=401)

    loans = (
        Loan.objects
        .filter(user=request.user, status__in=['reserved', 'borrowed'])
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
def borrow_book(request):
    try:
        body = json.loads(request.body)
        isbn = body.get('isbn')
        book = Book.objects.get(isbn=isbn)
        is_exists = Loan.objects.filter(
            user=request.user,
            book=book,
            status__in=['reserved', 'borrowed']
        ).exists()
        if is_exists:
                return JsonResponse({'success': False, 'message': 'You already have an active loan for this book.'}, status=400)
        Loan.objects.create(user=request.user, book=book, status='reserved')
        return JsonResponse({'success': True, 'message': 'Book reserved successfully.'}, status=200)
    except Book.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Book not found.'}, status=404)

