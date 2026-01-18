/**
 * Custom Metro transformer that handles import.meta.env
 * This is needed because Zustand's middleware uses import.meta.env
 * which isn't supported by Metro/Hermes in web builds
 */
const upstreamTransformer = require('@expo/metro-config/babel-transformer')

module.exports.transform = async function transform(props) {
  // Transform import.meta.env to a safe fallback for web
  if (props.src && props.src.includes('import.meta')) {
    props.src = props.src
      // Replace import.meta.env?.MODE with process.env.NODE_ENV
      .replace(/import\.meta\.env\?\.MODE/g, 'process.env.NODE_ENV')
      // Replace import.meta.env.MODE with process.env.NODE_ENV
      .replace(/import\.meta\.env\.MODE/g, 'process.env.NODE_ENV')
      // Replace generic import.meta.env with empty object (safe fallback)
      .replace(/import\.meta\.env/g, '(process.env || {})')
      // Replace import.meta.url with empty string (safe fallback)
      .replace(/import\.meta\.url/g, '""')
  }

  return upstreamTransformer.transform(props)
}
