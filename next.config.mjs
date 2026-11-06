/** @type {import('next').NextConfig} */
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 100);

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    // better-sqlite3 is a native module and must not be bundled.
    serverComponentsExternalPackages: ['better-sqlite3'],
    serverActions: {
      // Book interiors can be large PDFs.
      bodySizeLimit: `${maxUploadMb + 5}mb`,
    },
  },
};

export default nextConfig;
