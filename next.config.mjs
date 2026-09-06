/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // libSQL 클라이언트는 네이티브(.node) 바이너리를 포함하므로 번들링 대상에서 제외한다.
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client", "libsql"],
  },
};

export default nextConfig;
