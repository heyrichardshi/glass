<template>
  <div v-if="!hidden">
    <UNavigationMenu
      :items="items"
      class="hidden w-full justify-center md:flex"
    />

    <div
      class="flex items-center justify-between border-b border-default px-4 py-2 md:hidden"
    >
      <div class="flex min-w-0 items-center gap-2 font-medium">
        <UIcon
          v-if="activeItem"
          :name="activeItem.icon"
          class="size-5 shrink-0 text-muted"
        />
        <span class="truncate">{{ activeItem?.label ?? "Navigation" }}</span>
      </div>

      <UPopover
        v-model:open="mobileMenuOpen"
        :content="{ side: 'bottom', align: 'end' }"
      >
        <UButton
          label="Menu"
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
        />

        <template #content>
          <div class="w-56 p-2">
            <NuxtLink
              v-for="item in items"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-elevated"
              :class="
                isActive(item.to)
                  ? 'bg-elevated text-highlighted'
                  : 'text-muted'
              "
              @click="mobileMenuOpen = false"
            >
              <UIcon :name="item.icon" class="size-5 shrink-0" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </div>
        </template>
      </UPopover>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const hidden = computed(() => route.path === "/enroll");
const mobileMenuOpen = ref(false);

type AppNavigationItem = NavigationMenuItem & {
  label: string;
  icon: string;
  to: string;
};

const items = ref<AppNavigationItem[]>([
  {
    label: "Transactions",
    icon: "i-lucide-credit-card",
    to: "/",
  },
  {
    label: "Tasks",
    icon: "i-lucide-inbox",
    to: "/tasks",
  },
  {
    label: "Accounts",
    icon: "i-lucide-landmark",
    to: "/accounts",
  },
  {
    label: "Merchants",
    icon: "i-lucide-store",
    to: "/merchants",
  },
  {
    label: "Reports",
    icon: "i-lucide-file-chart-pie",
    to: "/report",
  },
  {
    label: "Settings",
    icon: "i-lucide-settings",
    to: "/settings",
  },
]);

function isActive(path: string) {
  return path === "/"
    ? route.path === path
    : route.path === path || route.path.startsWith(`${path}/`);
}

const activeItem = computed(() =>
  items.value.find((item) => isActive(item.to)),
);
</script>
