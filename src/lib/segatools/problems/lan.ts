import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";

export default {
    match(entries: Record<string, Record<string, string | number | boolean>>): undefined | SegatoolsResponse {
        if (!entries["system"]) return;
        let enable = entries["system"]["dipsw1"];
        if (typeof (enable) == "boolean" && !enable)
            return {
                type: "warning",
                description: "Server mode (LAN install) is disabled. Unless you're running this in a very specific setup (more than one machine), you'll want this on."
            }
        return;
    }
} as SegatoolsProblem;