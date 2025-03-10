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
    
    function updateErrorList() {
      errors = troubleshootSegatools(editor.getValue());
    }; updateErrorList();
    editor.getModel()?.onDidChangeContent(updateErrorList);
  });
</script>
<div class="container">
  <h1>
    incompetence
  </h1>

  Welcome. You are probably here because you are having troubles with setting up CHUNITHM.<br>
  If you haven't already, select the highest folder that can contain your data. This should be above your option folder.
  <p>
    <button>Select App folder</button>
  </p>

  <div class="message-list">
    {#each errors as error}
      <div class={`message ${error.type}`}>
        {error.description}
      </div>
    {/each}
  </div>

  <div class="code-container" bind:this={editorContainer}>

  </div>
</div>