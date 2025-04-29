/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:': false, // Disable node: scheme handling
    };
    return config;
  },
};

module.exports = nextConfig; 