# lycaon (name pending)

A segatools.ini editor / checker.

> :exclamation: SvelteKit is used to avoid hosting DNS names on the client (and in the future, to enable poweron testing? TBD).<br>
> Everything else is done entirely on the client.

## Hosting

1. Clone this repository
2. Install packages
3. Add DNS to environment
    - The configuration for this is a little messy since I built this to be deployable to Cloudflare Pages.
    - You have to add your DNSes to `$lib/config/dns.example.json`, JSON.stringify it and add it to your environment variables.
    - *It will work fine without this set, but there will be no typo checking for DNS*
4. Run