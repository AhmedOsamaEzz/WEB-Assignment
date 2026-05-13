import API from "../API/api.js";

const scriptUrl2 = import.meta.url;
const APP_ROOT2 = scriptUrl2.split("assets/Javascript/UI/adminUI.js")[0];

let currentPage = 1;
const BOOKS_PER_PAGE = 10;

/**
 * Prompts the user for confirmation and deletes a book from the inventory.
 * Re-renders the admin inventory table upon success.
 * * @async
 * @param {string} ISBN - The unique ISBN of the book to delete.
 * @returns {Promise<void>}
 */
const deleteBook = async (isbn) => {
  if (!confirm("Are you sure you want to delete this book?")) return;
  try {
    const result = await API.deleteBook(isbn);
    document.querySelector(`.delete-btn[data-isbn="${isbn}"]`).closest("tr").remove();
    window.location.reload();
  } catch (err) {
    alert(err.message || "Failed to delete book.");
  }
};

/**
 * Wraps the older FileReader callback API inside a modern Promise.
 * This allows the application to 'await' the image conversion before saving to the database.
 * * @param {File} file - The raw image file object from the HTML input.
 * @returns {Promise<string>} A promise that resolves to the Base64 string of the image.
 */
const readImageAsync = (file) => {
  // console.log("image read attempt");
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
};

/**
 * Validates the raw text data extracted from the HTML form.
 * Ensures mandatory fields are filled out, some constraints are met,
 * and numbers are formatted logically.
 * * @param {Object} book - The book object containing raw string values from the DOM.
 * @returns {boolean} True if the form data passes all checks, false if anything fails.
 */
const isValidBook = (book) => {
  if (!book.title) {
    return false;
  }
  if (!book.author) {
    return false;
  }

  // ISBN Checks
  if (!book.isbn) {
    return false;
  }
  if (!/^[\d-]+[Xx]?$/.test(String(book.isbn))) {
    return false;
  }
  console.log("good isbn");
  if (book.isbn.length > 13) {
    return false;
  }
  // Year Checks
  if (!book.year) {
    return false;
  }
  if (!/^\d+$/.test(book.year)) {
    return false;
  }
  if (book.year.length > 4) {
    return false;
  }

  const year = parseInt(book.year);
  const currentYear = new Date().getFullYear();
  if (year < 1000 || year > currentYear) {
    return false;
  }

  // Publisher, Copies, Description, Category Checks
  if (!book.publisher) {
    return false;
  }

  if (!book.copies) {
    return false;
  }
  if (!/^\d+$/.test(book.copies)) {
    return false;
  }
  const copies = parseInt(book.copies);
  if (copies < 1) {
    return false;
  }

  if (!book.description) {
    return false;
  }
  if (!book.category) {
    return false;
  }

  return true;
};

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
 * Function displays error string in error-message-container div in bookEdit and bookAdd
 * @param {string} error
 */
const bookSubmitFormError = (error) => {
  const errorContainer = document.getElementById("error-message-container");
  errorContainer.innerText = "";
  errorContainer.innerText = error;
};

/**
 * Acts as the main controller for adding and editing books.
 * Prevents default form submission, validates inputs, parses strings to integers,
 * handles image reading, communicates with the API, and redirects upon success.
 * * @async
 * @param {Event} event - The form submission or click event.
 * @param {string} mode - A string dictating the flow, either "add" or "edit".
 * @returns {Promise<void>}
 */
const handleBookFormSubmit = async (event, mode) => {
  event.preventDefault();
  const imageInput = document.getElementById("fileInput");

  if (mode == "add" && (!imageInput.files || imageInput.files.length === 0)) {
    bookSubmitFormError("No Image were provided");
    return;
  }

  const oldIsbn = new URLSearchParams(window.location.search).get("isbn");

  const title = document.querySelector("#title").value.trim();
  const author = document.querySelector("#author").value.trim();
  const isbn = document.querySelector("#isbn").value.trim();
  const year = document.querySelector("#publicationYear").value.trim();
  const publisher = document.querySelector("#publisher").value.trim();
  const copies = document.querySelector("#totalCopies").value.trim();
  const description = document.querySelector("#description").value.trim();
  const category = document.querySelector("#category")?.value || "Uncategorized";

  const bookData = {
    title,
    author,
    isbn,
    year,
    publisher,
    copies,
    description,
    category,
  };

  if (!isValidBook(bookData)) return;
  bookData.year = parseInt(bookData.year);
  bookData.copies = parseInt(bookData.copies);
  bookData.availableCopies = bookData.copies;

  if (imageInput.files && imageInput.files.length > 0) {
    const img = imageInput.files[0]; // don't convert to base 64
    bookData.cover = img;
  } else {
    bookData.cover = document.querySelector("#image").src;
  }
  if (mode === "add") {
    try {
      await API.addBook(bookData);
      window.location.href = "/libadmin/books/list/";
    } catch (error) {
      console.log(error);
      bookSubmitFormError("Failed to add book");
    }
  } else if (mode === "edit") {
    try {
      await API.updateBook(oldIsbn, bookData);
      window.location.href = "/libadmin/books/list/";
    } catch (error) {
      console.log(error);
      bookSubmitFormError("Failed to Edit book");
    }
  }
};

/**
 * Inspects the URL for an ISBN parameter. If found, fetches that book's data
 * from the database and inserts it into the HTML form inputs so the user can edit it.
 * * @async
 * @returns {void}
 */
const populateEditForm = async () => {
  console.log("edit");
  const isbn = new URLSearchParams(window.location.search).get("isbn");
  if (!isbn) return;

  try {
    const book = await API.getBookById(isbn);
    document.querySelector("#title").value = book.title;
    document.querySelector("#author").value = book.author;
    document.querySelector("#isbn").value = book.isbn;
    document.querySelector("#publicationYear").value = book.year;
    document.querySelector("#publisher").value = book.publisher;
    document.querySelector("#totalCopies").value = book.copies;
    document.querySelector("#description").value = book.description;
    document.querySelector("#category").value = book.category;

    const imagePlaceHolder = document.querySelector("#image");
    imagePlaceHolder.src = book.cover;
  } catch (error) {
    console.log(error);
    bookSubmitFormError("Failed to populate form, redirecting");
    setTimeout(() => (window.location.href = "/libadmin/books/list/"), 2000); // fake delay for realism
  }
};

const renderAdminDashboard = async () => {
  if (!document.getElementById("admin-dashboard-page")) return;
  const s = await API.getAdminStats();

  document.getElementById("stat-total-books").textContent = s.totalBooks.toLocaleString();
  document.getElementById("stat-added-month").textContent = s.totalBooks.toLocaleString(); // change later
  document.getElementById("stat-overdue-returns").textContent = s.overdueLoans;
  document.getElementById("stat-active-loans").textContent = s.activeLoans.toLocaleString();
  document.getElementById("stat-total-members").textContent = s.totalMembers.toLocaleString();
  document.getElementById("stat-available-books").textContent = s.totalAvailable.toLocaleString();
  document.getElementById("loan-total-label").textContent = s.totalBooks.toLocaleString();
  document.getElementById("loan-total-number").textContent = s.totalBooks.toLocaleString();

  const setPct = (labelId, barId, pct) => {
    document.getElementById(labelId).textContent = pct + "%";
    document.getElementById(barId).style.width = pct + "%";
  };

  setPct("loan-pct-available", "loan-bar-available", s.perAvailable);
  setPct("loan-pct-borrowed", "loan-bar-borrowed", s.perBorrowed);
  setPct("loan-pct-overdue", "loan-bar-overdue", s.perOverdue);

  const logs = await API.getLogs();
  const recent = logs.slice(0, 3);
  const activityList = document.querySelector(".activity-list");
  if (activityList && recent.length > 0) {
    activityList.innerHTML = recent
      .map((entry) => {
        const date = new Date(entry.when).toLocaleDateString();
        const pillLabel = entry.what.replace(/_/g, " ");
        const pillClass = "log-pill log-pill--" + entry.what.replace(/_/g, "-");
        return `
        <div class="activity-item">
          <div class="activity-info">
            <p class="activity-book-title">${entry.info}</p>
          </div>
          <div class="activity-meta">
            <p class="activity-time">${date}</p>
            <span class="${pillClass}">${pillLabel}</span>
          </div>
        </div>`;
      })
      .join("");
  }
};

function switchDashboardTab(name) {
  document.querySelectorAll(".dashboard-tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".dashboard-panel").forEach((p) => p.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  document.getElementById("panel-" + name).classList.add("active");
}

async function renderUsersTab() {
  const pendingList = document.getElementById("pending-list");
  const approvedList = document.getElementById("approved-list");
  const pendingCount = document.getElementById("pending-count");
  const approvedCount = document.getElementById("approved-count");
  if (!pendingList || !approvedList) return;

  const [pending, approved] = await Promise.all([API.getPendingUsers(), API.getUsers()]);

  pendingCount.textContent = pending.length + " waiting";
  approvedCount.textContent = approved.length + " active";

  if (pending.length === 0) {
    pendingList.innerHTML = `<p class="users-empty">No pending registrations.</p>`;
  } else {
    pendingList.innerHTML = pending
      .map((user) => {
        const initials = user.username
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return `
        <div class="user-row">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${user.username}</div>
            <div class="user-email">${user.email}</div>
          </div>
          <div class="user-actions">
            <button class="btn-approve" data-email="${user.email}">Approve</button>
            <button class="btn-deny" data-email="${user.email}">Deny</button>
          </div>
        </div>`;
      })
      .join("");
  }

  if (approved.length === 0) {
    approvedList.innerHTML = `<p class="users-empty">No approved members yet.</p>`;
  } else {
    approvedList.innerHTML = approved
      .map((user) => {
        const initials = user.username
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return `
        <div class="user-row">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${user.username}</div>
            <div class="user-email">${user.email}</div>
          </div>
          <div class="user-actions">
            <button class="btn-ban" data-email="${user.email}">Ban</button>
          </div>
        </div>`;
      })
      .join("");
  }

  approvedList.onclick = async (e) => {
    const banBtn = e.target.closest(".btn-ban");
    if (!banBtn) return;
    const email = banBtn.dataset.email;
    try {
      await API.banUser(email);
      await renderUsersTab();
      await renderLogsTab();
    } catch (err) {
      alert(err.message || "Ban failed.");
    }
  };

  pendingList.onclick = async (e) => {
    const approveBtn = e.target.closest(".btn-approve");
    const denyBtn    = e.target.closest(".btn-deny");
    if (!approveBtn && !denyBtn) return;

    const email = (approveBtn || denyBtn).dataset.email;
    try {
      if (approveBtn) {
        await API.approveUser(email);
      } else {
        await API.denyUser(email);
      }
      await renderUsersTab();
      await renderLogsTab();
    } catch (err) {
      alert(err.message || "Action failed.");
    }
  };
}

// LOGS TAB
async function renderLogsTab() {
  const logList = document.getElementById("log-list");
  if (!logList) return;

  const logs = await API.getLogs();

  if (logs.length === 0) {
    logList.innerHTML = "";
    document.getElementById("logs-empty-msg").style.display = "block";
    document.getElementById("log-entry-count").textContent = "0 entries";
    return;
  }

  logList.innerHTML = logs
    .map((entry) => {
      const pillClass = "log-pill log-pill--" + entry.what.replace(/_/g, "-");
      const label = entry.what.replace(/_/g, " ");
      const date = new Date(entry.when).toLocaleDateString();
      // data-who holds all names in the entry so search matches actor and target
      const searchable = entry.info.toLowerCase();
      return `
      <div class="log-row" data-type="${entry.what}" data-who="${searchable}">
        <span class="${pillClass}">${label}</span>
        <span class="log-info">${entry.info}</span>
        <span class="log-time">${date}</span>
      </div>`;
    })
    .join("");

  document.getElementById("log-entry-count").textContent = logs.length + " entries";
  document.getElementById("logs-empty-msg").style.display = "none";
}

// LOG FILTERING
let activeLogType = "all";

function setLogFilter(type, el) {
  activeLogType = type;
  document.querySelectorAll(".log-filter-btn").forEach((b) => b.classList.remove("active"));
  el.classList.add("active");
  applyLogFilters();
}

function applyLogFilters() {
  const query = document.getElementById("log-search-input").value.trim().toLowerCase();
  const rows = document.querySelectorAll("#log-list .log-row");
  let visible = 0;

  rows.forEach((row) => {
    const typeMatch = activeLogType === "all" || row.dataset.type === activeLogType;
    const whoMatch = !query || row.dataset.who.includes(query);
    const show = typeMatch && whoMatch;
    row.style.display = show ? "" : "none";
    if (show) visible++;
  });

  document.getElementById("log-entry-count").textContent = visible + (visible === 1 ? " entry" : " entries");
  document.getElementById("logs-empty-msg").style.display = visible === 0 ? "block" : "none";
}

window.switchDashboardTab = switchDashboardTab;
window.setLogFilter = setLogFilter;
window.applyLogFilters = applyLogFilters;

// listeners
document.addEventListener("DOMContentLoaded", () => {
  const logo = document.getElementById("logo-link");
  console.log(APP_ROOT2);
  if (logo) {
    logo.addEventListener("click", () => {
      window.location.href = "/libadmin/dashboard/";
    });
  }

  //booklist stuff
  console.log("here");
  if (document.getElementById("bookList-page")) {
    const tbody = document.querySelector("tbody");
    if (tbody) {
      tbody.addEventListener("click", (event) => {
        const editBtn = event.target.closest(".edit-btn");
        const deleteBtn = event.target.closest(".delete-btn");

        if (editBtn) {
          const isbn = editBtn.getAttribute("data-isbn");
          window.location.href = `/libadmin/books/edit/?isbn=${isbn}`;
        }

        if (deleteBtn) {
          const isbn = deleteBtn.getAttribute("data-isbn");
          deleteBook(isbn);
        }
      });
    }
  }

  // addbook stuff
  const addBtn = document.getElementById("addbtn");
  if (addBtn) addBtn.addEventListener("click", (e) => handleBookFormSubmit(e, "add"));

  // editbook stuff
  const editBtn = document.getElementById("editbtn");
  if (editBtn) {
    populateEditForm();
    editBtn.addEventListener("click", (e) => handleBookFormSubmit(e, "edit"));
  }

  // image preview stuff
  const imagePlaceHolder = document.querySelector("#image");
  const imageInput = document.getElementById("fileInput");

  if (imagePlaceHolder && imageInput) {
    imagePlaceHolder.addEventListener("click", () => imageInput.click());

    imageInput.addEventListener("change", () => {
      const file = imageInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => (imagePlaceHolder.src = e.target.result);
        reader.readAsDataURL(file);
      }
    });
  }

  if (document.getElementById("book-info")) {
    renderBookDetails();

    const editbtn = document.getElementById("edit-btn");
    if (editbtn) {
      editbtn.addEventListener("click", (e) => {
        const urlParams = new URLSearchParams(window.location.search);
        const isbn = urlParams.get("isbn");
        window.location.href = `/libadmin/books/edit/?isbn=${isbn}`;
      });
    }
  }

  if (document.getElementById("admin-dashboard-page")) {
    renderAdminDashboard();
    renderUsersTab();
    renderLogsTab();
  }

  if (document.getElementById("loanList-page")) {
    LoanList();
  }
});

function LoanList() {
  const modal = document.getElementById("action-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const confirmBtn = document.getElementById("modal-confirm-btn");
  const cancelBtn = document.getElementById("modal-cancel-btn");
  const form = document.getElementById("loan-action-form");
  const formLoanId = document.getElementById("form-loan-id");
  const formAction = document.getElementById("form-action");

  if (!modal) return;
  document.querySelectorAll(".loan-btn, .return-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      const book = btn.dataset.book;
      const user = btn.dataset.user;
      formLoanId.value = btn.dataset.loanId;
      formAction.value = action;
      if (action === "loan") {
        modalTitle.textContent = "Confirm Loan";
        modalBody.textContent = `Hand "${book}" to ${user}? This will mark the book as borrowed.`;
        confirmBtn.textContent = "Loan Book";
        confirmBtn.className = "modal-confirm modal-confirm-loan";
      } else {
        modalTitle.textContent = "Confirm Return";
        modalBody.textContent = `Mark "${book}" as returned from ${user}?`;
        confirmBtn.textContent = "Confirm Return";
        confirmBtn.className = "modal-confirm modal-confirm-return";
      }
      modal.classList.add("open");
    });
  });
  confirmBtn.addEventListener("click", async () => {
    const formData = new FormData(form);
    try {
      const response = await fetch(form.getAttribute("action"), {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      modal.classList.remove("open");
      if (data.success) {
        window.location.href = window.location.href;
      } else {
        const errorContainer = document.getElementById("error-message-container");
        errorContainer.textContent = data.message;
      }
    } catch (err) {
      console.error("Loan action failed:", err);
    }
  });
  cancelBtn.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
}
