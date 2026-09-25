/*
 * Auth controller: login/register on index.html, plus logout wiring and a
 * session guard shared with contacts.html. Loaded on both pages.
 *
 * Assumed API contract (backend not built yet — confirm with the API dev
 * before this ships; assumes PHP session-cookie auth, not tokens):
 *   POST /api/auth/register.php  body { firstName, lastName, email, password } -> { user: User }
 *   POST /api/auth/login.php     body { email, password }                     -> { user: User }
 *   POST /api/auth/logout.php    (no body)                                    -> { success: true }
 *   GET  /api/auth/session.php   (no body)                                    -> { user: User | null }
 *
 * User shape: { id, firstName, lastName, email }
 * All requests are expected to send the PHP session cookie (credentials: "include").
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

    els.loginEmail = document.getElementById("loginEmail");
    els.loginPassword = document.getElementById("loginPassword");
    els.loginSubmitBtn = document.getElementById("loginSubmitBtn");

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
        // Ignore — send the user back to the login page regardless.
      }
      window.location.href = "index.html";
    });
  }

  async function redirectIfAuthenticated() {
    try {
      const user = await AuthApi.session();
      if (user) window.location.href = "contacts.html";
    } catch (err) {
      // No session, or the endpoint isn't ready yet — stay on the login page.
    }
  }

  async function guardProtectedPage() {
    try {
      const user = await AuthApi.session();
      if (!user) {
        window.location.href = "index.html";
        return;
      }
      if (els.welcomeMsg && user.firstName) {
        els.welcomeMsg.textContent = `Hi, ${user.firstName}`;
      }
    } catch (err) {
      // Fail open during development so a missing session endpoint doesn't
      // lock the team out of the contacts page before auth is finished.
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
    (showLogin ? els.loginEmail : els.registerFirstName).focus();
  }

  async function onLoginSubmit(e) {
    e.preventDefault();

    const payload = {
      email: els.loginEmail.value.trim(),
      password: els.loginPassword.value,
    };

    clearFieldErrors(["loginEmail", "loginPassword"]);
    let valid = true;
    if (!isValidEmail(payload.email)) {
      setFieldError("loginEmail", "Enter a valid email address.");
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
      showBanner(err.message || "Could not log in. Check your email and password.", "error");
    } finally {
      els.loginSubmitBtn.disabled = false;
    }
  }

  async function onRegisterSubmit(e) {
    e.preventDefault();

    const payload = {
      firstName: els.registerFirstName.value.trim(),
      lastName: els.registerLastName.value.trim(),
      email: els.registerEmail.value.trim(),
      password: els.registerPassword.value,
    };
    const confirmPassword = els.registerConfirm.value;

    clearFieldErrors(["registerFirstName", "registerLastName", "registerEmail", "registerPassword", "registerConfirm"]);
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
        await AuthApi.login({ email: payload.email, password: payload.password });
        window.location.href = "contacts.html";
      } catch (loginErr) {
        showBanner("Account created — please log in.", "success");
        switchTab("login");
        els.loginEmail.value = payload.email;
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
    if (err) err.textContent = message;
  }

  function clearFieldErrors(ids) {
    ids.forEach((id) => {
      const field = document.getElementById(`field-${id}`);
      if (!field) return;
      field.classList.remove("field--error");
      const err = field.querySelector(".field__error");
      if (err) err.textContent = "";
    });
  }

  function clearAllFieldErrors() {
    document.querySelectorAll(".field").forEach((f) => {
      f.classList.remove("field--error");
      const err = f.querySelector(".field__error");
      if (err) err.textContent = "";
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
