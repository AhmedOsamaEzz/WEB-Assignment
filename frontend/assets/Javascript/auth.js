let giveAdmin = false;
let devMode = false;
// giveAdmin is what decided what your role is Until we implement backend
// devMode disables accessCheck

const scriptUrl = document.currentScript.src;
const APP_ROOT = scriptUrl.split("assets/Javascript/auth.js")[0];

/**
 * function makes sure the user isn't in a page he doesn't have access to
 * (makes normal users not access admin pages)
 * makes users that didn't login not access anything
 * @returns void
 */
function checkAccess() {
  const token =
    localStorage.getItem("user_token") || sessionStorage.getItem("user_token");
  let role = localStorage.getItem("user_role");
  if (!role) {
    role = sessionStorage.getItem("user_role");
  }

  const path = window.location.pathname.toLowerCase();
  console.log;
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

if (!devMode) {
  checkAccess();
  window.addEventListener("pageshow", (event) => {
    // event.persisted is 'true' if the page is being loaded from the browser's cache
    if (event.persisted) {
      checkAccess();
    }
  });
}

/**
 * Function validates email address format
 * @param {string} email - The email address string to be validated
 * @returns {boolean}- returns 'true' if email format is valid 'false' otherwise
 */
function isValidEmail(email) {
  // Regular expression for standard email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Function evaluates strength of password
 * @param {string} password password to be validated
 * @returns {boolean}true if function contains (a capital letter, a small letter, a symbol and atleast 8 characters) false otherwise
 */
function isStrongPassword(password) {
  if (password.length < 8) {
    return false;
  }
  const allowedChars = /^[a-zA-Z0-9!@#$%^&*]+$/;
  if (!allowedChars.test(password)) {
    // illegal letters
    return false;
  }

  if (!/[A-Z]/.test(password)) {
    return false;
  }

  if (!/[a-z]/.test(password)) {
    return false;
  }

  if (!/[0-9]/.test(password)) {
    return false;
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return false;
  }

  return true;
}

/**
 * This function handles the Login and Signup forms
 * Makes sure input fields are filled correctly
 * pretends to check login and logs the user in
 */
function initUI() {
  // Login page
  const loginForm = document.querySelector(".login-form");

  if (loginForm) {
    const loginBtn = document.querySelector(".login-card .btn-primary");
    const inputs = document.querySelectorAll(".login-form .input-field");

    const emailInput = inputs[0];
    const passwordInput = inputs[1];
    const rememberCheckbox = document.getElementById("remember-login");

    loginBtn.onclick = null;

    emailInput.addEventListener("input", () => {
      document.getElementById("login-email-error").innerText = "";
    });

    passwordInput.addEventListener("input", () => {
      document.getElementById("login-password-error").innerText = "";
    });

    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();

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

      if (!isValidEmail(email)) {
        document.getElementById("login-email-error").innerText =
          "enter a valid email";
        inputFieldError = true;
      }

      if (inputFieldError) {
        console.log("login input field error");
        return;
      }

      loginBtn.textContent = "Processing...";
      loginBtn.disabled = true;

      setTimeout(() => {
        // 3. Mock Authentication & Storage
        if (rememberCheckbox && rememberCheckbox.checked) {
          localStorage.setItem("user_token", "thisUserIsCalledBean");
          if (giveAdmin) {
            localStorage.setItem("user_role", "admin");
          } else {
            localStorage.setItem("user_role", "user");
          }
        } else {
          sessionStorage.setItem("user_token", "thisUserIsCalledBean");
          if (giveAdmin) {
            sessionStorage.setItem("user_role", "admin");
          } else {
            sessionStorage.setItem("user_role", "user");
          }
        }

        window.location.href = "../../user/search.html";
      }, 800); // 800ms fake delay for realism XD
    });
  }

  // signup
  const signupForm = document.querySelector(".signup-form");

  if (signupForm) {
    const signupBtn = document.querySelector(".signup-card .btn-primary");
    const inputs = document.querySelectorAll(".signup-form .input-field");

    const nameInput = inputs[0];
    const emailInput = inputs[1];
    const passwordInput = inputs[2];

    signupBtn.onclick = null;

    nameInput.addEventListener("input", () => {
      document.getElementById("signup-username-error").innerText = "";
    });

    emailInput.addEventListener("input", () => {
      document.getElementById("signup-email-error").innerText = "";
    });

    passwordInput.addEventListener("input", () => {
      document.getElementById("signup-password-error").innerText = "";
    });

    signupBtn.addEventListener("click", (e) => {
      e.preventDefault();

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
          "email can't be empty\n";
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

      if (!isStrongPassword(password)) {
        document.getElementById("signup-password-error").innerText =
          "password has to contain a capital letter, a lowercase letter, a symbol and atleast 8 characters";
        inputFieldError = true;
      }

      if (inputFieldError) return;

      const originalText = signupBtn.textContent;
      signupBtn.textContent = "Processing...";
      signupBtn.disabled = true;

      setTimeout(() => {
        window.location.href = "login.html";
      }, 800);
    });
  }
}

function logout() {
  console.log("loggedout");
  localStorage.removeItem("user_token");
  localStorage.removeItem("user_role");
  sessionStorage.removeItem("user_token");
  sessionStorage.removeItem("user_role");
  window.location.href = APP_ROOT + "auth/login.html";
}

// logout button
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logout();
  });
}

document.addEventListener("DOMContentLoaded", initUI);
