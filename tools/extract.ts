import { fetch, write } from "bun"
import { exists, mkdir } from "node:fs/promises"

const OUT_PATH = "src/patches"
const REPO_OWNER = "two-torial"
const REPO_NAME = "webpatcher"
const BRANCH = "master"
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`
const RAW_BASE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/`
const TARGETS = ["chusan"];

async function getHtmlFiles() {
    const response = await fetch(API_URL)
    const data = await response.json()

    if (!data.tree) throw new Error("Failed to fetch repository file tree")

    return data.tree.filter(f => 
        f.path.endsWith(".html") 
        && !f.path.endsWith("index.html") 
        && TARGETS.find(v => f.path.substring(0, v.length) == v)
    ).map(f => f.path)
}

async function processScriptBlock(script: string) {
    class PatchContainer {
        constructor(public patchers: any[]) {}
    }

    let outs = []
    class Patcher {
        constructor(public name: string, public ver: string, public patch: any[]) {
            outs.push({ name, ver, patch })
        }
    }

    globalThis.window = { addEventListener: (_: string, callback: Function) => callback() } as any
    globalThis.Patcher = Patcher
    globalThis.PatchContainer = PatchContainer
    eval(script)

    for (const out of outs) {
        // Write to file
        const file = `${out.name}-${out.ver}.json`
        await write(`${OUT_PATH}/${file}`, JSON.stringify(out.patch, null, 4))
    }
}

async function extractPatchList(url) {
    console.log(`Processing: ${url}`)

    // Fetch HTML content
    const response = await fetch(url)
    const html = await response.text()

    // Extract the script block containing "new Patcher"
    const scriptMatch = html.match(/<script type=.text\/javascript.>([\s\S]*?)<\/script>/)
    if (!scriptMatch) throw new Error("No inline script found")
    const script = scriptMatch[1]

    // Process the script block
    await processScriptBlock(script)
}

async function processAllHtmlFiles() {
    // Create the output directory if it doesn't exist
    if (!await exists(OUT_PATH)) await mkdir(OUT_PATH)

    const htmlFiles = await getHtmlFiles()
    
    for (const filePath of htmlFiles) {
        try {
            await extractPatchList(`${RAW_BASE_URL}${filePath}`)
        } catch (error) {
            console.error("Error extracting patch:", error.message)
        }
    }
}

processAllHtmlFiles()
