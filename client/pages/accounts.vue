<template>
  <TellerConnect />
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Accounts</h1>

    <div v-if="loading">Loading accounts...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <AccountItem
        v-for="account in accounts"
        :key="account.id"
        :account="account"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Account } from "@saffron/types";

const config = useRuntimeConfig();
const userId = 0;

const accounts = ref<Account[]>([]);
const loading = ref(true);
const error = ref("");

useFetch(() => `${config.public.SAFFRON_API_URL}/accounts`, {
  query: { userId },
  server: false,
  onResponse({ response }) {
    accounts.value = response._data.accounts;
    loading.value = false;
  },
  onRequestError({ error: err }) {
    loading.value = false;
    error.value = `Error loading accounts: ${err.message}`;
  },
});
</script>
