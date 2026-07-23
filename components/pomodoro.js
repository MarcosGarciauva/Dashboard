export function setupPomodoro(state, saveState, options = {}) {
  const display = document.querySelector("#timerDisplay");
  const progress = document.querySelector("#timerProgress");
  const startButton = document.querySelector("#timerStart");
  const resetButton = document.querySelector("#timerReset");
  const soundToggle = document.querySelector("#soundToggle");
  const subjectSelect = document.querySelector("#pomodoroSubject");
  const phaseLabel = document.querySelector("#timerPhase");
  const circumference = 2 * Math.PI * 52;
  let audioContext = null;
  const timer = {
    mode: "focus25",
    phase: "focus",
    durations: { focus45: 45 * 60, focus25: 25 * 60, focus15: 15 * 60, break: 5 * 60 },
    remaining: 25 * 60,
    running: false,
    interval: null,
    focusStartedAt: null
  };

  function playTone(kind) {
    if (!state.settings.pomodoroSound) return;
    audioContext = audioContext || new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    const first = kind === "start" ? 520 : 740;
    const second = kind === "start" ? 660 : 920;
    oscillator.frequency.setValueAtTime(first, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(second, audioContext.currentTime + 0.16);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.45);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.48);
  }

  function paintTimer() {
    const total = timer.phase === "break" ? timer.durations.break : timer.durations[timer.mode];
    const minutes = String(Math.floor(timer.remaining / 60)).padStart(2, "0");
    const seconds = String(timer.remaining % 60).padStart(2, "0");
    display.textContent = `${minutes}:${seconds}`;
    phaseLabel.textContent = timer.phase === "break" ? "Descanso de 5 min" : "Enfoque";
    progress.style.strokeDasharray = String(circumference);
    progress.style.strokeDashoffset = String(circumference * (1 - timer.remaining / total));
  }

  function stopTimer() {
    clearInterval(timer.interval);
    timer.running = false;
    startButton.textContent = "Iniciar";
  }

  function formatTime(date) {
    return date.toTimeString().slice(0, 5);
  }

  function completeFocusSession() {
    const minutes = Math.round(timer.durations[timer.mode] / 60);
    const end = new Date();
    const start = timer.focusStartedAt || new Date(end.getTime() - minutes * 60000);
    options.onFocusComplete?.({
      subjectId: subjectSelect.value || "",
      date: end.toISOString().slice(0, 10),
      start: formatTime(start),
      end: formatTime(end),
      minutes,
      topic: `Pomodoro ${minutes} min`,
      comments: "Registrado automáticamente por el Pomodoro."
    });
  }

  function beginBreak() {
    timer.phase = "break";
    timer.remaining = timer.durations.break;
    playTone("start");
    paintTimer();
  }

  function finishBreak() {
    stopTimer();
    timer.phase = "focus";
    timer.remaining = timer.durations[timer.mode];
    playTone("finish");
    paintTimer();
  }

  document.querySelectorAll(".mode-switch button").forEach((button) => {
    button.addEventListener("click", () => {
      stopTimer();
      timer.mode = button.dataset.mode;
      timer.phase = "focus";
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
    if (timer.phase === "focus") timer.focusStartedAt = new Date();
    playTone("start");
    startButton.textContent = "Pausar";
    timer.interval = setInterval(() => {
      timer.remaining = Math.max(0, timer.remaining - 1);
      paintTimer();
      if (timer.remaining === 0) {
        if (timer.phase === "focus") {
          completeFocusSession();
          playTone("finish");
          beginBreak();
        } else {
          finishBreak();
        }
      }
    }, 1000);
  });

  resetButton.addEventListener("click", () => {
    stopTimer();
    timer.phase = "focus";
    timer.remaining = timer.durations[timer.mode];
    paintTimer();
  });

  soundToggle.checked = Boolean(state.settings.pomodoroSound);
  soundToggle.addEventListener("change", () => {
    state.settings.pomodoroSound = soundToggle.checked;
    saveState();
  });
  subjectSelect.addEventListener("change", () => {
    state.settings.pomodoroSubjectId = subjectSelect.value;
    saveState();
  });

  paintTimer();
}
