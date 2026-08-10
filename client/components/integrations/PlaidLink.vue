<template>
  <UButton
    v-if="isPlaidLoaded"
    :loading="linking"
    :disabled="linking"
    :icon="buttonIcon"
    @click="openPlaidLink()"
  >
    {{ buttonText }}
  </UButton>
</template>

<script setup lang="ts">
import type {
  ConnectionTokenResponse,
  RegisterAccountsResponse,
} from "@glass/types/schemas";

// Plaid Link is loaded from the CDN (see nuxt.config app.head).
declare global {
  const Plaid: {
    create: (config: any) => { open: () => void; exit: () => void };
  };
}

const props = withDefaults(
  defineProps<{
    buttonText?: string;
    buttonIcon?: string;
  }>(),
  {
    buttonText: "Connect an account",
    buttonIcon: "i-lucide-link",
  },
);

const emit = defineEmits<{ connected: [] }>();

const config = useRuntimeConfig();
const toast = useToast();

const isPlaidLoaded = ref(false);
const linking = ref(false);

onMounted(async () => {
  // Wait briefly for the Plaid Link script (loaded via app.head) to become available.
  for (let i = 0; i < 20 && typeof Plaid === "undefined"; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  isPlaidLoaded.value = typeof Plaid !== "undefined";
});

async function openPlaidLink() {
  if (linking.value) return;
  linking.value = true;

  try {
    const { connectionToken } = await $fetch<ConnectionTokenResponse>(
      `${config.public.GLASS_API_URL}/accounts/register/token`,
      { method: "POST" },
    );

    const handler = Plaid.create({
      token: connectionToken,
      onSuccess: async (publicToken: string) => {
        await exchange(publicToken);
      },
      onExit: (err: unknown) => {
        if (err) console.error("Plaid Link exited with error:", err);
      },
    });
    handler.open();
  } catch (err: any) {
    toast.add({
      title: "Something went wrong",
      description: `Could not start Plaid Link: ${err.message}`,
      color: "error",
    });
  } finally {
    linking.value = false;
  }
}

async function exchange(publicToken: string) {
  try {
    const res = await $fetch<RegisterAccountsResponse>(
      `${config.public.GLASS_API_URL}/accounts/register`,
      { method: "POST", body: { exchangeToken: publicToken } },
    );
    toast.add({
      title: `Successfully added ${res.accountsRegisteredCount} account(s)`,
      color: "success",
    });
    emit("connected");
  } catch (err: any) {
    toast.add({
      title: "Something went wrong",
      description: `Error adding accounts: ${err.message}`,
      color: "error",
    });
  }
}
</script>
