// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/fonts", "@nuxt/icon", "@nuxt/ui"],
  ssr: false,
  runtimeConfig: {
    public: {
      SAFFRON_API_URL: process.env.SAFFRON_API_URL || "http://localhost:7070",
      TELLER_APPLICATION_ID: process.env.TELLER_APPLICATION_ID || "",
    },
  },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "Saffron",
      script: [{ src: "https://cdn.teller.io/connect/connect.js" }],
    },
  },
});
