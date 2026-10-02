(() => {
  "use strict";

  const API_ROOT = "../api";
  const REQUEST_TIMEOUT_MS = 10000;

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    let response;
    try {
      response = await fetch(`${API_ROOT}/${path}`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
        ...options,
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          `Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`,
        );
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(
        data.error || `Request failed (${response.status})`,
      );
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function normalizeContact(contact) {
    return {
      id: contact.id ?? contact.ContactID,
      userId: contact.userId ?? contact.UserID,
      firstName: contact.firstName ?? contact.FirstName ?? "",
      lastName: contact.lastName ?? contact.LastName ?? "",
      email: contact.email ?? contact.Email ?? "",
      phone: contact.phone ?? contact.Phone ?? "",
      createdAt:
        contact.createdAt ?? contact.DateCreated ?? contact.date_created,
    };
  }

  let sessionRequest;
  async function getSessionUser() {
    sessionRequest ||= request("auth/session.php");
    return sessionRequest;
  }

  async function getUserId() {
    // Authentication is disabled temporarily while the contacts API is tested.
    // Restore the session lookup below when login is wired up on the server.
    // try {
    //   const user = await getSessionUser();
    //   const userId = user.id ?? user.ID;
    //   if (userId) return userId;
    // } catch (error) {
    //   // Continue to the development fallback.
    // }
    //
    // const userId = new URLSearchParams(window.location.search).get("UserID");
    // if (userId) return userId;

    return "1";
  }

  window.AuthApi = {
    session: getSessionUser,
    login: (payload) =>
      request("auth/login.php", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    register: (payload) =>
      request("auth/register.php", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    logout: () => request("auth/logout.php", { method: "POST" }),
  };

  window.ContactsApi = {
    async list() {
      return this.search("");
    },

    async search(searchTerm) {
      const userId = await getUserId();
      const params = new URLSearchParams({
        UserID: String(userId),
        search: searchTerm,
      });

      try {
        const data = await request(`contacts/search.php?${params}`);
        return (data.contacts || []).map(normalizeContact);
      } catch (error) {
        if (error.status === 404) return [];
        throw error;
      }
    },
  };
})();
