function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

async function getUserBorrowedBooks() {
  const response = await fetch('/api/loans/borrowed/', {
    credentials: "same-origin",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please log in to view your borrowed books.');
    }
    throw new Error('Failed to fetch borrowed books');
  }

  return response.json();
}

const RealAPI = {
  getUserBorrowedBooks,

  async addBook(bookData) {
    const formData = new FormData();
    formData.append("title", bookData.title);
    formData.append("author", bookData.author);
    formData.append("isbn", bookData.isbn);
    formData.append("year", bookData.year);
    formData.append("publisher", bookData.publisher);
    formData.append("copies", bookData.copies);
    formData.append("description", bookData.description);
    formData.append("category", bookData.category);
    formData.append("cover_image", bookData.cover);

    const response = await fetch("/api/books/add/", {
      method: "POST",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      body: formData,
      credentials: "same-origin",
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to add book");
    return data;
  },

  async deleteBook(isbn) {
    const response = await fetch(`/api/books/delete/${isbn}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      credentials: "same-origin",
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to remove book");
    return data;
  },

  async updateBook(oldIsbn, bookData) {
    const formData = new FormData();
    formData.append("title", bookData.title);
    formData.append("author", bookData.author);
    formData.append("isbn", bookData.isbn);
    formData.append("year", bookData.year);
    formData.append("publisher", bookData.publisher);
    formData.append("copies", bookData.copies);
    formData.append("description", bookData.description);
    formData.append("category", bookData.category);
    if (bookData.cover instanceof File) {
      formData.append("cover_image", bookData.cover);
    }

    const response = await fetch(`/api/books/edit/${oldIsbn}/`, {
      method: "POST",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      body: formData,
      credentials: "same-origin",
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to update book");
    return data;
  },
};

export default RealAPI;
