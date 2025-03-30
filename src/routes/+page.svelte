<script lang="ts">
  import { troubleshootSegatools, type SegatoolsProblem, type SegatoolsResponse } from "$lib/segatools";
  
  import { accessRelativePath, drop } from "$lib/segatools/fs";
  import Editor from "$lib/editor.svelte";

  import hotkeys from "hotkeys-js";
  import { getCompatibilityAmdaemon, getExecutable, processPatches, type ChusanExecutable } from "$lib/segatools/patch";

  type SegatoolsState = "drop" | "success";

  let responses: SegatoolsResponse[] = [];
  let state: SegatoolsState = "drop";

  let segatoolsPath: FileSystemFileEntry | undefined;
  let scopePath: FileSystemDirectoryEntry | undefined;
  let binPath: FileSystemDirectoryEntry | undefined;
  
  let patches: ChusanExecutable[] = [];
  let patchResponses: SegatoolsResponse[] = [];
  let defaultSegatoolsString: string;

  async function updateSegatools(data: string) {
    responses = await troubleshootSegatools(data, binPath, scopePath, patchResponses);
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

  // TODO: safely move to another file
  async function analyzeExecutables(binPath: FileSystemDirectoryEntry, scopePath: FileSystemDirectoryEntry) {
    let executables: Record<string, ChusanExecutable> = {};
    // TODO: cleanup
    for (let target of ["chusanApp.exe", "amdaemon.exe"]) {
      let location = (await accessRelativePath(binPath, target, scopePath)) as FileSystemFileEntry;
      if (!location) continue;

      let binary = (await new Promise(async r => location.file(f => r(f)))) as File;
      if (!binary) continue;

      let executable = await getExecutable(target, binary);
      if (executable) {
        if ((executable as ChusanExecutable).executable) {
          // i hate type casting this is dogshit
          patches.push(executable as ChusanExecutable);
          executables[(executable as ChusanExecutable).executable] = executable as ChusanExecutable;
        } else if ((executable as SegatoolsResponse).type)
          patchResponses.push(executable as SegatoolsResponse);
      }
    };
    // thanks keeboard
    if (executables["chusanApp.exe"]) {
      patchResponses.push({
        type: "success",
        description: `Executable ${(executables["chusanApp.exe"]).executable.split(".")[0]} is detected to be version ${executables["chusanApp.exe"].version}.`
      })
      if (executables["amdaemon.exe"])
        patchResponses.push(getCompatibilityAmdaemon(
          executables["chusanApp.exe"],
          executables["amdaemon.exe"]
        ));
    }

    // should we check more than just "start.bat"??
    let location = (await accessRelativePath(binPath, "start.bat", scopePath)) as FileSystemFileEntry;
    if (location) {
      let binary = (await new Promise(async r => location.file(f => r(f)))) as File;
      if (binary) {
        if (!(await binary.text()).match(/OPENSSL_ia32cap/g))
          patchResponses.push({
            type: "warning",
            description: `Your start.bat does not contain the OpenSSL patch. You may experience issues if you're using an Intel CPU.`,
            href: "https://two-torial.xyz/games/chunithmverse/setup/#fixing-openssl-on-intel-10th-gen-and-newer-cpus"
          })
      }
    }
    if (await accessRelativePath(binPath, "chunihook.dll", scopePath))
      patchResponses.push({
        type: "error",
        description: "It appears you are using the \"chuni\" Segatools DLLs. You should be using \"chusan\" instead."
      });
  }

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

        await analyzeExecutables(binPath, scopePath);
        await updateSegatools(await f.text());
        state = "success";
      });
  }
</script>
<h1 translate="no">
  <img src="/facepalm.webp" alt="Chuni Penguin facepalm"> 
  <div>
    dumbassithm 
    <span class="subtext">
      thinking is hard
    </span>
  </div>
</h1>
<p>
  <i>This tool performs a surface-level diagnosis of your game data. Information may be incorrect. Use discretion.</i><br>
  Do <strong>NOT</strong> share your segatools.ini with people you do not trust, as it contains your keychip.
</p>
<p>
  This tool is only intended for「CHUNITHM NEW!!」or newer.
  All data (besides DNS verification) is processed on the client.
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
  <details open>
    <summary>Summary</summary>
    <div class="message-list">
      {#each responses as response}
        <div class={`message ${response.type}`}>
          <!-- TODO: figure out how to tell the editor component to navigate to the line -->
          {#if response.description.match(response.censorKey) && response.censorKey}
            <span class="strip-whitespace">
              {response.description.split(response.censorKey)[0]}
              <span class="spoiler">{response.censorKey}</span>
              {response.description.split(response.censorKey)[1]}
            </span>
          {:else}
            {response.description}
          {/if}
          {response.line ? `(Line ${response.line + 1})`: ``}
          {#if response.href}
            <a target="_blank" href={response.href}>(Solution)</a>
          {/if}
        </div>
      {/each}
    </div>
  </details>
  {#if patches.length > 0}
    <details>
      <summary>Patches</summary>
      Patches are read-only.<br>
      Go to <a href="https://patcher.two-torial.xyz" target="_blank">https://patcher.two-torial.xyz</a> to generate patches.
      {#each patches as executable}
        <div class="patch-header">
          {executable.executable}
          <small>
            ({executable.version})
          </small>
        </div>
        <ul class="patch-list">
          {#each executable.patches.filter(patch => patch.patches) as patch}
            <li class="patch">
              {patch.name}:
              <input type="checkbox" checked={patch.enabled} disabled>
              {#if patch.danger}
                <span class="patch-danger" title="Avoid using this patch.">⚠</span>
              {/if}
            </li>
          {/each}
        </ul>
      {/each}
    </details>
  {/if}
{/if}
<p>
  <img src="/read.webp" alt="Basic reading ability is needed to fully enjoy this game"><br>
  <small class="version">
    Version {APP_VERSION} •
    <a href="https://github.com/raymonable/lycaon" target="_blank">Source code</a> •
    <a href="https://two-torial.xyz/errorcodes/sega/" target="_blank">Error codes list</a>
  </small>
</p>