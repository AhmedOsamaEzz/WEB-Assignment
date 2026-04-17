import FakeAPI from './fake.js';

const API = {
  // Catalog & Borrowing
  getBooks: FakeAPI.getBooks,
  getBookById: FakeAPI.getBookById,
  borrowBook: FakeAPI.borrowBook,
  getUserBorrowedBooks: FakeAPI.getUserBorrowedBooks,

  // Admin Inventory
  addBook: FakeAPI.addBook,
  getBook: FakeAPI.getBook,
  editBook: FakeAPI.editBook,
  updateBook: FakeAPI.editBook, 
  deleteBook: FakeAPI.deleteBook
};

export default API;
