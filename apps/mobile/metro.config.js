const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo so Metro sees changes in packages/core
config.watchFolders = [monorepoRoot];

// 2. Resolve from both node_modules (mobile-local first, then monorepo root)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force singleton resolution for React.
//    extraNodeModules is a fallback — it only applies when a module isn't found
//    through nodeModulesPaths. Since 'react' exists in BOTH node_modules folders,
//    Metro can bundle two copies, causing "Invalid hook call / useEffect of null".
//    resolveRequest is the authoritative override: it runs first and always wins.
const SINGLETONS = new Set([
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native',
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (SINGLETONS.has(moduleName)) {
    return {
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// 4. @/ path alias → src/
config.resolver.extraNodeModules = {
  '@': path.resolve(projectRoot, 'src'),
};

module.exports = config;