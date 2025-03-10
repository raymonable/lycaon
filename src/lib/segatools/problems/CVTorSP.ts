import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";

export default {
    match(entries: Record<string, Record<string, string | number | boolean>>): undefined | SegatoolsResponse {
        if (!entries["system"]) return;
        let dipsw2 = entries["system"]["dipsw2"];
        let dipsw3 = entries["system"]["dipsw3"];

        if (typeof(dipsw2) == "boolean" && typeof(dipsw3) == "boolean")
            if (dipsw2 != dipsw3)
                return {
                    type: "error", description: "Dipswitches 2 & 3 must be the same."
                }
            else
                return {
                    type: "success", description: `Dipswitches are set for ${!dipsw2 ? "120" : "60"}fps, ${!dipsw2 ? "SP" : "CVT"} mode.`
                }

        return;
    }
} as SegatoolsProblem;