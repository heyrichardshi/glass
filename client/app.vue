<template>
  <UApp :toaster="toaster">
    <Navigation />
    <ApiBaseGate>
      <NuxtPage />
    </ApiBaseGate>
  </UApp>
</template>

<script setup lang="ts">
const toaster = { position: "top-center" as const };
</script>
