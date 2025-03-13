import { type SegatoolsPathProblem, type SegatoolsResponse } from "../../segatools";
import { accessRelativePath, isOption } from "../fs";

export default {
    async match(entries: Record<string, Record<string, string | number | boolean>>, binPath: FileSystemDirectoryEntry, scope: FileSystemDirectoryEntry): Promise<undefined | SegatoolsResponse> {
        if (!entries["vfs"]) return;
        try {
            let folder = await accessRelativePath(binPath, entries["vfs"]["amfs"] as string) as FileSystemDirectoryEntry | undefined;
            if (folder) {
                let files: FileSystemEntry[] = await new Promise(r => (folder as FileSystemDirectoryEntry)?.createReader().readEntries(f => r(f)));
                // TODO maybe: check ICFs
                if (!files.find(v => v.name == "ICF1"))
                    return {
                        type: "error",
                        description: "You are missing ICF1 in your amfs folder."
                    }
                if (!files.find(v => v.name == "ICF2"))
                    return {
                        type: "error",
                        description: "You are missing ICF2 in your amfs folder."
                    }
            }
        } catch(e) {}
    }
};