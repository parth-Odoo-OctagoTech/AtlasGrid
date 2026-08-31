/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double initialization of WebGL canvas contexts in dev mode
  transpilePackages: [
    '@deck.gl/core',
    '@deck.gl/layers',
    '@deck.gl/aggregation-layers',
    '@deck.gl/geo-layers',
    '@deck.gl/react',
    '@luma.gl/core',
    '@luma.gl/engine',
    '@luma.gl/webgl',
    '@luma.gl/shadertools',
    '@loaders.gl/core',
    'maplibre-gl',
  ],
  webpack: (config, { isServer, dev }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    // Disable filesystem pack caching in dev mode to eliminate Webpack PackFileCacheStrategy corruption and __webpack_modules__ mismatch
    if (dev) {
      config.cache = false;
    }
    return config;
  }
};

export default nextConfig;
