import API from "../API/api.js";

const scriptUrl = document.currentScript ? document.currentScript.src : import.meta.url;
const APP_ROOT = scriptUrl.split("assets/Javascript/UI/authUI.js")[0].split("assets/js/ui/authUI.js")[0];
let devMode = false;

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

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

function checkAccess() {
  const storedUser = localStorage.getItem("user_info") || sessionStorage.getItem("user_info");
  let User = {};
  try {
    User = storedUser ? JSON.parse(storedUser) : {};
  } catch (e) {
    User = {};
  }
  const token = User.token || null;
  const role = User.role || null;
  const path = window.location.pathname.toLowerCase();
  const isAuthPage = path.includes("auth");
  const isAdminPage = path.includes("admin");
  const isAdmin = role === "admin";

  if (!token) {
    if (!isAuthPage) window.location.replace(APP_ROOT + "auth/login.html");
    return;
  }
  if (token && isAuthPage) {
    if (isAdmin) window.location.replace(APP_ROOT + "admin/dashboard.html");
    else window.location.replace(APP_ROOT + "user/dashboard.html");
    return;
  }
  if (!isAdmin && isAdminPage) {
    window.location.replace(APP_ROOT + "user/dashboard.html");
    return;
  }
}

function logout() {
  localStorage.removeItem("user_info");
  sessionStorage.removeItem("user_info");
  window.location.href = APP_ROOT + "auth/login.html";
}

async function handleLoginSubmit(emailInput, passwordInput, rememberCheckbox, loginBtn) {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  let inputFieldError = false;

  console.log("hi");
  if (!email) {
    document.getElementById("login-email-error").innerText = "Email field cannot be empty";
    inputFieldError = true;
  } else if (!isValidEmail(email)) {
    document.getElementById("login-email-error").innerText = "Enter a valid email";
    inputFieldError = true;
  }
  if (!password) {
    document.getElementById("login-password-error").innerText = "Password field cannot be empty";
    inputFieldError = true;
  }
  if (inputFieldError) return;

  const originalText = loginBtn.textContent;
  loginBtn.textContent = "Processing...";
  loginBtn.disabled = true;

  try {
    const remember = rememberCheckbox ? rememberCheckbox.checked : false;
    await API.loginUser(email, password, remember);
    checkAccess(); 
  } catch (error) {
    document.getElementById("login-email-error").innerText = error.message;
    loginBtn.textContent = originalText;
    loginBtn.disabled = false;
  }
}

async function handleSignupSubmit(nameInput, emailInput, passwordInput, signupBtn) {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  let inputFieldError = false;

  if (!name) {
    document.getElementById("signup-username-error").innerText = "Name can't be empty";
    inputFieldError = true;
  }
  if (!email) {
    document.getElementById("signup-email-error").innerText = "Email can't be empty";
    inputFieldError = true;
  } else if (!isValidEmail(email)) {
    document.getElementById("signup-email-error").innerText = "Email must be valid";
    inputFieldError = true;
  }
  if (!password) {
    document.getElementById("signup-password-error").innerText = "Password can't be empty";
    inputFieldError = true;
  } else if (!isStrongPassword(password)) {
    document.getElementById("signup-password-error").innerText = "Password has to contain a capital letter, a lowercase letter, a symbol and at least 8 characters";
    inputFieldError = true;
  }
  if (inputFieldError) return;

  const originalText = signupBtn.textContent;
  signupBtn.textContent = "Processing...";
  signupBtn.disabled = true;

  const adminCheckbox = document.getElementById("create-admin-account");
  const role = (adminCheckbox && adminCheckbox.checked) ? "admin" : "user";

  try {
    await API.registerUser(name, email, password, role);
    window.location.href = "login.html";
  } catch (error) {
    document.getElementById("signup-email-error").innerText = error.message;
    signupBtn.textContent = originalText;
    signupBtn.disabled = false;
  }
}

function initUI() {
  const loginForm = document.querySelector(".login-form");
  if (loginForm) {
    const loginBtn = document.querySelector(".login-card .btn-primary");
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const rememberCheckbox = document.getElementById("remember-login");

    emailInput.addEventListener("input", () => document.getElementById("login-email-error").innerText = "");
    passwordInput.addEventListener("input", () => document.getElementById("login-password-error").innerText = "");

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleLoginSubmit(emailInput, passwordInput, rememberCheckbox, loginBtn);
    });
  }

  const signupForm = document.querySelector(".signup-form");
  if (signupForm) {
    const signupBtn = document.querySelector(".signup-card .btn-primary");
    const nameInput = document.getElementById("signup-name");
    const emailInput = document.getElementById("signup-email");
    const passwordInput = document.getElementById("signup-password");

    nameInput.addEventListener("input", () => document.getElementById("signup-username-error").innerText = "");
    emailInput.addEventListener("input", () => document.getElementById("signup-email-error").innerText = "");
    passwordInput.addEventListener("input", () => document.getElementById("signup-password-error").innerText = "");

    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSignupSubmit(nameInput, emailInput, passwordInput, signupBtn);
    });
  }
}

if (!devMode) {
  checkAccess();
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) checkAccess();
  });
}

const logoutBtn = document.getElementById("logout-btn") || document.getElementById("logout-link");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

document.addEventListener("DOMContentLoaded", initUI);