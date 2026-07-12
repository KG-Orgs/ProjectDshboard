// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@contractor/shared", "framer-motion"],
  swcMinify: true,
  experimental: {
    optimizePackageImports: ["@contractor/shared"],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
