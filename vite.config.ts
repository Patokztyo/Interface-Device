/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const replacePlugin = (mode: string) => {
  return {
    name: 'html-inject-env',
    transformIndexHtml: (html: string) => {
      if (mode === 'production') {
        return html.replace(
          '<!-- REACT_ENV -->',
          '<script src="./config/front.env.js"></script>'
        )
      }
    }
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), replacePlugin(mode)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}))