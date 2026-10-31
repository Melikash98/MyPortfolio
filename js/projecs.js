const projectRecord = document.querySelector(
  '.projectRecord[data-record-collection="projects"]'
);
const requestedProjectDocumentId = new URLSearchParams(window.location.search).get("projectId");

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
    window.requestAnimationFrame(() => focusWithoutScroll(closeButton));
  }

  function closeActivityPopup() {
    if (!popup.classList.contains("active")) return;

    popup.classList.remove("active");
    dialog.setAttribute("aria-hidden", "true");
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
