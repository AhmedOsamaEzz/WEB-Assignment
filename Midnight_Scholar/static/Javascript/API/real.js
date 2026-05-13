function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

const RealAPI = {
  async getBooks(query = "", categories = [], availableOnly = false) {
    try {
      let categoriesParam = "";
      if (categories && categories.length > 0) {
        categoriesParam = categories.join(",");
      }

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

  async borrowBook(isbn) {
    const response = await fetch("/api/loans/borrow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ isbn }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
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

  async getLogs() {
    const response = await fetch("/api/logs/", { credentials: "same-origin" });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to fetch logs");
    return data.logs;
  },

  async getAdminStats() {
    const response = await fetch("/api/stats/", { credentials: "same-origin" });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to fetch stats");
    return data;
  },

  // User Management Functions
  async getPendingUsers() {
    try {
      const response = await fetch("/api/users/search/?status=pending", {
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pending users");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch pending users");
      }

      return data.data.map((user) => ({
        ...user,
        username: user.name,
      }));
    } catch (error) {
      console.error("Error fetching pending users:", error);
      return [];
    }
  },

  async getApprovedUsers() {
    try {
      const response = await fetch("/api/users/search/?status=approved", {
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch users");
      }

      return data.data.map((user) => ({
        ...user,
        username: user.name,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  async searchUsers(query = "", status = "") {
    try {
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (status) params.append("status", status);

      const response = await fetch(`/api/users/search/?${params.toString()}`, {
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to search users");
      }

      return data.data || [];
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  },

  async approveUser(userId) {
    try {
      const response = await fetch("/api/users/approve/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ user_id: userId }),
        credentials: "same-origin",
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to approve user");
      return data;
    } catch (error) {
      console.error("Error approving user:", error);
      throw error;
    }
  },

  async denyUser(userId) {
    try {
      const response = await fetch("/api/users/deny/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ user_id: userId }),
        credentials: "same-origin",
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to deny user");
      return data;
    } catch (error) {
      console.error("Error denying user:", error);
      throw error;
    }
  },

  async banUser(userId) {
    try {
      const response = await fetch("/api/users/ban/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ user_id: userId }),
        credentials: "same-origin",
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to ban user");
      return data;
    } catch (error) {
      console.error("Error banning user:", error);
      throw error;
    }
  },

  async unbanUser(userId) {
    try {
      const response = await fetch("/api/users/unban/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ user_id: userId }),
        credentials: "same-origin",
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to unban user");
      return data;
    } catch (error) {
      console.error("Error unbanning user:", error);
      throw error;
    }
  },

  async getUserHistory() {
    const response = await fetch("/api/loans/history/", {
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch borrowing history");
    }

    const data = await response.json();
    return data.history || [];
  },

  async extendLoan(loanId) {
    const response = await fetch(`/api/loans/${loanId}/extend/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};

export default RealAPI;
