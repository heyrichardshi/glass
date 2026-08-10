<!--
  Blocks the app until an API address is known.

  Nothing below this renders without one, so every API composable can read
  apiBase at setup time and assume it is populated.
-->
<template>
  <slot v-if="isConfigured" />

  <UContainer v-else class="max-w-xl py-16">
    <UCard>
      <template #header>
        <h1 class="text-lg font-semibold">Connect to your server</h1>
      </template>

      <p class="text-muted mb-4 text-sm">
        Glass keeps your data on a server you run. Enter its address to
        continue — it is stored in this browser only, and never sent anywhere
        else.
      </p>

      <ApiBaseForm autofocus submit-label="Connect" @saved="onSaved" />
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
const { isConfigured } = useApiBase();

// A full reload rather than letting the slot swap in: the API composables read
// the address once at setup, and useFetch caches by key, so previously mounted
// pages would otherwise hold a stale base URL.
function onSaved() {
  if (import.meta.client) window.location.reload();
}
</script>
