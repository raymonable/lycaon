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
    segatools verbose
    <div class="subtext">
      chicken butt
    </div>
  </h1>

  <p>
    Welcome. You are probably here because you are having troubles with setting up <i>CHUNITHM</i>.<br>
    If you haven't already, select the highest folder that can contain your data. This should be above your option folder.
  </p>

  <div class="code-container" bind:this={editorContainer}></div>
  <div class="message-list">
    {#each errors as error}
      <div class={`message ${error.type}`}>
        {error.description} {error.line ? `(Line ${error.line})` : ""}
      </div>
    {/each}
  </div>
</div>