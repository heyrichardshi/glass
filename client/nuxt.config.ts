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
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
      script: [
        { src: "https://cdn.plaid.com/link/v2/stable/link-initialize.js" },
      ],
    },
  },
});
