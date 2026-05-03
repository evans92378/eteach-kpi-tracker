import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from "firebase/auth";
import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, googleProvider, trackerDoc } from "./firebase";
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
  faEnvelope,
  faFileArrowDown,
  faFileArrowUp,
  faFileExport,
  faFilePdf,
  faFloppyDisk,
  faGear,
  faRightFromBracket,
  faRightToBracket,
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
const APP_STATE_VERSION = 2;
const LEGACY_STORAGE_KEYS = [
  STORAGE_KEY,
  "eteach-kpi-tracker-v1",
  "eteach-kpi-tracker-data",
  "eteach-kpi-tracker",
];

const KPI_FIELDS = [
  ["calls", "Calls"],
  ["productiveCalls", "Productive Calls"],
  ["emails", "Emails"],
  ["oppsIdentified", "Opps Identified"],
  ["oppsInitiated", "Opps Initiated"],
  ["oppsWon", "Opps Won"],
  ["meetingsBooked", "Meetings Booked"],
  ["levelUpWins", "Levelling Up Wins"],
  ["newBusiness", "New Business"],
];

const PRODUCTIVE_OUTCOMES = ["Meeting Booked", "Interest in Enhancement", "Unhappy"];
const KPI_TARGETS = {
  productiveCalls: { week: 20 },
  meetingsBooked: { week: 2, month: 8 },
  oppsIdentified: { week: 3, month: 12 },
  oppsWon: { week: 1, month: 4 },
  levelUpWins: { week: 3, month: 12 },
  newBusiness: { month: 1 },
};

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
  bodyWeight: 500,
  headerWeight: 600,
  subheadingWeight: 700,
  bodySize: 15,
  subheadingSize: 12,
  headerScale: 1,
  panelRadius: 14,
  controlRadius: 10,
  customFonts: [],
  newFontName: "",
};

const PRIORITIES = [
  { value: "low", label: "Low", color: "green" },
  { value: "normal", label: "Normal", color: "blue" },
  { value: "high", label: "High", color: "amber" },
  { value: "urgent", label: "Urgent", color: "red" },
];
const OPPORTUNITY_STATUSES = ["pending", "won", "lost"];
const CONTACT_STATUSES = ["No Contact", "Contact Made"];
const EMAIL_STATUSES = ["Not Sent", "Sent", "Replied"];
const CALL_STATUSES = ["Not Called", "No Answer", "Spoke"];
const LOST_REASONS = [
  "No Response",
  "Budget Not Available",
  "Went with Competitor",
  "Timing Not Right",
  "Internal Decision / Pulled Role",
  "Other",
];
const DEFAULT_FOCUS_SCHEDULE = [
  { id: "focus-call-1", start: "09:00", end: "10:30", label: "Call Time" },
  { id: "focus-admin-1", start: "10:30", end: "11:00", label: "Admin / Follow-ups" },
  { id: "focus-call-2", start: "11:00", end: "12:30", label: "Call Time" },
  { id: "focus-lunch", start: "12:30", end: "13:00", label: "Lunch" },
  { id: "focus-jobs", start: "13:00", end: "14:00", label: "Job Checks" },
  { id: "focus-calls-meetings", start: "14:00", end: "15:30", label: "Calls / Meetings" },
  { id: "focus-email", start: "15:30", end: "16:30", label: "Follow-up Emails" },
  { id: "focus-summary", start: "16:30", end: "17:00", label: "Daily Summary" },
];

const copy = {
  en: {
    app: "eTeach Smart Dashboard",
    dashboardTitle: "Smart Dashboard",
    welcomeTitle: "Welcome to Smart Dashboard",
    welcomeBody: "Sign in to open your private dashboard.",
    email: "Email",
    password: "Password",
    firstName: "First name",
    lastName: "Last name",
    signIn: "Sign In",
    createAccount: "Create an account",
    alreadyHaveAccount: "Already have an account?",
    forgotPassword: "Forgot password?",
    resetPassword: "Send password reset",
    passwordResetSent: "Password reset email sent.",
    authLoading: "Checking sign in...",
    accountCreated: "Account created.",
    googleCreateAccount: "Create an account with Google",
    backToSignIn: "Back to sign in",
    day: "Day",
    week: "Week",
    month: "Month",
    ytd: "YTD",
    settings: "Settings",
    language: "Language",
    design: "Design",
    dropdownOptions: "Dropdown options",
    dropdownHelp: "Edit future dropdown choices. Saved historic records keep the wording they already have.",
    addOption: "Add option",
    englishLabel: "English",
    cymraegLabel: "Cymraeg",
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
    save: "Save to cloud",
    saveAs: "Save As",
    copyTasks: "Copy Daily Summary",
    copyDailySummary: "Copy Daily Summary",
    copiedTasks: "Task update copied.",
    additionsOther: "Additions / Other",
    meetingsCompleted: "Meetings Completed",
    meetingDetails: "Meeting Details",
    currentFocus: "Current Focus",
    nextFocus: "Next",
    editSchedule: "Edit schedule",
    addFocusBlock: "Add focus block",
    noFocusNow: "No focus block right now",
    taskUpdateTitle: "eTeach Smart Dashboard Task Update",
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
    editMeeting: "Edit meeting",
    copyEmail: "Copy Email",
    copiedEmail: "Meeting email copied.",
    contactName: "Contact name",
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
    completedTask: "Completed Task",
    editTask: "Edit task",
    updateTask: "Update task",
    followUpEmail: "Follow Up Email",
    createFollowUpEmail: "+ Create a follow-up email",
    addFollowUpEmailToNote: "Add follow-up email to this note",
    notesToSelf: "Notes to Self",
    addNoteToSelf: "Add note to self",
    noNotesToSelf: "No notes to self yet.",
    school: "School / MAT / LA name",
    client: "School / MAT / LA name",
    jobTitle: "Job title",
    opportunityType: "Opportunity type",
    opportunityName: "Opportunity name",
    opportunityValue: "Opportunity value (£)",
    dateCreated: "Date created",
    dateWon: "Date won",
    closedDate: "Closed date",
    endDate: "End date",
    inProgressOpportunities: "In Progress Opportunities",
    wonOpportunities: "Won Opportunities",
    lostOpportunities: "Lost Opportunities",
    contactStatus: "Contact Status",
    emailStatus: "Email Status",
    callStatus: "Call Status",
    lastActivity: "Last Activity",
    suggestedAction: "Suggested Action",
    markAsWon: "Mark as Won",
    markAsLost: "Mark as Lost",
    reopenOpportunity: "Reopen Opportunity",
    lostReason: "Lost reason",
    otherLostReason: "Other lost reason",
    pastDeadline: "Past Deadline",
    endsToday: "Ends today",
    endsInDays: "Ends in",
    days: "days",
    noContact: "No Contact",
    contactMade: "Contact Made",
    notSent: "Not Sent",
    sent: "Sent",
    notCalled: "Not Called",
    noAnswer: "No Answer",
    spoke: "Spoke",
    startOutreach: "Start Outreach",
    chaseContact: "Chase Contact",
    followUp: "Follow Up",
    closingWindow: "Closing Window",
    reviewOpportunity: "Review Opportunity",
    lost: "Lost",
    totalSalesValue: "Total Sales Value",
    totalCommission: "Total Commission",
    enhancement: "Enhancement",
    newBusiness: "New Business",
    notes: "Notes",
    task: "Task",
    taskType: "Task type",
    dueDate: "Due date",
    dueTime: "Due time",
    urgent: "Urgent",
    teamsInviteSent: "Teams invite sent",
    doNotAddToKpis: "Do not add to KPIs",
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
    savedCloud: "Saved to cloud.",
    cloudLoaded: "Cloud save loaded.",
    signInGoogle: "Sign in with Google",
    signOut: "Sign out",
    signedInAs: "Signed in as",
    offlineSaveBlocked: "You must be online to save. Use Backup for an offline copy.",
    signInRequired: "Sign in before saving to cloud.",
    googleSignInFailed: "Google sign-in failed:",
    cloudLoadFailed: "Could not load cloud save. Local offline data is still available.",
    cloudSaveFailed: "Could not save to cloud. Use Backup for an offline copy.",
    offlinePromptTitle: "Connection lost",
    offlinePromptBody: "The app could not save online. Would you like to save these changes offline on this device?",
    saveOffline: "Save Offline",
    offlineChangesPending: "Offline changes pending sync.",
    unsavedChangesWarning: "Changes are on screen but may not be safely saved yet.",
    signInFailed: "Sign in failed:",
    createAccountFailed: "Could not create account:",
    resetPasswordFailed: "Could not send password reset:",
    importWarning: "Importing will replace current tracker data. Continue?",
    resetWarning: "Reset all data?",
    popBlocked: "Pop-up blocked. Allow pop-ups to print.",
    meetingReminder: "Meeting reminder",
    meetingDue: "Meeting due within 15 minutes",
    dismiss: "Dismiss",
    cancel: "Cancel",
  },
  cy: {
    app: "eTeach Smart Dashboard",
    dashboardTitle: "Smart Dashboard",
    welcomeTitle: "Croeso i Smart Dashboard",
    welcomeBody: "Mewngofnodwch i agor eich dangosfwrdd preifat.",
    email: "E-bost",
    password: "Cyfrinair",
    firstName: "Enw cyntaf",
    lastName: "Cyfenw",
    signIn: "Mewngofnodi",
    createAccount: "Creu cyfrif",
    alreadyHaveAccount: "Oes gennych gyfrif yn barod?",
    forgotPassword: "Wedi anghofio cyfrinair?",
    resetPassword: "Anfon ailosod cyfrinair",
    passwordResetSent: "Anfonwyd e-bost ailosod cyfrinair.",
    authLoading: "Gwirio mewngofnodi...",
    accountCreated: "Crëwyd y cyfrif.",
    googleCreateAccount: "Creu cyfrif gyda Google",
    backToSignIn: "Yn ôl i fewngofnodi",
    day: "Diwrnod",
    week: "Wythnos",
    month: "Mis",
    ytd: "Hyd yma eleni",
    settings: "Gosodiadau",
    language: "Iaith",
    design: "Dyluniad",
    dropdownOptions: "Opsiynau cwymplen",
    dropdownHelp: "Golygwch ddewisiadau cwymplen y dyfodol. Mae cofnodion hanesyddol yn cadw eu geiriad presennol.",
    addOption: "Ychwanegu opsiwn",
    englishLabel: "English",
    cymraegLabel: "Cymraeg",
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
    save: "Cadw i'r cwmwl",
    saveAs: "Cadw fel",
    copyTasks: "Copio Crynodeb Dyddiol",
    copyDailySummary: "Copio Crynodeb Dyddiol",
    copiedTasks: "Diweddariad tasgau wedi'i gopio.",
    additionsOther: "Ychwanegiadau / Arall",
    meetingsCompleted: "Cyfarfodydd wedi'u cwblhau",
    meetingDetails: "Manylion Cyfarfod",
    currentFocus: "Ffocws Presennol",
    nextFocus: "Nesaf",
    editSchedule: "Golygu amserlen",
    addFocusBlock: "Ychwanegu bloc ffocws",
    noFocusNow: "Dim bloc ffocws ar hyn o bryd",
    taskUpdateTitle: "Diweddariad Tasgau eTeach Smart Dashboard",
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
    editMeeting: "Golygu cyfarfod",
    copyEmail: "Copio E-bost",
    copiedEmail: "E-bost cyfarfod wedi'i gopïo.",
    contactName: "Enw cyswllt",
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
    completedTask: "Tasg wedi'i chwblhau",
    editTask: "Golygu tasg",
    updateTask: "Diweddaru tasg",
    followUpEmail: "E-bost dilynol",
    createFollowUpEmail: "+ Creu e-bost dilynol",
    addFollowUpEmailToNote: "Ychwanegu e-bost dilynol at y nodyn hwn",
    notesToSelf: "Nodiadau i Fi",
    addNoteToSelf: "Ychwanegu nodyn i fi",
    noNotesToSelf: "Dim nodiadau i fi eto.",
    school: "Ysgol / MAT / ALl",
    client: "Ysgol / MAT / ALl",
    jobTitle: "Teitl swydd",
    opportunityType: "Math o gyfle",
    opportunityName: "Enw'r cyfle",
    opportunityValue: "Gwerth y cyfle (£)",
    dateCreated: "Dyddiad creu",
    dateWon: "Dyddiad ennill",
    closedDate: "Dyddiad cau",
    endDate: "Dyddiad gorffen",
    inProgressOpportunities: "Cyfleoedd ar Waith",
    wonOpportunities: "Cyfleoedd Wedi'u Hennill",
    lostOpportunities: "Cyfleoedd Wedi'u Colli",
    contactStatus: "Statws Cyswllt",
    emailStatus: "Statws E-bost",
    callStatus: "Statws Galwad",
    lastActivity: "Gweithgaredd Diwethaf",
    suggestedAction: "Cam Awgrymedig",
    markAsWon: "Marcio fel Wedi Ennill",
    markAsLost: "Marcio fel Wedi Colli",
    reopenOpportunity: "Ailagor Cyfle",
    lostReason: "Rheswm colli",
    otherLostReason: "Rheswm arall",
    pastDeadline: "Wedi mynd heibio'r dyddiad",
    endsToday: "Yn dod i ben heddiw",
    endsInDays: "Yn dod i ben mewn",
    days: "diwrnod",
    noContact: "Dim Cyswllt",
    contactMade: "Cyswllt Wedi'i Wneud",
    notSent: "Heb Anfon",
    sent: "Anfonwyd",
    notCalled: "Heb Alw",
    noAnswer: "Dim Ateb",
    spoke: "Wedi Siarad",
    startOutreach: "Dechrau Cyswllt",
    chaseContact: "Dilyn Cyswllt",
    followUp: "Dilyn i Fyny",
    closingWindow: "Ffenestr Cau",
    reviewOpportunity: "Adolygu Cyfle",
    lost: "Ar goll",
    totalSalesValue: "Cyfanswm Gwerthiant",
    totalCommission: "Cyfanswm Comisiwn",
    enhancement: "Enhancement",
    newBusiness: "New Business",
    notes: "Nodiadau",
    task: "Tasg",
    taskType: "Math o dasg",
    dueDate: "Dyddiad cau",
    dueTime: "Amser cau",
    urgent: "Brys",
    teamsInviteSent: "Gwahoddiad Teams wedi'i anfon",
    doNotAddToKpis: "Peidio ag ychwanegu at KPIs",
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
    savedCloud: "Wedi cadw i'r cwmwl.",
    cloudLoaded: "Cadw cwmwl wedi'i lwytho.",
    signInGoogle: "Mewngofnodi gyda Google",
    signOut: "Allgofnodi",
    signedInAs: "Wedi mewngofnodi fel",
    offlineSaveBlocked: "Rhaid bod ar-lein i gadw. Defnyddiwch Gopi wrth gefn ar gyfer copi all-lein.",
    signInRequired: "Mewngofnodwch cyn cadw i'r cwmwl.",
    googleSignInFailed: "Methodd mewngofnodi Google:",
    cloudLoadFailed: "Methu llwytho cadw cwmwl. Mae data all-lein lleol dal ar gael.",
    cloudSaveFailed: "Methu cadw i'r cwmwl. Defnyddiwch Gopi wrth gefn ar gyfer copi all-lein.",
    offlinePromptTitle: "Collwyd cysylltiad",
    offlinePromptBody: "Ni allai'r ap gadw ar-lein. Hoffech chi gadw'r newidiadau hyn all-lein ar y ddyfais hon?",
    saveOffline: "Cadw All-lein",
    offlineChangesPending: "Newidiadau all-lein yn aros i gysoni.",
    unsavedChangesWarning: "Mae newidiadau ar y sgrin ond efallai nad ydynt wedi'u cadw'n ddiogel eto.",
    signInFailed: "Methodd mewngofnodi:",
    createAccountFailed: "Methu creu cyfrif:",
    resetPasswordFailed: "Methu anfon ailosod cyfrinair:",
    importWarning: "Bydd mewnforio yn disodli data presennol y traciwr. Parhau?",
    resetWarning: "Ailosod yr holl ddata?",
    popBlocked: "Rhwystrwyd y ffenestr. Caniatewch pop-ups i argraffu.",
    meetingReminder: "Atgoffa cyfarfod",
    meetingDue: "Cyfarfod o fewn 15 munud",
    dismiss: "Cau",
    cancel: "Canslo",
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
  if (view === "day") {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    const label = fmtLong(dateValue(d));
    return { start, end, label, file: "KPIs " + fmtDate(dateValue(d)) };
  }
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

function priorityLabel(value, tx) {
  const labels = { low: tx.lowPriority, normal: tx.normalPriority, high: tx.highPriority, urgent: tx.urgentPriority };
  return labels[value] || labels.normal;
}

function taskPriority(task) {
  return task.priority || (task.urgent ? "urgent" : "normal");
}

function taskPeriodDate(task) {
  return String((task.completed && task.completedAt) || task.dueDate || task.date || task.createdAt || "").slice(0, 10);
}

function taskTitleFromForm(form, tx) {
  return form.type === tx.otherTask ? form.otherTitle.trim() : form.type;
}

function followUpEmailTitle(name) {
  return `Follow Up Email - ${safeText(name, "School")}`;
}

function taskCardClass(task) {
  const priority = taskPriority(task);
  if (priority === "urgent") return "task-card task-urgent";
  if (priority === "high") return "task-card task-medium";
  if (priority === "low") return "task-card task-low";
  return "task-card task-normal";
}

function timeToMinutes(value) {
  const [hour, minute] = String(value || "00:00").split(":").map(Number);
  return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
}

function normalizeFocusBlock(value, index) {
  if (!isRecord(value)) return null;
  return {
    id: withId(value, "focus", index),
    start: safeTime(value.start, "09:00"),
    end: safeTime(value.end, "17:00"),
    label: safeText(value.label, "Focus"),
  };
}

function cleanFocusSchedule(value) {
  const cleaned = cleanCollection(value, normalizeFocusBlock).sort((a, b) => a.start.localeCompare(b.start));
  return cleaned.length ? cleaned : DEFAULT_FOCUS_SCHEDULE;
}

function focusNow(schedule) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const sorted = cleanFocusSchedule(schedule);
  const current = sorted.find((block) => minutes >= timeToMinutes(block.start) && minutes < timeToMinutes(block.end));
  const next = sorted.find((block) => timeToMinutes(block.start) > minutes) || sorted[0];
  return { current, next };
}

function dailySummaryMessage({ tx, totals, salesSummary, meetings, calls, levelUps, additions }) {
  const productiveCalls = totals.productiveCalls || 0;
  const completedMeetings = meetings.filter((meeting) => isCompletedMeeting(meeting)).length;
  const wins = levelUps.filter(isLevelUpWin).map((item) => `- ${item.school}`).join("\n") || "- None";
  const meetingLines = meetings.length ? meetings.map((meeting) => {
    const actions = [
      meeting.teamsInviteSent ? tx.teamsSent : tx.teamsNotSent,
      meeting.doNotAddToKpis ? tx.doNotAddToKpis : "",
    ].filter(Boolean).join(", ");
    return `- ${meeting.school} at ${formatEmailTime(meeting.time)} - Actions: ${actions || "None"}`;
  }).join("\n") : "- None";
  return [
    `Calls: ${totals.calls || 0}`,
    `Productive Calls: ${productiveCalls}`,
    `${tx.meetingsCompleted}: ${completedMeetings}`,
    `Meetings Booked: ${totals.meetingsBooked || 0}`,
    `Opportunities Identified: ${totals.oppsIdentified || 0}`,
    `Opportunities Won: ${totals.oppsWon || 0}`,
    `New Business: ${totals.newBusiness || 0}`,
    "Levelling Up Wins:",
    wins,
    `Total Sales Value: ${formatMoney(salesSummary.totalSalesValue)}`,
    `Total Commission: ${formatMoney(salesSummary.totalCommission)}`,
    `${tx.additionsOther}: ${additions || "None"}`,
    "",
    `${tx.meetingDetails}:`,
    meetingLines,
    "",
    "Saved Calls:",
    calls.length ? calls.map((call) => `- ${call.school}: ${call.reason} / ${call.outcome}${call.notes ? ` - ${call.notes}` : ""}`).join("\n") : "- None",
  ].join("\n");
}

function statusClass(value) {
  const v = String(value || "").toLowerCase();
  if (["live", "won", "yes", "email sent", "meeting booked", "contact made", "sent", "replied", "spoke"].includes(v)) return "status-pill status-live";
  if (["pending", "to action", "no", "voicemail", "no answer", "no contact", "not sent", "not called"].includes(v)) return "status-pill status-pending";
  if (["lost"].includes(v)) return "status-pill status-lost";
  return "status-pill status-neutral";
}

function toggleLiveStatus(value) {
  return value === "LIVE" ? "Pending" : "LIVE";
}

function opportunityTypeLabel(opp) {
  return opp.opportunityType || opp.jobTitle || "";
}

function normalizeOpportunityStatus(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["won", "success", "closed won"].includes(text)) return "won";
  if (["lost", "closed lost"].includes(text)) return "lost";
  return "pending";
}

function opportunityStatusLabel(value, tx) {
  const status = normalizeOpportunityStatus(value);
  if (status === "won") return tx.won;
  if (status === "lost") return tx.lost;
  return tx.pending;
}

function formatMoney(value) {
  return "£" + Number(value || 0).toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

function daysBetweenDates(startDate, endDate) {
  const start = parseDay(startDate);
  const end = parseDay(endDate);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function opportunityDeadlineLabel(opp, tx) {
  const days = daysBetweenDates(todayValue(), opp.endDate || opp.date);
  if (days < 0) return tx.pastDeadline;
  if (days === 0) return tx.endsToday;
  return `${tx.endsInDays} ${days} ${tx.days}`;
}

function opportunityLastActivity(opp, tx) {
  if (!opp.lastActivityAt || !opp.lastActivityType) return `${tx.lastActivity}: None`;
  const activityDate = String(opp.lastActivityAt).slice(0, 10);
  const activityTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(opp.lastActivityAt));
  const today = todayValue();
  const yesterday = dateValue(new Date(parseDay(today).setDate(parseDay(today).getDate() - 1)));
  const when = activityDate === today ? `Today ${activityTime}` : activityDate === yesterday ? "Yesterday" : fmtDate(activityDate);
  return `${tx.lastActivity}: ${opp.lastActivityType} - ${when}`;
}

function opportunitySuggestedAction(opp, tx) {
  const deadline = daysBetweenDates(todayValue(), opp.endDate || opp.date);
  if (deadline < 0) return tx.reviewOpportunity;
  if (opp.contactStatus === "No Contact") return opp.lastActivityAt ? tx.chaseContact : tx.startOutreach;
  if (deadline <= 3) return tx.closingWindow;
  return tx.followUp;
}

function affectsKpis(record) {
  return !safeBool(record && record.doNotAddToKpis);
}

function isMeetingNoteOnly(meeting) {
  const source = String(meeting.source || "").toLowerCase();
  const type = String(meeting.type || "").toLowerCase();
  return source.includes("meeting note") || source.includes("nodyn cyfarfod") || type.includes("meeting note") || type.includes("nodyn cyfarfod");
}

function isScheduledMeeting(meeting) {
  return Boolean(meeting && meeting.date && meeting.time && !isMeetingNoteOnly(meeting));
}

function isBookedMeetingRecord(meeting) {
  if (!affectsKpis(meeting) || isMeetingNoteOnly(meeting)) return false;
  const source = String(meeting.source || "");
  if (source === "Manual" || source === "quick-add-meeting") return true;
  if (source === "Follow-up from note" || source === "Cyfarfod dilynol o nodyn") return true;
  return Boolean(meeting.linkedNoteId && source && !source.toLowerCase().includes("meeting note"));
}

function meetingDateTime(meeting) {
  if (!meeting.date || !meeting.time) return null;
  const date = new Date(`${meeting.date}T${meeting.time}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isCompletedMeeting(meeting, now = new Date()) {
  const date = meetingDateTime(meeting);
  return Boolean(date && affectsKpis(meeting) && isScheduledMeeting(meeting) && date <= now);
}

function isProductiveCall(call, optionSets) {
  const outcome = findOption(optionSets, "callOutcomes", call.outcome);
  return outcome ? Boolean(outcome.productive) : PRODUCTIVE_OUTCOMES.includes(call.outcome);
}

function isWonOpportunity(opp) {
  return normalizeOpportunityStatus(opp.status || opp.success) === "won";
}

function isNewBusinessOpportunity(opp) {
  return opportunityTypeLabel(opp).toLowerCase() === "new business";
}

function isLevelUpWin(item) {
  return String(item.onlineForm || "").toLowerCase() === "live" && String(item.careerSite || "").toLowerCase() === "live";
}

function targetPeriodCount(view, period, cadence) {
  if (view === "week") return cadence === "week" ? 1 : 0;
  if (view === "month") return cadence === "week" ? 4 : 1;
  if (view === "ytd") {
    if (cadence === "month") return period.end.getMonth() + 1;
    return Math.max(1, Math.ceil((period.end - period.start + 1) / (7 * 86400000)));
  }
  return 0;
}

function getKpiTarget(key, view, period) {
  const target = KPI_TARGETS[key];
  if (!target) return null;
  if (target[view]) return target[view];
  if (target.week) return target.week * targetPeriodCount(view, period, "week");
  if (target.month) return target.month * targetPeriodCount(view, period, "month");
  return null;
}

function getKpiStatus(value, target) {
  if (!target) return "neutral";
  if (value >= target + 2) return "gold";
  if (value >= target) return "green";
  return "neutral";
}

function formatEmailTime(value) {
  const [rawHour, rawMinute] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(rawHour) || !Number.isFinite(rawMinute)) return value || "";
  const hour12 = rawHour % 12 || 12;
  const suffix = rawHour < 12 ? "am" : "pm";
  if (rawMinute === 0) return `${hour12}${suffix}`;
  if (rawMinute === 30) return `half ${hour12}`;
  return `${hour12}.${String(rawMinute).padStart(2, "0")}`;
}

function meetingEmail(meeting) {
  const name = safeText(meeting.contactName, "there");
  return `Hi ${name},\n\nLooking forward to our meeting at ${formatEmailTime(meeting.time)}.\n\nAny issues joining the call, please let me know.\n\nKind regards,\nDylan`;
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
  const summary = [...KPI_FIELDS.map(([key, label]) => [label, data.totals[key] || 0]), [tx.totalSalesValue, formatMoney(data.salesSummary?.totalSalesValue)], [tx.totalCommission, formatMoney(data.salesSummary?.totalCommission)]];
  const meetings = data.meetings.map((m) => [m.date, m.time, m.school, m.type, m.teamsInviteSent ? tx.teamsSent : tx.teamsNotSent]);
  const opps = data.opportunities.map((o) => [o.date, o.wonDate || "", o.school, o.name || o.opportunityName || "", opportunityTypeLabel(o), opportunityStatusLabel(o.status, tx), formatMoney(o.value)]);
  const calls = data.calls.map((c) => [c.date, c.school, c.reason, c.outcome, c.notes || ""]);
  const notes = data.notes.map((n) => [fmtStamp(n.createdAt), n.school, n.notes]);
  const selfNotes = asArray(data.notesToSelf).map((n) => [fmtStamp(n.createdAt), n.text]);
  const levelUps = asArray(data.levelUps).map((item) => [item.date || String(item.createdAt || "").slice(0, 10), item.school, item.onlineForm, item.careerSite]);
  return "<!doctype html><html><head><meta charset='utf-8'><style>body{font-family:Arial;margin:28px;color:#221126}table{border-collapse:collapse;width:100%;margin-bottom:18px}th,td{border:1px solid #ddd;padding:8px;font-size:12px;vertical-align:top;white-space:pre-wrap}th{background:#f7f2fa}h1,h2{color:#25002f}</style></head><body><h1>KPI Report - " + esc(data.period.label) + "</h1>" + table("Summary", ["KPI", "Total"], summary) + table(tx.meetings, ["Date", "Time", "School", "Type", "Teams"], meetings) + table(tx.opportunities, ["Created", "Won", "School", "Opportunity", "Type", "Status", "Value"], opps) + table(tx.calls, ["Date", "School", "Reason", "Outcome", "Notes"], calls) + table(tx.levelUps, ["Date", "School", "Online Form", "Career Site"], levelUps) + table(tx.meetingNotes, ["Timestamp", "Client", "Notes"], notes) + table(tx.notesToSelf, ["Timestamp", "Note"], selfNotes) + "</body></html>";
}

function blankTotals() {
  return Object.fromEntries(KPI_FIELDS.map(([key]) => [key, 0]));
}

function loadStoredData() {
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const saved = normalizeAppState(JSON.parse(raw));
      if (key !== STORAGE_KEY) writeStoredData(saved);
      return saved;
    } catch {
      continue;
    }
  }
  return normalizeAppState({});
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asChoice(value, choices, fallback) {
  return choices.includes(value) ? value : fallback;
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function safeDate(value, fallback = todayValue()) {
  const text = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : fallback;
}

function safeTime(value, fallback = "") {
  const text = String(value || "").trim();
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
}

function safeIso(value, fallback = new Date().toISOString()) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function safeBool(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function savedRoot(value) {
  if (!isRecord(value)) return {};
  if (isRecord(value.data)) return value.data;
  if (isRecord(value.state)) return value.state;
  if (isRecord(value.appState)) return value.appState;
  return value;
}

function withId(source, prefix, index) {
  return safeText(source.id, `${prefix}-${index}-${uid()}`);
}

function cleanCollection(value, cleaner) {
  return asArray(value).map(cleaner).filter(Boolean);
}

function slug(v) {
  return String(v || "option").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "option";
}

function normalizeOption(option, fallback, setKey, index) {
  const source = typeof option === "string" ? { label: option } : option && typeof option === "object" ? option : {};
  const defaultOption = fallback || {};
  const label = String(source.label || defaultOption.label || "").trim();
  if (!label) return null;
  const labelCy = String(source.labelCy || defaultOption.labelCy || "").trim();
  return {
    ...defaultOption,
    ...source,
    id: String(source.id || defaultOption.id || `${setKey}-${slug(label)}-${index}`),
    label,
    labelCy,
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

function normalizeMeeting(value, index) {
  if (!isRecord(value)) return null;
  const createdAt = safeIso(value.createdAt, new Date().toISOString());
  return {
    ...value,
    id: withId(value, "meeting", index),
    school: safeText(value.school || value.client || value.name),
    contactName: safeText(value.contactName || value.contact || value.person),
    type: safeText(value.type || value.meetingType, firstOptionLabel(DEFAULT_OPTION_SETS, "meetingTypes")),
    date: safeDate(value.date || value.meetingDate || createdAt),
    time: safeTime(value.time || value.meetingTime),
    notes: String(value.notes || ""),
    teamsInviteSent: safeBool(value.teamsInviteSent),
    doNotAddToKpis: safeBool(value.doNotAddToKpis),
    source: safeText(value.source, "Manual"),
    linkedNoteId: safeText(value.linkedNoteId),
    createdAt,
  };
}

function normalizeOpportunity(value, index) {
  if (!isRecord(value)) return null;
  const createdAt = safeIso(value.createdAt, new Date().toISOString());
  const opportunityType = safeText(value.opportunityType || value.jobTitle, firstOptionLabel(DEFAULT_OPTION_SETS, "opportunityTypes"));
  const legacyStatus = OPPORTUNITY_STATUSES.includes(String(value.status || "").toLowerCase()) ? safeText(value.legacyStatus) : safeText(value.status);
  const status = normalizeOpportunityStatus(value.status || value.success);
  const name = safeText(value.name || value.opportunityName || value.jobTitle || opportunityType, opportunityType);
  const date = safeDate(value.date || createdAt);
  const wonDate = status === "won" ? safeDate(value.wonDate || value.closedDate || value.dateWon || value.date || createdAt) : "";
  const closedDate = status === "won" || status === "lost" ? safeDate(value.closedDate || value.wonDate || value.lostDate || value.date || createdAt) : "";
  return {
    ...value,
    id: withId(value, "opportunity", index),
    school: safeText(value.school || value.client || value.name),
    name,
    opportunityName: name,
    opportunityType,
    jobTitle: safeText(value.jobTitle || opportunityType, opportunityType),
    status,
    legacyStatus,
    reply: safeText(value.reply, firstOptionLabel(DEFAULT_OPTION_SETS, "opportunityReplies")),
    success: status === "won" ? "Won" : status === "lost" ? "Lost" : "Pending",
    value: safeNumber(value.value, 0),
    date,
    endDate: safeDate(value.endDate || value.deadline || date),
    contactStatus: asChoice(value.contactStatus, CONTACT_STATUSES, safeBool(value.contactMade) ? "Contact Made" : "No Contact"),
    emailStatus: asChoice(value.emailStatus, EMAIL_STATUSES, value.legacyStatus === "Email Sent" ? "Sent" : "Not Sent"),
    callStatus: asChoice(value.callStatus, CALL_STATUSES, "Not Called"),
    lostReason: safeText(value.lostReason),
    lostReasonOther: safeText(value.lostReasonOther),
    closedDate,
    wonDate,
    lastActivityType: safeText(value.lastActivityType),
    lastActivityAt: value.lastActivityAt ? safeIso(value.lastActivityAt) : "",
    createdAt,
  };
}

function normalizeCall(value, index) {
  if (!isRecord(value)) return null;
  const createdAt = safeIso(value.createdAt, new Date().toISOString());
  return {
    ...value,
    id: withId(value, "call", index),
    school: safeText(value.school || value.client || value.name),
    reason: safeText(value.reason, firstOptionLabel(DEFAULT_OPTION_SETS, "callReasons")),
    outcome: safeText(value.outcome, firstOptionLabel(DEFAULT_OPTION_SETS, "callOutcomes")),
    notes: String(value.notes || ""),
    date: safeDate(value.date || createdAt),
    doNotAddToKpis: safeBool(value.doNotAddToKpis),
    source: safeText(value.source),
    linkedNoteId: safeText(value.linkedNoteId),
    createdAt,
  };
}

function normalizeLevelUp(value, index) {
  if (!isRecord(value)) return null;
  const createdAt = safeIso(value.createdAt, new Date().toISOString());
  return {
    ...value,
    id: withId(value, "level-up", index),
    school: safeText(value.school || value.client || value.name),
    onlineForm: safeText(value.onlineForm, "Pending"),
    careerSite: safeText(value.careerSite, "Pending"),
    date: safeDate(value.date || createdAt),
    linkedNoteId: safeText(value.linkedNoteId),
    createdAt,
  };
}

function normalizeAdjustment(value, index) {
  if (!isRecord(value)) return null;
  const key = safeText(value.key);
  if (!key) return null;
  return {
    ...value,
    id: withId(value, "adjustment", index),
    key,
    amount: safeNumber(value.amount, 0),
    date: safeDate(value.date || value.createdAt),
    note: safeText(value.note),
    createdAt: safeIso(value.createdAt, new Date().toISOString()),
  };
}

function normalizeTask(value, index) {
  if (!isRecord(value)) return null;
  const createdAt = safeIso(value.createdAt, new Date().toISOString());
  const priority = asChoice(value.priority, PRIORITIES.map((item) => item.value), value.urgent ? "urgent" : "normal");
  const completed = safeBool(value.completed) || value.status === "closed";
  return {
    ...value,
    id: withId(value, "task", index),
    title: safeText(value.title || value.task || value.type, firstOptionLabel(DEFAULT_OPTION_SETS, "taskTypes")),
    school: safeText(value.school || value.client || value.name),
    type: safeText(value.type, firstOptionLabel(DEFAULT_OPTION_SETS, "taskTypes")),
    notes: String(value.notes || ""),
    dueDate: safeDate(value.dueDate || value.date || createdAt),
    dueTime: safeTime(value.dueTime || value.time),
    priority,
    urgent: priority === "urgent",
    completed,
    status: completed ? "closed" : "open",
    completedAt: completed && value.completedAt ? safeIso(value.completedAt) : value.completedAt || null,
    linkedNoteId: safeText(value.linkedNoteId),
    followUpEmail: safeBool(value.followUpEmail),
    autoFollowUpMeetingId: safeText(value.autoFollowUpMeetingId),
    createdAt,
  };
}

function normalizeNoteTask(value, index) {
  const task = normalizeTask(value, index);
  if (!task) return null;
  return {
    id: task.id,
    title: task.title,
    school: task.school,
    type: task.type,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    priority: task.priority,
    urgent: task.urgent,
    notes: task.notes,
    followUpEmail: task.followUpEmail,
    autoFollowUpMeetingId: task.autoFollowUpMeetingId,
  };
}

function normalizeNoteMeeting(value, index) {
  const meeting = normalizeMeeting(value, index);
  if (!meeting) return null;
  return {
    id: meeting.id,
    contactName: meeting.contactName,
    type: meeting.type,
    date: meeting.date,
    time: meeting.time,
    notes: meeting.notes,
    teamsInviteSent: meeting.teamsInviteSent,
    doNotAddToKpis: meeting.doNotAddToKpis,
  };
}

function normalizeNoteLevelUp(value, index) {
  const item = normalizeLevelUp(value, index);
  if (!item) return null;
  return {
    id: item.id,
    school: item.school,
    onlineForm: item.onlineForm,
    careerSite: item.careerSite,
    date: item.date,
  };
}

function normalizeNote(value, index) {
  if (!isRecord(value)) return null;
  const createdAt = safeIso(value.createdAt, new Date().toISOString());
  const tasks = cleanCollection(value.tasks, normalizeNoteTask);
  const followUps = cleanCollection(value.followUps || value.meetings, normalizeNoteMeeting);
  const levelUps = cleanCollection(value.levelUps, normalizeNoteLevelUp);
  return {
    ...value,
    id: withId(value, "note", index),
    kind: asChoice(value.kind, ["meeting", "call"], "meeting"),
    school: safeText(value.school || value.client || value.name),
    notes: String(value.notes || value.note || ""),
    tasks,
    followUps,
    levelUps,
    linkedTaskCount: tasks.length,
    linkedMeetingCount: followUps.length,
    linkedLevelUpCount: levelUps.length,
    createdAt,
  };
}

function normalizeSelfNote(value, index) {
  if (!isRecord(value)) return null;
  const createdAt = safeIso(value.createdAt, new Date().toISOString());
  const text = String(value.text || value.note || value.notes || "").trim();
  if (!text) return null;
  return {
    ...value,
    id: withId(value, "self-note", index),
    text,
    date: safeDate(value.date || createdAt),
    createdAt,
  };
}

function normalizeAppState(value) {
  const saved = savedRoot(value);
  const today = todayValue();
  const tabChoices = ["kpis", "opportunities", "tasks", "notes", "levelUps"];
  const viewChoices = ["day", "week", "month", "ytd"];
  return {
    version: APP_STATE_VERSION,
    language: asChoice(saved.language, ["en", "cy"], "en"),
    profileName: safeText(saved.profileName, "Dylan"),
    selectedDate: safeDate(saved.selectedDate, today),
    view: asChoice(saved.view, viewChoices, "week"),
    tab: asChoice(saved.tab, tabChoices, "kpis"),
    theme: cleanTheme(saved.theme),
    optionSets: cleanOptionSets(saved.optionSets),
    focusSchedule: cleanFocusSchedule(saved.focusSchedule),
    meetings: cleanCollection(saved.meetings, normalizeMeeting),
    opportunities: cleanCollection(saved.opportunities, normalizeOpportunity),
    calls: cleanCollection(saved.calls, normalizeCall),
    levelUps: cleanCollection(saved.levelUps, normalizeLevelUp),
    adjustments: cleanCollection(saved.adjustments, normalizeAdjustment),
    tasks: cleanCollection(saved.tasks, normalizeTask),
    notes: cleanCollection(saved.notes, normalizeNote),
    notesToSelf: cleanCollection(saved.notesToSelf, normalizeSelfNote),
    savedAt: saved.savedAt ? safeIso(saved.savedAt) : "",
  };
}

function writeStoredData(data) {
  const saved = normalizeAppState(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return saved;
}

function browserOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function friendlyAuthError(error) {
  const code = error?.code || "";
  if (code === "auth/unauthorized-domain") return "This app domain is not enabled for sign-in yet.";
  if (code === "auth/invalid-credential") return "Email or password is not correct.";
  if (code === "auth/email-already-in-use") return "An account already exists for that email.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "auth/operation-not-allowed") return "This sign-in method is not enabled yet.";
  if (code === "auth/popup-closed-by-user") return "The sign-in window was closed before finishing.";
  return error?.message || "Please try again.";
}

function firstNameFromValue(value, fallback = "Dylan") {
  const text = String(value || "").trim();
  if (!text) return fallback;
  if (text.includes("@")) return text.split("@")[0] || fallback;
  return text.split(/\s+/)[0] || fallback;
}

function firstNameFromProfile(profile, fallback = "") {
  return firstNameFromValue(profile?.firstName || fallback);
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
  const [view, setView] = useState(asChoice(initialData.view, ["day", "week", "month", "ytd"], "week"));
  const [tab, setTab] = useState(asChoice(initialData.tab, ["kpis", "opportunities", "tasks", "notes", "levelUps"], "kpis"));
  const [actionsOpen, setActionsOpen] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [editTotals, setEditTotals] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("");
  const [offlinePrompt, setOfflinePrompt] = useState(false);
  const [offlineChangesPending, setOfflineChangesPending] = useState(false);
  const [onlineTick, setOnlineTick] = useState(0);
  const autosaveReady = useRef(false);
  const [theme, setTheme] = useState(() => cleanTheme(initialData.theme));
  const [optionSets, setOptionSets] = useState(() => cleanOptionSets(initialData.optionSets));
  const [focusSchedule, setFocusSchedule] = useState(() => cleanFocusSchedule(initialData.focusSchedule));
  const [lastSaved, setLastSaved] = useState(initialData.savedAt ? formatSaveTime(initialData.savedAt) : "");
  const [meetings, setMeetings] = useState(asArray(initialData.meetings));
  const [opportunities, setOpportunities] = useState(asArray(initialData.opportunities));
  const [calls, setCalls] = useState(asArray(initialData.calls));
  const [levelUps, setLevelUps] = useState(asArray(initialData.levelUps));
  const [adjustments, setAdjustments] = useState(asArray(initialData.adjustments));
  const [tasks, setTasks] = useState(asArray(initialData.tasks));
  const [notes, setNotes] = useState(asArray(initialData.notes));
  const [notesToSelf, setNotesToSelf] = useState(asArray(initialData.notesToSelf));
  const [dismissed, setDismissed] = useState({});

  const [meetingForm, setMeetingForm] = useState({ school: "", contactName: "", type: firstOptionLabel(optionSets, "meetingTypes"), date: selectedDate, time: "", notes: "", teamsInviteSent: false, doNotAddToKpis: false });
  const [oppForm, setOppForm] = useState({ school: "", name: "", opportunityType: firstOptionLabel(optionSets, "opportunityTypes"), value: "", endDate: selectedDate });
  const [callForm, setCallForm] = useState({ school: "", reason: firstOptionLabel(optionSets, "callReasons"), outcome: firstOptionLabel(optionSets, "callOutcomes"), notes: "", doNotAddToKpis: false });
  const [levelUpForm, setLevelUpForm] = useState({ school: "" });
  const [taskForm, setTaskForm] = useState({ school: "", type: firstOptionLabel(optionSets, "taskTypes"), otherTitle: "", notes: "", dueDate: selectedDate, dueTime: "", priority: "normal", urgent: false });
  const [noteForm, setNoteForm] = useState({ school: "", notes: "" });
  const [selfNoteText, setSelfNoteText] = useState("");

  const period = useMemo(() => getPeriod(view, selectedDate), [view, selectedDate]);
  const periodMeetings = useMemo(() => sortMeetings(meetings.filter((m) => isScheduledMeeting(m) && inPeriod(m.date, period))), [meetings, period]);
  const periodBookedMeetings = useMemo(() => meetings.filter((m) => isBookedMeetingRecord(m) && inPeriod(String(m.createdAt || m.date || "").slice(0, 10), period)), [meetings, period]);
  const meetingsTodayDate = today;
  const todayMeetings = useMemo(() => sortTodayMeetings(meetings.filter((m) => isScheduledMeeting(m) && m.date === meetingsTodayDate)), [meetings, meetingsTodayDate]);
  const periodCreatedOpps = useMemo(() => opportunities.filter((o) => inPeriod(o.date, period)), [opportunities, period]);
  const periodWonOpps = useMemo(() => opportunities.filter((o) => isWonOpportunity(o) && inPeriod(o.closedDate || o.wonDate || o.date, period)), [opportunities, period]);
  const periodOpps = useMemo(() => {
    const ids = new Set();
    const periodClosedOpps = opportunities.filter((o) => o.closedDate && inPeriod(o.closedDate, period));
    return [...periodCreatedOpps, ...periodWonOpps, ...periodClosedOpps].filter((opp) => {
      if (ids.has(opp.id)) return false;
      ids.add(opp.id);
      return true;
    });
  }, [opportunities, period, periodCreatedOpps, periodWonOpps]);
  const periodCalls = useMemo(() => calls.filter((c) => inPeriod(c.date, period)), [calls, period]);
  const periodLevelUps = useMemo(() => levelUps.filter((item) => inPeriod(item.date || String(item.createdAt || "").slice(0, 10), period)), [levelUps, period]);
  const periodNotes = useMemo(() => sortNotes(notes.filter((n) => inPeriod(String(n.createdAt || "").slice(0, 10), period))), [notes, period]);
  const periodSelfNotes = useMemo(() => notesToSelf.filter((note) => inPeriod(note.date || String(note.createdAt || "").slice(0, 10), period)), [notesToSelf, period]);
  const sortedTasks = useMemo(() => sortTasks(tasks.filter((task) => inPeriod(taskPeriodDate(task), period))), [tasks, period]);
  const liveTasks = sortedTasks.filter((task) => !task.completed);
  const closedTasks = sortedTasks.filter((task) => task.completed);

  const totals = useMemo(() => {
    const total = blankTotals();
    adjustments.filter((a) => inPeriod(a.date, period)).forEach((a) => { total[a.key] = Math.max(0, (total[a.key] || 0) + Number(a.amount || 0)); });
    const kpiCalls = periodCalls.filter(affectsKpis);
    const kpiOpps = periodCreatedOpps.filter(affectsKpis);
    const kpiWonOpps = periodWonOpps.filter(affectsKpis);
    total.calls += kpiCalls.length;
    total.productiveCalls += kpiCalls.filter((call) => isProductiveCall(call, optionSets)).length;
    total.productiveCalls += periodMeetings.filter((meeting) => inPeriod(meeting.date, period) && isCompletedMeeting(meeting)).length;
    total.oppsIdentified += kpiOpps.length;
    total.oppsInitiated += kpiOpps.filter((o) => o.legacyStatus === (labelsFor(optionSets, "opportunityStatuses")[1] || "Email Sent")).length;
    total.oppsWon += kpiWonOpps.length;
    total.meetingsBooked += periodBookedMeetings.length;
    total.levelUpWins += periodLevelUps.filter(isLevelUpWin).length;
    total.newBusiness += kpiOpps.filter(isNewBusinessOpportunity).length;
    return total;
  }, [adjustments, optionSets, period, periodBookedMeetings, periodCalls, periodCreatedOpps, periodLevelUps, periodMeetings, periodWonOpps]);

  const salesSummary = useMemo(() => {
    const totalSalesValue = periodWonOpps.reduce((sum, opp) => sum + Number(opp.value || 0), 0);
    return { totalSalesValue, totalCommission: totalSalesValue * 0.1 };
  }, [periodWonOpps]);

  const applySavedState = useCallback((saved) => {
    setLanguage(saved.language || "en");
    setProfileName(String(saved.profileName || "Dylan"));
    setSelectedDate(saved.selectedDate || today);
    setView(saved.view || "week");
    setTab(saved.tab || "kpis");
    setTheme(cleanTheme(saved.theme));
    setOptionSets(cleanOptionSets(saved.optionSets));
    setFocusSchedule(cleanFocusSchedule(saved.focusSchedule));
    setMeetings(asArray(saved.meetings));
    setOpportunities(asArray(saved.opportunities));
    setCalls(asArray(saved.calls));
    setLevelUps(asArray(saved.levelUps));
    setAdjustments(asArray(saved.adjustments));
    setTasks(asArray(saved.tasks));
    setNotes(asArray(saved.notes));
    setNotesToSelf(asArray(saved.notesToSelf));
    setLastSaved(saved.savedAt ? formatSaveTime(saved.savedAt) : "");
  }, [today]);

  const meetingAlerts = useMemo(() => {
    const now = new Date();
    return meetings.filter((m) => {
      if (!isScheduledMeeting(m) || dismissed[m.id]) return false;
      const target = new Date(m.date + "T" + m.time + ":00");
      const mins = (target.getTime() - now.getTime()) / 60000;
      return mins <= 15 && mins >= -5;
    });
  }, [meetings, dismissed]);

  useEffect(() => {
    const existing = new Set(tasks.map((task) => task.autoFollowUpMeetingId).filter(Boolean));
    const now = new Date();
    const additions = meetings
      .filter((meeting) => isCompletedMeeting(meeting, now) && !meeting.followUpEmailTaskCreated && !existing.has(meeting.id))
      .map((meeting) => normalizeTask({
        id: uid(),
        title: followUpEmailTitle(meeting.contactName || meeting.school),
        school: meeting.school,
        type: "Follow Up Email",
        notes: "",
        dueDate: todayValue(),
        dueTime: "16:30",
        priority: "normal",
        completed: false,
        status: "open",
        followUpEmail: true,
        autoFollowUpMeetingId: meeting.id,
        linkedNoteId: meeting.linkedNoteId,
        createdAt: new Date().toISOString(),
      }, 0))
      .filter(Boolean);
    if (additions.length) {
      const completedMeetingIds = new Set(additions.map((task) => task.autoFollowUpMeetingId));
      const timer = window.setTimeout(() => {
        setTasks((current) => [...additions, ...current]);
        setMeetings((current) => current.map((meeting) => completedMeetingIds.has(meeting.id) ? { ...meeting, followUpEmailTaskCreated: true } : meeting));
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [meetings, tasks]);

  const currentData = (savedAt = new Date().toISOString()) => normalizeAppState({ version: APP_STATE_VERSION, language, profileName, selectedDate, view, tab, theme, optionSets, focusSchedule, meetings, opportunities, calls, levelUps, adjustments, tasks, notes, notesToSelf, savedAt });

  useEffect(() => {
    const saved = writeStoredData(currentData());
    setLastSaved(formatSaveTime(saved.savedAt));
    if (!autosaveReady.current) {
      autosaveReady.current = true;
      return undefined;
    }
    if (!firebaseUser || !authReady || !cloudLoaded) return undefined;
    const timer = window.setTimeout(async () => {
      if (!browserOnline()) {
        setOfflinePrompt(true);
        setCloudStatus(tx.unsavedChangesWarning);
        return;
      }
      try {
        await setDoc(trackerDoc(firebaseUser.uid), { state: saved, updatedAt: serverTimestamp() }, { merge: true });
        setCloudStatus(tx.savedCloud);
        setOfflineChangesPending(false);
      } catch {
        setOfflinePrompt(true);
        setCloudStatus(tx.unsavedChangesWarning);
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [language, profileName, selectedDate, view, tab, theme, optionSets, focusSchedule, meetings, opportunities, calls, levelUps, adjustments, tasks, notes, notesToSelf, firebaseUser, authReady, cloudLoaded, tx]);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setFirebaseUser(user);
    setCloudStatus("");
    setCloudLoaded(false);
    if (!user) {
      setAuthReady(true);
      return;
    }
    if (!browserOnline()) {
      setAuthReady(true);
      setCloudLoaded(true);
      return;
    }
    try {
      const snap = await getDoc(trackerDoc(user.uid));
      const data = snap.exists() ? snap.data() : {};
      const profile = data.profile || {};
      const fallbackName = firstNameFromProfile(profile, user.displayName || user.email || "Dylan");
      const saved = snap.exists()
        ? normalizeAppState({ ...(data.state || data), profileName: firstNameFromValue((data.state && data.state.profileName) || fallbackName) })
        : normalizeAppState({ profileName: fallbackName, savedAt: new Date().toISOString() });
      writeStoredData(saved);
      autosaveReady.current = false;
      applySavedState(saved);
      if (!snap.exists()) {
        await setDoc(trackerDoc(user.uid), {
          profile: { firstName: profile.firstName || firstNameFromValue(user.displayName || user.email || ""), lastName: profile.lastName || "", jobTitle: profile.jobTitle || "", email: user.email || "" },
          state: saved,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      setCloudStatus(copy.en.cloudLoaded);
    } catch {
      setCloudStatus(copy.en.cloudLoadFailed);
    } finally {
      setCloudLoaded(true);
      setAuthReady(true);
    }
  }), [applySavedState]);

  useEffect(() => {
    const ping = () => setOnlineTick((tick) => tick + 1);
    window.addEventListener("online", ping);
    return () => window.removeEventListener("online", ping);
  }, []);

  useEffect(() => {
    if (!offlineChangesPending || !firebaseUser || !browserOnline()) return undefined;
    const timer = window.setTimeout(async () => {
      const saved = writeStoredData(currentData());
      try {
        await setDoc(trackerDoc(firebaseUser.uid), { state: saved, updatedAt: serverTimestamp() }, { merge: true });
        setOfflineChangesPending(false);
        setCloudStatus(tx.savedCloud);
      } catch {
        setOfflinePrompt(true);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [offlineChangesPending, firebaseUser, onlineTick, tx]);

  const required = (values) => {
    if (values.some((value) => !String(value || "").trim())) {
      alert(tx.required);
      return false;
    }
    return true;
  };

  const updateMeeting = (id, patch) => {
    setMeetings((current) => current.map((meeting) => {
      if (meeting.id !== id) return meeting;
      return normalizeMeeting({ ...meeting, ...patch }, 0);
    }));
  };

  const addMeeting = () => {
    if (!required([meetingForm.school, meetingForm.type, meetingForm.date, meetingForm.time])) return;
    setMeetings((current) => [{ ...meetingForm, id: uid(), school: meetingForm.school.trim(), contactName: meetingForm.contactName.trim(), notes: meetingForm.notes.trim(), source: "quick-add-meeting", createdAt: new Date().toISOString() }, ...current]);
    setMeetingForm({ school: "", contactName: "", type: firstOptionLabel(optionSets, "meetingTypes"), date: selectedDate, time: "", notes: "", teamsInviteSent: false, doNotAddToKpis: false });
  };

  const addOpportunity = () => {
    if (!required([oppForm.school, oppForm.name, oppForm.opportunityType])) return;
    const opportunity = normalizeOpportunity({ id: uid(), school: oppForm.school.trim(), name: oppForm.name.trim(), opportunityName: oppForm.name.trim(), opportunityType: oppForm.opportunityType, jobTitle: oppForm.opportunityType, status: "pending", value: safeNumber(oppForm.value, 0), date: selectedDate, endDate: oppForm.endDate || selectedDate, contactStatus: "No Contact", emailStatus: "Not Sent", callStatus: "Not Called", createdAt: new Date().toISOString() }, 0);
    setOpportunities((current) => [opportunity, ...current]);
    setOppForm({ school: "", name: "", opportunityType: firstOptionLabel(optionSets, "opportunityTypes"), value: "", endDate: selectedDate });
  };

  const addCall = () => {
    if (!required([callForm.school, callForm.reason, callForm.outcome])) return;
    const call = { id: uid(), school: callForm.school.trim(), reason: callForm.reason, outcome: callForm.outcome, notes: callForm.notes.trim(), date: selectedDate, doNotAddToKpis: callForm.doNotAddToKpis, createdAt: new Date().toISOString() };
    setCalls((current) => [call, ...current]);
    const outcome = findOption(optionSets, "callOutcomes", call.outcome);
    if (outcome ? outcome.createsMeeting : call.outcome === "Meeting Booked") {
      setMeetings((current) => [{ id: uid(), school: call.school, type: firstOptionLabel(optionSets, "meetingTypes"), date: selectedDate, time: "", teamsInviteSent: false, doNotAddToKpis: call.doNotAddToKpis, source: "Phone call", createdAt: new Date().toISOString() }, ...current]);
    }
    setCallForm({ school: "", reason: firstOptionLabel(optionSets, "callReasons"), outcome: firstOptionLabel(optionSets, "callOutcomes"), notes: "", doNotAddToKpis: false });
  };

  const addLevelUp = () => {
    if (!required([levelUpForm.school])) return;
    setLevelUps((current) => [{ id: uid(), school: levelUpForm.school.trim(), onlineForm: "Pending", careerSite: "Pending", date: selectedDate, createdAt: new Date().toISOString() }, ...current]);
    setLevelUpForm({ school: "" });
  };

  const addTask = (options = {}) => {
    const title = taskTitleFromForm(taskForm, tx);
    if (!required([taskForm.school, taskForm.type, title, taskForm.dueDate, taskForm.dueTime])) return;
    const completed = Boolean(options.completed);
    const stamp = new Date().toISOString();
    const task = normalizeTask({ id: uid(), title, school: taskForm.school.trim(), type: taskForm.type, notes: taskForm.notes || "", dueDate: taskForm.dueDate, dueTime: taskForm.dueTime, priority: taskForm.priority || "normal", urgent: taskForm.priority === "urgent", completed, status: completed ? "closed" : "open", completedAt: completed ? stamp : null, createdAt: stamp }, 0);
    setTasks((current) => [task, ...current]);
    setTaskForm({ school: "", type: firstOptionLabel(optionSets, "taskTypes"), otherTitle: "", notes: "", dueDate: selectedDate, dueTime: "", priority: "normal", urgent: false });
  };

  const updateTask = (id, patch) => {
    setTasks((current) => current.map((task) => task.id === id ? normalizeTask({ ...task, ...patch }, 0) : task));
  };

  const toggleTask = (id) => {
    setTasks((current) => current.map((task) => {
      if (task.id !== id) return task;
      const completed = !task.completed;
      return { ...task, completed, status: completed ? "closed" : "open", completedAt: completed ? new Date().toISOString() : null };
    }));
  };

  const addSelfNote = () => {
    const text = selfNoteText.trim();
    if (!text) return alert(tx.required);
    setNotesToSelf((current) => [{ id: uid(), text, date: selectedDate, createdAt: new Date().toISOString() }, ...current]);
    setSelfNoteText("");
  };

  const addNote = (kind, draftTasks, draftMeetings, draftLevelUps) => {
    if (!required([noteForm.school, noteForm.notes])) return false;
    const noteId = uid();
    const stamp = new Date().toISOString();
    const client = noteForm.school.trim();
    const newTasks = draftTasks.map((task) => ({ ...task, id: task.id || uid(), school: client, completed: false, status: "open", source: task.followUpEmail ? tx.followUpEmail : tx.taskFromNote, linkedNoteId: noteId, createdAt: stamp }));
    const newMeetings = draftMeetings.map((meeting) => ({ ...meeting, id: meeting.id || uid(), school: client, source: tx.followUpFromNote, linkedNoteId: noteId, createdAt: stamp }));
    const noteTypeRecord = kind === "call"
      ? { id: uid(), school: client, reason: tx.callNote, outcome: "Note", notes: noteForm.notes.trim(), date: selectedDate, source: tx.callNote, linkedNoteId: noteId, createdAt: stamp }
      : { id: uid(), school: client, type: tx.meetingNote, date: selectedDate, time: "", teamsInviteSent: false, doNotAddToKpis: true, source: tx.meetingNote, linkedNoteId: noteId, createdAt: stamp };
    const newLevelUps = draftLevelUps.map((item) => ({ ...item, id: uid(), school: client, date: selectedDate, linkedNoteId: noteId, createdAt: stamp }));
    const noteTasks = newTasks.map((task) => ({ id: task.id, title: task.title, school: task.school, type: task.type, notes: task.notes || "", dueDate: task.dueDate, dueTime: task.dueTime, priority: task.priority || (task.urgent ? "urgent" : "normal"), urgent: task.urgent, followUpEmail: task.followUpEmail, autoFollowUpMeetingId: task.autoFollowUpMeetingId }));
    const noteMeetings = newMeetings.map((meeting) => ({ id: meeting.id, contactName: meeting.contactName || "", type: meeting.type, date: meeting.date, time: meeting.time, notes: meeting.notes || "", teamsInviteSent: meeting.teamsInviteSent }));
    const noteLevelUps = newLevelUps.map((item) => ({ id: item.id, school: item.school, onlineForm: item.onlineForm, careerSite: item.careerSite, date: item.date }));
    const note = { id: noteId, kind, school: client, notes: noteForm.notes.trim(), tasks: noteTasks, followUps: noteMeetings, levelUps: noteLevelUps, linkedTaskCount: noteTasks.length, linkedMeetingCount: noteMeetings.length, linkedLevelUpCount: noteLevelUps.length, createdAt: stamp };
    setNotes((current) => [note, ...current]);
    if (newTasks.length) setTasks((current) => [...newTasks, ...current]);
    if (kind === "call") setCalls((current) => [noteTypeRecord, ...current]);
    if (kind !== "call" || newMeetings.length) setMeetings((current) => [...(kind === "call" ? [] : [noteTypeRecord]), ...newMeetings, ...current]);
    if (newLevelUps.length) setLevelUps((current) => [...newLevelUps, ...current]);
    setNoteForm({ school: "", notes: "" });
    if (newTasks.length) setTab("tasks");
    else if (newLevelUps.length) setTab("levelUps");
    return true;
  };

  const toggleLevelUp = (id, field) => {
    setLevelUps((current) => current.map((item) => item.id === id ? { ...item, [field]: toggleLiveStatus(item[field]) } : item));
  };

  const updateOpp = (id, patch) => {
    setOpportunities((current) => current.map((opp) => {
      if (opp.id !== id) return opp;
      const stamp = new Date().toISOString();
      const next = typeof patch === "string" ? { ...opp, status: cycleLabel(optionSets, "opportunitySuccesses", opp.status) } : { ...opp, ...patch };
      if (patch.emailStatus && patch.emailStatus !== opp.emailStatus) {
        next.lastActivityType = "Email";
        next.lastActivityAt = stamp;
      }
      if (patch.callStatus && patch.callStatus !== opp.callStatus) {
        next.lastActivityType = "Call";
        next.lastActivityAt = stamp;
      }
      if (patch.contactStatus && patch.contactStatus !== opp.contactStatus && !next.lastActivityAt) {
        next.lastActivityType = "Contact";
        next.lastActivityAt = stamp;
      }
      if (patch.status === "won") {
        next.wonDate = todayValue();
        next.closedDate = todayValue();
        next.lostReason = "";
        next.lostReasonOther = "";
      }
      if (patch.status === "lost") {
        next.closedDate = todayValue();
        next.wonDate = "";
      }
      if (patch.status === "pending") {
        next.closedDate = "";
        next.wonDate = "";
        next.lostReason = "";
        next.lostReasonOther = "";
      }
      return normalizeOpportunity(next, 0);
    }));
  };

  const setTotal = (key, value) => {
    const target = Math.max(0, Number(value || 0));
    const diff = target - (totals[key] || 0);
    if (diff) setAdjustments((current) => [{ id: uid(), key, amount: diff, date: selectedDate, note: "Manual correction" }, ...current]);
  };

  const jump = (amount) => {
    const d = parseDay(selectedDate);
    if (view === "day") d.setDate(d.getDate() + amount);
    if (view === "week") d.setDate(d.getDate() + amount * 7);
    if (view === "month") d.setMonth(d.getMonth() + amount);
    if (view === "ytd") d.setFullYear(d.getFullYear() + amount);
    setSelectedDate(dateValue(d));
  };

  const signInGoogle = async () => {
    if (!browserOnline()) {
      alert(tx.offlineSaveBlocked);
      return null;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(result.user);
      return result.user;
    } catch (error) {
      alert(`${tx.googleSignInFailed} ${friendlyAuthError(error)}`);
      return null;
    }
  };

  const signOutGoogle = async () => {
    await signOut(auth);
    setCloudStatus("");
  };

  const signInEmail = async ({ email, password }) => {
    if (!browserOnline()) return alert(tx.offlineSaveBlocked);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      alert(`${tx.signInFailed} ${friendlyAuthError(error)}`);
    }
  };

  const createEmailAccount = async ({ firstName, lastName, jobTitle, email, password }) => {
    if (!browserOnline()) return alert(tx.offlineSaveBlocked);
    if (!required([firstName, lastName, jobTitle, email, password])) return;
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const profile = { firstName: firstName.trim(), lastName: lastName.trim(), jobTitle: jobTitle.trim(), email: email.trim() };
      const displayName = firstNameFromProfile(profile, email.trim());
      await updateProfile(result.user, { displayName });
      const saved = normalizeAppState({ profileName: displayName, savedAt: new Date().toISOString() });
      await setDoc(trackerDoc(result.user.uid), { profile, state: saved, updatedAt: serverTimestamp() }, { merge: true });
      writeStoredData(saved);
      applySavedState(saved);
      setFirebaseUser(result.user);
      setCloudStatus(tx.accountCreated);
    } catch (error) {
      alert(`${tx.createAccountFailed} ${friendlyAuthError(error)}`);
    }
  };

  const resetPassword = async (email) => {
    if (!browserOnline()) return alert(tx.offlineSaveBlocked);
    if (!String(email || "").trim()) return alert(tx.required);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      alert(tx.passwordResetSent);
    } catch (error) {
      alert(`${tx.resetPasswordFailed} ${friendlyAuthError(error)}`);
    }
  };

  const saveNow = async () => {
    const saved = writeStoredData(currentData());
    setLastSaved(formatSaveTime(saved.savedAt));
    if (!browserOnline()) {
      setOfflinePrompt(true);
      setCloudStatus(tx.unsavedChangesWarning);
      return;
    }
    const user = firebaseUser || await signInGoogle();
    if (!user) return;
    try {
      await setDoc(trackerDoc(user.uid), { state: saved, updatedAt: serverTimestamp() }, { merge: true });
      setCloudStatus(tx.savedCloud);
      alert(tx.savedCloud);
    } catch {
      setOfflinePrompt(true);
      setCloudStatus(tx.unsavedChangesWarning);
    }
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
        const saved = normalizeAppState({ ...savedRoot(JSON.parse(String(reader.result))), savedAt: new Date().toISOString() });
        writeStoredData(saved);
        applySavedState(saved);
      } catch {
        alert("Could not import that file.");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  const exportReport = () => {
    const html = makeReport({ period, totals, salesSummary, meetings: periodMeetings, opportunities: periodOpps, calls: periodCalls, levelUps: periodLevelUps, notes: periodNotes, notesToSelf: periodSelfNotes }, tx);
    download(cleanName(period.file) + ".xls", html, "application/vnd.ms-excel;charset=utf-8");
  };

  const printReport = () => {
    const popup = window.open("", "_blank");
    if (!popup) return alert(tx.popBlocked);
    popup.document.write(makeReport({ period, totals, salesSummary, meetings: periodMeetings, opportunities: periodOpps, calls: periodCalls, levelUps: periodLevelUps, notes: periodNotes, notesToSelf: periodSelfNotes }, tx));
    popup.document.close();
    popup.print();
  };

  const saveOfflineFromPrompt = () => {
    writeStoredData(currentData());
    setOfflineChangesPending(true);
    setOfflinePrompt(false);
    setCloudStatus(tx.offlineChangesPending);
  };

  const cancelOfflinePrompt = () => {
    setOfflinePrompt(false);
    setCloudStatus(tx.unsavedChangesWarning);
  };

  if (!authReady) {
    return <div className="app-shell auth-page min-h-screen" style={themeStyle(theme)}><div className="app-bg fixed inset-0 -z-10" /><div className="auth-shell panel shadow-card"><p className="brand text-center">{tx.authLoading}</p></div></div>;
  }

  if (!firebaseUser) {
    return <AuthGate tx={tx} signInEmail={signInEmail} createEmailAccount={createEmailAccount} resetPassword={resetPassword} signInGoogle={signInGoogle} />;
  }

  return (
    <div className="app-shell min-h-screen p-2 sm:p-4" style={themeStyle(theme)}>
      <div className="app-bg fixed inset-0 -z-10" />
      <div className="mx-auto max-w-[1500px]">
        <Header tx={tx} language={language} profileName={profileName} firebaseUser={firebaseUser} cloudStatus={cloudStatus} signInGoogle={signInGoogle} signOutGoogle={signOutGoogle} period={period} view={view} setView={setView} selectedDate={selectedDate} setSelectedDate={setSelectedDate} calendarOpen={calendarOpen} setCalendarOpen={setCalendarOpen} actionsOpen={actionsOpen} setActionsOpen={setActionsOpen} headerOpen={headerOpen} setHeaderOpen={setHeaderOpen} editTotals={editTotals} setEditTotals={setEditTotals} jump={jump} saveNow={saveNow} saveAs={saveAs} exportReport={exportReport} printReport={printReport} importBackup={importBackup} backup={() => download(cleanName(period.file) + " backup.json", JSON.stringify(currentData(), null, 2), "application/json;charset=utf-8")} reset={() => { if (confirm(tx.resetWarning)) { setMeetings([]); setOpportunities([]); setCalls([]); setLevelUps([]); setTasks([]); setNotes([]); setNotesToSelf([]); setAdjustments([]); setFocusSchedule(DEFAULT_FOCUS_SCHEDULE); } }} lastSaved={lastSaved} openSettings={() => setSettingsOpen(true)} />

        {offlinePrompt && <OfflineSavePrompt tx={tx} saveOffline={saveOfflineFromPrompt} cancel={cancelOfflinePrompt} />}
        {settingsOpen && <Settings tx={tx} language={language} setLanguage={setLanguage} profileName={profileName} setProfileName={setProfileName} theme={theme} setTheme={setTheme} optionSets={optionSets} setOptionSets={setOptionSets} close={() => setSettingsOpen(false)} />}
        {meetingAlerts.length > 0 && <Reminder tx={tx} alerts={meetingAlerts} dismiss={() => setDismissed(Object.fromEntries(meetingAlerts.map((m) => [m.id, true])))} />}
        <CurrentFocus tx={tx} schedule={focusSchedule} setSchedule={setFocusSchedule} />
        <MeetingsToday tx={tx} optionSets={optionSets} today={meetingsTodayDate} meetings={todayMeetings} updateMeeting={updateMeeting} removeMeeting={(id) => setMeetings((current) => current.filter((m) => m.id !== id))} />
        <SalesSummaryBar tx={tx} salesSummary={salesSummary} />
        <Tabs tx={tx} tab={tab} setTab={setTab} />

        {tab === "kpis" && <Kpis tx={tx} optionSets={optionSets} editTotals={editTotals} totals={totals} view={view} period={period} setTotal={setTotal} addAdj={(key) => setAdjustments((current) => [{ id: uid(), key, amount: 1, date: selectedDate, note: "Quick click" }, ...current])} meetingForm={meetingForm} setMeetingForm={setMeetingForm} addMeeting={addMeeting} callForm={callForm} setCallForm={setCallForm} addCall={addCall} meetings={periodMeetings} calls={periodCalls} removeMeeting={(id) => setMeetings((current) => current.filter((m) => m.id !== id))} removeCall={(id) => setCalls((current) => current.filter((c) => c.id !== id))} toggleInvite={(id) => updateMeeting(id, { teamsInviteSent: !meetings.find((m) => m.id === id)?.teamsInviteSent })} />}

        {tab === "opportunities" && <OpportunitiesTab tx={tx} optionSets={optionSets} form={oppForm} setForm={setOppForm} add={addOpportunity} opportunities={periodOpps} remove={(id) => setOpportunities((current) => current.filter((o) => o.id !== id))} updateOpp={updateOpp} />}

        {tab === "tasks" && <Tasks tx={tx} optionSets={optionSets} live={liveTasks} closed={closedTasks} form={taskForm} setForm={setTaskForm} add={addTask} update={updateTask} toggle={toggleTask} remove={(id) => setTasks((current) => current.filter((task) => task.id !== id))} notes={notes} openNote={() => setTab("notes")} totals={totals} salesSummary={salesSummary} meetings={periodMeetings} calls={periodCalls} levelUps={periodLevelUps} />}

        {tab === "notes" && <Notes tx={tx} optionSets={optionSets} notes={periodNotes} notesToSelf={periodSelfNotes} selfNoteText={selfNoteText} setSelfNoteText={setSelfNoteText} addSelfNote={addSelfNote} removeSelfNote={(id) => setNotesToSelf((current) => current.filter((note) => note.id !== id))} tasks={tasks} form={noteForm} setForm={setNoteForm} addNote={addNote} remove={(id) => setNotes((current) => current.filter((note) => note.id !== id))} toggleTask={toggleTask} />}

        {tab === "levelUps" && <LevelUps tx={tx} levelUps={periodLevelUps} form={levelUpForm} setForm={setLevelUpForm} add={addLevelUp} toggle={toggleLevelUp} remove={(id) => setLevelUps((current) => current.filter((item) => item.id !== id))} />}
      </div>
    </div>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 3-4.1 3-7.1Z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.1-2.4c-.9.6-2 .9-3.5.9-2.6 0-4.8-1.8-5.6-4.1H3.2v2.5C4.8 19.7 8.1 22 12 22Z" /><path fill="#FBBC05" d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.6H3.2C2.4 8.9 2 10.4 2 12s.4 3.1 1.2 4.4l3.2-2.5Z" /><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3 14.7 2 12 2 8.1 2 4.8 4.3 3.2 7.6l3.2 2.5C7.2 7.8 9.4 6 12 6Z" /></svg>;
}

function AuthGate({ tx, signInEmail, createEmailAccount, resetPassword, signInGoogle }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ firstName: "", lastName: "", jobTitle: "", email: "", password: "" });
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (mode === "create") {
      createEmailAccount(form);
      return;
    }
    signInEmail(form);
  };

  return (
    <div className="app-shell auth-page min-h-screen">
      <div className="app-bg fixed inset-0 -z-10" />
      <div className="auth-home-logo">
        <img className="auth-home-logo-img" src={`${import.meta.env.BASE_URL}eteach-logo.png`} alt="eTeach" />
      </div>
      <main className="auth-shell panel shadow-card">
        <h1 className="brand brand-text">{tx.welcomeTitle}</h1>
        <p className="muted">{tx.welcomeBody}</p>
        <form className="mt-4 grid gap-2" onSubmit={submit}>
          {mode === "create" && (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="input" autoComplete="given-name" placeholder={tx.firstName} value={form.firstName} onChange={update("firstName")} />
                <input className="input" autoComplete="family-name" placeholder={tx.lastName} value={form.lastName} onChange={update("lastName")} />
              </div>
              <input className="input" autoComplete="organization-title" placeholder={tx.jobTitle} value={form.jobTitle} onChange={update("jobTitle")} />
            </>
          )}
          <input className="input" type="email" autoComplete="email" placeholder={tx.email} value={form.email} onChange={update("email")} />
          <input className="input" type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} placeholder={tx.password} value={form.password} onChange={update("password")} />
          <button className="btn primary w-full" type="submit">{mode === "create" ? tx.createAccount : tx.signIn}</button>
        </form>
        <button className="google-btn mt-3" onClick={signInGoogle}><GoogleMark /><span>{mode === "create" ? tx.googleCreateAccount : tx.signInGoogle}</span></button>
        <div className="mt-3 grid gap-2 text-center text-sm font-bold">
          {mode === "signin" ? (
            <>
              <button className="brand-text" onClick={() => resetPassword(form.email)}>{tx.forgotPassword}</button>
              <button className="muted" onClick={() => setMode("create")}>{tx.createAccount}</button>
            </>
          ) : (
            <button className="muted" onClick={() => setMode("signin")}>{tx.alreadyHaveAccount} {tx.backToSignIn}</button>
          )}
        </div>
      </main>
    </div>
  );
}

function Header({ tx, language, profileName, firebaseUser, cloudStatus, signInGoogle, signOutGoogle, period, view, setView, selectedDate, setSelectedDate, calendarOpen, setCalendarOpen, actionsOpen, setActionsOpen, headerOpen, setHeaderOpen, editTotals, setEditTotals, jump, saveNow, saveAs, exportReport, printReport, importBackup, backup, reset, lastSaved, openSettings }) {
  const displayName = firstNameFromValue(profileName || firebaseUser?.displayName || firebaseUser?.email);
  if (!headerOpen) {
    return <header className="panel shadow-card mb-3 p-2"><div className="flex items-center justify-between gap-2"><button onClick={() => setHeaderOpen(true)} className="btn soft min-w-0 flex-1 truncate text-left"><Fa icon={faChevronDown} /> <span>{greetingFor(language, displayName)}</span></button>{firebaseUser ? <button className="btn soft" onClick={signOutGoogle}><Fa icon={faRightFromBracket} /></button> : <button className="btn primary" onClick={signInGoogle}><Fa icon={faRightToBracket} /></button>}<button className="btn soft" title={tx.settings} onClick={openSettings}><Fa icon={faGear} /> <span className="hidden sm:inline">{tx.settings}</span></button></div></header>;
  }
  return <header className="panel shadow-card mb-3 p-3"><div className="dashboard-topline"><div className="min-w-0"><p className="text-[10px] font-black uppercase muted">{tx.dashboardTitle}</p><button onClick={() => setCalendarOpen(!calendarOpen)} className="brand truncate text-left text-lg brand-text sm:text-2xl"><Fa icon={faCalendarDays} className="mr-2 text-base" />{period.label}</button><div className="mt-1 text-[10px] font-black uppercase muted">{firebaseUser ? `${tx.signedInAs} ${displayName}` : tx.signInRequired}{cloudStatus ? ` - ${cloudStatus}` : ""}</div></div><div className="dashboard-actions"><span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black text-green-700">{lastSaved}</span>{firebaseUser ? <button className="btn soft" onClick={signOutGoogle}><Fa icon={faRightFromBracket} /> <span className="hidden sm:inline">{tx.signOut}</span></button> : <button className="btn primary" onClick={signInGoogle}><Fa icon={faRightToBracket} /> <span className="hidden sm:inline">{tx.signInGoogle}</span></button>}<button className="btn soft" title={tx.collapseTop} onClick={() => setHeaderOpen(false)}><Fa icon={faChevronUp} /></button><button className="btn soft" title={tx.settings} onClick={openSettings}><Fa icon={faGear} /> <span className="hidden sm:inline">{tx.settings}</span></button></div></div><div className="mt-2 grid grid-cols-[38px_1fr_38px] gap-1"><button className="btn soft" onClick={() => jump(-1)}><Fa icon={faChevronLeft} /></button><div className="grid grid-cols-4 gap-1 rounded-2xl brand-soft p-1">{[["day", tx.day], ["week", tx.week], ["month", tx.month], ["ytd", tx.ytd]].map(([key, label]) => <button key={key} className={"btn " + (view === key ? "primary" : "")} onClick={() => setView(key)}>{label}</button>)}</div><button className="btn soft" onClick={() => jump(1)}><Fa icon={faChevronRight} /></button></div>{calendarOpen && <input className="input mt-2" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />}<button className="btn soft mt-2 w-full" onClick={() => setActionsOpen(!actionsOpen)}><Fa icon={actionsOpen ? faChevronUp : faChevronDown} /> <span>{actionsOpen ? tx.hideActions : tx.showActions}</span></button>{actionsOpen && <div className="mt-2 grid grid-cols-2 gap-1 sm:flex sm:flex-wrap"><button className="btn soft" onClick={() => setEditTotals(!editTotals)}><Fa icon={faPenToSquare} /> <span>{editTotals ? tx.done : tx.editTotals}</span></button><button className="btn primary" onClick={saveNow}><Fa icon={faFloppyDisk} /> <span>{tx.save}</span></button><button className="btn soft" onClick={saveAs}><Fa icon={faFileArrowDown} /> <span>{tx.saveAs}</span></button><button className="btn primary" onClick={exportReport}><Fa icon={faFileExport} /> <span>{tx.exportExcel}</span></button><button className="btn primary" onClick={printReport}><Fa icon={faFilePdf} /> <span>{tx.pdfPrint}</span></button><button className="btn soft" onClick={backup}><Fa icon={faFileArrowDown} /> <span>{tx.backup}</span></button><label className="btn soft text-center"><Fa icon={faFileArrowUp} /> <span>{tx.import}</span><input className="hidden" type="file" accept="application/json" onChange={importBackup} /></label><button className="btn soft text-red-700" onClick={reset}><Fa icon={faRotateLeft} /> <span>{tx.reset}</span></button></div>}</header>;
}
function RangeControl({ label, value, min, max, step = 1, suffix = "", onChange }) {
  return <label className="grid gap-1 text-xs font-black uppercase muted"><span className="flex justify-between"><span>{label}</span><span>{value}{suffix}</span></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
}

function OptionSetEditor({ tx, setKey, options, setOptionSets }) {
  const [newLabel, setNewLabel] = useState("");
  const [newLabelCy, setNewLabelCy] = useState("");
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
      [setKey]: [...current[setKey], { id: `${setKey}-${slug(label)}-${uid()}`, label, labelCy: newLabelCy.trim(), productive: false, createsMeeting: false }],
    }));
    setNewLabel("");
    setNewLabelCy("");
  };

  return <section className="rounded-3xl bg-white p-3"><h3 className="brand brand-text">{OPTION_SET_LABELS[setKey]}</h3><div className="mt-2 grid gap-2">{options.map((option) => <div className="rounded-2xl brand-soft p-2" key={option.id}><div className="grid grid-cols-[1fr_auto] gap-2"><div className="grid gap-2 sm:grid-cols-2"><label className="grid gap-1 text-[10px] font-black uppercase muted">{tx.englishLabel}<input className="input" value={option.label} onChange={(e) => updateOption(option.id, { label: e.target.value })} /></label><label className="grid gap-1 text-[10px] font-black uppercase muted">{tx.cymraegLabel}<input className="input" value={option.labelCy || ""} onChange={(e) => updateOption(option.id, { labelCy: e.target.value })} /></label></div><button className="btn soft text-red-700" onClick={() => deleteOption(option.id)}><Fa icon={faTrashCan} /></button></div>{setKey === "callOutcomes" && <div className="mt-2 grid gap-2 text-xs font-black uppercase muted sm:grid-cols-2"><label><input type="checkbox" checked={Boolean(option.productive)} onChange={(e) => updateOption(option.id, { productive: e.target.checked })} /> {tx.productive}</label><label><input type="checkbox" checked={Boolean(option.createsMeeting)} onChange={(e) => updateOption(option.id, { createsMeeting: e.target.checked })} /> {tx.createsMeeting}</label></div>}</div>)}</div><div className="mt-2 grid grid-cols-[1fr_auto] gap-2"><div className="grid gap-2 sm:grid-cols-2"><input className="input" placeholder={`${tx.addOption} - ${tx.englishLabel}`} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} /><input className="input" placeholder={`${tx.addOption} - ${tx.cymraegLabel}`} value={newLabelCy} onChange={(e) => setNewLabelCy(e.target.value)} /></div><button className="btn primary" onClick={addOption}><Fa icon={faCirclePlus} /></button></div></section>;
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

function OfflineSavePrompt({ tx, saveOffline, cancel }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><section className="panel shadow-card w-full max-w-md p-4"><h2 className="brand brand-text">{tx.offlinePromptTitle}</h2><p className="mt-2 muted">{tx.offlinePromptBody}</p><div className="mt-4 grid grid-cols-2 gap-2"><button className="btn primary" onClick={saveOffline}>{tx.saveOffline}</button><button className="btn soft" onClick={cancel}>{tx.cancel}</button></div></section></div>;
}

function CurrentFocus({ tx, schedule, setSchedule }) {
  const [editing, setEditing] = useState(false);
  const { current, next } = focusNow(schedule);
  const updateBlock = (id, patch) => setSchedule((items) => cleanFocusSchedule(items.map((block) => block.id === id ? { ...block, ...patch } : block)));
  const removeBlock = (id) => setSchedule((items) => cleanFocusSchedule(items.filter((block) => block.id !== id)));
  const addBlock = () => setSchedule((items) => cleanFocusSchedule([...items, { id: uid(), start: "09:00", end: "10:00", label: "Focus" }]));
  return <section className="panel shadow-card mb-3 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase brand-accent">{tx.currentFocus}</p><h2 className="brand brand-text">{current ? current.label : tx.noFocusNow}</h2><div className="text-xs muted">{current ? `${current.start} - ${current.end}` : ""}{next ? `  ${tx.nextFocus}: ${next.label} ${next.start}` : ""}</div></div><button className="btn soft" onClick={() => setEditing(!editing)}><Fa icon={faPenToSquare} /> <span className="hidden sm:inline">{tx.editSchedule}</span></button></div>{editing && <div className="mt-3 grid gap-2">{schedule.map((block) => <div key={block.id} className="grid gap-2 rounded-2xl brand-soft p-2 sm:grid-cols-[90px_90px_1fr_auto]"><input className="input" type="time" value={block.start} onChange={(e) => updateBlock(block.id, { start: e.target.value })} /><input className="input" type="time" value={block.end} onChange={(e) => updateBlock(block.id, { end: e.target.value })} /><input className="input" value={block.label} onChange={(e) => updateBlock(block.id, { label: e.target.value })} /><button className="btn soft text-red-700" onClick={() => removeBlock(block.id)}><Fa icon={faTrashCan} /></button></div>)}<button className="btn primary" onClick={addBlock}><Fa icon={faCirclePlus} /> <span>{tx.addFocusBlock}</span></button></div>}</section>;
}

function MeetingEditPanel({ tx, optionSets, meeting, updateMeeting, close }) {
  const [draft, setDraft] = useState(() => ({ ...meeting }));
  const save = () => {
    if (!draft.school || !draft.date || !draft.time) return alert(tx.required);
    updateMeeting(meeting.id, {
      contactName: draft.contactName || "",
      school: draft.school,
      type: draft.type,
      date: draft.date,
      time: draft.time,
      notes: draft.notes || "",
      teamsInviteSent: Boolean(draft.teamsInviteSent),
      doNotAddToKpis: Boolean(draft.doNotAddToKpis),
    });
    close();
  };
  return <div className="mt-3 rounded-3xl bg-white p-3"><div className="grid gap-2"><input className="input" placeholder={tx.contactName} value={draft.contactName || ""} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} /><input className="input" placeholder={tx.school} value={draft.school || ""} onChange={(e) => setDraft({ ...draft, school: e.target.value })} /><select className="input" value={draft.type || ""} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>{labelsFor(optionSets, "meetingTypes").map((x) => <option key={x}>{x}</option>)}</select><div className="grid grid-cols-2 gap-2"><input className="input" type="date" value={draft.date || todayValue()} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /><input className="input" type="time" value={draft.time || ""} onChange={(e) => setDraft({ ...draft, time: e.target.value })} /></div><textarea className="input min-h-[80px]" placeholder={tx.notes} value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /><label className="block rounded-2xl brand-soft p-2 text-xs font-black"><input type="checkbox" checked={Boolean(draft.teamsInviteSent)} onChange={(e) => setDraft({ ...draft, teamsInviteSent: e.target.checked })} /> {tx.teamsInviteSent}</label><label className="block rounded-2xl brand-soft p-2 text-xs font-black"><input type="checkbox" checked={Boolean(draft.doNotAddToKpis)} onChange={(e) => setDraft({ ...draft, doNotAddToKpis: e.target.checked })} /> {tx.doNotAddToKpis}</label><div className="grid grid-cols-2 gap-2"><button className="btn primary" onClick={save}><Fa icon={faFloppyDisk} /> <span>{tx.save}</span></button><button className="btn soft" onClick={close}><Fa icon={faXmark} /> <span>{tx.dismiss}</span></button></div></div></div>;
}

function MeetingsToday({ tx, optionSets, today, meetings, updateMeeting, removeMeeting }) {
  const [editingId, setEditingId] = useState(null);
  const copyEmail = (meeting) => copyToClipboard(meetingEmail(meeting)).then(() => alert(tx.copiedEmail));
  return <section className="panel shadow-card mb-3 p-3"><div className="flex justify-between gap-3"><div><p className="text-[10px] font-black uppercase brand-accent">{tx.meetingsToday}</p><h2 className="brand brand-text">{fmtLong(today)}</h2></div><span className="count-badge brand-pill">{meetings.length}</span></div><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{meetings.length ? meetings.map((m) => <div key={m.id} className="rounded-2xl brand-soft p-3"><div className="flex justify-between gap-2"><div className="min-w-0"><b>{m.time} - {m.school}</b><div className="text-xs muted">{m.contactName ? `${m.contactName} - ` : ""}{m.type}</div></div><div className="flex gap-1"><button className="btn soft bg-white" title={tx.editMeeting} onClick={() => setEditingId(editingId === m.id ? null : m.id)}><Fa icon={faPenToSquare} /></button><button className="btn soft bg-white text-red-700" title={tx.reset} onClick={() => removeMeeting(m.id)}><Fa icon={faTrashCan} /></button></div></div>{m.notes ? <p className="mt-2 whitespace-pre-wrap text-xs muted">{m.notes}</p> : null}<div className="mt-2 flex flex-wrap gap-2"><Pill good={m.teamsInviteSent}>{m.teamsInviteSent ? tx.teamsSent : tx.teamsNotSent}</Pill>{m.doNotAddToKpis ? <Pill warn>{tx.doNotAddToKpis}</Pill> : null}</div><button className="btn primary mt-2 w-full" onClick={() => copyEmail(m)}><Fa icon={faCopy} /> <span>{tx.copyEmail}</span></button>{editingId === m.id && <MeetingEditPanel tx={tx} optionSets={optionSets} meeting={m} updateMeeting={updateMeeting} close={() => setEditingId(null)} />}</div>) : <div className="rounded-2xl brand-soft p-3 text-xs muted">{tx.noMeetingsToday}</div>}</div></section>;
}

function SalesSummaryBar({ tx, salesSummary }) {
  return <section className="sales-summary-bar"><div className="sales-summary-pill"><span>{tx.totalSalesValue}</span><b>{formatMoney(salesSummary.totalSalesValue)}</b></div><div className="sales-summary-pill"><span>{tx.totalCommission}</span><b>{formatMoney(salesSummary.totalCommission)}</b></div></section>;
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

function KpiEditInput({ value, onCommit }) {
  const [draft, setDraft] = useState(String(value || 0));
  const commit = () => onCommit(draft);
  return <input className="input mt-2 text-center text-xl font-black" type="number" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />;
}

function Kpis(props) {
  const tx = props.tx;
  const [openForm, setOpenForm] = useState(null);
  const [listsFirst, setListsFirst] = useState(false);
  const toggle = (name) => setOpenForm(openForm === name ? null : name);
  const actionClass = (name) => "btn w-full text-left " + (openForm === name ? "primary" : "soft");

  const kpiCards = <div className="grid grid-cols-2 gap-2">{KPI_FIELDS.map(([key, label]) => { const target = getKpiTarget(key, props.view, props.period); const value = props.totals[key] || 0; const status = getKpiStatus(value, target); return <div key={key} className={"kpi-box kpi-" + status + " shadow-card p-3"}><div className="text-[10px] font-black uppercase muted">{label}</div>{props.editTotals ? <KpiEditInput key={`${key}-${value}`} value={value} onCommit={(next) => props.setTotal(key, next)} /> : <button className="mt-2 w-full rounded-2xl bg-white/65 p-3 text-left text-3xl font-black brand-text" onClick={() => props.addAdj(key)}>{value}</button>}{target ? <div className="mt-2 text-[10px] font-black uppercase muted">Target {target}</div> : null}</div>; })}</div>;
  const quickAdd = <div className="panel shadow-card p-3"><h2 className="brand brand-text">{tx.quickAdd}</h2><div className="mt-3 grid gap-2"><button className={actionClass("meeting")} onClick={() => toggle("meeting")}><Fa icon={openForm === "meeting" ? faMinus : faCirclePlus} /> <span>{tx.addMeeting}</span></button>{openForm === "meeting" && <div className="rounded-3xl brand-soft p-3"><input className="input" placeholder={tx.school} value={props.meetingForm.school} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, school: e.target.value })} /><input className="input mt-2" placeholder={tx.contactName} value={props.meetingForm.contactName || ""} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, contactName: e.target.value })} /><select className="input mt-2" value={props.meetingForm.type} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, type: e.target.value })}>{labelsFor(props.optionSets, "meetingTypes").map((x) => <option key={x}>{x}</option>)}</select><div className="mt-2 grid grid-cols-2 gap-2"><input className="input" type="date" value={props.meetingForm.date} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, date: e.target.value })} /><input className="input" type="time" value={props.meetingForm.time} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, time: e.target.value })} /></div><textarea className="input mt-2 min-h-[70px]" placeholder={tx.notes} value={props.meetingForm.notes || ""} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, notes: e.target.value })} /><label className="mt-2 block rounded-2xl bg-white p-2 text-xs font-black"><input type="checkbox" checked={props.meetingForm.teamsInviteSent} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, teamsInviteSent: e.target.checked })} /> {tx.teamsInviteSent}</label><label className="mt-2 block rounded-2xl bg-white p-2 text-xs font-black"><input type="checkbox" checked={Boolean(props.meetingForm.doNotAddToKpis)} onChange={(e) => props.setMeetingForm({ ...props.meetingForm, doNotAddToKpis: e.target.checked })} /> {tx.doNotAddToKpis}</label><button className="btn primary mt-2" onClick={props.addMeeting}><Fa icon={faCirclePlus} /> <span>{tx.addMeeting}</span></button></div>}<button className={actionClass("call")} onClick={() => toggle("call")}><Fa icon={openForm === "call" ? faMinus : faPhone} /> <span>{tx.addCall}</span></button>{openForm === "call" && <div className="rounded-3xl brand-soft p-3"><input className="input" placeholder={tx.school} value={props.callForm.school} onChange={(e) => props.setCallForm({ ...props.callForm, school: e.target.value })} /><select className="input mt-2" value={props.callForm.reason} onChange={(e) => props.setCallForm({ ...props.callForm, reason: e.target.value })}>{labelsFor(props.optionSets, "callReasons").map((x) => <option key={x}>{x}</option>)}</select><select className="input mt-2" value={props.callForm.outcome} onChange={(e) => props.setCallForm({ ...props.callForm, outcome: e.target.value })}>{labelsFor(props.optionSets, "callOutcomes").map((x) => <option key={x}>{x}</option>)}</select><textarea className="input mt-2 min-h-[90px]" placeholder={tx.notes} value={props.callForm.notes || ""} onChange={(e) => props.setCallForm({ ...props.callForm, notes: e.target.value })} /><label className="mt-2 block rounded-2xl bg-white p-2 text-xs font-black"><input type="checkbox" checked={Boolean(props.callForm.doNotAddToKpis)} onChange={(e) => props.setCallForm({ ...props.callForm, doNotAddToKpis: e.target.checked })} /> {tx.doNotAddToKpis}</label><button className="btn primary mt-2" onClick={props.addCall}><Fa icon={faPhone} /> <span>{tx.addCall}</span></button></div>}</div></div>;
  const lists = <section className="grid gap-3 lg:grid-cols-2"><List title={tx.meetings} count={props.meetings.length}>{props.meetings.map((m) => <div className="panel p-3" key={m.id}><div className="flex justify-between"><div><b>{m.school}</b><div className="text-xs muted">{fmtDate(m.date)} - {m.time || tx.dueTime} - {m.type}</div></div><button onClick={() => props.removeMeeting(m.id)}><Fa icon={faTrashCan} /></button></div><button onClick={() => props.toggleInvite(m.id)}><Pill good={m.teamsInviteSent} warn={!m.teamsInviteSent}>{m.teamsInviteSent ? tx.teamsSent : tx.teamsNotSent}</Pill></button></div>)}</List><List title={tx.calls} count={props.calls.length}>{props.calls.map((c) => <div className="panel p-3" key={c.id}><div className="flex justify-between gap-2"><div className="min-w-0 flex-1"><b>{c.school}</b><div className="mt-2 grid gap-1 text-xs"><div>{c.reason}</div><div>{c.outcome}</div>{c.notes && <div className="whitespace-pre-wrap">{c.notes}</div>}</div><div className="text-xs muted">{fmtDate(c.date)}</div></div><button onClick={() => props.removeCall(c.id)}><Fa icon={faTrashCan} /></button></div></div>)}</List></section>;
  return <main className="grid gap-3 lg:grid-cols-[320px_1fr]"><section className={"space-y-3 " + (listsFirst ? "order-2" : "")}><button className="btn soft w-full" onClick={() => setListsFirst(!listsFirst)}>{listsFirst ? "Quick add first" : "Lists first"}</button>{kpiCards}{quickAdd}</section><section className={listsFirst ? "order-1" : ""}>{lists}</section></main>;
}

function OpportunityEditPanel({ tx, optionSets, opportunity, update, close }) {
  const typeOptions = [...new Set([...labelsFor(optionSets, "opportunityTypes"), opportunity.opportunityType].filter(Boolean))];
  const [draft, setDraft] = useState(() => ({ ...opportunity }));
  const save = () => {
    if (![draft.school, draft.name, draft.opportunityType, draft.date, draft.endDate].every((value) => String(value || "").trim())) return alert(tx.required);
    update(opportunity.id, {
      school: draft.school.trim(),
      name: draft.name.trim(),
      opportunityName: draft.name.trim(),
      opportunityType: draft.opportunityType,
      jobTitle: draft.opportunityType,
      status: normalizeOpportunityStatus(draft.status),
      value: safeNumber(draft.value, 0),
      date: draft.date,
      endDate: draft.endDate,
      contactStatus: draft.contactStatus,
      emailStatus: draft.emailStatus,
      callStatus: draft.callStatus,
      lostReason: draft.lostReason || "",
      lostReasonOther: draft.lostReasonOther || "",
      wonDate: normalizeOpportunityStatus(draft.status) === "won" ? draft.wonDate || draft.closedDate || todayValue() : "",
      closedDate: normalizeOpportunityStatus(draft.status) === "pending" ? "" : draft.closedDate || todayValue(),
    });
    close();
  };
  return <div className="mt-3 rounded-3xl bg-white p-3"><div className="grid gap-2"><input className="input" placeholder={tx.opportunityName} value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><input className="input" placeholder={tx.school} value={draft.school || ""} onChange={(e) => setDraft({ ...draft, school: e.target.value })} /><select className="input" value={draft.opportunityType || ""} onChange={(e) => setDraft({ ...draft, opportunityType: e.target.value })}>{typeOptions.map((x) => <option key={x}>{x}</option>)}</select><input className="input" type="number" min="0" step="0.01" placeholder={tx.opportunityValue} value={draft.value || ""} onChange={(e) => setDraft({ ...draft, value: e.target.value })} /><div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-[10px] font-black uppercase muted">{tx.dateCreated}<input className="input" type="date" value={draft.date || todayValue()} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label><label className="grid gap-1 text-[10px] font-black uppercase muted">{tx.endDate}<input className="input" type="date" value={draft.endDate || draft.date || todayValue()} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></label></div><div className="grid gap-2 sm:grid-cols-3"><select className="input" value={draft.contactStatus || CONTACT_STATUSES[0]} onChange={(e) => setDraft({ ...draft, contactStatus: e.target.value })}>{CONTACT_STATUSES.map((x) => <option key={x}>{x}</option>)}</select><select className="input" value={draft.emailStatus || EMAIL_STATUSES[0]} onChange={(e) => setDraft({ ...draft, emailStatus: e.target.value })}>{EMAIL_STATUSES.map((x) => <option key={x}>{x}</option>)}</select><select className="input" value={draft.callStatus || CALL_STATUSES[0]} onChange={(e) => setDraft({ ...draft, callStatus: e.target.value })}>{CALL_STATUSES.map((x) => <option key={x}>{x}</option>)}</select></div><div className="grid grid-cols-2 gap-2"><button className="btn primary" onClick={save}><Fa icon={faFloppyDisk} /> <span>{tx.save}</span></button><button className="btn soft" onClick={close}><Fa icon={faXmark} /> <span>{tx.dismiss}</span></button></div></div></div>;
}

function OpportunityCard({ tx, optionSets, opportunity, updateOpp, remove }) {
  const [editing, setEditing] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);
  const [lostReason, setLostReason] = useState(LOST_REASONS[0]);
  const [lostReasonOther, setLostReasonOther] = useState("");
  const status = normalizeOpportunityStatus(opportunity.status);
  const lostText = opportunity.lostReason === "Other" && opportunity.lostReasonOther ? opportunity.lostReasonOther : opportunity.lostReason;
  const markLost = () => {
    if (!lostReason || (lostReason === "Other" && !lostReasonOther.trim())) return alert(tx.required);
    updateOpp(opportunity.id, { status: "lost", lostReason, lostReasonOther: lostReason === "Other" ? lostReasonOther.trim() : "" });
    setMarkingLost(false);
  };
  return <div className="panel shadow-card opportunity-card p-3"><div className="flex justify-between gap-2"><div className="min-w-0"><b>{opportunity.name || opportunity.opportunityName}</b><div className="text-xs muted">{opportunity.school} - {opportunityTypeLabel(opportunity)}</div></div><div className="flex flex-wrap justify-end gap-1"><button className="btn soft bg-white" title={tx.editTask} onClick={() => setEditing(!editing)}><Fa icon={faPenToSquare} /></button><button className="btn soft bg-white text-red-700" onClick={() => remove(opportunity.id)}><Fa icon={faTrashCan} /></button></div></div><div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">{status === "pending" && <><Pill>{tx.contactStatus}: {opportunity.contactStatus}</Pill><Pill warn={opportunityDeadlineLabel(opportunity, tx) === tx.pastDeadline}>{opportunityDeadlineLabel(opportunity, tx)}</Pill><Pill>{tx.emailStatus}: {opportunity.emailStatus}</Pill><Pill>{tx.callStatus}: {opportunity.callStatus}</Pill><div className="rounded-2xl bg-white/70 p-2 font-black">{opportunityLastActivity(opportunity, tx)}</div><div className="rounded-2xl bg-white/70 p-2 font-black">{tx.suggestedAction}: {opportunitySuggestedAction(opportunity, tx)}</div><div className="rounded-2xl bg-white/70 p-2 font-black">{formatMoney(opportunity.value)}</div></>}{status === "won" && <><Pill good>{tx.won}</Pill><Pill>{tx.closedDate}: {fmtDate(opportunity.closedDate || opportunity.wonDate)}</Pill><div className="rounded-2xl bg-white/70 p-2 font-black">{formatMoney(opportunity.value)}</div><div className="rounded-2xl bg-white/70 p-2 font-black">{tx.totalCommission}: {formatMoney(Number(opportunity.value || 0) * 0.1)}</div><Pill>{tx.emailStatus}: {opportunity.emailStatus}</Pill><Pill>{tx.callStatus}: {opportunity.callStatus}</Pill></>}{status === "lost" && <><Pill warn>{tx.lost}</Pill><Pill>{tx.lostReason}: {lostText}</Pill><div className="rounded-2xl bg-white/70 p-2 font-black">{opportunityLastActivity(opportunity, tx)}</div><div className="rounded-2xl bg-white/70 p-2 font-black">{formatMoney(opportunity.value)}</div><Pill>{tx.emailStatus}: {opportunity.emailStatus}</Pill><Pill>{tx.callStatus}: {opportunity.callStatus}</Pill></>}</div><div className="mt-3 grid gap-2 sm:grid-cols-3">{status === "pending" && <><button className="btn primary" onClick={() => updateOpp(opportunity.id, { status: "won" })}>{tx.markAsWon}</button><button className="btn soft" onClick={() => setMarkingLost(!markingLost)}>{tx.markAsLost}</button></>}{status !== "pending" && <button className="btn primary" onClick={() => updateOpp(opportunity.id, { status: "pending" })}>{tx.reopenOpportunity}</button>}<button className="btn soft" onClick={() => setEditing(!editing)}>{tx.editTask}</button></div>{markingLost && <div className="mt-2 rounded-3xl bg-white p-3"><select className="input" value={lostReason} onChange={(e) => setLostReason(e.target.value)}>{LOST_REASONS.map((reason) => <option key={reason}>{reason}</option>)}</select>{lostReason === "Other" && <input className="input mt-2" placeholder={tx.otherLostReason} value={lostReasonOther} onChange={(e) => setLostReasonOther(e.target.value)} />}<button className="btn primary mt-2" onClick={markLost}>{tx.markAsLost}</button></div>}{editing && <OpportunityEditPanel tx={tx} optionSets={optionSets} opportunity={opportunity} update={updateOpp} close={() => setEditing(false)} />}</div>;
}

function OpportunitiesTab({ tx, optionSets, form, setForm, add, opportunities, remove, updateOpp }) {
  const typeOptions = labelsFor(optionSets, "opportunityTypes");
  const inProgress = opportunities.filter((opp) => normalizeOpportunityStatus(opp.status) === "pending");
  const won = opportunities.filter((opp) => normalizeOpportunityStatus(opp.status) === "won");
  const lost = opportunities.filter((opp) => normalizeOpportunityStatus(opp.status) === "lost");
  const render = (items) => items.map((o) => <OpportunityCard key={o.id} tx={tx} optionSets={optionSets} opportunity={o} updateOpp={updateOpp} remove={remove} />);
  return <main className="grid gap-3 lg:grid-cols-[340px_1fr]"><section className="panel shadow-card p-3"><h2 className="brand brand-text">{tx.addOpportunity}</h2><div className="mt-2 grid gap-2"><input className="input" placeholder={tx.opportunityName} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input className="input" placeholder={tx.school} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /><select className="input" value={form.opportunityType || typeOptions[0] || ""} onChange={(e) => setForm({ ...form, opportunityType: e.target.value })}>{typeOptions.map((x) => <option key={x}>{x}</option>)}</select><input className="input" type="number" min="0" step="0.01" placeholder={tx.opportunityValue} value={form.value || ""} onChange={(e) => setForm({ ...form, value: e.target.value })} /><label className="grid gap-1 text-[10px] font-black uppercase muted">{tx.endDate}<input className="input" type="date" value={form.endDate || todayValue()} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label><button className="btn primary" onClick={add}><Fa icon={faCirclePlus} /> <span>{tx.addOpportunity}</span></button></div></section><section className="grid gap-3"><List title={tx.inProgressOpportunities} count={inProgress.length}>{render(inProgress)}</List><List title={tx.wonOpportunities} count={won.length}>{render(won)}</List><List title={tx.lostOpportunities} count={lost.length}>{render(lost)}</List></section></main>;
}

function LevelUps({ tx, levelUps, form, setForm, add, toggle, remove }) {
  return <main className="grid gap-3 lg:grid-cols-[340px_1fr]"><section className="panel shadow-card p-3"><h2 className="brand brand-text">{tx.addLevelUp}</h2><div className="mt-2 grid gap-2"><input className="input" placeholder={tx.school} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /><button className="btn primary" onClick={add}><Fa icon={faRocket} /> <span>{tx.addLevelUp}</span></button></div></section><List title={tx.levelUps} count={levelUps.length}>{levelUps.map((item) => <div className="panel shadow-card p-3" key={item.id}><div className="flex justify-between gap-2"><div><b>{item.school}</b><div className="text-xs muted">{fmtDate(item.date || String(item.createdAt || todayValue()).slice(0, 10))}</div></div><button onClick={() => remove(item.id)}><Fa icon={faTrashCan} /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><button className={statusClass(item.onlineForm)} onClick={() => toggle(item.id, "onlineForm")}><span>{tx.onlineForm}</span><b>{item.onlineForm}</b></button><button className={statusClass(item.careerSite)} onClick={() => toggle(item.id, "careerSite")}><span>{tx.careerSite}</span><b>{item.careerSite}</b></button></div></div>)}</List></main>;
}

function TaskEditPanel({ tx, optionSets, task, update, close }) {
  const taskChoices = [...new Set([...labelsFor(optionSets, "taskTypes"), task.type, tx.otherTask].filter(Boolean))];
  const [draft, setDraft] = useState(() => ({ ...task }));
  const save = () => {
    if (![draft.title, draft.school, draft.type, draft.dueDate, draft.dueTime].every((value) => String(value || "").trim())) return alert(tx.required);
    update(task.id, {
      title: draft.title.trim(),
      school: draft.school.trim(),
      type: draft.type,
      notes: draft.notes || "",
      dueDate: draft.dueDate,
      dueTime: draft.dueTime,
      priority: draft.priority || "normal",
      urgent: draft.priority === "urgent",
    });
    close();
  };
  return <div className="mt-3 rounded-3xl bg-white p-3"><div className="grid gap-2"><input className="input" placeholder={tx.task} value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /><input className="input" placeholder={tx.school} value={draft.school || ""} onChange={(e) => setDraft({ ...draft, school: e.target.value })} /><select className="input" value={draft.type || ""} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>{taskChoices.map((x) => <option key={x}>{x}</option>)}</select><textarea className="input min-h-[80px]" placeholder={tx.notes} value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /><div className="grid grid-cols-2 gap-2"><input className="input" type="date" value={draft.dueDate || todayValue()} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} /><input className="input" type="time" value={draft.dueTime || ""} onChange={(e) => setDraft({ ...draft, dueTime: e.target.value })} /></div><div className="grid grid-cols-2 gap-2">{PRIORITIES.map((priority) => <button key={priority.value} className={"priority-choice priority-" + priority.value + (draft.priority === priority.value ? " selected" : "")} onClick={() => setDraft({ ...draft, priority: priority.value })}>{priorityLabel(priority.value, tx)}</button>)}</div><div className="grid grid-cols-2 gap-2"><button className="btn primary" onClick={save}><Fa icon={faFloppyDisk} /> <span>{tx.updateTask}</span></button><button className="btn soft" onClick={close}><Fa icon={faXmark} /> <span>{tx.dismiss}</span></button></div></div></div>;
}

function TaskCard({ tx, optionSets, task, noteMap, toggle, update, remove, openNote }) {
  const [editing, setEditing] = useState(false);
  const linkedNote = task.linkedNoteId && noteMap[task.linkedNoteId];
  return <div className={taskCardClass(task)}><div className="flex gap-2"><button className={"h-6 w-6 rounded-full border text-xs " + (task.completed ? "bg-green-600 text-white" : "")} onClick={() => toggle(task.id)}><Fa icon={faCheck} /></button><div className="min-w-0 flex-1"><b className={task.completed ? "line-through muted" : ""}>{task.title}</b><div className="text-xs muted">{task.school} - {task.type}</div><Pill warn={taskPriority(task) === "urgent"}>{priorityLabel(taskPriority(task), tx)} - {task.dueDate} - {task.dueTime}</Pill>{task.notes ? <p className="mt-2 whitespace-pre-wrap text-xs muted">{task.notes}</p> : null}{linkedNote && <div><button className="btn soft mt-2" onClick={() => openNote(task.linkedNoteId)}><Fa icon={faNoteSticky} /> <span>{tx.goToNote}</span></button></div>}</div><div className="flex flex-col gap-1"><button title={tx.editTask} onClick={() => setEditing(!editing)}><Fa icon={faPenToSquare} /></button><button onClick={() => remove(task.id)}><Fa icon={faTrashCan} /></button></div></div>{editing && <TaskEditPanel tx={tx} optionSets={optionSets} task={task} update={update} close={() => setEditing(false)} />}</div>;
}

function Tasks({ tx, optionSets, live, closed, form, setForm, add, update, toggle, remove, notes, openNote, totals, salesSummary, meetings, calls, levelUps }) {
  const noteMap = Object.fromEntries(notes.map((n) => [n.id, n]));
  const [formFirst, setFormFirst] = useState(false);
  const copyTasks = () => {
    const additions = prompt(tx.additionsOther, "") || "";
    const message = dailySummaryMessage({ tx, totals, salesSummary, meetings, calls, levelUps, additions });
    copyToClipboard(message).then(() => alert(tx.copiedTasks));
  };
  const taskChoices = [...labelsFor(optionSets, "taskTypes"), tx.otherTask];
  const renderCard = (task) => <TaskCard key={task.id} tx={tx} optionSets={optionSets} task={task} noteMap={noteMap} toggle={toggle} update={update} remove={remove} openNote={openNote} />;
  const lists = <section className="space-y-3"><div className="grid grid-cols-2 gap-2"><button className="btn primary" onClick={copyTasks}><Fa icon={faCopy} /> <span>{tx.copyDailySummary}</span></button><button className="btn soft" onClick={() => setFormFirst(!formFirst)}>{formFirst ? "Tasks first" : "Form first"}</button></div><List title={tx.liveTasks} count={live.length} empty={tx.noLiveTasks}>{live.map(renderCard)}</List><List title={tx.closedTasks} count={closed.length} empty={tx.noClosedTasks}>{closed.map(renderCard)}</List></section>;
  const formPanel = <section className="panel shadow-card p-3"><h2 className="brand brand-text">{tx.addTask}</h2><div className="mt-2 grid gap-2"><input className="input" placeholder={tx.school} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{taskChoices.map((x) => <option key={x}>{x}</option>)}</select>{form.type === tx.otherTask && <input className="input" placeholder={tx.otherTaskName} value={form.otherTitle || ""} onChange={(e) => setForm({ ...form, otherTitle: e.target.value })} />}<textarea className="input min-h-[80px]" placeholder={tx.notes} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /><div className="grid grid-cols-2 gap-2"><input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /><input className="input" type="time" value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} /></div><div className="grid grid-cols-2 gap-2">{PRIORITIES.map((priority) => <button key={priority.value} className={"priority-choice priority-" + priority.value + (form.priority === priority.value ? " selected" : "")} onClick={() => setForm({ ...form, priority: priority.value })}>{priorityLabel(priority.value, tx)}</button>)}</div><div className="grid grid-cols-2 gap-2"><button className="btn primary" onClick={() => add()}><Fa icon={faCirclePlus} /> <span>{tx.addTask}</span></button><button className="btn soft" onClick={() => add({ completed: true })}><Fa icon={faCheck} /> <span>{tx.completedTask}</span></button></div></div></section>;
  return <main className="grid gap-3 lg:grid-cols-[1fr_320px]">{formFirst ? <>{formPanel}{lists}</> : <>{lists}{formPanel}</>}</main>;
}

function NotesToSelf({ tx, notesToSelf, text, setText, add, remove }) {
  const [open, setOpen] = useState(true);
  return <section className="panel shadow-card p-3"><button className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen(!open)}><h2 className="brand brand-text">{tx.notesToSelf}</h2><Fa icon={open ? faChevronUp : faChevronDown} /></button>{open && <div className="mt-2 grid gap-2"><textarea className="input min-h-[100px]" placeholder={tx.notes} value={text} onChange={(e) => setText(e.target.value)} /><button className="btn primary" onClick={add}><Fa icon={faNoteSticky} /> <span>{tx.addNoteToSelf}</span></button><div className="grid gap-2">{notesToSelf.length ? notesToSelf.map((note) => <div className="rounded-2xl brand-soft p-2" key={note.id}><div className="flex justify-between gap-2"><div><b className="text-xs muted">{fmtStamp(note.createdAt)}</b><p className="mt-1 whitespace-pre-wrap text-sm">{note.text}</p></div><button onClick={() => remove(note.id)}><Fa icon={faTrashCan} /></button></div></div>) : <div className="rounded-2xl brand-soft p-3 text-xs muted">{tx.noNotesToSelf}</div>}</div></div>}</section>;
}

function Notes({ tx, optionSets, notes, notesToSelf, selfNoteText, setSelfNoteText, addSelfNote, removeSelfNote, tasks, form, setForm, addNote, remove, toggleTask }) {
  const taskById = Object.fromEntries(tasks.map((task) => [task.id, task]));
  const [showTask, setShowTask] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [draftTasks, setDraftTasks] = useState([]);
  const [draftMeetings, setDraftMeetings] = useState([]);
  const [draftLevelUps, setDraftLevelUps] = useState([]);
  const [draftTask, setDraftTask] = useState({ type: firstOptionLabel(optionSets, "taskTypes"), otherTitle: "", notes: "", dueDate: todayValue(), dueTime: "", priority: "normal", urgent: false });
  const [draftMeeting, setDraftMeeting] = useState({ type: firstOptionLabel(optionSets, "meetingTypes"), date: todayValue(), time: "", teamsInviteSent: false });
  const addDraftTask = () => { const title = taskTitleFromForm(draftTask, tx); if (!title || !draftTask.type || !draftTask.dueDate || !draftTask.dueTime) return alert(tx.requiredTask); setDraftTasks((current) => [{ ...draftTask, id: uid(), title, notes: draftTask.notes || "", priority: draftTask.priority || "normal", urgent: draftTask.priority === "urgent" }, ...current]); setDraftTask({ type: firstOptionLabel(optionSets, "taskTypes"), otherTitle: "", notes: "", dueDate: todayValue(), dueTime: "", priority: "normal", urgent: false }); };
  const addDraftMeeting = () => { if (!form.school.trim() || !draftMeeting.type || !draftMeeting.date || !draftMeeting.time) return alert(tx.required); setDraftMeetings((current) => [{ ...draftMeeting, id: uid() }, ...current]); setDraftMeeting({ type: firstOptionLabel(optionSets, "meetingTypes"), date: todayValue(), time: "", teamsInviteSent: false }); };
  const addDraftFollowUpEmail = () => { if (!form.school.trim()) return alert(tx.required); const linkedMeeting = draftMeetings[0]; setDraftTasks((current) => [{ id: uid(), title: followUpEmailTitle(form.school.trim()), type: tx.followUpEmail, notes: "", dueDate: todayValue(), dueTime: "16:30", priority: "normal", urgent: false, followUpEmail: true, autoFollowUpMeetingId: linkedMeeting ? linkedMeeting.id : "" }, ...current]); };
  const addDraftLevelUp = () => { if (!form.school.trim()) return alert(tx.required); setDraftLevelUps((current) => [{ id: uid(), onlineForm: "Pending", careerSite: "Pending" }, ...current]); };
  const save = (kind) => { if (addNote(kind, draftTasks, draftMeetings, draftLevelUps)) { setDraftTasks([]); setDraftMeetings([]); setDraftLevelUps([]); setShowTask(false); setShowFollowUp(false); setDraftTask({ type: firstOptionLabel(optionSets, "taskTypes"), otherTitle: "", notes: "", dueDate: todayValue(), dueTime: "", priority: "normal", urgent: false }); setDraftMeeting({ type: firstOptionLabel(optionSets, "meetingTypes"), date: todayValue(), time: "", teamsInviteSent: false }); } };
  return <main className="grid gap-3 lg:grid-cols-[1fr_380px]"><List title={tx.notesList} count={notes.length}>{notes.map((note) => <div className="panel shadow-card p-3" key={note.id}><div className="flex justify-between"><div><b>{note.school}</b><div className="text-[10px] font-black uppercase muted">{note.kind === "call" ? tx.callNote : tx.meetingNote} - {fmtStamp(note.createdAt)}</div></div><button onClick={() => remove(note.id)}><Fa icon={faTrashCan} /></button></div><p className="mt-3 whitespace-pre-wrap text-sm">{note.notes}</p>{note.tasks && note.tasks.length > 0 && <div className="mt-3 rounded-3xl brand-soft p-3"><b className="text-xs uppercase brand-text">{tx.dynamicTasks}</b>{note.tasks.map((task) => { const liveTask = taskById[task.id]; const complete = Boolean(liveTask && liveTask.completed); return <div key={task.id} className="mt-2 rounded-2xl bg-white p-2"><div className="flex gap-2"><button onClick={() => liveTask && toggleTask(task.id)} className={"h-6 w-6 rounded-full border text-xs " + (complete ? "bg-green-600 text-white" : "")}><Fa icon={faCheck} /></button><div><b className={complete ? "line-through muted" : ""}>{task.title}</b><div className="text-xs muted">{task.type} - {task.dueDate} - {task.dueTime}</div></div></div></div>; })}</div>}{note.followUps && note.followUps.length > 0 && <div className="mt-3 rounded-3xl bg-orange-50 p-3"><b className="text-xs uppercase text-orange-700">{tx.meetings}</b>{note.followUps.map((meeting) => <div className="mt-2 rounded-2xl bg-white p-2" key={meeting.id}><b>{meeting.type}</b><div className="text-xs muted">{meeting.date} - {meeting.time} - {meeting.teamsInviteSent ? tx.teamsSent : tx.teamsNotSent}</div></div>)}</div>}{note.levelUps && note.levelUps.length > 0 && <div className="mt-3 rounded-3xl bg-green-50 p-3"><b className="text-xs uppercase text-green-700">{tx.levelUps}</b>{note.levelUps.map((item) => <div className="mt-2 rounded-2xl bg-white p-2" key={item.id}><b>{item.school}</b><div className="text-xs muted">{tx.onlineForm}: {item.onlineForm} - {tx.careerSite}: {item.careerSite}</div></div>)}</div>}</div>)}</List><section className="space-y-3"><NotesToSelf tx={tx} notesToSelf={notesToSelf} text={selfNoteText} setText={setSelfNoteText} add={addSelfNote} remove={removeSelfNote} /><section className="panel shadow-card p-3"><h2 className="brand brand-text">{tx.addNote}</h2><p className="text-xs muted">{tx.noteHelp}</p><div className="mt-2 grid gap-2"><input className="input" placeholder={tx.client} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /><textarea className="input min-h-[180px]" placeholder={tx.notes} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /><button className="btn soft" onClick={() => setShowTask(!showTask)}>{showTask ? tx.hideTask : tx.createTask}</button>{showTask && <div className="rounded-3xl brand-soft p-3"><select className="input" value={draftTask.type} onChange={(e) => setDraftTask({ ...draftTask, type: e.target.value })}>{[...labelsFor(optionSets, "taskTypes"), tx.otherTask].map((x) => <option key={x}>{x}</option>)}</select>{draftTask.type === tx.otherTask && <input className="input mt-2" placeholder={tx.otherTaskName} value={draftTask.otherTitle || ""} onChange={(e) => setDraftTask({ ...draftTask, otherTitle: e.target.value })} />}<textarea className="input mt-2 min-h-[70px]" placeholder={tx.notes} value={draftTask.notes || ""} onChange={(e) => setDraftTask({ ...draftTask, notes: e.target.value })} /><div className="mt-2 grid grid-cols-2 gap-2"><input className="input" type="date" value={draftTask.dueDate} onChange={(e) => setDraftTask({ ...draftTask, dueDate: e.target.value })} /><input className="input" type="time" value={draftTask.dueTime} onChange={(e) => setDraftTask({ ...draftTask, dueTime: e.target.value })} /></div><div className="mt-2 grid grid-cols-2 gap-2">{PRIORITIES.map((priority) => <button key={priority.value} className={"priority-choice priority-" + priority.value + (draftTask.priority === priority.value ? " selected" : "")} onClick={() => setDraftTask({ ...draftTask, priority: priority.value })}>{priorityLabel(priority.value, tx)}</button>)}</div><button className="btn primary mt-2" onClick={addDraftTask}><Fa icon={faListCheck} /> <span>{tx.addTaskToNote}</span></button></div>}{draftTasks.length > 0 && <div className="rounded-3xl bg-blue-50 p-3"><b className="text-xs uppercase text-blue-700">{tx.tasksWaiting}</b>{draftTasks.map((task) => <div className="panel mt-2 p-2" key={task.id}><div className="flex justify-between"><div><b>{task.title}</b><div className="text-xs muted">{task.type} - {task.dueDate} - {task.dueTime}</div></div><button onClick={() => setDraftTasks(draftTasks.filter((x) => x.id !== task.id))}><Fa icon={faTrashCan} /></button></div></div>)}</div>}<button className="btn soft" onClick={() => setShowFollowUp(!showFollowUp)}>{showFollowUp ? tx.hideFollowUp : tx.createFollowUp}</button>{showFollowUp && <div className="rounded-3xl brand-soft p-3"><select className="input" value={draftMeeting.type} onChange={(e) => setDraftMeeting({ ...draftMeeting, type: e.target.value })}>{labelsFor(optionSets, "meetingTypes").map((x) => <option key={x}>{x}</option>)}</select><div className="mt-2 grid grid-cols-2 gap-2"><input className="input" type="date" value={draftMeeting.date} onChange={(e) => setDraftMeeting({ ...draftMeeting, date: e.target.value })} /><input className="input" type="time" value={draftMeeting.time} onChange={(e) => setDraftMeeting({ ...draftMeeting, time: e.target.value })} /></div><label className="mt-2 block rounded-2xl bg-white p-2 text-xs font-black"><input type="checkbox" checked={draftMeeting.teamsInviteSent} onChange={(e) => setDraftMeeting({ ...draftMeeting, teamsInviteSent: e.target.checked })} /> {tx.teamsInviteSent}</label><button className="btn primary mt-2" onClick={addDraftMeeting}><Fa icon={faCalendarDays} /> <span>{tx.addFollowUpToNote}</span></button></div>}<button className="btn soft" onClick={addDraftFollowUpEmail}><Fa icon={faEnvelope} /> <span>{tx.createFollowUpEmail}</span></button>{draftMeetings.length > 0 && <div className="rounded-3xl bg-orange-50 p-3"><b className="text-xs uppercase text-orange-700">{tx.followUpsWaiting}</b>{draftMeetings.map((meeting) => <div className="panel mt-2 p-2" key={meeting.id}><div className="flex justify-between"><div><b>{form.school || tx.client}</b><div className="text-xs muted">{meeting.type} - {meeting.date} - {meeting.time}</div></div><button onClick={() => setDraftMeetings(draftMeetings.filter((x) => x.id !== meeting.id))}><Fa icon={faTrashCan} /></button></div></div>)}</div>}<button className="btn soft" onClick={addDraftLevelUp}><Fa icon={faRocket} /> <span>{tx.addLevelUpToNote}</span></button>{draftLevelUps.length > 0 && <div className="rounded-3xl bg-green-50 p-3"><b className="text-xs uppercase text-green-700">{tx.levelUpsWaiting}</b>{draftLevelUps.map((item) => <div className="panel mt-2 p-2" key={item.id}><div className="flex justify-between"><div><b>{form.school || tx.client}</b><div className="text-xs muted">{tx.onlineForm}: {item.onlineForm} - {tx.careerSite}: {item.careerSite}</div></div><button onClick={() => setDraftLevelUps(draftLevelUps.filter((x) => x.id !== item.id))}><Fa icon={faTrashCan} /></button></div></div>)}</div>}<div className="grid grid-cols-2 gap-2"><button className="btn primary" onClick={() => save("meeting")}><Fa icon={faCalendarDays} /> <span>{tx.saveMeeting}</span></button><button className="btn primary" onClick={() => save("call")}><Fa icon={faPhone} /> <span>{tx.saveCall}</span></button></div></div></section></section></main>;
}
