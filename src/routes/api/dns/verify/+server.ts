import { redirect } from "@sveltejs/kit"
import levenshtein from "js-levenshtein";
import { env } from "$env/dynamic/private";

const dns: Record<string, string> = JSON.parse(env.DNS ?? "{}");
function detectPossibleTypo(address: string): string | undefined {
    return Object.keys(dns).find(v => {
        let distance = levenshtein(address, v)
        return distance <= 2 && distance != 0;
    });
}

export function GET({url}) {
	let address = url.searchParams.get("address");
    if (!address) return new Response(JSON.stringify({}), {headers: {"Content-Type": "application/json"}});
    
    let possibleTypo = detectPossibleTypo(address);
    if (possibleTypo) return new Response(JSON.stringify({
        type: "warning", description: `Possible typo in DNS, did you mean ${possibleTypo}? (${address})`
    }), {headers: {'Content-Type': 'application/json'}});

    return new Response(JSON.stringify({
        type: "success", description: `Your ALL.net server is set to ${dns[address] ? `${dns[address]} (${address})` : `${address}`}`
    }), {headers: {'Content-Type': 'application/json'}});
}

export const prerender = false;