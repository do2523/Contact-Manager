/*
 * Contacts page controller.
 *
 * Assumed API contract (backend not built yet — confirm with the API dev
 * before this ships; adjust the fetch calls in ContactsApi below if the
 * real endpoints differ):
 *   GET    /api/contacts/get.php            -> { contacts: [Contact] }
 *   GET    /api/contacts/search.php?q=term  -> { contacts: [Contact] }
 *   POST   /api/contacts/create.php         body Contact (no id)   -> { contact: Contact }
 *   POST   /api/contacts/update.php         body Contact (with id) -> { contact: Contact }
 *   POST   /api/contacts/delete.php         body { id }            -> { success: true }
 *
 * Contact shape: { id, firstName, lastName, email, phone, createdAt }
 */

(function () {
  "use strict";

  const state = {
    contacts: [],
    searchTerm: "",
    activeLetter: null,
    editingId: null,
    deletingId: null,
  };

  const els = {};
  const MODAL_TRANSITION_MS = 220;
  const ROW_REMOVE_MS = 200; // matches .listing's exit transition in styles.css

  const TRASH_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M4 7h16" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />' +
    '<path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />' +
    '<path d="M10 11v6" /><path d="M14 11v6" /></svg>';

  document.addEventListener("DOMContentLoaded", init);

  function showModal(el) {
    el.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("is-open"));
    });
  }

  function hideModal(el) {
    el.classList.remove("is-open");
    window.clearTimeout(hideModal._timers?.get(el));
    hideModal._timers = hideModal._timers || new Map();
    const timer = window.setTimeout(() => {
      el.hidden = true;
    }, MODAL_TRANSITION_MS);
    hideModal._timers.set(el, timer);
  }

  function init() {
    cacheEls();
    bindEvents();
    loadContacts();
  }

  function cacheEls() {
    els.banner = document.getElementById("banner");
    els.listingsContainer = document.getElementById("listingsContainer");
    els.alphaIndex = document.getElementById("alphaIndex");
    els.resultCount = document.getElementById("resultCount");
    els.searchForm = document.getElementById("searchForm");
    els.searchInput = document.getElementById("searchInput");
    els.addContactBtn = document.getElementById("addContactBtn");

    els.contactModal = document.getElementById("contactModal");
    els.contactModalTitle = document.getElementById("contactModalTitle");
    els.contactModalClose = document.getElementById("contactModalClose");
    els.contactForm = document.getElementById("contactForm");
    els.contactId = document.getElementById("contactId");
    els.firstName = document.getElementById("firstName");
    els.lastName = document.getElementById("lastName");
    els.email = document.getElementById("email");
    els.phone = document.getElementById("phone");
    els.contactCancelBtn = document.getElementById("contactCancelBtn");
    els.contactSaveBtn = document.getElementById("contactSaveBtn");

    els.deleteModal = document.getElementById("deleteModal");
    els.deleteModalClose = document.getElementById("deleteModalClose");
    els.deleteContactName = document.getElementById("deleteContactName");
    els.deleteCancelBtn = document.getElementById("deleteCancelBtn");
    els.deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
  }

  function bindEvents() {
    els.searchForm.addEventListener("submit", (e) => e.preventDefault());
    els.searchInput.addEventListener("input", debounce(onSearchInput, 250));

    els.addContactBtn.addEventListener("click", () => openContactModal(null));
    els.contactModalClose.addEventListener("click", closeContactModal);
    els.contactCancelBtn.addEventListener("click", closeContactModal);
    els.contactForm.addEventListener("submit", onSubmitContact);
    els.contactModal.addEventListener("click", (e) => {
      if (e.target === els.contactModal) closeContactModal();
    });

    els.deleteModalClose.addEventListener("click", closeDeleteModal);
    els.deleteCancelBtn.addEventListener("click", closeDeleteModal);
    els.deleteConfirmBtn.addEventListener("click", onConfirmDelete);
    els.deleteModal.addEventListener("click", (e) => {
      if (e.target === els.deleteModal) closeDeleteModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (els.contactModal.classList.contains("is-open")) closeContactModal();
      if (els.deleteModal.classList.contains("is-open")) closeDeleteModal();
    });

    els.listingsContainer.addEventListener("click", onListingsClick);
  }

  // ---------------- Data loading ----------------

  async function loadContacts() {
    setLoading();
    try {
      const contacts = await ContactsApi.list();
      state.contacts = contacts;
      renderAll();
    } catch (err) {
      showBanner("Could not load your contacts. " + err.message, "error");
      state.contacts = [];
      renderAll();
    }
  }

  function onSearchInput() {
    state.searchTerm = els.searchInput.value.trim();
    state.activeLetter = null;
    runSearch();
  }

  async function runSearch() {
    if (!state.searchTerm) {
      renderAll();
      return;
    }
    try {
      const results = await ContactsApi.search(state.searchTerm);
      renderListings(results);
      renderAlphaIndex(results);
    } catch (err) {
      showBanner("Search failed. " + err.message, "error");
    }
  }

  // ---------------- Rendering ----------------

  function setLoading() {
    const skeletonGroup = `
      <div class="skeleton-group">
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line skeleton-line--name"></div>
        <div class="skeleton-line skeleton-line--detail"></div>
        <div class="skeleton-line skeleton-line--name"></div>
        <div class="skeleton-line skeleton-line--detail"></div>
      </div>`;
    els.listingsContainer.innerHTML =
      '<div class="visually-hidden" role="status">Loading contacts&hellip;</div>' +
      skeletonGroup.repeat(3);
  }

  function renderAll(opts) {
    const visible = state.activeLetter
      ? state.contacts.filter(
          (c) => (c.lastName || "").charAt(0).toUpperCase() === state.activeLetter
        )
      : state.contacts;
    renderListings(visible, opts);
    renderAlphaIndex(state.contacts);
  }

  function renderAlphaIndex(sourceList) {
    const lettersWithContacts = new Set(
      sourceList.map((c) => (c.lastName || "?").charAt(0).toUpperCase())
    );
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    els.alphaIndex.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.textContent = "All";
    if (!state.activeLetter) allBtn.classList.add("is-active");
    allBtn.addEventListener("click", () => {
      state.activeLetter = null;
      renderAll();
    });
    els.alphaIndex.appendChild(allBtn);

    alphabet.forEach((letter) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = letter;
      const hasContacts = lettersWithContacts.has(letter);
      if (!hasContacts) btn.disabled = true;
      if (state.activeLetter === letter) btn.classList.add("is-active");
      btn.addEventListener("click", () => {
        state.activeLetter = letter;
        renderAll();
      });
      els.alphaIndex.appendChild(btn);
    });
  }

  function renderListings(list, opts) {
    const skipEntrance = Boolean(opts && opts.skipEntrance);
    els.resultCount.textContent = `${list.length} ${list.length === 1 ? "contact" : "contacts"}`;

    if (list.length === 0) {
      const message = state.searchTerm
        ? `No contacts match "${escapeHtml(state.searchTerm)}".`
        : "No contacts yet. Add your first contact to get started.";
      els.listingsContainer.innerHTML = `
        <div class="state-panel">
          <div class="state-panel__title">Nothing Found</div>
          <p>${message}</p>
        </div>`;
      return;
    }

    const sorted = [...list].sort((a, b) => {
      const an = `${a.lastName || ""} ${a.firstName || ""}`.toLowerCase();
      const bn = `${b.lastName || ""} ${b.firstName || ""}`.toLowerCase();
      return an.localeCompare(bn);
    });

    const groups = new Map();
    sorted.forEach((contact) => {
      const letter = (contact.lastName || "?").charAt(0).toUpperCase();
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter).push(contact);
    });

    const MAX_STAGGER = 6;
    const html = [...groups.entries()]
      .map(
        ([letter, contacts], i) => `
        <section class="listing-group${skipEntrance ? " no-entrance" : ""}" data-letter="${letter}" style="--gi:${Math.min(i, MAX_STAGGER)}">
          <h2 class="listing-group__letter">${letter}</h2>
          <div class="listing-grid">
            ${contacts.map(renderListingRow).join("")}
          </div>
        </section>`
      )
      .join("");

    els.listingsContainer.innerHTML = html;
  }

  function renderListingRow(contact) {
    const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
    const created = formatDate(contact.createdAt);
    return `
      <article class="listing" data-id="${escapeHtml(contact.id)}">
        <span class="listing__name">
          ${escapeHtml(fullName)}
          <span class="listing__email">${escapeHtml(contact.email || "")}</span>
        </span>
        <span class="listing__phone">${escapeHtml(formatPhone(contact.phone))}</span>
        <span class="listing__created">Added ${created}</span>
        <span class="listing__actions">
          <button type="button" class="btn btn--small" data-action="edit">Edit</button>
          <button
            type="button"
            class="btn btn--danger btn--icon"
            data-action="delete"
            aria-label="Delete ${escapeHtml(fullName)}"
            title="Delete"
          >${TRASH_ICON}</button>
        </span>
      </article>`;
  }

  function onListingsClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = e.target.closest(".listing");
    const id = row && row.getAttribute("data-id");
    const contact = state.contacts.find((c) => String(c.id) === String(id));
    if (!contact) return;

    if (btn.dataset.action === "edit") openContactModal(contact);
    if (btn.dataset.action === "delete") openDeleteModal(contact);
  }

  // ---------------- Add / Edit modal ----------------

  function openContactModal(contact) {
    state.editingId = contact ? contact.id : null;
    els.contactModalTitle.textContent = contact ? "Edit Contact" : "New Contact";
    els.contactId.value = contact ? contact.id : "";
    els.firstName.value = contact ? contact.firstName || "" : "";
    els.lastName.value = contact ? contact.lastName || "" : "";
    els.email.value = contact ? contact.email || "" : "";
    els.phone.value = contact ? contact.phone || "" : "";
    clearFieldErrors();
    showModal(els.contactModal);
    els.firstName.focus();
  }

  function closeContactModal() {
    hideModal(els.contactModal);
    els.contactForm.reset();
    state.editingId = null;
  }

  function clearFieldErrors() {
    document.querySelectorAll(".field").forEach((f) => {
      f.classList.remove("field--error");
      const err = f.querySelector(".field__error");
      if (err) err.textContent = "";
    });
  }

  function setFieldError(fieldId, message) {
    const field = document.getElementById(`field-${fieldId}`);
    if (!field) return;
    field.classList.add("field--error");
    const err = field.querySelector(".field__error");
    if (err) err.textContent = message;
  }

  function validateContactForm(payload) {
    clearFieldErrors();
    let valid = true;

    if (!payload.firstName) {
      setFieldError("firstName", "First name is required.");
      valid = false;
    }
    if (!payload.lastName) {
      setFieldError("lastName", "Last name is required.");
      valid = false;
    }
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setFieldError("email", "Enter a valid email address.");
      valid = false;
    }
    if (!payload.phone || payload.phone.replace(/\D/g, "").length < 10) {
      setFieldError("phone", "Enter a valid 10-digit phone number.");
      valid = false;
    }

    return valid;
  }

  async function onSubmitContact(e) {
    e.preventDefault();

    const payload = {
      firstName: els.firstName.value.trim(),
      lastName: els.lastName.value.trim(),
      email: els.email.value.trim(),
      phone: els.phone.value.trim(),
    };

    if (!validateContactForm(payload)) return;

    els.contactSaveBtn.disabled = true;
    try {
      if (state.editingId) {
        payload.id = state.editingId;
        const updated = await ContactsApi.update(payload);
        replaceContact(updated);
        showBanner("Contact updated.", "success");
      } else {
        const created = await ContactsApi.create(payload);
        state.contacts.push(created);
        showBanner("Contact added.", "success");
      }
      closeContactModal();
      renderAll({ skipEntrance: true });
    } catch (err) {
      showBanner("Could not save this contact. " + err.message, "error");
    } finally {
      els.contactSaveBtn.disabled = false;
    }
  }

  function replaceContact(updated) {
    const idx = state.contacts.findIndex((c) => String(c.id) === String(updated.id));
    if (idx !== -1) state.contacts[idx] = updated;
  }

  // ---------------- Delete confirmation ----------------

  function openDeleteModal(contact) {
    state.deletingId = contact.id;
    els.deleteContactName.textContent = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
    showModal(els.deleteModal);
  }

  function closeDeleteModal() {
    hideModal(els.deleteModal);
    state.deletingId = null;
  }

  async function onConfirmDelete() {
    if (!state.deletingId) return;
    const id = state.deletingId;
    els.deleteConfirmBtn.disabled = true;
    try {
      await ContactsApi.remove(id);
      closeDeleteModal();
      showBanner("Contact deleted.", "success");
      removeRowThenRender(id);
    } catch (err) {
      showBanner("Could not delete this contact. " + err.message, "error");
    } finally {
      els.deleteConfirmBtn.disabled = false;
    }
  }

  // Lets the row visibly leave (collapse + fade) before it disappears from
  // the list, instead of just vanishing on the next render.
  function removeRowThenRender(id) {
    const row = els.listingsContainer.querySelector(
      `.listing[data-id="${CSS.escape(String(id))}"]`
    );
    if (!row) {
      state.contacts = state.contacts.filter((c) => String(c.id) !== String(id));
      renderAll({ skipEntrance: true });
      return;
    }
    row.classList.add("is-removing");
    window.setTimeout(() => {
      state.contacts = state.contacts.filter((c) => String(c.id) !== String(id));
      renderAll({ skipEntrance: true });
    }, ROW_REMOVE_MS);
  }

  // ---------------- Helpers ----------------

  function showBanner(message, kind) {
    els.banner.textContent = message;
    els.banner.className = `banner banner--${kind}`;
    els.banner.hidden = false;
    window.clearTimeout(showBanner._t);
    showBanner._t = window.setTimeout(() => {
      els.banner.hidden = true;
    }, 4000);
  }

  function formatDate(value) {
    if (!value) return "recently";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "recently";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function formatPhone(raw) {
    const digits = (raw || "").replace(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return raw || "";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }
})();
