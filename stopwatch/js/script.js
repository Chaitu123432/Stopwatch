// DOM Elements
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const millisecondsElement = document.getElementById('milliseconds');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const resetButton = document.getElementById('reset-btn');
const lapButton = document.getElementById('lap-btn');
const lapsContainer = document.getElementById('laps');
const clearLapsButton = document.getElementById('clear-laps-btn');
const exportButton = document.getElementById('export-btn');
const themeSelect = document.getElementById('theme-select');
const soundToggle = document.getElementById('sound-toggle');
const clickSound = document.getElementById('click-sound');
const lapSound = document.getElementById('lap-sound');
const currentYearElement = document.getElementById('current-year');

// Stopwatch variables
let startTime;
let elapsedTime = 0;
let timeInterval;
let running = false;
let laps = [];
let lapTimes = [];

// Initialize settings
const settings = {
    sound: localStorage.getItem('sound') !== 'false',
    theme: localStorage.getItem('theme') || 'green',
};

// Initialize the app
function init() {
    // Set current year in footer
    currentYearElement.textContent = new Date().getFullYear();
    
    // Load settings
    loadSettings();
    
    // Event listeners
    startButton.addEventListener('click', start);
    pauseButton.addEventListener('click', pause);
    resetButton.addEventListener('click', reset);
    lapButton.addEventListener('click', recordLap);
    clearLapsButton.addEventListener('click', clearLaps);
    exportButton.addEventListener('click', exportLaps);
    themeSelect.addEventListener('change', updateTheme);
    soundToggle.addEventListener('change', updateSoundSetting);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);
}

// Update display function
function updateDisplay() {
    const time = calculateTime();
    
    hoursElement.textContent = formatTime(time.hours);
    minutesElement.textContent = formatTime(time.minutes);
    secondsElement.textContent = formatTime(time.seconds);
    millisecondsElement.textContent = formatTime(time.milliseconds, true);
}

// Calculate time
function calculateTime() {
    const totalMilliseconds = elapsedTime;
    
    const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);
    const seconds = Math.floor((totalMilliseconds / 1000) % 60);
    const minutes = Math.floor((totalMilliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(totalMilliseconds / (1000 * 60 * 60));
    
    return { hours, minutes, seconds, milliseconds };
}

// Format time
function formatTime(time, isMilliseconds = false) {
    return isMilliseconds ? 
        (time < 10 ? `0${time}` : `${time}`) : 
        (time < 10 ? `0${time}` : `${time}`);
}

// Start function
function start() {
    if (!running) {
        running = true;
        document.querySelector('.stopwatch').classList.add('running');
        
        if (elapsedTime === 0) {
            // New start
            startTime = Date.now();
        } else {
            // Resume
            startTime = Date.now() - elapsedTime;
        }
        
        timeInterval = setInterval(function() {
            elapsedTime = Date.now() - startTime;
            updateDisplay();
        }, 10);
        
        toggleButtons(true);
        
        if (settings.sound) {
            clickSound.play();
        }
    }
}

// Pause function
function pause() {
    if (running) {
        running = false;
        document.querySelector('.stopwatch').classList.remove('running');
        clearInterval(timeInterval);
        toggleButtons(false);
        
        if (settings.sound) {
            clickSound.play();
        }
    }
}

// Reset function
function reset() {
    clearInterval(timeInterval);
    running = false;
    document.querySelector('.stopwatch').classList.remove('running');
    elapsedTime = 0;
    updateDisplay();
    toggleButtons(false);
    lapButton.disabled = true;
    
    if (settings.sound) {
        clickSound.play();
    }
}

// Toggle buttons based on stopwatch state
function toggleButtons(isRunning) {
    startButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
    lapButton.disabled = !isRunning;
}

// Record lap function
function recordLap() {
    if (running) {
        const lapTime = calculateTime();
        const formattedLapTime = `${formatTime(lapTime.hours)}:${formatTime(lapTime.minutes)}:${formatTime(lapTime.seconds)}.${formatTime(lapTime.milliseconds, true)}`;
        
        const lapNumber = laps.length + 1;
        
        // Calculate difference from previous lap
        let lapDifference = '';
        if (laps.length > 0) {
            const previousLapTime = lapTimes[lapTimes.length - 1];
            const currentLapTimeMs = elapsedTime;
            const difference = currentLapTimeMs - previousLapTime;
            
            const diffTime = {
                hours: Math.floor(difference / (1000 * 60 * 60)),
                minutes: Math.floor((difference / (1000 * 60)) % 60),
                seconds: Math.floor((difference / 1000) % 60),
                milliseconds: Math.floor((difference % 1000) / 10)
            };
            
            lapDifference = `+${formatTime(diffTime.hours)}:${formatTime(diffTime.minutes)}:${formatTime(diffTime.seconds)}.${formatTime(diffTime.milliseconds, true)}`;
        }
        
        laps.push({
            number: lapNumber,
            time: formattedLapTime,
            difference: lapDifference,
            totalMs: elapsedTime
        });
        
        lapTimes.push(elapsedTime);
        
        renderLaps();
        
        if (settings.sound) {
            lapSound.play();
        }
    }
}

// Render laps
function renderLaps() {
    lapsContainer.innerHTML = '';
    
    // Find fastest and slowest laps
    let fastestLap = { index: -1, time: Infinity };
    let slowestLap = { index: -1, time: -1 };
    
    if (laps.length > 1) {
        for (let i = 1; i < laps.length; i++) {
            const currentLapTime = laps[i].totalMs - laps[i-1].totalMs;
            
            if (currentLapTime < fastestLap.time) {
                fastestLap = { index: i, time: currentLapTime };
            }
            
            if (currentLapTime > slowestLap.time) {
                slowestLap = { index: i, time: currentLapTime };
            }
        }
    }
    
    laps.forEach((lap, index) => {
        const lapItem = document.createElement('li');
        
        const lapNumberSpan = document.createElement('span');
        lapNumberSpan.textContent = `Lap ${lap.number}`;
        
        const lapTimeSpan = document.createElement('span');
        lapTimeSpan.textContent = lap.time;
        
        const lapDifferenceSpan = document.createElement('span');
        lapDifferenceSpan.textContent = lap.difference;
        
        lapItem.appendChild(lapNumberSpan);
        lapItem.appendChild(lapTimeSpan);
        
        if (lap.difference) {
            lapItem.appendChild(lapDifferenceSpan);
        }
        
        // Add class for fastest and slowest laps
        if (index === fastestLap.index) {
            lapItem.classList.add('fastest');
        } else if (index === slowestLap.index) {
            lapItem.classList.add('slowest');
        }
        
        lapsContainer.prepend(lapItem);
    });
}

// Clear laps
function clearLaps() {
    laps = [];
    lapTimes = [];
    lapsContainer.innerHTML = '';
    
    if (settings.sound) {
        clickSound.play();
    }
}

// Export laps as CSV
function exportLaps() {
    if (laps.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Lap Number,Lap Time,Difference\n";
    
    laps.forEach(lap => {
        csvContent += `${lap.number},${lap.time},${lap.difference}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stopwatch_laps.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (settings.sound) {
        clickSound.play();
    }
}

// Handle keyboard shortcuts
function handleKeyPress(e) {
    const key = e.key.toLowerCase();
    
    switch(key) {
        case ' ':  // Spacebar
            if (running) {
                pause();
            } else {
                start();
            }
            e.preventDefault();
            break;
        case 'r':
            reset();
            break;
        case 'l':
            if (running) {
                recordLap();
            }
            break;
        case 'c':
            clearLaps();
            break;
        case 'e':
            exportLaps();
            break;
    }
}

// Load settings from localStorage
function loadSettings() {
    // Theme
    themeSelect.value = settings.theme;
    updateTheme();
    
    // Sound
    soundToggle.checked = settings.sound;
}

// Update theme
function updateTheme() {
    const selectedTheme = themeSelect.value;
    settings.theme = selectedTheme;
    localStorage.setItem('theme', selectedTheme);
    
    // Remove all theme classes
    document.body.classList.remove('dark-theme', 'blue-theme');
    
    // Add selected theme class
    if (selectedTheme !== 'light') {
        document.body.classList.add(`${selectedTheme}-theme`);
    }
}

// Update sound setting
function updateSoundSetting() {
    settings.sound = soundToggle.checked;
    localStorage.setItem('sound', settings.sound);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init); 