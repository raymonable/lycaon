import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";

export default {
    async match(entries: Record<string, Record<string, string | number | boolean>>): Promise<undefined | SegatoolsResponse> {
        if (!entries["aime"]) return;
        let enable = entries["aime"]["enable"];
        if (typeof (enable) == "boolean" && !enable)
            return {
                type: "warning",
                description: "Aime reader emulation is disabled. If you're not using a physical reader through serial, you should enable it."
            }
        return;
    }
} as SegatoolsProblem;