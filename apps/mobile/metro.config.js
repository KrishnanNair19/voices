const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch the entire monorepo so Metro can resolve packages/core changes
config.watchFolders = [monorepoRoot]

// Let Metro resolve packages from both the app's and the monorepo root's node_modules.
// This handles npm workspace hoisting correctly.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Resolve the @/ alias to src/ — mirrors tsconfig.json paths
config.resolver.alias = {
  '@': path.resolve(projectRoot, 'src'),
}

module.exports = config
