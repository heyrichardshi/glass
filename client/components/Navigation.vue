<template>
  <UNavigationMenu
    v-if="!hidden"
    :items="items"
    class="w-full justify-center"
  />
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const hidden = computed(() => route.path === "/enroll");

const items = ref<NavigationMenuItem[]>([
  {
    label: "Transactions",
    icon: "i-lucide-credit-card",
    to: "/",
  },
  {
    label: "Accounts",
    icon: "i-lucide-landmark",
    to: "/accounts",
  },
  {
    label: "Merchants",
    icon: "i-lucide-store",
    to: "/merchants",
  },
  {
    label: "Reports",
    icon: "i-lucide-file-chart-pie",
    to: "/report",
  },
  {
    label: "Settings",
    icon: "i-lucide-settings",
    to: "/settings",
  },
]);
</script>
