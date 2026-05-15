import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: "@storybook/react-vite",
  viteFinal: async (config) => {
    // Reuse the project's Tailwind + alias config
    return config
  },
}

export default config
