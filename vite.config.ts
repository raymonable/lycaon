import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from "fs";
import path from "path";

const APP_VERSION: string = (JSON.parse(fs.readFileSync("package.json", "utf8")) ?? {version: "?"}).version

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: [
			{
			  find: /^monaco-editor$/,
			  replacement: path.resolve(__dirname, "./node_modules/monaco-editor/esm/vs/editor/editor.api"),
			},
		],
	},
	define: {
		APP_VERSION: JSON.stringify(APP_VERSION)
	}
});
