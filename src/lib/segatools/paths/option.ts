import { type SegatoolsPathProblem, type SegatoolsResponse, type SegatoolsResponseType } from "../../segatools";
import { accessRelativePath, isOption } from "../fs";

export default {
    async match(entries: Record<string, Record<string, string | number | boolean>>, binPath: FileSystemDirectoryEntry, scope: FileSystemDirectoryEntry): Promise<undefined | SegatoolsResponse> {
        if (!entries["vfs"]) return;
        try {
            let optionInfos = []; let optionInfoType: SegatoolsResponseType = "success";
            let file = await accessRelativePath(binPath, entries["vfs"]["option"] as string) as FileSystemDirectoryEntry | undefined;
            if (file) {
                let options: FileSystemEntry[] = await new Promise(r => (file as FileSystemDirectoryEntry)?.createReader().readEntries(f => r(f)));
                if (options.filter(v => isOption(v.name)).length <= 0)
                    return {
                        type: "error",
                        description: "Either you have no options, or you picked the wrong folder. You NEED A001 for the game to work properly."
                    }
                let optionNames = [];
                for (let idx = 0; options.length > idx; idx++) {
                    let option = options[idx];
                    if (isOption(option.name) && option.isDirectory) {
                        let children: FileSystemEntry[] = await new Promise(r => (option as FileSystemDirectoryEntry)?.createReader().readEntries(f => r(f)));
                        if (children.find(child => isOption(child.name))) {
                            optionInfos.push(`Option ${option.name} contains an unnecessary child folder`);
                            optionInfoType = "warning";
                        }
                        optionNames.push(option.name);
                    } else {
                        optionInfos.push(`Non-original option ${option.name}`);
                        optionInfoType = "warning";
                    }
                }
                optionInfos.push(`Options: ${optionNames.join(", ")}`)
            }
            return {
                description: optionInfos.join(". "),
                type: optionInfoType
            }
        } catch(e) {};

        return;
    }
} as SegatoolsPathProblem;