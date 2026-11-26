import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "dnk1kazq09utu.cloudfront.net" },
      { protocol: "https", hostname: "www.woolworths.co.za" },
      { protocol: "https", hostname: "thegridfoodmarket.com" },
      { protocol: "https", hostname: "snapcalorie-webflow-website.s3.us-east-2.amazonaws.com" },
      { protocol: "https", hostname: "potily.com" }
    ]
  }
};

export default nextConfig;
