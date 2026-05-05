import { ApiReference } from "@scalar/nextjs-api-reference";

const config = {
  spec: {
    url: "/openapi.json",
  },
  theme: "purple",
  darkMode: true,
} as const;

export const GET = ApiReference(config);
