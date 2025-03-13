import JSZip from "jszip";
import { accessRelativePath, isOption } from "./fs";
import type { SegatoolsResponse } from "$lib/segatools";

export async function saveFile(data: Blob, filename: string) {
    if ('showSaveFilePicker' in window) {
        window.showSaveFilePicker({
            types: [
                {
                    description: filename
                },
            ],
            suggestedName: filename
        }).then(async handle => {
            const writable = await handle.createWritable();
            await writable.write(data);
            await writable.close();
        })
    } else {
            // due to browser limitations we just have to download it :sob:
            let download = document.createElement("a");
            download.href = URL.createObjectURL(data);
            download.download = filename;
            download.click();
    }
}

export function stripKeychipFromSegatools(segatoolsIni: string) {
    return segatoolsIni.split("\n")
        .map(l => l.split(/[\r;]/g))
        .map(v => {
            // can't help you if you're dumb enough to put it in the wrong spot sorry
            if (v[0].split("=")[0] == "id")
                v[0] = `id=XXX ; stripped by dumbassithm`
            return v.join(";");
        }).join("\n");
}

export async function createPackage(binPath: FileSystemDirectoryEntry, responses: SegatoolsResponse[], segatoolsIni: string, scope: FileSystemDirectoryEntry) : Promise<File | undefined> {
    /*
        We want to package:
            - A copy of the segatools with keychip censored
            - A copy of chusanApp.exe and amdaemon.exe
            - A list of files
            - The list of errors returned by the tool
    */
    let zip = new JSZip();

    // executables
    const targets = ["chusanApp.exe", "amdaemon.exe"];
    for (let idx = 0; targets.length > idx; idx++) {
        let targetName = targets[idx];
        let file = (await accessRelativePath(binPath, targetName, scope)) as FileSystemFileEntry;
        zip.file(targetName, (await new Promise(r => file.file(f => r(f))) as Blob))
    }

    // segatools.ini & errors
    zip.file("segatools.ini", stripKeychipFromSegatools(segatoolsIni));
    zip.file("errors.txt", responses.map(v => `(${v.type}) ${v.description}`).join("\n"))

    // TODO: file list
    // i couldn't figure out a good way to generate it, sorry

    saveFile(await zip.generateAsync({type: "blob"}), "troubleshooting.zip");

    return;
};