const driverIdInput = document.getElementById('driverId');
const startBtn = document.getElementById('start-btn');
const statusEl = document.getElementById('status');

const socket = io();
let animationPlayed = false; // Flag to ensure animation only runs once

socket.on('connect', () => {
  if (!animationPlayed) statusEl.textContent = 'Click Submit to connect';
});
socket.on('disconnect', () => {
  // We don't need to show a reconnect message on the main screen anymore
  console.log('Disconnected. Attempting to reconnect...');
});

function startTracking() {
  if (!navigator.geolocation) {
    statusEl.textContent = "Geolocation is not supported.";
    return;
  }

  const driverId = driverIdInput.value.trim();
  if (!driverId) {
    alert('Please enter your Name');
    return;
  }

  startBtn.disabled = true;
  statusEl.textContent = 'Please allow location access...';

  navigator.geolocation.watchPosition(
    // Success Callback
    (position) => {
      const { latitude, longitude } = position.coords;

      // --- TRIGGER THE ANIMATION ---
      // This runs only on the first successful location access
      if (!animationPlayed) {
        document.body.classList.add('tracking-active');
        animationPlayed = true;
      }

      if (socket.connected) {
        const data = { id: driverId, lat: latitude, lon: longitude };
        socket.emit('locationUpdate', data);
      }
    },
    // Error Callback
    (error) => {
      console.error(`Geolocation Error (${error.code}): ${error.message}`);
      // If permission is denied, re-enable the button so they can try again.
      if (error.code === error.PERMISSION_DENIED) {
        statusEl.textContent = "Location access was denied. Please try again.";
        startBtn.disabled = false;
      } else {
        statusEl.textContent = "Could not get location. Please check settings.";
      }
    },
    // Geolocation Options
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

startBtn.addEventListener('click', startTracking);