import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      // DGTL OS system map — a static single-file page in public/os/.
      // Without this, only /os/index.html resolves (/os 404s).
      { source: "/os", destination: "/os/index.html" }
    ];
  }
};

export default nextConfig;
