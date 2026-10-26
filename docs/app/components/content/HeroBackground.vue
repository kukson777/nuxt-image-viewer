<template>
  <svg
    viewBox="0 0 1440 181"
    fill="none"
    aria-hidden="true"
    class="pointer-events-none absolute inset-x-0 -top-px -z-10 w-full text-primary"
  >
    <mask
      id="hero-background-edge"
      fill="white"
    >
      <path d="M0 0H1440V181H0V0Z" />
    </mask>

    <path
      d="M0 0H1440V181H0V0Z"
      fill="url(#hero-background-wash)"
      fill-opacity="0.22"
    />

    <path
      d="M0 2H1440V-2H0V2Z"
      fill="url(#hero-background-line)"
      mask="url(#hero-background-edge)"
    />

    <defs>
      <linearGradient
        id="hero-background-wash"
        x1="720"
        y1="0"
        x2="720"
        y2="181"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="currentColor" />

        <stop
          offset="1"
          stop-color="currentColor"
          stop-opacity="0"
        />
      </linearGradient>

      <linearGradient
        id="hero-background-line"
        x1="0"
        y1="90.5"
        x2="1440"
        y2="90.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop
          stop-color="currentColor"
          stop-opacity="0"
        />

        <stop
          offset="0.395"
          stop-color="currentColor"
        />

        <stop
          offset="1"
          stop-color="currentColor"
          stop-opacity="0"
        />
      </linearGradient>
    </defs>
  </svg>
</template>
