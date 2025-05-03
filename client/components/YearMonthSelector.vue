<template>
  <UPopover arrow>
    <UButton :label="selectionText" color="neutral" variant="outline" />

    <template #content>
      <div class="grid grid-cols-1 gap-2 p-2">
        <UInputNumber
          v-model="year"
          variant="ghost"
          color="neutral"
          :format-options="{
            useGrouping: false,
          }"
          increment-icon="i-lucide-chevron-right"
          decrement-icon="i-lucide-chevron-left"
        />

        <URadioGroup
          indicator="hidden"
          orientation="horizontal"
          variant="card"
          v-model="monthRow1"
          :items="monthsRow1"
        />
        <URadioGroup
          indicator="hidden"
          orientation="horizontal"
          variant="card"
          v-model="monthRow2"
          :items="monthsRow2"
        />
        <URadioGroup
          indicator="hidden"
          orientation="horizontal"
          variant="card"
          v-model="monthRow3"
          :items="monthsRow3"
        />
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import type { RadioGroupItem } from "@nuxt/ui";

const emit = defineEmits<{
  selection: [{ year: string; month: string }];
}>();

const now = new Date(Date.now());
const thisYear = now.getFullYear();
const thisMonth = now.getMonth() + 1; // month is 0-indexed

const year = ref(thisYear);
const month = ref(thisMonth);

// Create the entire set of radio group items
const months = ref<RadioGroupItem[]>(
  Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(thisYear, i, 2)); // Use date = 2 to avoid timezone issues
    return {
      label: date.toLocaleString("en-US", { month: "short" }),
      value: i + 1,
    };
  }),
);

// Slice into 3 groups since we want the months displayed in a 3 x 4 grid
const monthsRow1 = computed(() => {
  return months.value.slice(0, 4);
});
const monthsRow2 = computed(() => {
  return months.value.slice(4, 8);
});
const monthsRow3 = computed(() => {
  return months.value.slice(8);
});

// Set initial selection based on current month
const monthRow1 = ref(thisMonth <= 4 ? thisMonth : undefined);
const monthRow2 = ref(thisMonth > 4 && thisMonth <= 8 ? thisMonth : undefined);
const monthRow3 = ref(thisMonth > 8 ? thisMonth : undefined);

// Any time a month in one group is selected, deselect any other groups.
watch(
  monthRow1,
  (newMonth) => {
    if (newMonth !== undefined) {
      monthRow2.value = undefined;
      monthRow3.value = undefined;
      month.value = newMonth;
    }
  },
  { immediate: true },
);
watch(
  monthRow2,
  (newMonth) => {
    if (newMonth !== undefined) {
      monthRow1.value = undefined;
      monthRow3.value = undefined;
      month.value = newMonth;
    }
  },
  { immediate: true },
);
watch(
  monthRow3,
  (newMonth) => {
    if (newMonth !== undefined) {
      monthRow1.value = undefined;
      monthRow2.value = undefined;
      month.value = newMonth;
    }
  },
  { immediate: true },
);

const selectionText = computed(() => {
  const date = new Date(Date.UTC(year.value, month.value - 1, 2));
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
});

watch(
  selectionText,
  () => {
    emit("selection", {
      year: year.value.toString(),
      month: month.value.toString().padStart(2, "0"),
    });
  },
  { immediate: true },
);
</script>
