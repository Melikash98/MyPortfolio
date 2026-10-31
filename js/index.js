// ! *************************************************************** index.js **********************************************************************//
// TODO: *************************************************************** Menu Slide **********************************************************************//
document.addEventListener('DOMContentLoaded', () => {
  const menuOpen = document.querySelector('.menuOpen');
  const closeMenuButton = document.querySelector('.closedMenuSlide');
  const slideHeader = document.querySelector('.slideHeder');
  const navLinks = document.querySelectorAll('.slideNav a');
  const header = document.querySelector('.header');
  const sections = document.querySelectorAll('main .section');
  let closeTimer = null;
  let isClosing = false;
  menuOpen.setAttribute('role', 'button');
  menuOpen.setAttribute('tabindex', '0');
  menuOpen.setAttribute('aria-expanded', 'false');
  closeMenuButton.setAttribute('role', 'button');
  closeMenuButton.setAttribute('tabindex', '0');
  function openMenu() {
    clearTimeout(closeTimer);
    isClosing = false;
    closeMenuButton.classList.remove('is-closing');
    slideHeader.classList.add('is-open');
    menuOpen.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    if (!slideHeader.classList.contains('is-open')) {
      return;
    }
    if (isClosing) {
      return;
    }
    isClosing = true;
    closeMenuButton.classList.remove('is-closing');
    void closeMenuButton.offsetWidth;
    closeMenuButton.classList.add('is-closing');
    menuOpen.setAttribute('aria-expanded', 'false');
    closeTimer = setTimeout(() => {
      slideHeader.classList.remove('is-open');
      closeMenuButton.classList.remove('is-closing');
      isClosing = false;
    }, 450);
  }
  menuOpen.addEventListener('click', (event) => {
    event.stopPropagation();
    if (slideHeader.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  closeMenuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    closeMenu();
  });
  menuOpen.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (slideHeader.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    }
  });
  closeMenuButton.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeMenu();
    }
  });
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) {
        return;
      }
      const targetSection = document.querySelector(href);
      if (!targetSection) {
        return;
      }
      event.preventDefault();
      navLinks.forEach((item) => {
        item.classList.remove('active');
      });
      link.classList.add('active');
      const headerHeight = header
        ? header.offsetHeight
        : 0;
      const targetPosition =
        targetSection.getBoundingClientRect().top +
        window.scrollY -
        headerHeight;
      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'smooth'
      });
      closeMenu();
    });
  });
  document.addEventListener('click', (event) => {
    if (!slideHeader.classList.contains('is-open')) {
      return;
    }
    const clickedInsideMenu = slideHeader.contains(event.target);
    const clickedMenuButton = menuOpen.contains(event.target);
    if (!clickedInsideMenu && !clickedMenuButton) {
      closeMenu();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${currentId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    {
      threshold: 0.55
    }
  );
  sections.forEach((section) => {
    observer.observe(section);
  });
});
const contactToDonatePage = document.querySelector('.donate');

if (contactToDonatePage) {
  contactToDonatePage.setAttribute('role', 'link');
  contactToDonatePage.setAttribute('tabindex', '0');

  const goToDonatePage = () => {
    window.location.href = new URL('html/donait.html', document.baseURI).href;
  };

  contactToDonatePage.addEventListener('click', goToDonatePage);
  contactToDonatePage.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToDonatePage();
    }
  });
}
const contactToDonatePageWithSlideBar = document.querySelector('.goDonate');

if (contactToDonatePageWithSlideBar) {
  contactToDonatePageWithSlideBar.setAttribute('role', 'link');
  contactToDonatePageWithSlideBar.setAttribute('tabindex', '0');

  const goToDonatePage = () => {
    window.location.href = new URL('html/donait.html', document.baseURI).href;
  };

  contactToDonatePageWithSlideBar.addEventListener('click', goToDonatePage);
  contactToDonatePageWithSlideBar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToDonatePage();
    }
  });
}
const shareControl = document.querySelector('#shareControl');

shareControl.addEventListener('click', async () => {
  const shareData = {
    title: document.title,
    text: 'Check out this page:',
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      alert('Link copied');
    }
  } catch (error) {
    if (error.name !== 'AbortError') console.error(error);
  }
});

shareControl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    shareControl.click();
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const bottomNavLinks = document.querySelectorAll('.bottomNavigation a');
  const sections = document.querySelectorAll('main .section');
  let pendingTargetId = null;
  let pendingScrollTimer = null;
  let activeUpdateFrame = null;

  function setActiveLink(currentId) {
    bottomNavLinks.forEach((link) => {
      const href = link.getAttribute('href');

      if (href === `#${currentId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  bottomNavLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');

      if (!href || !href.startsWith('#')) {
        return;
      }

      const targetSection = document.querySelector(href);

      if (!targetSection) {
        return;
      }

      event.preventDefault();
      setActiveLink(targetSection.id);

      const header = document.querySelector('.header');
      const headerHeight = header ? header.offsetHeight : 0;

      const targetPosition =
        targetSection.getBoundingClientRect().top +
        window.scrollY -
        headerHeight;

      const scrollDistance = Math.abs(window.scrollY - Math.max(0, targetPosition));
      clearTimeout(pendingScrollTimer);
      pendingTargetId = scrollDistance > 1 ? targetSection.id : null;

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'smooth'
      });
    });
  });

  function updateActiveFromScroll() {
    activeUpdateFrame = null;

    if (pendingTargetId) {
      return;
    }

    const activationLine = window.innerHeight * 0.4;
    let currentSection = sections[0];

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= activationLine) {
        currentSection = section;
      }
    });

    if (currentSection) {
      setActiveLink(currentSection.id);
    }
  }

  function finishPendingScroll() {
    if (!pendingTargetId) {
      return;
    }

    clearTimeout(pendingScrollTimer);
    pendingTargetId = null;
    updateActiveFromScroll();
  }

  function handleBottomNavScroll() {
    if (pendingTargetId) {
      clearTimeout(pendingScrollTimer);
      pendingScrollTimer = setTimeout(finishPendingScroll, 140);
      return;
    }

    if (activeUpdateFrame === null) {
      activeUpdateFrame = requestAnimationFrame(updateActiveFromScroll);
    }
  }

  window.addEventListener('scroll', handleBottomNavScroll, { passive: true });
  window.addEventListener('resize', handleBottomNavScroll);
  window.addEventListener('scrollend', finishPendingScroll);
  updateActiveFromScroll();
});
// TODO: ***************************************************************HOME Section**********************************************************************//
// TODO: Word Transition Effect for Role Text
let roles = [
  "Melika",
  "Software Developer",
  "Backend Developer",
  "Android Developer"
];

const roleElements = [
  document.getElementById("role-animation"),
  document.getElementById("role-animationTwo")
].filter(Boolean);

let roleIndex = 0;
let letterIndex = 0;
let typingInterval = null;
let roleTimeout = null;

function updateRole() {
  if (!roleElements.length || !roles.length) return;

  clearTimeout(roleTimeout);
  clearInterval(typingInterval);

  roleElements.forEach((element) => {
    element.style.opacity = "0";
  });

  roleTimeout = setTimeout(() => {
    roleElements.forEach((element) => {
      element.textContent = "";
    });

    letterIndex = 0;

    typingInterval = setInterval(() => {
      const currentRole = roles[roleIndex];

      if (letterIndex < currentRole.length) {
        const character = currentRole.charAt(letterIndex);

        roleElements.forEach((element) => {
          element.textContent += character;
        });

        letterIndex++;
      } else {
        clearInterval(typingInterval);

        roleTimeout = setTimeout(() => {
          roleIndex = (roleIndex + 1) % roles.length;
          updateRole();
        }, 1000);
      }
    }, 150);

    roleElements.forEach((element) => {
      element.style.opacity = "1";
    });
  }, 500);
}

window.addEventListener("home:updated", (event) => {
  const newRoles = Array.isArray(event.detail?.roles)
    ? event.detail.roles.map((role) => String(role).trim()).filter(Boolean)
    : [];

  if (!newRoles.length) return;

  roles = newRoles;
  roleIndex = 0;
  letterIndex = 0;
  updateRole();
});

updateRole();
// TODO: *************************************************************** GLOBAL ANIMATION **********************************************************************//
// ! Word Transition Effect for Role Text
AOS.init({
  duration: 1000,
  once: true
});
// TODO: *************************************************************** SERVICES Section**********************************************************************//
// ! Swiper Services Items
const servicesSwiper = new Swiper('.services-swiper', {
  slidesPerView: 1,
  spaceBetween: 24,
  grabCursor: true,
  loop: false,

  pagination: {
    el: '.services-swiper .swiper-pagination',
    clickable: true,
  },

  breakpoints: {
    768: {
      slidesPerView: 2,
      spaceBetween: 16,
    },

    1025: {
      slidesPerView: 3,
      spaceBetween: 16,
    },

    1208: {
      slidesPerView: 3,
      spaceBetween: 32,
    },
  },
});
// ! Services Popup => Show Details Services
const servicesPopup = document.querySelector(".servicesPopupModel");
const serviceLinks = document.querySelectorAll(".linkeDetails");
const closePopup = document.querySelector(".containerSClosed");

serviceLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    if (!servicesPopup) return;

    const serviceCard = link.closest(".services-swiper .card");
    const detailServices = serviceCard?.querySelector(".detailServices");

    if (!detailServices) return;

    const popupMainBox = servicesPopup.querySelector(".mainBox");
    if (!popupMainBox) return;

    const subtitle =
      detailServices.querySelector("h4")?.textContent.trim() || "";

    const title =
      detailServices.querySelector("h3")?.textContent.trim() || "";

    const description =
      detailServices.querySelector("p")?.textContent.trim() || "";

    const listItems = [...detailServices.querySelectorAll("li")];

    popupMainBox.innerHTML = `
      <h6 class="popupSubtitle">${subtitle}</h6>
      <h1 class="popupTitle">${title}</h1>
      <p class="popupDescription">${description}</p>

      <ul class="popupListGroup grid">
        ${listItems.map((item) => `
          <li class="popupListItem">
            <i class="ri-git-commit-fill popupListIcon"></i>
            <p class="popupListText">${item.textContent.trim()}</p>
          </li>
        `).join("")}
      </ul>

      <div class="arrowDownScroll"
           role="button"
           tabindex="0"
           aria-label="Scroll through service items">
        <svg class="scrollArrowSvg"
             xmlns="http://www.w3.org/2000/svg"
             width="24"
             height="24"
             fill="currentColor"
             viewBox="0 0 24 24">
          <path d="M16.29 10.79 13 14.09V6h-2v8.09l-3.29-3.3-1.42 1.42 5.71 5.7 5.71-5.7z"></path>
        </svg>
      </div>

      <div class="moreBtn"
           data-btn="More"
           role="button"
           tabindex="0"
           aria-label="Show remaining service items">
        <i class="ri-more-fill"></i>
      </div>
    `;

    const isPhone = window.matchMedia("(max-width: 490px)").matches;
    const popupList = popupMainBox.querySelector(".popupListGroup");
    const popupItems = popupMainBox.querySelectorAll(".popupListItem");
    const moreBtn = popupMainBox.querySelector(".moreBtn");
    const arrow = popupMainBox.querySelector(".arrowDownScroll");
    const shouldShowMore = isPhone && popupItems.length > 2;

    popupMainBox.classList.toggle("is-collapsed", shouldShowMore);
    moreBtn.hidden = !shouldShowMore;
    arrow.hidden = true;

    if (shouldShowMore) {
      moreBtn.addEventListener("click", () => {
        popupList.style.boxSizing = "border-box";
        popupList.style.height =
          `${popupList.getBoundingClientRect().height}px`;

        popupMainBox.classList.remove("is-collapsed");
        popupList.style.overflowY = "scroll";

        moreBtn.hidden = true;
        arrow.hidden = false;

        const thirdItem = popupItems[2];
        const listTop = popupList.getBoundingClientRect().top;
        const itemTop = thirdItem.getBoundingClientRect().top;

        popupList.scrollTo({
          top: popupList.scrollTop + itemTop - listTop,
          behavior: "smooth"
        });
      }, { once: true });
    }

    arrow.addEventListener("click", () => {
      popupList.scrollBy({
        top: popupList.clientHeight * 0.75,
        behavior: "smooth"
      });
    });

    const addKeyboardClick = (element) => {
      element.addEventListener("keydown", (keyEvent) => {
        if (keyEvent.key === "Enter" || keyEvent.key === " ") {
          keyEvent.preventDefault();
          element.click();
        }
      });
    };

    addKeyboardClick(moreBtn);
    addKeyboardClick(arrow);

    servicesPopup.classList.add("active");
    document.body.style.overflow = "hidden";
  });
});

function closeServicesPopup() {
  if (!servicesPopup) return;

  servicesPopup.classList.remove("active");
  document.body.style.overflow = "";
}

closePopup?.addEventListener("click", closeServicesPopup);

servicesPopup?.addEventListener("click", (event) => {
  if (event.target === servicesPopup) {
    closeServicesPopup();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    servicesPopup?.classList.contains("active")
  ) {
    closeServicesPopup();
  }
});
// TODO: *************************************************************** Experience Section **********************************************************************//
const resumeItems = document.querySelectorAll(".resumeItem");
resumeItems.forEach((item) => {
  const toggle = item.querySelector(".resumeToggle");
  const button = item.querySelector(".detailsBtn, .detailsEXBtn");
  const details = item.querySelector(".detailItem");
  const icon = button?.querySelector("i");
  if (!toggle || !button || !details || !icon) return;
  toggle.addEventListener("click", () => {
    const isOpen = item.classList.contains("active");
    if (isOpen) {
      closeResumeItem(item, details, icon);
      return;
    }
    const column = item.parentElement;
    const otherItems = column.querySelectorAll(".resumeItem");
    otherItems.forEach((otherItem) => {
      if (otherItem !== item) {
        const otherDetails = otherItem.querySelector(".detailItem");
        const otherIcon = otherItem.querySelector(
          ".detailsBtn i, .detailsEXBtn i"
        );
        if (otherDetails && otherIcon) {
          closeResumeItem(
            otherItem,
            otherDetails,
            otherIcon
          );
        }
      }
    });
    openResumeItem(item, details, icon);
  });
});
// TODO: Open Resume Item
function openResumeItem(item, details, icon) {
  item.classList.add("active");
  details.style.maxHeight = `${details.scrollHeight}px`;
  icon.classList.remove("ri-add-large-fill");
  icon.classList.add("ri-subtract-fill");
}
// TODO: Close Resume Item
function closeResumeItem(item, details, icon) {
  item.classList.remove("active");
  details.style.maxHeight = "0px";
  icon.classList.remove("ri-subtract-fill");
  icon.classList.add("ri-add-large-fill");
}
// TODO: *************************************************************** Skills Section **********************************************************************//
const skillsTabRoot = document.querySelector(".skillsTab");

function activateSkillTab(tab) {
  const targetId = tab?.dataset.target?.replace(/^#/, "");
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target || !target.matches(".skillsGroup[data-content]")) return;

  skillsTabRoot?.querySelectorAll(".skillsHeader[data-target]").forEach((tabItem) => {
    const active = tabItem === tab;
    tabItem.classList.toggle("skillsActive", active);
    tabItem.setAttribute("aria-expanded", String(active));
  });

  document.querySelectorAll(".skilldContent .skillsGroup[data-content]").forEach((group) => {
    const active = group === target;
    group.classList.toggle("skillsActive", active);
    group.setAttribute("aria-hidden", String(!active));
  });
}

skillsTabRoot?.addEventListener("click", (event) => {
  const tab = event.target.closest(".skillsHeader[data-target]");
  if (tab) activateSkillTab(tab);
});

skillsTabRoot?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const tab = event.target.closest(".skillsHeader[data-target]");
  if (!tab) return;
  event.preventDefault();
  activateSkillTab(tab);
});

const skillSwipers = document.querySelectorAll('.skillsList.swiper');
skillSwipers.forEach((swiperElement) => {
  new Swiper(swiperElement, {
    direction: 'vertical',
    slidesPerView: 'auto',
    freeMode: true,
    mousewheel: true,

    scrollbar: {
      el: swiperElement.querySelector('.swiper-scrollbar'),
      draggable: true,
    },
  });
});
// TODO: *************************************************************** Projects Section **********************************************************************//
// ! Swiper Projects Items
let projectItems = [...document.querySelectorAll(".projectContainer .boxCard")];
const projectsSwiper = document.querySelector(".projects-swiper")
  ? new Swiper(".projects-swiper", {
    slidesPerView: 1,
    spaceBetween: 24,
    grabCursor: true,
    loop: false,
    grid: { rows: 3, fill: "row" },
    pagination: {
      el: ".projects-swiper .swiper-pagination",
      clickable: true
    },
    breakpoints: {
      491: { grid: { rows: 1, fill: "row" } },
      768: { slidesPerView: 2, spaceBetween: 24 },
      1208: { slidesPerView: 3, spaceBetween: 32 }
    }
  })
  : null;

const filterButtons = document.querySelectorAll(".filterItems");

function applyProjectFilter(filterValue) {
  if (!projectsSwiper) return;
  const filteredProjects = projectItems.filter((item) =>
    filterValue === "all" || item.dataset.category === filterValue
  );
  projectsSwiper.removeAllSlides();
  projectsSwiper.appendSlide(filteredProjects);
  projectsSwiper.update();
  projectsSwiper.slideTo(0, 0);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    applyProjectFilter(button.dataset.filter || "all");
  });
});

window.addEventListener("projects:data-rendered", (event) => {
  projectItems = Array.isArray(event.detail?.cards)
    ? event.detail.cards
    : [...document.querySelectorAll(".projectContainer .boxCard")];
  const activeFilter = document.querySelector(".filterItems.active")?.dataset.filter || "all";
  applyProjectFilter(activeFilter);
});

// ! Project Popup => Show Details Project
document.addEventListener("DOMContentLoaded", () => {
  const projectPopup = document.querySelector(".projectsPopupModel");
  if (!projectPopup) return;

  const closeButton = projectPopup.querySelector(".containerPClosed");
  const popupImage = projectPopup.querySelector(".projectCardImg img");
  const popupImageBox = projectPopup.querySelector(".projectCardImg");
  const popupName = projectPopup.querySelector(".nameProject");
  const popupCompany = projectPopup.querySelector(".companyName");
  const popupDate = projectPopup.querySelector(".dateFiishProject");
  const popupDescription = projectPopup.querySelector(".explainProject");
  const popupList = projectPopup.querySelector(".infoList ul");
  const popupGithubWrapper = projectPopup.querySelector(".btn-github-linke");
  const popupGithub = projectPopup.querySelector(".btn-github-linke a");
  const popupMoreWrapper = projectPopup.querySelector(".btn-project-more");
  const popupMore = projectPopup.querySelector(".btn-project-more a");
  const demoDetails = projectPopup.querySelector(".ditailInfoDemo");
  const overviewText = projectPopup.querySelector(".explainProjectTwo");
  const infoListDetails = projectPopup.querySelector(".infoListTwo .dataTwo");
  const projectContainer = document.querySelector(".projectContainer");

  function popupHref(value) {
    const href = String(value || "").trim();
    if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href;
    if (/^(html\/|\/|#)/i.test(href)) return href;
    return "";
  }

  function appendSafeMarkup(target, value) {
    const parsed = new DOMParser().parseFromString(String(value || ""), "text/html");
    const allowedTags = new Set(["STRONG", "B", "EM", "I", "BR"]);
    const blockedTags = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG", "MATH"]);

    function copyNode(source, parent) {
      if (source.nodeType === Node.TEXT_NODE) {
        parent.appendChild(document.createTextNode(source.textContent || ""));
        return;
      }
      if (source.nodeType !== Node.ELEMENT_NODE || blockedTags.has(source.tagName)) return;
      if (allowedTags.has(source.tagName)) {
        const safeElement = document.createElement(source.tagName.toLowerCase());
        [...source.childNodes].forEach((child) => copyNode(child, safeElement));
        parent.appendChild(safeElement);
        return;
      }
      [...source.childNodes].forEach((child) => copyNode(child, parent));
    }

    [...parsed.body.childNodes].forEach((node) => copyNode(node, target));
  }

  function getProjectPopupData(card) {
    try {
      const data = JSON.parse(card.dataset.projectPopup || "");
      if (data && typeof data === "object") return data;
    } catch {
      // The static HTML remains a usable fallback when Firebase is unavailable.
    }

    const detail = card.querySelector(".projectDetail");
    if (!detail) return null;
    const detailImage = detail.querySelector("img");
    const detailDate = detail.querySelector("h5");
    return {
      title: detail.querySelector("h4")?.textContent.trim(),
      companyName: detail.querySelector("h6")?.textContent.trim(),
      date: detailDate?.textContent.replace(/^Date:\s*/i, "").trim(),
      duration: detailDate?.querySelector("span")?.textContent.trim(),
      image: detailImage?.getAttribute("src"),
      description: detail.querySelector("p")?.innerHTML || "",
      employer: detail.querySelector("ul li:nth-child(1) span")?.textContent.trim(),
      roleMe: detail.querySelector("ul li:nth-child(2) span")?.textContent.trim(),
      role: detail.querySelector("ul li:nth-child(3) span")?.textContent.trim(),
      rate: detail.querySelector("ul li:nth-child(4) span")?.textContent.trim(),
      githubLink: detail.querySelector(".btn-github-linke a")?.getAttribute("href"),
      seeMoreLink: detail.querySelector(".btn-project-more a")?.getAttribute("href")
    };
  }

  function renderValueRows(list, items) {
    if (!list) return;
    list.replaceChildren();
    items.forEach(({ label, value }) => {
      if (!value) return;
      const item = document.createElement("li");
      item.append(document.createTextNode(label + " : "));
      const valueElement = document.createElement("span");
      valueElement.textContent = value;
      item.appendChild(valueElement);
      list.appendChild(item);
    });
  }

  function renderMobileDemoRows(list, items) {
    if (!list) return;
    list.replaceChildren();
    const headingTags = ["h4", "h6", "h5"];
    items.slice(0, 3).forEach(({ label, value }, index) => {
      if (!value) return;
      const item = document.createElement("li");
      const heading = document.createElement(headingTags[index]);
      const icon = document.createElement("i");
      icon.className = "ri-circle-fill";
      icon.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent = value;
      heading.append(icon, document.createTextNode(label + ": "), text);
      item.appendChild(heading);
      list.appendChild(item);
    });
  }

  function setPopupImage(source, alt) {
    if (!popupImage || !popupImageBox) return;
    popupImageBox.classList.remove("landscape", "portrait");
    popupImage.onload = () => {
      const landscape = popupImage.naturalWidth > popupImage.naturalHeight;
      popupImageBox.classList.toggle("landscape", landscape);
      popupImageBox.classList.toggle("portrait", !landscape);
    };
    popupImage.onerror = () => popupImageBox.classList.remove("landscape", "portrait");
    popupImage.src = source || "";
    popupImage.alt = alt || "";
    if (popupImage.complete && popupImage.naturalWidth) popupImage.onload();
  }

  function openProjectPopup(card) {
    const data = getProjectPopupData(card);
    if (!data) return;
    const descriptionItems = Array.isArray(data.description) ? data.description : [data.description];
    const descriptions = descriptionItems
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    const plainDescription = descriptions.map((item) => {
      const parsed = new DOMParser().parseFromString(item, "text/html");
      return parsed.body.textContent.replace(/\s+/g, " ").trim();
    }).filter(Boolean).join(" ");

    setPopupImage(data.image, data.title ? data.title + " project" : "Project preview");
    if (popupName) popupName.textContent = data.title || "Project";
    if (popupCompany) popupCompany.textContent = data.companyName || "";

    if (popupDate) {
      popupDate.replaceChildren(document.createTextNode("Date: " + (data.date || "—") + " "));
      if (data.duration) {
        const duration = document.createElement("span");
        duration.textContent = data.duration;
        popupDate.appendChild(duration);
      }
    }

    if (popupDescription) {
      popupDescription.replaceChildren();
      descriptions.forEach((description, index) => {
        if (index) {
          popupDescription.append(document.createElement("br"), document.createElement("br"));
        }
        appendSafeMarkup(popupDescription, description);
      });
    }

    if (overviewText) {
      overviewText.textContent = data.overview || plainDescription;
      overviewText.dataset.fullText = overviewText.textContent.replace(/\s+/g, " ").trim();
    }

    const details = [
      { label: "Employer", value: data.employer || data.companyName },
      { label: "Role", value: data.roleMe },
      { label: "Responsibilities", value: data.role },
      { label: "Rate", value: data.rate }
    ];
    renderValueRows(popupList, details);
    renderValueRows(infoListDetails, details);
    renderMobileDemoRows(demoDetails, [
      { label: "Name", value: data.title },
      { label: "Company", value: data.companyName },
      { label: "Date", value: data.date }
    ]);

    const githubHref = popupHref(data.githubLink);
    if (popupGithubWrapper && popupGithub) {
      if (githubHref) {
        popupGithub.href = githubHref;
        popupGithub.target = "_blank";
        popupGithub.rel = "noopener noreferrer";
        popupGithubWrapper.style.display = "";
      } else {
        popupGithub.removeAttribute("href");
        popupGithub.removeAttribute("target");
        popupGithub.removeAttribute("rel");
        popupGithubWrapper.style.display = "none";
      }
    }

    const moreHref = popupHref(data.seeMoreLink);
    if (popupMoreWrapper && popupMore) {
      if (moreHref) {
        popupMore.href = moreHref;
        popupMoreWrapper.style.display = "";
      } else {
        popupMore.removeAttribute("href");
        popupMoreWrapper.style.display = "none";
      }
    }

    window.dispatchEvent(new CustomEvent("project:popup-opened", {
      detail: { description: data.overview || plainDescription }
    }));
    projectPopup.classList.add("active");
    document.body.classList.add("popup-open");
  }

  projectContainer?.addEventListener("click", (event) => {
    const trigger = event.target.closest(".showProject");
    if (!trigger) return;
    const card = trigger.closest(".boxCard");
    if (!card) return;
    event.preventDefault();
    event.stopPropagation();
    openProjectPopup(card);
  });

  function closeProjectPopup() {
    projectPopup.classList.remove("active");
    document.body.classList.remove("popup-open");
  }

  closeButton?.addEventListener("click", closeProjectPopup);
  projectPopup.addEventListener("click", (event) => {
    if (event.target === projectPopup) closeProjectPopup();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && projectPopup.classList.contains("active")) {
      closeProjectPopup();
    }
  });
});
// TODO: *************************************************************** Tutorials Section **********************************************************************//
const tutorialsSwiper = new Swiper('.tutorialsSwiper', {
  slidesPerView: 1,
  spaceBetween: 24,
  grabCursor: true,
  loop: false,

  pagination: {
    el: '.tutorialsSwiper .swiper-pagination',
    clickable: true,
  },

  breakpoints: {
    768: {
      slidesPerView: 2,
      spaceBetween: 16,
    },

    1025: {
      slidesPerView: 3,
      spaceBetween: 16,
    },

    1208: {
      slidesPerView: 3,
      spaceBetween: 32,
    },
  },
});
// TODO: *************************************************************** Comments Section **********************************************************************//
const commentSwiper = new Swiper('.comments-swiper', {
  slidesPerView: 1,
  spaceBetween: 24,
  grabCursor: true,
  loop: false,

  pagination: {
    el: '.comments-swiper .swiper-pagination',
    clickable: true,
  },

  breakpoints: {
    768: {
      slidesPerView: 2,
      spaceBetween: 16,
    },

    1025: {
      slidesPerView: 3,
      spaceBetween: 14,
    },

    1208: {
      slidesPerView: 3,
      spaceBetween: 32,
    },
  },
});
// TODO: *************************************************************** Contact Section **********************************************************************//
const locationContact = document.getElementById("locationContact");
const emailContact = document.getElementById("emailContact");
const telegramContact = document.getElementById("telegramContact");
const linkedinContact = document.getElementById("linkedinContact");

const contactForm = document.getElementById("contactForm");
const formBottom = document.querySelector(".formBottom");
const terms = document.querySelector(".terms");
const contactButton = document.querySelector(".contactButton");

const contactLocation = document.querySelector(".contactLocation");
const contactMap = document.querySelector(".contact-map");

function showContactForm() {
  contactLocation.style.display = "none";
  contactLocation.style.visibility = "hidden";
  contactLocation.style.opacity = "0";
  contactLocation.style.pointerEvents = "none";

  contactMap.style.display = "none";
  contactMap.style.visibility = "hidden";
  contactMap.style.opacity = "0";

  contactForm.style.display = "flex";
  contactForm.style.visibility = "visible";
  contactForm.style.opacity = "1";
  contactForm.style.pointerEvents = "auto";

  formBottom.style.display = "flex";
  formBottom.style.visibility = "visible";
  formBottom.style.opacity = "1";

  terms.style.display = "block";
  terms.style.visibility = "visible";
  terms.style.opacity = "1";

  contactButton.style.display = "inline-block";
  contactButton.style.visibility = "visible";
  contactButton.style.opacity = "1";
  contactButton.style.pointerEvents = "auto";
}

function hideContactForm() {
  contactForm.style.display = "none";
  contactForm.style.visibility = "hidden";
  contactForm.style.opacity = "0";
  contactForm.style.pointerEvents = "none";

  formBottom.style.display = "none";
  formBottom.style.visibility = "hidden";
  formBottom.style.opacity = "0";

  terms.style.display = "none";
  terms.style.visibility = "hidden";
  terms.style.opacity = "0";

  contactButton.style.display = "none";
  contactButton.style.visibility = "hidden";
  contactButton.style.opacity = "0";
  contactButton.style.pointerEvents = "none";
}

function showContactMap() {
  hideContactForm();

  contactLocation.style.display = "block";
  contactLocation.style.visibility = "visible";
  contactLocation.style.opacity = "1";
  contactLocation.style.pointerEvents = "auto";

  contactMap.style.display = "block";

  requestAnimationFrame(() => {
    contactMap.style.visibility = "visible";
    contactMap.style.opacity = "1";
  });
}

function hideContactMap() {
  contactMap.style.opacity = "0";
  contactMap.style.visibility = "hidden";
  contactMap.style.pointerEvents = "none";

  contactLocation.style.opacity = "0";
  contactLocation.style.visibility = "hidden";
  contactLocation.style.pointerEvents = "none";

  setTimeout(() => {
    contactMap.style.display = "none";
    contactLocation.style.display = "none";
  }, 400);
}

locationContact.addEventListener("click", () => {
  showContactMap();
});

emailContact.addEventListener("click", () => {
  hideContactMap();
  showContactForm();
});

telegramContact.addEventListener("click", () => {
  const telegramUsername = "melika_sh_de";

  window.open(
    `https://t.me/${telegramUsername}`,
    "_blank",
    "noopener,noreferrer"
  );
});

linkedinContact.addEventListener("click", () => {
  window.open(
    "https://www.linkedin.com/in/melika-shooryabi/",
    "_blank",
    "noopener,noreferrer"
  );
});

showContactForm();
// TODO: *************************************************************** Email JS **********************************************************************//
// !Send Email Function
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const sendButton = document.querySelector(".contactButton");

  if (!form || !sendButton) {
    return;
  }

  sendButton.addEventListener("click", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    sendButton.disabled = true;
    sendButton.textContent = "Sending...";

    const templateParams = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      subject: document.getElementById("subject").value.trim(),
      message: document.getElementById("message").value.trim(),
      time: new Date().toLocaleString()
    };

    const templateAutoParams = {
      name: templateParams.name,
      email: templateParams.email,
      text: "Your feedback means a lot — thank you! It’s always a pleasure to hear from people who take a moment to share their thoughts. Whether you’ve spotted something worth improving or just wanted to say something kind, I truly appreciate it. Your voice helps shape a better experience for everyone.",
      time: templateParams.time
    };

    try {
      console.log("Main Email:", templateParams);
      console.log("Auto Email:", templateAutoParams);

      const firstResponse = await emailjs.send(
        "service_s615d4v",
        "template_3uzazjb",
        templateParams
      );

      console.log(
        "Main email sent successfully:",
        firstResponse.status,
        firstResponse.text
      );

      const secondResponse = await emailjs.send(
        "service_s615d4v",
        "template_xsclzib",
        templateAutoParams
      );

      console.log(
        "Auto email sent successfully:",
        secondResponse.status,
        secondResponse.text
      );

      alert("Your message has been sent successfully!");

      form.reset();

    } catch (error) {
      console.error("EmailJS Error:", error);

      alert("Failed to send your message. Please try again.");
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "Send Message";
    }
  });
});

// TODO: ***************************************************************  Worked With Scroll **********************************************************************//
document.addEventListener("DOMContentLoaded", () => {

  const bar = document.querySelector(".companyBar");
  const track = document.querySelector(".companyTrack");
  const originalSet = document.querySelector(".companySet");
  const glow = document.querySelector(".companyGlow");
  const tooltip = document.querySelector(".companyTooltip");

  if (!bar || !track || !originalSet || !glow || !tooltip) {
    return;
  }

  const clonedSet = originalSet.cloneNode(true);
  track.appendChild(clonedSet);

  const items = [...track.querySelectorAll(".companyItem")];

  let pointerInside = false;
  let currentItem = null;
  let animationFrame = null;

  let targetX = 0;
  let targetY = 0;

  let currentX = 0;
  let currentY = 0;

  function clearActive() {
    items.forEach(item => {
      item.classList.remove("active");
    });

    currentItem = null;
  }

  function showTooltip(item) {
    if (!item) {
      return;
    }

    const rect = item.getBoundingClientRect();

    tooltip.querySelector("strong").textContent =
      item.dataset.name || "";

    tooltip.querySelector("span").textContent =
      item.dataset.role || "";

    tooltip.style.left =
      `${rect.left + rect.width / 2}px`;

    tooltip.style.top =
      `${rect.bottom + 12}px`;

    tooltip.classList.add("show");

    requestAnimationFrame(() => {

      const tooltipRect =
        tooltip.getBoundingClientRect();

      if (tooltipRect.right > window.innerWidth - 10) {
        tooltip.style.left =
          `${window.innerWidth - tooltipRect.width / 2 - 10}px`;
      }

      if (tooltipRect.left < 10) {
        tooltip.style.left =
          `${tooltipRect.width / 2 + 10}px`;
      }

      if (tooltipRect.bottom > window.innerHeight - 10) {
        tooltip.style.top =
          `${rect.top - tooltipRect.height - 12}px`;
      }
    });
  }

  function hideTooltip() {
    tooltip.classList.remove("show");
  }

  function setActive(item, tooltipEnabled = false) {

    if (!item) {
      clearActive();

      if (!tooltipEnabled) {
        hideTooltip();
      }

      return;
    }

    if (currentItem !== item) {

      items.forEach(element => {
        element.classList.remove("active");
      });

      item.classList.add("active");

      currentItem = item;
    }

    if (tooltipEnabled) {
      showTooltip(item);
    }
  }

  function getPointerItem(x, y) {

    const element =
      document.elementFromPoint(x, y);

    if (!element) {
      return null;
    }

    const item =
      element.closest(".companyItem");

    if (!item) {
      return null;
    }

    return items.includes(item)
      ? item
      : null;
  }

  function getGlowCenter() {

    const rect =
      glow.getBoundingClientRect();

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  function getGlowItem() {

    const center =
      getGlowCenter();

    let bestItem = null;
    let bestDistance = Infinity;

    const activationDistance = 78;

    items.forEach(item => {

      const rect =
        item.getBoundingClientRect();

      if (
        rect.right < 0 ||
        rect.left > window.innerWidth ||
        rect.bottom < 0 ||
        rect.top > window.innerHeight
      ) {
        return;
      }

      const itemCenterX =
        rect.left + rect.width / 2;

      const itemCenterY =
        rect.top + rect.height / 2;

      const dx =
        center.x - itemCenterX;

      const dy =
        center.y - itemCenterY;

      const distance =
        Math.sqrt(dx * dx + dy * dy);

      if (
        distance <= activationDistance &&
        distance < bestDistance
      ) {
        bestDistance = distance;
        bestItem = item;
      }
    });

    return bestItem;
  }

  function updateAutomaticHighlight() {

    if (pointerInside) {
      animationFrame =
        requestAnimationFrame(
          updateAutomaticHighlight
        );

      return;
    }

    const item =
      getGlowItem();

    if (item) {

      setActive(
        item,
        false
      );

    } else {

      clearActive();
    }

    animationFrame =
      requestAnimationFrame(
        updateAutomaticHighlight
      );
  }

  function updateGlow(clientX, clientY) {

    const rect =
      bar.getBoundingClientRect();

    targetX =
      clientX - rect.left;

    targetY =
      clientY - rect.top;

    targetX =
      Math.max(
        20,
        Math.min(
          targetX,
          rect.width - 20
        )
      );

    targetY =
      Math.max(
        15,
        Math.min(
          targetY,
          rect.height - 15
        )
      );
  }

  function animatePointerGlow() {

    currentX +=
      (targetX - currentX) * 0.16;

    currentY +=
      (targetY - currentY) * 0.16;

    glow.style.left =
      `${currentX}px`;

    glow.style.top =
      `${currentY}px`;

    if (pointerInside) {
      requestAnimationFrame(
        animatePointerGlow
      );
    }
  }

  bar.addEventListener(
    "pointerenter",
    event => {

      pointerInside = true;

      const rect =
        bar.getBoundingClientRect();

      currentX =
        event.clientX - rect.left;

      currentY =
        event.clientY - rect.top;

      targetX = currentX;
      targetY = currentY;

      glow.classList.add("pointerMode");

      glow.style.left =
        `${currentX}px`;

      glow.style.top =
        `${currentY}px`;

      animatePointerGlow();

      const item =
        getPointerItem(
          event.clientX,
          event.clientY
        );

      if (item) {

        setActive(
          item,
          true
        );

      } else {

        clearActive();
        hideTooltip();
      }
    }
  );

  bar.addEventListener(
    "pointermove",
    event => {

      if (!pointerInside) {
        return;
      }

      updateGlow(
        event.clientX,
        event.clientY
      );

      const item =
        getPointerItem(
          event.clientX,
          event.clientY
        );

      if (item) {

        setActive(
          item,
          true
        );

      } else {

        clearActive();
        hideTooltip();
      }
    }
  );

  bar.addEventListener(
    "pointerleave",
    () => {

      pointerInside = false;

      glow.classList.remove("pointerMode");

      glow.style.left = "";
      glow.style.top = "";

      clearActive();
      hideTooltip();
    }
  );

  items.forEach(item => {

    item.addEventListener(
      "pointerenter",
      () => {

        if (!pointerInside) {
          return;
        }

        setActive(
          item,
          true
        );
      }
    );

  });

  window.addEventListener(
    "resize",
    () => {

      if (
        pointerInside &&
        currentItem
      ) {
        showTooltip(currentItem);
      }
    }
  );

  if (!animationFrame) {
    animationFrame =
      requestAnimationFrame(
        updateAutomaticHighlight
      );
  }

});
/* TODO: ============================================ SCROLL MOUSE  ============================================*/
document.addEventListener('DOMContentLoaded', () => {
  const control = document.querySelector('.scrollControl');
  if (!control) return;

  const maxScroll = () =>
    Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );

  const setDirection = (direction) => {
    control.dataset.direction = direction;
    control.setAttribute(
      'aria-label',
      direction === 'down' ? 'Scroll to bottom' : 'Scroll to top'
    );
  };

  const syncDirection = () => {
    if (window.scrollY <= 2) {
      setDirection('down');
    } else if (window.scrollY >= maxScroll() - 2) {
      setDirection('up');
    }
  };

  control.addEventListener('click', () => {
    const target = control.dataset.direction === 'down' ? maxScroll() : 0;

    window.scrollTo({
      top: target,
      behavior: 'smooth'
    });
  });

  window.addEventListener('scroll', syncDirection, { passive: true });
  window.addEventListener('resize', syncDirection);
  window.addEventListener('load', syncDirection);

  syncDirection();
});


// TODO: *************************************************************** Mobile Project Popup Details **********************************************************************//
document.addEventListener("DOMContentLoaded", () => {
  const projectPopup = document.querySelector(".projectsPopupModel");

  if (!projectPopup) return;

  const mobileRange = window.matchMedia(
    "(min-width: 375px) and (max-width: 490px)"
  );

  const demoToggle = projectPopup.querySelector(
    ".infoTextTwo .box1Btn"
  );
  const demoDetails = projectPopup.querySelector(".ditailInfoDemo");

  const overviewToggle = projectPopup.querySelector(
    ".explainProjectBox .box1Btn"
  );
  const overviewText = projectPopup.querySelector(".explainProjectTwo");
  const moreIcon = projectPopup.querySelector(
    ".explainProjectBox .moreBtnDis"
  );

  const infoListToggle = projectPopup.querySelector(
    ".infoListTwo .box1Btn"
  );
  const infoListDetails = projectPopup.querySelector(
    ".infoListTwo .dataTwo"
  );

  const characterLimit = 30;

  if (
    !demoToggle ||
    !demoDetails ||
    !overviewToggle ||
    !overviewText ||
    !moreIcon ||
    !infoListToggle ||
    !infoListDetails
  ) {
    return;
  }

  function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  overviewText.dataset.fullText = normalizeText(
    overviewText.textContent
  );

  function getFullDescription() {
    return overviewText.dataset.fullText || "";
  }

  function setArrow(toggle, isOpen) {
    const arrow = toggle.querySelector(".arrowIconDemo");

    toggle.setAttribute("aria-expanded", String(isOpen));
    arrow?.classList.toggle("rotate", isOpen);
    arrow?.classList.toggle("active", isOpen);
  }

  function closeDemo() {
    demoDetails.classList.remove("show");
    setArrow(demoToggle, false);
  }

  function closeOverview() {
    overviewText.classList.remove("show", "expanded");
    overviewText.textContent = getFullDescription();
    overviewText.scrollTop = 0;

    moreIcon.hidden = true;
    moreIcon.classList.remove("show", "active");
    moreIcon.setAttribute("aria-expanded", "false");
    moreIcon.setAttribute(
      "aria-label",
      "Show full project description"
    );

    setArrow(overviewToggle, false);
  }

  function closeInfoList() {
    infoListDetails.classList.remove("show");
    setArrow(infoListToggle, false);
  }

  function closeAll() {
    closeDemo();
    closeOverview();
    closeInfoList();
  }

  function setProjectDescription(text) {
    overviewText.dataset.fullText = normalizeText(text);
    closeAll();
    overviewText.textContent = getFullDescription();
  }

  window.addEventListener("project:popup-opened", (event) => {
    const description = event.detail?.description;
    if (typeof description === "string") {
      setProjectDescription(description);
    }
  });

  function toggleDemo() {
    if (!mobileRange.matches) return;

    const shouldOpen =
      demoToggle.getAttribute("aria-expanded") !== "true";

    closeAll();

    if (shouldOpen) {
      demoDetails.classList.add("show");
      setArrow(demoToggle, true);
    }
  }

  function toggleOverview() {
    if (!mobileRange.matches) return;

    const shouldOpen =
      overviewToggle.getAttribute("aria-expanded") !== "true";

    closeAll();

    if (!shouldOpen) return;

    const description = getFullDescription();
    const hasMore = description.length > characterLimit;

    overviewText.textContent = hasMore
      ? description.slice(0, characterLimit).trimEnd()
      : description;

    overviewText.scrollTop = 0;
    overviewText.classList.add("show");
    setArrow(overviewToggle, true);

    moreIcon.hidden = !hasMore;
    moreIcon.classList.toggle("show", hasMore);
    moreIcon.setAttribute("aria-expanded", "false");
    moreIcon.setAttribute(
      "aria-label",
      "Show full project description"
    );
  }

  function toggleInfoList() {
    if (!mobileRange.matches) return;

    const shouldOpen =
      infoListToggle.getAttribute("aria-expanded") !== "true";

    closeAll();

    if (shouldOpen) {
      infoListDetails.classList.add("show");
      setArrow(infoListToggle, true);
    }
  }

  function addKeyboardSupport(element, handler) {
    element.addEventListener("click", handler);

    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler();
      }
    });
  }

  addKeyboardSupport(demoToggle, toggleDemo);
  addKeyboardSupport(overviewToggle, toggleOverview);
  addKeyboardSupport(infoListToggle, toggleInfoList);

  moreIcon.addEventListener("click", (event) => {
    event.stopPropagation();

    if (!mobileRange.matches || moreIcon.hidden) return;

    const isExpanded =
      moreIcon.getAttribute("aria-expanded") !== "true";
    const description = getFullDescription();

    overviewText.textContent = isExpanded
      ? description
      : description.slice(0, characterLimit).trimEnd();

    overviewText.classList.toggle("expanded", isExpanded);
    overviewText.scrollTop = 0;

    moreIcon.setAttribute("aria-expanded", String(isExpanded));
    moreIcon.setAttribute(
      "aria-label",
      isExpanded
        ? "Collapse project description"
        : "Show full project description"
    );
    moreIcon.classList.toggle("active", isExpanded);

    if (isExpanded) {
      requestAnimationFrame(() => {
        overviewText.focus({ preventScroll: true });
        overviewText.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest"
        });
        overviewText.scrollTop = 0;
      });
    }
  });

  moreIcon.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      moreIcon.click();
    }
  });

  mobileRange.addEventListener("change", closeAll);
  closeAll();
});
