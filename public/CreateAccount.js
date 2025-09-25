// Get DOM elements for password toggle
const toggleIcon = document.getElementById('toggle-icon');
const passwordInput = document.getElementById('password');
const eyeIconSvg = document.getElementById('eye'); // The open eye SVG
const eyeCrossedIconSvg = document.getElementById('eye-crossed'); // The crossed/slashed eye SVG

// Check if all elements exist before adding event listener
if (toggleIcon && passwordInput && eyeIconSvg && eyeCrossedIconSvg) {
  toggleIcon.addEventListener('click', function() {
    // Toggle the type between password and text
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      // When password is TEXT (visible), show OPEN eye, hide CROSSED eye
      eyeCrossedIconSvg.style.display = 'none';
      eyeIconSvg.style.display = 'block';
    } else {
      passwordInput.type = 'password';
      // When password is PASSWORD (hidden), show CROSSED eye, hide OPEN eye
      eyeCrossedIconSvg.style.display = 'block';
      eyeIconSvg.style.display = 'none';
    }
  });

  // Set initial icon state based on password field type (should be 'password' initially)
  // This ensures the correct icon is displayed on page load.
  // The HTML already sets initial display styles, but this is a good safeguard.
  if (passwordInput.type === 'password') {
    eyeCrossedIconSvg.style.display = 'block';
    eyeIconSvg.style.display = 'none';
  } else { // Should not happen on load if HTML is correct, but good practice
    eyeCrossedIconSvg.style.display = 'none';
    eyeIconSvg.style.display = 'block';
  }

} else {
  console.warn("Password toggle elements not found. Functionality will be disabled.");
}