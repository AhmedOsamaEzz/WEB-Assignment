// ---------- storage helpers ----------

const BOOKLIST_KEY = "booklist";

const getBooklist = () => JSON.parse(localStorage.getItem(BOOKLIST_KEY)) || [];
const saveBooklist = (list) => localStorage.setItem(BOOKLIST_KEY, JSON.stringify(list));

const getBorrowedKey = (userToken) => `borrowedBooks_${userToken}`;
const getBorrowedList = (userToken) =>
  JSON.parse(localStorage.getItem(getBorrowedKey(userToken))) || [];
const saveBorrowedList = (userToken, list) =>
  localStorage.setItem(getBorrowedKey(userToken), JSON.stringify(list));

const getAvailableCopies = (book) =>
  book.availableCopies !== undefined
    ? book.availableCopies
    : parseInt(book.copies);



// ---------- API functions ----------

async function getBooks(query = "", categories = [], availableOnly = false) {
  const books = getBooklist();
  const q = query.trim().toLowerCase();
  const cats = categories.map((c) => c.toLowerCase());
  const filterByCategory = cats.length > 0 && !cats.includes("all");

  return books.filter((book) => {
    const matchesQuery =
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q);

    const matchesCategory =
      !filterByCategory || cats.includes(book.category.toLowerCase());

    const matchesAvail =
      !availableOnly || getAvailableCopies(book) > 0;

    return matchesQuery && matchesCategory && matchesAvail;
  });
}

async function getBookById(ISBN) {
  const book = getBooklist().find((b) => b.isbn === ISBN);
  if (!book) throw new Error("book not found");
  return book;
}

async function borrowBook(ISBN, userToken) {
  const booklist = getBooklist();
  const index = booklist.findIndex((b) => b.isbn === ISBN);

  if (index === -1) throw new Error("book not found");

  const book = booklist[index];
  const availableCopies = getAvailableCopies(book);

  if (availableCopies <= 0) throw new Error("book out of stock");

  // Decrement available copies
  booklist[index].availableCopies = availableCopies - 1;
  saveBooklist(booklist);

  // Link borrowed book to the user
  const borrowedBooks = getBorrowedList(userToken);
  borrowedBooks.push({
    isbn: book.isbn,
    title: book.title,
    author: book.author,
    cover: book.cover,
    borrowedAt: new Date().toISOString(),
  });
  saveBorrowedList(userToken, borrowedBooks);

  return book;
}

async function getUserBorrowedBooks(userToken) {
  return getBorrowedList(userToken);
}



// ---------- export ----------

const fake = { getBooks, getBookById, borrowBook, getUserBorrowedBooks };

export default fake;
