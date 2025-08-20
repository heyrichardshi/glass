<template>
  <UModal title="Create a Tag" :close="{ onClick: () => close() }">
    <template #body>
      <div class="grid grid-cols-1 gap-4">
        <UFormField label="Name">
          <UInput v-model="name" />
        </UFormField>

        <UAlert color="error" :title="submitErrorMessage" v-if="submitError" />
      </div>
    </template>
    <template #footer>
      <div class="flex gap-2 justify-between w-full">
        <UButton color="neutral" label="Cancel" @click="close" />
        <UButton label="Create" @click="submit" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Tag } from "@saffron/types";

const props = defineProps<{
  prefillName: string;
}>();

const emit = defineEmits<{
  close: [{ tag?: Tag }];
}>();

const name = ref(props.prefillName);

const userId = "0";

const toast = useToast();

const tagsApi = useTagsApi();

const requestInProgress = ref(false);
const submitErrorMessage = ref("");
const submitError = computed(() => !!submitErrorMessage.value);

function close() {
  emit("close", {});
}

function submit() {
  const createTag = tagsApi.createTag(userId, name.value);

  watch(
    createTag.status,
    (status) => {
      if (status === "success") {
        toast.add({
          title: `Created tag "${name.value}"!`,
          color: "success",
          icon: "i-lucide-sparkles",
        });
        emit("close", { tag: createTag.tag.value });
      } else if (status === "error") {
        // Pipe the error message to the ref controlling the alert
        submitErrorMessage.value =
          createTag.errorMessage.value || "An unknown error occurred.";
      }

      // Disable the "Create" button while the request is in progress
      requestInProgress.value = status === "pending";
    },
    { immediate: true },
  );
}
</script>
