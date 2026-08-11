<!-- Starts the login flow when there is no token. -->
<template>
  <slot v-if="isAuthenticated || isPublic" />

  <UContainer v-else class="max-w-xl py-16">
    <UCard v-if="error">
      <template #header>
        <h1 class="text-lg font-semibold">Could not sign in</h1>
      </template>
      <p class="text-muted mb-4 text-sm">{{ error }}</p>
      <div class="flex gap-2">
        <UButton label="Try again" @click="start" />
        <UButton
          color="neutral"
          variant="ghost"
          label="Change server address"
          to="/settings"
        />
      </div>
    </UCard>

    <p v-else class="text-muted text-sm">Signing in…</p>
  </UContainer>
</template>

<script setup lang="ts">
const route = useRoute();
const { isAuthenticated, authError, login } = useAuth();

const localError = ref<string | undefined>();

// authError comes from the fetch interceptor, which has no UI of its own: it is
// set when the API rejects a freshly issued token and retrying cannot help.
const error = computed(() => localError.value ?? authError.value ?? undefined);

const isPublic = computed(() => route.meta.public === true);

// Short-circuit on error to prevent redirect loops.
async function start() {
  localError.value = undefined;
  authError.value = null;
  try {
    await login();
  } catch (caught) {
    localError.value =
      caught instanceof Error ? caught.message : String(caught);
  }
}

onMounted(() => {
  if (!isAuthenticated.value && !isPublic.value && !error.value) start();
});

// Navigating from the error state to a public route and back should retry rather
// than leave the failure on screen.
watch(isPublic, (nowPublic) => {
  if (!nowPublic && !isAuthenticated.value && !error.value) start();
});
</script>
