import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";

export default {
    match(entries: Record<string, Record<string, string | number | boolean>>): undefined | SegatoolsResponse {
        if (!entries["slider"] || !entries["chuniio"]) return;
        let enable = entries["slider"]["enable"];
        
        let path = entries["chuniio"]["path"];
        let path32 = entries["chuniio"]["path32"];
        let path64 = entries["chuniio"]["path64"];

        if (path && (path32 || path64))
            return {
                type: "error",
                description: "You have two different sets of DLLs enabled. Only have path64 and path32 or just path set."
            }
        if ((path32 && !path64) || (!path32 && path64))
            return {
                type: "error",
                description: `You only have path${path32 ? "32" : "64"} set, you also need path${!path32 ? "32" : "64"}.`
            }

        if (typeof (enable) == "boolean" && !enable && (path64 || path32))
            return {
                type: "warning",
                description: "Slider emulation is disabled, but you have DLLs enabled. You'll probably want this on."
            }
        return;
    }
} as SegatoolsProblem;