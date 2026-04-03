import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/main.ts',
  output: {
    file: 'modules/index.js',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript()
  ]
};