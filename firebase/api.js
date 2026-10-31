import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getDatabase, onValue, ref } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

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
const db = getDatabase(app);

const REST_TIMEOUT_MS = 8000;
const HOME_PATH = "webdatabase/home";
const EXPERIENCE_PATH = "webdatabase/experience/Experience";
const SKILLS_PATH = "webdatabase/skills";
const COMMENTS_PATH = "webdatabase/comments";
const PROJECTS_PATH = "webdatabase/projects";
const CONTACT_PATH = "webdatabase/contact";

const CACHE_KEYS = {
    home: "portfolio:home:v2",
    experience: "portfolio:experience:v2",
    skills: "portfolio:skills:v1",
    comments: "portfolio:comments:v1",
    projects: "portfolio:projects:v1",
    contact: "portfolio:contact:v1"
};

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
const isRecord = (value) => value !== null && typeof value === "object";

function pick(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
}

function entriesOf(value) {
    if (!isRecord(value)) return [];

    return Object.entries(value)
        .filter(([, item]) => isRecord(item))
        .sort(([keyA, itemA], [keyB, itemB]) => {
            const orderA = Number(itemA.order);
            const orderB = Number(itemB.order);
            const hasOrderA = Number.isFinite(orderA);
            const hasOrderB = Number.isFinite(orderB);

            if (hasOrderA && hasOrderB && orderA !== orderB) return orderA - orderB;
            if (hasOrderA !== hasOrderB) return hasOrderA ? -1 : 1;
            return keyA.localeCompare(keyB, undefined, { numeric: true });
        });
}

function toList(value) {
    if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined);
    if (isRecord(value)) {
        return Object.entries(value)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, undefined, { numeric: true }))
            .map(([, item]) => item)
            .filter((item) => item !== null && item !== undefined);
    }
    return [];
}

function getString(record, keys) {
    for (const key of keys) {
        const value = record?.[key];
        if (typeof value === "string" || typeof value === "number") {
            const text = String(value).trim();
            if (text) return text;
        }
    }
    return "";
}

function getText(record, keys) {
    for (const key of keys) {
        const value = record?.[key];
        if (typeof value === "string" || typeof value === "number") {
            const text = String(value).trim();
            if (text) return text;
        }
        if (Array.isArray(value) || isRecord(value)) {
            const lines = toLines(value);
            if (lines.length) return lines.join("\n");
        }
    }
    return "";
}

function setText(element, value) {
    if (!element || value === undefined || value === null) return;
    const text = String(value);
    if (element.textContent !== text) element.textContent = text;
}

function setName(element, fullName) {
    if (!element || !fullName) return;

    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
    const lastName = parts.length > 1 ? parts.pop() : "";

    element.textContent = parts.join(" ");
    if (lastName) {
        element.append(" ");
        const lastNameElement = document.createElement("span");
        lastNameElement.textContent = lastName;
        element.appendChild(lastNameElement);
    }
}

function setGreeting(selector, greeting) {
    const element = document.querySelector(selector);
    if (!element || !greeting) return;

    const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    const text = String(greeting).trim() + " ";
    if (textNode) {
        textNode.textContent = text;
    } else {
        element.insertBefore(document.createTextNode(text), element.firstChild);
    }
}

function setStat(containerId, value) {
    const number = byId(containerId)?.querySelector(".exInfo-number");
    if (!number || value === undefined || value === null || value === "") return;
    number.textContent = "+" + String(value).replace(/^\+/, "");
}

function safeLink(value) {
    if (typeof value !== "string") return "";
    const url = value.trim();
    if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) return "mailto:" + url;
    if (/^(www\.)/i.test(url)) return "https://" + url;
    return "";
}

function safeImageUrl(value) {
    if (typeof value !== "string") return "";
    const url = value.trim();
    if (/^(https?:\/\/|\/|\.\/|\.\.\/|images\/|pdf\/)/i.test(url)) return url;
    return "";
}

function toDownloadUrl(url) {
    if (typeof url !== "string") return url;
    if (url.includes("res.cloudinary.com") && url.includes("/upload/") && !url.includes("fl_attachment")) {
        return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
}

function setBiography(text) {
    if (!text) return;

    const fullText = byId("profile-biography")?.querySelector(".aboutFullText");
    const tabletExcerpt = byId("profile-biography")?.querySelector(".aboutTabletExcerpt");
    const compactBiography = byId("profile-biography-compact");

    if (fullText) {
        fullText.textContent = text;
    } else {
        setText(byId("profile-biography"), text);
    }

    if (tabletExcerpt) {
        const maxLength = 220;
        if (text.length <= maxLength) {
            tabletExcerpt.textContent = text;
        } else {
            const excerpt = text.slice(0, maxLength);
            const lastSpace = excerpt.lastIndexOf(" ");
            tabletExcerpt.textContent = excerpt.slice(0, lastSpace > 120 ? lastSpace : maxLength).trimEnd() + "…";
        }
    }

    setText(compactBiography, text);
}

function renderSocialLinks(links) {
    if (!isRecord(links)) return;

    const destinations = {
        telegram: links.telegram,
        linkedin: links.linkedin,
        github: links.github,
        email: pick(links.email, links.instagram)
    };

    for (const [name, destination] of Object.entries(destinations)) {
        const anchor = byId("profile-social-" + name);
        const href = safeLink(destination);
        if (!anchor || !href) continue;
        anchor.href = href;
    }
}

let lastRolesKey = "";

function renderHome(data) {
    if (!isRecord(data)) return;

    const details = isRecord(data.details) ? data.details : {};
    setName(byId("profile-name-desktop"), pick(data.name));
    setName(byId("profile-name-compact"), pick(data.name));
    setText(byId("profile-role-desktop"), pick(data.roleWork));
    setText(byId("profile-role-compact"), pick(data.roleWork));
    setGreeting(".startText", pick(data.greeting));
    setGreeting(".startTextTwo", pick(data.greeting));

    const image = safeImageUrl(data.image);
    const photo = byId("profile-photo");
    if (photo && image && photo.getAttribute("src") !== image) photo.src = image;

    setStat("profile-stat-experience", pick(details.yearsExperience, data.yearsExperience));
    setStat("profile-stat-projects", pick(details.completedProjects, data.completedProjects));
    setStat("profile-stat-courses", pick(details.numberCourses, data.numberCourses));
    setBiography(pick(data.aboutText, data.biography, data.descriptionAbout));
    renderSocialLinks(data.socialLinks);

    const cv = safeLink(data.downloadCV) || safeImageUrl(data.downloadCV);
    const cvLink = byId("profile-cv-download");
    if (cvLink && cv) {
        cvLink.href = toDownloadUrl(cv);
        cvLink.target = "_blank";
        cvLink.rel = "noopener noreferrer";
    }

    const roles = toList(data.roleAnimation).map((role) => String(role).trim()).filter(Boolean);
    const rolesKey = JSON.stringify(roles);
    if (roles.length && rolesKey !== lastRolesKey) {
        lastRolesKey = rolesKey;
        window.dispatchEvent(new CustomEvent("home:updated", { detail: { roles } }));
    }
}

function getContactIconClasses(record) {
    const iconClass = getString(record, ["icon"]);
    const iconAliases = {
        location: "ri-map-pin-2-line",
        email: "ri-mail-line"
    };
    return (iconAliases[iconClass.toLowerCase()] || iconClass)
        .split(/\s+/)
        .filter((className) => /^[A-Za-z][A-Za-z0-9_-]*$/.test(className));
}

function createContactIcon(record) {
    const iconElement = document.createElement("i");
    const iconClasses = getContactIconClasses(record);
    iconElement.className = iconClasses.length ? iconClasses.join(" ") : "ri-links-line";
    iconElement.setAttribute("aria-hidden", "true");
    return iconElement;
}

function createContactItem(record, id) {
    const item = document.createElement("div");
    item.className = "contactItem";
    item.id = id;

    const icon = document.createElement("div");
    icon.className = "contactIcon";
    const iconElement = createContactIcon(record);
    icon.appendChild(iconElement);

    const details = document.createElement("div");
    details.className = "contactDetails";
    const title = document.createElement("h3");
    const value = document.createElement("p");
    details.append(title, value);
    item.append(icon, details);
    return item;
}

function renderContact(data) {
    const container = document.querySelector(".contactInfo");
    if (!container || !isRecord(data)) return;

    const contactRecords = entriesOf(data).filter(([, record]) => {
        const type = getString(record, ["type"]).toLowerCase();
        const fallbackValue = type === "email" ? data.email :
            type === "address" || type === "location" ? data.address :
                type === "phone" || type === "telegram" ? data.phone : "";
        return getString(record, ["title", "label"]) ||
            getText(record, ["value", "text", "description"]) ||
            getString({ value: fallbackValue }, ["value"]);
    });
    if (!contactRecords.length) return;

    const renderedItems = new Set();
    const seenIds = new Set();

    contactRecords.forEach(([key, record]) => {
        const id = getString(record, ["id", "htmlId", "elementId"]) || key;
        if (!/^[A-Za-z][A-Za-z0-9_:-]*$/.test(id)) {
            console.warn("[Firebase] Contact: invalid HTML id was skipped.", id);
            return;
        }
        if (seenIds.has(id)) {
            console.warn("[Firebase] Contact: duplicate contact id \"" + id + "\" was skipped.");
            return;
        }
        seenIds.add(id);

        let item = byId(id);
        if (item && (!item.classList.contains("contactItem") || !container.contains(item))) {
            console.warn("[Firebase] Contact: id \"" + id + "\" is already used outside the contact list.");
            return;
        }
        if (!item) {
            item = createContactItem(record, id);
            container.appendChild(item);
        }

        const title = item.querySelector(".contactDetails h3");
        const value = item.querySelector(".contactDetails p");
        setText(title, getString(record, ["title", "label"]));
        const type = getString(record, ["type"]).toLowerCase();
        const fallbackValue = type === "email" ? getString(data, ["email"]) :
            type === "address" || type === "location" ? getString(data, ["address"]) :
                type === "phone" || type === "telegram" ? getString(data, ["phone"]) : "";
        setText(value, getText(record, ["value", "text", "description"]) || fallbackValue);

        const iconContainer = item.querySelector(".contactIcon");
        if (iconContainer && getString(record, ["icon"])) {
            iconContainer.replaceChildren(createContactIcon(record));
        }

        const href = safeLink(getString(record, ["link", "url", "href"])) ||
            (type === "email" ? safeLink(getString(data, ["email"])) : "");
        if (type) item.dataset.contactType = type;
        else delete item.dataset.contactType;
        if (href) item.dataset.contactLink = href;
        else delete item.dataset.contactLink;

        item.dataset.firebaseContactManaged = "true";
        item.hidden = false;
        container.appendChild(item);
        renderedItems.add(item);
    });

    // Once Firebase returns contact records, omitted entries should not leave stale HTML values visible.
    container.querySelectorAll(".contactItem").forEach((item) => {
        item.dataset.firebaseContactManaged = "true";
        item.hidden = !renderedItems.has(item);
    });

    const mapFrame = byId("contactMapFrame") || document.querySelector(".contact-map iframe");
    const mapEmbed = getString(data, ["mapEmbedUrl", "mapUrl"]);
    if (mapFrame && /^https:\/\/www\.google\.com\/maps\/embed(?:[/?#]|$)/i.test(mapEmbed)) {
        mapFrame.src = mapEmbed;
        mapFrame.title = "Map showing " + (getString(data, ["address"]) || "the contact location");
    } else if (mapFrame) {
        const addressRecord = contactRecords.find(([, record]) => {
            const type = getString(record, ["type"]).toLowerCase();
            return type === "address" || type === "location" ||
                getString(record, ["id", "htmlId", "elementId"]) === "locationContact";
        })?.[1];
        const address = getText(addressRecord, ["value", "text", "description"]) ||
            getString(data, ["address"]);
        if (address) {
            mapFrame.src = "https://www.google.com/maps?q=" + encodeURIComponent(address) + "&output=embed";
            mapFrame.title = "Map showing " + address;
        }
    }
}

function readCache(cacheKey) {
    try {
        const raw = localStorage.getItem(cacheKey);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeCache(cacheKey, data) {
    try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
        // The page can still render if browser storage is unavailable.
    }
}

function firebaseRestUrl(path) {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    return firebaseConfig.databaseURL + "/" + encodedPath + ".json";
}

async function fetchSection(path) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REST_TIMEOUT_MS);

    try {
        const response = await fetch(firebaseRestUrl(path), { signal: controller.signal });
        if (!response.ok) {
            throw new Error("HTTP " + response.status + " " + response.statusText);
        }
        return await response.json();
    } finally {
        window.clearTimeout(timer);
    }
}

function createSectionLoader({ path, cacheKey, render, label, onEmpty }) {
    return async function loadSection() {
        const cached = readCache(cacheKey);
        if (isRecord(cached)) render(cached);

        try {
            const data = await fetchSection(path);
            if (!isRecord(data)) throw new Error("no data at /" + path);
            writeCache(cacheKey, data);
            render(data);
            console.info("[Firebase] " + label + " data loaded.");
        } catch (error) {
            const reason = error.name === "AbortError" ? "timeout" : error.message;
            console.error(
                "[Firebase] Could not load " + label + " (" + reason + ").",
                isRecord(cached) ? "Showing last saved values." : "Showing the HTML values."
            );
            if (!isRecord(cached) && onEmpty) onEmpty();
        }

        onValue(
            ref(db, path),
            (snapshot) => {
                if (!snapshot.exists()) return;
                const data = snapshot.val();
                if (!isRecord(data)) return;
                writeCache(cacheKey, data);
                render(data);
            },
            (error) => {
                console.warn("[Firebase] " + label + " realtime listener error:", error.code, error.message);
            }
        );
    };
}

/* Home */
const loadHome = createSectionLoader({
    path: HOME_PATH,
    cacheKey: CACHE_KEYS.home,
    render: renderHome,
    label: "Home",
    onEmpty: () => renderHome(DEFAULT_HOME)
});

/* Experience */
const EXPERIENCE_KEY_MAP = {
    Experience1: "iran-technical-vocational",
    Experience2: "karlancer",
    Experience3: "iranian-school-qatar",
    Experience4: "tose-ertebatat-network"
};

const EXPERIENCE_FIELDS = {
    company: ["companyName", "company", "name"],
    title: ["jobTitle", "title", "position", "roleName", "job", "roleEx"],
    start: ["start", "startDate", "from"],
    end: ["end", "endDate", "to"],
    time: ["time", "duration"],
    logo: ["logo", "image", "img", "companyLogo"],
    descriptions: ["descriptions", "description", "details"],
    roles: ["moreRoleEx", "roles", "moreRoles"],
    docId: ["docId", "documentId", "htmlId"]
};

const EXPERIENCE_ROLE_FIELDS = {
    name: ["namePo", "name", "title"],
    start: ["startR", "start"],
    end: ["endR", "end"],
    text: ["roleMe", "description", "descriptions"]
};

const MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};
const normaliseText = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const warnedExperienceIssues = new Set();

function reportExperienceIssue(key, message) {
    const signature = key + ":" + message;
    if (warnedExperienceIssues.has(signature)) return;
    warnedExperienceIssues.add(signature);
    console.warn("[Firebase] Experience " + key + ": " + message);
}

function toLines(value) {
    if (Array.isArray(value)) {
        return value.flatMap((item) => toLines(item));
    }
    if (isRecord(value)) {
        return Object.entries(value)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, undefined, { numeric: true }))
            .flatMap(([, item]) => toLines(item));
    }
    return String(value ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function parseMonthYear(value) {
    const text = String(value ?? "").trim().toLowerCase();
    if (/^(present|now|current|today)$/.test(text)) {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    }

    const match = text.match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})$/);
    if (!match || !(match[1] in MONTHS)) return null;
    return { year: Number(match[2]), month: MONTHS[match[1]] };
}

function calculateDuration(start, end) {
    const from = parseMonthYear(start);
    const to = parseMonthYear(end);
    if (!from || !to) return null;

    const totalMonths = (to.year - from.year) * 12 + (to.month - from.month) + 1;
    if (totalMonths <= 0) return null;
    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, totalMonths };
}

function manualDurationInMonths(value) {
    const text = String(value ?? "");
    const years = Number(text.match(/(\d+(?:\.\d+)?)\s*(?:yr|year)/i)?.[1] || 0);
    const months = Number(text.match(/(\d+(?:\.\d+)?)\s*(?:month|mo\b)/i)?.[1] || 0);
    if (!years && !months) return null;
    return years * 12 + months;
}

function setDuration(element, years, months) {
    element.textContent = "";

    const appendValue = (number, label) => {
        const span = document.createElement("span");
        span.className = "value";
        span.textContent = String(number);
        element.append(span, " " + label);
    };

    if (years) appendValue(years, "Yr");
    if (years && months) element.append(" , ");
    if (months) appendValue(months, "Month");
    if (!years && !months) element.textContent = "Less than a month";
}

function findExperienceElement(key, item) {
    const all = [...document.querySelectorAll('[data-record-collection="experience"]')];
    const byDocumentId = (id) => all.find((element) => element.dataset.recordDocumentId === id) || null;

    const explicitId = getString(item, EXPERIENCE_FIELDS.docId);
    if (explicitId && byDocumentId(explicitId)) return byDocumentId(explicitId);

    const recordId = getString(item, ["id"]).replace(/^experience-/i, "");
    if (recordId && byDocumentId(recordId)) return byDocumentId(recordId);

    const mappedId = EXPERIENCE_KEY_MAP[key];
    if (mappedId && byDocumentId(mappedId)) return byDocumentId(mappedId);

    const company = normaliseText(getString(item, EXPERIENCE_FIELDS.company));
    const title = normaliseText(getString(item, EXPERIENCE_FIELDS.title));
    if (company || title) {
        return all.find((element) => {
            const headings = [...element.querySelectorAll(".tittleWork h3")].map((heading) =>
                normaliseText(heading.textContent)
            );
            return headings.includes(company) || headings.includes(title);
        }) || null;
    }

    return null;
}

function renderExperienceRoles(element, rolesData, experienceKey) {
    const workItems = [...element.querySelectorAll(".workItem")];
    const used = new Set();

    entriesOf(rolesData).forEach(([, role], index) => {
        const name = getString(role, EXPERIENCE_ROLE_FIELDS.name);
        const roleId = getString(role, ["docId", "documentId", "htmlId", "id"])
            .replace(/^experience-[^-]+-role-/i, "");
        let target = roleId
            ? workItems.find((workItem) =>
                !used.has(workItem) &&
                (workItem.dataset.recordDocumentId === roleId ||
                    workItem.dataset.recordDocumentId.endsWith("-" + roleId))
            )
            : null;

        if (!target && name) {
            target = workItems.find((workItem) =>
                !used.has(workItem) &&
                normaliseText(workItem.querySelector(".roleCompany")?.textContent) === normaliseText(name)
            );
        }
        if (!target && workItems[index] && !used.has(workItems[index])) target = workItems[index];

        if (!target) {
            reportExperienceIssue(experienceKey, "No HTML work item matches role \"" + (name || index + 1) + "\".");
            return;
        }

        used.add(target);
        const start = getString(role, EXPERIENCE_ROLE_FIELDS.start);
        const end = getString(role, EXPERIENCE_ROLE_FIELDS.end);
        const description = getText(role, EXPERIENCE_ROLE_FIELDS.text);

        setText(target.querySelector(".roleCompany"), name);
        const dateElement = target.querySelector(".dataWorkTittle");
        if (dateElement && (start || end)) {
            dateElement.textContent = start
                ? start + " - " + (end || "Present")
                : end;
        }
        setText(target.querySelector(".explainWork"), description);
    });
}

function renderExperienceItem(element, item, key) {
    const company = getString(item, EXPERIENCE_FIELDS.company);
    const title = getString(item, EXPERIENCE_FIELDS.title);
    const start = getString(item, EXPERIENCE_FIELDS.start);
    const end = getString(item, EXPERIENCE_FIELDS.end);
    const manualTime = getString(item, EXPERIENCE_FIELDS.time);
    const logo = safeImageUrl(getString(item, EXPERIENCE_FIELDS.logo));

    setText(element.querySelector(".tittleWork h3:not(.subjectDegreeItem)"), company);
    setText(element.querySelector(".tittleWork .subjectDegreeItem"), title);

    const logoElement = element.querySelector(".imgCompany img");
    if (logoElement && logo) {
        logoElement.src = logo;
        if (company) logoElement.alt = company;
    }

    const dateElement = element.querySelector(".calenderEX");
    if (dateElement && (start || end)) {
        dateElement.textContent = (start || "") + (start && end ? " - " : "") + (end || "");
    }

    const calculated = start && end ? calculateDuration(start, end) : null;
    const durationElement = element.querySelector(".valueDateEx");
    if (durationElement) {
        if (manualTime) {
            durationElement.textContent = manualTime;
        } else if (calculated) {
            setDuration(durationElement, calculated.years, calculated.months);
        }
    }

    if (start && end && !calculated) {
        reportExperienceIssue(key, "The end date is earlier than the start date or uses an unsupported date format (" + start + " - " + end + ").");
    } else if (calculated && manualTime) {
        const manualMonths = manualDurationInMonths(manualTime);
        // Stored durations may count both boundary months while date subtraction does not.
        if (manualMonths !== null && Math.abs(manualMonths - calculated.totalMonths) > 1) {
            reportExperienceIssue(
                key,
                "The saved duration \"" + manualTime + "\" does not match the dates (" +
                start + " - " + end + "; calculated as " + calculated.totalMonths + " months)."
            );
        }
    }

    const list = element.querySelector("ul.explainItem");
    const descriptions = toLines(pick(...EXPERIENCE_FIELDS.descriptions.map((field) => item[field])));
    if (list && descriptions.length) {
        list.textContent = "";
        descriptions.forEach((line) => {
            const listItem = document.createElement("li");
            const icon = document.createElement("i");
            icon.className = "ri-circle-fill";
            icon.setAttribute("aria-hidden", "true");
            listItem.append(icon, " " + line);
            list.appendChild(listItem);
        });
    }

    const roles = pick(...EXPERIENCE_FIELDS.roles.map((field) => item[field]));
    if (roles && typeof roles === "object") {
        renderExperienceRoles(element, roles, key);
    }
}

function renderExperience(data) {
    entriesOf(data).forEach(([key, item]) => {
        const element = findExperienceElement(key, item);
        if (!element) {
            reportExperienceIssue(key, "No matching experience element exists in index.html.");
            return;
        }
        renderExperienceItem(element, item, key);
    });

    requestAnimationFrame(() => {
        document.querySelectorAll(".resumeItem.active .detailItem").forEach((details) => {
            details.style.maxHeight = details.scrollHeight + "px";
        });
    });
}

/* Skills */
function normalizeDomId(value, fallback) {
    const normalised = String(value ?? "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return normalised || fallback;
}

function setIcon(element, iconValue, fallbackClass, keepPythonSvg = false) {
    if (!element) return null;

    const requested = String(iconValue ?? "").trim();
    const isPython = requested.toLowerCase() === "python" || requested.toLowerCase() === "fa-python";
    let icon = element.querySelector("i, svg");

    if (isPython && keepPythonSvg && icon?.tagName.toLowerCase() === "svg") {
        icon.setAttribute("aria-hidden", "true");
        return icon;
    }

    if (!icon || icon.tagName.toLowerCase() !== "i") {
        icon = document.createElement("i");
        element.replaceChildren(icon);
    }

    let classes = requested && !isPython ? requested : (isPython ? "fa-brands fa-python" : fallbackClass);
    const classTokens = classes.split(/\s+/).filter((token) => /^[\w-]+$/.test(token));
    const structuralClasses = ["skillIcon", "skillArrow"].filter((token) => icon.classList.contains(token));
    icon.className = [...structuralClasses, ...classTokens].join(" ") || fallbackClass;
    icon.setAttribute("aria-hidden", "true");
    return icon;
}

function createSkillHeader() {
    const header = document.createElement("div");
    header.className = "skillsHeader";
    header.setAttribute("data-aos", "fade-down");
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.appendChild(document.createElement("i")).className = "skillIcon";

    const textContainer = document.createElement("div");
    const title = document.createElement("h1");
    title.className = "skillTabTittle";
    const subtitle = document.createElement("span");
    subtitle.className = "skillTabSubject";
    textContainer.append(title, subtitle);

    const arrow = document.createElement("i");
    arrow.className = "ri-arrow-drop-down-line skillArrow";
    arrow.setAttribute("aria-hidden", "true");
    header.append(textContainer, arrow);
    return header;
}

function createSkillGroup(id) {
    const group = document.createElement("div");
    group.className = "skillsGroup";
    group.id = id;
    group.setAttribute("data-content", "");
    group.setAttribute("role", "region");

    const list = document.createElement("div");
    list.className = "skillsList grid";
    group.appendChild(list);
    return group;
}

function createSkillItem() {
    const item = document.createElement("div");
    item.className = "skillItem";
    item.setAttribute("data-aos", "fade-right");

    const titles = document.createElement("div");
    titles.className = "skillTittles";
    const name = document.createElement("h3");
    name.className = "skillName";
    const number = document.createElement("span");
    number.className = "skillNumber";
    titles.append(name, number);

    const bar = document.createElement("div");
    bar.className = "skillsBar";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    const score = document.createElement("span");
    score.className = "skillsScoreBar";
    bar.appendChild(score);

    item.append(titles, bar);
    return item;
}

function renderSkillItem(itemElement, itemData, key, id) {
    itemElement.id = id;
    itemElement.dataset.skillKey = key;

    const nameElement = itemElement.querySelector(".skillName");
    const name = getString(itemData, ["name", "title"]) || key;
    const iconValue = getString(itemData, ["icon"]);
    const icon = setIcon(nameElement, iconValue, "ri-code-line", true);
    if (nameElement) {
        if (icon) {
            nameElement.replaceChildren(icon, document.createTextNode(" " + name));
        } else {
            nameElement.textContent = name;
        }
    }

    const rawLevel = getString(itemData, ["level", "percentage", "score"]);
    const parsedLevel = Number(rawLevel.replace(/%$/, ""));
    const level = Number.isFinite(parsedLevel) ? Math.max(0, Math.min(100, parsedLevel)) : 0;
    const number = itemElement.querySelector(".skillNumber");
    const bar = itemElement.querySelector(".skillsBar");
    const score = itemElement.querySelector(".skillsScoreBar");

    if (number) number.textContent = level + "%";
    if (bar) bar.setAttribute("aria-valuenow", String(level));
    if (score) score.style.width = level + "%";
}

function renderSkills(data) {
    const tabRoot = document.querySelector(".skillsTab");
    const contentRoot = document.querySelector(".skilldContent");
    if (!tabRoot || !contentRoot) {
        console.warn("[Firebase] Skills containers are missing from index.html.");
        return;
    }

    const previousActiveId = tabRoot.querySelector(".skillsHeader.skillsActive")?.dataset.target?.replace(/^#/, "");
    const categoryData = entriesOf(data);
    const categoryIds = new Set();
    const skillIds = new Set();
    const usedHeaders = new Set();
    const usedGroups = new Set();
    const prepared = [];

    for (const [categoryKey, category] of categoryData) {
        const categoryId = normalizeDomId(category.id, normalizeDomId(categoryKey, "skill-category"));
        if (categoryIds.has(categoryId)) {
            console.warn("[Firebase] Skills: duplicate category id \"" + categoryId + "\" was skipped.");
            continue;
        }
        categoryIds.add(categoryId);

        let header = [...tabRoot.querySelectorAll(".skillsHeader[data-target]")]
            .find((candidate) => candidate.dataset.target.replace(/^#/, "") === categoryId);
        if (!header) header = createSkillHeader();

        let group = [...contentRoot.querySelectorAll(".skillsGroup[data-content]")]
            .find((candidate) => candidate.id === categoryId);
        if (!group) group = createSkillGroup(categoryId);
        group.id = categoryId;

        header.dataset.target = "#" + categoryId;
        header.setAttribute("aria-controls", categoryId);
        header.setAttribute("aria-expanded", "false");
        header.setAttribute("role", "button");
        header.setAttribute("tabindex", "0");

        const iconValue = getString(category, ["icon"]);
        setIcon(header, iconValue, "ri-code-ai-line");
        setText(header.querySelector(".skillTabTittle"), getString(category, ["title", "name"]) || categoryKey);
        setText(header.querySelector(".skillTabSubject"), getString(category, ["subtitle"]));

        let list = group.querySelector(".skillsList");
        if (!list) {
            list = document.createElement("div");
            group.appendChild(list);
        }
        list.classList.add("skillsList", "grid");

        const usedItems = new Set();
        entriesOf(category.items).forEach(([itemKey, itemData]) => {
            const baseId = normalizeDomId(itemData.id, normalizeDomId(itemKey, "skill-item"));
            let itemId = baseId;
            if (skillIds.has(itemId)) itemId = normalizeDomId(categoryId + "-" + baseId, "skill-item-" + itemKey);
            if (skillIds.has(itemId)) {
                console.warn("[Firebase] Skills: duplicate skill id \"" + itemId + "\" was skipped.");
                return;
            }
            skillIds.add(itemId);

            let itemElement = [...list.querySelectorAll(".skillItem")]
                .find((candidate) => candidate.id === itemId);
            if (!itemElement) itemElement = createSkillItem();
            renderSkillItem(itemElement, itemData, itemKey, itemId);
            list.appendChild(itemElement);
            usedItems.add(itemElement);
        });

        [...list.querySelectorAll(".skillItem")].forEach((itemElement) => {
            if (!usedItems.has(itemElement)) itemElement.remove();
        });

        tabRoot.appendChild(header);
        contentRoot.appendChild(group);
        usedHeaders.add(header);
        usedGroups.add(group);
        prepared.push({ id: categoryId, header, group });
    }

    [...tabRoot.querySelectorAll(".skillsHeader[data-target]")].forEach((header) => {
        if (!usedHeaders.has(header)) header.remove();
    });
    [...contentRoot.querySelectorAll(".skillsGroup[data-content]")].forEach((group) => {
        if (!usedGroups.has(group)) group.remove();
    });

    const activeCategory = prepared.find((category) => category.id === previousActiveId) || prepared[0];
    prepared.forEach(({ id, header, group }) => {
        const active = Boolean(activeCategory && id === activeCategory.id);
        header.classList.toggle("skillsActive", active);
        group.classList.toggle("skillsActive", active);
        header.setAttribute("aria-expanded", String(active));
        group.setAttribute("aria-hidden", String(!active));
    });

    if (window.AOS?.refresh) window.AOS.refresh();
}

/* Comments */
function createCommentCard(comment, key, index) {
    const id = normalizeDomId(getString(comment, ["id", "recordId"]) || key, key);
    const slide = document.createElement("div");
    slide.className = "swiper-slide commentCard";
    slide.id = id;
    slide.dataset.recordCollection = "comments";
    slide.dataset.recordDocumentId = id;
    slide.setAttribute("data-aos", index === 1 ? "zoom-in" : index === 2 ? "fade-left" : "fade-right");
    slide.setAttribute("data-aos-delay", String(400 + index * 50));

    const quote = document.createElement("div");
    quote.className = "commaCard";
    const quoteImage = document.createElement("img");
    quoteImage.src = "images/quote-right.svg";
    quoteImage.alt = "";
    quoteImage.loading = "lazy";
    quote.appendChild(quoteImage);

    const image = document.createElement("img");
    const imageUrl = safeImageUrl(getString(comment, ["image", "photo", "avatar"]));
    if (imageUrl) image.src = imageUrl;
    image.alt = getString(comment, ["name"]) + " portrait";
    image.loading = "lazy";

    const portrait = document.createElement("div");
    portrait.className = "imageCommentCard";
    if (imageUrl) portrait.appendChild(image);

    const text = document.createElement("p");
    text.textContent = getString(comment, ["text", "comment", "message"]);

    const person = document.createElement("div");
    person.className = "infoPersone";
    const name = document.createElement("h3");
    name.textContent = getString(comment, ["name"]) || "Client";
    const role = document.createElement("h6");
    role.textContent = getString(comment, ["role", "position", "title"]);
    person.append(name, role);

    slide.append(quote, portrait, text, person);
    return slide;
}

function renderComments(data) {
    const swiperRoot = document.querySelector(".comments-swiper");
    const wrapper = swiperRoot?.querySelector(".swiper-wrapper");
    if (!swiperRoot || !wrapper) return;

    const seenIds = new Set();
    const cards = [];
    entriesOf(data).forEach(([key, comment], index) => {
        const id = normalizeDomId(getString(comment, ["id", "recordId"]) || key, key);
        if (seenIds.has(id)) {
            console.warn("[Firebase] Comments: duplicate comment id \"" + id + "\" was skipped.");
            return;
        }
        seenIds.add(id);
        cards.push(createCommentCard(comment, key, index));
    });

    replaceSwiperSlides(swiperRoot, wrapper, cards);
    if (window.AOS?.refresh) window.AOS.refresh();
    console.info("[Firebase] Rendered " + cards.length + " comments.");
}

/* Projects */
function projectItems(value) {
    if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined);
    if (!isRecord(value)) return [];

    return Object.entries(value)
        .sort(([keyA, itemA], [keyB, itemB]) => {
            const orderA = Number(itemA?.order);
            const orderB = Number(itemB?.order);
            const hasOrderA = Number.isFinite(orderA);
            const hasOrderB = Number.isFinite(orderB);
            if (hasOrderA && hasOrderB && orderA !== orderB) return orderA - orderB;
            if (hasOrderA !== hasOrderB) return hasOrderA ? -1 : 1;
            return keyA.localeCompare(keyB, undefined, { numeric: true });
        })
        .map(([, item]) => item)
        .filter((item) => item !== null && item !== undefined);
}

function replaceSwiperSlides(swiperRoot, wrapper, slides) {
    const swiper = swiperRoot?.swiper;
    if (swiper && !swiper.destroyed) {
        swiper.removeAllSlides();
        if (slides.length) swiper.appendSlide(slides);
        swiper.update();
        return;
    }
    wrapper.replaceChildren(...slides);
}

function isProjectDetailPage() {
    return Boolean(document.querySelector(".projectRecord"));
}

function projectAssetUrl(value) {
    const safeUrl = safeImageUrl(value);
    if (!safeUrl) return "";
    if (/^(https?:\/\/|\/|\.\.?\/)/i.test(safeUrl)) return safeUrl;
    if (isProjectDetailPage() && /^(images|pdf)\//i.test(safeUrl)) return "../" + safeUrl;
    return safeUrl;
}

function projectHref(value) {
    if (typeof value !== "string") return "";
    const href = value.trim();
    if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
    if (/^(#|\/|\.\.\/)/.test(href)) return href;
    if (/^(html|pdf)\//i.test(href)) return isProjectDetailPage() ? "../" + href : href;
    return "";
}

function setProjectLink(anchor, value) {
    if (!anchor) return;
    const href = projectHref(value);
    if (!href) {
        anchor.removeAttribute("href");
        anchor.hidden = true;
        return;
    }
    anchor.href = href;
    anchor.hidden = false;
    if (/^https?:/i.test(href)) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
    } else {
        anchor.removeAttribute("target");
        anchor.removeAttribute("rel");
    }
}

function addClassTokens(element, values) {
    if (!element) return;
    const tokens = values
        .flatMap((value) => String(value ?? "").split(/\s+/))
        .filter((token) => /^[\w-]+$/.test(token));
    if (tokens.length) element.classList.add(...tokens);
}

function createProjectCard(project, key) {
    const id = normalizeDomId(getString(project, ["id", "recordId", "cardId"]) || key, key);
    const page = isRecord(project.page) ? project.page : {};
    const savedPopup = isRecord(project.popup) ? project.popup : {};
    const card = document.createElement("div");
    card.className = "boxCard swiper-slide";
    card.id = id;
    card.dataset.recordCollection = "projects";
    card.dataset.recordDocumentId = id;
    card.dataset.projectId = id;
    card.dataset.category = getString(project, ["category"]) || "app";
    card.dataset.imageType = getString(project, ["imageType"]) || "landscape";
    card.setAttribute("data-aos", "fade-right");
    card.setAttribute("data-aos-offset", "100");
    card.setAttribute("data-aos-easing", "ease-in-sine");

    const imageBox = document.createElement("div");
    imageBox.className = "boxCardImg";
    const image = document.createElement("img");
    image.loading = "lazy";
    image.src = projectAssetUrl(project.image);
    image.alt = getString(project, ["title"]) + " project preview";
    imageBox.appendChild(image);

    const overlay = document.createElement("div");
    overlay.className = "box-show";
    const details = document.createElement("div");
    details.className = "firstDetails";

    const title = document.createElement("h3");
    title.className = "nameProject";
    title.textContent = getString(project, ["title"]) || getString(savedPopup, ["title"]) || "Project";
    const company = document.createElement("span");
    company.className = "comapnyName";
    company.textContent = getString(project, ["companyName"]);
    const description = document.createElement("p");
    description.textContent = getString(project, ["shortDescription", "description"]);
    const category = document.createElement("span");
    category.className = "projectCategory";
    category.textContent = getString(project, ["categoryLabel", "category"]);
    details.append(title, company, description, category);

    const showButton = document.createElement("span");
    showButton.className = "showProject";
    const showIcon = document.createElement("i");
    showIcon.className = "uil uil-external-link-alt";
    showIcon.setAttribute("aria-hidden", "true");
    showButton.appendChild(showIcon);

    const dots = document.createElement("div");
    dots.className = "dotImgCard";
    const dotsImage = document.createElement("img");
    dotsImage.className = "shape";
    dotsImage.src = "images/dot-modol3-dark.png";
    dotsImage.alt = "";
    dots.appendChild(dotsImage);
    overlay.append(details, showButton, dots);

    const popupData = {
        id,
        title: getString(savedPopup, ["title"]) || getString(project, ["title"]),
        companyName: getString(savedPopup, ["companyName"]) || getString(project, ["companyName"]),
        employer: getString(savedPopup, ["employer", "companyName"]) || getString(project, ["companyName"]),
        date: getString(savedPopup, ["date"]) || getString(page, ["dateRange"]),
        duration: getString(savedPopup, ["duration"]),
        image: getString(savedPopup, ["image"]) || getString(project, ["image"]),
        description: pick(savedPopup.description, project.description),
        overview: getString(page, ["overview"]) || getString(project, ["overview", "description"]),
        roleMe: getString(savedPopup, ["roleMe"]),
        role: getString(savedPopup, ["role"]),
        rate: getString(savedPopup, ["rate"]),
        githubLink: getString(savedPopup, ["githubLink"]) || getString(project, ["githubLink"]),
        seeMoreLink: getString(savedPopup, ["seeMoreLink"]) || getString(project, ["projectLink"]) ||
            ("html/projects.html?id=" + encodeURIComponent(id))
    };
    card.dataset.projectPopup = JSON.stringify(popupData);
    card.append(imageBox, overlay);
    return card;
}

function renderProjectCards(data) {
    const swiperRoot = document.querySelector(".projectContainer.projects-swiper");
    const wrapper = swiperRoot?.querySelector(".swiper-wrapper");
    if (!wrapper) return;

    const seenIds = new Set();
    const cards = [];
    entriesOf(data).forEach(([key, project]) => {
        const id = normalizeDomId(getString(project, ["id", "recordId", "cardId"]) || key, key);
        if (seenIds.has(id)) {
            console.warn("[Firebase] Projects: duplicate project id \"" + id + "\" was skipped.");
            return;
        }
        seenIds.add(id);
        cards.push(createProjectCard(project, key));
    });

    replaceSwiperSlides(swiperRoot, wrapper, cards);
    if (window.AOS?.refresh) window.AOS.refresh();
    window.dispatchEvent(new CustomEvent("projects:data-rendered", {
        detail: { ids: [...seenIds], cards }
    }));
}

function setPageHref(element, value) {
    if (!element) return;
    const href = projectHref(value);
    if (!href) {
        element.removeAttribute("href");
        element.hidden = true;
        return;
    }
    element.href = href;
    element.hidden = false;
    if (/^https?:/i.test(href)) {
        element.target = "_blank";
        element.rel = "noopener noreferrer";
    } else {
        element.removeAttribute("target");
        element.removeAttribute("rel");
    }
}

function renderProjectHero(page) {
    const section = document.querySelector(".postgap-showcase");
    const wrapper = section?.querySelector(".postgap-showcase__swiper .swiper-wrapper");
    if (!section || !wrapper) return;

    const screenshots = projectItems(page.heroScreenshots);
    const slides = [];
    screenshots.forEach((screenshot, index) => {
        const src = projectAssetUrl(getString(screenshot, ["src", "image", "url"]));
        if (!src) return;

        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        const frame = document.createElement("div");
        frame.className = "postgap-phone";
        const image = document.createElement("img");
        image.alt = getString(screenshot, ["alt"]) || (getString(page, ["appName"]) + " screen " + (index + 1));
        image.loading = index === 0 ? "eager" : "lazy";
        image.src = src;
        frame.appendChild(image);
        slide.appendChild(frame);
        slides.push(slide);
    });
    replaceSwiperSlides(section.querySelector(".postgap-showcase__swiper"), wrapper, slides);
    section.hidden = wrapper.children.length === 0;
}

function renderProjectFeatures(page) {
    const container = document.querySelector(".projectsOptionsBox");
    if (!container) return;

    const features = projectItems(page.features);
    container.replaceChildren();
    features.forEach((feature) => {
        if (!isRecord(feature)) return;
        const card = document.createElement("div");
        card.className = "options";
        card.setAttribute("data-aos", "zoom-in");

        const iconBox = document.createElement("div");
        iconBox.className = "iconBoxOp";
        const icon = document.createElement("i");
        addClassTokens(icon, [getString(feature, ["icon"]) || "ri-sparkling-line"]);
        icon.setAttribute("aria-hidden", "true");
        iconBox.appendChild(icon);

        const textBox = document.createElement("div");
        textBox.className = "textOp";
        const title = document.createElement("h5");
        title.textContent = getString(feature, ["title", "name"]);
        const description = document.createElement("h6");
        description.textContent = getString(feature, ["text", "description"]);
        textBox.append(title, description);
        card.append(iconBox, textBox);
        container.appendChild(card);
    });
    container.hidden = features.length === 0;
}

function renderProjectScreenshots(page) {
    const section = document.querySelector(".screenshotsSection");
    const wrapper = section?.querySelector(".postgap-screenshots__swiper .swiper-wrapper");
    if (!section || !wrapper) return;

    const screenshots = projectItems(page.screenshots);
    const slides = [];
    screenshots.forEach((screenshot, index) => {
        const src = projectAssetUrl(getString(screenshot, ["src", "image", "url"]));
        if (!src) return;

        const slide = document.createElement("div");
        slide.className = "swiper-slide screenshotSlide";
        slide.setAttribute("data-aos", "fade-right");
        slide.setAttribute("data-aos-duration", String(500 + index * 200));
        const frame = document.createElement("div");
        frame.className = "screenshotFrame";
        const image = document.createElement("img");
        image.alt = getString(screenshot, ["alt"]) || ("Project screenshot " + (index + 1));
        image.loading = "lazy";
        image.src = src;
        frame.appendChild(image);
        slide.appendChild(frame);
        slides.push(slide);
    });
    replaceSwiperSlides(section.querySelector(".postgap-screenshots__swiper"), wrapper, slides);

    const total = wrapper.children.length;
    const totalCounter = section.querySelector(".screenshotTotal");
    const currentCounter = section.querySelector(".screenshotCurrent");
    if (totalCounter) totalCounter.textContent = String(total).padStart(2, "0");
    if (currentCounter) currentCounter.textContent = total ? "01" : "00";
    section.hidden = total === 0;
}

function renderProjectSpecifications(page) {
    const specifications = isRecord(page.specifications) ? page.specifications : {};
    const fields = {
        specPlatform: pick(specifications.platform, page.platform),
        specLanguage: pick(specifications.language, page.platformLanguage),
        specDatabase: specifications.database,
        specApiIntegration: specifications.apiIntegration,
        specUi: specifications.ui,
        specProjectType: pick(specifications.projectType, page.clientType),
        specDuration: pick(specifications.duration, page.dateRange)
    };

    Object.entries(fields).forEach(([field, value]) => {
        const element = document.querySelector('[data-record-field="' + field + '"]');
        if (element && value !== undefined && value !== null && value !== "") {
            element.textContent = String(value).replace(/^\((.*)\)$/, "$1");
        }
    });
}

function renderProjectLinks(page) {
    const container = document.querySelector(".projectLinksList");
    if (!container) return;

    const links = projectItems(page.projectLinks);
    container.replaceChildren();
    links.forEach((link) => {
        if (!isRecord(link)) return;
        const href = projectHref(link.url);
        if (!href) return;

        const anchor = document.createElement("a");
        anchor.className = "projectLink";
        anchor.href = href;
        if (/^https?:/i.test(href)) {
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
        }
        const iconBox = document.createElement("span");
        iconBox.className = "projectLinkIcon";
        iconBox.setAttribute("aria-hidden", "true");
        const icon = document.createElement("i");
        addClassTokens(icon, [getString(link, ["icon"]) || "ri-links-line"]);
        iconBox.appendChild(icon);

        const copy = document.createElement("span");
        copy.className = "projectLinkText";
        const name = document.createElement("span");
        name.className = "projectLinkName";
        name.textContent = getString(link, ["name"]) || "Project link";
        const description = document.createElement("span");
        description.className = "projectLinkDescription";
        description.textContent = getString(link, ["description"]);
        copy.append(name, description);

        const arrow = document.createElement("i");
        arrow.className = "ri-arrow-right-line projectLinkArrow";
        arrow.setAttribute("aria-hidden", "true");
        anchor.append(iconBox, copy, arrow);
        container.appendChild(anchor);
    });
}

function renderProjectTechStack(page) {
    const stack = document.querySelector(".techStackGrid");
    if (stack) {
        stack.replaceChildren();
        projectItems(page.techStack).forEach((technology) => {
            if (!isRecord(technology)) return;
            const item = document.createElement("div");
            item.className = "techStackItem";

            const iconBox = document.createElement("span");
            iconBox.className = "techStackIcon";
            addClassTokens(iconBox, [getString(technology, ["iconClass"])]);
            const iconText = getString(technology, ["icon"]);
            if (/^[A-Z][A-Z0-9 +&-]{0,9}$/.test(iconText)) {
                iconBox.textContent = iconText;
            } else {
                const icon = document.createElement("i");
                addClassTokens(icon, [iconText || "ri-code-s-slash-line"]);
                icon.setAttribute("aria-hidden", "true");
                iconBox.appendChild(icon);
            }

            const name = document.createElement("span");
            name.textContent = getString(technology, ["name"]);
            item.append(iconBox, name);
            stack.appendChild(item);
        });
    }

    const tagsContainer = document.querySelector(".techStackTags");
    if (tagsContainer) {
        tagsContainer.replaceChildren();
        projectItems(page.technologyTags).forEach((tag) => {
            const text = typeof tag === "string" ? tag.trim() : getString(tag, ["name", "title"]);
            if (!text) return;
            const element = document.createElement("span");
            element.textContent = text;
            tagsContainer.appendChild(element);
        });
        tagsContainer.hidden = tagsContainer.children.length === 0;
    }
}

function renderRelatedProjects(page) {
    const container = document.querySelector(".relatedProjectsPanel");
    if (!container) return;

    container.replaceChildren();
    projectItems(page.relatedProjects).forEach((project) => {
        if (!isRecord(project)) return;
        const href = projectHref(getString(project, ["url"]));
        if (!href) return;

        const anchor = document.createElement("a");
        anchor.className = "relatedProjectCard";
        anchor.href = href;
        if (/^https?:/i.test(href)) {
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
        }
        const preview = document.createElement("div");
        preview.className = "relatedProjectPreview";
        const image = document.createElement("img");
        image.src = projectAssetUrl(getString(project, ["image"]));
        image.alt = getString(project, ["name"]) + " project preview";
        image.loading = "lazy";
        preview.appendChild(image);

        const info = document.createElement("div");
        info.className = "relatedProjectInfo";
        const name = document.createElement("span");
        name.className = "relatedProjectName";
        name.textContent = getString(project, ["name"]);
        const description = document.createElement("span");
        description.className = "relatedProjectDescription";
        description.textContent = getString(project, ["description"]);
        info.append(name, description);

        const arrow = document.createElement("i");
        arrow.className = "ri-arrow-right-line relatedProjectArrow";
        arrow.setAttribute("aria-hidden", "true");
        anchor.append(preview, info, arrow);
        container.appendChild(anchor);
    });
    container.hidden = container.children.length === 0;
}

function renderProjectPage(project) {
    const root = document.querySelector(".projectRecord");
    if (!root || !isRecord(project)) return;
    const page = isRecord(project.page) ? project.page : {};
    const id = getString(project, ["id", "recordId", "cardId"]);
    const title = getString(project, ["title"]) || getString(page, ["appName"]);

    root.dataset.recordDocumentId = id;
    root.dataset.projectId = id;
    document.title = title ? title + " | MShooryabi.com" : document.title;

    const titleElement = root.querySelector('[data-record-field="title"]');
    const titleMain = getString(page, ["titleMain"]);
    const titleAccent = getString(page, ["titleAccent"]);
    if (titleElement) {
        titleElement.replaceChildren();
        if (titleMain && titleAccent) {
            titleElement.append(document.createTextNode(titleMain));
            const accent = document.createElement("span");
            accent.textContent = titleAccent;
            titleElement.appendChild(accent);
        } else {
            titleElement.textContent = title;
        }
    }

    const projectFields = {
        category: getString(page, ["category", "categoryLabel"]) || getString(project, ["categoryLabel", "category"]),
        summary: getString(page, ["summary"]) || getString(project, ["shortDescription", "description"]),
        dateRange: getString(page, ["dateRange"]),
        clientType: getString(page, ["clientType"]),
        applicationType: getString(page, ["applicationType"]),
        appName: getString(page, ["appName"]) || title,
        tagline: getString(page, ["tagline"]),
        overview: getString(page, ["overview"]),
        developmentDetails: getString(page, ["developmentDetails"]),
        projectNote: getString(page, ["projectNote"])
    };
    Object.entries(projectFields).forEach(([field, value]) => {
        if (field === "projectNote") {
            setText(root.querySelector('[data-record-field="' + field + '"]'), value);
            return;
        }
        setText(root.querySelector('[data-record-field="' + field + '"]'), value);
    });

    const platformElement = root.querySelector('[data-record-field="platform"]');
    if (platformElement) {
        const languageElement = platformElement.querySelector('[data-record-field="platformLanguage"]');
        platformElement.replaceChildren(document.createTextNode(getString(page, ["platform"])));
        if (languageElement) {
            languageElement.textContent = getString(page, ["platformLanguage"]);
            platformElement.append(" ", languageElement);
        }
    }

    const technologies = root.querySelector(".mainTeach");
    if (technologies) {
        technologies.replaceChildren();
        projectItems(page.technologies).forEach((technology) => {
            const text = typeof technology === "string" ? technology.trim() : getString(technology, ["name"]);
            if (!text) return;
            const item = document.createElement("div");
            item.className = "teachItem";
            const label = document.createElement("h6");
            label.textContent = text;
            item.appendChild(label);
            technologies.appendChild(item);
        });
    }

    const image = projectAssetUrl(getString(page, ["appLogo"]) || getString(project, ["image"]));
    const logo = root.querySelector('[data-record-field="appLogo"]');
    if (logo && image) {
        logo.src = image;
        logo.alt = getString(page, ["appName"]) + " logo";
    }

    const githubButton = root.querySelector(".linkBtns .githubBtn");
    setPageHref(githubButton, getString(page, ["sourceCodeUrl"]) || getString(project, ["githubLink"]));
    const demoButton = root.querySelector(".linkBtns .liveMoodBtn");
    setPageHref(demoButton, getString(page, ["demoUrl"]));

    renderProjectHero(page);
    renderProjectFeatures(page);
    renderProjectScreenshots(page);
    renderProjectSpecifications(page);
    renderProjectLinks(page);
    renderProjectTechStack(page);
    renderRelatedProjects(page);

    if (window.AOS?.refresh) window.AOS.refresh();
}

const projectsPageRoot = document.querySelector(".projectRecord");
const requestedProjectId = projectsPageRoot
    ? new URLSearchParams(window.location.search).get("id") ||
        new URLSearchParams(window.location.search).get("projectId") ||
        projectsPageRoot.dataset.recordDocumentId
    : "";

function findProject(data, id) {
    return entriesOf(data).find(([key, project]) =>
        getString(project, ["id", "recordId", "cardId"]) === id ||
        key === id ||
        getString(project.page, ["id", "projectId"]) === id
    )?.[1] || null;
}

function renderProjectsData(data) {
    if (document.querySelector(".projectContainer.projects-swiper")) {
        renderProjectCards(data);
    }

    if (projectsPageRoot) {
        const project = findProject(data, requestedProjectId);
        if (project) {
            renderProjectPage(project);
        } else {
            console.warn("[Firebase] Projects: no project matches id \"" + requestedProjectId + "\".");
        }
    }
}

const loadProjects = createSectionLoader({
    path: PROJECTS_PATH,
    cacheKey: CACHE_KEYS.projects,
    render: renderProjectsData,
    label: "Projects"
});

const loadExperience = createSectionLoader({
    path: EXPERIENCE_PATH,
    cacheKey: CACHE_KEYS.experience,
    render: renderExperience,
    label: "Experience"
});

const loadSkills = createSectionLoader({
    path: SKILLS_PATH,
    cacheKey: CACHE_KEYS.skills,
    render: renderSkills,
    label: "Skills"
});

const loadComments = createSectionLoader({
    path: COMMENTS_PATH,
    cacheKey: CACHE_KEYS.comments,
    render: renderComments,
    label: "Comments"
});

const loadContact = createSectionLoader({
    path: CONTACT_PATH,
    cacheKey: CACHE_KEYS.contact,
    render: renderContact,
    label: "Contact"
});

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

if (document.querySelector("#home") && document.querySelector("#experience") && document.querySelector("#skills")) {
    loadHome();
    loadExperience();
    loadSkills();
}

if (document.querySelector(".projectContainer.projects-swiper") || projectsPageRoot) {
    loadProjects();
}

if (document.querySelector(".comments-swiper")) {
    loadComments();
}

if (document.querySelector("#contact .contactInfo")) {
    loadContact();
}

startAnalytics();
