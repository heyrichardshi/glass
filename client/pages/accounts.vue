<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Accounts</h1>

      <div class="flex items-center gap-2">
        <UButton
          v-if="!loading && refreshableAccounts.length > 0"
          :loading="refreshingAll"
          :disabled="refreshingAll"
          icon="i-lucide-refresh-cw"
          @click="refreshAllAccounts"
        >
          Refresh all accounts
        </UButton>

        <PlaidLink @connected="refresh" />
      </div>
    </div>

    <div v-if="loading">Loading accounts...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="accounts.length === 0">
      <p class="text-gray-500">
        No accounts found. Connect an account to get started.
      </p>
    </div>
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
import type { Account } from "@glass/types";
import useListAccounts from "~/composables/api/accounts/useListAccounts";

const config = useRuntimeConfig();
const userId = "0";

const { accounts, status, refresh } = useListAccounts(userId);
const refreshingAll = ref(false);
const toast = useToast();

const loading = computed(() => status.value === "pending");
const error = computed(() =>
  status.value === "error" ? "Error loading accounts" : "",
);
const refreshableAccounts = computed(() =>
  accounts.value.filter((account) => account.status === "open"),
);

async function refreshAllAccounts() {
  if (refreshingAll.value) return;

  refreshingAll.value = true;

  try {
    // Refresh each account individually using the existing endpoint with a 1s delay between calls
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (const account of refreshableAccounts.value) {
      try {
        await $fetch(
          `${config.public.GLASS_API_URL}/accounts/${account.id}/refresh`,
          {
            method: "POST",
            server: false,
          },
        );
        console.log(`Successfully refreshed account ${account.id}`);
      } catch (err: any) {
        console.error(`Failed to refresh account ${account.id}:`, err);
        // Continue with other accounts even if one fails
      }
      await delay(1500);
    }

    // Refresh the accounts list to show updated data
    await refresh();

    toast.add({
      title: "Success",
      description: "All accounts refreshed successfully",
      color: "success",
    });
  } catch (err: any) {
    toast.add({
      title: "Error",
      description: `Failed to refresh accounts: ${err.message}`,
      color: "error",
    });
  } finally {
    refreshingAll.value = false;
  }
}
</script>
