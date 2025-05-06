<template>
  <UBadge :label="name" color="neutral" variant="outline" class="mx-0.5" />
</template>

<script setup lang="ts">
const props = defineProps<{
  tagId: string;
}>();

const userId = "0";

const tagsApi = useTagsApi();
const listTags = tagsApi.listTags(userId);

const name = computed(() => {
  const tag = listTags.tags.value.find((tag) => tag.id === props.tagId);
  return tag?.name || "Unknown Tag";
});
</script>
