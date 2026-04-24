/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "disney.images.edge.bamgrid.com",
      },
      {
        protocol: "https",
        hostname: "*.nflxso.net",
      },
      {
        protocol: "https",
        hostname: "*.ssl-images-amazon.com",
      },
      {
        protocol: "https",
        hostname: "*.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "img1.ak.crunchyroll.com",
      },
      {
        protocol: "https",
        hostname: "*.crunchyroll.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://image.tmdb.org https://*.nflxso.net https://disney.images.edge.bamgrid.com https://*.ssl-images-amazon.com https://*.media-amazon.com https://*.crunchyroll.com",
              "media-src 'self' blob:",
              "connect-src 'self' https://api.themoviedb.org",
              // Erlaubte Embed-Quellen
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.ardmediathek.de https://www.zdf.de",
              "font-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
