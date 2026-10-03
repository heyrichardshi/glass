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

const { isAuthenticated } = useAuth();
const { retryPendingRegistration } = usePlaidLink({
  onConnected: () => refreshNuxtData("ListAccounts"),
});

// Gated on a token: a 401 from here would start another sign-in.
watch(
  isAuthenticated,
  (authenticated) => {
    if (authenticated) retryPendingRegistration();
  },
  { immediate: true },
);
</script>
