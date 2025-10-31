const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin(); // "./src/i18n/request.ts"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  transpilePackages: ["@qp/ui", "@qp/branding"],
  serverExternalPackages: [
      "@qp/db",
      "@qp/api", 
      "@qp/auth",
      "@prisma/client",
      "prisma",
      "nodemailer",
    ],
  experimental: {
    optimizePackageImports: ["@qp/ui", "lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer, nextRuntime }) => {
    console.log("🔥 nextRuntime", nextRuntime);
    // ✅ NUEVO: Configuración específica para Edge Runtime (middleware)
    if (nextRuntime === 'edge') {
      // Excluir TODOS los packages que usan Node.js APIs
      config.externals = config.externals || [];
      config.externals.push(
        '@qp/db',
        '@qp/api',
        '@qp/auth',
        '@qp/config',
        '@qp/scoring',
        '@qp/utils',
        '@prisma/client',
        'prisma',
        'nodemailer',
        'firebase-admin',
        'cloudinary',
        '@aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner',
      );
      
      return config;
    }
    // Enable WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Server-side: externalize nodemailer to use the installed version
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('nodemailer');
      }
    }

    // Fallback for node modules in client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        http2: false,
        http: false,
        https: false,
        crypto: false,
        stream: false,
        zlib: false,
        path: false,
        os: false,
        child_process: false,
        dns: false,
        dgram: false,
      };

      // Exclude server-only packages from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-admin': 'commonjs firebase-admin',
        'cloudinary': 'commonjs cloudinary',
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner': 'commonjs @aws-sdk/s3-request-presigner',
        'nodemailer': 'commonjs nodemailer',
      });
    }

    return config;
  },
};

module.exports = withNextIntl(nextConfig);