<script lang="ts">
  import { troubleshootSegatools, type SegatoolsProblem, type SegatoolsResponse } from "$lib/segatools";
  
  import { drop } from "$lib/segatools/fs";
  import Editor from "$lib/editor.svelte";

  import hotkeys from "hotkeys-js";
  import { createPackage, saveFile } from "$lib/segatools/package";

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
    saveFile(new Blob([defaultSegatoolsString], {type: "text/plain"}), "segatools.ini");
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

    responses = [];
    if (response?.responses)
      if (response?.responses.length > 0) {
        let input = (e.target as HTMLInputElement);
        if (input.value)
          input.value = "";
        return responses = response.responses;
      }
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
    <img src="/facepalm.webp" alt="Chuni Penguin facepalm"> 
    <div>
      dumbassithm 
      <span class="subtext">
        you know why you're here
      </span>
    </div>
  </h1>
  <p>
    <i>This tool is experimental. Take all information with discretion.</i><br>
    Do <strong>NOT</strong> share your segatools.ini with people you do not trust, as it contains your keychip.
  </p>
  <p>
    This tool is only intended for「CHUNITHM NEW!!」or newer.
    All data (besides DNS verification) is processed on the client. 
  </p>
  {#if !navigator.userAgent.includes("Chrome")}
  <p>
    <b>You are on a non-Chromium browser. You will experience issues. Please switch to a Chromium-based browser.</b>
  </p>
  {/if}
  {#if (state as SegatoolsState) === "success"}
    <Editor data={defaultSegatoolsString} {responses} {updateSegatools} />
    <p>
      <button on:click={save}>Save</button>
    </p>
    {#if segatoolsPath}
      <p>
        <button on:click={() => {if (binPath && scopePath) createPackage(binPath, responses, defaultSegatoolsString, scopePath)}}>Generate troubleshooting package</button>
      </p>
    {/if}
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
          <!-- TODO: figure out how to tell the editor component to navigate to the line -->
          {response.description} {response.line ? `(Line ${response.line + 1})`: ``}
        </div>
      {/each}
    </div>
  {/if}
  <p>
    <img src="/read.webp" alt="Basic reading ability is needed to fully enjoy this game"><br>
    <small class="version">Version {APP_VERSION}. <a href="https://github.com/raymonable/lycaon">Source code</a></small>
  </p>
</div>