<template>
  <UContainer class="max-w-xl py-16">
    <UCard v-if="error">
      <template #header>
        <h1 class="text-lg font-semibold">Could not sign in</h1>
      </template>
      <p class="text-muted mb-4 text-sm">{{ error }}</p>
      <UButton label="Try again" @click="retry" />
    </UCard>

    <p v-else class="text-muted text-sm">Signing in…</p>
  </UContainer>
</template>

<script setup lang="ts">
// This page completes the login, so it needs to be public.
definePageMeta({ public: true });

const route = useRoute();
const { completeLogin, login } = useAuth();

const error = ref<string | undefined>();

onMounted(async () => {
  // tsidp reports its own failures here rather than by redirecting elsewhere.
  const denied = route.query.error;
  if (typeof denied === "string") {
    error.value = denied;
    return;
  }

  const code = route.query.code;
  const state = route.query.state;

  if (typeof code !== "string" || typeof state !== "string") {
    error.value = "The sign-in response was missing its code.";
    return;
  }

  try {
    // replace, not push: the callback URL carries a spent authorization code,
    // and leaving it in history means Back re-runs a request that must fail.
    await navigateTo(await completeLogin(code, state), { replace: true });
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
});

function retry() {
  error.value = undefined;
  login();
}
</script>
