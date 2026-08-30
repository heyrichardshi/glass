// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/fonts", "@nuxt/icon", "@nuxt/ui"],
  ssr: false,
  components: [{ path: "~/components", pathPrefix: false }],
  runtimeConfig: {
    public: {},
  },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "Glass",
      script: [
        { src: "https://cdn.plaid.com/link/v2/stable/link-initialize.js" },
      ],
    },
  },
});
