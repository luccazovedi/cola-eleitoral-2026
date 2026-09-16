import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isGitHubPages ? "export" : undefined,
  basePath: isGitHubPages ? "/cola-eleitoral-2026" : undefined,
  assetPrefix: isGitHubPages ? "/cola-eleitoral-2026/" : undefined,
  trailingSlash: isGitHubPages,
  images: {
    unoptimized: isGitHubPages,
  },
};

export default nextConfig;
