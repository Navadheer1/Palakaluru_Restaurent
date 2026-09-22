/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Using memory cache prevents OneDrive file locks on .pack.gz_ files
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
};

export default nextConfig;
