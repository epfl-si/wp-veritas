import type { NextConfig } from "next";
import nextIntl from "next-intl/plugin";

const withNextIntl = nextIntl();

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
	output: "standalone",
};

export default withNextIntl(nextConfig);
