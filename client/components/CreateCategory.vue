<template>
  <UModal
    title="Create a Category"
    :close="{ onClick: () => emit('close', false) }"
  >
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
          @selectedCategory="test"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex gap-2 justify-between w-full">
        <UButton color="neutral" label="Cancel" @click="emit('close', false)" />
        <UButton label="Create" @click="emit('close', true)" />
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

const emit = defineEmits<{ close: [boolean] }>();

const name = ref(props.prefillName);
const enableNesting = ref(false);

function test(category: Category | undefined) {
  console.log("Selected category from parent component: ", category);
}
</script>
