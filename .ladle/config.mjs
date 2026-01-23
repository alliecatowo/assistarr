/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: "components/**/*.stories.{ts,tsx}",
  outDir: "build-ladle",
  defaultStory: "ui--button--default",
  addons: {
    theme: {
      enabled: true,
      defaultState: "light",
    },
    mode: {
      enabled: true,
      defaultState: "full",
    },
    rtl: {
      enabled: true,
      defaultState: false,
    },
    width: {
      enabled: true,
      options: {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
      },
      defaultState: 0, // Full width
    },
  },
  viteConfig: ".ladle/vite.config.ts",
};
