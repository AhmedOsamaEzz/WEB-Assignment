async function getUserBorrowedBooks() {
  const response = await fetch('/api/loans/borrowed/');
  if (!response.ok) {
    if (response.status === 401) throw new Error('Please log in to view your borrowed books.');
    throw new Error('Failed to fetch borrowed books');
  }
  return response.json();
}

const RealAPI = {
  getUserBorrowedBooks,
};

export default RealAPI;
