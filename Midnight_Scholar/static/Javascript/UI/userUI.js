import API from "../API/api.js";

const scriptUrl1 = import.meta.url;
const APP_ROOT1 = scriptUrl1.split("assets/Javascript/UI/userUI.js")[0];

/**
 * Generates an HTML template string for a book card.
 * @param {Object} book - Book data containing isbn, cover, title, author, year, and description.
 */
function createCard(book) {
  const isAvailable = book.copies;
  return `
    <div class="card">
      <figure>
      <img src="${book.cover}" alt="${book.title}" draggable="false">
      <figcaption>
        <p class="badge">${book.category}</p>
          <p class="name">${book.title}</p>
          <p class="author">${book.author} (${book.year})</p>
          <p class="desc">${book.description}</p>
        </figcaption>
      </figure>
      <div class="card-footer">
        <div id="availability" class="${isAvailable > 0 ? "available" : "unavailable"}">
          ${isAvailable > 0 ? "Available" : "Unavailable"}
        </div>
        <button class="details-btn" onclick="window.location.href='/user/books/?isbn=${book.isbn}'" >Details <span>→</span></button>
      </div>
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
  document.getElementById("category").textContent = `Category: ${book.category}`;
  document.getElementById("description").textContent = `Description: ${book.description}`;
}

/**
 * The function `renderCatalog` asynchronously fetches books from an API and renders them as cards in a
 * container, handling errors by displaying a message if the catalog fails to load.
 */
async function renderCatalog(query = "", categories = [], availableOnly = false) {
  const cardsContainer = document.getElementById("cards-container");
  const resultsCount = document.getElementById("results-count");
  if (!cardsContainer) return;

  try {
    const books = await API.getBooks(query, categories, availableOnly);
    if (resultsCount) resultsCount.textContent = books.length;

    if (books.length === 0) {
      cardsContainer.innerHTML = `<p style="text-align: center; width: 100%;">No books found matching your search.</p>`;
      return;
    }
    cardsContainer.innerHTML = books.map(createCard).join("");
  } catch (error) {
    console.log(error);
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
    console.log(error);
    bookInfo.innerHTML = `<p style="color: red;"> Error loading the book </p>`;
  }
}

/**
 * The function `handleBorrowAction` attempts to borrow a book using an API call and displays a success
 * message if successful, or an out-of-stock message if the book is unavailable.
 */
async function handleBorrowAction() {
  try {
    const isbn = new URLSearchParams(window.location.search).get("isbn");
    if (!isbn) {
      alert("Error: No book selected.");
      return;
    }
    await API.borrowBook(isbn);
    alert("Book reserved successfully.");
    window.location.reload();
  } catch (error) {
    alert(error.message || "Sorry, something went wrong.");
  }
}

/**
 * this function check if the book is borrowed or not to prevent a user from borrowing more than one copy
 * @param {string} token
 * @param {string} isbn
 */
async function checkBookStatus(isbn) {
  try {
    const borrowedBooks = await API.getUserBorrowedBooks();

    const isActive = borrowedBooks.some((book) => book.isbn === isbn);
    if (isActive) disableBorrowButton();
  } catch (error) {
    console.log(error);
    disableBorrowButton();
    const borrowBtn = document.getElementById("borrow-btn");
    if (borrowBtn) borrowBtn.textContent = "Unable to verify borrowing status";
  }
}
// this function is to disable the borrown btn if needed (also made by ghareeb)
function disableBorrowButton() {
  const borrowBtn = document.getElementById("borrow-btn");
  if (borrowBtn) {
    borrowBtn.textContent = "Book already borrowed";
    borrowBtn.disabled = true;
    borrowBtn.classList.add("disabled-btn");
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
    const borrowedBooks = await API.getUserBorrowedBooks();

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
    console.log(error);
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
  const categoryItems = document.querySelectorAll(".filters-section:nth-child(2) ul li");
  const checkRow = document.querySelector(".filters .filters-section:nth-child(3) ul li");
  const queryLabel = document.getElementById("query-label");

  let currentQuery = "";
  let currentCategory = "All";
  let currentAvailability = false;

  // Debouncer for search input
  let searchTimeout;
  const debouncedSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      triggerSearch();
    }, 300);
  };

  const triggerSearch = () => {
    if (queryLabel) {
      queryLabel.textContent = currentQuery;
    }
    const catogriesArray = currentCategory === "All" ? [] : [currentCategory];
    renderCatalog(currentQuery, catogriesArray, currentAvailability);
  };

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentQuery = e.target.value.trim();
      debouncedSearch(); // Use debounced search instead of direct trigger
    });
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
    });
  }

  categoryItems.forEach((li) => {
    if (li.querySelector("input")) return;

    li.addEventListener("click", function () {
      categoryItems.forEach((item) => item.classList.remove("active"));
      this.classList.add("active");

      currentCategory = this.textContent.trim();
      triggerSearch(); // Immediate search for category changes
    });
  });

  if (checkRow) {
    const checkbox = checkRow.querySelector("input[type='checkbox']");

    checkbox.addEventListener("change", () => {
      currentAvailability = checkbox.checked;
      triggerSearch(); // Immediate search for availability filter changes
    });

    checkRow.addEventListener("click", (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        currentAvailability = checkbox.checked;
        triggerSearch(); // Immediate search for availability filter changes
      }
    });
  }

  triggerSearch();
}

function getAuthenticatedUser() {
  const userDataElement = document.getElementById("user-data");

  if (!userDataElement) {
    console.error("User data script tag missing.");
    return null;
  }

  const data = JSON.parse(userDataElement.textContent);

  // LOGS TO VERIFY
  // console.log("Checking attributes...");
  // console.log("Display Name (Should be name):", data.displayName);
  // console.log("Email (Should be email):", data.userEmail);

  return data;
}

async function renderUserDashboard() {
  const User = getAuthenticatedUser();

  if (!User) return;

  //   const token = User.token;
  const borrowed = await API.getUserBorrowedBooks();

  console.log(borrowed[0]); // check the field names
  const history = await API.getUserHistory(); // fake

  const nameEl = document.getElementById("username");
  if (nameEl) nameEl.textContent = User.displayName || "Scholar";

  const emailEl = document.getElementById("email");
  if (emailEl) emailEl.textContent = User.userEmail || "Scholar@gmail.com";

  const now = new Date();
  const overdueBooks = borrowed.filter((b) => new Date(b.dueDate) < now);
  const activeCountEl = document.getElementById("active-loans-count");
  if (activeCountEl) activeCountEl.textContent = borrowed.length;
  const totalReadEl = document.getElementById("total-read-count");
  if (totalReadEl) totalReadEl.textContent = history.length;
  const overdueEl = document.getElementById("overdue-count");
  if (overdueEl) overdueEl.textContent = overdueBooks.length;

  const grid = document.getElementById("ud-books-grid");
  if (!grid) return;

  if (borrowed.length === 0) {
    grid.innerHTML = '<p class="ud-book-author" style="padding:1rem;">No active loans.</p>';
  }
  const recent = borrowed.slice(-3).reverse();
  grid.innerHTML = recent
    .map((book) => {
      const due = new Date(book.dueDate);
      const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      const isOverdue = daysLeft < 0;
      const isSoon = !isOverdue && daysLeft <= 3;

      let dueLabel, dueCls;
      if (isOverdue) {
        dueLabel = `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""}`;
        dueCls = "ud-due ud-due--overdue";
      } else if (isSoon) {
        dueLabel = `Due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
        dueCls = "ud-due ud-due--soon";
      } else {
        dueLabel = `Due in ${daysLeft} days`;
        dueCls = "ud-due";
      }
      let extend = book.extended ? "Extended" : "Extend";
      return `
      <div class="ud-book-card">
        <div class="ud-book-cover-wrap">
          <img src="${book.cover}" alt="${book.title}" class="ud-book-cover" />
        </div>
        <div class="ud-book-info">
          <span class="${dueCls}">${dueLabel}</span>
          <h3 class="ud-book-title">${book.title}</h3>
          <p class="ud-book-author">${book.author}</p>
          <span class="ud-badge ud-badge--loaned">Loaned</span>
          <div class="ud-book-actions">
            <button class="ud-btn-ghost btn-extend" data-loan-id="${book.loan_id}" ${book.extended ? "disabled" : ""}>${extend}</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  // console.log("history len", history.length);
  const historyTbody = document.getElementById("history-tbody");
  if (historyTbody) {
    if (history.length === 0) {
      historyTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem;">No borrowing history found.</td></tr>`;
    } else {
      // Show the 5 most recent history items
      const recentHistory = history.slice(0, 5);

      historyTbody.innerHTML = recentHistory
        .map((item) => {
          // Determine badge color based on status from Django
          let badgeCls = "ud-badge--returned"; // default green
          if (item.status === "overdue") badgeCls = "ud-badge--overdue";

          return `
          <tr>
            <td><strong>${item.title}</strong></td>
            <td>${item.author}</td>
            <td>${item.borrowedAt}</td>
            <td>${item.returnedAt || "—"}</td>
            <td><span class="ud-badge ${badgeCls}">${item.status}</span></td>
          </tr>
        `;
        })
        .join("");
    }
  }
}

document.addEventListener("click", async (e) => {
  // const User = JSON.parse(localStorage.getItem("user_info") || sessionStorage.getItem("user_info"));
  // if (!User) return;
  // const isbn = e.target.getAttribute("data-isbn");
  // const token = User.token;

  if (e.target.classList.contains("btn-extend")) {
    const btn = e.target;
    const loanId = btn.dataset.loanId;
    console.log("loan id:", loanId);

    try {
      await API.extendLoan(loanId);
      btn.disabled = true;
      Window.alert("the loan has been extended for 3 days");
      renderUserDashboard();
    } catch (error) {
      alert(error.message);
    }
  }

  if (e.target.classList.contains("btn-return")) {
    if (confirm("Are you sure you want to return this book?")) {
      await API.returnBook(isbn, token);
      renderUserDashboard();
      renderUserHistory();
    }
  }
});

async function renderUserHistory() {
  const tbody = document.getElementById("history-tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>`;

  try {
    const User = JSON.parse(localStorage.getItem("user_info") || sessionStorage.getItem("user_info"));
    if (!User) return;

    const history = await API.getUserHistory(User.token);
    if (!history || history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No borrowing history yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = history
      .map((entry, i) => {
        const borrowed = new Date(entry.borrowedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const returned = entry.returnDate || "—";
        const isOverdue = entry.status === "overdue";
        const badgeCls = entry.status === "returned" ? "ud-badge--returned" : "ud-badge--overdue";
        const badgeLabel = entry.status === "returned" ? "Returned" : "Overdue";
        const altRow = i % 2 !== 0 ? "ud-tr-alt" : "";

        return `
        <tr class="${altRow}">
          <td class="ud-td-title">${entry.title}</td>
          <td>${entry.author}</td>
          <td>${borrowed}</td>
          <td>${returned}</td>
          <td><span class="ud-badge ${badgeCls}">${badgeLabel}</span></td>
        </tr>
      `;
      })
      .join("");
  } catch (error) {
    console.log(error);
    tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Failed to load history.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const logo = document.getElementById("logo-link");
  if (logo) {
    logo.addEventListener("click", () => {
      window.location.href = "/user/dashboard/";
    });
  }

  if (document.getElementById("cards-container")) {
    initSearchPage();
  }

  if (document.getElementById("book-info")) {
    const borrowBtn = document.getElementById("borrow-btn");
    const urlParams = new URLSearchParams(window.location.search);
    const isbn = urlParams.get("isbn");

    if (borrowBtn) {
      borrowBtn.addEventListener("click", handleBorrowAction);
    }
  }

  if (document.getElementById("book-list")) {
    renderUserLoans();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const borrowBtn = document.getElementById("borrow-btn");
  // const storedInfo = localStorage.getItem("user_info") || sessionStorage.getItem("user_info");
  // const info = JSON.parse(storedInfo);
  // const token = info.token;
  const urlParams = new URLSearchParams(window.location.search);
  const isbn = urlParams.get("isbn");

  if (document.getElementById("user-dashboard-page")) {
    renderUserDashboard();
    renderUserHistory();
  }
});
