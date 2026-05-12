function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

const RealAPI = {
  async getBooks(query = "", categories = [], availableOnly = false) {
    try {
      // Format categories
      let categoriesParam = "";
      if (categories && categories.length > 0) {
        categoriesParam = categories.join(",");
      }

      // Build query URL string
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (categoriesParam) params.append("categories", categoriesParam);
      if (availableOnly) params.append("available_only", "true");

      const response = await fetch(`/api/books/search/?${params.toString()}`, {
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to search books");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Search failed");
      }

      return data.results || [];
    } catch (error) {
      console.error("Error searching books:", error);
      throw error;
    }
  },

  async getUserBorrowedBooks() {
    const response = await fetch("/api/loans/borrowed/", {
      credentials: "same-origin",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Please log in to view your borrowed books.");
      }

      throw new Error("Failed to fetch borrowed books");
    }

    return response.json();
  },

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
    formData.append("cover_image", bookData.cover); // File object

    const response = await fetch("/api/books/add/", {
      method: "POST",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
      },
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
};

export default RealAPI;
