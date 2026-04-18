const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Structural Fix: Disable strict package exports resolution.
// This is required for SDK 54 / RN 0.81.5 on Windows/OneDrive environments
// to correctly resolve internal relative imports within core packages.
config.resolver.unstable_enablePackageExports = false;

// Optimization: Limit workers to prevent OOM on Windows/OneDrive
config.maxWorkers = 2;

module.exports = config;
