function createCard(book) {
  return `
    <div class="card" onclick="location.href='bookDetails.html?id=${book.isbn}'">
      <figure>
        <img src="${book.cover}" alt="${book.title}" draggable="false">
        <figcaption>
          <p class="name">${book.title}</p>
          <p class="author">${book.author} (${book.year})</p>
          <p class="desc">${book.description}</p>
        </figcaption>
      </figure>
    </div>
  `;
}

function renderBooks() {
  const query = document
    .querySelector(".search-bar input")
    .value.trim()
    .toLowerCase();
  const activeCategory = document
    .querySelector(".filters ul li.active")
    .textContent.trim()
    .toLowerCase();
  const onlyAvailable = document.querySelector(".filter-check").checked; // single checkbox

  const books = JSON.parse(localStorage.getItem("booklist")) || []; // parse converts JSON format array of book objects

  const results = books.filter((book) => {
    const matchesQuery =
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query);
    const matchesCategory =
      activeCategory === "all" || book.category === activeCategory;
    const matchesAvail = !onlyAvailable || parseInt(book.copies) > 0;

    return matchesQuery && matchesCategory && matchesAvail;
  });

  document.getElementById("query-label").textContent = query || activeCategory;
  document.getElementById("results-count").textContent = results.length;
  document.getElementById("cards-container").innerHTML =
    results.length === 0
      ? `<p class="no-results">No matches found in the archives.</p>`
      : results.map(createCard).join(""); // returns the html code for all result books
}

// This event fires when the browser has fully loaded the HTML and built the DOM
document.addEventListener("DOMContentLoaded", () => {
  // Render all books at first
  renderBooks();

  // Live search
  document
    .querySelector(".search-bar input")
    .addEventListener("input", renderBooks); // event listener "input" not "change" for Real-time search results

  // Category clicks and don't apply it till the user click apply button
  const categoryItems = document.querySelectorAll(
    ".filters .filters-section:nth-child(2) ul li",
  );
  categoryItems.forEach((li) => {
    li.addEventListener("click", () => {
      categoryItems.forEach((item) => item.classList.remove("active")); // no multiple category
      li.classList.add("active"); // unique
    });
  });

  // Whole row toggles the checkbox
  const checkRow = document.querySelector(
    ".filters .filters-section:nth-child(3) ul li",
  );
  checkRow.addEventListener("click", (e) => {
    const checkbox = checkRow.querySelector(".filter-check");
    if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
  });

  // Apply filters button
  document.querySelector(".apply-filters-btn").addEventListener("click", () => {
    renderBooks(); // with the new category
    document
      .getElementById("results-cnt")
      .scrollIntoView({ behavior: "smooth" }); // to scroll on click
  });

  // Prevent form refresh
  document
    .querySelector(".search-bar")
    .addEventListener("submit", (e) => e.preventDefault());
});
