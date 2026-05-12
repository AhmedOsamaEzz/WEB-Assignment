from django.urls import path
from . import views

urlpatterns = [
    # path('add-book/', views.render, name='add_book_page'),
    path('add/', views.add_book, name='add_book'),
    path('delete/<str:isbn>/', views.delete_book, name='delete_book'),
    path('search/', views.search_books, name='search_books'),
    path('edit/<str:isbn>/', views.edit_book, name='edit_book'),
    path('detail/<str:isbn>/', views.get_book, name='get_book'),
]