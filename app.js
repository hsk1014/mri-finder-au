(() => {
  const data = window.MriFinderAlphaData;
  const mapConfig = window.ImagingFinderMapConfig;
  if (!data || !window.L || !mapConfig) return;

  const stateNames = {
    ALL: "Australia",
    ACT: "Australian Capital Territory",
    NSW: "New South Wales",
    NT: "Northern Territory",
    QLD: "Queensland",
    SA: "South Australia",
    TAS: "Tasmania",
    VIC: "Victoria",
    WA: "Western Australia"
  };
  const colours = {
    bulk: "#32c982",
    private: "#e9b949"
  };
  const elements = {
    search: document.querySelector("#searchInput"),
    state: document.querySelector("#stateSelect"),
    billing: document.querySelector("#billingSelect"),
    useLocation: document.querySelector("#useLocationButton"),
    locationStatus: document.querySelector("#locationStatus"),
    resultsTitle: document.querySelector("#resultsTitle"),
    resultCount: document.querySelector("#resultCount"),
    resultsList: document.querySelector("#resultsList"),
    officialCount: document.querySelector("#officialCount"),
    dataFreshness: document.querySelector("#dataFreshness")
  };
  let userLocation = null;
  let visibleLocations = [];
  const markersById = new Map();

  const map = window.L.map("map", {
    minZoom: mapConfig.minZoom,
    maxZoom: mapConfig.maxZoom,
    zoomControl: true,
    preferCanvas: true
  }).setView([-37.1, 145.2], 6);
  const tileLayer = window.L.tileLayer(mapConfig.tileUrl, {
    attribution: mapConfig.attribution,
    minZoom: mapConfig.minZoom,
    maxZoom: mapConfig.maxZoom
  }).addTo(map);
  const markerLayer = window.L.layerGroup().addTo(map);
  const userLayer = window.L.layerGroup().addTo(map);

  tileLayer.on("tileerror", () => {
    elements.locationStatus.textContent = "The background map is temporarily unavailable. The MRI list still works.";
  });

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalise(value) {
    return String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
  }

  function distanceKm(from, location) {
    const radius = 6371;
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const latitudeDelta = toRadians(location.latitude - from.latitude);
    const longitudeDelta = toRadians(location.longitude - from.longitude);
    const a = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(location.latitude))
      * Math.sin(longitudeDelta / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function directionsUrl(location) {
    if (location.coordinateAccuracy === "postcode") {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.name} ${location.address.replace(/—.*$/, "")}`)}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`;
  }

  function clinicSearchUrl(location) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${location.name} ${location.address} phone`)}`;
  }

  function getFilteredLocations() {
    const query = normalise(elements.search.value);
    const selectedState = elements.state.value;
    const selectedBilling = elements.billing.value;
    const matches = data.locations.filter((location) => {
      const haystack = normalise(`${location.name} ${location.address} ${location.postcode} ${location.lspn}`);
      return (!query || haystack.includes(query))
        && (selectedState === "ALL" || location.state === selectedState)
        && (selectedBilling === "all" || location.billingStatus === selectedBilling);
    }).map((location) => ({
      ...location,
      distance: userLocation ? distanceKm(userLocation, location) : null
    }));
    if (userLocation) return matches.sort((a, b) => a.distance - b.distance);
    return matches.sort((a, b) => a.name.localeCompare(b.name));
  }

  function popupHtml(location) {
    return `
      <strong>${escapeHtml(location.name)}</strong>
      <p>${escapeHtml(location.address)}</p>
      <p>${escapeHtml(location.billingLabel)}</p>
      <a href="${directionsUrl(location)}" target="_blank" rel="noreferrer">Open directions ↗</a>
    `;
  }

  function renderMap(locations) {
    markerLayer.clearLayers();
    markersById.clear();
    const bounds = [];
    locations.forEach((location) => {
      const marker = window.L.circleMarker([location.latitude, location.longitude], {
        radius: 7,
        weight: 2,
        color: "#071a20",
        fillColor: colours[location.billingStatus],
        fillOpacity: 0.92
      }).bindPopup(popupHtml(location));
      marker.addTo(markerLayer);
      markersById.set(location.id, marker);
      bounds.push([location.latitude, location.longitude]);
    });
    if (bounds.length === 1) map.setView(bounds[0], 13);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [34, 34], maxZoom: 12 });
  }

  function renderList(locations) {
    if (!locations.length) {
      elements.resultsList.innerHTML = '<div class="empty"><strong>No matching MRI locations</strong><p>Try another state, billing status or search term.</p></div>';
      return;
    }
    elements.resultsList.innerHTML = locations.map((location) => `
      <article class="clinic-card" id="card-${escapeHtml(location.id)}">
        <h3>${escapeHtml(location.name)}</h3>
        <p class="clinic-address">${escapeHtml(location.address)}</p>
        ${location.distance !== null ? `<p class="distance">Approximately ${location.distance < 10 ? location.distance.toFixed(1) : Math.round(location.distance)} km away</p>` : ""}
        <div class="card-meta">
          <span class="badge badge-${escapeHtml(location.billingStatus)}">${escapeHtml(location.billingLabel)}</span>
        </div>
        <p class="billing-condition">${escapeHtml(location.billingCondition)}</p>
        <div class="card-actions">
          <button type="button" data-show-on-map="${escapeHtml(location.id)}">Show on map</button>
          <a href="${directionsUrl(location)}" target="_blank" rel="noreferrer">Directions ↗</a>
          <a href="${clinicSearchUrl(location)}" target="_blank" rel="noreferrer">Find phone ↗</a>
        </div>
      </article>
    `).join("");
  }

  function render() {
    visibleLocations = getFilteredLocations();
    const selectedState = elements.state.value;
    elements.resultsTitle.textContent = `${stateNames[selectedState]} MRI locations`;
    elements.resultCount.textContent = visibleLocations.length;
    renderMap(visibleLocations);
    renderList(visibleLocations);
  }

  function focusLocation(id) {
    const location = visibleLocations.find((item) => item.id === id);
    const marker = markersById.get(id);
    if (!location || !marker) return;
    map.setView([location.latitude, location.longitude], 14);
    marker.openPopup();
    document.querySelector("#map").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  elements.search.addEventListener("input", render);
  elements.state.addEventListener("change", () => {
    userLocation = null;
    userLayer.clearLayers();
    elements.locationStatus.textContent = "";
    render();
  });
  elements.billing.addEventListener("change", render);
  elements.resultsList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-show-on-map]");
    if (button) focusLocation(button.dataset.showOnMap);
  });
  elements.useLocation.addEventListener("click", () => {
    if (!navigator.geolocation) {
      elements.locationStatus.textContent = "Location is not supported by this browser. Search by suburb or postcode instead.";
      return;
    }
    elements.useLocation.disabled = true;
    elements.locationStatus.textContent = "Requesting your location…";
    navigator.geolocation.getCurrentPosition((position) => {
      userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      elements.state.value = "ALL";
      userLayer.clearLayers();
      window.L.circleMarker([userLocation.latitude, userLocation.longitude], {
        radius: 7,
        weight: 3,
        color: "#ffffff",
        fillColor: "#1689ff",
        fillOpacity: 1
      }).bindTooltip("Your approximate location").addTo(userLayer);
      elements.locationStatus.textContent = "Sorted by approximate straight-line distance. Your coordinates stay in this page and are not stored by MRI Finder AU.";
      elements.useLocation.disabled = false;
      render();
    }, () => {
      elements.locationStatus.textContent = "Location was not available. Search by suburb or postcode instead.";
      elements.useLocation.disabled = false;
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });

  elements.officialCount.textContent = data.metadata.totalLocationCount || data.locations.length;
  const sourceDate = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(data.metadata.sourceModified));
  elements.dataFreshness.textContent = `Government-listed Bulk bill MRI units: ${data.metadata.officialLocationCount}. Private billing MRI units: ${data.metadata.privateLocationCount || 0}. Government source last modified ${sourceDate}; snapshot generated ${new Date(data.metadata.generatedAt).toLocaleDateString("en-AU")}.`;
  render();
})();
