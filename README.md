# MRI Finder AU — Alpha

Lightweight hobby Alpha for finding Bulk bill and Private billing MRI units on a real map and in a matching list. Government-listed locations are grouped as `Bulk bill MRI unit` with an always-conditional notice; other reviewed provider-listed MRI locations are grouped as `Private billing MRI unit`.

Live Alpha: https://hsk1014.github.io/mri-finder-au/

Open `index.html` directly in a browser. No build step or package install is required. The basemap needs network access to the configured third-party tile endpoint; search and clinic results remain available if tiles fail. `mri-locations.js` is the generated public Alpha snapshot and `tools/fetch-mri-alpha.js` refreshes it from the official ArcGIS Feature Layer. The earlier broad-directory files remain in the repository as inactive project history.

## Included

- 421 government-listed MRI locations shown as conditional Bulk bill MRI units
- 218 provider-listed MRI locations not matched to the government list, shown as Private billing MRI units
- Street-address coordinates for all 218 Private billing locations, checked against provider pages and/or Geoscience Australia National Address Points (G-NAF)
- Leaflet pins plus matching clinic list
- Clinic/suburb/postcode, state and two-option billing filters
- Victoria default and nationwide view
- Directions and clinic-phone web search links
- Explicit opt-in, in-memory approximate distance sorting
- Short visible reminder to confirm the exact MRI, referral rules, fee and availability with the clinic

## Map boundary

Leaflet 1.9.4 is vendored locally under `vendor/leaflet/`. Tile-provider settings are separate in `map-config.js`; the checked-in OpenStreetMap endpoint is marked as a replaceable development/public-beta default, not a production-ready unlimited backend. See `docs/MAP_PROVIDER_BOUNDARY.md` for attribution, privacy, availability, geocoding, production-provider, and verified-coordinate requirements.

Government-listed locations use published points from the Australian Government MRI Unit Locations layer. Every other reviewed MRI location uses a street address and coordinate checked against the provider's published location information and/or Geoscience Australia National Address Points (G-NAF). Directions open the mapped coordinate; users should still confirm the clinic address before travelling.

## Data note

The Alpha snapshot contains 639 mapped locations: 421 government-listed conditional Bulk bill units and 218 Private billing units compiled from the reviewed provider directory. All 375 reviewed provider-published MRI locations are represented in the union; government-only locations account for the remaining coverage. The government source item is licensed under Creative Commons Attribution 4.0 International. Private-location address points were checked against current provider pages and/or the Australian Government's G-NAF data.

This is an intentionally simple Alpha classification, not a verified price promise. Bulk billing is always conditional: a clinic may choose not to bulk bill a particular patient or examination. Users must confirm the requested scan, referral, address, fee and appointment availability with the clinic.

## Continue On Another Computer

The private source repository is `https://github.com/hsk1014/RADCODE`. Use GitHub as the shared source of truth and follow `docs/agents/NEW_PC_HANDOFF.md`. A fresh Codex conversation should read `AGENTS.md`, `docs/BLUEPRINT_V1.md`, and all files under `docs/agents/` before changing anything. Start each session with `git status -sb` and `git pull --ff-only`; finish material work by updating the agent files, committing, and pushing.

The public hosting repository is `https://github.com/hsk1014/mri-finder-au` and contains only the static public assets. GitHub Pages serves it from `main` at the live Alpha URL above. Do not publish the private source repository merely to deploy the site.

The linked Supabase project is `uqpyftifhtapgvzsxpek`. Its remote database has 45 providers, 787 locations, 38 scan types, and 4,516 service/evidence rows. Read `supabase/README.md` and the current handoff before any database operation.
