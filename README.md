# lycaon project

> :warning: This project's codebase is not good and does not reflect my current TypeScript capabilities. Please forgive me.

A segatools.ini editor / checker for a specific slider-based game.

## Features

Checks:
- All paths in segatools.ini<br>
    *Also does a brief check of the contents of paths*
- Access code formatting
- Keychip formatting
- Game server (:construction:)
- Binary versions (based on 2T patches)

Generally, if there are no errors mentioning it and it's shown on the list above, you can probably rule it out as being problematic.

## Hosting

1. Clone this repository
2. Install packages
3. Add DNS to environment
    - The configuration for this is a little messy since I built this to be deployable to Cloudflare Pages.
    - You have to add your DNSes to `$lib/config/dns.example.json`, JSON.stringify it and add it to your environment variables.
    - *It will work fine without this set, but there will be no typo checking for DNS*
4. Run
