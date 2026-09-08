/**
 * Attaches the bearer token to API requests, and routes auth failures.
 *
 * A 401 means re-authenticate. A 403 with code NO_ACCOUNT means enroll.
 * Treating either as the other results in a login loop.
 *
 * The string is duplicated from @glass/types rather than imported because it is CommonJS,
 * and Vite cannot named-import values re-exported through its barrels.
 */
const NO_ACCOUNT_ERROR_CODE = "NO_ACCOUNT";

export default defineNuxtPlugin(() => {
  const { apiBase } = useApiBase();
  const { token, authError, shouldRetryLogin, login } = useAuth();

  // login() navigates away, so this is never reset on success. It exists to stop
  // a page that fires several requests at once from starting several logins.
  let reauthenticating = false;
  let enrolling = false;

  function isApiUrl(request: RequestInfo): string | undefined {
    const url = typeof request === "string" ? request : request.url;
    if (!apiBase.value || !url.startsWith(apiBase.value)) return undefined;
    return url;
  }

  globalThis.$fetch = $fetch.create({
    onRequest({ request, options }) {
      if (!token.value) return;
      if (!isApiUrl(request)) return;

      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${token.value}`);
      options.headers = headers;
    },

    onResponseError({ request, response }) {
      const url = isApiUrl(request);
      if (!url) return;

      // Short-circuit if the auth endpoint is failing.
      if (url.startsWith(`${apiBase.value}/auth/`)) return;

      if (response.status === 403) {
        const code = (response._data as { code?: string } | undefined)?.code;
        if (code === NO_ACCOUNT_ERROR_CODE) {
          if (enrolling) return;
          if (window.location.pathname === "/enroll") return;
          enrolling = true;
          navigateTo("/enroll").finally(() => {
            enrolling = false;
          });
        }
        return;
      }

      if (response.status !== 401) return;

      // Otherwise, clear the invalid token.
      token.value = null;

      // This means the server has issues with the token, so retrying will not help.
      if (!shouldRetryLogin()) {
        authError.value =
          "Signed in, but the API rejected the token. Check the server logs.";
        return;
      }

      if (reauthenticating) return;
      reauthenticating = true;

      login().catch(() => {
        reauthenticating = false;
      });
    },
  });
});
