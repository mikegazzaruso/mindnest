import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: resolve(__dirname, "../.."),
  // Treat these as externals so Next.js doesn't touch them at bundle time —
  // they stay in node_modules and are require()'d at runtime.
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
    "@huggingface/transformers",
    "onnxruntime-node",
    "onnxruntime-common",
    "sharp",
  ],
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
