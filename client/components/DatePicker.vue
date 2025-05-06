<template>
  <UFormField label="Date">
    <UPopover>
      <UButton
        color="neutral"
        variant="subtle"
        icon="i-lucide-calendar"
        :label="selectedDateDisplayString"
      />

      <template #content>
        <UCalendar v-model="selectedDate" class="p-2" />
      </template>
    </UPopover>
  </UFormField>
</template>

<script setup lang="ts">
import { CalendarDate } from "@internationalized/date";

const props = defineProps<{
  prefillWithDate?: string;
}>();

const emit = defineEmits<{
  /**
   * Of the form `yyyy-MM-dd`, e.g. `2025-01-31`.
   */
  selectedDate: [string];
}>();

const utcDate = computed(() => new Date(props.prefillWithDate || Date.now()));

const selectedDate = shallowRef(
  new CalendarDate(
    utcDate.value.getUTCFullYear(),
    utcDate.value.getUTCMonth() + 1,
    utcDate.value.getUTCDate(),
  ),
);

const selectedDateIsoFormat = computed(() => {
  const year = selectedDate.value.year.toString();
  const month = selectedDate.value.month.toString().padStart(2, "0");
  const day = selectedDate.value.day.toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
});

const selectedDateDisplayString = computed(() =>
  formatDisplayDate(selectedDateIsoFormat.value),
);

watch(
  selectedDateIsoFormat,
  (newDate) => {
    emit("selectedDate", newDate);
  },
  { immediate: true },
);
</script>
