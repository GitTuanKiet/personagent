import { defineConfig, mergeConfig } from 'vite';
import { vitestConfig } from '@pag/vitest-config/frontend';

export default mergeConfig(defineConfig({}), vitestConfig);
