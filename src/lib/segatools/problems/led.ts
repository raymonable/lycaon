import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";

export default {
    match(entries: Record<string, Record<string, string | number | boolean>>): undefined | SegatoolsResponse {
        if (!entries["led15093"]) return;
        let enable = entries["led15093"]["enable"];
        if (typeof (enable) == "boolean" && !enable)
            return {
                type: "warning",
                description: "LED15093 emulation is disabled. You probably want this on."
            }
        return;
    }
} as SegatoolsProblem;