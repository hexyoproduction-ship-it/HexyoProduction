// Set a default view for when there are no markers
const map = L.map('map').setView([20, 0], 2); // A wide, global view
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18,
}).addTo(map);

const markers = {}; // { driverId: markerObject }

// --- Create custom icons for online/offline status ---
const onlineIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const offlineIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const socket = io();

// --- Function to auto-zoom the map ---
function autoZoom() {
  const activeMarkers = [];
  // Collect all markers that are currently "online"
  for (const id in markers) {
    if (markers[id].getIcon() === onlineIcon) {
      activeMarkers.push(markers[id]);
    }
  }

  // If there's at least one active marker, fit the map to them
  if (activeMarkers.length > 0) {
    const group = new L.featureGroup(activeMarkers);
    map.fitBounds(group.getBounds().pad(0.5)); // .pad(0.5) adds some nice padding
  }
}

// Listen for incoming location updates
socket.on('locationUpdated', (data) => {
  const { id, lat, lon } = data;

  if (markers[id]) {
    markers[id].setLatLng([lat, lon]);
    markers[id].setIcon(onlineIcon);
  } else {
    // Create a new marker
    markers[id] = L.marker([lat, lon], { icon: onlineIcon }).addTo(map)
      // --- BIND A PERMANENT TOOLTIP FOR THE ID ---
      .bindTooltip(id, {
        permanent: true, // Make it always visible
        direction: 'top', // Position it above the marker
        offset: [0, -41], // Adjust offset to sit nicely above the icon
        className: 'driver-label' // Custom class for styling
      });
  }
  // Re-run auto-zoom every time a location is updated
  autoZoom();
});

// Listen for a driver disconnecting
socket.on('driverDisconnected', (data) => {
  const { id } = data;
  if (markers[id]) {
    markers[id].setIcon(offlineIcon);
    // Re-run auto-zoom to exclude the disconnected driver
    autoZoom();
  }
});

socket.on('connect', () => console.log('Connected to WebSocket server.'));
