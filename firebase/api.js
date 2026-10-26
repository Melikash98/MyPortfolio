import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, reauthenticateWithCredential, updatePassword, deleteUser, signOut, } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getDatabase, ref, set, get, remove, push, update, serverTimestamp, query, orderByChild, onValue, limitToLast, } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-storage.js";

const firebaseConfig = {

    apiKey: "AIzaSyArdlRSva6lyH16eU9DoDq2A9w-tdnp-LA",
    authDomain: "portfolio-f66fb.firebaseapp.com",
    databaseURL: "https://portfolio-f66fb-default-rtdb.firebaseio.com",
    projectId: "portfolio-f66fb",
    storageBucket: "portfolio-f66fb.firebasestorage.app",
    messagingSenderId: "318296087904",
    appId: "1:318296087904:web:2c42c12c5faae711085205",
    measurementId: "G-K0FTMSERZ8"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);



const HOME_PATH = "webdatabase/home";
const CACHE_KEY = "portfolio:home:v1";
const REST_TIMEOUT_MS = 6000;
 
const DEFAULT_HOME = {
    name: "Melika Shooryabi",
    roleWork: "Software Engineer & Backend Developer",
    greeting: "Hallo,",
    image: "images/me2.png",
    downloadCV: "pdf/Lebenslauf.pdf",
    roleAnimation: ["Melika", "Software Developer", "Backend Developer", "Android Developer"],
    details: {
        yearsExperience: 4,
        completedProjects: 18,
        numberCourses: 6
    }
};
 
const byId = (id) => document.getElementById(id);
 
const pick = (...values) =>
    values.find((v) => v !== undefined && v !== null && v !== "");
 
const toList = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value && typeof value === "object") return Object.values(value).filter(Boolean);
    return [];
};
 
function setName(el, fullName) {
    if (!el || !fullName) return;
 
    const parts = String(fullName).trim().split(/\s+/);
    const last = parts.length > 1 ? parts.pop() : "";
 
    el.textContent = parts.join(" ");
 
    if (last) {
        el.append(" ");
        const span = document.createElement("span");
        span.textContent = last;
        el.appendChild(span);
    }
}
 
function setText(el, value) {
    if (!el || value === undefined) return;
    if (el.textContent !== value) el.textContent = value;
}
 
function setStat(containerId, value) {
    const number = byId(containerId)?.querySelector(".exInfo-number");
    if (!number || value === undefined || value === null || value === "") return;
    number.textContent = `+${value}`;
}
 
function setGreeting(selector, greeting) {
    const el = document.querySelector(selector);
    if (!el || !greeting) return;
 
    const textNode = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
    const text = `${String(greeting).trim()} `;
 
    if (textNode) {
        textNode.textContent = text;
    } else {
        el.insertBefore(document.createTextNode(text), el.firstChild);
    }
}
 
function toDownloadUrl(url) {
    if (typeof url !== "string") return url;
    if (url.includes("res.cloudinary.com") && url.includes("/upload/") && !url.includes("fl_attachment")) {
        return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
}
 
let lastRolesKey = "";
 
function renderHome(data) {
    if (!data) return;
 
    const details = data.details || {};
 
    const name = pick(data.name);
    const roleWork = pick(data.roleWork);
    const greeting = pick(data.greeting);
    const image = pick(data.image);
    const cv = pick(data.downloadCV);
 
    const years = pick(details.yearsExperience, data.yearsExperience);
    const projects = pick(details.completedProjects, data.completedProjects);
    const courses = pick(details.numberCourses, data.numberCourses);
 
    setName(byId("profile-name-desktop"), name);
    setName(byId("profile-name-compact"), name);
 
    setText(byId("profile-role-desktop"), roleWork);
    setText(byId("profile-role-compact"), roleWork);
 
    setGreeting(".startText", greeting);
    setGreeting(".startTextTwo", greeting);
 
    const photo = byId("profile-photo");
    if (photo && image && photo.getAttribute("src") !== image) photo.src = image;
 
    setStat("profile-stat-experience", years);
    setStat("profile-stat-projects", projects);
    setStat("profile-stat-courses", courses);
 
    const cvLink = byId("profile-cv-download");
    if (cvLink && cv) {
        cvLink.href = toDownloadUrl(cv);
        cvLink.target = "_blank";
        cvLink.rel = "noopener noreferrer";
    }
 
    // restart the typing animation only if the roles really changed
    const roles = toList(data.roleAnimation).map((r) => String(r).trim()).filter(Boolean);
    const rolesKey = JSON.stringify(roles);
 
    if (roles.length && rolesKey !== lastRolesKey) {
        lastRolesKey = rolesKey;
        window.dispatchEvent(new CustomEvent("home:updated", { detail: { roles } }));
    }
}
 
/* ---------- cache ---------- */
function readCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}
 
function writeCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
        /* storage full or blocked - ignore */
    }
}
 
/* ---------- REST (fast first load) ---------- */
async function fetchHomeRest() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REST_TIMEOUT_MS);
 
    try {
        const url = `${firebaseConfig.databaseURL}/${HOME_PATH}.json`;
        const response = await fetch(url, { signal: controller.signal });
 
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
 
        return await response.json(); // null when the path is empty
    } finally {
        clearTimeout(timer);
    }
}
 
/* ---------- SDK realtime (loaded lazily, after first paint) ---------- */
async function startRealtime() {
    try {
        const { getDatabase, ref, onValue } = await import(
            "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js"
        );
 
        const db = getDatabase(app);
 
        onValue(
            ref(db, HOME_PATH),
            (snapshot) => {
                if (!snapshot.exists()) return;
                const data = snapshot.val();
                writeCache(data);
                renderHome(data);
            },
            (error) => {
                console.warn("[Firebase] Realtime listener error:", error.code, error.message);
            }
        );
    } catch (error) {
        console.warn("[Firebase] Realtime updates not available:", error);
    }
}
 
/* ---------- Analytics (lazy, never blocks the page) ---------- */
async function startAnalytics() {
    try {
        const { getAnalytics } = await import(
            "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js"
        );
        getAnalytics(app);
    } catch (error) {
        console.warn("[Firebase] Analytics not started:", error);
    }
}
 
/* ---------- boot ---------- */
async function initHome() {
    // 1) instant paint from cache (repeat visitors)
    const cached = readCache();
    if (cached) renderHome(cached);
 
    // 2) fresh data over REST
    try {
        const data = await fetchHomeRest();
 
        if (!data) {
            throw new Error(`no data at /${HOME_PATH}`);
        }
 
        writeCache(data);
        renderHome(data);
        console.info("[Firebase] Home data loaded.");
    } catch (error) {
        console.error(
            `[Firebase] Could not load home data (${error.name === "AbortError" ? "timeout" : error.message}).`,
            cached ? "Showing last saved values." : "Showing default values."
        );
 
        if (!cached) renderHome(DEFAULT_HOME);
    }
 
    // 3) live updates + analytics, only after the important work is done
    startRealtime();
    startAnalytics();
}
 
initHome();
 