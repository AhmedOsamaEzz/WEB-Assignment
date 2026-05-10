from django.shortcuts import render
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.admin.views.decorators import staff_member_required
from django.core.exceptions import ValidationError
from .models import Book
import re
from datetime import date

# Create your views here.

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

        # makes sure book data is valid
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

        return JsonResponse({
            'success': True,
            'message': 'Book added successfully!',
            'isbn': book.isbn,
        }, status=201)

    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)