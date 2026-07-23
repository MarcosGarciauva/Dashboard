import {
  BIRTHDAY,
  COLORS,
  DAY_LABELS,
  DAY_OPTIONS,
  EMPTY,
  ENTITY_CONFIG,
  MONTHS,
  NO_EXAMS,
  NO_SCHEDULE,
  NO_TASKS,
  QUICK_LINKS,
  WEATHER_CODES,
  WEEKDAYS
} from "../lib/config.js";
import { blankItem, createId, loadState, saveState as persistState } from "../lib/storage.js";
import { setupPomodoro } from "../components/pomodoro.js";
import { setupTheme } from "../hooks/useTheme.js";
import { daysUntil, dateFromISO, formatDate, formatHours, minutesBetween, todayISO } from "../utils/dates.js";
import { icon, quickIcon } from "../utils/icons.js";
import { actionButtons, emptyMarkup } from "../utils/ui.js";

export function initializeHome() {
  let state = loadState();
  let calendarCursor = new Date();
  let editor = null;
  const theme = setupTheme(state, saveState);

  function saveState() {
    persistState(state);
  }

  function autoSave() {
    saveState();
    renderAll();
  }

  function getCollection(type) {
    return state[ENTITY_CONFIG[type].collection];
  }

  function subjectById(id) {
    return state.subjects.find((subject) => subject.id === id);
  }

  function subjectName(id) {
    return subjectById(id)?.name || EMPTY;
  }

  function subjectColor(id, fallback = COLORS[0]) {
    return subjectById(id)?.color || fallback;
  }

  function isMeaningful(type, item) {
    if (type === "location") return Boolean(state.settings.location?.trim());
    return ENTITY_CONFIG[type].fields.some((field) => {
      const value = item[field.key];
      return typeof value === "boolean" ? value : String(value || "").trim();
    });
  }

  function updateClock() {
    const now = new Date();
    const birthday = dateFromISO(BIRTHDAY);
    let age = now.getFullYear() - birthday.getFullYear();
    const birthdayPassed = now.getMonth() > birthday.getMonth() || (now.getMonth() === birthday.getMonth() && now.getDate() >= birthday.getDate());
    if (!birthdayPassed) age -= 1;
    document.querySelector("#age").textContent = `${age} años`;
    document.querySelector("#weekday").textContent = WEEKDAYS[now.getDay()];
    document.querySelector("#clock").textContent = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    document.querySelector("#fullDate").textContent = now.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
    renderTimeline();
  }

  async function fetchWeather() {
    const location = state.settings.location?.trim();
    const container = document.querySelector("#weatherContent");
    document.querySelector("#weatherLocation").textContent = location || "No hay ubicación registrada.";
    if (!location) {
      container.innerHTML = emptyMarkup("Agrega una ubicación para consultar el clima.");
      return;
    }
    container.innerHTML = `<div class="empty-state">Consultando clima...</div>`;
    try {
      const searchTerms = [location, location.split(",")[0].trim()].filter(Boolean);
      let place = null;
      for (const term of searchTerms) {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=1&language=es&format=json`;
        const geoRes = await fetch(geoUrl);
        const geo = await geoRes.json();
        place = geo.results?.[0];
        if (place) break;
      }
      if (!place) throw new Error("No location");
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const weather = await weatherRes.json();
      const current = weather.current;
      const [label, weatherIcon] = WEATHER_CODES[current.weather_code] || ["Clima variable", "◐"];
      document.querySelector("#weatherLocation").textContent = place.name;
      container.innerHTML = `
        <div class="weather-main">
          <span class="weather-icon">${weatherIcon}</span>
          <div><strong>${Math.round(current.temperature_2m)}°</strong><span>${label}</span></div>
        </div>
        <div class="metric-row"><span>Sensación</span><strong>${Math.round(current.apparent_temperature)}°</strong></div>
      `;
    } catch {
      container.innerHTML = emptyMarkup("No hay información registrada.");
    }
  }

  function renderQuickLinks() {
    document.querySelector("#quickLinks").innerHTML = QUICK_LINKS.map((link) => `
      <a class="quick-card" href="${link.url}" target="_blank" rel="noreferrer" style="--accent:${link.color}">
        <span class="quick-icon ${link.icon}" aria-hidden="true">${quickIcon(link.icon)}</span>
        <strong>${link.name}</strong>
        ${icon("external")}
      </a>
    `).join("");
  }

  function renderSubjects() {
    const grid = document.querySelector("#subjectsGrid");
    if (!state.subjects.length) {
      grid.innerHTML = emptyMarkup();
      return;
    }
    grid.innerHTML = state.subjects.map((subject) => {
      const schedules = state.schedules.filter((item) => item.subjectId === subject.id);
      const exams = state.exams.filter((item) => item.subjectId === subject.id);
      const tasks = state.tasks.filter((item) => item.subjectId === subject.id);
      const completedTasks = tasks.filter((item) => item.status === "completada").length;
      const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : null;
      return `
        <article class="subject-card compact-subject-card" style="--accent:${subject.color || COLORS[0]}">
          <div class="subject-top">
            <div>
              <h3 class="subject-title">${subject.name || EMPTY}</h3>
              <span class="pill">${subject.credits ? `${subject.credits} créditos` : "Créditos no registrados"}</span>
            </div>
            ${actionButtons("subject", subject.id)}
          </div>
          <div class="subject-summary">
            <span>${schedules.length ? `${schedules.length} horarios` : "Sin horario"}</span>
            <span>${tasks.length ? `${tasks.length} tareas` : "Sin tareas"}</span>
            <span>${exams.length ? `${exams.length} exámenes` : "Sin exámenes"}</span>
          </div>
          ${progress === null ? `<p class="mini-muted">No hay progreso registrado.</p>` : `<div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><p class="mini-muted">${progress}% por tareas completadas</p>`}
          <div class="quick-row">
            <button class="ghost-button" data-view-subject="${subject.id}">Ver</button>
            <button class="ghost-button" data-edit="subject" data-id="${subject.id}">Apuntes</button>
            <button class="ghost-button" data-add-study="${subject.id}">Estudio</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderPomodoroSubjects() {
    const select = document.querySelector("#pomodoroSubject");
    const currentValue = state.settings.pomodoroSubjectId || select.value || "";
    select.innerHTML = `<option value="">Registrar sin materia</option>${state.subjects.map((subject) => `<option value="${subject.id}" ${currentValue === subject.id ? "selected" : ""}>${subject.name || EMPTY}</option>`).join("")}`;
  }

  function openSubjectDetail(id) {
    const subject = subjectById(id);
    if (!subject) return;
    const schedules = state.schedules.filter((item) => item.subjectId === id);
    const exams = state.exams.filter((item) => item.subjectId === id);
    const tasks = state.tasks.filter((item) => item.subjectId === id);
    const studies = state.studyLogs.filter((item) => item.subjectId === id);
    document.querySelector("#subjectDetailTitle").textContent = subject.name || EMPTY;
    document.querySelector("#subjectDetailContent").innerHTML = `
      <div class="detail-grid">
        <div><span>Profesor</span><strong>${subject.teacher || EMPTY}</strong></div>
        <div><span>Aula</span><strong>${subject.room || EMPTY}</strong></div>
        <div><span>Créditos</span><strong>${subject.credits || EMPTY}</strong></div>
        <div><span>Estudio registrado</span><strong>${formatHours(studies.reduce((sum, log) => sum + Number(log.minutes || 0), 0))}</strong></div>
      </div>
      <div class="detail-section">
        <h3>Horarios</h3>
        ${schedules.length ? schedules.map((item) => `<p>${DAY_OPTIONS.find(([value]) => value === String(item.day))?.[1] || EMPTY} · ${item.start || "--:--"}${item.end ? `-${item.end}` : ""} · ${item.room || "Sin salón"}</p>`).join("") : emptyMarkup(NO_SCHEDULE)}
      </div>
      <div class="detail-section">
        <h3>Exámenes</h3>
        ${exams.length ? exams.map((item) => `<p>${formatDate(item.date)} ${item.time || ""} · ${item.examType || "Sin tipo"} · ${item.place || "Sin lugar"}</p>`).join("") : emptyMarkup(NO_EXAMS)}
      </div>
      <div class="detail-section">
        <h3>Tareas</h3>
        ${tasks.length ? tasks.map((item) => `<p>${item.title || EMPTY} · ${item.dueDate ? formatDate(item.dueDate) : "Sin fecha"} · ${item.status || "Sin estado"}</p>`).join("") : emptyMarkup(NO_TASKS)}
      </div>
      <div class="detail-section">
        <h3>Apuntes</h3>
        ${subject.notes ? `<p>${subject.notes}</p>` : emptyMarkup()}
      </div>
      <div class="detail-section">
        <h3>Recursos</h3>
        ${subject.resources ? `<p>${subject.resources}</p>` : emptyMarkup()}
      </div>
      <div class="button-row">
        <button class="primary-button" data-edit="subject" data-id="${subject.id}">Editar materia</button>
        <button class="ghost-button" data-add-study="${subject.id}">Registrar estudio</button>
      </div>
    `;
    bindActionButtons();
    document.querySelector("#subjectDetailDialog").showModal();
  }

  function renderTimeline() {
    const now = new Date();
    const today = String(now.getDay());
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const todaysSchedules = state.schedules
      .filter((item) => String(item.day) === today)
      .sort((a, b) => (a.start || "").localeCompare(b.start || ""));
    const timeline = document.querySelector("#timeline");
    if (!todaysSchedules.length) {
      timeline.innerHTML = emptyMarkup(NO_SCHEDULE);
      return;
    }
    timeline.innerHTML = todaysSchedules.map((item) => {
      const start = item.start ? item.start.split(":").map(Number).reduce((h, m) => h * 60 + m) : -1;
      const end = item.end ? item.end.split(":").map(Number).reduce((h, m) => h * 60 + m) : start + 60;
      const active = start >= 0 && minutesNow >= start && minutesNow <= end;
      return `
        <div class="timeline-item ${active ? "active" : ""}" style="--accent:${item.color || subjectColor(item.subjectId)}">
          <span class="timeline-time">${item.start || "--:--"}${item.end ? `-${item.end}` : ""}</span>
          <div>
            <p class="timeline-title">${subjectName(item.subjectId)}</p>
            <span>${item.room || "No hay salón registrado."}</span>
          </div>
          ${actionButtons("schedule", item.id)}
        </div>
      `;
    }).join("");
  }

  function renderTasks() {
    const visible = [...state.tasks]
      .filter((task) => task.status !== "completada")
      .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    document.querySelector("#taskList").innerHTML = visible.length ? visible.map((task) => `
      <article class="list-card">
        <div>
          <strong>${task.title || EMPTY}</strong>
          <span>${subjectName(task.subjectId)} · ${task.dueDate ? formatDate(task.dueDate) : "Sin fecha límite"} · ${task.priority || "Sin prioridad"}</span>
        </div>
        ${actionButtons("task", task.id)}
      </article>
    `).join("") : emptyMarkup(NO_TASKS);
  }

  function renderExams() {
    const exams = [...state.exams]
      .filter((exam) => exam.date && daysUntil(exam.date) >= 0)
      .sort((a, b) => `${a.date}${a.time || ""}`.localeCompare(`${b.date}${b.time || ""}`));
    document.querySelector("#examList").innerHTML = exams.length ? exams.map((exam) => {
      const remaining = daysUntil(exam.date);
      return `
        <article class="exam-item" style="--accent:${exam.color || subjectColor(exam.subjectId)}">
          <div>
            <strong>${subjectName(exam.subjectId)}</strong>
            <span>${formatDate(exam.date, { day: "numeric", month: "long", year: "numeric" })}${exam.time ? ` · ${exam.time}` : ""}</span>
            <span>${exam.place || "No hay lugar registrado."}</span>
          </div>
          <div class="countdown">${remaining === 0 ? "Hoy" : `Faltan ${remaining} días`}</div>
          ${actionButtons("exam", exam.id)}
        </article>
      `;
    }).join("") : emptyMarkup(NO_EXAMS);
  }

  function renderGoals() {
    const labels = { day: "Objetivos del día", week: "Objetivos de la semana", semester: "Objetivos del semestre" };
    document.querySelector("#goalsBoard").innerHTML = Object.entries(labels).map(([scope, title]) => {
      const goals = state.goals.filter((goal) => goal.scope === scope);
      return `
        <div class="goal-group">
          <h3>${title}</h3>
          ${goals.length ? goals.map((goal) => `
            <div class="goal-row">
              <input type="checkbox" data-goal-check="${goal.id}" ${goal.done ? "checked" : ""} />
              <span>${goal.text || EMPTY}</span>
              ${actionButtons("goal", goal.id)}
            </div>
          `).join("") : emptyMarkup()}
        </div>
      `;
    }).join("");
  }

  function renderStudy() {
    const today = todayISO();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const totalMinutes = (filter) => state.studyLogs.filter(filter).reduce((sum, log) => sum + Number(log.minutes || 0), 0);
    document.querySelector("#hoursToday").textContent = formatHours(totalMinutes((log) => log.date === today));
    document.querySelector("#hoursWeek").textContent = formatHours(totalMinutes((log) => dateFromISO(log.date) >= weekStart));
    document.querySelector("#hoursMonth").textContent = formatHours(totalMinutes((log) => {
      const date = dateFromISO(log.date);
      return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }));
    document.querySelector("#studyStreak").textContent = `${calculateStreak()} días`;
    document.querySelector("#mostStudied").textContent = mostStudiedSubject();
    renderWeeklyChart();
    renderStudyList();
  }

  function calculateStreak() {
    let streak = 0;
    for (let offset = 0; offset < 120; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const iso = date.toISOString().slice(0, 10);
      const studied = state.studyLogs.some((log) => log.date === iso && Number(log.minutes || 0) > 0);
      if (!studied) break;
      streak += 1;
    }
    return streak;
  }

  function mostStudiedSubject() {
    const totals = {};
    state.studyLogs.forEach((log) => {
      totals[log.subjectId] = (totals[log.subjectId] || 0) + Number(log.minutes || 0);
    });
    const top = Object.entries(totals).filter(([, minutes]) => minutes > 0).sort((a, b) => b[1] - a[1])[0];
    return top ? subjectName(top[0]) : EMPTY;
  }

  function renderWeeklyChart() {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const iso = date.toISOString().slice(0, 10);
      const minutes = state.studyLogs.filter((log) => log.date === iso).reduce((sum, log) => sum + Number(log.minutes || 0), 0);
      return { label: DAY_LABELS[(date.getDay() + 6) % 7], minutes };
    });
    const max = Math.max(60, ...days.map((day) => day.minutes));
    document.querySelector("#weeklyChart").innerHTML = days.map((day) => `
      <div class="bar-wrap" title="${formatHours(day.minutes)}">
        <div class="bar" style="height:${Math.max(6, (day.minutes / max) * 92)}px"></div>
        <span class="bar-label">${day.label}</span>
      </div>
    `).join("");
  }

  function renderStudyList() {
    const logs = [...state.studyLogs].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 4);
    document.querySelector("#studyList").innerHTML = logs.length ? logs.map((log) => `
      <article class="list-card">
        <div>
          <strong>${log.topic || subjectName(log.subjectId)}</strong>
          <span>${formatDate(log.date)} · ${formatHours(log.minutes)} · ${subjectName(log.subjectId)}</span>
        </div>
        ${actionButtons("study", log.id)}
      </article>
    `).join("") : emptyMarkup();
  }

  function calendarEvents() {
    const events = [];
    state.exams.forEach((exam) => {
      if (exam.date) events.push({ date: exam.date, title: `Examen · ${subjectName(exam.subjectId)}`, type: "exam", color: exam.color || subjectColor(exam.subjectId) });
    });
    state.tasks.forEach((task) => {
      if (task.dueDate) events.push({ date: task.dueDate, title: task.title || "Tarea", type: "task", color: "#ffd166" });
    });
    state.events.forEach((event) => {
      if (event.date) events.push({ date: event.date, title: event.title || "Evento", type: event.eventType || "event", color: event.color || "#f7a8c4" });
    });
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const last = new Date(year, month + 1, 0).getDate();
    state.schedules.forEach((schedule) => {
      if (!schedule.day) return;
      for (let day = 1; day <= last; day += 1) {
        const date = new Date(year, month, day);
        if (String(date.getDay()) === String(schedule.day)) {
          events.push({ date: date.toISOString().slice(0, 10), title: subjectName(schedule.subjectId), type: "class", color: schedule.color || subjectColor(schedule.subjectId) });
        }
      }
    });
    return events;
  }

  function renderCalendar() {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    document.querySelector("#calendarTitle").textContent = `${MONTHS[month]} ${year}`;
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const events = calendarEvents();
    const cells = DAY_LABELS.map((day) => `<div class="calendar-day-name">${day}</div>`);
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const iso = date.toISOString().slice(0, 10);
      const dayEvents = events.filter((event) => event.date === iso);
      cells.push(`
        <div class="calendar-cell ${date.getMonth() !== month ? "muted" : ""} ${iso === todayISO() ? "today" : ""}">
          <span class="day-number">${date.getDate()}</span>
          ${dayEvents.map((event) => `<span class="event-chip ${event.type}" style="--event:${event.color}">${event.title}</span>`).join("")}
        </div>
      `);
    }
    document.querySelector("#calendarGrid").innerHTML = cells.join("");
  }

  function renderEvents() {
    const events = [...state.events]
      .sort((a, b) => `${a.date || "9999"}${a.time || ""}`.localeCompare(`${b.date || "9999"}${b.time || ""}`));
    document.querySelector("#eventList").innerHTML = events.length ? events.map((event) => `
      <article class="list-card" style="--accent:${event.color || "#f7a8c4"}">
        <div>
          <strong>${event.title || EMPTY}</strong>
          <span>${event.date ? formatDate(event.date) : "Sin fecha"}${event.time ? ` · ${event.time}` : ""} · ${event.eventType || "Evento"}</span>
        </div>
        ${actionButtons("event", event.id)}
      </article>
    `).join("") : emptyMarkup("No hay eventos registrados.");
  }

  function renderAll() {
    renderQuickLinks();
    renderSubjects();
    renderPomodoroSubjects();
    renderTimeline();
    renderTasks();
    renderExams();
    renderGoals();
    renderStudy();
    renderCalendar();
    renderEvents();
    bindActionButtons();
  }

  function bindActionButtons() {
    document.querySelectorAll("[data-add]").forEach((button) => {
      button.onclick = () => openEditor(button.dataset.add);
    });
    document.querySelectorAll("[data-edit]").forEach((button) => {
      button.onclick = () => {
        closeSubjectDetailIfOpen();
        openEditor(button.dataset.edit, button.dataset.id);
      };
    });
    document.querySelectorAll("[data-delete]").forEach((button) => {
      button.onclick = () => deleteItem(button.dataset.delete, button.dataset.id);
    });
    document.querySelectorAll("[data-duplicate]").forEach((button) => {
      button.onclick = () => duplicateItem(button.dataset.duplicate, button.dataset.id);
    });
    document.querySelectorAll("[data-add-study]").forEach((button) => {
      button.onclick = () => {
        closeSubjectDetailIfOpen();
        openEditor("study", null, { subjectId: button.dataset.addStudy });
      };
    });
    document.querySelectorAll("[data-view-subject]").forEach((button) => {
      button.onclick = () => openSubjectDetail(button.dataset.viewSubject);
    });
    document.querySelectorAll("[data-goal-check]").forEach((checkbox) => {
      checkbox.onchange = () => {
        const goal = state.goals.find((item) => item.id === checkbox.dataset.goalCheck);
        if (!goal) return;
        goal.done = checkbox.checked;
        autoSave();
      };
    });
  }

  function closeSubjectDetailIfOpen() {
    const dialog = document.querySelector("#subjectDetailDialog");
    if (dialog?.open) dialog.close();
  }

  function openEditor(type, id = null, preset = {}) {
    if (type === "location") {
      editor = { type, id: "settings", draft: false };
    } else {
      const collection = getCollection(type);
      let item = id ? collection.find((entry) => entry.id === id) : null;
      if (!item) {
        item = { ...blankItem(type, state), ...preset };
        collection.push(item);
        editor = { type, id: item.id, draft: true };
        saveState();
      } else {
        editor = { type, id, draft: false };
      }
    }
    document.querySelector("#editorEyebrow").textContent = id ? "Editar" : "Agregar";
    document.querySelector("#editorTitle").textContent = ENTITY_CONFIG[type].label;
    renderEditorFields();
    document.querySelector("#editorDialog").showModal();
  }

  function currentEditorItem() {
    if (editor.type === "location") return state.settings;
    return getCollection(editor.type).find((item) => item.id === editor.id);
  }

  function renderEditorFields() {
    const item = currentEditorItem();
    const fields = ENTITY_CONFIG[editor.type].fields;
    document.querySelector("#editorFields").innerHTML = fields.map((field) => fieldMarkup(field, item[field.key])).join("");
    document.querySelectorAll("#editorFields [data-field]").forEach((input) => {
      input.addEventListener("input", () => updateField(input));
      input.addEventListener("change", () => updateField(input));
    });
  }

  function fieldMarkup(field, value) {
    const safeValue = value ?? "";
    if (field.type === "textarea") {
      return `<label>${field.label}<textarea data-field="${field.key}" rows="4" placeholder="${field.placeholder || ""}">${safeValue}</textarea></label>`;
    }
    if (field.type === "select") {
      return `<label>${field.label}<select data-field="${field.key}">${field.options.map(([optionValue, label]) => `<option value="${optionValue}" ${String(safeValue) === optionValue ? "selected" : ""}>${label}</option>`).join("")}</select></label>`;
    }
    if (field.type === "subject") {
      return `<label>${field.label}<select data-field="${field.key}"><option value="">Selecciona una materia</option>${state.subjects.map((subject) => `<option value="${subject.id}" ${safeValue === subject.id ? "selected" : ""}>${subject.name || EMPTY}</option>`).join("")}</select></label>`;
    }
    if (field.type === "day") {
      return `<label>${field.label}<select data-field="${field.key}"><option value="">Selecciona un día</option>${DAY_OPTIONS.map(([optionValue, label]) => `<option value="${optionValue}" ${String(safeValue) === optionValue ? "selected" : ""}>${label}</option>`).join("")}</select></label>`;
    }
    if (field.type === "checkbox") {
      return `<label class="check-field"><input data-field="${field.key}" type="checkbox" ${safeValue ? "checked" : ""} />${field.label}</label>`;
    }
    return `<label>${field.label}<input data-field="${field.key}" type="${field.type}" value="${safeValue}" placeholder="${field.placeholder || ""}" ${field.min !== undefined ? `min="${field.min}"` : ""} /></label>`;
  }

  function updateField(input) {
    const item = currentEditorItem();
    const key = input.dataset.field;
    item[key] = input.type === "checkbox" ? input.checked : input.value;
    if (editor.type === "study" && (key === "start" || key === "end")) {
      const minutes = minutesBetween(item.start, item.end);
      if (minutes) {
        item.minutes = minutes;
        const minutesInput = document.querySelector('#editorFields [data-field="minutes"]');
        if (minutesInput && document.activeElement !== minutesInput) minutesInput.value = minutes;
      }
    }
    if (editor.type === "schedule" && key === "subjectId" && !item.color) item.color = subjectColor(item.subjectId);
    if (editor.type === "exam" && key === "subjectId" && !item.color) item.color = subjectColor(item.subjectId);
    saveState();
    renderAll();
    if (editor.type === "location") fetchWeather();
  }

  function closeEditor() {
    if (editor && editor.draft) {
      const item = currentEditorItem();
      if (item && !isMeaningful(editor.type, item)) {
        const collectionName = ENTITY_CONFIG[editor.type].collection;
        state[collectionName] = state[collectionName].filter((entry) => entry.id !== editor.id);
        saveState();
        renderAll();
      }
    }
    editor = null;
    document.querySelector("#editorDialog").close();
  }

  function deleteItem(type, id) {
    const collectionName = ENTITY_CONFIG[type].collection;
    state[collectionName] = state[collectionName].filter((item) => item.id !== id);
    if (type === "subject") {
      state.schedules = state.schedules.filter((item) => item.subjectId !== id);
      state.exams = state.exams.filter((item) => item.subjectId !== id);
      state.tasks = state.tasks.filter((item) => item.subjectId !== id);
      state.studyLogs = state.studyLogs.filter((item) => item.subjectId !== id);
    }
    autoSave();
  }

  function duplicateItem(type, id) {
    const collection = getCollection(type);
    const item = collection.find((entry) => entry.id === id);
    if (!item) return;
    const copy = { ...item, id: createId(type) };
    if (type === "subject" && item.name) copy.name = `${item.name} copia`;
    collection.push(copy);
    autoSave();
  }

  document.querySelector("#editLocation").addEventListener("click", () => openEditor("location"));
  document.querySelector("#refreshWeather").addEventListener("click", fetchWeather);
  document.querySelector("#closeEditor").addEventListener("click", closeEditor);
  document.querySelector("#editorDialog").addEventListener("cancel", (event) => {
    event.preventDefault();
    closeEditor();
  });
  document.querySelector("#closeSubjectDetail").addEventListener("click", () => {
    document.querySelector("#subjectDetailDialog").close();
  });
  document.querySelector("#subjectDetailDialog").addEventListener("cancel", (event) => {
    event.preventDefault();
    document.querySelector("#subjectDetailDialog").close();
  });
  document.querySelector("#prevMonth").addEventListener("click", () => {
    calendarCursor.setMonth(calendarCursor.getMonth() - 1);
    renderCalendar();
  });
  document.querySelector("#nextMonth").addEventListener("click", () => {
    calendarCursor.setMonth(calendarCursor.getMonth() + 1);
    renderCalendar();
  });

  setupPomodoro(state, () => {
    saveState();
    renderStudy();
  }, {
    onFocusComplete(log) {
      state.studyLogs.push({ id: createId("study"), ...log });
      saveState();
      renderStudy();
    }
  });
  theme.applyTheme();
  renderAll();
  updateClock();
  fetchWeather();
  setInterval(updateClock, 1000);
}
