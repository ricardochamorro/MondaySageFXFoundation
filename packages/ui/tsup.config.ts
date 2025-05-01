import { defineConfig } from 'tsup';
import postcss from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import fs from 'fs/promises';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  clean: true,
  external: ['react'],
  inject: ['src/react-shim.js'],
  noExternal: ['@radix-ui/react-icons'],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  minify: true,
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.loader = {
      ...options.loader,
      '.postcss': 'css',
    };
  },
  async onSuccess() {
    const postcssProcessor = postcss([
      tailwindcss,
      postcssPresetEnv,
      autoprefixer,
    ]);
    
    const result = await postcssProcessor.process(
      await fs.readFile('src/styles.postcss', 'utf-8'),
      { from: 'src/styles.postcss', to: 'dist/styles.css' }
    );
    
    await fs.writeFile('dist/styles.css', result.css);
  },
}); 