import { type SegatoolsValue, expectedKeys } from "./segatools/expectedKeys";
import { accessRelativePath, isOption } from "./segatools/fs";

export type SegatoolsResponseType = "severe" | "error" | "warning" | "success" | "loading";
export interface SegatoolsResponse {
    type: SegatoolsResponseType;
    description: string;
    line?: number;
};
export type Segatools = Record<string, Record<string, number | string | boolean>>
export interface SegatoolsProblem {
    match: (entries: Record<string, Record<string, number | string | boolean>>) => Promise<undefined | SegatoolsResponse> // Try to return a response whenever possible.
};

const sectionRegex = /^[\[\]].*?$/;
const problems: SegatoolsProblem[] = 
    Object.values(import.meta.glob('./segatools/problems/*.ts', { eager: true }))
        .map(o => (o as { default: SegatoolsProblem }).default);

const responseSorting: Record<SegatoolsResponseType, number> = {
    "severe": 5,
    "error": 4,
    "warning": 3,
    "success": 2,
    "loading": 1
}

export async function troubleshootSegatools(segatoolsString: string, binPath?: FileSystemDirectoryEntry, scope?: FileSystemDirectoryEntry): Promise<SegatoolsResponse[]> {
    /*
    
    Parsing an ini file is easy, right?
    WRONG! The people using this tool are STUPID.
    Do NOT take any shortcuts.

    Step 1. Extract keys and values, while checking for syntax errors.
        - ... also check paths.
    Step 2. Look for specific issues.
    Step 3. Check options.
    
    */

    const segatools: Segatools = {};
    let responses: SegatoolsResponse[] = [];
    let activatedSections: string[] = [];

    let segments = segatoolsString.split("\n")
        .map(l => l.split(/[\r;]/g)[0]) // Strip away any comments

    for (let l = 0; segments.length > l; l++) {
        // this is a little jank because it wasn't initially built around promises, sorry
        await new Promise(async (r) => {
            let j = segments[l];
            if (!j) return r(true);
            if (j.match(sectionRegex)) {
                if (j.at(0) != "[" || j.at(j.length - 1) != "]")
                    return r(responses.push({
                        type: "error", description: "Inverse squared bracket. It should look like this: [name].", line: l
                    }))
                let sectionName = j.slice(1, j.length - 1);
                if (sectionName == "gpio")
                    responses.push({
                        type: "severe", description: "You are using [gpio] instead of [system]. It's likely that your segatools.ini and/or segatools itself are out of date. Update them to continue."
                    })
                if (!expectedKeys[sectionName])
                    return r(responses.push({
                        type: "error", description: "Unexpected section.", line: l
                    }))
                activatedSections.push(sectionName);
                return r(true);
            };
            if (j.split("=").length <= 1)
                return r(responses.push({
                    type: "error", description: "Only key is set, no value (missing equal sign).", line: l
                }))
            if (activatedSections.length <= 0)
                return r(responses.push({
                    type: "error", description: "Section is not set.", line: l
                }))

            let key = j.split("=")[0];
            let value: string | number | boolean = j.split("=")[1];
            let section = activatedSections[activatedSections.length - 1];
            
            if (expectedKeys[section]) {
                if (expectedKeys[section][key]) {
                    let isOptional = Array.isArray(expectedKeys[section][key]) 
                    let type = isOptional
                        ? expectedKeys[section][key][0] : expectedKeys[section][key];
                    switch (type) {
                        case "string":
                            // We can't type check strings.
                            break;
                        case "boolean":
                            if (value != "0" && value != "1")
                                responses.push({
                                    type: "error", description: `${key} should be a boolean, but isn't.`, line: l
                                });
                            value = value == "1";
                            break;
                        case "path":
                            // TODO: take in the user's path data. For now, partially stub.
                            
                            if (value.at(1) == ":") {
                                responses.push({
                                    type: "warning", description: `Avoid using absolute paths, as I cannot verify the existence ${key}.`, line: l
                                });
                            } else
                                if (binPath) {
                                    try {
                                        let path = await accessRelativePath(binPath, value ?? "", scope);
                                        if ((!path || !value) && !isOptional || (isOptional && !path && value))
                                            responses.push({
                                                type: "error", description: `Unable to locate ${value}`, line: l
                                            })
                                    } catch(e) {
                                        responses.push({
                                            type: "error", description: e as string, line: l
                                        })
                                    }
                                }
                            break;
                        case "keycode":
                            // Nothing much to do here! Maybe in the future we can check if it's really a byte within 0-255 range?
                            break;
                        case "number":
                            if (isNaN(parseFloat(value)))
                                responses.push({
                                    type: "error", description: `${key} should be a number, but isn't.`, line: l
                                });
                                value = parseInt(value);
                            break;
                    };
                    if (!segatools[section])
                        segatools[section] = {};
                    segatools[section][key] = value;
                } else
                    return r(responses.push({
                        type: "warning", description: `"${key}" (in [${section}]) doesn't seem to exist or you may have made a typo. It will be ignored in analysis.`, line: l
                    }))
            } else
                return r(responses.push({
                    type: "error", description: "Invalid section.", line: l
                }))
            r(true);
        })
    }

    for (let idx = 0; problems.length > idx; idx++) {
        let problem = problems[idx];
        let match = await problem.match(segatools);
        if (match)
            responses.push(match);
    }

    // this is ugly
    if (segatools.vfs)
        if (segatools.vfs.option && binPath)
            try {
                let file = await accessRelativePath(binPath, segatools.vfs.option as string) as FileSystemDirectoryEntry | undefined;
                if (file) {
                    // check options
                    let options: FileSystemEntry[] = await new Promise(r => (file as FileSystemDirectoryEntry)?.createReader().readEntries(f => r(f)));
                    if (options.length <= 0)
                        responses.push({
                            type: "error",
                            description: "You have no options! Are you fucking stupid? Get some damn options!"
                        })
                    for (let idx = 0; options.length > idx; idx++) {
                        let option = options[idx];
                        if (isOption(option.name) && option.isDirectory) {
                            let children: FileSystemEntry[] = await new Promise(r => (option as FileSystemDirectoryEntry)?.createReader().readEntries(f => r(f)));
                            if (children.find(child => isOption(child.name)))
                                responses.push({
                                    type: "error",
                                    description: `Option ${option.name} contains an unnecessary child folder.`
                                })
                        }
                    }
                }
            } catch(e) {};
            
    if (!binPath)
        responses.push({
            type: "warning",
            description: "Limited functionality is available because only segatools.ini is available. Next time, drag and drop your folder."
        })
    if (responses.find(v => v.type == "severe")) {
        responses = [...responses.filter(v => v.type == "severe"), {
            type: "warning",
            description: "All other errors have been hidden. Please resolve the above to continue."
        }]
    }

    responses.sort((a, b) => responseSorting[b.type] - responseSorting[a.type]);

    return responses;
};