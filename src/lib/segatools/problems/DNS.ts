import { type SegatoolsProblem, type SegatoolsResponse } from "../../segatools";
import levenshtein from "js-levenshtein";

function isIpAddress(address: string): boolean {
    // Not accounting for IPV6 because IPV6 is wrong.
    let addr = address.split(".");
    return addr.length == 4 && addr.every(v => !isNaN(parseInt(v)))
};
function isDomain(address: string): boolean {
    return address.split(".").length >= 2;
};
let dnsResponseCache: Record<string, SegatoolsResponse> = {};
async function getDnsInformation(address: string): Promise<SegatoolsResponse> { 
    if (dnsResponseCache[address]) return dnsResponseCache[address];
    let response = await fetch(`/api/dns/verify?address=${address}`, {
        headers: {
            "Content-Type": "application/json"
        },
    }).then(r => r.json()) as SegatoolsResponse;
    dnsResponseCache[address] = response;
    return response;
}

export default {
    async match(entries: Record<string, Record<string, string | number | boolean>>): Promise<undefined | SegatoolsResponse> {
        if (!entries["dns"]) return;
        let address = entries["dns"]["default"] as string;

        if (address == "127.0.0.1" || !address)
            return {
                type: "warning", description: `You are not specifically connecting to a game server. You may have problems with Accounting Database on first start.`
            }
        else if (isIpAddress(address)) {
                return {
                    type: "success", description: `Your game server DNS is set to ${address}`, censorKey: address.slice(2)
                }
            } else if (isDomain(address))
                return getDnsInformation(address);
    }
} as SegatoolsProblem;