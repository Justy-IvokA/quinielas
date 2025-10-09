/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@qp/ui", "@qp/api", "@qp/branding", "@qp/utils"],
  experimental: {
    optimizePackageImports: ["@qp/ui", "lucide-react"],
  },
};

module.exports = nextConfig;
