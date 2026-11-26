import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  images: { remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "bottleking.ng" },
    { protocol: "https", hostname: "www.supermart.ng" },
    { protocol: "https", hostname: "images.afrizonemart.com" },
    { protocol: "https", hostname: "snapcalorie-webflow-website.s3.us-east-2.amazonaws.com" },
    { protocol: "https", hostname: "potily.com" }
  ] }
};

export default nextConfig;
