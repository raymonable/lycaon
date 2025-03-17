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
export function getCompatibilityAmdaemon(chusan: ChusanExecutable, amdaemon: ChusanExecutable): SegatoolsResponse {
    const chusanMajorVersion = parseInt(chusan.version.substring(2, 3));
    const chusanMinorVersion = parseInt(chusan.version.substring(3, 4));

    const amdaemonMajorVersion = parseInt(amdaemon.version.substring(2, 3));
    const amdaemonMinorVersion = parseInt(amdaemon.version.substring(3, 4));

    if (chusan.version.substring(0, 1) != "2")
        return {
            description: "You are on unsupported data.",
            type: "error"
        }
    const compatibleResponse: SegatoolsResponse = {
        description: "Your amdaemon.exe is compatible with your chusanApp.exe",
        type: "success"
    }
    const incompatibleResponse: SegatoolsResponse = {
        description: "Your amdaemon.exe is not compatible with your chusanApp.exe, please ensure it matches",
        type: "error"
    }

   if (chusanMajorVersion == 0 && chusanMinorVersion == 0) {
        // 2.00 specific
        return (amdaemonMajorVersion == chusanMajorVersion && amdaemonMinorVersion == chusanMinorVersion) ? compatibleResponse : incompatibleResponse;
   } else if (chusanMajorVersion <= 2) {
        // 2.20 and up
        return amdaemonMajorVersion == 2 ? compatibleResponse : incompatibleResponse;
   }
    // 2.05 - 2.16
    return compatibleResponse;
}