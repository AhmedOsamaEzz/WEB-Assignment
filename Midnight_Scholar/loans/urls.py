from django.urls import path
from loans import views

urlpatterns = [
    path('borrowed/', views.borrowed_books, name='loans_borrowed'),
]
