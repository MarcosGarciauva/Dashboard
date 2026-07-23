import { COLORS, OLD_STORAGE_KEYS, STORAGE_KEY } from "./config.js";

export function createId(prefix = "item") {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function initialSubjects() {
  return [
    ["anatomia", "Anatomía Básica", "#7bb7ff"],
    ["biologia", "Biología Celular y Tisular", "#74d8b4"],
    ["embriologia", "Embriología", "#ff8f7a"],
    ["salud", "Introducción al Modelo de Salud", "#ffd166"],
    ["auxilios", "Primeros Auxilios", "#f7a8c4"],
    ["evangelios", "Estudio de los Evangelios", "#b7e4c7"],
    ["desarrollo", "Desarrollo Personal para una Cultura Universitaria", "#9ad0ff"]
  ].map(([id, name, color]) => ({ id, name, color, teacher: "", room: "", credits: "", notes: "", resources: "" }));
}

export function emptyState() {
  return {
    settings: { location: "", theme: "dark", pomodoroSound: false, pomodoroSubjectId: "" },
    subjects: initialSubjects(),
    schedules: [],
    exams: [],
    tasks: [],
    studyLogs: [],
    events: [],
    goals: []
  };
}

export function sanitizeState(value) {
  const base = emptyState();
  return normalizeIds({
    settings: { ...base.settings, ...(value.settings || {}) },
    subjects: Array.isArray(value.subjects) && value.subjects.length ? value.subjects : base.subjects,
    schedules: Array.isArray(value.schedules) ? value.schedules : [],
    exams: Array.isArray(value.exams) ? value.exams : [],
    tasks: Array.isArray(value.tasks) ? value.tasks : [],
    studyLogs: Array.isArray(value.studyLogs) ? value.studyLogs : [],
    events: Array.isArray(value.events) ? value.events : [],
    goals: Array.isArray(value.goals) ? value.goals : []
  });
}

function normalizeIds(state) {
  const subjectMap = new Map();
  state.subjects = state.subjects.map((subject) => {
    if (isUuid(subject.id)) return subject;
    const id = createId("subject");
    subjectMap.set(subject.id, id);
    return { ...subject, id };
  });
  ["schedules", "exams", "tasks", "studyLogs"].forEach((collection) => {
    state[collection] = state[collection].map((item) => ({
      ...item,
      id: isUuid(item.id) ? item.id : createId(collection),
      subjectId: subjectMap.get(item.subjectId) || item.subjectId || ""
    }));
  });
  ["events", "goals"].forEach((collection) => {
    state[collection] = state[collection].map((item) => ({ ...item, id: isUuid(item.id) ? item.id : createId(collection) }));
  });
  if (subjectMap.has(state.settings.pomodoroSubjectId)) state.settings.pomodoroSubjectId = subjectMap.get(state.settings.pomodoroSubjectId);
  return state;
}

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const legacySaved = OLD_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!saved && !legacySaved) return emptyState();
  try {
    const state = sanitizeState(JSON.parse(saved || legacySaved));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    OLD_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    return state;
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function blankItem(type, state) {
  const collection = state[type === "study" ? "studyLogs" : `${type}s`];
  const color = COLORS[(collection?.length || 0) % COLORS.length];
  const blanks = {
    subject: { id: createId("subject"), name: "", color, teacher: "", room: "", credits: "", notes: "", resources: "" },
    schedule: { id: createId("schedule"), subjectId: "", day: "", start: "", end: "", room: "", teacher: "", color },
    exam: { id: createId("exam"), subjectId: "", date: "", time: "", place: "", examType: "", description: "", color },
    task: { id: createId("task"), subjectId: "", title: "", description: "", dueDate: "", priority: "", status: "pendiente", notes: "" },
    study: { id: createId("study"), subjectId: "", date: "", start: "", end: "", minutes: "", topic: "", comments: "" },
    event: { id: createId("event"), title: "", date: "", time: "", eventType: "event", place: "", description: "", color },
    goal: { id: createId("goal"), scope: "day", text: "", done: false }
  };
  return blanks[type];
}
