<script lang="ts">
  import { troubleshootSegatools, type SegatoolsProblem, type SegatoolsResponse } from "./lib/segatools";
  import Editor from "./lib/editor.svelte";
  import { drop } from "./lib/segatools/fs";

  import hotkeys from "hotkeys-js";

  type SegatoolsState = "drop" | "success";

  let responses: SegatoolsResponse[] = [];
  let state: SegatoolsState = "drop";

  let segatoolsPath: FileSystemFileEntry | undefined;
  let scopePath: FileSystemDirectoryEntry | undefined;
  let binPath: FileSystemDirectoryEntry | undefined;
  
  let defaultSegatoolsString: string;

  async function updateSegatools(data: string) {
    responses = await troubleshootSegatools(data, binPath, scopePath);
    defaultSegatoolsString = data;
  }

  function save() {
    if ('showSaveFilePicker' in window) {
      window.showSaveFilePicker({
        types: [
            {
                description: "Override your segatools.ini",
                accept: { "text/plain": [".ini"] },
            },
        ],
        suggestedName: "segatools.ini"
      }).then(async handle => {
        const writable = await handle.createWritable();
        await writable.write(defaultSegatoolsString);
        await writable.close();
      })
    } else {
      // due to browser limitations we just have to download it :sob:
      let download = document.createElement("a");
      download.href = URL.createObjectURL(new Blob([defaultSegatoolsString], {type: "text/plain"}));
      download.download = "segatools.ini"
      download.click();
    }
  };
  hotkeys("ctrl+s,command+s", e => {
    e.preventDefault(); save();
  });

  async function safeDrop(e: Event & { currentTarget: EventTarget & HTMLInputElement; }) {
    responses = [{
      description: "Processing. Please wait a moment.",
      type: "loading"
    }]
    let response = await drop(e);

    let input = (e.target as HTMLInputElement);
    if (input.value)
      input.value = "";

    responses = [];
    if (response?.responses)
      if (response?.responses.length > 0)
        return responses = response.responses;
    // fuck you legacy apis
    if (response?.segatoolsPath instanceof File) {
      await updateSegatools(await response.segatoolsPath.text());
      state = "success";
    } else
      (response?.segatoolsPath as FileSystemFileEntry).file(async f => {
        scopePath = response?.scope;
        binPath = await new Promise(r => (response?.segatoolsPath as FileSystemEntry)?.getParent(f => r(f as FileSystemDirectoryEntry)));
        segatoolsPath = response?.segatoolsPath as FileSystemFileEntry;
        
        await updateSegatools(await f.text());
        state = "success";
      });
  }
</script>
<div class="container">
  <h1 translate="no">
    deficithm 
    <div class="subtext">
      for deficiency of common sense
    </div>
  </h1>
  <p>
    <i>This tool is experimental. Take all information with discretion.</i><br>
    Do <strong>NOT</strong> share your segatools.ini with people you do not trust, as it contains your keychip.
  </p>
  <p>
    This tool is only intended for「CHUNITHM NEW!!」or newer.
    All data is processed on the client. No data is uploaded to a server unless requested.
  </p>
  {#if (state as SegatoolsState) === "success"}
    <Editor data={defaultSegatoolsString} {responses} {updateSegatools} />
    <p>
      <button on:click={save}>Save</button>
    </p>
  {:else}
    <div class="drag-container">
      <div class="drag">
        <input type="file" on:input={safeDrop}>
      </div>
    </div>
  {/if}
  {#if responses.length > 0}
    <h2>Feedback</h2>
    <div class="message-list">
      {#each responses as response}
        <div class={`message ${response.type}`}>
          {response.description}
        </div>
      {/each}
    </div>
  {/if}
  <p>
    <img src="/read.webp" alt="Basic reading ability is needed to fully enjoy this game">
  </p>
</div>