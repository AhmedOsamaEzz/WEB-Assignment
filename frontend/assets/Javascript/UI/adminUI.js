import API from '../api/api.js';

let currentPage = 1;
const BOOKS_PER_PAGE = 10;

/**
 * Prompts the user for confirmation and deletes a book from the inventory.
 * Re-renders the admin inventory table upon success.
 * * @async
 * @param {string} ISBN - The unique ISBN of the book to delete.
 * @returns {Promise<void>}
 */
const deleteBook = async (ISBN) => {
    if(confirm('Are you Sure you want to delete this book?')) {
        try {
            console.log("try delete" + ISBN);
            await API.deleteBook(ISBN);
            renderAdminInventory();
        } catch (error) {
            // display error
        }
    }
}

/**
 * Wraps the older FileReader callback API inside a modern Promise.
 * This allows the application to 'await' the image conversion before saving to the database.
 * * @param {File} file - The raw image file object from the HTML input.
 * @returns {Promise<string>} A promise that resolves to the Base64 string of the image.
 */
const readImageAsync = (file) => {
    console.log("image read attempt");
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
};

/**
 * Fetches the list of books from the API and renders them into the admin inventory table.
 * Handles DOM manipulation, loading states, rendering rows, and pagination logic.
 * * @async
 * @returns {Promise<void>}
 */
const renderAdminInventory = async () => {
    const tbody = document.querySelector("tbody");
    const pageNumbersContainer = document.querySelector(".page-numbers");
    const prevBtn = document.querySelector(".prev-btn");
    const nextBtn = document.querySelector(".next-btn");
    console.log("render");
    try {

        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center;">loading...</td>
          </tr>
        `;

        const bookList = await API.getBooks();

        if (bookList.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">No books in the archive yet.</td>
            </tr>
            `;
            pageNumbersContainer.innerHTML = "";
            return;
        }
        console.log(bookList.length);
        // Calculate total pages
        const totalPages = Math.ceil(bookList.length / BOOKS_PER_PAGE);

        // Clamp currentPage in case books were deleted
        if (currentPage > totalPages) currentPage = totalPages;

        // Slice the booklist to only get the current page's books
        const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
        const currentBooks = bookList.slice(startIndex, startIndex + BOOKS_PER_PAGE);

        // Render rows
        currentBooks.forEach((book) => {
            const row = document.createElement("tr");

            row.innerHTML = `
            <td>
                <div class="book-title-column">
                <img src="${book.cover}" class="mini-book-image" alt = "Book Cover"/>
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
                <button class = "edit-btn" data-isbn = "${book.isbn}">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class = "delete-btn" data-isbn = "${book.isbn}">
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
                renderAdminInventory();
            });

            pageNumbersContainer.appendChild(pageBtn);
        }

        // Prev button
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
            currentPage--;
            renderAdminInventory();
            }
        };

        // Next button
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
            currentPage++;
            renderAdminInventory();
            }
        };
    }catch(error) {
        // display failed to Display books
    }
}

/**
 * Validates the raw text data extracted from the HTML form.
 * Ensures mandatory fields are filled out, some constraints are met, 
 * and numbers are formatted logically.
 * * @param {Object} book - The book object containing raw string values from the DOM.
 * @returns {boolean} True if the form data passes all checks, false if anything fails.
 */
const isValidBook = (book) => {
  if (!book.title) { return false;}
  if (!book.author) {return false;}
  
  // ISBN Checks
  if (!book.isbn) {return false;}
  if (!/^[\d-]+[Xx]?$/.test(String(book.isbn))) {return false;}
  console.log("good isbn");
  if (book.isbn.length > 13) {return false;}
  // Year Checks
  if (!book.year) {return false;}
  if (!/^\d+$/.test(book.year)) {return false;}
  if (book.year.length > 4) {return false;}
  
  const year = parseInt(book.year);
  const currentYear = new Date().getFullYear();
  if (year < 1000 || year > currentYear) {return false;}

  // Publisher, Copies, Description, Category Checks
  if (!book.publisher) {return false;}
  
  if (!book.copies) {return false;}
  if (!/^\d+$/.test(book.copies)) {return false;}
  const copies = parseInt(book.copies);
  if (copies < 1) {return false;}

  if (!book.description) {return false;}
  if (!book.category) {return false;}

  return true;
}

/**
 * Acts as the main controller for adding and editing books.
 * Prevents default form submission, validates inputs, parses strings to integers, 
 * handles image reading, communicates with the API, and redirects upon success.
 * * @async
 * @param {Event} event - The form submission or click event.
 * @param {string} mode - A string dictating the flow, either "add" or "edit".
 * @returns {Promise<void>}
 */
const handleBookFormSubmit = async(event, mode) => {
    event.preventDefault();
    const imageInput = document.getElementById("fileInput");
    
    if(mode == "add" && (!imageInput.files || imageInput.files.length === 0)) {
        // display error no img
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
    
    // if(!title || !author || !isbn || !year || !publisher || !description) return;
    
    const bookData = { title, author, isbn, year, publisher, copies, description, category };
    
    if(!isValidBook(bookData)) return;
    console.log("lizard");
    bookData.year = parseInt(bookData.year);
    bookData.copies = parseInt(bookData.copies);

    if(imageInput.files && imageInput.files.length > 0) {
        const img = await readImageAsync(imageInput.files[0]);
        bookData.cover = img;
    }else {
        bookData.cover = document.querySelector("#image").src;
    }
    if(mode === "add") {
        
        try {
            await API.addBook(bookData);
            window.location.href = "bookList.html";
        } catch(error) {
            // failed to add book
        }
    } else if(mode === "edit") {
        try {
            await API.updateBook(oldIsbn, bookData);
            window.location.href = "bookList.html";
        } catch(error) {
            // failed to edit book
        }
    }
}

/**
 * Inspects the URL for an ISBN parameter. If found, fetches that book's data 
 * from the database and inserts it into the HTML form inputs so the user can edit it.
 * * @async
 * @returns {void}
 */
const populateEditForm = async () => {
    console.log("edit");
    const isbn = new URLSearchParams(window.location.search).get("isbn");
    if(!isbn) return;

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
    }catch (error) {
        // display error
        setTimeout(() => window.location.href = "bookList.html", 2000); // fake delay for realism
    }
}


// listeners 
document.addEventListener("DOMContentLoaded", () => {

  //booklist stuff
  console.log("here");
  if (document.getElementById("bookList-page")) {
    renderAdminInventory();
    const tbody = document.querySelector("tbody");
    if(tbody) {
        tbody.addEventListener("click", (event) => {
            const editBtn = event.target.closest(".edit-btn"); 
            const deleteBtn = event.target.closest(".delete-btn");

            if(editBtn) {
                const isbn = editBtn.getAttribute("data-isbn");
                window.location.href = `bookEdit.html?isbn=${isbn}`;
            }

            if(deleteBtn) {
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
        reader.onload = (e) => imagePlaceHolder.src = e.target.result;
        reader.readAsDataURL(file);
      }
    });
  }

});