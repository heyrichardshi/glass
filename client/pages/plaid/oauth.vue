<template>
  <UContainer class="max-w-xl py-16">
    <UCard v-if="error">
      <template #header>
        <h1 class="text-lg font-semibold">Could not finish connecting</h1>
      </template>
      <p class="text-muted mb-4 text-sm">{{ error }}</p>
      <UButton label="Back to accounts" to="/accounts" />
    </UCard>

    <p v-else class="text-muted text-sm">Finishing connection…</p>
  </UContainer>
</template>

<script setup lang="ts">
const error = ref<string | undefined>();

const { waitForPlaid, resume } = usePlaidLink({
  onFinished: () => navigateTo("/accounts", { replace: true }),
});

onMounted(async () => {
  if (!(await waitForPlaid())) {
    error.value = "Plaid Link did not load.";
    return;
  }

  if (!resume(window.location.href)) {
    error.value =
      "No Plaid Link session is waiting to be resumed. Start again from Accounts.";
  }
});
</script>
