<template>
  <UFormField label="Tags">
    <UInputMenu
      v-model="selectedTags"
      multiple
      :items="allTags"
      value-key="tag"
      create-item
      @create="createTag"
      class="w-full"
    />
  </UFormField>
</template>

<script setup lang="ts">
import type { Tag } from "@saffron/types";
import CreateTag from "./CreateTag.vue";

const props = defineProps<{
  prefillWithTagIds: string[];
}>();

const emit = defineEmits<{
  selectedTags: Tag[];
}>();

const userId = "0";

const tagsApi = useTagsApi();
const listTags = tagsApi.listTags(userId);
const allTags = computed(() => {
  return listTags.tags.value
    .map((tag) => ({
      label: tag.name,
      tag: tag,
    }))
    .sort((a, b) => (a.label < b.label ? -1 : 1));
});

const overlay = useOverlay();
async function createTag(name: string) {
  console.log("Creating tag: ", name);
  const createTagModal = overlay.create(CreateTag, {
    props: {
      prefillName: name,
    },
  });

  const result = (await createTagModal.open()) as { tag?: Tag };
  if (result.tag) {
    console.log("Created tag: ", result.tag);

    // Since a tag was created, we want to refresh the global list of tags to keep everything in sync
    await listTags.refresh();

    // Find the tag in the new list and select it
    const newTagEntry = allTags.value.find(
      (entry) => entry.tag.id === result.tag?.id,
    );

    if (!newTagEntry) {
      console.error("Created tag not found in the list!");
      return;
    }

    selectedTags.value.push(newTagEntry.tag);
  }
}

const selectedTags = ref<Tag[]>(
  props.prefillWithTagIds
    .map((tagId) => {
      const foundTag = listTags.tags.value.find((tag) => tag.id === tagId);

      if (!foundTag) {
        console.log(`Prefilled tag '${tagId}'' not found in the list!`);
      }

      return foundTag;
    })
    .filter((tag): tag is Tag => tag !== undefined),
);

watch(
  selectedTags,
  (newTags) => {
    emit("selectedTags", newTags);
  },
  { immediate: true },
);
</script>
