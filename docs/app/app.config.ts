export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc',
    },
    // Landing backgrounds after nuxt.com: the hero has HeroBackground (a green wash and
    // line under the header), and every section starts with a border and a muted tint
    pageHero: {
      slots: {
        title: 'font-semibold sm:text-6xl text-balance',
        description: 'text-pretty',
      },
    },
    pageSection: {
      slots: {
        root: 'border-t border-default bg-linear-to-b from-muted to-default dark:from-muted/40',
      },
    },
    pageCard: {
      slots: {
        footer: 'w-full',
      },
    },
  },
  seo: {
    title: 'Nuxt Image Viewer',
    description: 'Full-screen image viewer for Nuxt: opens from the image on the page, swipe, endless strip, pinch and wheel zoom, drag to close. No dependencies besides Nuxt.',
  },
  header: {
    title: 'Nuxt Image Viewer',
  },
  github: {
    url: 'https://github.com/kukson777/nuxt-image-viewer',
    branch: 'main',
    rootDir: 'docs',
  },
  toc: {
    title: 'On this page',
    bottom: {
      title: 'Links',
      links: [
        {
          icon: 'i-simple-icons-github',
          label: 'Source on GitHub',
          to: 'https://github.com/kukson777/nuxt-image-viewer',
          target: '_blank',
        },
        {
          icon: 'i-simple-icons-npm',
          label: 'Package on npm',
          to: 'https://www.npmjs.com/package/nuxt-image-viewer',
          target: '_blank',
        },
        {
          icon: 'i-lucide-bot',
          label: 'llms.txt',
          to: '/llms.txt',
          target: '_blank',
        },
      ],
    },
  },
})
