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
 

const EXPERIENCE_PATH = "webdatabase/experience/Experience";
const EXPERIENCE_CACHE_KEY = "portfolio:experience:v1";
 
// database key -> data-record-document-id in the HTML (optional, name matching is the fallback)
const EXPERIENCE_KEY_MAP = {
    Experience1: "iran-technical-vocational",
    Experience2: "karlancer",
    Experience3: "iranian-school-qatar",
    Experience4: "tose-ertebatat-network",
};
 
// accepted field names (first non-empty one wins)
const EXP_FIELDS = {
    company: ["companyName", "company", "name"],
    title: ["jobTitle", "title", "position", "roleName", "job", "roleEx"],
    start: ["start", "startDate", "from"],
    end: ["end", "endDate", "to"],
    time: ["time", "duration"],
    logo: ["logo", "image", "img", "companyLogo"],
    descriptions: ["descriptions", "description", "details"],
    roles: ["moreRoleEx", "roles", "moreRoles"],
    docId: ["docId", "documentId"]
};
 
const EXP_ROLE_FIELDS = {
    name: ["namePo", "name", "title"],
    start: ["startR", "start"],
    end: ["endR", "end"],
    text: ["roleMe", "description", "descriptions"]
};
 
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
 
const norm = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
 
function getStr(obj, keys) {
    for (const key of keys) {
        const value = obj?.[key];
        if (typeof value === "string" || typeof value === "number") {
            const text = String(value).trim();
            if (text) return text;
        }
    }
    return "";
}
 
// object -> [[key, value], ...] sorted naturally (Experience2 before Experience10)
function entriesOf(value) {
    if (!value || typeof value !== "object") return [];
 
    return Object.entries(value)
        .filter(([, v]) => v && typeof v === "object")
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
}
 
function toLines(value) {
    if (Array.isArray(value)) return value.filter((v) => v != null).map((v) => String(v).trim()).filter(Boolean);
    if (value && typeof value === "object") return toLines(Object.values(value));
    return String(value ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
 
// "Jan 2024" / "March 2023" / "Present" -> {y, m}
function parseMonthYear(text) {
    const t = String(text ?? "").trim().toLowerCase();
 
    if (!t || /^(present|now|current|today)$/.test(t)) {
        const now = new Date();
        return { y: now.getFullYear(), m: now.getMonth() };
    }
 
    const match = t.match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})$/);
    if (!match || !(match[1] in MONTHS)) return null;
 
    return { y: Number(match[2]), m: MONTHS[match[1]] };
}
 
// both months count (Jan 2024 - May 2025 = 1 Yr, 5 Month)
function calcDuration(start, end) {
    const from = parseMonthYear(start);
    const to = parseMonthYear(end);
    if (!from || !to) return null;
 
    const total = (to.y - from.y) * 12 + (to.m - from.m) + 1;
    if (total <= 0) {
        console.warn(`[Firebase] Experience: end date is before start date (${start} - ${end}).`);
        return null;
    }
 
    return { years: Math.floor(total / 12), months: total % 12 };
}
 
function setDuration(el, years, months) {
    el.textContent = "";
 
    const add = (number, label) => {
        const span = document.createElement("span");
        span.className = "value";
        span.textContent = number;
        el.append(span, label);
    };
 
    if (years) add(years, "Yr");
    if (years && months) el.append(" , ");
    if (months) add(months, "Month");
}
 
function findExperienceElement(key, item) {
    const all = [...document.querySelectorAll('[data-record-collection="experience"]')];
    const byDocId = (id) => all.find((el) => el.dataset.recordDocumentId === id) || null;
 
    // 1) id stored inside the database item
    const explicit = getStr(item, EXP_FIELDS.docId);
    if (explicit && byDocId(explicit)) return byDocId(explicit);
 
    // 2) key map
    if (EXPERIENCE_KEY_MAP[key] && byDocId(EXPERIENCE_KEY_MAP[key])) {
        return byDocId(EXPERIENCE_KEY_MAP[key]);
    }
 
    // 3) company name
    const company = norm(getStr(item, EXP_FIELDS.company));
    if (company) {
        return all.find((el) =>
            norm(el.querySelector(".tittleWork h3:not(.subjectDegreeItem)")?.textContent) === company
        ) || null;
    }
 
    return null;
}
 
function renderExperienceRoles(el, rolesData) {
    const workItems = [...el.querySelectorAll(".workItem")];
    const used = new Set();
 
    entriesOf(rolesData).forEach(([, role], index) => {
        const name = getStr(role, EXP_ROLE_FIELDS.name);
 
        let target = name
            ? workItems.find((w) => !used.has(w) && norm(w.querySelector(".roleCompany")?.textContent) === norm(name))
            : null;
 
        if (!target && workItems[index] && !used.has(workItems[index])) {
            target = workItems[index];
        }
 
        if (!target) {
            console.warn(`[Firebase] Experience: no .workItem found for role "${name || index + 1}".`);
            return;
        }
 
        used.add(target);
 
        const start = getStr(role, EXP_ROLE_FIELDS.start);
        const end = getStr(role, EXP_ROLE_FIELDS.end);
        const text = getStr(role, EXP_ROLE_FIELDS.text);
 
        const nameEl = target.querySelector(".roleCompany");
        const dateEl = target.querySelector(".dataWorkTittle");
        const textEl = target.querySelector(".explainWork");
 
        if (nameEl && name) nameEl.textContent = name;
        if (dateEl && (start || end)) dateEl.textContent = start ? `${start} - ${end || "Present"}` : end;
        if (textEl && text) textEl.textContent = text;
    });
}
 
function renderExperienceItem(el, item) {
    const company = getStr(item, EXP_FIELDS.company);
    const title = getStr(item, EXP_FIELDS.title);
    const start = getStr(item, EXP_FIELDS.start);
    const end = getStr(item, EXP_FIELDS.end);
    const manualTime = getStr(item, EXP_FIELDS.time);
    const logo = getStr(item, EXP_FIELDS.logo);
 
    // company name + job title
    const companyEl = el.querySelector(".tittleWork h3:not(.subjectDegreeItem)");
    const titleEl = el.querySelector(".tittleWork .subjectDegreeItem");
    if (companyEl && company) companyEl.textContent = company;
    if (titleEl && title) titleEl.textContent = title;
 
    // logo
    const logoEl = el.querySelector(".imgCompany img");
    if (logoEl && logo) {
        logoEl.src = logo;
        if (company) logoEl.alt = company;
    }
 
    // dates + duration
    const dateEl = el.querySelector(".calenderEX");
    if (dateEl && start) dateEl.textContent = `${start} - ${end || "Present"}`;
 
    const durationEl = el.querySelector(".valueDateEx");
    if (durationEl) {
        if (manualTime) {
            durationEl.textContent = manualTime;
        } else if (start) {
            const duration = calcDuration(start, end);
            if (duration) setDuration(durationEl, duration.years, duration.months);
        }
    }
 
    // bullet list (only when the database has text, otherwise the HTML stays)
    const list = el.querySelector("ul.explainItem");
    const lines = toLines(pick(...EXP_FIELDS.descriptions.map((k) => item[k])));
 
    if (list && lines.length) {
        list.textContent = "";
 
        lines.forEach((line) => {
            const li = document.createElement("li");
            const icon = document.createElement("i");
            icon.className = "ri-circle-fill";
            li.append(icon, ` ${line}`);
            list.appendChild(li);
        });
    }
 
    // roles / projects inside the company
    const rolesData = pick(...EXP_FIELDS.roles.map((k) => item[k]));
    if (rolesData) renderExperienceRoles(el, rolesData);
}
 
// open accordion items must grow/shrink to the new content
function refreshOpenResumeItems() {
    document.querySelectorAll(".resumeItem.active .detailItem").forEach((details) => {
        details.style.maxHeight = `${details.scrollHeight}px`;
    });
}
 
function renderExperience(data) {
    entriesOf(data).forEach(([key, item]) => {
        const el = findExperienceElement(key, item);
 
        if (!el) {
            console.warn(`[Firebase] Experience: no matching element in the HTML for "${key}". Add it to EXPERIENCE_KEY_MAP.`);
            return;
        }
 
        renderExperienceItem(el, item);
    });
 
    refreshOpenResumeItems();
}
 
function createSectionLoader({ path, cacheKey, render, label }) {
    return async function loadSection() {
        let cached = null;

        // Render cached content immediately when possible.
        try {
            const raw = localStorage.getItem(cacheKey);
            cached = raw ? JSON.parse(raw) : null;
            if (cached) render(cached);
        } catch {
            // Cache may be unavailable or contain invalid JSON.
        }

        // Fetch the latest snapshot over REST, then keep listening for updates.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REST_TIMEOUT_MS);

        try {
            const response = await fetch(
                `${firebaseConfig.databaseURL}/${path}.json`,
                { signal: controller.signal }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data) throw new Error(`no data at /${path}`);

            try {
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch {
                // Keep rendering even if browser storage is unavailable.
            }

            render(data);
            console.info(`[Firebase] ${label} data loaded.`);
        } catch (error) {
            console.error(
                `[Firebase] Could not load ${label} (${error.name === "AbortError" ? "timeout" : error.message}).`,
                cached ? "Showing last saved values." : "Showing the HTML values."
            );
        } finally {
            clearTimeout(timer);
        }

        onValue(
            ref(db, path),
            (snapshot) => {
                if (!snapshot.exists()) return;
                const data = snapshot.val();

                try {
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                } catch {
                    // Cache is optional; the live data can still be rendered.
                }

                render(data);
            },
            (error) => {
                console.warn(`[Firebase] ${label} realtime listener error:`, error.code, error.message);
            }
        );
    };
}

const loadExperience = createSectionLoader({
    path: EXPERIENCE_PATH,
    cacheKey: EXPERIENCE_CACHE_KEY,
    render: renderExperience,
    label: "Experience"
});
 
 
/* ---------- boot ---------- */
initHome();
loadExperience();
 
