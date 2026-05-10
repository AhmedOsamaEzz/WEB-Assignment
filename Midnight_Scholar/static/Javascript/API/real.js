function getCsrfToken() {
  const match = document.cookie.split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('csrftoken='));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

async function getUserBorrowedBooks() {
  const response = await fetch('/api/loans/borrowed/');
  if (!response.ok) {
    if (response.status === 401) throw new Error('Please log in to view your borrowed books.');
    throw new Error('Failed to fetch borrowed books');
  }
  return response.json();
}

async function deleteBook(isbn) {
  const response = await fetch(`/api/books/${isbn}/`, {
    method: 'DELETE',
    headers: { 'X-CSRFToken': getCsrfToken() },
  });
  if (!response.ok) {
    if (response.status === 403) throw new Error('Admin access required.');
    if (response.status === 404) throw new Error('Book not found.');
    throw new Error('Failed to delete book.');
  }
  return response.json();
}

const RealAPI = {
  getUserBorrowedBooks,
  deleteBook,
};

export default RealAPI;
