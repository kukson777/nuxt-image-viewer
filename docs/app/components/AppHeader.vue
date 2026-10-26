<script setup lang="ts">
// Docus header with a server-rendered colour mode button (ThemeToggle) instead of a
// client-only one with a placeholder. Otherwise the same as docus/app/components/app/AppHeader.vue
const appConfig = useAppConfig()
const { forced: forcedColorMode } = useDocusColorMode()
const { isEnabled: isAssistantEnabled } = useAssistant()
const { subNavigationMode } = useSubNavigation()

const links = computed(() => appConfig.github && appConfig.github.url
  ? [
      {
        'icon': 'i-simple-icons-github',
        'to': appConfig.github.url,
        'target': '_blank',
        'aria-label': 'GitHub',
      },
    ]
  : [])
</script>

<template>
  <UHeader
    :ui="{ center: 'flex-1' }"
    :class="{ 'flex flex-col': subNavigationMode === 'header' }"
  >
    <AppHeaderCenter />

    <template #left>
      <AppHeaderLeft />
    </template>

    <template #right>
      <template v-if="isAssistantEnabled">
        <LazyAssistantChat />
      </template>

      <UContentSearchButton class="lg:hidden" />

      <ThemeToggle v-if="!forcedColorMode" />

      <UButton
        v-for="(link, index) of links"
        :key="index"
        v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
      />
    </template>

    <template #toggle="{ open, toggle }">
      <IconMenuToggle
        :open="open"
        class="lg:hidden"
        @click="toggle"
      />
    </template>

    <template #body>
      <AppHeaderBody />
    </template>

    <template
      v-if="subNavigationMode === 'header'"
      #bottom
    >
      <LazyAppHeaderBottom />
    </template>
  </UHeader>
</template>
