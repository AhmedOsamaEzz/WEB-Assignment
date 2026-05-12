from django.urls import path
from loans import views

urlpatterns = [
    path('borrowed/', views.borrowed_books, name='loans_borrowed'),
    path('borrow/', views.borrow_book, name='borrow_book'),
    path('books/borrowed/', views.loan_list, name='admin_loan_list'),
    path('books/borrowed/action/', views.loan_action, name='admin_loan_action'),
]
