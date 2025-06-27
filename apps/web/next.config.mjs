/** @type {import('next').NextConfig} */
const nextConfig = {
  // serverExternalPackages: ["@electric-sql/pglite"],
  transpilePackages: ["@workspace/ui"],
  experimental: {
    nodeMiddleware: true,
    nextScriptWorkers: true,
  }
};

export default nextConfig
