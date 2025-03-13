# lycaon project

A segatools.ini editor / checker.

> :warning: Firefox and other non-Chromium based browsers is not properly supported yet as `webkitEntries` (yes, an old API, whatever) doesn't work as intended on Firefox.

## Hosting

1. Clone this repository
2. Install packages
3. Add DNS to environment
    - The configuration for this is a little messy since I built this to be deployable to Cloudflare Pages.
    - You have to add your DNSes to `$lib/config/dns.example.json`, JSON.stringify it and add it to your environment variables.
    - *It will work fine without this set, but there will be no typo checking for DNS*
4. Run