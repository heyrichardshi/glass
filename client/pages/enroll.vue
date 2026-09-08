<template>
  <UContainer class="max-w-xl py-16">
    <UCard>
      <template #header>
        <h1 class="text-lg font-semibold">Choose an account</h1>
      </template>

      <p class="text-muted mb-6 text-sm">
        This identity is not linked to a Glass account yet.
        Create a new one, or link it to an account you already have.
      </p>

      <div class="grid grid-cols-1 gap-4">
        <UFormField label="Display name" required>
          <UInput
            v-model="name"
            placeholder="Your name"
            autofocus
            :disabled="busy"
            @keydown.enter="create"
          />
        </UFormField>

        <UButton
          label="Create account"
          :loading="creating"
          :disabled="busy || !name.trim()"
          @click="create"
        />
      </div>

      <template v-if="existing.length > 0">
        <p class="text-muted my-6 text-center text-xs">or</p>

        <p class="text-muted mb-3 text-sm">Attach this identity to:</p>
        <div class="grid grid-cols-1 gap-2">
          <UButton
            v-for="user in existing"
            :key="user.id"
            :label="user.name"
            color="neutral"
            variant="outline"
            :disabled="busy"
            :loading="attachingId === user.id"
            @click="attach(user)"
          />
        </div>
      </template>

      <UAlert v-if="error" class="mt-6" color="error" :title="error" />
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import type {
  AttachIdentityResponse,
  CreateUserResponse,
  ListUsersResponse,
  User,
} from "@glass/types";

const { apiBase } = useApiBase();
const toast = useToast();

const name = ref("");
const existing = ref<User[]>([]);
const creating = ref(false);
const attachingId = ref<string | null>(null);
const error = ref<string | undefined>();

const busy = computed(() => creating.value || attachingId.value !== null);

onMounted(async () => {
  try {
    const listed = await $fetch<ListUsersResponse>(`${apiBase.value}/users`);
    existing.value = listed.users;
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Could not load accounts.";
  }
});

async function create() {
  const trimmed = name.value.trim();
  if (!trimmed || busy.value) return;

  creating.value = true;
  error.value = undefined;
  try {
    await $fetch<CreateUserResponse>(`${apiBase.value}/users`, {
      method: "POST",
      body: { name: trimmed },
    });
    toast.add({ title: "Account created", color: "success" });
    await navigateTo("/", { replace: true });
  } catch (caught) {
    error.value =
      (caught as { data?: { message?: string } })?.data?.message ??
      (caught instanceof Error
        ? caught.message
        : "Could not create an account.");
  } finally {
    creating.value = false;
  }
}

async function attach(user: User) {
  if (busy.value) return;

  attachingId.value = user.id;
  error.value = undefined;
  try {
    await $fetch<AttachIdentityResponse>(
      `${apiBase.value}/users/${user.id}/identities`,
      { method: "POST" },
    );
    toast.add({
      title: `Linked to ${user.name}`,
      color: "success",
    });
    await navigateTo("/", { replace: true });
  } catch (caught) {
    error.value =
      (caught as { data?: { message?: string } })?.data?.message ??
      (caught instanceof Error
        ? caught.message
        : "Could not attach this identity.");
  } finally {
    attachingId.value = null;
  }
}
</script>
