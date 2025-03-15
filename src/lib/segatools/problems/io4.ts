import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";

export default {
    async match(entries: Record<string, Record<string, string | number | boolean>>): Promise<undefined | SegatoolsResponse> {    
        if (!entries["io4"]) return;
        let enable = entries["io4"]["enable"];
        if (typeof (enable) == "boolean" && !enable)
            return {
                type: "warning",
                description: "io4 is disabled. You probably want this on unless your setup requires it to be off."
            }
        return;
    }
} as SegatoolsProblem;