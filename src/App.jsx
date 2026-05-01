import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBriefcase,
  faCalendarDays,
  faChartLine,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCirclePlus,
  faCopy,
  faFileArrowDown,
  faFileArrowUp,
  faFileExport,
  faFilePdf,
  faFloppyDisk,
  faGear,
  faListCheck,
  faMinus,
  faNoteSticky,
  faPenToSquare,
  faPhone,
  faRocket,
  faRotateLeft,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const STORAGE_KEY = "eteach-kpi-tracker-stable-v1";

const KPI_FIELDS = [
  ["calls", "Calls"],
  ["productiveCalls", "Productive Calls"],
  ["emails", "Emails"],
  ["oppsIdentified", "Opps Identified"],
  ["oppsInitiated", "Opps Initiated"],
  ["oppsWon", "Opps Won"],
  ["meetingsBooked", "Meetings Booked"],
];

const PRODUCTIVE_OUTCOMES = ["Meeting Booked", "Interest in Enhancement", "Unhappy"];

const DEFAULT_OPTION_SETS = {
  meetingTypes: [
    { id: "meeting-account-review", label: "Account Review" },
    { id: "meeting-onboarding", label: "Onboarding" },
    { id: "meeting-3-month-review", label: "3 Month Review" },
  ],
  callReasons: [
    { id: "reason-book-account-review", label: "Book Account Review" },
    { id: "reason-email-query", label: "Email Query" },
    { id: "reason-renewal-discussion", label: "Renewal Discussion" },
    { id: "reason-support-call", label: "Support Call" },
    { id: "reason-call-back", label: "Call Back" },
  ],
  callOutcomes: [
    { id: "outcome-meeting-booked", label: "Meeting Booked", productive: true, createsMeeting: true },
    { id: "outcome-interest-enhancement", label: "Interest in Enhancement", productive: true, createsMeeting: false },
    { id: "outcome-voicemail", label: "Voicemail", productive: false, createsMeeting: false },
    { id: "outcome-no-answer", label: "No Answer", productive: false, createsMeeting: false },
    { id: "outcome-unhappy", label: "Unhappy", productive: true, createsMeeting: false },
  ],
  taskTypes: [
    { id: "task-general", label: "General" },
    { id: "task-customer-follow-up", label: "Customer Follow-up" },
    { id: "task-renewal", label: "Renewal" },
    { id: "task-support", label: "Support" },
    { id: "task-opportunity", label: "Opportunity" },
    { id: "task-admin", label: "Admin" },
  ],
  opportunityTypes: [
    { id: "opp-type-enhancement", label: "Enhancement" },
    { id: "opp-type-new-business", label: "New Business" },
  ],
  opportunityStatuses: [
    { id: "opp-status-to-action", label: "To Action" },
    { id: "opp-status-email-sent", label: "Email Sent" },
  ],
  opportunityReplies: [
    { id: "opp-reply-no", label: "No" },
    { id: "opp-reply-yes", label: "Yes" },
  ],
  opportunitySuccesses: [
    { id: "opp-success-pending", label: "Pending" },
    { id: "opp-success-won", label: "Won" },
  ],
};

const OPTION_SET_LABELS = {
  meetingTypes: "Meeting types",
  callReasons: "Call reasons",
  callOutcomes: "Call outcomes",
  taskTypes: "Task types",
  opportunityTypes: "Opportunity types",
  opportunityStatuses: "Opportunity statuses",
  opportunityReplies: "Opportunity replies",
  opportunitySuccesses: "Opportunity results",
};

const FONT_OPTIONS = [
  { label: "Poppins", value: "Poppins, 'Segoe UI', Arial, sans-serif" },
  { label: "Arial Rounded MT", value: "'Arial Rounded MT Bold', Poppins, 'Segoe UI', Arial, sans-serif" },
  { label: "System clean", value: "system-ui, 'Segoe UI', Roboto, Arial, sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', Arial, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', Arial, sans-serif" },
  { label: "Mono", value: "'Cascadia Mono', Consolas, monospace" },
];

const DEFAULT_THEME = {
  bodyFont: "Poppins, 'Segoe UI', Arial, sans-serif",
  headerFont: "'Arial Rounded MT Bold', Poppins, 'Segoe UI', Arial, sans-serif",
  bodyWeight: 400,
  headerWeight: 900,
  subheadingWeight: 900,
  bodySize: 16,
  subheadingSize: 12,
  headerScale: 1,
  panelRadius: 24,
  controlRadius: 16,
  customFonts: [],
  newFontName: "",
};

const PRIORITIES = [
  { value: "low", label: "Low", color: "green" },
  { value: "normal", label: "Normal", color: "blue" },
  { value: "high", label: "High", color: "amber" },
  { value: "urgent", label: "Urgent", color: "red" },
];

const copy = {
  en: {
    app: "Offline KPI Tracker",
    week: "Week",
    month: "Month",
    ytd: "YTD",
    settings: "Settings",
    language: "Language",
    design: "Design",
    dropdownOptions: "Dropdown options",
    dropdownHelp: "Edit future dropdown choices. Saved historic records keep the wording they already have.",
    addOption: "Add option",
    resetOptions: "Reset dropdowns",
    productive: "Productive call",
    createsMeeting: "Creates meeting",
    addFont: "Add font",
    addFontHelp: "Add the exact font family name. It will work if the font is installed or loaded by the app.",
    fontName: "Font name",
    profileName: "Profile name",
    bodyFont: "Body font",
    headerFont: "Header font",
    bodyWeight: "Body weight",
    headerWeight: "Header weight",
    subheadingWeight: "Subheading weight",
    bodySize: "Body size",
    headerSize: "Header size",
    subheadingSize: "Subheading size",
    panelRadius: "Box radius",
    controlRadius: "Button/input radius",
    lowPriority: "Low",
    normalPriority: "Normal",
    highPriority: "High",
    urgentPriority: "Urgent",
    otherTask: "Other",
    otherTaskName: "Other task name",
    resetDesign: "Reset design",
    previewTitle: "Preview heading",
    previewBody: "This preview updates as you change fonts, weights, sizes and rounded corners.",
    save: "Save",
    saveAs: "Save As",
    copyTasks: "Copy Tasks",
    copiedTasks: "Task update copied.",
    taskUpdateTitle: "eTeach KPI Task Update",
    outstandingTasks: "Outstanding tasks",
    completedTasks: "Completed tasks",
    completedClosed: "Completed / closed in tracker",
    noOutstandingTasks: "No outstanding tasks.",
    noCompletedTasks: "No completed tasks.",
    exportExcel: "Export Excel",
    pdfPrint: "PDF / Print",
    backup: "Backup",
    import: "Import",
    reset: "Reset",
    editTotals: "Edit totals",
    done: "Done",
    showActions: "Show actions, exports & backup v",
    hideActions: "Hide actions ^",
    collapseTop: "Collapse top panel",
    expandTop: "Expand top panel",
    meetingsToday: "Meetings Today",
    noMeetingsToday: "No meetings logged for today.",
    kpis: "KPIs",
    dynamicTasks: "Dynamic Tasks",
    meetingNotes: "Notes",
    notesTab: "Notes",
    levelUps: "Level Ups",
    addLevelUp: "Add level up",
    addLevelUpToNote: "Add leveling up",
    levelUpsWaiting: "Level ups waiting to be saved",
    onlineForm: "Online Form",
    careerSite: "Link to Career Site",
    live: "LIVE",
    goToNote: "Go to Note",
    quickAdd: "Quick add",
    addMeeting: "Add meeting",
    addOpportunity: "Add opportunity",
    addCall: "Add call",
    addTask: "Add task",
    school: "School / MAT / LA name",
    client: "School / MAT / LA name",
    jobTitle: "Job title",
    opportunityType: "Opportunity type",
    enhancement: "Enhancement",
    newBusiness: "New Business",
    notes: "Notes",
    task: "Task",
    taskType: "Task type",
    dueDate: "Due date",
    dueTime: "Due time",
    urgent: "Urgent",
    teamsInviteSent: "Teams invite sent",
    teamsSent: "Teams sent",
    teamsNotSent: "Teams not sent",
    opportunities: "Opportunities",
    meetings: "Meetings",
    calls: "Calls",
    liveTasks: "Live Tasks",
    closedTasks: "Closed Tasks",
    noLiveTasks: "No live tasks yet.",
    noClosedTasks: "No closed tasks yet.",
    addNote: "Add Meeting / Call Note",
    noteHelp: "Write notes, create linked tasks or follow-up meetings, then save once.",
    createTask: "+ Create a task",
    hideTask: "Hide task creator",
    createFollowUp: "+ Create a follow-up meeting",
    hideFollowUp: "Hide follow-up creator",
    addTaskToNote: "Add task to this note",
    addFollowUpToNote: "Add follow-up to this note",
    tasksWaiting: "Tasks waiting to be saved",
    followUpsWaiting: "Follow-up meetings waiting to be saved",
    saveNote: "Save note",
    saveMeeting: "Save meeting",
    saveCall: "Save call",
    meetingNote: "Meeting note",
    callNote: "Call note",
    notesList: "Notes List",
    taskFromNote: "Task from note",
    followUpFromNote: "Follow-up from note",
    toAction: "To Action",
    emailSent: "Email Sent",
    replied: "Replied",
    yes: "Yes",
    no: "No",
    pending: "Pending",
    won: "Won",
    required: "Please complete all required fields before submitting.",
    requiredTask: "Please complete all required task fields before adding it to this note.",
    savedLocal: "Saved locally on this device.",
    importWarning: "Importing will replace current tracker data. Continue?",
    resetWarning: "Reset all data?",
    popBlocked: "Pop-up blocked. Allow pop-ups to print.",
    meetingReminder: "Meeting reminder",
    meetingDue: "Meeting due within 15 minutes",
    dismiss: "Dismiss",
  },
  cy: {
    app: "Traciwr KPI All-lein",
    week: "Wythnos",
    month: "Mis",
    ytd: "Hyd yma eleni",
    settings: "Gosodiadau",
    language: "Iaith",
    design: "Dyluniad",
    dropdownOptions: "Opsiynau cwymplen",
    dropdownHelp: "Golygwch ddewisiadau cwymplen y dyfodol. Mae cofnodion hanesyddol yn cadw eu geiriad presennol.",
    addOption: "Ychwanegu opsiwn",
    resetOptions: "Ailosod cwymplenni",
    productive: "Galwad gynhyrchiol",
    createsMeeting: "Creu cyfarfod",
    addFont: "Ychwanegu ffont",
    addFontHelp: "Ychwanegwch enw teulu'r ffont yn union. Bydd yn gweithio os yw'r ffont wedi'i osod neu'i lwytho gan yr ap.",
    fontName: "Enw ffont",
    profileName: "Enw proffil",
    bodyFont: "Ffont corff",
    headerFont: "Ffont pennawd",
    bodyWeight: "Pwysau corff",
    headerWeight: "Pwysau pennawd",
    subheadingWeight: "Pwysau is-bennawd",
    bodySize: "Maint corff",
    headerSize: "Maint pennawd",
    subheadingSize: "Maint is-bennawd",
    panelRadius: "Radiws blychau",
    controlRadius: "Radiws botymau/mewnbynnau",
    lowPriority: "Isel",
    normalPriority: "Arferol",
    highPriority: "Uchel",
    urgentPriority: "Brys",
    otherTask: "Arall",
    otherTaskName: "Enw tasg arall",
    resetDesign: "Ailosod dyluniad",
    previewTitle: "Pennawd rhagolwg",
    previewBody: "Mae'r rhagolwg hwn yn newid wrth i chi addasu ffontiau, pwysau, meintiau a chorneli.",
    save: "Cadw",
    saveAs: "Cadw fel",
    copyTasks: "Copio Tasgau",
    copiedTasks: "Diweddariad tasgau wedi'i gopio.",
    taskUpdateTitle: "Diweddariad Tasgau KPI eTeach",
    outstandingTasks: "Tasgau heb eu cwblhau",
    completedTasks: "Tasgau wedi'u cwblhau",
    completedClosed: "Wedi'i gwblhau / cau yn y traciwr",
    noOutstandingTasks: "Dim tasgau heb eu cwblhau.",
    noCompletedTasks: "Dim tasgau wedi'u cwblhau.",
    exportExcel: "Allforio Excel",
    pdfPrint: "PDF / Argraffu",
    backup: "Copi wrth gefn",
    import: "Mewnforio",
    reset: "Ailosod",
    editTotals: "Golygu cyfansymiau",
    done: "Wedi gorffen",
    showActions: "Dangos gweithredoedd, allforio a chopiau wrth gefn v",
    hideActions: "Cuddio gweithredoedd ^",
    collapseTop: "Cwympo'r panel uchaf",
    expandTop: "Ehangu'r panel uchaf",
    meetingsToday: "Cyfarfodydd Heddiw",
    noMeetingsToday: "Dim cyfarfodydd wedi'u cofnodi heddiw.",
    kpis: "KPIs",
    dynamicTasks: "Tasgau Dynamig",
    meetingNotes: "Nodiadau",
    notesTab: "Nodiadau",
    levelUps: "Level Ups",
    addLevelUp: "Ychwanegu level up",
    addLevelUpToNote: "Ychwanegu leveling up",
    levelUpsWaiting: "Level ups yn aros i gael eu cadw",
    onlineForm: "Ffurflen Ar-lein",
    careerSite: "Dolen i Safle Gyrfaoedd",
    live: "LIVE",
    goToNote: "Mynd i'r Nodyn",
    quickAdd: "Ychwanegu'n gyflym",
    addMeeting: "Ychwanegu cyfarfod",
    addOpportunity: "Ychwanegu cyfle",
    addCall: "Ychwanegu galwad",
    addTask: "Ychwanegu tasg",
    school: "Ysgol / MAT / ALl",
    client: "Ysgol / MAT / ALl",
    jobTitle: "Teitl swydd",
    opportunityType: "Math o gyfle",
    enhancement: "Enhancement",
    newBusiness: "New Business",
    notes: "Nodiadau",
    task: "Tasg",
    taskType: "Math o dasg",
    dueDate: "Dyddiad cau",
    dueTime: "Amser cau",
    urgent: "Brys",
    teamsInviteSent: "Gwahoddiad Teams wedi'i anfon",
    teamsSent: "Teams wedi'i anfon",
    teamsNotSent: "Teams heb ei anfon",
    opportunities: "Cyfleoedd",
    meetings: "Cyfarfodydd",
    calls: "Galwadau",
    liveTasks: "Tasgau Byw",
    closedTasks: "Tasgau Wedi Cau",
    noLiveTasks: "Dim tasgau byw eto.",
    noClosedTasks: "Dim tasgau wedi cau eto.",
    addNote: "Ychwanegu Nodyn Cyfarfod / Galwad",
    noteHelp: "Ysgrifennwch nodiadau, crewch dasgau neu gyfarfodydd dilynol, yna cadwch unwaith.",
    createTask: "+ Creu tasg",
    hideTask: "Cuddio creu tasg",
    createFollowUp: "+ Creu cyfarfod dilynol",
    hideFollowUp: "Cuddio creu cyfarfod dilynol",
    addTaskToNote: "Ychwanegu tasg at y nodyn hwn",
    addFollowUpToNote: "Ychwanegu cyfarfod dilynol at y nodyn hwn",
    tasksWaiting: "Tasgau yn aros i gael eu cadw",
    followUpsWaiting: "Cyfarfodydd dilynol yn aros i gael eu cadw",
    saveNote: "Cadw nodyn",
    saveMeeting: "Cadw cyfarfod",
    saveCall: "Cadw galwad",
    meetingNote: "Nodyn cyfarfod",
    callNote: "Nodyn galwad",
    notesList: "Rhestr Nodiadau",
    taskFromNote: "Tasg o nodyn",
    followUpFromNote: "Cyfarfod dilynol o nodyn",
    toAction: "I'w weithredu",
    emailSent: "E-bost wedi'i anfon",
    replied: "Wedi ateb",
    yes: "Ie",
    no: "Na",
    pending: "Yn aros",
    won: "Wedi ennill",
    required: "Cwblhewch bob maes gofynnol cyn cyflwyno.",
    requiredTask: "Cwblhewch bob maes tasg gofynnol cyn ei ychwanegu at y nodyn hwn.",
    savedLocal: "Wedi cadw'n lleol ar y ddyfais hon.",
    importWarning: "Bydd mewnforio yn disodli data presennol y traciwr. Parhau?",
    resetWarning: "Ailosod yr holl ddata?",
    popBlocked: "Rhwystrwyd y ffenestr. Caniatewch pop-ups i argraffu.",
    meetingReminder: "Atgoffa cyfarfod",
    meetingDue: "Cyfarfod o fewn 15 munud",
    dismiss: "Cau",
  },
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function dateValue(d) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
}

function parseDay(v) {
  return new Date((v || todayValue()) + "T12:00:00");
}

function fmtDate(v) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "2-digit" }).format(parseDay(v));
}

function fmtLong(v) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(parseDay(v));
}

function fmtStamp(v) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v));
}

function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeek(d) {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 6);
  x.setHours(23, 59, 59, 999);
  return x;
}

function weekNo(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - yearStart) / 86400000 + 1) / 7);
}

function getPeriod(view, selectedDate) {
  const d = parseDay(selectedDate);
  if (view === "month") {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(d);
    return { start, end, label, file: "KPIs " + label };
  }
  if (view === "ytd") {
    const start = new Date(d.getFullYear(), 0, 1);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "YTD to " + fmtDate(selectedDate), file: "KPIs YTD " + fmtDate(selectedDate) };
  }
  const start = startOfWeek(d);
  const end = endOfWeek(d);
  const label = "Week " + weekNo(d) + " - " + fmtDate(dateValue(start)) + " - " + fmtDate(dateValue(end));
  return { start, end, label, file: "KPIs Week " + weekNo(d) };
}

function inPeriod(date, period) {
  const d = parseDay(date);
  return d >= period.start && d <= period.end;
}

function sortMeetings(items) {
  return [...items].sort((a, b) => ((b.date || "") + "T" + (b.time || "00:00")).localeCompare((a.date || "") + "T" + (a.time || "00:00")));
}

function sortTodayMeetings(items) {
  return [...items].sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));
}

function sortNotes(items) {
  return [...items].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function sortTasks(items) {
  const weight = { Renewal: 5, Opportunity: 4, "Customer Follow-up": 3, Support: 2, Admin: 1, General: 0 };
  return [...items].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pa = { urgent: 4, high: 3, normal: 2, low: 1 }[taskPriority(a)] || 2;
    const pb = { urgent: 4, high: 3, normal: 2, low: 1 }[taskPriority(b)] || 2;
    if (pa !== pb) return pb - pa;
    const ad = (a.dueDate || "9999-12-31") + " " + (a.dueTime || "23:59");
    const bd = (b.dueDate || "9999-12-31") + " " + (b.dueTime || "23:59");
    if (ad !== bd) return ad.localeCompare(bd);
    return (weight[b.type] || 0) - (weight[a.type] || 0);
  });
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}

function taskSummaryMessage(live, closed, tx) {
  const line = (task, index, completed) => {
    const due = [task.dueDate ? fmtDate(task.dueDate) : "", task.dueTime].filter(Boolean).join(", ");
    return [
      `${index + 1}. ${task.title || tx.task}${task.school ? " - " + task.school : ""}`,
      task.type ? `   Type: ${task.type}` : "",
      due ? `   Due: ${due}` : "",
      task.priority ? `   Priority: ${priorityLabel(task.priority, tx)}` : "",
      completed ? `   ${tx.completedClosed}` : "",
    ].filter(Boolean).join("\n");
  };
  const outstanding = live.length ? live.map((task, index) => line(task, index, false)).join("\n\n") : tx.noOutstandingTasks;
  const completed = closed.length ? closed.map((task, index) => line(task, index, true)).join("\n\n") : tx.noCompletedTasks;
  return `${tx.taskUpdateTitle} - ${fmtLong(todayValue())}\n\n${tx.outstandingTasks}\n${outstanding}\n\n${tx.completedTasks}\n${completed}`;
}

function priorityLabel(value, tx) {
  const labels = { low: tx.lowPriority, normal: tx.normalPriority, high: tx.highPriority, urgent: tx.urgentPriority };
  return labels[value] || labels.normal;
}

function taskPriority(task) {
  return task.priority || (task.urgent ? "urgent" : "normal");
}

function taskTitleFromForm(form, tx) {
  return form.type === tx.otherTask ? form.otherTitle.trim() : form.type;
}

function taskCardClass(task) {
  const priority = taskPriority(task);
  if (priority === "urgent") return "task-card task-urgent";
  if (priority === "high") return "task-card task-high";
  if (priority === "low") return "task-card task-low";
  return "task-card task-normal";
}

function statusClass(value) {
  const v = String(value || "").toLowerCase();
  if (["live", "won", "yes", "email sent", "meeting booked"].includes(v)) return "status-pill status-live";
  if (["pending", "to action", "no", "voicemail", "no answer"].includes(v)) return "status-pill status-pending";
  return "status-pill status-neutral";
}

function toggleLiveStatus(value) {
  return value === "LIVE" ? "Pending" : "LIVE";
}

function opportunityTypeLabel(opp) {
  return opp.opportunityType || opp.jobTitle || "";
}

function Fa({ icon, className = "" }) {
  return <FontAwesomeIcon icon={icon} className={className} aria-hidden="true" />;
}

function greetingFor(language, name) {
  const hour = new Date().getHours();
  const greeting = language === "cy"
    ? hour < 12 ? "Bore da" : "Prynhawn da"
    : hour < 12 ? "Good morning" : "Good afternoon";
  return `${greeting}, ${name || "Dylan"}`;
}

function cleanName(v) {
  return String(v).replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
}

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function makeReport(data, tx) {
  const table = (title, headers, rows) => {
    const head = headers.map((h) => "<th>" + esc(h) + "</th>").join("");
    const body = rows.length ? rows.map((r) => "<tr>" + r.map((c) => "<td>" + esc(c) + "</td>").join("") + "</tr>").join("") : "<tr><td colspan='" + headers.length + "'>No records</td></tr>";
    return "<h2>" + esc(title) + "</h2><table><thead><tr>" + head + "</tr></thead><tbody>" + body + "</tbody></table>";
  };
  const summary = KPI_FIELDS.map(([key, label]) => [label, data.totals[key] || 0]);
  const meetings = data.meetings.map((m) => [m.date, m.time, m.school, m.type, m.teamsInviteSent ? tx.teamsSent : tx.teamsNotSent]);
  const opps = data.opportunities.map((o) => [o.date, o.school, opportunityTypeLabel(o), o.status, o.reply, o.success]);
  const calls = data.calls.map((c) => [c.date, c.school, c.reason, c.outcome, c.notes || ""]);
  const notes = data.notes.map((n) => [fmtStamp(n.createdAt), n.school, n.notes]);
  const levelUps = asArray(data.levelUps).map((item) => [String(item.createdAt || "").slice(0, 10), item.school, item.onlineForm, item.careerSite]);
  return "<!doctype html><html><head><meta charset='utf-8'><style>body{font-family:Arial;margin:28px;color:#221126}table{border-collapse:collapse;width:100%;margin-bottom:18px}th,td{border:1px solid #ddd;padding:8px;font-size:12px;vertical-align:top;white-space:pre-wrap}th{background:#f7f2fa}h1,h2{color:#25002f}</style></head><body><h1>KPI Report - " + esc(data.period.label) + "</h1>" + table("Summary", ["KPI", "Total"], summary) + table(tx.meetings, ["Date", "Time", "School", "Type", "Teams"], meetings) + table(tx.opportunities, ["Date", "School", "Opportunity type", "Status", "Reply", "Success"], opps) + table(tx.calls, ["Date", "School", "Reason", "Outcome", "Notes"], calls) + table(tx.levelUps, ["Date", "School", "Online Form", "Career Site"], levelUps) + table(tx.meetingNotes, ["Timestamp", "Client", "Notes"], notes) + "</body></html>";
}

function blankTotals() {
  return Object.fromEntries(KPI_FIELDS.map(([key]) => [key, 0]));
}

function loadStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asChoice(value, choices, fallback) {
  return choices.includes(value) ? value : fallback;
}

function slug(v) {
  return String(v || "option").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "option";
}

function normalizeOption(option, fallback, setKey, index) {
  const source = typeof option === "string" ? { label: option } : option && typeof option === "object" ? option : {};
  const defaultOption = fallback || {};
  const label = String(source.label || defaultOption.label || "").trim();
  if (!label) return null;
  return {
    ...defaultOption,
    ...source,
    id: String(source.id || defaultOption.id || `${setKey}-${slug(label)}-${index}`),
    label,
  };
}

function cleanOptionSets(value) {
  const saved = value && typeof value === "object" ? value : {};
  return Object.fromEntries(Object.entries(DEFAULT_OPTION_SETS).map(([key, defaults]) => {
    const hasSavedSet = Object.prototype.hasOwnProperty.call(saved, key);
    const raw = hasSavedSet && Array.isArray(saved[key]) ? saved[key] : defaults;
    const cleaned = raw.map((option, index) => normalizeOption(option, defaults[index], key, index)).filter(Boolean);
    return [key, hasSavedSet ? cleaned : defaults];
  }));
}

function labelsFor(optionSets, key) {
  return (optionSets[key] || []).map((option) => option.label);
}

function firstOptionLabel(optionSets, key) {
  return labelsFor(optionSets, key)[0] || "";
}

function findOption(optionSets, key, label) {
  return (optionSets[key] || []).find((option) => option.label === label);
}

function cycleLabel(optionSets, key, current) {
  const labels = labelsFor(optionSets, key);
  if (!labels.length) return current;
  const index = labels.indexOf(current);
  return labels[(index + 1) % labels.length];
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function cleanTheme(value) {
  const theme = value && typeof value === "object" ? value : {};
  const customFonts = asArray(theme.customFonts)
    .map((font) => String(font || "").trim())
    .filter(Boolean)
    .slice(0, 20);
  const fontValues = [...FONT_OPTIONS.map((option) => option.value), ...customFonts];
  return {
    ...DEFAULT_THEME,
    bodyFont: asChoice(theme.bodyFont, fontValues, DEFAULT_THEME.bodyFont),
    headerFont: asChoice(theme.headerFont, fontValues, DEFAULT_THEME.headerFont),
    bodyWeight: clampNumber(theme.bodyWeight, 100, 900, DEFAULT_THEME.bodyWeight),
    headerWeight: clampNumber(theme.headerWeight, 100, 900, DEFAULT_THEME.headerWeight),
    subheadingWeight: clampNumber(theme.subheadingWeight, 100, 900, DEFAULT_THEME.subheadingWeight),
    bodySize: clampNumber(theme.bodySize, 14, 20, DEFAULT_THEME.bodySize),
    subheadingSize: clampNumber(theme.subheadingSize, 10, 18, DEFAULT_THEME.subheadingSize),
    headerScale: clampNumber(theme.headerScale, 0.85, 1.25, DEFAULT_THEME.headerScale),
    panelRadius: clampNumber(theme.panelRadius, 4, 36, DEFAULT_THEME.panelRadius),
    controlRadius: clampNumber(theme.controlRadius, 4, 28, DEFAULT_THEME.controlRadius),
    customFonts,
    newFontName: "",
  };
}

function themeStyle(theme) {
  return {
    "--brand-font": theme.bodyFont,
    "--brand-heading": theme.headerFont,
    "--brand-body-weight": theme.bodyWeight,
    "--brand-heading-weight": theme.headerWeight,
    "--brand-subheading-weight": theme.subheadingWeight,
    "--brand-body-size": theme.bodySize + "px",
    "--brand-subheading-size": theme.subheadingSize + "px",
    "--brand-heading-scale": theme.headerScale,
    "--brand-radius-panel": theme.panelRadius + "px",
    "--brand-radius-control": theme.controlRadius + "px",
  };
}

function formatSaveTime(value = new Date()) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}

export default function OfflineKpiTracker() {
  const today = todayValue();
  const [initialData] = useState(loadStoredData);
  const [language, setLanguage] = useState(asChoice(initialData.language, ["en", "cy"], "en"));
  const tx = copy[language];
  const [profileName, setProfileName] = useState(String(initialData.profileName || "Dylan"));
  const [selectedDate, setSelectedDate] = useState(initialData.selectedDate || today);
  const [view, setView] = useState(asChoice(initialData.view, ["week", "month", "ytd"], "week"));
  const [tab, setTab] = useState(asChoice(initialData.tab, ["kpis", "opportunities", "tasks", "notes", "levelUps"], "kpis"));
  const [actionsOpen, setActionsOpen] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [editTotals, setEditTotals] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => cleanTheme(initialData.theme));
  const [optionSets, setOptionSets] = useState(() => cleanOptionSets(initialData.optionSets));
  const [lastSaved, setLastSaved] = useState(initialData.savedAt ? formatSaveTime(initialData.savedAt) : "");
  const [meetings, setMeetings] = useState(asArray(initialData.meetings));
  const [opportunities, setOpportunities] = useState(asArray(initialData.opportunities));
  const [calls, setCalls] = useState(asArray(initialData.calls));
  const [levelUps, setLevelUps] = useState(asArray(initialData.levelUps));
  const [adjustments, setAdjustments] = useState(asArray(initialData.adjustments));
  const [tasks, setTasks] = useState(asArray(initialData.tasks));
  const [notes, setNotes] = useState(asArray(initialData.notes));
  const [dismissed, setDismissed] = useState({});

  const [meetingForm, setMeetingForm] = useState({ school: "", type: firstOptionLabel(optionSets, "meetingTypes"), date: today, time: "", teamsInviteSent: false });
  const [oppForm, setOppForm] = useState({ school: "", opportunityType: firstOptionLabel(optionSets, "opportunityTypes") });
  const [callForm, setCallForm] = useState({ school: "", reason: firstOptionLabel(optionSets, "callReasons"), outcome: firstOptionLabel(optionSets, "callOutcomes"), notes: "" });
  const [levelUpForm, setLevelUpForm] = useState({ school: "" });
  const [taskForm, setTaskForm] = useState({ school: "", type: firstOptionLabel(optionSets, "taskTypes"), otherTitle: "", dueDate: today, dueTime: "", priority: "normal", urgent: false });
  const [noteForm, setNoteForm] = useState({ school: "", notes: "" });

  const period = useMemo(() => getPeriod(view, selectedDate), [view, selectedDate]);
  const periodMeetings = useMemo(() => sortMeetings(meetings.filter((m) => inPeriod(m.date, period))), [meetings, period]);
  const periodBookedMeetings = useMemo(() => meetings.filter((m) => inPeriod(String(m.createdAt || m.date || "").slice(0, 10), period)), [meetings, period]);
  const todayMeetings = useMemo(() => sortTodayMeetings(meetings.filter((m) => m.date === today)), [meetings, today]);
  const periodOpps = useMemo(() => opportunities.filter((o) => inPeriod(o.date, period)), [opportunities, period]);
  const periodCalls = useMemo(() => calls.filter((c) => inPeriod(c.date, period)), [calls, period]);
  const periodLevelUps = useMemo(() => levelUps.filter((item) => inPeriod(String(item.createdAt || "").slice(0, 10), period)), [levelUps, period]);
  const periodNotes = useMemo(() => sortNotes(notes.filter((n) => inPeriod(String(n.createdAt || "").slice(0, 10), period))), [notes, period]);
  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks]);
  const liveTasks = sortedTasks.filter((task) => !task.completed);
  const closedTasks = sortedTasks.filter((task) => task.completed);

  const totals = useMemo(() => {
    const total = blankTotals();
    adjustments.filter((a) => inPeriod(a.date, period)).forEach((a) => { total[a.key] = Math.max(0, (total[a.key] || 0) + Number(a.amount || 0)); });
    total.calls += periodCalls.length;
    total.productiveCalls += periodCalls.filter((c) => {
      const outcome = findOption(optionSets, "callOutcomes", c.outcome);
      return outcome ? Boolean(outcome.productive) : PRODUCTIVE_OUTCOMES.includes(c.outcome);
    }).length;
    total.oppsIdentified += periodOpps.length;
    total.oppsInitiated += periodOpps.filter((o) => o.status === (labelsFor(optionSets, "opportunityStatuses")[1] || "Email Sent")).length;
    total.oppsWon += periodOpps.filter((o) => o.success === (labelsFor(optionSets, "opportunitySuccesses")[1] || "Won")).length;
    total.meetingsBooked += periodBookedMeetings.length;
    return total;
  }, [adjustments, optionSets, period, periodBookedMeetings, periodCalls, periodOpps]);

  const meetingAlerts = useMemo(() => {
    const now = new Date();
    return meetings.filter((m) => {
      if (!m.date || !m.time || dismissed[m.id]) return false;
      const target = new Date(m.date + "T" + m.time + ":00");
      const mins = (target.getTime() - now.getTime()) / 60000;
      return mins <= 15 && mins >= -5;
    });
  }, [meetings, dismissed]);

  const currentData = () => ({ version: 1, language, profileName, selectedDate, view, tab, theme, optionSets, meetings, opportunities, calls, levelUps, adjustments, tasks, notes, savedAt: new Date().toISOString() });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, language, profileName, selectedDate, view, tab, theme, optionSets, meetings, opportunities, calls, levelUps, adjustments, tasks, notes, savedAt: new Date().toISOString() }));
    } catch {
      return;
    }
  }, [language, profileName, selectedDate, view, tab, theme, optionSets, meetings, opportunities, calls, levelUps, adjustments, tasks, notes]);

  const required = (values) => {
    if (values.some((value) => !String(value || "").trim())) {
      alert(tx.required);
      return false;
    }
    return true;
  };

  const addMeeting = () => {
    if (!required([meetingForm.school, meetingForm.type, meetingForm.date, meetingForm.time])) return;
    setMeetings((current) => [{ ...meetingForm, id: uid(), school: meetingForm.school.trim(), source: "Manual", createdAt: new Date().toISOString() }, ...current]);
    setMeetingForm({ school: "", type: firstOptionLabel(optionSets, "meetingTypes"), date: today, time: "", teamsInviteSent: false });
  };

  const addOpportunity = () => {
    if (!required([oppForm.school, oppForm.opportunityType])) return;
    setOpportunities((current) => [{ id: uid(), school: oppForm.school.trim(), opportunityType: oppForm.opportunityType, jobTitle: oppForm.opportunityType, status: firstOptionLabel(optionSets, "opportunityStatuses"), reply: firstOptionLabel(optionSets, "opportunityReplies"), success: firstOptionLabel(optionSets, "opportunitySuccesses"), date: selectedDate, createdAt: new Date().toISOString() }, ...current]);
    setOppForm({ school: "", opportunityType: firstOptionLabel(optionSets, "opportunityTypes") });
  };

  const addCall = () => {
    if (!required([callForm.school, callForm.reason, callForm.outcome])) return;
    const call = { id: uid(), school: callForm.school.trim(), reason: callForm.reason, outcome: callForm.outcome, notes: callForm.notes.trim(), date: selectedDate, createdAt: new Date().toISOString() };
    setCalls((current) => [call, ...current]);
    const outcome = findOption(optionSets, "callOutcomes", call.outcome);
    if (outcome ? outcome.createsMeeting : call.outcome === "Meeting Booked") {
      setMeetings((current) => [{ id: uid(), school: call.school, type: firstOptionLabel(optionSets, "meetingTypes"), date: selectedDate, time: "", teamsInviteSent: false, source: "Phone call", createdAt: new Date().toISOString() }, ...current]);
    }
    setCallForm({ school: "", reason: firstOptionLabel(optionSets, "callReasons"), outcome: firstOptionLabel(optionSets, "callOutcomes"), notes: "" });
  };

  const addLevelUp = () => {
    if (!required([levelUpForm.school])) return;
    setLevelUps((current) => [{ id: uid(), school: levelUpForm.school.trim(), onlineForm: "Pending", careerSite: "Pending", createdAt: new Date().toISOString() }, ...current]);
    setLevelUpForm({ school: "" });
  };

  const addTask = () => {
    const title = taskTitleFromForm(taskForm, tx);
    if (!required([taskForm.school, taskForm.type, title, taskForm.dueDate, taskForm.dueTime])) return;
    setTasks((current) => [{ id: uid(), title, school: taskForm.school.trim(), type: taskForm.type, dueDate: taskForm.dueDate, dueTime: taskForm.dueTime, priority: taskForm.priority || "normal", urgent: taskForm.priority === "urgent", completed: false, createdAt: new Date().toISOString() }, ...current]);
    setTaskForm({ school: "", type: firstOptionLabel(optionSets, "taskTypes"), otherTitle: "", dueDate: today, dueTime: "", priority: "normal", urgent: false });
  };

  const addNote = (kind, draftTasks, draftMeetings, draftLevelUps) => {
    if (!required([noteForm.school, noteForm.notes])) return false;
    const noteId = uid();
    const stamp = new Date().toISOString();
    const client = noteForm.school.trim();
    const newTasks = draftTasks.map((task) => ({ ...task, id: uid(), school: client, completed: false, source: tx.taskFromNote, linkedNoteId: noteId, createdAt: stamp }));
    const newMeetings = draftMeetings.map((meeting) => ({ ...meeting, id: uid(), school: client, source: tx.followUpFromNote, linkedNoteId: noteId, createdAt: stamp }));
    const noteTypeRecord = kind === "call"
      ? { id: uid(), school: client, reason: tx.callNote, outcome: "Note", notes: noteForm.notes.trim(), date: selectedDate, source: tx.callNote, linkedNoteId: noteId, createdAt: stamp }
      : { id: uid(), school: client, type: tx.meetingNote, date: selectedDate, time: "", teamsInviteSent: false, source: tx.meetingNote, linkedNoteId: noteId, createdAt: stamp };
    const newLevelUps = draftLevelUps.map((item) => ({ ...item, id: uid(), school: client, linkedNoteId: noteId, createdAt: stamp }));
    const noteTasks = newTasks.map((task) => ({ id: task.id, title: task.title, school: task.school, type: task.type, dueDate: task.dueDate, dueTime: task.dueTime, priority: task.priority || (task.urgent ? "urgent" : "normal"), urgent: task.urgent }));
    const noteMeetings = newMeetings.map((meeting) => ({ id: meeting.id, type: meeting.type, date: meeting.date, time: meeting.time, teamsInviteSent: meeting.teamsInviteSent }));
    const noteLevelUps = newLevelUps.map((item) => ({ id: item.id, school: item.school, onlineForm: item.onlineForm, careerSite: item.careerSite }));
    const note = { id: noteId, kind, school: client, notes: noteForm.notes.trim(), tasks: noteTasks, followUps: noteMeetings, levelUps: noteLevelUps, linkedTaskCount: noteTasks.length, linkedMeetingCount: noteMeetings.length, linkedLevelUpCount: noteLevelUps.length, createdAt: stamp };
    setNotes((current) => [note, ...current]);
    if (newTasks.length) setTasks((current) => [...newTasks, ...current]);
    if (kind === "call") setCalls((current) => [noteTypeRecord, ...current]);
    if (kind !== "call" || newMeetings.length) setMeetings((current) => [...(kind === "call" ? [] : [noteTypeRecord]), ...newMeetings, ...current]);
    if (newLevelUps.length) setLevelUps((current) => [...newLevelUps, ...current]);
    setNoteForm({ school: "", notes: "" });
    if (newTasks.length) setTab("tasks");
    return true;
  };

  const toggleLevelUp = (id, field) => {
    setLevelUps((current) => current.map((item) => item.id === id ? { ...item, [field]: toggleLiveStatus(item[field]) } : item));
  };

  const updateOpp = (id, field) => {
    setOpportunities((current) => current.map((opp) => {
      if (opp.id !== id) return opp;
      if (field === "status") return { ...opp, status: cycleLabel(optionSets, "opportunityStatuses", opp.status) };
      if (field === "reply") return { ...opp, reply: cycleLabel(optionSets, "opportunityReplies", opp.reply) };
      if (field === "success") return { ...opp, success: cycleLabel(optionSets, "opportunitySuccesses", opp.success) };
      return opp;
    }));
  };

  const setTotal = (key, value) => {
    const target = Math.max(0, Number(value || 0));
    const diff = target - (totals[key] || 0);
    if (diff) setAdjustments((current) => [{ id: uid(), key, amount: diff, date: selectedDate, note: "Manual correction" }, ...current]);
  };

  const jump = (amount) => {
    const d = parseDay(selectedDate);
    if (view === "week") d.setDate(d.getDate() + amount * 7);
    if (view === "month") d.setMonth(d.getMonth() + amount);
    if (view === "ytd") d.setFullYear(d.getFullYear() + amount);
    setSelectedDate(dateValue(d));
  };

  const saveNow = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData()));
    setLastSaved(formatSaveTime());
    alert(tx.savedLocal || "Saved locally on this device.");
  };

  const saveAs = () => {
    const name = prompt(tx.saveAs, period.file);
    if (!name) return;
    download(cleanName(name) + ".json", JSON.stringify(currentData(), null, 2), "application/json;charset=utf-8");
  };

  const importBackup = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!confirm(tx.importWarning)) { event.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const saved = JSON.parse(String(reader.result));
        setLanguage(saved.language || "en");
        setProfileName(String(saved.profileName || "Dylan"));
        setSelectedDate(saved.selectedDate || today);
        setView(saved.view || "week");
        setTab(saved.tab || "kpis");
        setTheme(cleanTheme(saved.theme));
        setOptionSets(cleanOptionSets(saved.optionSets));
        setMeetings(asArray(saved.meetings));
        setOpportunities(asArray(saved.opportunities));
        setCalls(asArray(saved.calls));
        setLevelUps(asArray(saved.levelUps));
        setAdjustments(asArray(saved.adjustments));
        setTasks(asArray(saved.tasks));
        setNotes(asArray(saved.notes));
        setLastSaved(saved.savedAt ? formatSaveTime(saved.savedAt) : "");
      } catch {
        alert("Could not import that file.");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  const exportReport = () => {
    const html = makeReport({ period, totals, meetings: periodMeetings, opportunities: periodOpps, calls: periodCalls, levelUps: periodLevelUps, notes: periodNotes }, tx);
    download(cleanName(period.file) + ".xls", html, "application/vnd.ms-excel;charset=utf-8");
  };

  const printReport = () => {
    const popup = window.open("", "_blank");
    if (!popup) return alert(tx.popBlocked);
    popup.document.write(makeReport({ period, totals, meetings: periodMeetings, opportunities: periodOpps, calls: periodCalls, levelUps: periodLevelUps, notes: periodNotes }, tx));
    popup.document.close();
    popup.print();
  };

  return (
    <div className="app-shell min-h-screen p-2 sm:p-4" style={themeStyle(theme)}>
      <div className="app-bg fixed inset-0 -z-10" />
      <div className="mx-auto max-w-[1500px]">
        <Header tx={tx} language={language} profileName={profileName} period={period} view={view} setView={setView} selectedDate={selectedDate} setSelectedDate={setSelectedDate} calendarOpen={calendarOpen} setCalendarOpen={setCalendarOpen} actionsOpen={actionsOpen} setActionsOpen={setActionsOpen} headerOpen={headerOpen} setHeaderOpen={setHeaderOpen} editTotals={editTotals} setEditTotals={setEditTotals} jump={jump} saveNow={saveNow} saveAs={saveAs} exportReport={exportReport} printReport={printReport} importBackup={importBackup} backup={() => download(cleanName(period.file) + " backup.json", JSON.stringify(currentData(), null, 2), "application/json;charset=utf-8")} reset={() => { if (confirm(tx.resetWarning)) { setMeetings([]); setOpportunities([]); setCalls([]); setLevelUps([]); setTasks([]); setNotes([]); setAdjustments([]); } }} lastSaved={lastSaved} openSettings={() => setSettingsOpen(true)} />

        {settingsOpen && <Settings tx={tx} language={language} setLanguage={setLanguage} profileName={profileName} setProfileName={setProfileName} theme={theme} setTheme={setTheme} optionSets={optionSets} setOptionSets={setOptionSets} close={() => setSettingsOpen(false)} />}
        {meetingAlerts.length > 0 && <Reminder tx={tx} alerts={meetingAlerts} dismiss={() => setDismissed(Object.fromEntries(meetingAlerts.map((m) => [m.id, true])))} />}
        <MeetingsToday tx={tx} today={today} meetings={todayMeetings} />
        <Tabs tx={tx} tab={tab} setTab={setTab} />

        {tab === "kpis" && <Kpis tx={tx} optionSets={optionSets} editTotals={editTotals} totals={totals} setTotal={setTotal} addAdj={(key) => setAdjustments((current) => [{ id: uid(), key, amount: 1, date: selectedDate, note: "Quick click" }, ...current])} meetingForm={meetingForm} setMeetingForm={setMeetingForm} addMeeting={addMeeting} callForm={callForm} setCallForm={setCallForm} addCall={addCall} meetings={periodMeetings} calls={periodCalls} removeMeeting={(id) => setMeetings((current) => current.filter((m) => m.id !== id))} removeCall={(id) => setCalls((current) => current.filter((c) => c.id !== id))} toggleInvite={(id) => setMeetings((current) => current.map((m) => m.id === id ? { ...m, teamsInviteSent: !m.teamsInviteSent } : m))} />}

        {tab === "opportunities" && <OpportunitiesTab tx={tx} optionSets={optionSets} form={oppForm} setForm={setOppForm} add={addOpportunity} opportunities={periodOpps} remove={(id) => setOpportunities((current) => current.filter((o) => o.id !== id))} updateOpp={updateOpp} />}

        {tab === "tasks" && <Tasks tx={tx} optionSets={optionSets} live={liveTasks} closed={closedTasks} form={taskForm} setForm={setTaskForm} add={addTask} toggle={(id) => setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task))} remove={(id) => setTasks((current) => current.filter((task) => task.id !== id))} notes={notes} openNote={() => setTab("notes")} />}

        {tab === "notes" && <Notes tx={tx} optionSets={optionSets} notes={sortNotes(notes)} tasks={tasks} form={noteForm} setForm={setNoteForm} addNote={addNote} remove={(id) => setNotes((current) => current.filter((note) => note.id !== id))} toggleTask={(id) => setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task))} />}

        {tab === "levelUps" && <LevelUps tx={tx} levelUps={periodLevelUps} form={levelUpForm} setForm={setLevelUpForm} add={addLevelUp} toggle={toggleLevelUp} remove={(id) => setLevelUps((current) => current.filter((item) => item.id !== id))} />}
      </div>
    </div>
  );
}

function Header({ tx, language, profileName, period, view, setView, selectedDate, setSelectedDate, calendarOpen, setCalendarOpen, actionsOpen, setActionsOpen, headerOpen, setHeaderOpen, editTotals, setEditTotals, jump, saveNow, saveAs, exportReport, printReport, importBackup, backup, reset, lastSaved, openSettings }) {
  if (!headerOpen) {
    return <header className="panel shadow-card mb-3 p-2"><div className="flex items-center justify-between gap-2"><button onClick={() => setHeaderOpen(true)} className="btn soft min-w-0 flex-1 truncate text-left"><Fa icon={faChevronDown} /> <span>{greetingFor(language, profileName)}</span></button><button className="btn soft" title={tx.settings} onClick={openSettings}><Fa icon={faGear} /> <span className="hidden sm:inline">{tx.settings}</span></button></div></header>;
  }
  return <header className="panel shadow-card mb-3 p-3"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[10px] font-black uppercase muted">{tx.app}</p><button onClick={() => setCalendarOpen(!calendarOpen)} className="brand truncate text-left text-lg brand-text sm:text-2xl"><Fa icon={faCalendarDays} className="mr-2 text-base" />{period.label}</button></div><div className="flex items-center gap-1"><span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black text-green-700">{lastSaved}</span><button className="btn soft" title={tx.collapseTop} onClick={() => setHeaderOpen(false)}><Fa icon={faChevronUp} /></button><button className="btn soft" title={tx.settings} onClick={openSettings}><Fa icon={faGear} /> <span className="hidden sm:inline">{tx.settings}</span></button></div></div><div className="mt-2 grid grid-cols-[38px_1fr_38px] gap-1"><button className="btn soft" onClick={() => jump(-1)}><Fa icon={faChevronLeft} /></button><div className="grid grid-cols-3 gap-1 rounded-2xl brand-soft p-1">{[["week", tx.week], ["month", tx.month], ["ytd", tx.ytd]].map(([key, label]) => <button key={key} className={"btn " + (view === key ? "primary" : "")} onClick={() => setView(key)}>{label}</button>)}</div><button className="btn soft" onClick={() => jump(1)}><Fa icon={faChevronRight} /></button></div>{calendarOpen && <input className="input mt-2" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />}<button className="btn soft mt-2 w-full" onClick={() => setActionsOpen(!actionsOpen)}><Fa icon={actionsOpen ? faChevronUp : faChevronDown} /> <span>{actionsOpen ? tx.hideActions : tx.showActions}</span></button>{actionsOpen && <div className="mt-2 grid grid-cols-2 gap-1 sm:flex sm:flex-wrap"><button className="btn soft" onClick={() => setEditTotals(!editTotals)}><Fa icon={faPenToSquare} /> <span>{editTotals ? tx.done : tx.editTotals}</span></button><button className="btn primary" onClick={saveNow}><Fa icon={faFloppyDisk} /> <span>{tx.save}</span></button><button className="btn soft" onClick={saveAs}><Fa icon={faFileArrowDown} /> <span>{tx.saveAs}</span></button><button className="btn primary" onClick={exportReport}><Fa icon={faFileExport} /> <span>{tx.exportExcel}</span></button><button className="btn primary" onClick={printReport}><Fa icon={faFilePdf} /> <span>{tx.pdfPrint}</span></button><button className="btn soft" onClick={backup}><Fa icon={faFileArrowDown} /> <span>{tx.backup}</span></button><label className="btn soft text-center"><Fa icon={faFileArrowUp} /> <span>{tx.import}</span><input className="hidden" type="file" accept="application/json" onChange={importBackup} /></label><button className="btn soft text-red-700" onClick={reset}><Fa icon={faRotateLeft} /> <span>{tx.reset}</span></button></div>}</header>;
}
function RangeControl({ label, value, min, max, step = 1, suffix = "", onChange }) {
  return <label className="grid gap-1 text-xs font-black uppercase muted"><span className="flex justify-between"><span>{label}</span><span>{value}{suffix}</span></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
}

function OptionSetEditor({ tx, setKey, options, setOptionSets }) {
  const [newLabel, setNewLabel] = useState("");
  const updateOption = (id, patch) => setOptionSets((current) => ({
    ...current,
    [setKey]: current[setKey].map((option) => option.id === id ? { ...option, ...patch } : option),
  }));
  const deleteOption = (id) => setOptionSets((current) => {
    const next = current[setKey].filter((option) => option.id !== id);
    return { ...current, [setKey]: next };
  });
  const addOption = () => {
    const label = newLabel.trim();
    if (!label) return;
    setOptionSets((current) => ({
      ...current,
      [setKey]: [...current[setKey], { id: `${setKey}-${slug(label)}-${uid()}`, label, productive: false, createsMeeting: false }],
    }));
    setNewLabel("");
  };

  return <section className="rounded-3xl bg-white p-3"><h3 className="brand brand-text">{OPTION_SET_LABELS[setKey]}</h3><div className="mt-2 grid gap-2">{options.map((option) => <div className="rounded-2xl brand-soft p-2" key={option.id}><div className="grid grid-cols-[1fr_auto] gap-2"><input className="input" value={option.label} onChange={(e) => updateOption(option.id, { label: e.target.value })} /><button className="btn soft text-red-700" onClick={() => deleteOption(option.id)}><Fa icon={faTrashCan} /></button></div>{setKey === "callOutcomes" && <div className="mt-2 grid gap-2 text-xs font-black uppercase muted sm:grid-cols-2"><label><input type="checkbox" checked={Boolean(option.productive)} onChange={(e) => updateOption(option.id, { productive: e.target.checked })} /> {tx.productive}</label><label><input type="checkbox" checked={Boolean(option.createsMeeting)} onChange={(e) => updateOption(option.id, { createsMeeting: e.target.checked })} /> {tx.createsMeeting}</label></div>}</div>)}</div><div className="mt-2 grid grid-cols-[1fr_auto] gap-2"><input className="input" placeholder={tx.addOption} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} /><button className="btn primary" onClick={addOption}><Fa icon={faCirclePlus} /></button></div></section>;
}

function Settings({ tx, language, setLanguage, profileName, setProfileName, theme, setTheme, optionSets, setOptionSets, close }) {
  const [fontName, setFontName] = useState("");
  const updateTheme = (patch) => setTheme((current) => cleanTheme({ ...current, ...patch }));
  const customFontOptions = theme.customFonts.map((font) => ({ label: font, value: font }));
  const fontOptions = [...FONT_OPTIONS, ...customFontOptions];
  const addFont = () => {
    const name = fontName.trim();
    if (!name) return;
    const value = name.includes(",") ? name : `${name}, ${DEFAULT_THEME.bodyFont}`;
    updateTheme({ customFonts: [...theme.customFonts, value] });
    setFontName("");
  };

  return <div className="fixed inset-0 z-50 bg-black/50 p-3"><div className="panel ml-auto flex h-full max-w-md flex-col p-4 shadow-2xl"><div className="flex justify-between"><div><p className="text-xs font-black uppercase muted"><Fa icon={faGear} /> {tx.settings}</p><h2 className="brand text-xl brand-text">{tx.language}</h2></div><button className="btn soft" onClick={close}><Fa icon={faXmark} /></button></div><div className="mt-4 grid grid-cols-2 gap-2"><button className={"btn " + (language === "en" ? "primary" : "soft")} onClick={() => setLanguage("en")}>English</button><button className={"btn " + (language === "cy" ? "primary" : "soft")} onClick={() => setLanguage("cy")}>Cymraeg</button></div><label className="mt-3 grid gap-1 text-xs font-black uppercase muted">{tx.profileName}<input className="input normal-case" value={profileName} onChange={(e) => setProfileName(e.target.value)} /></label><div className="mt-5 min-h-0 flex-1 space-y-4 overflow-auto pr-1"><section className="rounded-3xl brand-soft p-3"><div className="mb-3 flex items-center justify-between"><h2 className="brand brand-text">{tx.design}</h2><button className="btn soft bg-white" onClick={() => setTheme(DEFAULT_THEME)}><Fa icon={faRotateLeft} /> <span>{tx.resetDesign}</span></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-black uppercase muted">{tx.bodyFont}<select className="input normal-case" value={theme.bodyFont} onChange={(e) => updateTheme({ bodyFont: e.target.value })}>{fontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}</select></label><label className="grid gap-1 text-xs font-black uppercase muted">{tx.headerFont}<select className="input normal-case" value={theme.headerFont} onChange={(e) => updateTheme({ headerFont: e.target.value })}>{fontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}</select></label></div><div className="mt-3 rounded-3xl bg-white p-3"><label className="grid gap-1 text-xs font-black uppercase muted">{tx.addFont}<span className="normal-case font-medium">{tx.addFontHelp}</span><div className="grid grid-cols-[1fr_auto] gap-2"><input className="input normal-case" placeholder={tx.fontName} value={fontName} onChange={(e) => setFontName(e.target.value)} /><button className="btn primary" onClick={addFont}><Fa icon={faCirclePlus} /></button></div></label></div><div className="mt-4 grid gap-3"><RangeControl label={tx.bodyWeight} value={theme.bodyWeight} min={100} max={900} step={100} onChange={(bodyWeight) => updateTheme({ bodyWeight })} /><RangeControl label={tx.headerWeight} value={theme.headerWeight} min={100} max={900} step={100} onChange={(headerWeight) => updateTheme({ headerWeight })} /><RangeControl label={tx.subheadingWeight} value={theme.subheadingWeight} min={100} max={900} step={100} onChange={(subheadingWeight) => updateTheme({ subheadingWeight })} /><RangeControl label={tx.bodySize} value={theme.bodySize} min={14} max={20} suffix="px" onChange={(bodySize) => updateTheme({ bodySize })} /><RangeControl label={tx.headerSize} value={Math.round(theme.headerScale * 100)} min={85} max={125} suffix="%" onChange={(headerScale) => updateTheme({ headerScale: headerScale / 100 })} /><RangeControl label={tx.subheadingSize} value={theme.subheadingSize} min={10} max={18} suffix="px" onChange={(subheadingSize) => updateTheme({ subheadingSize })} /><RangeControl label={tx.panelRadius} value={theme.panelRadius} min={4} max={36} suffix="px" onChange={(panelRadius) => updateTheme({ panelRadius })} /><RangeControl label={tx.controlRadius} value={theme.controlRadius} min={4} max={28} suffix="px" onChange={(controlRadius) => updateTheme({ controlRadius })} /></div></section><section className="panel shadow-card p-3" style={themeStyle(theme)}><p className="text-[10px] font-black uppercase brand-accent" style={{ fontWeight: theme.subheadingWeight, fontSize: theme.subheadingSize + "px" }}>{tx.design}</p><h2 className="brand brand-text" style={{ fontFamily: theme.headerFont, fontWeight: theme.headerWeight, fontSize: `${26 * theme.headerScale}px` }}>{tx.previewTitle}</h2><p className="mt-2 muted">{tx.previewBody}</p><div className="mt-3 grid grid-cols-2 gap-2"><button className="btn primary">Primary</button><button className="btn soft">Secondary</button></div></section><section className="rounded-3xl brand-soft p-3"><div className="mb-3 flex items-center justify-between gap-2"><div><h2 className="brand brand-text">{tx.dropdownOptions}</h2><p className="text-xs muted">{tx.dropdownHelp}</p></div><button className="btn soft bg-white" onClick={() => setOptionSets(cleanOptionSets(DEFAULT_OPTION_SETS))}><Fa icon={faRotateLeft} /> <span>{tx.resetOptions}</span></button></div><div className="grid gap-3">{Object.entries(optionSets).map(([setKey, options]) => <OptionSetEditor key={setKey} tx={tx} setKey={setKey} options={options} setOptionSets={setOptionSets} />)}</div></section></div></div></div>;
}

function Reminder({ tx, alerts, dismiss }) {
  return <div className="fixed inset-0 z-40 grid place-items-center bg-black/35 p-4"><section className="w-full max-w-md animate-pulse rounded-3xl bg-orange-500 p-4 text-white shadow-2xl"><div className="flex justify-between gap-3"><div><p className="text-xs font-black uppercase"><Fa icon={faBell} /> {tx.meetingReminder}</p><h2 className="brand text-lg">{tx.meetingDue}</h2></div><button className="btn bg-white/20" onClick={dismiss}>{tx.dismiss}</button></div>{alerts.map((m) => <div key={m.id} className="mt-2 rounded-2xl bg-white p-3 brand-text"><b>{m.school}</b><div>{m.type} - {m.time}</div></div>)}</section></div>;
}

function MeetingsToday({ tx, today, meetings }) {
  return <section className="panel shadow-card mb-3 p-3"><div className="flex justify-between gap-3"><div><p className="text-[10px] font-black uppercase brand-accent">{tx.meetingsToday}</p><h2 className="brand brand-text">{fmtLong(today)}</h2></div><span className="count-badge brand-pill">{meetings.length}</span></div><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{meetings.length ? meetings.map((m) => <div key={m.id} className="rounded-2xl brand-soft p-3"><b>{m.time} - {m.school}</b><div className="text-xs muted">{m.type}</div><Pill good={m.teamsInviteSent}>{m.teamsInviteSent ? tx.teamsSent : tx.teamsNotSent}</Pill></div>) : <div className="rounded-2xl brand-soft p-3 text-xs muted">{tx.noMeetingsToday}</div>}</div></section>;
}

function Tabs({ tx, tab, setTab }) {
  const tabs = [
    ["kpis", faChartLine, tx.kpis],
    ["opportunities", faBriefcase, tx.opportunities],
    ["tasks", faListCheck, tx.dynamicTasks],
    ["notes", faNoteSticky, tx.notesTab || tx.meetingNotes],
    ["levelUps", faRocket, tx.levelUps],
  ];
  return <div className="panel shadow-card mb-3 grid grid-cols-5 gap-1 p-1">{tabs.map(([key, icon, label]) => <button key={key} onClick={() => setTab(key)} className={"btn min-w-0 " + (tab === key ? "primary" : "")}><span className="tab-icon"><Fa icon={icon} /></span><span className="tab-label"><Fa icon={icon} /> <span>{label}</span></span></button>)}</div>;
}

function Pill({ children, good, warn }) {
  const cls = good ? "bg-green-100 text-green-800" : warn ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700";
  return <span className={"mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-black " + cls}>{children}</span>;
}

function List({ title, count, children, empty }) {
  return <section className="panel brand-soft p-2"><div className="mb-2 flex justify-between gap-3"><h2 className="brand brand-text">{title}</h2><span className="count-badge bg-white">{count}</span></div><div className="max-h-[640px] space-y-2 overflow-auto">{count ? children : <div className="panel p-3 text-xs muted">{empty || "Nothing here yet."}</div>}</div></section>;
}

function Kpis(props) {
  const tx = props.tx;
  const [openForm, setOpenForm] = useState(null);
  const [listsFirst, setListsFirst] = useState(false);
  const toggle = (name) => setOpenForm(openForm === name ? null : name);
  const actionClass = (name) => "btn w-full text-left " + (openForm === name ? "primary" : "soft");

  const kpiCards = <div className="grid grid-cols-2 gap-2">{KPI_FIELDS.map(([key, label]) => <div key={key} className="panel shadow-card p-3"><div className="text-[10px] font-black uppercase muted">{label}</div>{props.editTotals ? <input className="input mt-2 text-center text-xl font-black" type="number" value={props.totals[key] || 0} onChange={(e) => props.setTotal(key, e.target.value)} /> : <button className="mt-2 w-full rounded-2xl brand-soft p-3 text-left text-3xl font-black brand-text" onClick={() => props.addAdj(key)}>{props.totals[key] || 0}</button>}</div>)}</div>;
  const quickAdd = <div className="panel shadow-card p-3"><h2 className="brand brand-text">{tx.quickAdd}</h2><div className="mt-3 grid gap-2"><button className={actionClass("meeting")} onClick={() => toggle("meeting")}><Fa icon={openForm === "meeting" ? faMinus : faCirclePlus} /> <span>{tx.addMeeting}</span></button>{openForm === "meeting" && <div className="rounded-3xl brand-soft p-3"><input className="input" placeholder={tx.school} value={props.meetingForm.school} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, school: e.target.value })} /><select className="input mt-2" value={props.meetingForm.type} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, type: e.target.value })}>{labelsFor(props.optionSets, "meetingTypes").map((x) => <option key={x}>{x}</option>)}</select><div className="mt-2 grid grid-cols-2 gap-2"><input className="input" type="date" value={props.meetingForm.date} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, date: e.target.value })} /><input className="input" type="time" value={props.meetingForm.time} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, time: e.target.value })} /></div><label className="mt-2 block rounded-2xl bg-white p-2 text-xs font-black"><input type="checkbox" checked={props.meetingForm.teamsInviteSent} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, teamsInviteSent: e.target.checked })} /> {tx.teamsInviteSent}</label><button className="btn primary mt-2" onClick={props.addMeeting}><Fa icon={faCirclePlus} /> <span>{tx.addMeeting}</span></button></div>}<button className={actionClass("call")} onClick={() => toggle("call")}><Fa icon={openForm === "call" ? faMinus : faPhone} /> <span>{tx.addCall}</span></button>{openForm === "call" && <div className="rounded-3xl brand-soft p-3"><input className="input" placeholder={tx.school} value={props.callForm.school} onChange={(e) => props.setCallForm({ ...props.callForm, school: e.target.value })} /><select className="input mt-2" value={props.callForm.reason} onChange={(e) => props.setCallForm({ ...props.callForm, reason: e.target.value })}>{labelsFor(props.optionSets, "callReasons").map((x) => <option key={x}>{x}</option>)}</select><select className="input mt-2" value={props.callForm.outcome} onChange={(e) => props.setCallForm({ ...props.callForm, outcome: e.target.value })}>{labelsFor(props.optionSets, "callOutcomes").map((x) => <option key={x}>{x}</option>)}</select><textarea className="input mt-2 min-h-[90px]" placeholder={tx.notes} value={props.callForm.notes || ""} onChange={(e) => props.setCallForm({ ...props.callForm, notes: e.target.value })} /><button className="btn primary mt-2" onClick={props.addCall}><Fa icon={faPhone} /> <span>{tx.addCall}</span></button></div>}</div></div>;
  const lists = <section className="grid gap-3 lg:grid-cols-2"><List title={tx.meetings} count={props.meetings.length}>{props.meetings.map((m) => <div className="panel p-3" key={m.id}><div className="flex justify-between"><div><b>{m.school}</b><div className="text-xs muted">{fmtDate(m.date)} - {m.time || tx.dueTime} - {m.type}</div></div><button onClick={() => props.removeMeeting(m.id)}><Fa icon={faTrashCan} /></button></div><button onClick={() => props.toggleInvite(m.id)}><Pill good={m.teamsInviteSent} warn={!m.teamsInviteSent}>{m.teamsInviteSent ? tx.teamsSent : tx.teamsNotSent}</Pill></button></div>)}</List><List title={tx.calls} count={props.calls.length}>{props.calls.map((c) => <div className="panel p-3" key={c.id}><div className="flex justify-between gap-2"><div><b>{c.school}</b><div className="text-xs muted">{fmtDate(c.date)} - {c.reason}</div><Pill>{c.outcome}</Pill>{c.notes && <p className="mt-2 whitespace-pre-wrap text-xs muted">{c.notes}</p>}</div><button onClick={() => props.removeCall(c.id)}><Fa icon={faTrashCan} /></button></div></div>)}</List></section>;
  return <main className="grid gap-3 lg:grid-cols-[320px_1fr]"><section className={"space-y-3 " + (listsFirst ? "order-2" : "")}><button className="btn soft w-full" onClick={() => setListsFirst(!listsFirst)}>{listsFirst ? "Quick add first" : "Lists first"}</button>{kpiCards}{quickAdd}</section><section className={listsFirst ? "order-1" : ""}>{lists}</section></main>;
}

function OpportunitiesTab({ tx, optionSets, form, setForm, add, opportunities, remove, updateOpp }) {
  const typeOptions = labelsFor(optionSets, "opportunityTypes");
  return <main className="grid gap-3 lg:grid-cols-[340px_1fr]"><section className="panel shadow-card p-3"><h2 className="brand brand-text">{tx.addOpportunity}</h2><div className="mt-2 grid gap-2"><input className="input" placeholder={tx.school} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /><select className="input" value={form.opportunityType || typeOptions[0] || ""} onChange={(e) => setForm({ ...form, opportunityType: e.target.value })}>{typeOptions.map((x) => <option key={x}>{x}</option>)}</select><button className="btn primary" onClick={add}><Fa icon={faCirclePlus} /> <span>{tx.addOpportunity}</span></button></div></section><List title={tx.opportunities} count={opportunities.length}>{opportunities.map((o) => <div className="panel shadow-card p-3" key={o.id}><div className="flex justify-between gap-2"><div><b>{o.school}</b><div className="text-xs muted">{opportunityTypeLabel(o)}</div></div><button onClick={() => remove(o.id)}><Fa icon={faTrashCan} /></button></div><div className="mt-2 grid gap-2 sm:grid-cols-3"><button className={statusClass(o.status)} onClick={() => updateOpp(o.id, "status")}>{o.status}</button><button className={statusClass(o.reply)} onClick={() => updateOpp(o.id, "reply")}>{tx.replied}: {o.reply}</button><button className={statusClass(o.success)} onClick={() => updateOpp(o.id, "success")}>{o.success}</button></div></div>)}</List></main>;
}

function LevelUps({ tx, levelUps, form, setForm, add, toggle, remove }) {
  return <main className="grid gap-3 lg:grid-cols-[340px_1fr]"><section className="panel shadow-card p-3"><h2 className="brand brand-text">{tx.addLevelUp}</h2><div className="mt-2 grid gap-2"><input className="input" placeholder={tx.school} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /><button className="btn primary" onClick={add}><Fa icon={faRocket} /> <span>{tx.addLevelUp}</span></button></div></section><List title={tx.levelUps} count={levelUps.length}>{levelUps.map((item) => <div className="panel shadow-card p-3" key={item.id}><div className="flex justify-between gap-2"><div><b>{item.school}</b><div className="text-xs muted">{fmtDate(String(item.createdAt || todayValue()).slice(0, 10))}</div></div><button onClick={() => remove(item.id)}><Fa icon={faTrashCan} /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><button className={statusClass(item.onlineForm)} onClick={() => toggle(item.id, "onlineForm")}><span>{tx.onlineForm}</span><b>{item.onlineForm}</b></button><button className={statusClass(item.careerSite)} onClick={() => toggle(item.id, "careerSite")}><span>{tx.careerSite}</span><b>{item.careerSite}</b></button></div></div>)}</List></main>;
}

function Tasks({ tx, optionSets, live, closed, form, setForm, add, toggle, remove, notes, openNote }) {
  const noteMap = Object.fromEntries(notes.map((n) => [n.id, n]));
  const [formFirst, setFormFirst] = useState(false);
  const copyTasks = () => copyToClipboard(taskSummaryMessage(live, closed, tx)).then(() => alert(tx.copiedTasks));
  const taskChoices = [...labelsFor(optionSets, "taskTypes"), tx.otherTask];
  const card = (task) => <div className={taskCardClass(task)} key={task.id}><div className="flex gap-2"><button className={"h-6 w-6 rounded-full border text-xs " + (task.completed ? "bg-green-600 text-white" : "")} onClick={() => toggle(task.id)}><Fa icon={faCheck} /></button><div className="min-w-0 flex-1"><b className={task.completed ? "line-through muted" : ""}>{task.title}</b><div className="text-xs muted">{task.school} - {task.type}</div><Pill warn={taskPriority(task) === "urgent"}>{priorityLabel(taskPriority(task), tx)} - {task.dueDate} - {task.dueTime}</Pill>{task.linkedNoteId && noteMap[task.linkedNoteId] && <div><button className="btn soft mt-2" onClick={() => openNote(task.linkedNoteId)}><Fa icon={faNoteSticky} /> <span>{tx.goToNote}</span></button></div>}</div><button onClick={() => remove(task.id)}><Fa icon={faTrashCan} /></button></div></div>;
  const lists = <section className="space-y-3"><div className="grid grid-cols-2 gap-2"><button className="btn primary" onClick={copyTasks}><Fa icon={faCopy} /> <span>{tx.copyTasks}</span></button><button className="btn soft" onClick={() => setFormFirst(!formFirst)}>{formFirst ? "Tasks first" : "Form first"}</button></div><List title={tx.liveTasks} count={live.length} empty={tx.noLiveTasks}>{live.map(card)}</List><List title={tx.closedTasks} count={closed.length} empty={tx.noClosedTasks}>{closed.map(card)}</List></section>;
  const formPanel = <section className="panel shadow-card p-3"><h2 className="brand brand-text">{tx.addTask}</h2><div className="mt-2 grid gap-2"><input className="input" placeholder={tx.school} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{taskChoices.map((x) => <option key={x}>{x}</option>)}</select>{form.type === tx.otherTask && <input className="input" placeholder={tx.otherTaskName} value={form.otherTitle || ""} onChange={(e) => setForm({ ...form, otherTitle: e.target.value })} />}<div className="grid grid-cols-2 gap-2"><input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /><input className="input" type="time" value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} /></div><div className="grid grid-cols-2 gap-2">{PRIORITIES.map((priority) => <button key={priority.value} className={"priority-choice priority-" + priority.value + (form.priority === priority.value ? " selected" : "")} onClick={() => setForm({ ...form, priority: priority.value })}>{priorityLabel(priority.value, tx)}</button>)}</div><button className="btn primary" onClick={add}><Fa icon={faCirclePlus} /> <span>{tx.addTask}</span></button></div></section>;
  return <main className="grid gap-3 lg:grid-cols-[1fr_320px]">{formFirst ? <>{formPanel}{lists}</> : <>{lists}{formPanel}</>}</main>;
}

function Notes({ tx, optionSets, notes, tasks, form, setForm, addNote, remove, toggleTask }) {
  const taskById = Object.fromEntries(tasks.map((task) => [task.id, task]));
  const [showTask, setShowTask] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [draftTasks, setDraftTasks] = useState([]);
  const [draftMeetings, setDraftMeetings] = useState([]);
  const [draftLevelUps, setDraftLevelUps] = useState([]);
  const [draftTask, setDraftTask] = useState({ type: firstOptionLabel(optionSets, "taskTypes"), otherTitle: "", dueDate: todayValue(), dueTime: "", priority: "normal", urgent: false });
  const [draftMeeting, setDraftMeeting] = useState({ type: firstOptionLabel(optionSets, "meetingTypes"), date: todayValue(), time: "", teamsInviteSent: false });
  const addDraftTask = () => { const title = taskTitleFromForm(draftTask, tx); if (!title || !draftTask.type || !draftTask.dueDate || !draftTask.dueTime) return alert(tx.requiredTask); setDraftTasks((current) => [{ ...draftTask, id: uid(), title, priority: draftTask.priority || "normal", urgent: draftTask.priority === "urgent" }, ...current]); setDraftTask({ type: firstOptionLabel(optionSets, "taskTypes"), otherTitle: "", dueDate: todayValue(), dueTime: "", priority: "normal", urgent: false }); };
  const addDraftMeeting = () => { if (!form.school.trim() || !draftMeeting.type || !draftMeeting.date || !draftMeeting.time) return alert(tx.required); setDraftMeetings((current) => [{ ...draftMeeting, id: uid() }, ...current]); setDraftMeeting({ type: firstOptionLabel(optionSets, "meetingTypes"), date: todayValue(), time: "", teamsInviteSent: false }); };
  const addDraftLevelUp = () => { if (!form.school.trim()) return alert(tx.required); setDraftLevelUps((current) => [{ id: uid(), onlineForm: "Pending", careerSite: "Pending" }, ...current]); };
  const save = (kind) => { if (addNote(kind, draftTasks, draftMeetings, draftLevelUps)) { setDraftTasks([]); setDraftMeetings([]); setDraftLevelUps([]); setShowTask(false); setShowFollowUp(false); setDraftTask({ type: firstOptionLabel(optionSets, "taskTypes"), otherTitle: "", dueDate: todayValue(), dueTime: "", priority: "normal", urgent: false }); setDraftMeeting({ type: firstOptionLabel(optionSets, "meetingTypes"), date: todayValue(), time: "", teamsInviteSent: false }); } };
  return <main className="grid gap-3 lg:grid-cols-[1fr_380px]"><List title={tx.notesList} count={notes.length}>{notes.map((note) => <div className="panel shadow-card p-3" key={note.id}><div className="flex justify-between"><div><b>{note.school}</b><div className="text-[10px] font-black uppercase muted">{note.kind === "call" ? tx.callNote : tx.meetingNote} - {fmtStamp(note.createdAt)}</div></div><button onClick={() => remove(note.id)}><Fa icon={faTrashCan} /></button></div><p className="mt-3 whitespace-pre-wrap text-sm">{note.notes}</p>{note.tasks && note.tasks.length > 0 && <div className="mt-3 rounded-3xl brand-soft p-3"><b className="text-xs uppercase brand-text">{tx.dynamicTasks}</b>{note.tasks.map((task) => { const liveTask = taskById[task.id]; const complete = Boolean(liveTask && liveTask.completed); return <div key={task.id} className="mt-2 rounded-2xl bg-white p-2"><div className="flex gap-2"><button onClick={() => liveTask && toggleTask(task.id)} className={"h-6 w-6 rounded-full border text-xs " + (complete ? "bg-green-600 text-white" : "")}><Fa icon={faCheck} /></button><div><b className={complete ? "line-through muted" : ""}>{task.title}</b><div className="text-xs muted">{task.type} - {task.dueDate} - {task.dueTime}</div></div></div></div>; })}</div>}{note.followUps && note.followUps.length > 0 && <div className="mt-3 rounded-3xl bg-orange-50 p-3"><b className="text-xs uppercase text-orange-700">{tx.meetings}</b>{note.followUps.map((meeting) => <div className="mt-2 rounded-2xl bg-white p-2" key={meeting.id}><b>{meeting.type}</b><div className="text-xs muted">{meeting.date} - {meeting.time} - {meeting.teamsInviteSent ? tx.teamsSent : tx.teamsNotSent}</div></div>)}</div>}{note.levelUps && note.levelUps.length > 0 && <div className="mt-3 rounded-3xl bg-green-50 p-3"><b className="text-xs uppercase text-green-700">{tx.levelUps}</b>{note.levelUps.map((item) => <div className="mt-2 rounded-2xl bg-white p-2" key={item.id}><b>{item.school}</b><div className="text-xs muted">{tx.onlineForm}: {item.onlineForm} - {tx.careerSite}: {item.careerSite}</div></div>)}</div>}</div>)}</List><section className="panel shadow-card p-3"><h2 className="brand brand-text">{tx.addNote}</h2><p className="text-xs muted">{tx.noteHelp}</p><div className="mt-2 grid gap-2"><input className="input" placeholder={tx.client} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /><textarea className="input min-h-[180px]" placeholder={tx.notes} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /><button className="btn soft" onClick={() => setShowTask(!showTask)}>{showTask ? tx.hideTask : tx.createTask}</button>{showTask && <div className="rounded-3xl brand-soft p-3"><select className="input" value={draftTask.type} onChange={(e) => setDraftTask({ ...draftTask, type: e.target.value })}>{[...labelsFor(optionSets, "taskTypes"), tx.otherTask].map((x) => <option key={x}>{x}</option>)}</select>{draftTask.type === tx.otherTask && <input className="input mt-2" placeholder={tx.otherTaskName} value={draftTask.otherTitle || ""} onChange={(e) => setDraftTask({ ...draftTask, otherTitle: e.target.value })} />}<div className="mt-2 grid grid-cols-2 gap-2"><input className="input" type="date" value={draftTask.dueDate} onChange={(e) => setDraftTask({ ...draftTask, dueDate: e.target.value })} /><input className="input" type="time" value={draftTask.dueTime} onChange={(e) => setDraftTask({ ...draftTask, dueTime: e.target.value })} /></div><div className="mt-2 grid grid-cols-2 gap-2">{PRIORITIES.map((priority) => <button key={priority.value} className={"priority-choice priority-" + priority.value + (draftTask.priority === priority.value ? " selected" : "")} onClick={() => setDraftTask({ ...draftTask, priority: priority.value })}>{priorityLabel(priority.value, tx)}</button>)}</div><button className="btn primary mt-2" onClick={addDraftTask}><Fa icon={faListCheck} /> <span>{tx.addTaskToNote}</span></button></div>}{draftTasks.length > 0 && <div className="rounded-3xl bg-blue-50 p-3"><b className="text-xs uppercase text-blue-700">{tx.tasksWaiting}</b>{draftTasks.map((task) => <div className="panel mt-2 p-2" key={task.id}><div className="flex justify-between"><div><b>{task.title}</b><div className="text-xs muted">{task.type} - {task.dueDate} - {task.dueTime}</div></div><button onClick={() => setDraftTasks(draftTasks.filter((x) => x.id !== task.id))}><Fa icon={faTrashCan} /></button></div></div>)}</div>}<button className="btn soft" onClick={() => setShowFollowUp(!showFollowUp)}>{showFollowUp ? tx.hideFollowUp : tx.createFollowUp}</button>{showFollowUp && <div className="rounded-3xl brand-soft p-3"><select className="input" value={draftMeeting.type} onChange={(e) => setDraftMeeting({ ...draftMeeting, type: e.target.value })}>{labelsFor(optionSets, "meetingTypes").map((x) => <option key={x}>{x}</option>)}</select><div className="mt-2 grid grid-cols-2 gap-2"><input className="input" type="date" value={draftMeeting.date} onChange={(e) => setDraftMeeting({ ...draftMeeting, date: e.target.value })} /><input className="input" type="time" value={draftMeeting.time} onChange={(e) => setDraftMeeting({ ...draftMeeting, time: e.target.value })} /></div><label className="mt-2 block rounded-2xl bg-white p-2 text-xs font-black"><input type="checkbox" checked={draftMeeting.teamsInviteSent} onChange={(e) => setDraftMeeting({ ...draftMeeting, teamsInviteSent: e.target.checked })} /> {tx.teamsInviteSent}</label><button className="btn primary mt-2" onClick={addDraftMeeting}><Fa icon={faCalendarDays} /> <span>{tx.addFollowUpToNote}</span></button></div>}{draftMeetings.length > 0 && <div className="rounded-3xl bg-orange-50 p-3"><b className="text-xs uppercase text-orange-700">{tx.followUpsWaiting}</b>{draftMeetings.map((meeting) => <div className="panel mt-2 p-2" key={meeting.id}><div className="flex justify-between"><div><b>{form.school || tx.client}</b><div className="text-xs muted">{meeting.type} - {meeting.date} - {meeting.time}</div></div><button onClick={() => setDraftMeetings(draftMeetings.filter((x) => x.id !== meeting.id))}><Fa icon={faTrashCan} /></button></div></div>)}</div>}<button className="btn soft" onClick={addDraftLevelUp}><Fa icon={faRocket} /> <span>{tx.addLevelUpToNote}</span></button>{draftLevelUps.length > 0 && <div className="rounded-3xl bg-green-50 p-3"><b className="text-xs uppercase text-green-700">{tx.levelUpsWaiting}</b>{draftLevelUps.map((item) => <div className="panel mt-2 p-2" key={item.id}><div className="flex justify-between"><div><b>{form.school || tx.client}</b><div className="text-xs muted">{tx.onlineForm}: {item.onlineForm} - {tx.careerSite}: {item.careerSite}</div></div><button onClick={() => setDraftLevelUps(draftLevelUps.filter((x) => x.id !== item.id))}><Fa icon={faTrashCan} /></button></div></div>)}</div>}<div className="grid grid-cols-2 gap-2"><button className="btn primary" onClick={() => save("meeting")}><Fa icon={faCalendarDays} /> <span>{tx.saveMeeting}</span></button><button className="btn primary" onClick={() => save("call")}><Fa icon={faPhone} /> <span>{tx.saveCall}</span></button></div></div></section></main>;
}
