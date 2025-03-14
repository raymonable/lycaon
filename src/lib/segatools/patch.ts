import type { SegatoolsResponse } from "$lib/segatools";

export interface ChusanPatch {
    type?: "number" | undefined,
    name: string,
    patches?: {
        off: number[],
        on: number[],
        offset: number
    }[],
    tooltip?: string,
    danger?: string,
    enabled?: boolean
};
export interface ChusanExecutable {
    executable: string,
    version: string,
    patches: ChusanPatch[]
};

const patches: ChusanExecutable[] = 
    Object.entries(import.meta.glob('$lib/config/patches/*.json', { eager: true }))
        .map(a => {
            let key = a[0].split("/")[a[0].split("/").length - 1];
            key = key.split(".").slice(0, -1).join(".");
            return {
                executable: key.split("-")[0],
                version: key.split("-")[1],
                patches: (a[1] as { default: ChusanPatch[] }).default
            } as ChusanExecutable;
        });

export function searchInArray(array: Uint8Array, target: string) {
    return array.find((v, i) => {
        if (v != target.charCodeAt(0))
            return false;
        return Array.from(array.slice(i, i + target.length))
            .map((v: number) => String.fromCharCode(v)).join("") == target;
    });
};

export async function getExecutable(name: string, binary: Blob) : Promise<ChusanExecutable | SegatoolsResponse | undefined> {
    let array = new Uint8Array(await binary.arrayBuffer());
    let executable = patches
        .filter(e => e.executable == name)
        .find(executable =>
        executable.patches
            .filter(patch => patch.patches)
            .every(patch => {
                return patch.patches.every(individualPatch => 
                    individualPatch.off.every((v, i) => array[individualPatch.offset + i] == v) ||
                    individualPatch.on.every((v, i) => array[individualPatch.offset + i] == v)
                )
            })
    );
    if (executable) return await processPatches(binary, executable);
    if (searchInArray(array, "KeRnEl32.dLl")) {
        return {
            type: "error",
            description: `${name} appears to be a packed executable.`
        }
    } else
        return {
            type: "warning",
            description: `${name} is an unusual executable that isn't compatible with any patches.`
        }
};
export async function processPatches(binary: Blob, executable: ChusanExecutable): Promise<ChusanExecutable> {
    let array = new Uint8Array(await binary.arrayBuffer());
    executable.patches.filter(patch => patch.patches)
        .map(patch => {
            patch.enabled = patch.patches.every(individualPatch => 
                individualPatch.on.every((v, i) => array[individualPatch.offset + i] == v)
            );
            return patch;
        })
    return executable;
};