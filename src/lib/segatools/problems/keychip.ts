import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";

export default {
    match(entries: Record<string, Record<string, string | number | boolean>>): undefined | SegatoolsResponse {
        if (!entries["keychip"]) return;
        let enable = entries["keychip"]["enable"];
        if (typeof(enable) == "boolean" && enable) {
            let id = entries["keychip"]["id"] as string;
            if (id.length != 16 || id.at(4) != "-")
                return {
                    type: "error", description: "Keychip is formatted incorrectly."
                }
        }
        return;
    }
} as SegatoolsProblem;