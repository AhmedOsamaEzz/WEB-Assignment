let giveAdmin = true;
let devMode = true;
// giveAdmin decides the role until backend is implemented
// devMode disables accessCheck

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
