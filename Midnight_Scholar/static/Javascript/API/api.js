import FakeAPI from "/static/Javascript/API/fake.js";

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
  ,
  // new dashboard functions
  getLogs:         FakeAPI.getLogs,
  getPendingUsers: FakeAPI.getPendingUsers,
  getUsers:        FakeAPI.getUsers,
  approveUser:     FakeAPI.approveUser,
  denyUser:        FakeAPI.denyUser,
  banUser:         FakeAPI.banUser,
};

export default API;