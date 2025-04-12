// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/fonts", "@nuxt/icon", "@nuxt/ui"],
  ssr: false,
  runtimeConfig: {
    public: {
      SAFFRON_API_URL: process.env.SAFFRON_API_URL || "http://localhost:7070",
    },
  },
});
