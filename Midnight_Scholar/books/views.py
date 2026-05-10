from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from books.models import Book
from authe.services.security import is_admin_check


@require_http_methods(["DELETE"])
def delete_book(request, isbn):
    if not is_admin_check(request.user):
        return JsonResponse({'error': 'Admin access required'}, status=403)

    try:
        book = Book.objects.get(isbn=isbn)
    except Book.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)

    book.delete()
    return JsonResponse({'message': 'Book deleted successfully'})
