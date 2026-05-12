from django.urls import path
from loans import views

urlpatterns = [
    path('borrowed/', views.borrowed_books, name='loans_borrowed'),
    path('books/borrowed/', views.admin_loan_list, name='admin_loan_list'),
    path('books/borrowed/action/', views.admin_loan_action, name='admin_loan_action'),
]
