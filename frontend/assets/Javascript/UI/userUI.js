import API from "../API/API.js";

const scriptUrl1 = import.meta.url;
const APP_ROOT1 = scriptUrl1.split("assets/Javascript/UI/userUI.js")[0];

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
async function renderCatalog(query = "", categories = [], availableOnly = false) {
  const cardsContainer = document.getElementById("card-container");
  const resultsCount = document.getElementById("results-count");
  if(!cardsContainer) return; 

  try {
    const books = await API.getBooks(query, categories, availableOnly);

    if (resultsCount) resultsCount.textContent = books.length;

    if (books.length === 0) {
      cardsContainer.innerHTML = `<p style="text-align: center; width: 100%;">No books found matching your search.</p>`;
      return;
    }
    cardsContainer.innerHTML = books.map(createCard).join("");

  } catch (error) {
    cardsContainer.innerHTML = `<p style="color: red;"> Failed to load catalog </p>`;
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
    bookInfo.innerHTML = `<p style="color: red;"> Error loading the book </p>`;
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
    const token = localStorage.getItem("user_token") || sessionStorage.getItem("user_token");
    if (!isbn) {
      alert("Error: No book selected.");
      return;
    }

    await API.borrowBook(isbn, token);
    alert("Book borrowed successfully");
  } catch (error) {
    alert("Sorry, book out of stock");
  }
}

/**
 * Fetches the user's borrowed books from the API and renders them to the screen.
 */
async function renderUserLoans() {
  const bookListElement = document.getElementById("book-list");
  if (!bookListElement) return;

  bookListElement.innerHTML = "<p style='text-align: center;'>Loading your borrowed books...</p>";

  try {
    const token = localStorage.getItem("user_token") || sessionStorage.getItem("user_token");
    
    if (!token) {
      throw new Error("You must be logged in to view your borrowed books.");
    }

    const borrowedBooks = await API.getUserBorrowedBooks(token);

    if (!borrowedBooks || borrowedBooks.length === 0) {
      bookListElement.innerHTML = "<p style='text-align: center;'>You have not borrowed any books yet.</p>";
      return;
    }

    bookListElement.innerHTML = "";

    borrowedBooks.forEach((book) => {
      const bookCard = document.createElement("div");
      bookCard.className = "book-card"; 
      
      const dateBorrowed = new Date(book.borrowedAt).toLocaleDateString();

      bookCard.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" class="book-image" style="width: 100px;" />
        <div class="book-details">
          <h3>${book.title}</h3>
          <p><strong>Author:</strong> ${book.author}</p>
          <p><strong>ISBN:</strong> ${book.isbn}</p>
          <p><strong>Borrowed on:</strong> ${dateBorrowed}</p>
        </div>
      `;
      
      bookListElement.appendChild(bookCard);
    });

  } catch (error) {
    console.error("Failed to load borrowed books:", error);
    bookListElement.innerHTML = `
      <div style="color: red; text-align: center; padding: 20px; border: 1px solid red; border-radius: 5px;">
        <strong>Error:</strong> ${error.message}
      </div>
    `;
  }
}

/**
 * handles live search functionality and listeners
 */
async function initSearchPage() {
  const searchInput = document.querySelector(".search-bar input");
  const searchForm = document.querySelector(".search-bar");
  const categoryItems = document.querySelectorAll(".filters-section ul li");
  const availabilityCheckbox = document.querySelector(".filter-check");
  const queryLabel = document.getElementById("query-label");

  let currentQuery = "";
  let currentCategory = "All";
  let currentAvailability = true;

  const triggerSearch = () => {
    if(queryLabel) {
      queryLabel.textContent = currentQuery;
    }
      const catogriesArray = (currentCategory === "All" ? [] : [currentCategory]);
      renderCatalog(currentQuery, catogriesArray, currentAvailability);
  }

  if(searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentQuery = e.target.value.trim();
      triggerSearch();
    });
  }

  if(searchForm) {
    searchForm.addEventListener("submit", (e) => {e.preventDefault()});
  }

  categoryItems.forEach(li => {
    if (li.querySelector("input")) return; 

    li.addEventListener("click", function() {
      categoryItems.forEach(item => item.classList.remove("active"));
      this.classList.add("active");
      
      currentCategory = this.textContent.trim();
      triggerSearch(); 
    });
  });


  if (availabilityCheckbox) {
    currentAvailability = availabilityCheckbox.checked; 
    availabilityCheckbox.addEventListener("change", (e) => {
      currentAvailability = e.target.checked;
      triggerSearch();
    });
  }

  triggerSearch();
}

document.addEventListener("DOMContentLoaded", () => {
  const logo = document.getElementById("logo-link");
  if(logo) {
    logo.addEventListener("click", () => {
      window.location.href = APP_ROOT1 + "user/dashboard.html";
    });
  }

  if (document.getElementById("cards-container")) {
    initSearchPage();
  }

  if (document.getElementById("book-info")) {
    renderBookDetails();
    
    const borrowBtn = document.getElementById("borrow-btn");
    if (borrowBtn) {
      borrowBtn.addEventListener("click", handleBorrowAction);
    }
  }

  if (document.getElementById("book-list")) {
    renderUserLoans();
  }
});