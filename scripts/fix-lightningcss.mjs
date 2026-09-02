if (process.platform === 'darwin' && process.arch !== 'arm64') {
  console.warn('⚠️  Apple Silicon detected with non-arm64 Node.js. Use a native arm64 Node install instead of Rosetta for Next.js builds.');
}

console.log('✅ lightningcss postinstall check complete');
