import FakeAPI from "/static/Javascript/API/fake.js";
import RealAPI from "/static/Javascript/API/real.js";

const API = {
  // Catalog & Borrowing
  getBooks: RealAPI.getBooks,
  getBookById: RealAPI.getBookByIsbn,
  borrowBook: RealAPI.borrowBook,
  getUserBorrowedBooks: RealAPI.getUserBorrowedBooks,
  getUserHistory: RealAPI.getUserHistory,
  extendLoan: RealAPI.extendLoan,
  returnBook: FakeAPI.returnBook,
  getAdminStats: RealAPI.getAdminStats,
  // Admin Inventory
  addBook: RealAPI.addBook,
  getBook: FakeAPI.getBook,
  editBook: FakeAPI.editBook,
  updateBook: RealAPI.updateBook,
  deleteBook: RealAPI.deleteBook,
  loginUser: FakeAPI.loginUser,
  registerUser: FakeAPI.registerUser,
  // new dashboard functions
  getLogs: RealAPI.getLogs,
  getPendingUsers: RealAPI.getPendingUsers,
  getUsers: RealAPI.getApprovedUsers,
  approveUser: RealAPI.approveUser,
  denyUser: RealAPI.denyUser,
  banUser: RealAPI.banUser,
  unbanUser: RealAPI.unbanUser,
  searchUsers: RealAPI.searchUsers,
};

export default API;
