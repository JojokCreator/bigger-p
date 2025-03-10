import { vitePreprocess } from '@astrojs/svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true,
    compatibility: {
      componentApi: 5
    }
  }
};