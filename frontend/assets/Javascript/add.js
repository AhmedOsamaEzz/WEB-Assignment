// input handle
const imagePlaceHolder = document.querySelector("#image");
const imageInput = document.querySelector("#fileInput");
const addBtn = document.querySelector("#addbtn");
const bookTitle = document.querySelector("#title");
const bookAuthor = document.querySelector("#author");
const bookIsbn = document.querySelector("#isbn");
const bookYear = document.querySelector("#publicationYear");
const bookPublisher = document.querySelector("#publisher");
const bookCopies = document.querySelector("#totalCopies");
const bookDescription = document.querySelector("#description");
const bookCategory = document.querySelector("#category");

bookYear.addEventListener("input", () => {
  bookYear.value = bookYear.value.replace(/[^0-9]/g, "");
  if (bookYear.value.length > 4) {
    bookYear.value = bookYear.value.slice(0, 4);
  }
});

bookIsbn.addEventListener("input", () => {
  bookIsbn.value = bookIsbn.value.replace(/[^0-9]/g, "");
  if (bookIsbn.value.length > 13) {
    bookIsbn.value = bookIsbn.value.slice(0, 13);
  }
});

imagePlaceHolder.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", () => {
  const [file] = imageInput.files;

  if (file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      imagePlaceHolder.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }
});

addBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const cover = imageInput.files[0];
  if (!cover) {
    console.log("no image!");
    alert("please select an image");
    return;
  }

  if (bookTitle.value.trim() === "") {
    console.log("missing title");
    alert("please enter book title");
    return;
  }

  if (bookAuthor.value.trim() === "") {
    console.log("what book doesn't have an author??");
    alert("please enter author name");
    return;
  }

  if (bookIsbn.value.trim() === "") {
    console.log("missing Isbn");
    alert("please enter book Isbn");
    return;
  }

  const booklist = JSON.parse(localStorage.getItem("booklist")) || [];
  const isDuplicate = booklist.some(
    (book) => book.isbn === bookIsbn.value.trim(),
  );

  if (isDuplicate) {
    alert("a book with this ISBN already exists in the archive");
    return;
  }

  if (bookYear.value.trim() === "") {
    console.log("i mean this book was written someday right?");
    alert("please enter the book publication year");
    return;
  }

  const year = parseInt(bookYear.value);
  const currentYear = new Date().getFullYear();
  if (year < 1000 || year > currentYear) {
    alert(`please enter a valid year between 1000 and ${currentYear}`);
    return;
  }

  if (bookPublisher.value.trim() === "") {
    console.log("who published this?");
    alert("please enter book publisher");
    return;
  }

  if (bookCopies.value.trim() === "") {
    console.log("why add a book if it has no copies here?");
    alert("please add how many book available");
    return;
  }

  if (parseInt(bookCopies.value) < 1) {
    alert("copies must be at least 1");
    return;
  }

  if (bookDescription.value.trim() === "") {
    console.log("missing description");
    alert("please enter book description");
    return;
  }

  if (!bookCategory.value) {
    alert("please select a category");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (c) {
    const book = {
      title: bookTitle.value,
      author: bookAuthor.value,
      isbn: bookIsbn.value,
      year: bookYear.value,
      publisher: bookPublisher.value,
      copies: bookCopies.value,
      description: bookDescription.value,
      category: bookCategory.value,
      cover: c.target.result,
    };
    try {
      const response = await FakeAPI.addBook(book);
      window.location.href = "bookList.html";
    } catch (error) {
      alert(error.message);
    }
  };
  reader.readAsDataURL(cover);
});
