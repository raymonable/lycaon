<script lang="ts">
  import { troubleshootSegatools, type SegatoolsProblem, type SegatoolsResponse } from "./lib/segatools";

  import * as monaco from "monaco-editor";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import { onMount } from "svelte";

  let editorContainer: HTMLDivElement | undefined;
  let errors: SegatoolsResponse[] = $state([]);
  
  onMount(async () => {
    if (!editorContainer) return;
    self.MonacoEnvironment = {
      getWorker: function(_: any, label: string) {
        return new editorWorker();
      }
    }
    const segatoolsText = await fetch("/segatools.ini").then(t => t.text());
    monaco.languages.register({ id: 'ini' });
    // Define the syntax highlighting and structure
    monaco.languages.setMonarchTokensProvider('ini', {
      tokenizer: {
        root: [
          // **Section headers**: [SectionName]
          [/^\s*\[.*?\]\s*$/, 'keyword'],

          // **Full-line comments** (starting with `;`)
          [/^\s*;.*$/, 'comment'],

          // **Key-value pairs**
          [
            /^(\s*[\w.-]+)(\s*=\s*)([^;]*)/,
            ['variable', 'operator', 'string'],
          ],

          // **Inline comments** (after a value)
          [/;.*$/, 'comment'],
        ],
      },
    });
    let editor = monaco.editor.create(editorContainer, {
      automaticLayout: true,
      language: "ini",
      value: segatoolsText,
      theme: "vs-dark"
    });
    let decorations = editor.createDecorationsCollection([])

    function updateErrorList() {
      errors = troubleshootSegatools(editor.getValue());

      decorations.set(errors
        .filter(v => v.line && v.type != "success")
        .map(v => {
          return {
            range: new monaco.Range((v.line ?? 0) + 1, 1, (v.line ?? 0) + 1, 1),
            options: {
              isWholeLine: true,
              linesDecorationsClassName: `editor-${v.type}`,
            }
          }
        })
      );
    }; updateErrorList();
    editor.getModel()?.onDidChangeContent(updateErrorList);
  });
</script>
<div class="container">
  <h1>
    deficithm 
    <div class="subtext">
      segatools editor for チュウニズム
    </div>
  </h1>

  <p>
    <i>This tool is experimental. Take all information with discretion.</i><br>
    Do <strong>NOT</strong> share your segatools.ini with people you do not trust, as it contains your keychip.
  </p>
  <p>
    <!-- TODO: functionality -->
    <button>Select App folder</button>
    <button>Select segatools.ini (Limited functionality)</button>
  </p>

  <div class="code-container" bind:this={editorContainer}></div>
  <div class="message-list">
    {#each errors as error}
      <div class={`message ${error.type}`}>
        {error.description} {error.line ? `(Line ${error.line})` : ""}
      </div>
    {/each}
  </div>

  <p>
    <!-- TODO: functionality -->
    <!-- If using Segatools-only mode, add a button to download -->
    <button>Generate troubleshooting package</button>
  </p>
</div>