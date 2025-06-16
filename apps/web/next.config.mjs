/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "playwright", "patchright"],
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig
