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

const toast = useToast();
const { waitForPlaid, start } = usePlaidLink({
  onConnected: () => emit("connected"),
});

const isPlaidLoaded = ref(false);
const linking = ref(false);

onMounted(async () => {
  isPlaidLoaded.value = await waitForPlaid();
});

async function openPlaidLink() {
  if (linking.value) return;
  linking.value = true;

  try {
    await start();
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
</script>
