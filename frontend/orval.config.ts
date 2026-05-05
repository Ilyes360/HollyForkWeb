import { defineConfig } from "orval"

export default defineConfig({
  hollyFork: {
    input: {
      target: "./docs/api/openapi.json",
    },
    output: {
      target: "./src/api/generated/endpoints",
      schemas: "./src/api/generated/schemas",
      mode: "tags-split",
      client: "react-query",
      override: {
        mutator: {
          path: "./src/api/mutator.ts",
          name: "kyMutator",
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
      mock: {
        type: "msw",
        useExamples: true,
      },
    },
  },
})
