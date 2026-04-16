let currentPage = 1;
const BOOKS_PER_PAGE = 10;

// Rendering the books table
function renderBookList() {
  const booklist = JSON.parse(localStorage.getItem("booklist")) || [];
  const tbody = document.querySelector("tbody");
  const pageNumbersContainer = document.querySelector(".page-numbers");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  tbody.innerHTML = "";

  if (booklist.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center;">No books in the archive yet.</td>
      </tr>
    `;
    pageNumbersContainer.innerHTML = "";
    return;
  }

  // Calculate total pages
  const totalPages = Math.ceil(booklist.length / BOOKS_PER_PAGE);

  // Clamp currentPage in case books were deleted
  if (currentPage > totalPages) currentPage = totalPages;

  // Slice the booklist to only get the current page's books
  const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
  const currentBooks = booklist.slice(startIndex, startIndex + BOOKS_PER_PAGE);

  // Render rows
  currentBooks.forEach((book) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <div class="book-title-column">
          <img src="${book.cover}" class="mini-book-image" />
          <div>
            <label class="book-title-text">${book.title}</label>
            <br />
            <label class="book-isbn-label">ISBN-${book.isbn}</label>
          </div>
        </div>
      </td>
      <td>${book.author}</td>
      <td><label class="book-category-column">${book.category}</label></td>
      <td class="books-count">${book.copies}</td>
      <td class="books-count">${book.copies}</td>
      <td class="books-count">0</td>
      <td class="book-action-column">
        <div class="book-action-cell">
          <button onclick="editBook('${book.isbn}')">
            <i class="fa-solid fa-pen"></i>
		  </button>
          <button onclick="deleteBook('${book.isbn}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Pagination: calculate a window of 5 pages around currentPage
  let startPage = Math.max(1, currentPage - 2);
  let endPage = startPage + 4;

  // Clamp endPage and shift startPage back if needed
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - 4);
  }

  // Render page number buttons
  pageNumbersContainer.innerHTML = "";
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    pageBtn.className =
      i === currentPage ? "current-button" : "not-current-button";
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      renderBookList();
    });

    pageNumbersContainer.appendChild(pageBtn);
  }

  // Prev button
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderBookList();
    }
  };

  // Next button
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderBookList();
    }
  };
}

// Delets a book from the localStorage
async function deleteBook(isbn) {
  // Find the book by ISBN
  // try {
  const response = await FakeAPI.getBook(isbn);
  const book = response.data.title;
  // } catch (error) {
  // alert(error.message);
  // }

  // Confirmation message
  const confirmed = confirm(
    `Are you sure you want to delete "${book}" from the archive?`,
  );

  if (!confirmed) return;

  // Remove the book and save back to localStorage
  try {
    const response2 = await FakeAPI.deleteBook(isbn);
  } catch (error) {
    alert(error.message);
  }

  // Re-render the table after deleting the book
  renderBookList();
}

// Edit existing book
function editBook(isbn) {
  window.location.href = `bookEdit.html?isbn=${isbn}`;
}

// Run when the page loads
document.addEventListener("DOMContentLoaded", renderBookList);
