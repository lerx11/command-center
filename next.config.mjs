import withSerwist from "@serwist/next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default withSerwist({
  swSrc: path.resolve(__dirname, "app/sw.ts"),
  swDest: path.resolve(__dirname, "public/sw.js"),
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [{ url: "/~offline", revision: "1" }],
})(nextConfig);
