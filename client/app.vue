<template>
  <UApp :toaster="toaster">
    <Navigation />
    <ApiBaseGate>
      <!-- Sits inside ApiBaseGate because logging in requires knowing where the API is. -->
      <AuthGate>
        <NuxtPage />
      </AuthGate>
    </ApiBaseGate>
  </UApp>
</template>

<script setup lang="ts">
const toaster = { position: "top-center" as const };
</script>
