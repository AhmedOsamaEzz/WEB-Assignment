import API from "../API/API.js";
import card from "../search.js";

/**
 * Generates an HTML template string for a book card.
 * @param {Object} book - Book data containing isbn, cover, title, author, year, and description.
 */
function createCard(book) {
  return `
    <div class="card" onclick="window.location.href='bookDetails.html?isbn=${book.isbn}'">
      <figure>
        <img src="${book.cover}" alt="${book.title}" draggable="false">
        <figcaption>
          <p class="name">${book.title}</p>
          <p class="author">${book.author} (${book.year})</p>
          <p class="desc">${book.description}</p>
        </figcaption>
      </figure>
    </div>
  `;
}

/**
 * Populates specific DOM elements with a single book's data.
 * @param {Object} book - The book object returned from the API.
 */
function fetchBook(book) {
  // Render book fields (From nour's details page)
  document.getElementById("page-title").textContent = book.title;
  document.getElementById("book-image").src = book.cover;
  document.getElementById("book-image").alt = book.title;
  document.getElementById("isbn").textContent = `ISBN: ${book.isbn}`;
  document.getElementById("title").textContent = `Title: ${book.title}`;
  document.getElementById("author").textContent = `Author: ${book.author}`;
  document.getElementById("category").textContent =
    `Category: ${book.category}`;
  document.getElementById("description").textContent =
    `Description: ${book.description}`;
}

/**
 * The function `renderCatalog` asynchronously fetches books from an API and renders them as cards in a
 * container, handling errors by displaying a message if the catalog fails to load.
 */
async function renderCatalog(params) {
  const cardsContainer = document.getElementById("card-container");
  try {
    const books = await API.getBooks();
    cardsContainer.innerHTML = books.map(createCard).join("");
  } catch (error) {
    cardsContainer.innerHTML = `<p style: "red"> Failed to load catalog </p>`;
  }
}

/**
 * The function `renderBookDetails` extracts the ISBN value from the URL query string, fetches book
 * details using the ISBN, and renders the book information on a webpage.
 */
async function renderBookDetails(params) {
  // Captures the 'isbn' from the URL (e.g., details.html?isbn=123)
  const isbn = new URLSearchParams(window.location.search).get("isbn");
  const bookInfo = document.getElementById("book-info");

  if (!isbn) {
    bookInfo.innerHTML = `<p style="color: orange">No book selected. Please return to the catalog.</p>`;
    return;
  }

  try {
    const book = await API.getBookById(isbn);
    fetchBook(book);
  } catch (error) {
    bookInfo.innerHTML = `<p style: "red"> Error loading the book </p>`;
  }
}

/**
 * The function `handleBorrowAction` attempts to borrow a book using an API call and displays a success
 * message if successful, or an out-of-stock message if the book is unavailable.
 */
async function handleBorrowAction(params) {
  try {
    // Captures the 'isbn' from the URL (e.g., details.html?isbn=123)
    const isbn = new URLSearchParams(window.location.search).get("isbn");
    if (!isbn) {
      alert("Error: No book selected.");
      return;
    }

    await API.borrowBook(isbn);
    alert("Book borrowed successfully");
  } catch (error) {
    alert("Sorry, book out of stock");
  }
}
