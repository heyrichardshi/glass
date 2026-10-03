/**
 * jose is ESM-only, but this package is CommonJS, so we need to import it dynamically.
 * We use the with: { "resolution-mode": "import" } option to tell the compiler to import it as ESM.
 * This helper is defined here once so it can be reused as necessary.
 */
export type Jose = typeof import("jose", {
  with: { "resolution-mode": "import" }
});

export async function getJose(): Promise<Jose> {
  return import("jose");
}
