export const STORAGE_KEY = "medDashboardMarcos.v4";
export const OLD_STORAGE_KEYS = ["medDashboardMarcos.v1", "medDashboardMarcos.v2", "medDashboardMarcos.v3"];
export const BIRTHDAY = "2008-05-26";
export const EMPTY = "No hay información registrada.";
export const NO_EXAMS = "No hay próximos exámenes.";
export const NO_TASKS = "No hay tareas pendientes.";
export const NO_SCHEDULE = "No hay horario asignado.";
export const COLORS = ["#7bb7ff", "#74d8b4", "#ff8f7a", "#ffd166", "#f7a8c4", "#b7e4c7", "#9ad0ff", "#c8b6ff"];
export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DAY_OPTIONS = [
  ["1", "Lunes"],
  ["2", "Martes"],
  ["3", "Miércoles"],
  ["4", "Jueves"],
  ["5", "Viernes"],
  ["6", "Sábado"],
  ["0", "Domingo"]
];
export const WEATHER_CODES = {
  0: ["Soleado", "☀"],
  1: ["Mayormente despejado", "🌤"],
  2: ["Parcialmente nublado", "⛅"],
  3: ["Nublado", "☁"],
  45: ["Niebla", "🌫"],
  48: ["Niebla", "🌫"],
  51: ["Llovizna", "🌦"],
  53: ["Llovizna", "🌦"],
  55: ["Llovizna", "🌦"],
  61: ["Lluvia", "🌧"],
  63: ["Lluvia", "🌧"],
  65: ["Lluvia fuerte", "🌧"],
  80: ["Chubascos", "🌦"],
  95: ["Tormenta", "⛈"]
};
export const QUICK_LINKS = [
  { name: "Google Drive", url: "https://drive.google.com/", icon: "drive", color: "#7bb7ff" },
  { name: "Google Calendar", url: "https://calendar.google.com/", icon: "calendar", color: "#74d8b4" },
  { name: "Google Sheets Hábitos", url: "https://docs.google.com/spreadsheets/d/1-G1IU_Ol363caqqrLbFtulZ5LfypZlljpGFR82QJLmY/edit?gid=0", icon: "sheets", color: "#0f9d58" },
  { name: "Notion Medicina", url: "https://app.notion.com/p/Medicina-3a21b938b13880b59f7fd1c012b61fbd", icon: "notion", color: "#f4f7fb" },
  { name: "ChatGPT", url: "https://chatgpt.com/", icon: "chatgpt", color: "#74d8b4" },
  { name: "YouTube", url: "https://www.youtube.com/", icon: "youtube", color: "#ff4d4d" },
  { name: "AnkiWeb", url: "https://ankiweb.net/", icon: "anki", color: "#7bb7ff" },
  { name: "Sistema Académico UM", url: "https://academico.um.edu.mx/academico/inicio", icon: "school", color: "#ffd166" },
  { name: "Plataforma E42", url: "https://e42.um.edu.mx/sec/home.aspx", icon: "platform", color: "#f7a8c4" },
  { name: "Gmail Institucional", url: "https://mail.google.com/", icon: "gmail", color: "#ff8f7a" },
  { name: "Google Keep", url: "https://keep.google.com/", icon: "keep", color: "#ffd166" }
];
export const ENTITY_CONFIG = {
  location: {
    label: "Ubicación",
    collection: "settings",
    fields: [{ key: "location", label: "Ubicación", type: "text", placeholder: "Ciudad o municipio" }]
  },
  subject: {
    label: "Materia",
    collection: "subjects",
    fields: [
      { key: "name", label: "Nombre", type: "text" },
      { key: "teacher", label: "Profesor", type: "text" },
      { key: "room", label: "Aula", type: "text" },
      { key: "credits", label: "Créditos", type: "number", min: 0 },
      { key: "color", label: "Color", type: "color" },
      { key: "notes", label: "Apuntes", type: "textarea" },
      { key: "resources", label: "Recursos", type: "textarea" }
    ]
  },
  schedule: {
    label: "Horario",
    collection: "schedules",
    fields: [
      { key: "subjectId", label: "Materia", type: "subject" },
      { key: "day", label: "Día de la semana", type: "day" },
      { key: "start", label: "Hora de inicio", type: "time" },
      { key: "end", label: "Hora de fin", type: "time" },
      { key: "room", label: "Salón", type: "text" },
      { key: "teacher", label: "Profesor", type: "text" },
      { key: "color", label: "Color", type: "color" }
    ]
  },
  exam: {
    label: "Examen",
    collection: "exams",
    fields: [
      { key: "subjectId", label: "Materia", type: "subject" },
      { key: "date", label: "Fecha", type: "date" },
      { key: "time", label: "Hora", type: "time" },
      { key: "place", label: "Lugar", type: "text" },
      { key: "examType", label: "Tipo de examen", type: "text" },
      { key: "description", label: "Descripción", type: "textarea" },
      { key: "color", label: "Color", type: "color" }
    ]
  },
  task: {
    label: "Tarea",
    collection: "tasks",
    fields: [
      { key: "subjectId", label: "Materia", type: "subject" },
      { key: "title", label: "Título", type: "text" },
      { key: "description", label: "Descripción", type: "textarea" },
      { key: "dueDate", label: "Fecha límite", type: "date" },
      { key: "priority", label: "Prioridad", type: "select", options: [["", "Sin prioridad"], ["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
      { key: "status", label: "Estado", type: "select", options: [["pendiente", "Pendiente"], ["en-progreso", "En progreso"], ["completada", "Completada"]] },
      { key: "notes", label: "Notas", type: "textarea" }
    ]
  },
  study: {
    label: "Estudio",
    collection: "studyLogs",
    fields: [
      { key: "subjectId", label: "Materia", type: "subject" },
      { key: "date", label: "Fecha", type: "date" },
      { key: "start", label: "Hora de inicio", type: "time" },
      { key: "end", label: "Hora de fin", type: "time" },
      { key: "minutes", label: "Tiempo total (min)", type: "number", min: 0 },
      { key: "topic", label: "Tema estudiado", type: "text" },
      { key: "comments", label: "Comentarios", type: "textarea" }
    ]
  },
  event: {
    label: "Evento",
    collection: "events",
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "date", label: "Fecha", type: "date" },
      { key: "time", label: "Hora", type: "time" },
      { key: "eventType", label: "Tipo", type: "select", options: [["event", "Evento"], ["practice", "Práctica"], ["class", "Clase"], ["task", "Entrega"], ["exam", "Examen"]] },
      { key: "place", label: "Lugar", type: "text" },
      { key: "description", label: "Descripción", type: "textarea" },
      { key: "color", label: "Color", type: "color" }
    ]
  },
  goal: {
    label: "Objetivo",
    collection: "goals",
    fields: [
      { key: "scope", label: "Periodo", type: "select", options: [["day", "Día"], ["week", "Semana"], ["semester", "Semestre"]] },
      { key: "text", label: "Objetivo", type: "text" },
      { key: "done", label: "Completado", type: "checkbox" }
    ]
  }
};
