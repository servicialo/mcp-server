import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "spec.servicialo.com" }],
        destination: "/index.md",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // spec.servicialo.com/:path+ → serve from public/spec/:path+
        {
          source: "/:path+",
          has: [{ type: "host", value: "spec.servicialo.com" }],
          destination: "/spec/:path+",
        },
      ],
      afterFiles: [
        {
          source: "/api/.well-known/agents.json",
          destination: "/api/a2a-directory",
        },
      ],
    };
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
