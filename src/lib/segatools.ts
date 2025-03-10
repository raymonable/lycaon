import { type SegatoolsValue, expectedKeys } from "./segatools/expectedKeys";

export interface SegatoolsResponse {
    type: "severe" | "error" | "warning" | "success";
    description: string;
    line?: number;
};
export type Segatools = Record<string, Record<string, number | string | boolean>>
export interface SegatoolsProblem {
    match: (entries: Record<string, Record<string, number | string | boolean>>) => undefined | SegatoolsResponse // Try to return a response whenever possible.
};

const sectionRegex = /^[\[\]].*?$/;
const problems: SegatoolsProblem[] = 
    Object.values(import.meta.glob('./segatools/problems/*.ts', { eager: true }))
        .map(o => (o as { default: SegatoolsProblem }).default);

export function troubleshootSegatools(segatoolsString: string): SegatoolsResponse[] {
    /*
    
    Parsing an ini file is easy, right?
    WRONG! The people using this tool are STUPID.
    Do NOT take any shortcuts.

    Step 1. Extract keys and values, while checking for syntax errors.
    Step 2. Look for specific issues.
    
    */

    const segatools: Segatools = {};
    const responses: SegatoolsResponse[] = [];

    let activatedSections: string[] = [];

    segatoolsString.split("\n")
        .map(l => l.split(/[\r;]/g)[0]) // Strip away any comments
        .forEach((j, l) => {
            if (!j) return;
            if (j.match(sectionRegex)) {
                if (j.at(0) != "[" || j.at(j.length - 1) != "]")
                    return responses.push({
                        type: "error", description: "Inverse squared bracket. It should look like this: [name].", line: l
                    })
                let sectionName = j.slice(1, j.length - 1);
                if (sectionName == "gpio")
                    return responses.push({
                        type: "severe", description: "You are using [gpio] instead of [system]. It's likely that your segatools.ini and/or segatools itself are out of date. Please update them."
                    })
                if (!expectedKeys[sectionName])
                    return responses.push({
                        type: "severe", description: "Unexpected section.", line: l
                    })
                activatedSections.push(sectionName);
                return;
            };
            if (j.split("=").length <= 1)
                return responses.push({
                    type: "error", description: "Only key is set, no value (missing equal sign).", line: l
                })
            if (activatedSections.length <= 0)
                return responses.push({
                    type: "error", description: "Section is not set.", line: l
                })

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
                            if (value.at(1) == ":")
                                responses.push({
                                    type: "warning", description: "Do not hardcode your paths. Use relativity.", line: l
                                });
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
                    return responses.push({
                        type: "warning", description: `"${key}" (in [${section}]) doesn't exist or you may have made a typo. It will be ignored in analysis.`, line: l
                    })
            } else
                return responses.push({
                    type: "error", description: "Invalid section.", line: l
                })
        });

    problems.forEach(problem => {
        let match = problem.match(segatools);
        if (match)
            responses.push(match);   
    })
    return responses;
};