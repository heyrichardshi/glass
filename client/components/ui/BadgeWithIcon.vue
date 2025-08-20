<template>
  <UBadge
    :label="label"
    :icon="icon"
    color="neutral"
    variant="outline"
    class="mx-0.5"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string;
  label: string;
}>();
</script>
