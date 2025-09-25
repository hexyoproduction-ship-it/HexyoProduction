  const slider = document.getElementById('slider');
  const dots = document.querySelectorAll('.dot');
  const slides = slider.children;
  const total = dots.length;
  let current = 1;
  let isTransitioning = false;

  // Clone first and last slide
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);

  // Append/prepend clones
  slider.appendChild(firstClone);
  slider.insertBefore(lastClone, slides[0]);

  // Set initial position
  slider.style.transform = `translateX(-100%)`;

  function updateDots(index) {
    dots.forEach((dot, i) => {
      dot.classList.toggle('opacity-100', i === index);
      dot.classList.toggle('opacity-50', i !== index);
    });
  }

  function goToSlide(index) {
    current = index + 1;
    slideTo(current);
  }

  function slideTo(index) {
    if (isTransitioning) return;
    isTransitioning = true;
    slider.style.transition = 'transform 0.8s ease-in-out';
    slider.style.transform = `translateX(-${index * 100}%)`;
  }

  function nextSlide() {
    if (isTransitioning) return;
    current++;
    slideTo(current);
  }

  function prevSlide() {
    if (isTransitioning) return;
    current--;
    slideTo(current);
  }

  slider.addEventListener('transitionend', () => {
    isTransitioning = false;
    if (current === 0) {
      slider.style.transition = 'none';
      current = total;
      slider.style.transform = `translateX(-${current * 100}%)`;
    } else if (current === total + 1) {
      slider.style.transition = 'none';
      current = 1;
      slider.style.transform = `translateX(-${current * 100}%)`;
    }
    updateDots(current - 1);
  });

  // Dots click
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      clearInterval(autoSlide);
      goToSlide(i);
      autoSlide = setInterval(nextSlide, 4000);
    });
  });

  // Arrows click
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      clearInterval(autoSlide);
      autoSlide = setInterval(nextSlide, 4000);
    });
  });

  let autoSlide = setInterval(nextSlide, 4000);
  updateDots(current - 1);





  function openPreview(img) {
    const preview = document.getElementById('previewOverlay');
    const previewImg = document.getElementById('previewImage');
    previewImg.src = img.src;
    preview.style.display = 'flex';
  }
  
  function closePreview() {
    document.getElementById('previewOverlay').style.display = 'none';
  }
  

  

  function subscribe() {
    const email = document.getElementById('email').value;
    if (email.trim() === '') {
      alert("Please enter your email!");
    } else {
      alert(`Subscribed successfully with: ${email}`);
      document.getElementById('email').value = '';
    }
  }
   
// REFINEMENT NOTE: Original HEXYO.js

// function myFunction() { ... }
// let slideIndex = 0; showSlides(); function showSlides() { ... }
// function onClick(element) { ... }
// const hourMap = { ... }; function to24HourTime(timeStr) { ... }
// function decodeHourCode(code) { ... }
// function verifyCode() { ... }
// function showError(msg) { ... }
// document.addEventListener("DOMContentLoaded", () => { ... });
// function waitUntilExpiredAndClose(endTime) { ... }

// --- Navbar Toggle ---

function initSlideshow() { // REFINEMENT: Initialize caches
    slidesCache = document.getElementsByClassName("mySlides");
    dotsCache = document.getElementsByClassName("dot");
    if (slidesCache.length > 0) {
        showSlides();
    }
}


// --- Passcode Unlock Logic for HEXYO page content ---
const hourMap = { // This map seems to be part of a custom encoding/decoding scheme
    13: "12:00 PM", 35: "1:00 PM", 57: "2:00 PM", 79: "3:00 PM",
    91: "4:00 PM", 93: "5:00 PM", 71: "6:00 PM", 59: "7:00 PM",
    37: "8:00 PM", 15: "9:00 PM", 11: "10:00 PM", 55: "11:00 PM",
    31: "12:00 AM", 53: "1:00 AM", 75: "2:00 AM", 97: "3:00 AM",
    19: "4:00 AM", 39: "5:00 AM", 17: "6:00 AM", 95: "7:00 AM",
    73: "8:00 AM", 51: "9:00 AM", 33: "10:00 AM", 77: "11:00 AM"
};

function to24HourTime(timeStr) {
    if (!timeStr) return null; // REFINEMENT: Handle undefined timeStr
    const parts = timeStr.split(' ');
    if (parts.length !== 2) return null; // REFINEMENT: Basic validation

    const [time, modifier] = parts;
    const timeParts = time.split(':');
    if (timeParts.length !== 2) return null; // REFINEMENT: Basic validation

    let [hours, minutes] = timeParts.map(Number);

    if (isNaN(hours) || isNaN(minutes)) return null; // REFINEMENT: Ensure parsing worked

    if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0; // Midnight case
    return [hours, minutes];
}

function decodeHourCode(code) {
    const resultBox = document.getElementById("resultBox");
    if (!resultBox) return false;
    resultBox.innerHTML = ""; // Clear previous results

    if (typeof code !== 'string' || code.length !== 6) {
        resultBox.innerHTML = `<span class="unverified">Invalid Code Format</span>`;
        return false;
    }

    // REFINEMENT NOTE: This logic extracts numbers from the code.
    // SS, EE, DD are part of a custom encoding scheme.
    const SS = parseInt(code[0] + code[5], 10);
    const EE = parseInt(code[1] + code[4], 10);
    const DD = parseInt(code[2] + code[3], 10);

    if (isNaN(SS) || isNaN(EE) || isNaN(DD)) {
        resultBox.innerHTML = `<span class="unverified">Invalid Numeric Code</span>`;
        return false;
    }

    const startHourStr = hourMap[SS];
    const endHourStr = hourMap[EE];

    if (!startHourStr || !endHourStr) {
        resultBox.innerHTML = `<span class="unverified">Invalid Time Code</span>`;
        return false;
    }

    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth(); // 0-indexed (January is 0)

    // REFINEMENT NOTE: The day calculation `DD - (monthIndex + 1)` is specific to this encoding.
    // Example: If current month is Jan (monthIndex=0), and DD=1, day = 1-(0+1) = 0.
    // `new Date(year, month, 0)` gives the last day of the *previous* month.
    // This effectively creates a date relative to the current month and the DD value.
    const dayOffset = DD - (monthIndex + 1);

    const startHourParts = to24HourTime(startHourStr);
    const endHourParts = to24HourTime(endHourStr);

    if (!startHourParts || !endHourParts) {
        resultBox.innerHTML = `<span class="unverified">Error Parsing Time</span>`;
        return false;
    }

    const [startH, startM] = startHourParts;
    const [endH, endM] = endHourParts;

    // Construct Date objects using the calculated dayOffset.
    // Note: `dayOffset` might result in dates in previous/next months if it's large or small.
    const startTime = new Date(year, monthIndex, dayOffset, startH, startM);
    const endTime = new Date(year, monthIndex, dayOffset, endH, endM);
    
    // Handle cases where end time might be on the next day (e.g. 11 PM to 2 AM)
    if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1); // Assume end time is on the next calendar day
    }

    const isVerified = now >= startTime && now <= endTime;

    resultBox.innerHTML = isVerified
        ? `<span class="verified">Verified</span>`
        : `<span class="unverified">Unverified (Time: ${now.toLocaleTimeString()} | Valid: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()} on day offset ${dayOffset})</span>`;
        // REFINEMENT: Added more debug info to "Unverified" - remove for production

    return isVerified;
}

function verifyHexyoPasscode() { // REFINEMENT: Renamed from verifyCode to be specific
    const inputs = document.querySelectorAll("#overlay .otp-input"); // REFINEMENT: Scope to overlay inputs
    const code = Array.from(inputs).map(input => input.value).join("");
    const errorMessageElement = document.getElementById("error-message");

    // Clear previous error messages related to input length
    if (errorMessageElement.textContent === "Please enter all 6 digits.") {
        showHexyoError(""); // Clear it
    }

    if (code.length < 6) {
        showHexyoError("Please enter all 6 digits.");
        return;
    }

    const isVerified = decodeHourCode(code); // This updates resultBox

    if (isVerified) {
        showHexyoError("<span style='color: green;'>✅ Access Granted! Redirecting...</span>", true); // Second param to not set border red
        document.getElementById("main-content").classList.remove("blurred");
        
        const popup = document.getElementById("popup");
        const overlay = document.getElementById("overlay");

        // REFINEMENT NOTE: Removed `popup.style.boxShadow` as it's a visual style change.
        // The original `shrink` animation is not used by this logic path.
        // Using CSS transitions on .popup and .overlay for active state.
        if (popup) popup.classList.remove("active"); // Triggers shrinking/fade-out via CSS
        if (overlay) {
            setTimeout(() => { // Allow popup animation to play
                overlay.classList.remove("active"); 
                // overlay.style.display = "none"; // CSS transition handles visibility
            }, 500); // Adjust timing based on CSS transition duration for popup
        }

    } else {
        showHexyoError("❌ Access Denied. Time window expired or invalid code.");
        inputs.forEach(input => {
            input.style.borderColor = "red"; // Highlight incorrect inputs
        });
    }
}

function showHexyoError(msg, isSuccess = false) { // REFINEMENT: Renamed & added param
    const errElement = document.getElementById("error-message");
    if (errElement) {
        errElement.innerHTML = msg; // Use innerHTML because msg can contain span for green text
        errElement.style.display = msg ? "block" : "none";
    }
    if (!isSuccess) { // Only set red border for actual errors
        document.querySelectorAll("#overlay .otp-input").forEach(input => {
            input.style.borderColor = msg ? "red" : ""; // Reset border if no message or success
        });
    }
}

// --- Event Listeners for HEXYO Passcode ---
document.addEventListener("DOMContentLoaded", () => {
    initSlideshow(); // Initialize slideshow caches and start

    const otpInputs = document.querySelectorAll("#overlay .otp-input"); // REFINEMENT: Scope to overlay inputs
    const overlay = document.getElementById("overlay");
    const popup = document.getElementById("popup");
    const errorMessageElement = document.getElementById("error-message");


    if (overlay && popup) { // Initially make the popup visible if overlay is meant to be active
        // REFINEMENT NOTE: Original HTML had 'active' on popup. JS should control this.
        // Assuming popup should be visible when page loads due to .blurred on main-content
        overlay.classList.add("active");
        popup.classList.add("active");
    }


    otpInputs.forEach((input, index) => {
        input.addEventListener("input", (e) => {
            // Clear general error message on new input
            if (errorMessageElement && (errorMessageElement.textContent.includes("Access Denied") || errorMessageElement.textContent.includes("Please enter all 6 digits"))) {
                showHexyoError("");
            }
            // Reset border color on input
            e.target.style.borderColor = "";


            if (!/^\d$/.test(e.target.value)) { // Only allow digits
                e.target.value = "";
                return;
            }

            if (e.target.value && index < otpInputs.length - 1) { // Move to next if value entered
                otpInputs[index + 1].focus();
            } else if (e.target.value && index === otpInputs.length - 1) { // If last input, verify
                verifyHexyoPasscode();
            }
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !otpInputs[index].value && index > 0) {
                otpInputs[index - 1].focus();
                // Clear error on backspace if present
                if (errorMessageElement && errorMessageElement.textContent) {
                     showHexyoError("");
                }
                otpInputs[index -1].style.borderColor = ""; // Reset previous input's border
            }
        });

        input.addEventListener("paste", (e) => e.preventDefault()); // Disable pasting
    });

    if (otpInputs.length > 0 && document.getElementById('main-content').classList.contains('blurred')) {
        otpInputs[0].focus(); // Focus first OTP input if content is blurred
    }
});

// REFINEMENT NOTE: This function is defined but not called anywhere in the provided code.
// If it's intended for use, it needs to be invoked with an appropriate endTime.
function waitUntilExpiredAndClose(endTime) {
  const now = new Date();
  if (now >= endTime) {
    // window.close(); // REFINEMENT NOTE: window.close() can only close windows opened by script.
    console.log("Tab would close now if opened by script.");
    return;
  }
  const timeUntilEnd = endTime.getTime() - now.getTime();
  setTimeout(() => {
    // window.close();
    console.log("Tab would close now (timer expired) if opened by script.");
  }, timeUntilEnd);
}