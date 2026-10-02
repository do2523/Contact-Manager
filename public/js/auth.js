/*
 * Auth controller: login/register on index.html, plus logout wiring and a
 * session guard shared with contacts.html. Loaded on both pages.
 *
 * Assumed API contract:
 *   POST /api/auth/register.php  body { firstName, lastName, email, password } -> { user: User }
 *   POST /api/auth/login.php     body { username, password }                   -> { id, username, error }
 *   POST /api/auth/logout.php    (no body)                                     -> { success: true }
 *   GET  /api/auth/session.php   (no body)                                     -> { id, username, error }
 *
 * All requests are expected to send the PHP session cookie.
 */

(function () {
  "use strict";

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheEls();
    bindLogout();

    if (els.loginForm) {
      bindAuthPage();
      redirectIfAuthenticated();
    } else if (document.getElementById("listingsContainer")) {
      guardProtectedPage();
    }
  }

  function cacheEls() {
    els.logoutBtn = document.getElementById("logoutBtn");
    els.welcomeMsg = document.getElementById("welcomeMsg");
    els.banner = document.getElementById("banner");

    els.loginTabBtn = document.getElementById("loginTabBtn");
    els.registerTabBtn = document.getElementById("registerTabBtn");
    els.loginForm = document.getElementById("loginForm");
    els.registerForm = document.getElementById("registerForm");

    // LOGIN
    els.loginUsername = document.getElementById("loginUsername");
    els.loginPassword = document.getElementById("loginPassword");
    els.loginSubmitBtn = document.getElementById("loginSubmitBtn");

    // REGISTER - unchanged
    els.registerFirstName = document.getElementById("registerFirstName");
    els.registerLastName = document.getElementById("registerLastName");
    els.registerEmail = document.getElementById("registerEmail");
    els.registerPassword = document.getElementById("registerPassword");
    els.registerConfirm = document.getElementById("registerConfirm");
    els.registerSubmitBtn = document.getElementById("registerSubmitBtn");
  }

  // ---------------- Shared: logout + route guard ----------------

  function bindLogout() {
    if (!els.logoutBtn) return;

    els.logoutBtn.addEventListener("click", async () => {
      els.logoutBtn.disabled = true;

      try {
        await AuthApi.logout();
      } catch (err) {
        // Ignore and return to login page
      }

      window.location.href = "index.html";
    });
  }

  async function redirectIfAuthenticated() {
    try {
      const user = await AuthApi.session();

      if (user) {
        window.location.href = "contacts.html";
      }
    } catch (err) {
      // Not logged in
    }
  }

  async function guardProtectedPage() {
    try {
      const user = await AuthApi.session();

      if (!user) {
        window.location.href = "index.html";
        return;
      }

      if (els.welcomeMsg && user.username) {
        els.welcomeMsg.textContent = `Hi, ${user.username}`;
      }
    } catch (err) {
      // Session check failed
    }
  }

  // ---------------- Login / register page ----------------

  function bindAuthPage() {
    els.loginTabBtn.addEventListener("click", () => switchTab("login"));
    els.registerTabBtn.addEventListener("click", () => switchTab("register"));

    els.loginForm.addEventListener("submit", onLoginSubmit);
    els.registerForm.addEventListener("submit", onRegisterSubmit);
  }

  function switchTab(tab) {
    const showLogin = tab === "login";

    els.loginTabBtn.classList.toggle("is-active", showLogin);
    els.loginTabBtn.setAttribute("aria-selected", String(showLogin));

    els.registerTabBtn.classList.toggle("is-active", !showLogin);
    els.registerTabBtn.setAttribute("aria-selected", String(!showLogin));

    els.loginForm.hidden = !showLogin;
    els.registerForm.hidden = showLogin;

    clearAllFieldErrors();
    hideBanner();

    (showLogin ? els.loginUsername : els.registerFirstName).focus();
  }

  // ---------------- LOGIN ----------------

  async function onLoginSubmit(e) {
    e.preventDefault();

    const payload = {
      username: els.loginUsername.value.trim(),
      password: els.loginPassword.value,
    };

    clearFieldErrors(["loginUsername", "loginPassword"]);

    let valid = true;

    if (!payload.username) {
      setFieldError("loginUsername", "Username is required.");
      valid = false;
    }

    if (!payload.password) {
      setFieldError("loginPassword", "Password is required.");
      valid = false;
    }

    if (!valid) return;

    els.loginSubmitBtn.disabled = true;

    try {
      await AuthApi.login(payload);

      window.location.href = "contacts.html";
    } catch (err) {
      showBanner(
        err.message || "Could not log in. Check your username and password.",
        "error",
      );
    } finally {
      els.loginSubmitBtn.disabled = false;
    }
  }

  // ---------------- REGISTER - unchanged ----------------

  async function onRegisterSubmit(e) {
    e.preventDefault();

    const payload = {
      firstName: els.registerFirstName.value.trim(),
      lastName: els.registerLastName.value.trim(),
      email: els.registerEmail.value.trim(),
      password: els.registerPassword.value,
    };

    const confirmPassword = els.registerConfirm.value;

    clearFieldErrors([
      "registerFirstName",
      "registerLastName",
      "registerEmail",
      "registerPassword",
      "registerConfirm",
    ]);

    let valid = true;

    if (!payload.firstName) {
      setFieldError("registerFirstName", "First name is required.");
      valid = false;
    }

    if (!payload.lastName) {
      setFieldError("registerLastName", "Last name is required.");
      valid = false;
    }

    if (!isValidEmail(payload.email)) {
      setFieldError("registerEmail", "Enter a valid email address.");
      valid = false;
    }

    if (!payload.password || payload.password.length < 8) {
      setFieldError("registerPassword", "Use at least 8 characters.");
      valid = false;
    }

    if (confirmPassword !== payload.password) {
      setFieldError("registerConfirm", "Passwords do not match.");
      valid = false;
    }

    if (!valid) return;

    els.registerSubmitBtn.disabled = true;

    try {
      await AuthApi.register(payload);

      try {
        await AuthApi.login({
          email: payload.email,
          password: payload.password,
        });

        window.location.href = "contacts.html";
      } catch (loginErr) {
        showBanner("Account created — please log in.", "success");
        switchTab("login");
      }
    } catch (err) {
      showBanner(err.message || "Could not create your account.", "error");
    } finally {
      els.registerSubmitBtn.disabled = false;
    }
  }

  // ---------------- Helpers ----------------

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function setFieldError(fieldId, message) {
    const field = document.getElementById(`field-${fieldId}`);

    if (!field) return;

    field.classList.add("field--error");

    const err = field.querySelector(".field__error");

    if (err) {
      err.textContent = message;
    }
  }

  function clearFieldErrors(ids) {
    ids.forEach((id) => {
      const field = document.getElementById(`field-${id}`);

      if (!field) return;

      field.classList.remove("field--error");

      const err = field.querySelector(".field__error");

      if (err) {
        err.textContent = "";
      }
    });
  }

  function clearAllFieldErrors() {
    document.querySelectorAll(".field").forEach((field) => {
      field.classList.remove("field--error");

      const err = field.querySelector(".field__error");

      if (err) {
        err.textContent = "";
      }
    });
  }

  function showBanner(message, kind) {
    if (!els.banner) return;

    els.banner.textContent = message;
    els.banner.className = `banner banner--${kind}`;
    els.banner.hidden = false;
  }

  function hideBanner() {
    if (!els.banner) return;

    els.banner.hidden = true;
  }
})();
