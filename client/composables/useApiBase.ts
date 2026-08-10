const STORAGE_KEY = "glass.apiBaseUrl";

function normalize(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function isValidApiBase(url: string): boolean {
  try {
    const parsed = new URL(normalize(url));
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function useApiBase() {
  const apiBase = useState<string>("glass:apiBase", () =>
    import.meta.client ? (localStorage.getItem(STORAGE_KEY) ?? "") : "",
  );

  const suggestion = "http://localhost:7070";

  const isConfigured = computed(() => apiBase.value.length > 0);

  function setApiBase(url: string) {
    const next = normalize(url);
    apiBase.value = next;
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, next);
  }

  function clearApiBase() {
    apiBase.value = "";
    if (import.meta.client) localStorage.removeItem(STORAGE_KEY);
  }

  return { apiBase, suggestion, isConfigured, setApiBase, clearApiBase };
}
