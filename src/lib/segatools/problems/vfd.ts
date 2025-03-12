import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";

export default {
    async match(entries: Record<string, Record<string, string | number | boolean>>): Promise<undefined | SegatoolsResponse> {    if (!entries["vfd"]) return;
        let enable = entries["vfd"]["enable"];
        if (typeof (enable) == "boolean" && !enable)
            return {
                type: "warning",
                description: "VFD emulation is disabled. You probably want this on."
            }
        return;
    }
} as SegatoolsProblem;