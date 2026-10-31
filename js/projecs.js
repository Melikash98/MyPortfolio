const projectRecord = document.querySelector(
  '.projectRecord[data-record-collection="projects"]'
);
const projectPageParams = new URLSearchParams(window.location.search);
const requestedProjectDocumentId = projectPageParams.get("id") || projectPageParams.get("projectId");

if (projectRecord && requestedProjectDocumentId && window.assignRecordDomId) {
  window.assignRecordDomId(
    projectRecord,
    projectRecord.dataset.recordCollection,
    requestedProjectDocumentId
  );
  window.hydrateRecordDomIds?.(document);
}

new Swiper(".postgap-showcase__swiper", {
  loop: true,
  centeredSlides: true,
  slidesPerView: 1.45,
  spaceBetween: 0,
  speed: 650,
  grabCursor: true,
  navigation: {
    nextEl: ".postgap-showcase__next",
    prevEl: ".postgap-showcase__prev"
  },
  breakpoints: {
    700: {
      slidesPerView: 3
    }
  }
});

const screenshotsElement = document.querySelector(".postgap-screenshots__swiper");

if (screenshotsElement) {
  const currentCounter = document.querySelector(".screenshotCurrent");
  const totalCounter = document.querySelector(".screenshotTotal");
  const screenshotCount = screenshotsElement.querySelectorAll(".swiper-slide").length;

  if (totalCounter) {
    totalCounter.textContent = String(screenshotCount).padStart(2, "0");
  }

  const updateScreenshotCounter = swiper => {
    if (currentCounter) {
      currentCounter.textContent = String(swiper.realIndex + 1).padStart(2, "0");
    }
  };

  new Swiper(screenshotsElement, {
    slidesPerView: "auto",
    spaceBetween: 8,
    speed: 450,
    grabCursor: true,
    watchOverflow: true,
    keyboard: {
      enabled: true,
      onlyInViewport: true
    },
    navigation: {
      nextEl: ".screenshotNext",
      prevEl: ".screenshotPrev"
    },
    on: {
      init: updateScreenshotCounter,
      slideChange: updateScreenshotCounter
    }
  });
}

const donateProjectElement = document.querySelector('.donateProject');

if (donateProjectElement) {
  donateProjectElement.setAttribute('role', 'link');
  donateProjectElement.setAttribute('tabindex', '0');

  const goToDonatePage = () => {
    window.location.href = new URL('../html/donait.html', document.baseURI).href;
  };

  donateProjectElement.addEventListener('click', goToDonatePage);
  donateProjectElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToDonatePage();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.querySelector(".activityPopupModel");
  const dialog = popup?.querySelector(".popupActivityContainer");
  const closeButton = popup?.querySelector(".containerASClosed");
  const triggers = [...document.querySelectorAll(".activityPopup")];

  if (!popup || !dialog || !closeButton || triggers.length === 0) return;

  let activeTrigger = null;
  let previousBodyOverflow = "";
  let previousDocumentOverflow = "";
  let lastRequestAt = 0;
  let requestSequence = 0;
  let requestController = null;
  let refreshTimer = 0;
  const chart = dialog.querySelector("[data-wakatime-chart]");
  const calendar = dialog.querySelector("[data-wakatime-calendar]");
  const legend = dialog.querySelector("[data-wakatime-legend]");
  const status = dialog.querySelector("[data-wakatime-status]");
  const projectTitle = dialog.querySelector("[data-wakatime-project-title]");
  const endpoint = dialog.dataset.wakatimeEndpoint || "../wakatime-activity.php";
  const refreshIntervalMs = 20 * 60 * 1000;
  const dateFormat = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });

  function setActivityStatus(message, state = "") {
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  }

  function getCurrentProjectId() {
    const params = new URLSearchParams(window.location.search);
    const routeId = params.get("id") || params.get("projectId") || params.get("slug");
    const root = document.querySelector('.projectRecord[data-record-collection="projects"]');
    return routeId || root?.dataset.projectId || root?.dataset.recordDocumentId || "";
  }

  function formatCodingDuration(value) {
    const totalSeconds = Math.max(0, Math.round(Number(value) || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }
    return `${seconds}s`;
  }

  function formatSyncTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "the last successful sync";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function renderActivity(data, sequence) {
    if (sequence !== requestSequence) return;
    const days = Array.isArray(data.days) ? data.days : [];
    const period = data.period || {};
    const startDate = period.startDate;

    if (days.length !== 365 || !/^\d{4}-\d{2}-\d{2}$/.test(startDate || "")) {
      throw new Error("WakaTime returned an invalid 365-day activity range.");
    }

    const start = new Date(`${startDate}T00:00:00Z`);
    if (Number.isNaN(start.getTime())) {
      throw new Error("WakaTime returned an invalid activity start date.");
    }

    const normalizedDays = days.map((day, index) => {
      const expectedDate = new Date(start);
      expectedDate.setUTCDate(expectedDate.getUTCDate() + index);
      const expectedKey = expectedDate.toISOString().slice(0, 10);
      const seconds = Number(day?.seconds);
      if (day?.date !== expectedKey || !Number.isFinite(seconds) || seconds < 0) {
        throw new Error("WakaTime returned incomplete or out-of-order daily activity.");
      }
      return { date: expectedKey, seconds };
    });

    const maxSeconds = Math.max(0, ...normalizedDays.map((day) => day.seconds));
    const fragment = document.createDocumentFragment();
    const firstWeekday = (start.getUTCDay() + 6) % 7;
    let gridCellCount = 0;

    for (let index = 0; index < firstWeekday; index += 1) {
      const spacer = document.createElement("span");
      spacer.className = "wakatimeCell wakatimeCell--empty";
      spacer.setAttribute("aria-hidden", "true");
      fragment.appendChild(spacer);
      gridCellCount += 1;
    }

    normalizedDays.forEach((day) => {
      const cell = document.createElement("span");
      const level = day.seconds <= 0 || maxSeconds <= 0
        ? 0
        : Math.max(1, Math.min(5, Math.ceil((day.seconds / maxSeconds) * 5)));
      const date = new Date(`${day.date}T00:00:00Z`);
      const duration = formatCodingDuration(day.seconds);

      cell.className = "wakatimeCell";
      cell.dataset.level = String(level);
      cell.title = `${dateFormat.format(date)} — ${duration} coding`;
      cell.setAttribute("aria-hidden", "true");
      fragment.appendChild(cell);
      gridCellCount += 1;
    });

    while (gridCellCount % 7 !== 0) {
      const spacer = document.createElement("span");
      spacer.className = "wakatimeCell wakatimeCell--empty";
      spacer.setAttribute("aria-hidden", "true");
      fragment.appendChild(spacer);
      gridCellCount += 1;
    }

    chart.replaceChildren(fragment);
    chart.setAttribute(
      "aria-label",
      `Daily coding duration for ${data.project?.title || "this project"} over the last 365 days.`
    );
    if (data.project?.title) projectTitle.textContent = data.project.title;
    calendar.hidden = false;
    legend.hidden = false;

    const syncedAt = formatSyncTime(data.updatedAt);
    if (data.cacheStatus === "stale") {
      setActivityStatus(`WakaTime could not be refreshed. Showing saved activity; last synced ${syncedAt}.`, "stale");
    } else if (data.cacheStatus === "cached") {
      setActivityStatus(`Cached WakaTime activity; last successfully synced ${syncedAt}.`, "cached");
    } else {
      setActivityStatus(`Live WakaTime activity; synced ${syncedAt}.`, "live");
    }
  }

  function clearActivity(message, state = "unavailable") {
    chart.replaceChildren();
    calendar.hidden = true;
    legend.hidden = true;
    projectTitle.textContent = "Project coding activity";
    setActivityStatus(message, state);
  }

  async function loadWakaTimeActivity() {
    const projectId = getCurrentProjectId();
    if (!projectId) {
      clearActivity("This page does not identify a Portfolio project.");
      return;
    }

    chart.replaceChildren();
    calendar.hidden = true;
    legend.hidden = true;
    projectTitle.textContent = "Project coding activity";

    requestController?.abort();
    requestController = new AbortController();
    const controller = requestController;
    const sequence = ++requestSequence;
    lastRequestAt = Date.now();
    setActivityStatus("Loading this project's WakaTime activity…", "loading");

    try {
      const url = new URL(endpoint, document.baseURI);
      url.searchParams.set("projectId", projectId);
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("The WakaTime backend did not return JSON. Serve this page through a PHP-enabled host.");
      }
      if (!data || typeof data !== "object") {
        throw new Error("The WakaTime backend returned an invalid response.");
      }
      if (sequence !== requestSequence) return;
      if (!response.ok) {
        const error = new Error(data.message || "Project WakaTime activity is unavailable.");
        error.code = data.errorCode || "wakatime_unavailable";
        error.project = data.project;
        throw error;
      }
      if (data.requestedProjectId !== projectId) {
        throw new Error("The activity response does not belong to the currently displayed project.");
      }

      renderActivity(data, sequence);
    } catch (error) {
      if (sequence !== requestSequence || error.name === "AbortError") return;

      const unavailableCodes = new Set([
        "wakatime_mapping_missing",
        "wakatime_mapping_ambiguous",
        "wakatime_mapping_changed",
        "wakatime_activity_name_ambiguous",
        "wakatime_not_configured",
        "project_not_found",
        "portfolio_id_ambiguous"
      ]);
      const message = error.message || "Project WakaTime activity is unavailable.";
      clearActivity(message, unavailableCodes.has(error.code) ? "unavailable" : "error");
      if (error.project?.title) projectTitle.textContent = error.project.title;
    }
  }

  function startAutomaticRefresh() {
    if (refreshTimer) return;
    refreshTimer = window.setInterval(() => {
      if (popup.classList.contains("active") && document.visibilityState === "visible") {
        loadWakaTimeActivity();
      }
    }, refreshIntervalMs);
  }

  function focusWithoutScroll(element) {
    if (!element) return;
    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }
  }

  function openActivityPopup(trigger) {
    if (popup.classList.contains("active")) return;

    activeTrigger = trigger;
    previousBodyOverflow = document.body.style.overflow;
    previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    popup.classList.add("active");
    dialog.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
    startAutomaticRefresh();
    loadWakaTimeActivity();
    window.requestAnimationFrame(() => focusWithoutScroll(closeButton));
  }

  function closeActivityPopup() {
    if (!popup.classList.contains("active")) return;

    popup.classList.remove("active");
    dialog.setAttribute("aria-hidden", "true");
    requestController?.abort();
    requestSequence += 1;
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousDocumentOverflow;

    const triggerToRestore = activeTrigger;
    activeTrigger = null;
    if (triggerToRestore) {
      triggerToRestore.setAttribute("aria-expanded", "false");
      focusWithoutScroll(triggerToRestore);
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openActivityPopup(trigger));
  });

  closeButton.addEventListener("click", closeActivityPopup);

  popup.addEventListener("click", (event) => {
    if (event.target === popup) closeActivityPopup();
  });

  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible"
      && popup.classList.contains("active")
      && Date.now() - lastRequestAt >= refreshIntervalMs
    ) {
      loadWakaTimeActivity();
    }
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeActivityPopup();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = [...dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");

    if (focusableElements.length === 0) {
      event.preventDefault();
      focusWithoutScroll(dialog);
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      focusWithoutScroll(last);
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      focusWithoutScroll(first);
    }
  });
});
// TODO: *************************************************************** GLOBAL ANIMATION **********************************************************************//
// ! Word Transition Effect for Role Text
AOS.init({
  duration: 1000,
  once: true
});

const projectsScrollControl = document.querySelector(".scrollControl");

if (projectsScrollControl) {
  const getProjectsPageMaxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const syncProjectsScrollDirection = () => {
    if (window.scrollY <= 2) {
      projectsScrollControl.dataset.direction = "down";
      projectsScrollControl.setAttribute("aria-label", "Scroll to bottom");
    } else if (window.scrollY >= getProjectsPageMaxScroll() - 2) {
      projectsScrollControl.dataset.direction = "up";
      projectsScrollControl.setAttribute("aria-label", "Scroll to top");
    }
  };

  projectsScrollControl.addEventListener("click", () => {
    const target = projectsScrollControl.dataset.direction === "down"
      ? getProjectsPageMaxScroll()
      : 0;

    window.scrollTo({
      top: target,
      behavior: "smooth"
    });
  });

  window.addEventListener("scroll", syncProjectsScrollDirection, { passive: true });
  window.addEventListener("resize", syncProjectsScrollDirection);
  window.addEventListener("load", syncProjectsScrollDirection);
  syncProjectsScrollDirection();
}
