// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	site: 'https://hopesda.church',
	output: 'static',
	adapter: vercel({
		maxDuration: 10,
	}),
	integrations: [sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
	redirects: {
		'/sitemap.xml': '/sitemap-index.xml',
	},
})
