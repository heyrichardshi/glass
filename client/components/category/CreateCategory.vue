<template>
  <UModal title="Create a Category" :close="{ onClick: () => close() }">
    <template #body>
      <div class="grid grid-cols-1 gap-4">
        <UFormField label="Name">
          <UInput v-model="name" />
        </UFormField>

        <UCheckbox
          label="Nest under the following category:"
          v-model="enableNesting"
        />

        <CategoryMenu
          :disabled="!enableNesting"
          hideLabel
          @selectedCategory="selectedCategory"
        />

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
import type { Category } from "@saffron/types";
import CategoryMenu from "./CategoryMenu.vue";

const props = defineProps<{
  prefillName: string;
}>();

const emit = defineEmits<{
  close: [{ category?: Category }];
}>();

const name = ref(props.prefillName);
const enableNesting = ref(false);

const parentCategory = ref<Category | undefined>(undefined);
function selectedCategory(category: Category | undefined) {
  parentCategory.value = category;
}

const userId = "0";

const toast = useToast();

const categoriesApi = useCategoriesApi();

const requestInProgress = ref(false);
const submitErrorMessage = ref("");
const submitError = computed(() => !!submitErrorMessage.value);

function close() {
  emit("close", {});
}

function submit() {
  const createCategory = categoriesApi.createCategory(
    userId,
    name.value,
    parentCategory.value?.id,
  );

  watch(
    createCategory.status,
    (status) => {
      if (status === "success") {
        toast.add({
          title: `Created category "${name.value}"!`,
          color: "success",
          icon: "i-lucide-sparkles",
        });
        emit("close", { category: createCategory.category.value });
      } else if (status === "error") {
        // Pipe the error message to the ref controlling the alert
        submitErrorMessage.value =
          createCategory.errorMessage.value || "An unknown error occurred.";
      }

      // Disable the "Create" button while the request is in progress
      requestInProgress.value = status === "pending";
    },
    { immediate: true },
  );
}
</script>
