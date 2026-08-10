<template>
  <form class="flex flex-col gap-3" @submit.prevent="onSubmit">
    <UFormField
      label="API base URL"
      name="apiBase"
      :error="error"
      help="For example https://glass.your-tailnet.ts.net"
    >
      <UInput
        v-model="value"
        :autofocus="autofocus"
        placeholder="https://glass.your-tailnet.ts.net"
        class="w-full"
        @update:model-value="error = undefined"
      />
    </UFormField>

    <div class="flex gap-2">
      <UButton type="submit" :label="submitLabel" />
      <slot name="actions" />
    </div>
  </form>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ autofocus?: boolean; submitLabel?: string }>(), {
  autofocus: false,
  submitLabel: "Save",
});

const emit = defineEmits<{ saved: [url: string] }>();

const { apiBase, suggestion, setApiBase } = useApiBase();

// Falls back to the build-time value as a starting point only, so development
// against localhost stays one keystroke away.
const value = ref(apiBase.value || suggestion);
const error = ref<string | undefined>();

function onSubmit() {
  if (!isValidApiBase(value.value)) {
    error.value = "Enter a full URL, including https://";
    return;
  }

  setApiBase(value.value);
  emit("saved", value.value);
}
</script>
