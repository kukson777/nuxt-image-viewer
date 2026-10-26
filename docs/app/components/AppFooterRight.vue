<script setup lang="ts">
// Docus footer links with the server-rendered colour mode button (ThemeToggle)
const appConfig = useAppConfig()
const { forced: forcedColorMode } = useDocusColorMode()
</script>

<template>
  <UButton
    v-if="appConfig.github?.url"
    :to="appConfig.github.url"
    target="_blank"
    icon="i-simple-icons-github"
    aria-label="GitHub repository"
    color="neutral"
    variant="ghost"
    size="sm"
  />

  <ThemeToggle v-if="!forcedColorMode" />
</template>
