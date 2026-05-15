import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow unused vars/args prefixed with _ (common pattern for required callback signatures)
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],
      // Downgraded to warn: many existing <div onClick> patterns in the codebase.
      // TODO: progressively convert to <button> or add role+keyboard handlers.
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      // autoFocus is intentional in modal/dialog UIs for better UX.
      "jsx-a11y/no-autofocus": "warn",
      // label-has-associated-control: many form patterns use shadcn FormField
      // which wires labels via context, not htmlFor. Warn until we audit all forms.
      "jsx-a11y/label-has-associated-control": ["warn", {
        controlComponents: ["Input", "InputGroupInput", "Textarea", "Select"],
        labelComponents: ["Label"],
        depth: 3,
        assert: "either",
      }],
    },
  },
  {
    // UI primitives, context providers, layout/nav files export both components and
    // non-component values (variants, hooks, constants). This is expected — disable
    // react-refresh/only-export-components for these paths.
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/**/+(*-context|*-provider).tsx',
      'src/components/layout/**/*.{ts,tsx}',
      'src/components/salle/snap-guides.tsx',
      'src/pages/admin/index.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Ignore generated files + test utils + public assets
    ignores: [
      'src/api/generated/**',
      'src/routeTree.gen.ts',
      'public/mockServiceWorker.js',
    ],
  },
])
