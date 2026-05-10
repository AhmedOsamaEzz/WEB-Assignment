from django.urls import path
from books import views

urlpatterns = [
    path('<str:isbn>/', views.delete_book, name='book_delete'),
]
