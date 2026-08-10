<template>
  <UContainer class="max-w-xl py-8">
    <h1 class="mb-6 text-xl font-semibold">Settings</h1>

    <UCard>
      <template #header>
        <h2 class="font-medium">Server</h2>
      </template>

      <p class="text-muted mb-4 text-sm">
        The address of your Glass API. Stored in this browser only.
      </p>

      <ApiBaseForm @saved="onSaved">
        <template #actions>
          <UButton
            color="neutral"
            variant="ghost"
            label="Forget"
            @click="onForget"
          />
        </template>
      </ApiBaseForm>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
const { clearApiBase } = useApiBase();
const toast = useToast();

// Reloading rather than reactively swapping: cached useFetch results belong to
// the old server and would otherwise be shown as if they came from the new one.
function onSaved() {
  toast.add({ title: "Server address saved", color: "success" });
  if (import.meta.client) window.location.reload();
}

function onForget() {
  clearApiBase();
  if (import.meta.client) window.location.reload();
}
</script>
