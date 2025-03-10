import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";

/* Please help fill in this table! */
export const dns: Record<string, string> = {
    "aquadx.hydev.org": "AquaDX",
};

function isIpAddress(address: string): boolean {
    // Not accounting for IPV6 because IPV6 is wrong.
    let addr = address.split(".");
    return addr.length == 4 && addr.every(v => !isNaN(parseInt(v)))
};
function isDomain(address: string): boolean {
    return address.split(".").length >= 2;
};

export default {
    match(entries: Record<string, Record<string, string | number | boolean>>): undefined | SegatoolsResponse {
        if (!entries["dns"]) return;
        let address = entries["dns"]["default"] as string;
        if (address == "127.0.0.1" || !address)
            return {
                type: "warning", description: `You are not connecting to an ALL.net server. You may have problems with Accounting Database on first start.`
            }
        else if (isIpAddress(address)) {
                return {
                    type: "success", description: `Your ALL.net server is set to ${address}`
                }
            } else if (isDomain(address))
                return {
                    type: "success", description: `Your ALL.net server is set to ${dns[address] ? `${dns[address]} (${address})` : `${address}`}`
                }
    }
} as SegatoolsProblem;