import FakeAPI from './fake.js';

const API = {
  // Catalog & Borrowing
  getBooks: FakeAPI.getBooks,
  getBookById: FakeAPI.getBookById,
  borrowBook: FakeAPI.borrowBook,
  getUserBorrowedBooks: FakeAPI.getUserBorrowedBooks,

  getUserHistory: FakeAPI.getUserHistory,
  extendLoan: FakeAPI.extendLoan,
  returnBook: FakeAPI.returnBook,
  
  getAdminStats: FakeAPI.getAdminStats,
  // Admin Inventory
  addBook: FakeAPI.addBook,
  getBook: FakeAPI.getBook,
  editBook: FakeAPI.editBook,
  updateBook: FakeAPI.editBook, 
  deleteBook: FakeAPI.deleteBook,

  loginUser : FakeAPI.loginUser,
  registerUser : FakeAPI.registerUser
};

export default API;