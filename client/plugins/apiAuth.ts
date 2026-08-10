/**
 * Attaches the bearer token to API requests.
 */
export default defineNuxtPlugin(() => {
  const { apiBase } = useApiBase();
  const { accessToken } = useAuth();

  globalThis.$fetch = $fetch.create({
    onRequest({ request, options }) {
      if (!accessToken.value || !apiBase.value) return;

      const url = typeof request === "string" ? request : request.url;

      if (!url.startsWith(apiBase.value)) return;

      const headers = new Headers(options.headers);

      headers.set("Authorization", `Bearer ${accessToken.value}`);
      options.headers = headers;
    },
  });
});
