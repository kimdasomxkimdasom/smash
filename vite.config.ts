import { defineConfig } from 'vite'

// GitHub Pages는 https://<아이디>.github.io/smash/ 아래에서 열려서 기준 경로를 /smash/로
export default defineConfig({
  base: '/smash/',
})
