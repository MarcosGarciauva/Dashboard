export function setupPomodoro(state, saveState, options = {}) {
  const TIMER_KEY = "medDashboardPomodoroTimer.v1";
  const SOUND_TOUCHED_KEY = "medDashboardPomodoroSoundTouched.v1";
  const display = document.querySelector("#timerDisplay");
  const progress = document.querySelector("#timerProgress");
  const startButton = document.querySelector("#timerStart");
  const resetButton = document.querySelector("#timerReset");
  const soundToggle = document.querySelector("#soundToggle");
  const subjectSelect = document.querySelector("#pomodoroSubject");
  const phaseLabel = document.querySelector("#timerPhase");
  const targetLabel = document.querySelector("#timerTarget");
  const circumference = 2 * Math.PI * 52;
  let audioContext = null;
  const timer = {
    mode: "focus25",
    phase: "focus",
    durations: { focus45: 45 * 60, focus25: 25 * 60, focus15: 15 * 60, break: 5 * 60 },
    remaining: 25 * 60,
    running: false,
    interval: null,
    targetAt: null,
    focusStartedAt: null
  };

  function shouldPlaySound() {
    return state.settings.pomodoroSound !== false;
  }

  async function ensureAudio() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContext = audioContext || new AudioContextCtor();
    if (audioContext.state === "suspended") await audioContext.resume();
    return audioContext;
  }

  async function playTone(kind) {
    if (!shouldPlaySound()) return;
    try {
      const context = await ensureAudio();
      if (!context) return;
      const notes = kind === "start" ? [523, 659] : [784, 988, 784];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startsAt = context.currentTime + index * 0.16;
        oscillator.type = kind === "start" ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(frequency, startsAt);
        gain.gain.setValueAtTime(0.0001, startsAt);
        gain.gain.exponentialRampToValueAtTime(0.2, startsAt + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.14);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startsAt);
        oscillator.stop(startsAt + 0.16);
      });
    } catch (error) {
      console.warn("No se pudo reproducir el sonido del Pomodoro.", error);
    }
  }

  function focusDuration() {
    return timer.durations[timer.mode] || timer.durations.focus25;
  }

  function currentTotal() {
    return timer.phase === "break" ? timer.durations.break : focusDuration();
  }

  function persistTimer() {
    localStorage.setItem(TIMER_KEY, JSON.stringify({
      mode: timer.mode,
      phase: timer.phase,
      remaining: timer.remaining,
      running: timer.running,
      targetAt: timer.targetAt,
      focusStartedAt: timer.focusStartedAt
    }));
  }

  function updateModeButtons() {
    document.querySelectorAll(".mode-switch button").forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === timer.mode);
    });
  }

  function updateRemainingFromClock() {
    if (!timer.running || !timer.targetAt) return;
    timer.remaining = Math.max(0, Math.ceil((timer.targetAt - Date.now()) / 1000));
  }

  function formatClockTime(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  }

  function paintTimer() {
    updateRemainingFromClock();
    const total = currentTotal();
    const minutes = String(Math.floor(timer.remaining / 60)).padStart(2, "0");
    const seconds = String(timer.remaining % 60).padStart(2, "0");
    display.textContent = `${minutes}:${seconds}`;
    phaseLabel.textContent = timer.phase === "break" ? "Descanso de 5 min" : "Enfoque";
    if (targetLabel) {
      targetLabel.textContent = timer.running && timer.targetAt ? `Termina a las ${formatClockTime(timer.targetAt)}` : "Listo para iniciar";
    }
    startButton.textContent = timer.running ? "Pausar" : "Iniciar";
    progress.style.strokeDasharray = String(circumference);
    progress.style.strokeDashoffset = String(circumference * (1 - timer.remaining / total));
    updateModeButtons();
  }

  function stopTimer() {
    clearInterval(timer.interval);
    timer.running = false;
    timer.targetAt = null;
    startButton.textContent = "Iniciar";
    persistTimer();
  }

  function formatTime(date) {
    return date.toTimeString().slice(0, 5);
  }

  function completeFocusSession(end = new Date()) {
    const minutes = Math.round(focusDuration() / 60);
    const start = timer.focusStartedAt ? new Date(timer.focusStartedAt) : new Date(end.getTime() - minutes * 60000);
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

  function startInterval() {
    clearInterval(timer.interval);
    timer.interval = setInterval(() => syncFromClock({ notify: true }), 1000);
  }

  function beginBreak(overrunMs = 0, notify = true) {
    timer.phase = "break";
    timer.focusStartedAt = null;
    timer.remaining = Math.max(0, timer.durations.break - Math.floor(overrunMs / 1000));
    timer.running = timer.remaining > 0;
    timer.targetAt = timer.running ? Date.now() + timer.remaining * 1000 : null;
    if (notify) playTone("start");
    if (timer.running) startInterval();
    persistTimer();
    paintTimer();
  }

  function finishBreak(notify = true) {
    clearInterval(timer.interval);
    timer.running = false;
    timer.targetAt = null;
    timer.phase = "focus";
    timer.remaining = focusDuration();
    timer.focusStartedAt = null;
    if (notify) playTone("finish");
    persistTimer();
    paintTimer();
  }

  function syncFromClock({ notify = false } = {}) {
    if (!timer.running || !timer.targetAt) {
      paintTimer();
      return;
    }
    const now = Date.now();
    if (now < timer.targetAt) {
      timer.remaining = Math.ceil((timer.targetAt - now) / 1000);
      paintTimer();
      return;
    }
    const overrunMs = now - timer.targetAt;
    if (timer.phase === "focus") {
      const focusEndedAt = new Date(timer.targetAt);
      completeFocusSession(focusEndedAt);
      if (notify) playTone("finish");
      beginBreak(overrunMs, notify);
      if (timer.remaining === 0) finishBreak(notify);
      return;
    }
    finishBreak(notify);
  }

  function loadTimer() {
    try {
      const saved = JSON.parse(localStorage.getItem(TIMER_KEY) || "null");
      if (!saved) return;
      if (!timer.durations[saved.mode]) return;
      timer.mode = saved.mode;
      timer.phase = saved.phase === "break" ? "break" : "focus";
      timer.remaining = Math.max(0, Number(saved.remaining || currentTotal()));
      timer.running = Boolean(saved.running);
      timer.targetAt = saved.targetAt || null;
      timer.focusStartedAt = saved.focusStartedAt || null;
      if (timer.running) {
        syncFromClock({ notify: false });
        if (timer.running) startInterval();
      }
    } catch {
      localStorage.removeItem(TIMER_KEY);
    }
  }

  document.querySelectorAll(".mode-switch button").forEach((button) => {
    button.addEventListener("click", () => {
      stopTimer();
      timer.mode = button.dataset.mode;
      timer.phase = "focus";
      timer.remaining = focusDuration();
      timer.focusStartedAt = null;
      persistTimer();
      paintTimer();
    });
  });

  startButton.addEventListener("click", () => {
    if (timer.running) {
      updateRemainingFromClock();
      stopTimer();
      paintTimer();
      return;
    }
    timer.running = true;
    timer.targetAt = Date.now() + timer.remaining * 1000;
    if (timer.phase === "focus" && !timer.focusStartedAt) timer.focusStartedAt = new Date().toISOString();
    ensureAudio();
    playTone("start");
    startInterval();
    persistTimer();
    paintTimer();
  });

  resetButton.addEventListener("click", () => {
    stopTimer();
    timer.phase = "focus";
    timer.remaining = focusDuration();
    timer.focusStartedAt = null;
    persistTimer();
    paintTimer();
  });

  if (!localStorage.getItem(SOUND_TOUCHED_KEY) && state.settings.pomodoroSound === false) {
    state.settings.pomodoroSound = true;
    saveState();
  }
  soundToggle.checked = shouldPlaySound();
  soundToggle.addEventListener("change", () => {
    localStorage.setItem(SOUND_TOUCHED_KEY, "1");
    state.settings.pomodoroSound = soundToggle.checked;
    saveState();
    if (soundToggle.checked) playTone("start");
  });
  subjectSelect.addEventListener("change", () => {
    state.settings.pomodoroSubjectId = subjectSelect.value;
    saveState();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncFromClock({ notify: true });
  });
  window.addEventListener("focus", () => syncFromClock({ notify: true }));

  loadTimer();
  paintTimer();
}
