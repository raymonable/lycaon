<script lang="ts">
    import * as monaco from "monaco-editor";
    import { onMount } from "svelte";
    import type { SegatoolsResponse } from "./segatools";

    let editor: monaco.editor.IStandaloneCodeEditor | undefined;
    let decorations: monaco.editor.IEditorDecorationsCollection | undefined;

    let container: HTMLDivElement | undefined;

    interface Props {
        data: string,
        updateSegatools: (data: string) => void,
        responses: SegatoolsResponse[],
    };
    let { data, updateSegatools, responses } : Props = $props();

    $effect(() => {
        // this is a little stupid but it basically tells svelte what to use to gauge when to update
        if (responses.length)
            decorations?.set(responses
                .filter(v => v.line && v.type != "success")
                .map(v => {
                    return {
                        range: new monaco.Range((v.line ?? 0) + 1, 1, (v.line ?? 0) + 1, 1),
                        options: {
                            isWholeLine: true,
                            linesDecorationsClassName: `editor-${v.type}`,
                            hoverMessage: {value: v.description}
                        }
                    }
                }))
    });

    function init() {
        if (!container) return;
        monaco.languages.register({ id: 'ini' });
        monaco.languages.setMonarchTokensProvider('ini', {
            tokenizer: {
                root: [
                    [/^\s*\[.*?\]\s*$/, 'keyword'],
                    [/^\s*;.*$/, 'comment'],
                    [
                        /^(\s*[\w.-]+)(\s*=\s*)([^;]*)/,
                        ['variable', 'operator', 'string'],
                    ],
                    [/;.*$/, 'comment'],
                ],
            },
        });
        monaco.editor.defineTheme('default', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                /*{
                    token: "comment",
                    foreground: "e9b3ff"
                }*/
                {
                    token: "comment",
                    foreground: "7f80ae"
                },
                {
                    token: "keyword",
                    foreground: "404b65"
                },
                {
                    token: "variable",
                    foreground: "99a9d2"
                },
                {
                    token: "string",
                    foreground: "ffffff"
                }
            ],
            colors: {
                "editor.background": "#11131b"
            }
        })
        monaco.editor.setTheme('default')
        editor = monaco.editor.create(container, {
            automaticLayout: true,
            language: "ini",
            value: data
        });
        decorations = editor.createDecorationsCollection([]);
        editor.getModel()?.onDidChangeContent(() => updateSegatools(editor?.getValue() ?? ""));
    };
    onMount(init);
</script>

<div class="source-container" translate="no" bind:this={container}></div>