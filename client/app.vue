<template>
  <UApp :toaster="toaster">
    <Navigation />
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
const toaster = { position: "top-center" as const };
</script>
