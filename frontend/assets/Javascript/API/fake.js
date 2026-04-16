const FakeAPI = {
  addBook(bookData) {
    return new Promise((resolve, reject) => {
      try {
        const booklist = JSON.parse(localStorage.getItem("booklist")) || [];
        const isDuplicate = booklist.some(
          (book) => book.isbn === bookData.isbn,
        );
        if (isDuplicate) {
          reject(new Error("A book with this ISBN already exists"));
          return;
        }
        booklist.push(bookData);
        localStorage.setItem("booklist", JSON.stringify(booklist));
        resolve({ success: true, message: "Book added successfully!" });
      } catch (error) {
        reject(new Error("An error occurred in add book"));
      }
    });
  },

  getBook(oldisbn) {
    return new Promise((resolve, reject) => {
      try {
        const booklist = JSON.parse(localStorage.getItem("booklist"));
        const index = booklist.findIndex((book) => book.isbn === oldisbn);
        if (index !== -1) {
          resolve({ success: true, data: booklist[index] });
        } else {
          reject(new Error("book not found"));
          return;
        }
      } catch (error) {
        reject(new Error("error in finding the book"));
      }
    });
  },
  editBook(oldisbn, newData) {
    return new Promise((resolve, reject) => {
      try {
        const booklist = JSON.parse(localStorage.getItem("booklist"));
        const isDuplicate = booklist.some((book) => book.isbn === newData.isbn);
        if (isDuplicate && newData.isbn !== oldisbn) {
          reject(new Error("A book with this ISBN already exists"));
          return;
        }
        const index = booklist.findIndex((book) => book.isbn === oldisbn);
        if (index === -1) {
          reject(new Error("book not found"));
          return;
        }
        booklist[index] = newData;
        localStorage.setItem("booklist", JSON.stringify(booklist));
        resolve({ success: true, message: "Book updated successfully!" });
      } catch (error) {
        reject(new Error("an error in edit"));
      }
    });
  },
  deleteBook(isbn) {
    return new Promise((resolve, reject) => {
      try {
        const booklist = JSON.parse(localStorage.getItem("booklist"));
        const updatedList = booklist.filter(
          (b) => String(b.isbn) !== String(isbn),
        );
        localStorage.setItem("booklist", JSON.stringify(updatedList));
        resolve({ success: true, message: "deleted" });
      } catch (error) {
        new (reject("error in delete"))();
      }
    });
  },
};
