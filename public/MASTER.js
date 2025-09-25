const logContainer = document.getElementById('logContainer');

function addLog(message) {
  const logEntry = document.createElement('div');
  logEntry.classList.add('log-entry');

  const timestamp = new Date().toLocaleTimeString();
  logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span>${message}`;

  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// Simulate incoming logs
setInterval(() => {
  const events = [
    "User clicked 'Submit'",
    "API call to /login returned 200",
    "Image preview loaded",
    "Navigation: /dashboard",
    "⚠️ Warning: slow network",
    "✔ Task completed successfully",
    "Error: timeout on /fetch-data"
  ];
  const randomEvent = events[Math.floor(Math.random() * events.length)];
  addLog(randomEvent);
}, 1500);



//code generator
const hourMap = {
    "12:00 PM": 13, "1:00 PM": 35, "2:00 PM": 57, "3:00 PM": 79,
    "4:00 PM": 91, "5:00 PM": 93, "6:00 PM": 71, "7:00 PM": 59,
    "8:00 PM": 37, "9:00 PM": 15, "10:00 PM": 11, "11:00 PM": 55,
    "12:00 AM": 31, "1:00 AM": 53, "2:00 AM": 75, "3:00 AM": 97,
    "4:00 AM": 19, "5:00 AM": 39, "6:00 AM": 17, "7:00 AM": 95,
    "8:00 AM": 73, "9:00 AM": 51, "10:00 AM": 33, "11:00 AM": 77
};

const hourList = Object.keys(hourMap).sort((a, b) => {
    const get24h = (h) => {
        let [hr, period] = h.split(' ');
        hr = parseInt(hr);
        if (period === 'PM' && hr !== 12) hr += 12;
        if (period === 'AM' && hr === 12) hr = 0;
        return hr;
    };
    return get24h(a) - get24h(b);
});

const startHour = document.getElementById("startHour");
const endHour = document.getElementById("endHour");

hourList.forEach(time => {
    const option1 = new Option(time, time);
    const option2 = new Option(time, time);
    startHour.appendChild(option1);
    endHour.appendChild(option2);
});

function generateHourCode() {
    const start = startHour.value;
    const end = endHour.value;

    if (!start || !end) {
        alert("Please select both start and end hours.");
        return;
    }

    const now = new Date();
    const sum = now.getDate() + (now.getMonth() + 1);
    const DD = sum < 10 ? `0${sum}` : `${sum}`;

    const SS = hourMap[start];
    const EE = hourMap[end];

    const rawCode = `${SS}${EE}${DD}`;
    const finalCode = `${rawCode[0]}${rawCode[2]}${rawCode[4]}${rawCode[5]}${rawCode[3]}${rawCode[1]}`;

    document.getElementById("hourCode").innerText = finalCode;
    document.getElementById("resultBox").style.display = "flex";
}

function copyCode() {
    const code = document.getElementById("hourCode").innerText;
    navigator.clipboard.writeText(code);
    alert("Code copied: " + code);
}
