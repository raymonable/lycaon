import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";

export default {
    match(entries: Record<string, Record<string, string | number | boolean>>): undefined | SegatoolsResponse {
        if (!entries["ir"] || !entries["io3"]) return;
        let irs = Object.keys(entries["ir"]).filter(v => entries["ir"][v]).length;
        if (irs != 6)
            return {
                type: "error",
                description: `Only ${irs} of 6 IRs are set (ir1 to ir6).`
            }
        if (entries["io3"]["ir"])
            return {
                type: "warning",
                description: "You have IRs set manually, and also set in [io3]. [io3] will be prioritized over [ir]."
            }
        return;
    }
} as SegatoolsProblem;