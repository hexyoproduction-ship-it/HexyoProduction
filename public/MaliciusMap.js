// ===== Map Initialization =====
const map = L.map('map', {
  doubleClickZoom: true,
  touchZoom: true,
  scrollWheelZoom: true
}).setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18,
}).addTo(map);

// ===== State Management =====
const state = {
  markers: {},
  activeMarkers: new Set(),
  isConnected: false,
  autoZoomEnabled: true,
  zoomTimeout: null,
  mapRotation: 0,
  mapContainer: document.getElementById('map')
};

const socket = io();

// ===== DOM Elements =====
const controlPanel = document.getElementById('control-panel');
const togglePanelBtn = document.getElementById('toggle-panel-btn');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const logsContainer = document.getElementById('logs-container');
const rotationValue = document.getElementById('rotation-value');
const resetRotationBtn = document.getElementById('reset-rotation-btn');

// ===== Logging System =====
/**
 * Add log entry to control panel
 */
function addLog(message, type = 'info') {
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  const timestamp = new Date().toLocaleTimeString();
  logEntry.textContent = `[${timestamp}] ${message}`;
  
  logsContainer.appendChild(logEntry);
  logsContainer.scrollTop = logsContainer.scrollHeight;
  
  // Keep only last 100 logs
  const logs = logsContainer.querySelectorAll('.log-entry');
  if (logs.length > 100) {
    logs[0].remove();
  }
}

/**
 * Clear all logs
 */
function clearLogs() {
  logsContainer.innerHTML = '';
  addLog('Logs cleared', 'info');
}

// ===== Control Panel Functions =====
/**
 * Toggle control panel collapse/expand
 */
function togglePanel() {
  controlPanel.classList.toggle('collapsed');
  const btnText = controlPanel.classList.contains('collapsed') ? '+' : '−';
  togglePanelBtn.textContent = btnText;
}

// ===== Map Rotation Functions =====
/**
 * Apply rotation to map container
 */
function applyRotation(angle) {
  state.mapRotation = ((angle % 360) + 360) % 360;
  state.mapContainer.style.transform = `rotate(${state.mapRotation}deg)`;
  rotationValue.textContent = `${Math.round(state.mapRotation)}°`;
}

/**
 * Rotate map by angle
 */
function rotateMap(angle) {
  const newRotation = state.mapRotation + angle;
  applyRotation(newRotation);
  addLog(`Map rotated to ${Math.round(state.mapRotation)}°`, 'info');
}

/**
 * Reset map rotation
 */
function resetRotation() {
  applyRotation(0);
  addLog('Map rotation reset to North', 'info');
}

// ===== Custom Icons =====
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

// ===== Utility Functions =====

/**
 * Auto-zoom map to fit all active markers
 */
function autoZoom() {
  const activeMarkers = [];
  
  for (const driverId of state.activeMarkers) {
    if (state.markers[driverId]) {
      activeMarkers.push(state.markers[driverId].marker);
    }
  }

  if (activeMarkers.length > 0) {
    try {
      const group = new L.featureGroup(activeMarkers);
      const bounds = group.getBounds();
      
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.1), { 
          maxZoom: 15,
          animate: true,
          duration: 0.5
        });
      }
    } catch (error) {
      console.error('Error during auto-zoom:', error);
      addLog(`Zoom error: ${error.message}`, 'error');
    }
  }
}

/**
 * Debounced auto-zoom to prevent excessive recalculations
 */
function debouncedAutoZoom() {
  clearTimeout(state.zoomTimeout);
  state.zoomTimeout = setTimeout(autoZoom, 500);
}

/**
 * Update or create marker for driver
 */
function updateMarker(driverId, data) {
  const { lat, lon, accuracy, timestamp } = data;

  if (state.markers[driverId]) {
    const markerData = state.markers[driverId];
    markerData.marker.setLatLng([lat, lon]);
    markerData.marker.setIcon(onlineIcon);
    
    markerData.lastUpdate = timestamp || Date.now();
    markerData.accuracy = accuracy || 0;
    markerData.lat = lat;
    markerData.lon = lon;
    
    state.activeMarkers.add(driverId);
    addLog(`Updated: ${driverId} → ${lat.toFixed(4)}, ${lon.toFixed(4)}`, 'success');
  } else {
    const marker = L.marker([lat, lon], { icon: onlineIcon }).addTo(map);
    
    state.markers[driverId] = {
      marker: marker,
      lastUpdate: timestamp || Date.now(),
      accuracy: accuracy || 0,
      lat: lat,
      lon: lon
    };
    
    marker.bindTooltip('TARGET', {
      permanent: true,
      direction: 'top',
      offset: [0, -41],
      className: 'driver-label'
    });
    
    state.activeMarkers.add(driverId);
    addLog(`New target: ${driverId} at ${lat.toFixed(4)}, ${lon.toFixed(4)}`, 'success');
  }

  if (state.autoZoomEnabled) {
    debouncedAutoZoom();
  }
}

/**
 * Mark driver as offline
 */
function markDriverOffline(driverId) {
  if (state.markers[driverId]) {
    state.markers[driverId].marker.setIcon(offlineIcon);
    state.activeMarkers.delete(driverId);
    addLog(`Offline: ${driverId}`, 'warning');
    
    if (state.autoZoomEnabled) {
      debouncedAutoZoom();
    }
  }
}

/**
 * Remove driver marker completely
 */
function removeDriver(driverId) {
  if (state.markers[driverId]) {
    map.removeLayer(state.markers[driverId].marker);
    delete state.markers[driverId];
    state.activeMarkers.delete(driverId);
    addLog(`Removed: ${driverId}`, 'info');
    
    if (state.autoZoomEnabled) {
      debouncedAutoZoom();
    }
  }
}

// ===== Socket.io Event Listeners =====

socket.on('connect', () => {
  state.isConnected = true;
  console.log('✓ Connected to WebSocket server');
  addLog('Connected to server', 'success');
});

socket.on('disconnect', () => {
  state.isConnected = false;
  console.log('✗ Disconnected from WebSocket server');
  addLog('Disconnected from server', 'error');
});

socket.on('locationUpdated', (data) => {
  const { id, lat, lon, accuracy, timestamp } = data;
  
  if (!id || lat === undefined || lon === undefined) {
    console.error('Invalid location data:', data);
    addLog(`Invalid data received`, 'error');
    return;
  }
  
  updateMarker(id, { lat, lon, accuracy, timestamp });
});

socket.on('driverDisconnected', (data) => {
  const { id } = data;
  if (id) {
    markDriverOffline(id);
    console.log(`Driver ${id} went offline`);
  }
});

socket.on('driverRemoved', (data) => {
  const { id } = data;
  if (id) {
    removeDriver(id);
    console.log(`Driver ${id} removed from tracking`);
  }
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  addLog(`Socket error: ${error}`, 'error');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  addLog(`Connection error: ${error}`, 'error');
});

// ===== Event Listeners =====

// Control panel toggle
togglePanelBtn.addEventListener('click', togglePanel);

// Clear logs button
clearLogsBtn.addEventListener('click', clearLogs);

// Reset rotation button
resetRotationBtn.addEventListener('click', resetRotation);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Prevent shortcuts if typing in an input
  if (document.activeElement.tagName === 'INPUT') return;

  const key = e.key.toUpperCase();

  switch(key) {
    case 'Z':
      e.preventDefault();
      state.autoZoomEnabled = !state.autoZoomEnabled;
      addLog(`Auto-zoom ${state.autoZoomEnabled ? 'enabled' : 'disabled'}`, 'info');
      if (state.autoZoomEnabled) autoZoom();
      break;
    case 'R':
      e.preventDefault();
      map.setView([20, 0], 2);
      resetRotation();
      addLog('Map reset to default view', 'info');
      break;
    case 'L':
      e.preventDefault();
      clearLogs();
      break;
    case 'C':
      e.preventDefault();
      togglePanel();
      addLog('Panel toggled', 'info');
      break;
    case 'ARROWLEFT':
      e.preventDefault();
      rotateMap(-15);
      break;
    case 'ARROWRIGHT':
      e.preventDefault();
      rotateMap(15);
      break;
    case 'ARROWUP':
      e.preventDefault();
      rotateMap(-30);
      break;
    case 'ARROWDOWN':
      e.preventDefault();
      rotateMap(30);
      break;
    case '+':
    case '=':
      e.preventDefault();
      map.zoomIn();
      break;
    case '-':
    case '_':
      e.preventDefault();
      map.zoomOut();
      break;
  }
});

// ===== Cleanup =====
window.addEventListener('beforeunload', () => {
  socket.disconnect();
});

// Initial logs
addLog('Map tracking script loaded', 'info');
addLog('Press C to toggle controls panel', 'info');
addLog('Press Z to toggle auto-zoom', 'info');
addLog('Press R to reset view', 'info');
addLog('Arrow keys to rotate map', 'info');
console.log('Map tracking script loaded');
console.log('Arrow keys are now working for map rotation!');
