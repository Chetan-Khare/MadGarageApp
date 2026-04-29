const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const path = require('path');
const config = getDefaultConfig(__dirname);

// Resolution Fix: SDK 54 / RN 0.81 Windows Support
config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts = ['ts', 'tsx', 'js', 'jsx', 'json', 'cjs', 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'gif', 'webp'];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Optimization: Limit workers to prevent OOM on Windows
config.maxWorkers = 2;

module.exports = config;
