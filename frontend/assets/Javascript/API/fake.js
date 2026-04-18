// storage helpers
const BOOKLIST_KEY = "booklist";

const getBookList = () => JSON.parse(localStorage.getItem(BOOKLIST_KEY)) || [];
const saveBooklist = (list) =>
  localStorage.setItem(BOOKLIST_KEY, JSON.stringify(list));

const getBorrowedKey = (userToken) => `borrowedBooks_${userToken}`;
const getBorrowedList = (userToken) =>
  JSON.parse(localStorage.getItem(getBorrowedKey(userToken))) || [];
const saveBorrowedList = (userToken, list) =>
  localStorage.setItem(getBorrowedKey(userToken), JSON.stringify(list));

const getAvailableCopies = (book) =>
  book.availableCopies !== undefined
    ? book.availableCopies
    : parseInt(book.copies);

const FakeAPI = {
  async registerUser(Username, UserEmail, UserPassword, UserRole) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const users = JSON.parse(localStorage.getItem("users")) || [];

          const EmailTaken = users.some((u) => u.email === UserEmail);
          if (EmailTaken) {
            return reject({ message: "Email already registered" });
          }

          const NewUser = {
            email: UserEmail,
            username: Username,
            password: UserPassword,
            role: UserRole,
          };
          users.push(NewUser);
          localStorage.setItem("users", JSON.stringify(users));

          resolve({ message: "User registered successfully" });
        } catch (error) {
          reject({ message: "Database error: Could not process user list." });
        }
      }, 800);
    });
  },
  async loginUser(UserEmail, UserPassword, StayloggedIn) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const users = JSON.parse(localStorage.getItem("users")) || [];
          const foundUser = users.find(
            (u) => u.email === UserEmail && u.password === UserPassword,
          );
          if (!foundUser)
            return reject({ message: "Invalid email or password" });
          const user_info = {
            // fake hashing base 64
            token: btoa(foundUser.email + ":"),
            role: foundUser.role,
            name: foundUser.username,
          };
          if (StayloggedIn == true) {
            localStorage.setItem("user_info", JSON.stringify(user_info));
          } else {
            sessionStorage.setItem("user_info", JSON.stringify(user_info));
          }
          resolve({ message: "User logged in successfully" });
        } catch (error) {
          reject({ message: "Database error: Could not process user list." });
        }
      }, 800);
    });
  },
  async getBooks(query = "", categories = [], availableOnly = false) {
    const books = getBookList();
    const q = query.trim().toLowerCase();
    const cats = categories.map((c) => c.toLowerCase());
    const filterByCategory = cats.length > 0 && !cats.includes("all");

    return books.filter((book) => {
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q);

      const matchesCategory =
        !filterByCategory || cats.includes(book.category.toLowerCase());

      const matchesAvail = !availableOnly || getAvailableCopies(book) > 0;

      return matchesQuery && matchesCategory && matchesAvail;
    });
  },

  async getBookById(ISBN) {
    const book = getBookList().find((b) => b.isbn === ISBN);
    if (!book) throw new Error("book not found");
    return book;
  },

  async borrowBook(ISBN, userToken) {
    const booklist = getBookList();
    const index = booklist.findIndex((b) => b.isbn === ISBN);

    if (index === -1) throw new Error("book not found");

    const book = booklist[index];
    const availableCopies = getAvailableCopies(book);

    if (availableCopies <= 0) throw new Error("book out of stock");

    // Decrement available copies
    booklist[index].availableCopies = availableCopies - 1;
    saveBooklist(booklist);

    // Link borrowed book to the user
    const borrowedBooks = getBorrowedList(userToken);
    borrowedBooks.push({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      cover: book.cover,
      borrowedAt: new Date().toISOString(),
    });
    saveBorrowedList(userToken, borrowedBooks);
    return book;
  },

  async getUserBorrowedBooks(userToken) {
    return getBorrowedList(userToken);
  },

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
        let booked = booklist[index].copies - booklist[index].availableCopies;
        booklist[index] = newData;
        booklist[index].availableCopies = booklist[index].copies - booked;
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
        reject(new Error("error in delete"));
      }
    });
  },
};

// ---------- export ----------

export default FakeAPI;
