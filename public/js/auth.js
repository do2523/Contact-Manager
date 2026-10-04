/*
 * Auth controller: login/register on index.html, plus logout wiring and a
 * session guard shared with contacts.html. Loaded on both pages.
 *
 * Assumed API contract (backend not built yet — confirm with the API dev
 * before this ships; assumes PHP session-cookie auth, not tokens):
 *   POST /api/auth/register.php  body { username, password, password_confirmation } -> { success: true }
 *   POST /api/auth/login.php     body { username, password }                  -> { id, username, error }
 *   POST /api/auth/logout.php    (no body)                                    -> { success: true }
 *   GET  /api/auth/session.php   (no body)                                    -> { user: User | null }
 *
 * User shape: { id, username }
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

    els.loginUsername = document.getElementById("loginUsername");
    els.loginPassword = document.getElementById("loginPassword");
    els.loginSubmitBtn = document.getElementById("loginSubmitBtn");

    els.registerUsername = document.getElementById("registerUsername");
    els.registerPassword = document.getElementById("registerPassword");
    els.passwordRules = document.getElementById("passwordRules");
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
      if (els.welcomeMsg && user.username) {
        els.welcomeMsg.textContent = `Hi, ${user.username}`;
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
    els.registerPassword.addEventListener("input", () => {
      clearFieldErrors(["registerPassword"]);
      renderPasswordRules();
    });
    renderPasswordRules();
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
    (showLogin ? els.loginUsername : els.registerUsername).focus();
  }

  async function onLoginSubmit(e) {
    e.preventDefault();

    const payload = {
      username: els.loginUsername.value.trim(),
      password: els.loginPassword.value,
    };

    clearFieldErrors(["loginUsername", "loginPassword"]);
    let valid = true;
    if (!payload.username) {
      setFieldError("loginUsername", "Enter your username.");
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
      showBanner(err.message || "Could not log in. Check your username and password.", "error");
    } finally {
      els.loginSubmitBtn.disabled = false;
    }
  }

  async function onRegisterSubmit(e) {
    e.preventDefault();

    const username = els.registerUsername.value.trim();
    const password = els.registerPassword.value;
    const confirmation = els.registerConfirm.value;

    clearFieldErrors(["registerUsername", "registerPassword", "registerConfirm"]);
    let valid = true;
    if (!username) {
      setFieldError("registerUsername", "Choose a username.");
      valid = false;
    }
    const failed = passwordRules(password).filter((rule) => !rule.met);
    if (failed.length) {
      setFieldError(
        "registerPassword",
        "Password still needs: " + failed.map((rule) => rule.label).join(", ") + "."
      );
      valid = false;
    }
    if (!confirmation) {
      setFieldError("registerConfirm", "Retype your password.");
      valid = false;
    } else if (confirmation !== password) {
      setFieldError("registerConfirm", "Passwords do not match.");
      valid = false;
    }
    if (!valid) return;

    els.registerSubmitBtn.disabled = true;
    try {
      await AuthApi.register({
        username,
        password,
        password_confirmation: confirmation,
      });
      try {
        await AuthApi.login({ username, password });
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

  // ---------------- Password rules ----------------

  // A "special" character is a symbol: not a letter, digit, or whitespace.
  function passwordRules(password) {
    return [
      { key: "length", label: "at least 8 characters", met: password.length >= 8 },
      { key: "upper", label: "an uppercase letter", met: /[A-Z]/.test(password) },
      { key: "lower", label: "a lowercase letter", met: /[a-z]/.test(password) },
      { key: "number", label: "a number", met: /[0-9]/.test(password) },
      { key: "special", label: "a special character", met: /[^A-Za-z0-9\s]/.test(password) },
    ];
  }

  function renderPasswordRules() {
    const results = passwordRules(els.registerPassword.value);
    results.forEach((rule) => {
      const item = els.passwordRules.querySelector(`[data-rule="${rule.key}"]`);
      if (item) item.classList.toggle("is-met", rule.met);
    });
  }

  // ---------------- Helpers ----------------

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
