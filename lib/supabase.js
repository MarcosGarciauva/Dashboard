import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config.js";
import { emptyState, sanitizeState } from "./storage.js";

const SESSION_KEY = "medDashboardSupabaseSession.v1";
const REST_URL = `${SUPABASE_URL}/rest/v1`;
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;

const TABLES = {
  settings: "user_settings",
  subjects: "subjects",
  schedules: "schedules",
  exams: "exams",
  tasks: "tasks",
  studyLogs: "study_logs",
  goals: "goals",
  events: "events"
};

export function getStoredSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!session?.access_token || !session?.expires_at) return null;
    if (session.expires_at * 1000 < Date.now() + 60000) return null;
    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function signIn(email, password) {
  const response = await fetch(`${AUTH_URL}/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });
  const data = await readJson(response);
  const session = { ...data, expires_at: Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600) };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function signOut(session) {
  try {
    if (session?.access_token) {
      await fetch(`${AUTH_URL}/logout`, { method: "POST", headers: authHeaders(session.access_token) });
    }
  } finally {
    clearSession();
  }
}

export async function loadCloudState(session) {
  const [settings, subjects, schedules, exams, tasks, studyLogs, goals, events] = await Promise.all([
    selectRows("user_settings", session),
    selectRows("subjects", session),
    selectRows("schedules", session),
    selectRows("exams", session),
    selectRows("tasks", session),
    selectRows("study_logs", session),
    selectRows("goals", session),
    selectRows("events", session)
  ]);
  const base = emptyState();
  const cloudState = sanitizeState({
    settings: { ...base.settings, ...fromSettings(settings[0]) },
    subjects: subjects.map(fromSubject),
    schedules: schedules.map(fromSchedule),
    exams: exams.map(fromExam),
    tasks: tasks.map(fromTask),
    studyLogs: studyLogs.map(fromStudyLog),
    goals: goals.map(fromGoal),
    events: events.map(fromEvent)
  });
  cloudState.__hasCloudData = Boolean(
    subjects.length ||
    schedules.length ||
    exams.length ||
    tasks.length ||
    studyLogs.length ||
    goals.length ||
    events.length ||
    settings[0]?.location
  );
  return cloudState;
}

export async function saveCloudState(state, session) {
  await upsertSettings(state.settings, session);
  await replaceCollection(TABLES.subjects, state.subjects.map(toSubject), session);
  await Promise.all([
    replaceCollection(TABLES.schedules, state.schedules.map(toSchedule), session),
    replaceCollection(TABLES.exams, state.exams.map(toExam), session),
    replaceCollection(TABLES.tasks, state.tasks.map(toTask), session),
    replaceCollection(TABLES.studyLogs, state.studyLogs.map(toStudyLog), session),
    replaceCollection(TABLES.goals, state.goals.map(toGoal), session),
    replaceCollection(TABLES.events, state.events.map(toEvent), session)
  ]);
}

async function selectRows(table, session) {
  const response = await fetch(`${REST_URL}/${table}?select=*`, { headers: restHeaders(session.access_token) });
  return readJson(response);
}

async function upsertSettings(settings, session) {
  const body = [{
    location: settings.location || "",
    theme: settings.theme || "dark",
    pomodoro_sound: Boolean(settings.pomodoroSound),
    pomodoro_subject_id: settings.pomodoroSubjectId || null
  }];
  const response = await fetch(`${REST_URL}/${TABLES.settings}?on_conflict=user_id`, {
    method: "POST",
    headers: { ...restHeaders(session.access_token), Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(body)
  });
  await readJsonOrEmpty(response);
}

async function replaceCollection(table, rows, session) {
  const existing = await selectRows(table, session);
  const nextIds = new Set(rows.map((row) => row.id));
  const removed = existing.filter((row) => !nextIds.has(row.id)).map((row) => row.id);
  if (removed.length) {
    const response = await fetch(`${REST_URL}/${table}?id=in.(${removed.join(",")})`, {
      method: "DELETE",
      headers: restHeaders(session.access_token)
    });
    await readJsonOrEmpty(response);
  }
  if (!rows.length) return;
  const response = await fetch(`${REST_URL}/${table}?on_conflict=id`, {
    method: "POST",
    headers: { ...restHeaders(session.access_token), Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows)
  });
  await readJsonOrEmpty(response);
}

function authHeaders(token = SUPABASE_ANON_KEY) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

function restHeaders(token) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal"
  };
}

async function readJson(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || data?.hint || "Error de Supabase");
  return data;
}

async function readJsonOrEmpty(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.msg || data?.message || data?.hint || "Error de Supabase");
  return data;
}

function fromSettings(row = {}) {
  return {
    location: row.location || "",
    theme: row.theme || "dark",
    pomodoroSound: Boolean(row.pomodoro_sound),
    pomodoroSubjectId: row.pomodoro_subject_id || ""
  };
}

function toSubject(item) {
  return { id: item.id, name: item.name || "", teacher: item.teacher || "", room: item.room || "", credits: item.credits === "" ? null : Number(item.credits), color: item.color || "#7bb7ff", notes: item.notes || "", resources: item.resources || "" };
}

function fromSubject(row) {
  return { id: row.id, name: row.name || "", teacher: row.teacher || "", room: row.room || "", credits: row.credits ?? "", color: row.color || "#7bb7ff", notes: row.notes || "", resources: row.resources || "" };
}

function toSchedule(item) {
  return { id: item.id, subject_id: item.subjectId || null, day: item.day === "" ? null : Number(item.day), start_time: item.start || null, end_time: item.end || null, room: item.room || "", teacher: item.teacher || "", color: item.color || "#7bb7ff" };
}

function fromSchedule(row) {
  return { id: row.id, subjectId: row.subject_id || "", day: row.day ?? "", start: row.start_time?.slice(0, 5) || "", end: row.end_time?.slice(0, 5) || "", room: row.room || "", teacher: row.teacher || "", color: row.color || "#7bb7ff" };
}

function toExam(item) {
  return { id: item.id, subject_id: item.subjectId || null, exam_date: item.date || null, exam_time: item.time || null, place: item.place || "", exam_type: item.examType || "", description: item.description || "", color: item.color || "#ff8f7a" };
}

function fromExam(row) {
  return { id: row.id, subjectId: row.subject_id || "", date: row.exam_date || "", time: row.exam_time?.slice(0, 5) || "", place: row.place || "", examType: row.exam_type || "", description: row.description || "", color: row.color || "#ff8f7a" };
}

function toTask(item) {
  return { id: item.id, subject_id: item.subjectId || null, title: item.title || "", description: item.description || "", due_date: item.dueDate || null, priority: item.priority || "", status: item.status || "pendiente", notes: item.notes || "" };
}

function fromTask(row) {
  return { id: row.id, subjectId: row.subject_id || "", title: row.title || "", description: row.description || "", dueDate: row.due_date || "", priority: row.priority || "", status: row.status || "pendiente", notes: row.notes || "" };
}

function toStudyLog(item) {
  return { id: item.id, subject_id: item.subjectId || null, study_date: item.date || null, start_time: item.start || null, end_time: item.end || null, minutes: Number(item.minutes || 0), topic: item.topic || "", comments: item.comments || "", source: item.source || "manual" };
}

function fromStudyLog(row) {
  return { id: row.id, subjectId: row.subject_id || "", date: row.study_date || "", start: row.start_time?.slice(0, 5) || "", end: row.end_time?.slice(0, 5) || "", minutes: row.minutes || 0, topic: row.topic || "", comments: row.comments || "", source: row.source || "manual" };
}

function toGoal(item) {
  return { id: item.id, scope: item.scope || "day", text: item.text || "", done: Boolean(item.done) };
}

function fromGoal(row) {
  return { id: row.id, scope: row.scope || "day", text: row.text || "", done: Boolean(row.done) };
}

function toEvent(item) {
  return { id: item.id, title: item.title || "", event_date: item.date || null, event_time: item.time || null, event_type: item.eventType || "event", place: item.place || "", description: item.description || "", color: item.color || "#f7a8c4" };
}

function fromEvent(row) {
  return { id: row.id, title: row.title || "", date: row.event_date || "", time: row.event_time?.slice(0, 5) || "", eventType: row.event_type || "event", place: row.place || "", description: row.description || "", color: row.color || "#f7a8c4" };
}
