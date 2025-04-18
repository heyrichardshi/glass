<template>
  <div
    class="rounded-xl p-4 shadow mb-3 border border-gray-200 grid grid-cols-2"
  >
    <div class="text-lg font-semibold">
      {{ account.name }} ({{ account.mask }})
    </div>
    <div class="text-lg font-semibold text-right">$ {{ account.balance }}</div>

    <div class="text-sm text-gray-500">
      {{ account.institution }} / {{ account.type }}
    </div>
    <div class="text-sm text-gray-500 text-right">
      last refreshed {{ lastRefreshedAt }}
      <UButton icon="i-lucide-refresh-cw" @click="refreshAccount()"></UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Account } from "@saffron/types";

const props = defineProps<{
  account: Account;
}>();

const lastRefreshedAt = ref<string>(
  toRelativeDate(props.account.transactionsLastRefreshedAt),
);

const toast = useToast();

function toRelativeDate(date: Date | string | number): string {
  date = new Date(date);
  const epoch = new Date(0);
  if (date.getTime() === epoch.getTime()) {
    return "never";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const msInHour = 1000 * 60 * 60;
  const msInDay = msInHour * 24;
  const msInYear = msInDay * 365;

  if (diffMs > msInYear) {
    return "over a year ago";
  }

  const isToday = now.toDateString() === date.toDateString();

  if (isToday) {
    const hoursAgo = Math.floor(diffMs / msInHour);
    return `${hoursAgo} hour${hoursAgo !== 1 ? "s" : ""} ago`;
  } else {
    const daysAgo = Math.floor(diffMs / msInDay);
    return `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
  }
}

function refreshAccount() {
  toast.add({
    title: `Getting new transactions for account ${props.account.name}`,
  });

  const config = useRuntimeConfig();

  useFetch(
    () =>
      `${config.public.SAFFRON_API_URL}/accounts/${props.account.id}/refresh`,
    {
      method: "POST",
      server: false,
      onResponse({ response }) {
        console.log("Account refreshed successfully", response);
        lastRefreshedAt.value = toRelativeDate(Date.now());
        toast.add({
          title: `Successfully refreshed account ${props.account.name}`,
          color: "success",
        });
      },
      onRequestError({ error: err }) {
        console.error("Error refreshing account", err);
        toast.add({
          title: "Something went wrong",
          description: `Error refreshing account ${props.account.name}: ${err.message}`,
          color: "error",
        });
      },
    },
  );
}

// TODO: Detect when account is unhealthy, call teller connect with enrollment id to fix.
</script>
