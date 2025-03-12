import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from "path";

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: [
			{
			  find: /^monaco-editor$/,
			  replacement: path.resolve(__dirname, "./node_modules/monaco-editor/esm/vs/editor/editor.api"),
			},
		],
	}
});
