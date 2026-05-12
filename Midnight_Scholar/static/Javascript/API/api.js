import FakeAPI from "/static/Javascript/API/fake.js";
import RealAPI from "/static/Javascript/API/real.js";

const API = {
  // Catalog & Borrowing
  getBooks: RealAPI.getBooks,
  getBookById: RealAPI.getBookById,
  borrowBook: RealAPI.borrowBook,
  getUserBorrowedBooks: RealAPI.getUserBorrowedBooks,

  getUserHistory: FakeAPI.getUserHistory,
  extendLoan: FakeAPI.extendLoan,
  returnBook: FakeAPI.returnBook,

  getAdminStats: FakeAPI.getAdminStats,
  // Admin Inventory
  addBook: RealAPI.addBook,
  getBook: FakeAPI.getBook,
  editBook: FakeAPI.editBook,
  updateBook: RealAPI.updateBook,
  deleteBook: RealAPI.deleteBook,

  loginUser: FakeAPI.loginUser,
  registerUser: FakeAPI.registerUser,
  // new dashboard functions
  getLogs: FakeAPI.getLogs,
  getPendingUsers: FakeAPI.getPendingUsers,
  getUsers: FakeAPI.getUsers,
  approveUser: FakeAPI.approveUser,
  denyUser: FakeAPI.denyUser,
  banUser: FakeAPI.banUser,
};

export default API;
