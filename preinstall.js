#! /usr/bin/env node

// Prevent using npm or yarn for installation
if (!process.env.npm_execpath.match(/pnpm/)) {
  console.log("Use PNPM!");
  process.exit(1);
}