// Conditionally enable Tailwind if it's installed in the environment.
let plugins = {}
try {
  // Attempt to require tailwindcss — if it fails, skip it.
  require.resolve('tailwindcss')
  plugins.tailwindcss = {}
  plugins.autoprefixer = {}
} catch (e) {
  // Tailwind not installed in this environment; fall back to autoprefixer only if available
  try {
    require.resolve('autoprefixer')
    plugins.autoprefixer = {}
  } catch (e2) {
    plugins = {}
  }
}

module.exports = { plugins };