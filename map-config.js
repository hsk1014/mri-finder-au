// Map UI and tile delivery are intentionally separate. Replace this object at
// deployment time when a production tile provider or self-hosted endpoint is chosen.
window.ImagingFinderMapConfig = Object.freeze({
  providerName: "OpenStreetMap",
  tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
  privacyUrl: "https://osmfoundation.org/wiki/Privacy_Policy",
  tilePolicyUrl: "https://operations.osmfoundation.org/policies/tiles/",
  minZoom: 3,
  maxZoom: 18,
  productionReady: false
});
