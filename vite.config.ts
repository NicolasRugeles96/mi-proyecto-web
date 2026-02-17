import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/mi-proyecto-web/',
  plugins: [react()]
})
