const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Transform import.meta.env to process.env for web compatibility
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer?.minifierConfig,
  },
}

// Add babel plugin to transform import.meta.env
config.transformer.babelTransformerPath = require.resolve('./metro-transformer.js')

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot]

// Force all React-related packages to resolve from monorepo root to avoid duplicates
const reactPackages = ['react', 'react-dom', 'react-native', 'react-native-web', 'expo-router']
config.resolver.extraNodeModules = reactPackages.reduce((acc, name) => {
  acc[name] = path.resolve(monorepoRoot, 'node_modules', name)
  return acc
}, {})

// Ensure Metro can resolve from both project and monorepo node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Block nested react copies and test-only packages from being resolved
config.resolver.blockList = [
  // Block all nested react packages except the root one
  /node_modules\/.*\/node_modules\/react\//,
  /node_modules\/.*\/node_modules\/react-dom\//,
  /node_modules\/.*\/node_modules\/react-native-web\//,
  // Block vitest and related packages (they use import.meta which breaks web bundle)
  /node_modules\/vitest/,
  /node_modules\/@vitest/,
  /node_modules\/vite/,
  /node_modules\/@vitejs/,
  // Block css-tree (uses import.meta.url)
  /node_modules\/css-tree/,
  // Block webpack (uses import.meta)
  /node_modules\/webpack/,
  // Block playwright (uses import.meta)
  /node_modules\/playwright/,
  /node_modules\/@playwright/,
  // Block eslint-related packages that use import.meta
  /node_modules\/@typescript-eslint/,
  /node_modules\/eslint/,
  // Block babel plugins that reference import.meta
  /node_modules\/@babel\/preset-env/,
  // Block package-json-from-dist (uses import.meta)
  /node_modules\/package-json-from-dist/,
  // Block test files that might import vitest
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /__tests__/,
]

// Custom resolver to prevent resolving problematic packages
const originalResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // List of packages that should never be resolved (they use import.meta or are dev-only)
  const blockedPrefixes = [
    'vitest',
    '@vitest/',
    'vite',
    '@vitejs/',
    'webpack',
    'playwright',
    '@playwright/',
    'eslint',
    '@typescript-eslint/',
    '@babel/preset-env',
    'css-tree',
  ]

  for (const prefix of blockedPrefixes) {
    if (moduleName === prefix || moduleName.startsWith(prefix + '/')) {
      // Return an empty module instead of throwing
      return {
        type: 'empty',
      }
    }
  }

  // Use default resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
