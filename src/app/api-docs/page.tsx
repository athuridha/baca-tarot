"use client";
import { ApiReference } from "@scalar/nextjs-api-reference";

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-[#0f0f12]">
      <ApiReference
        configuration={{
          spec: {
            url: "/openapi.json",
          },
          theme: "purple",
          hideModels: false,
          showSidebar: true,
          darkMode: true,
        }}
      />
    </div>
  );
}
