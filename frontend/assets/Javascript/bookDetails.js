const scriptUrl = document.currentScript.src;
const APP_ROOT = scriptUrl.split("assets/Javascript/bookDetails.js")[0];

// Get the current user's token to namespace their borrowed list
function getUserToken() {
  return (
    localStorage.getItem("user_token") ||
    sessionStorage.getItem("user_token") ||
    "guest"
  );
}

function getBorrowedKey() {
  return `borrowedBooks_${getUserToken()}`;
}

// Load and render book details from localStorage using the ISBN in the URL
function loadBookDetails() {
  const params = new URLSearchParams(window.location.search);
  const isbn = params.get("id");

  if (!isbn) {
    document.getElementById("page-title").textContent = "Book not found";
    return;
  }

  const booklist = JSON.parse(localStorage.getItem("booklist")) || [];
  const book = booklist.find((b) => b.isbn === isbn);

  if (!book) {
    document.getElementById("page-title").textContent = "Book not found";
    return;
  }

  // Render book fields
  document.getElementById("page-title").textContent = book.title;
  document.getElementById("book-image").src = book.cover;
  document.getElementById("book-image").alt = book.title;
  document.getElementById("isbn").textContent = `ISBN: ${book.isbn}`;
  document.getElementById("title").textContent = `Title: ${book.title}`;
  document.getElementById("author").textContent = `Author: ${book.author}`;
  document.getElementById("category").textContent = `Category: ${book.category}`;
  document.getElementById("description").textContent = `Description: ${book.description}`;

  // Calculate available copies: total minus how many are currently borrowed
  const borrowedKey = getBorrowedKey();
  const borrowedBooks = JSON.parse(localStorage.getItem(borrowedKey)) || [];
  const alreadyBorrowed = borrowedBooks.some((b) => b.isbn === isbn);

  const totalCopies = parseInt(book.copies);
  // Count how many times this book is borrowed across ALL users
  // For now we track available as copies - 1 per borrow record (simplified)
  const availableCopies = book.availableCopies !== undefined
    ? book.availableCopies
    : totalCopies;

  const statusEl = document.getElementById("status");
  statusEl.textContent = `Status: ${availableCopies > 0 ? "Available" : "Unavailable"} (${availableCopies} / ${totalCopies} copies left)`;

  // Set up borrow button
  const borrowBtn = document.getElementById("borrow-btn");

  if (alreadyBorrowed) {
    borrowBtn.textContent = "Already Borrowed";
    borrowBtn.disabled = true;
  } else if (availableCopies <= 0) {
    borrowBtn.textContent = "No Copies Available";
    borrowBtn.disabled = true;
  } else {
    borrowBtn.textContent = "Borrow this book";
    borrowBtn.addEventListener("click", () => borrowBook(book, isbn));
  }
}

function borrowBook(book, isbn) {
  const booklist = JSON.parse(localStorage.getItem("booklist")) || [];
  const bookIndex = booklist.findIndex((b) => b.isbn === isbn);

  if (bookIndex === -1) return;

  const availableCopies = booklist[bookIndex].availableCopies !== undefined
    ? booklist[bookIndex].availableCopies
    : parseInt(booklist[bookIndex].copies);

  if (availableCopies <= 0) {
    alert("Sorry, no copies are available.");
    return;
  }

  // Decrement available copies in the booklist
  booklist[bookIndex].availableCopies = availableCopies - 1;
  localStorage.setItem("booklist", JSON.stringify(booklist));

  // Add to this user's borrowed list
  const borrowedKey = getBorrowedKey();
  const borrowedBooks = JSON.parse(localStorage.getItem(borrowedKey)) || [];
  borrowedBooks.push({
    isbn: book.isbn,
    title: book.title,
    author: book.author,
    cover: book.cover,
    borrowedAt: new Date().toISOString(),
  });
  localStorage.setItem(borrowedKey, JSON.stringify(borrowedBooks));

  alert(`"${book.title}" has been added to your borrowed books!`);

  // Refresh the page to reflect new state
  window.location.reload();
}

document.addEventListener("DOMContentLoaded", loadBookDetails);
