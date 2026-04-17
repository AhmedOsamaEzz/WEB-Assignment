import API from "../API/api.js";

const scriptUrl = document.currentScript.src;
const APP_ROOT = scriptUrl.split("assets/js/ui/authUI.js")[0];

let devMode = false;

// helper functions
/**
 * Validates email address format.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Evaluates password strength.
 * Requires: 8+ chars, uppercase, lowercase, digit, and a symbol (!@#$%^&*).
 * @param {string} password
 * @returns {boolean}
 */
function isStrongPassword(password) {
  if (password.length < 8) return false;

  const allowedChars = /^[a-zA-Z0-9!@#$%^&*]+$/;
  if (!allowedChars.test(password)) return false;

  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;

  return true;
}



/**
 * Ensures the user has access to the current page.
 * Redirects unauthenticated users to login,
 * and prevents role mismatches (e.g. user on admin page).
 */
function checkAccess() {
  const token =
    localStorage.getItem("user_token") || sessionStorage.getItem("user_token");
  let role = localStorage.getItem("user_role");
  if (!role) {
    role = sessionStorage.getItem("user_role");
  }

  const path = window.location.pathname.toLowerCase();
  const isAuthPage = path.includes("auth");
  const isAdminPage = path.includes("admin");
  const isAdmin = role == "admin";

  if (!token) {
    if (!isAuthPage) {
      console.log("not logged in");
      window.location.replace(APP_ROOT + "auth/login.html");
    }
    return;
  }

  if (token && isAuthPage) {
    console.log("logged in but bad");
    if (role == "admin") {
      window.location.replace(APP_ROOT + "admin/dashboard.html");
    } else {
      window.location.replace(APP_ROOT + "user/dashboard.html");
    }
    return;
  }

  if (!isAdmin && isAdminPage) {
    console.log("abuse");
    window.location.replace(APP_ROOT + "user/dashboard.html");
    return;
  }
}

/**
 * Clears auth tokens from storage and redirects to login.
 */
function logout() {
  console.log("loggedout");
  localStorage.removeItem("user_token");
  localStorage.removeItem("user_role");
  sessionStorage.removeItem("user_token");
  sessionStorage.removeItem("user_role");
  window.location.href = APP_ROOT + "auth/login.html";
}

/**
 * Handles login form submission.
 * Validates inputs, calls API.loginUser(), and handles success/error.
 * @param {HTMLElement} emailInput
 * @param {HTMLElement} passwordInput
 * @param {HTMLElement|null} rememberCheckbox
 * @param {HTMLElement} loginBtn
 */
async function handleLoginSubmit(
  emailInput,
  passwordInput,
  rememberCheckbox,
  loginBtn,
) {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let inputFieldError = false;

  if (!email) {
    document.getElementById("login-email-error").innerText =
      "email field cannot be empty";
    inputFieldError = true;
  }

  if (!password) {
    document.getElementById("login-password-error").innerText =
      "password field cannot be empty";
    inputFieldError = true;
  }

  if (email && !isValidEmail(email)) {
    document.getElementById("login-email-error").innerText =
      "enter a valid email";
    inputFieldError = true;
  }

  if (inputFieldError) {
    console.log("login input field error");
    return;
  }

  const originalText = loginBtn.textContent;
  loginBtn.textContent = "Processing...";
  loginBtn.disabled = true;

  try {
    const remember = rememberCheckbox && rememberCheckbox.checked;
    await API.loginUser({ email, password, remember });
    window.location.href = "../../user/search.html";
  } catch (error) {
    document.getElementById("login-email-error").innerText = error.message;
    loginBtn.textContent = originalText;
    loginBtn.disabled = false;
  }
}

/**
 * Handles signup form submission.
 * Validates inputs, calls API.registerUser(), and handles success/error.
 * @param {HTMLElement} nameInput
 * @param {HTMLElement} emailInput
 * @param {HTMLElement} passwordInput
 * @param {HTMLElement} signupBtn
 */
async function handleSignupSubmit(
  nameInput,
  emailInput,
  passwordInput,
  signupBtn,
) {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let inputFieldError = false;

  if (!name) {
    document.getElementById("signup-username-error").innerText =
      "Name can't be empty";
    inputFieldError = true;
  }

  if (!email) {
    document.getElementById("signup-email-error").innerText =
      "email can't be empty";
    inputFieldError = true;
  }

  if (!password) {
    document.getElementById("signup-password-error").innerText =
      "password can't be empty";
    inputFieldError = true;
  }

  if (email && !isValidEmail(email)) {
    document.getElementById("signup-email-error").innerText =
      "email must be valid";
    inputFieldError = true;
  }

  if (password && !isStrongPassword(password)) {
    document.getElementById("signup-password-error").innerText =
      "password has to contain a capital letter, a lowercase letter, a symbol and atleast 8 characters";
    inputFieldError = true;
  }

  if (inputFieldError) return;

  const originalText = signupBtn.textContent;
  signupBtn.textContent = "Processing...";
  signupBtn.disabled = true;

  try {
    await API.registerUser({ name, email, password });
    window.location.href = "login.html";
  } catch (error) {
    document.getElementById("signup-password-error").innerText = error.message;
    signupBtn.textContent = originalText;
    signupBtn.disabled = false;
  }
}

/**
 * Binds all auth form events on page load.
 */
function initUI() {
  // Login page
  const loginForm = document.querySelector(".login-form");

  if (loginForm) {
    const loginBtn = document.querySelector(".login-card .btn-primary");

    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const rememberCheckbox = document.getElementById("remember-login");

    emailInput.addEventListener("input", () => {
      document.getElementById("login-email-error").innerText = "";
    });

    passwordInput.addEventListener("input", () => {
      document.getElementById("login-password-error").innerText = "";
    });

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleLoginSubmit(emailInput, passwordInput, rememberCheckbox, loginBtn);
    });
  }

  // Signup page
  const signupForm = document.querySelector(".signup-form");

  if (signupForm) {
    const signupBtn = document.querySelector(".signup-card .btn-primary");

    const nameInput = document.getElementById("signup-name");
    const emailInput = document.getElementById("signup-email");
    const passwordInput = document.getElementById("signup-password");

    nameInput.addEventListener("input", () => {
      document.getElementById("signup-username-error").innerText = "";
    });

    emailInput.addEventListener("input", () => {
      document.getElementById("signup-email-error").innerText = "";
    });

    passwordInput.addEventListener("input", () => {
      document.getElementById("signup-password-error").innerText = "";
    });

    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSignupSubmit(nameInput, emailInput, passwordInput, signupBtn);
    });

  }
}

// Access guard — runs unless devMode is on (devMode defined in auth.js)
if (!devMode) {
  checkAccess();
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      checkAccess();
    }
  });
}

// Logout button
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logout();
  });
}

document.addEventListener("DOMContentLoaded", initUI);
