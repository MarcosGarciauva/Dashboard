export function setupPomodoro(state, saveState) {
  const display = document.querySelector("#timerDisplay");
  const progress = document.querySelector("#timerProgress");
  const startButton = document.querySelector("#timerStart");
  const resetButton = document.querySelector("#timerReset");
  const soundToggle = document.querySelector("#soundToggle");
  const circumference = 2 * Math.PI * 52;
  let audioContext = null;
  const timer = {
    mode: "focus",
    durations: { focus: 25 * 60, short: 5 * 60, long: 15 * 60 },
    remaining: 25 * 60,
    running: false,
    interval: null
  };

  function playFinishSound() {
    if (!state.settings.pomodoroSound) return;
    audioContext = audioContext || new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(920, audioContext.currentTime + 0.16);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.45);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.48);
  }

  function paintTimer() {
    const total = timer.durations[timer.mode];
    const minutes = String(Math.floor(timer.remaining / 60)).padStart(2, "0");
    const seconds = String(timer.remaining % 60).padStart(2, "0");
    display.textContent = `${minutes}:${seconds}`;
    progress.style.strokeDasharray = String(circumference);
    progress.style.strokeDashoffset = String(circumference * (1 - timer.remaining / total));
  }

  function stopTimer() {
    clearInterval(timer.interval);
    timer.running = false;
    startButton.textContent = "Iniciar";
  }

  document.querySelectorAll(".mode-switch button").forEach((button) => {
    button.addEventListener("click", () => {
      stopTimer();
      timer.mode = button.dataset.mode;
      timer.remaining = timer.durations[timer.mode];
      document.querySelectorAll(".mode-switch button").forEach((item) => item.classList.toggle("active", item === button));
      paintTimer();
    });
  });

  startButton.addEventListener("click", () => {
    if (timer.running) {
      stopTimer();
      return;
    }
    timer.running = true;
    startButton.textContent = "Pausar";
    timer.interval = setInterval(() => {
      timer.remaining = Math.max(0, timer.remaining - 1);
      paintTimer();
      if (timer.remaining === 0) {
        stopTimer();
        playFinishSound();
      }
    }, 1000);
  });

  resetButton.addEventListener("click", () => {
    stopTimer();
    timer.remaining = timer.durations[timer.mode];
    paintTimer();
  });

  soundToggle.checked = Boolean(state.settings.pomodoroSound);
  soundToggle.addEventListener("change", () => {
    state.settings.pomodoroSound = soundToggle.checked;
    saveState();
  });

  paintTimer();
}
