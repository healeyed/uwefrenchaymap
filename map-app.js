// map-app.js - module that contains the interactive map logic
// Imports POI data as an ES module
import { pointOfInterestData } from './pointsOfInterestData.js';

let mapInstance; // Global within module
let buildingsLoaded = false;
let mapInitialized = false;
let buildingFeatures = [];
let hiddenCategories = new Map();
let infoWindow;
const uweFrenchayLocation = { lat: 51.5015, lng: -2.549 };
const CLOUD_MAP_ID = '9ba11c71e746911dd677c62b';
let isCustomMap = true;
let poiMarker = null;

function showMessage(title, message) {
  const container = document.getElementById('message-container');
  container.innerHTML = `
    <div class="message-box border-t-4 border-indigo-500">
      <h3 class="text-xl font-bold mb-2 text-gray-800">${title}</h3>
      <p class="text-gray-600 mb-4">${message}</p>
      <button id="message-got-it" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150">
        Got it!
      </button>
    </div>
  `;
  container.classList.remove('hidden');
  document.getElementById('message-got-it').addEventListener('click', closeMessage);
}

function closeMessage() {
  document.getElementById('message-container').classList.add('hidden');
}

function calculateApproximateCenter(geometry) {
  let latSum = 0, lngSum = 0, count = 0;
  const coordinates = geometry.getArray()[0].getArray();
  coordinates.forEach(point => { latSum += point.lat(); lngSum += point.lng(); count++; });
  return { lat: latSum / count, lng: lngSum / count };
}

function styleFeature(feature) {
  return {
    fillColor: feature.getProperty('color'),
    strokeWeight: 2,
    strokeColor: '#333333',
    fillOpacity: 0.5
  };
}

function getUniqueCategories() {
  const categories = new Map();
  if (!mapInstance) return [];
  mapInstance.data.forEach(feature => {
    const category = feature.getProperty('category');
    const color = feature.getProperty('color') || '#888888';
    if (category) categories.set(category, color);
  });
  return Array.from(categories, ([category, color]) => ({ category, color }));
}

function loadBuildingData() {
  if (buildingsLoaded) return;
  mapInstance.data.loadGeoJson('frenchay-campus-geojson.json', null, (features) => {
    mapInstance.data.setStyle(styleFeature);
    features.forEach(feature => {
      const geometry = feature.getGeometry();
      let center = { lat: uweFrenchayLocation.lat, lng: uweFrenchayLocation.lng };
      if (geometry && geometry.getType) {
        const type = geometry.getType();
        try {
          if (type === 'Polygon') {
            const ring = geometry.getArray()[0].getArray();
            let latSum = 0, lngSum = 0, cnt = 0;
            ring.forEach(pt => { latSum += pt.lat(); lngSum += pt.lng(); cnt++; });
            if (cnt) center = { lat: latSum / cnt, lng: lngSum / cnt };
          } else if (type === 'MultiPolygon') {
            const poly = geometry.getArray()[0].getArray()[0].getArray();
            let latSum = 0, lngSum = 0, cnt = 0;
            poly.forEach(pt => { latSum += pt.lat(); lngSum += pt.lng(); cnt++; });
            if (cnt) center = { lat: latSum / cnt, lng: lngSum / cnt };
          }
        } catch (e) { /* fallback */ }
      }
      const name = feature.getProperty('name') || '';
      const marker = new google.maps.Marker({ position: center, map: mapInstance, label: { text: name, fontWeight: 'bold', color: 'black', fontSize: '14px' }, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 } });
      buildingFeatures.push({ feature, marker });
    });

    infoWindow = new google.maps.InfoWindow();

    mapInstance.data.addListener('mouseover', (event) => {
      mapInstance.data.overrideStyle(event.feature, { fillColor: '#ef4444', strokeWeight: 4, strokeColor: '#b91c1c', fillOpacity: 0.9 });
    });

    mapInstance.data.addListener('mouseout', (event) => {
      if (!hiddenCategories.has(event.feature.getProperty('category'))) mapInstance.data.revertStyle();
    });

    mapInstance.data.addListener('click', (event) => {
      const name = event.feature.getProperty('name');
      const category = event.feature.getProperty('category');
      const details = event.feature.getProperty('details') || '';
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
      infoWindow.setContent(`
        <div class="p-1 max-w-xs">
          <h4 class="text-md font-bold text-indigo-700">${name}</h4>
          <p class="text-sm mt-1 text-gray-700"><strong>Category:</strong> ${category}</p>
          <p class="text-sm text-gray-700 mb-2"><strong>Details:</strong> ${details}</p>
          <a href="${navigationUrl}" target="_blank" class="inline-flex items-center text-sm font-semibold text-white bg-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-700 transition duration-150 shadow-md">Navigate to Here</a>
        </div>
      `);
      infoWindow.setPosition(event.latLng);
      infoWindow.open(mapInstance);
    });

    buildingsLoaded = true;
    const legendDiv = document.getElementById('map-legend');
    if (legendDiv) createLegend();
  });
}

function toggleCategoryVisibility(categoryName) {
  const safeCategoryName = categoryName.replace(/\s/g, '-');
  const legendItem = document.getElementById(`legend-${safeCategoryName}`);
  if (hiddenCategories.has(categoryName)) {
    hiddenCategories.delete(categoryName);
    legendItem.classList.remove('opacity-50', 'bg-gray-200');
  } else {
    hiddenCategories.set(categoryName, true);
    legendItem.classList.add('opacity-50', 'bg-gray-200');
  }
  buildingFeatures.forEach(obj => {
    const featureCategory = obj.feature.getProperty('category');
    if (featureCategory === categoryName) {
      const isHidden = hiddenCategories.has(categoryName);
      mapInstance.data.overrideStyle(obj.feature, { visible: !isHidden });
      obj.marker.setMap(isHidden ? null : mapInstance);
    }
  });
}

function addEastEntranceMarker() {
  const eastEntranceLocation = { lat: 51.5002, lng: -2.5442185630856793 };
  new google.maps.Marker({ position: eastEntranceLocation, map: mapInstance, label: { text: 'East entrance', fontWeight: 'bold', color: 'black', fontSize: '16px' }, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 } });
}

function addDirectionalArrow() {
  const arrowPath = [ { lat: 51.49967621393417, lng: -2.543985706251763 }, { lat: 51.499405716300075, lng: -2.543985706251763 } ];
  const labelPosition = { lat: 51.49975, lng: -2.5441 };
  const arrowColor = '#374151';
  const arrowHead = { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 5, strokeColor: arrowColor, fillColor: arrowColor, fillOpacity: 1 };
  new google.maps.Polyline({ path: arrowPath, geodesic: true, strokeColor: arrowColor, strokeOpacity: 1.0, strokeWeight: 4, map: mapInstance, icons: [{ icon: arrowHead, offset: '100%' }] });
  new google.maps.Marker({ position: labelPosition, map: mapInstance, label: { text: 'To Glenside campus', fontWeight: 'bold', color: 'black', fontSize: '15px' }, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 } });
}

function createLegend() {
  const legendDiv = document.getElementById('map-legend');
  const categories = getUniqueCategories();
  legendDiv.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'flex items-center space-x-2 mb-2 pb-1 border-b border-gray-300';
  const img = document.createElement('img');
  img.src = 'https://style.uwe.ac.uk/branding/twentytwenty/engine/images/logo.svg';
  img.alt = 'UWE Bristol';
  img.className = 'w-10 h-10';
  const h4 = document.createElement('h4');
  h4.className = 'text-lg font-bold text-white';
  h4.textContent = 'Frenchay Campus';
  header.appendChild(img);
  header.appendChild(h4);

  const ul = document.createElement('ul');
  ul.className = 'space-y-1';

  categories.forEach(item => {
    const safeCategoryName = item.category.replace(/\s/g, '-');
    const li = document.createElement('li');
    li.id = `legend-${safeCategoryName}`;
    li.className = 'legend-item flex items-center text-sm text-white cursor-pointer p-1 rounded transition duration-150 hover:bg-indigo-50 hover:shadow-sm';
    const sw = document.createElement('span');
    sw.className = 'inline-block w-4 h-4 rounded-sm mr-2';
    sw.style.backgroundColor = item.color;
    sw.style.border = '1px solid #333';
    li.appendChild(sw);
    li.appendChild(document.createTextNode(item.category));
    li.addEventListener('click', () => toggleCategoryVisibility(item.category));
    ul.appendChild(li);
  });

  legendDiv.appendChild(header);
  legendDiv.appendChild(ul);
}

function toggleMapType() {
  if (!mapInstance) return;
  const button = document.getElementById('map-toggle-button');
  const options = {};
  if (isCustomMap) {
    options.mapId = undefined;
    options.mapTypeId = 'satellite';
    isCustomMap = false;
    if (button) button.innerHTML = 'Switch to <span class="font-bold">Campus Style</span>';
  } else {
    options.mapId = CLOUD_MAP_ID;
    options.mapTypeId = 'roadmap';
    isCustomMap = true;
    if (button) button.innerHTML = 'Switch to <span class="font-bold">Default Satellite</span>';
  }
  mapInstance.setOptions(options);
}

function populatePoiDropdown() {
  const select = document.getElementById('poi-selector');
  if (!select) return;
  select.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Find a place...';
  select.appendChild(defaultOption);
  pointOfInterestData.forEach(poi => {
    const option = document.createElement('option');
    option.value = `${poi.lat}|${poi.lng}|${poi.name}|${poi.details}`;
    option.textContent = poi.name;
    select.appendChild(option);
  });
}

function handlePoiSelection(event) {
  const selectedValue = event.target.value;
  if (poiMarker) { poiMarker.setMap(null); poiMarker = null; infoWindow && infoWindow.close(); }
  if (selectedValue === '') return;
  const parts = selectedValue.split('|'); if (parts.length < 4) return;
  const [latStr, lngStr, name, details] = parts; const lat = parseFloat(latStr); const lng = parseFloat(lngStr);
  const position = { lat, lng };
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  poiMarker = new google.maps.Marker({ position, map: mapInstance, title: name, icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: '#ef4444', fillOpacity: 1, strokeWeight: 0, scale: 10 }, animation: google.maps.Animation.DROP });
  mapInstance.setCenter(position); mapInstance.setZoom(18);
  infoWindow.setContent(`
    <div class="p-2 max-w-xs text-center">
      <h4 class="text-lg font-extrabold text-red-700">${name}</h4>
      <p class="text-sm mt-1 text-gray-700">${details}</p>
      <a href="${navigationUrl}" target="_blank" class="mt-3 inline-flex items-center text-sm font-semibold text-white bg-red-600 px-3 py-1 rounded-full hover:bg-red-700 transition duration-150 shadow-md">Navigate to Here</a>
      <p class="text-xs text-gray-500 mt-2">(Temporary Pin)</p>
    </div>
  `);
  infoWindow.open(mapInstance, poiMarker);
  poiMarker.addListener('click', () => infoWindow.open(mapInstance, poiMarker));
}

function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), { zoom: 17, center: uweFrenchayLocation, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, mapId: CLOUD_MAP_ID, mapTypeId: 'roadmap' });
  mapInstance = map;
  loadBuildingData(); addEastEntranceMarker(); addDirectionalArrow(); createLegend(); populatePoiDropdown();
  const mapButton = document.getElementById('map-toggle-button'); if (mapButton) mapButton.innerHTML = 'Switch to <span class="font-bold">Default Satellite</span>';
}

function loadGoogleMapsScript() {
  if (mapInitialized) return; const script = document.createElement('script'); script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDu4eXL0Q1G18sogmpdvYUpNmez5v288q8&callback=initMap'; script.async = true; script.defer = true; document.head.appendChild(script); mapInitialized = true;
}

function openMapModal() {
  const modal = document.getElementById('map-modal'); modal.classList.remove('hidden'); modal.classList.add('flex'); if (!mapInitialized) loadGoogleMapsScript(); else { google.maps.event.trigger(mapInstance, 'resize'); mapInstance.setCenter(uweFrenchayLocation); }
}

function closeModal() { document.getElementById('map-modal').classList.remove('flex'); document.getElementById('map-modal').classList.add('hidden'); }

function handleModalClick(event) { if (event.target.id === 'map-modal') closeModal(); }

// Attach only the Google Maps callback as a global — required by the API.
window.initMap = initMap;

// Wire up DOM event listeners once the document is ready (remove inline handlers)
document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('open-map-btn'); if (openBtn) openBtn.addEventListener('click', openMapModal);
  const modal = document.getElementById('map-modal'); if (modal) modal.addEventListener('click', handleModalClick);
  const closeBtns = document.querySelectorAll('[data-close-modal]'); closeBtns.forEach(b => b.addEventListener('click', closeModal));
  const mapToggle = document.getElementById('map-toggle-button'); if (mapToggle) mapToggle.addEventListener('click', toggleMapType);
  const poiSelect = document.getElementById('poi-selector'); if (poiSelect) poiSelect.addEventListener('change', handlePoiSelection);
  // ESC to close
  document.addEventListener('keydown', (e) => { const modalEl = document.getElementById('map-modal'); if (e.key === 'Escape' && modalEl && !modalEl.classList.contains('hidden')) closeModal(); });
});
