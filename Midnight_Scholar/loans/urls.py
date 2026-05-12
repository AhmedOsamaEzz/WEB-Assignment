from django.urls import path
from loans import views

urlpatterns = [
    path('borrowed/', views.borrowed_books, name='loans_borrowed'),
    path('borrow/<str:isbn>/', views.borrow_book, name='borrow_book'),
]
