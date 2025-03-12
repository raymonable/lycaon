import type { SegatoolsResponse } from "../segatools";

export function isOption(name: string) {
    return name.slice(0, 1) == "A" && !isNaN(parseInt(name.slice(1))) && name.length == 4
}

export interface SegatoolsFilesystemResponse {
    segatoolsPath?: FileSystemEntry | File,
    chusan?: FileSystemEntry,
    responses: SegatoolsResponse[]
}

async function findSegatools(root: FileSystemEntry) {
    let directories: FileSystemEntry[] = [root];
    let fsResponse: SegatoolsFilesystemResponse = {
        responses: []
    };
    while (directories.length > 0) {
        let entry = directories[0];
        if (entry.isDirectory) {
            let directory = entry as FileSystemDirectoryEntry;

            let reader = directory.createReader();
            let entries = await new Promise<Array<FileSystemEntry>>(r => reader.readEntries(r));

            if (!isOption(directory.name))
                directories = [...directories, ...entries]
        } else if (entry.name == "segatools.ini") {
            if (fsResponse.segatoolsPath) {
                fsResponse.responses.push({
                    description: `I have discovered 2 segatools.ini. You may have selected too large of a scope. Select a folder lower down and check for duplicates.`,
                    type: "error"
                });
                delete fsResponse.segatoolsPath;
                return;
            } else
                fsResponse.segatoolsPath = entry;
        } else if (entry.name == "chusanApp.exe") {
            fsResponse.chusan = entry;
        }
        directories.shift()
    }
    if (fsResponse.responses.length <= 0 && !fsResponse.segatoolsPath)
        fsResponse.responses.push({
            description: "Unable to locate your segatools.ini.",
            type: "error"
        });
    if (!fsResponse.chusan)
        fsResponse.responses.push({
            description: "This doesn't appear to be CHUNITHM data.",
            type: "error"
        })
    return fsResponse;
}

export async function accessRelativePath(root: FileSystemDirectoryEntry, path: string): Promise<FileSystemEntry | undefined> {
    let base: FileSystemEntry | undefined = root;
    let segments = path.split(/[/\\]/g);
    
    for (let idx = 0; segments.length > idx; idx++) {
        let segment = segments[idx];
        if (segment != "." && base) {
            let files: FileSystemEntry[] = await new Promise(r => (base as FileSystemDirectoryEntry)?.createReader().readEntries(f => r(f)));
            let file = files.find(v => v.name == segment);
            base = file;
        } else if (segment == ".")
            base = root;
    }
    return base;
};

export async function drop(event: Event & { currentTarget: EventTarget & HTMLInputElement; }) : Promise<SegatoolsFilesystemResponse | undefined> {
    if (!event.target) return;

    let input = (event.target as HTMLInputElement);
    if (!input.files) return;

    if (input.webkitEntries.length > 0)
        if (input.webkitEntries[0].name == "segatools.ini") {
            return {
                segatoolsPath: input.files[0],
                responses: []
            };
        } else if (input.webkitEntries[0].isDirectory) {
            return await findSegatools(input.webkitEntries[0]);
        } else
            throw new Error("Not a segatools.ini selected")
};