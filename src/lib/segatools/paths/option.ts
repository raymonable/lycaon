import { type SegatoolsPathProblem, type SegatoolsResponse, type SegatoolsResponseType } from "../../segatools";
import { accessRelativePath, isOption } from "../fs";

import opts from "$lib/config/opts.json"
import type { ChusanExecutable } from "../patch";

export default {
    async match(entries: Record<string, Record<string, string | number | boolean>>, binPath: FileSystemDirectoryEntry, scope: FileSystemDirectoryEntry, chusan: ChusanExecutable): Promise<undefined | SegatoolsResponse> {
        if (!entries["vfs"]) return;
        try {
            const smallVersion = chusan.version.substring(0, 4);
            const officialOptData = opts[smallVersion] ?? [];

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
                        if (officialOptData.includes(option.name)) {
                            optionNames.push(option.name); 
                        } else
                            optionNames.push(`${option.name}?`);
                    } else {
                        optionInfos.push(`${option.name}??`);
                        optionInfoType = "warning";
                    }
                }
                optionInfos.push(`Options: ${optionNames.join(", ")}`)
            }
            if (optionInfos.length <= 0) {
                optionInfos.push("Unable to index options.");
                optionInfoType = "warning";
            }
            return {
                description: optionInfos.join(". "),
                type: optionInfoType
            }
        } catch(e) {};

        return;
    }
} as SegatoolsPathProblem;