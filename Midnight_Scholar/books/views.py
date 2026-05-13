from django.shortcuts import render, get_object_or_404
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Book
import re
from datetime import date
from loans.models import Loan
from logs.models import Log


def book_details(request):
    isbn = request.GET.get('isbn')
    book = get_object_or_404(Book, isbn=isbn)

    is_active = Loan.objects.filter(
        user=request.user,
        book=book,
        status__in=['reserved', 'borrowed']
    ).exists()

    return render(request, 'user/bookDetails.html', {
        'book': book,
        'is_active': is_active,
    })


def get_book(request, isbn):
    try:
        book = Book.objects.get(isbn=isbn)
        return JsonResponse({
            'success': True,
            'isbn': book.isbn,
            'title': book.title,
            'author': book.author,
            'year': book.year,
            'publisher': book.publisher,
            'copies': book.total_copies,
            'availableCopies': book.available_copies,
            'description': book.description or '',
            'category': book.category,
            'cover': book.cover_image.url if book.cover_image else '',
        })
    except Book.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Book not found'}, status=404)


@require_POST
def add_book(request):
    try:
        title       = request.POST.get('title', '').strip()
        author      = request.POST.get('author', '').strip()
        isbn        = request.POST.get('isbn', '').strip()
        year        = request.POST.get('year', '').strip()
        publisher   = request.POST.get('publisher', '').strip()
        copies      = request.POST.get('copies', '').strip()
        description = request.POST.get('description', '').strip()
        category    = request.POST.get('category', 'Uncategorized').strip()
        cover_image = request.FILES.get('cover_image')

        errors = {}

        if not title:
            errors['title'] = 'Title is required'
        if not author:
            errors['author'] = 'Author is required'
        if not publisher:
            errors['publisher'] = 'Publisher is required'
        if not description:
            errors['description'] = 'Description is required'
        if not category:
            errors['category'] = 'Category is required'

        if not isbn:
            errors['isbn'] = 'ISBN is required'
        elif not re.match(r'^[\d\-]+[Xx]?$', isbn) or len(isbn) > 13:
            errors['isbn'] = 'Invalid ISBN format'
        elif Book.objects.filter(isbn=isbn).exists():
            errors['isbn'] = 'A book with this ISBN already exists'

        if not year:
            errors['year'] = 'Year is required'
        elif not year.isdigit() or len(year) != 4:
            errors['year'] = 'Year must be a 4-digit number'
        else:
            year_int = int(year)
            if year_int < 1000 or year_int > date.today().year:
                errors['year'] = f'Year must be between 1000 and {date.today().year}'

        if not copies:
            errors['copies'] = 'Copies is required'
        elif not copies.isdigit() or int(copies) < 1:
            errors['copies'] = 'Copies must be a positive number'

        if not cover_image:
            errors['cover_image'] = 'Cover image is required'

        if errors:
            return JsonResponse({'success': False, 'errors': errors}, status=400)

        copies_int = int(copies)
        book = Book.objects.create(
            title=title,
            author=author,
            isbn=isbn,
            year=int(year),
            publisher=publisher,
            total_copies=copies_int,
            available_copies=copies_int,
            description=description,
            category=category,
            cover_image=cover_image,
        )

        who = getattr(request.user, 'name', 'Admin')
        Log.objects.create(
            what='book_added',
            who=who,
            info=f'{who} added "{title}"',
        )

        return JsonResponse({
            'success': True,
            'message': 'Book added successfully!',
            'isbn': book.isbn,
        }, status=201)

    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@require_POST
def delete_book(request, isbn):
    try:
        book = Book.objects.get(isbn=isbn)
        title = book.title
        book.delete()
        who = getattr(request.user, 'name', 'Admin')
        Log.objects.create(
            what='book_deleted',
            who=who,
            info=f'{who} deleted "{title}"',
        )
        return JsonResponse({'success': True, 'message': 'The book has been deleted.'}, status=200)
    except Book.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Book not found.'}, status=404)


@require_POST
def edit_book(request, isbn):
    if not request.user.is_authenticated or getattr(request.user, 'role', 'user') != 'admin':
        return JsonResponse({'success': False, 'message': 'Admin access required'}, status=403)

    try:
        book = Book.objects.get(isbn=isbn)
    except Book.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Book not found'}, status=404)

    title       = request.POST.get('title', '').strip()
    author      = request.POST.get('author', '').strip()
    new_isbn    = request.POST.get('isbn', '').strip()
    year        = request.POST.get('year', '').strip()
    publisher   = request.POST.get('publisher', '').strip()
    copies      = request.POST.get('copies', '').strip()
    description = request.POST.get('description', '').strip()
    category    = request.POST.get('category', 'Uncategorized').strip()
    cover_image = request.FILES.get('cover_image')

    errors = {}

    if not title:
        errors['title'] = 'Title is required'
    if not author:
        errors['author'] = 'Author is required'
    if not publisher:
        errors['publisher'] = 'Publisher is required'
    if not description:
        errors['description'] = 'Description is required'

    if not new_isbn:
        errors['isbn'] = 'ISBN is required'
    elif not re.match(r'^[\d\-]+[Xx]?$', new_isbn) or len(new_isbn) > 13:
        errors['isbn'] = 'Invalid ISBN format'
    elif new_isbn != isbn and Book.objects.filter(isbn=new_isbn).exists():
        errors['isbn'] = 'A book with this ISBN already exists'

    if not year:
        errors['year'] = 'Year is required'
    elif not year.isdigit() or len(year) != 4:
        errors['year'] = 'Year must be a 4-digit number'
    else:
        year_int = int(year)
        if year_int < 1000 or year_int > date.today().year:
            errors['year'] = f'Year must be between 1000 and {date.today().year}'

    if not copies:
        errors['copies'] = 'Copies is required'
    elif not copies.isdigit() or int(copies) < 1:
        errors['copies'] = 'Copies must be a positive number'

    if errors:
        return JsonResponse({'success': False, 'errors': errors}, status=400)

    copies_int = int(copies)
    borrowed = book.total_copies - book.available_copies
    new_available = max(0, copies_int - borrowed)

    book.title            = title
    book.author           = author
    book.isbn             = new_isbn
    book.year             = int(year)
    book.publisher        = publisher
    book.total_copies     = copies_int
    book.available_copies = new_available
    book.description      = description
    book.category         = category
    if cover_image:
        book.cover_image = cover_image

    book.save()

    who = getattr(request.user, 'name', 'Admin')
    Log.objects.create(
        what='book_edited',
        who=who,
        info=f'{who} edited "{title}"',
    )

    return JsonResponse({
        'success': True,
        'message': 'Book updated successfully!',
        'isbn': book.isbn,
    })


def book_list(request):
    book_list = Book.objects.all()
    paginator = Paginator(book_list, 7)
    page_no = request.GET.get('page')
    page_to_show = paginator.get_page(page_no)
    return render(request, 'admin/bookList.html', {'page_to_show': page_to_show})


@require_GET
def search_books(request):
    try:
        query           = request.GET.get('query', '').strip().lower()
        categories_param = request.GET.get('categories', '').strip()
        available_only  = request.GET.get('available_only', 'false').lower() == 'true'

        categories = [cat.strip() for cat in categories_param.split(',') if cat.strip()]

        books = Book.objects.all()

        if query:
            books = books.filter(Q(title__icontains=query) | Q(author__icontains=query))

        if categories and 'all' not in [cat.lower() for cat in categories]:
            books = books.filter(category__in=categories)

        if available_only:
            books = books.filter(available_copies__gt=0)

        books_data = [
            {
                'isbn': book.isbn,
                'title': book.title,
                'author': book.author,
                'year': book.year,
                'category': book.category,
                'description': book.description,
                'cover': book.cover_image.url if book.cover_image else '/static/images/default-cover.png',
                'copies': book.available_copies,
                'availableCopies': book.available_copies,
            }
            for book in books
        ]

        return JsonResponse({'success': True, 'results': books_data, 'count': len(books_data)})

    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)
