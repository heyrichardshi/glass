<template>
  <UBadge
    :label="label"
    :icon="isHovered ? 'i-lucide-x' : icon"
    color="neutral"
    variant="outline"
    class="mx-0.5 cursor-pointer"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="onClick"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string;
  label: string;
}>();

const emit = defineEmits<{
  remove: [];
}>();

function onClick() {
  emit("remove");
}

const isHovered = ref(false);
</script>
