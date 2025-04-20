<template>
  <UNavigationMenu :items="items" class="w-full justify-center" />
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

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
]);
</script>
