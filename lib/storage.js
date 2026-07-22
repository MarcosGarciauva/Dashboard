import { COLORS, OLD_STORAGE_KEYS, STORAGE_KEY } from "./config.js";

export function createId(prefix = "item") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
    settings: { location: "", theme: "dark", pomodoroSound: false },
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
  return {
    settings: { ...base.settings, ...(value.settings || {}) },
    subjects: Array.isArray(value.subjects) && value.subjects.length ? value.subjects : base.subjects,
    schedules: Array.isArray(value.schedules) ? value.schedules : [],
    exams: Array.isArray(value.exams) ? value.exams : [],
    tasks: Array.isArray(value.tasks) ? value.tasks : [],
    studyLogs: Array.isArray(value.studyLogs) ? value.studyLogs : [],
    events: Array.isArray(value.events) ? value.events : [],
    goals: Array.isArray(value.goals) ? value.goals : []
  };
}

export function loadState() {
  OLD_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return emptyState();
  try {
    return sanitizeState(JSON.parse(saved));
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
