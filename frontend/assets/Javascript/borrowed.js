const scriptUrl = document.currentScript.src;
const APP_ROOT = scriptUrl.split("assets/Javascript/borrowed.js")[0];

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

function renderBorrowedBooks() {
  const borrowedKey = getBorrowedKey();
  const borrowedBooks = JSON.parse(localStorage.getItem(borrowedKey)) || [];
  const bookList = document.getElementById("book-list");

  bookList.innerHTML = "";

  if (borrowedBooks.length === 0) {
    bookList.innerHTML = `<p style="text-align:center;">You haven't borrowed any books yet.</p>`;
    return;
  }

  borrowedBooks.forEach((book) => {
    const li = document.createElement("li");
    li.className = "book-item";

    li.innerHTML = `
      <img src="${book.cover}" class="book-img" alt="${book.title}" />
      <span>${book.title}</span>
      <a href="bookDetails.html?id=${book.isbn}" class="details-link">View Details</a>
    `;

    bookList.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", renderBorrowedBooks);
