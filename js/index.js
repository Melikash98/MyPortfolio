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
// TODO: ***************************************************************HOME Section**********************************************************************//
// TODO: Word Transition Effect for Role Text
const roles = ["Melika", "Software Developer", "Backend Developer", "Android Developer"];
const roleElement = document.getElementById('role-animation');
let roleIndex = 0;
let letterIndex = 0;
let typingInterval;

function updateRole() {
  roleElement.style.opacity = 0;
  setTimeout(() => {
    roleElement.textContent = "";
    letterIndex = 0;

    typingInterval = setInterval(() => {
      if (letterIndex < roles[roleIndex].length) {
        roleElement.textContent += roles[roleIndex].charAt(letterIndex);
        letterIndex++;
      }
      else {
        clearInterval(typingInterval);
        setTimeout(() => {
          roleIndex = (roleIndex + 1) % roles.length;
          updateRole();
        }, 1000);
      }
    }, 150);
    roleElement.style.opacity = 1;
  }, 500);
}
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
      spaceBetween: 24,
    },

    1208: {
      slidesPerView: 3,
      spaceBetween: 32,
    },
  },
});
// ! Services Popup => Show Details Services
const servicesPopup = document.querySelector('.servicesPopupModel');
const serviceLinks = document.querySelectorAll('.linkeDetails');
const closePopup = document.querySelector('.containerSClosed');

serviceLinks.forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    servicesPopup.classList.add('active');
  });
});

closePopup.addEventListener('click', () => {
  servicesPopup.classList.remove('active');
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
const tabs = document.querySelectorAll("[data-target]");
const tabContent = document.querySelectorAll("[data-content]");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = document.querySelector(
      tab.dataset.target
    );
    if (!target) return;
    tabContent.forEach((tabContents) => {
      tabContents.classList.remove("skillsActive");
    });
    tabs.forEach((tabItem) => {
      tabItem.classList.remove("skillsActive");
    });
    tab.classList.add("skillsActive");
    target.classList.add("skillsActive");

  });

});
// TODO: *************************************************************** Projects Section **********************************************************************//
// !Filtering Projects
const filterButtons = document.querySelectorAll('.filterItems');
const projectItems = document.querySelectorAll('.boxCard');
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');



    const filterValue = button.getAttribute('data-filter');

    projectItems.forEach((item) => {
      if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
        item.style.display = 'block';
      }
      else {
        item.style.display = 'none';
      }
    });
  });
});
// ! Project Popup => Show Details Project
const projectPopup = document.querySelector('.projectsPopupModel');
const projectLinks = document.querySelectorAll('.showProject');
const closeProjectPopup = document.querySelector('.containerPClosed');

projectLinks.forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    projectPopup.classList.add('active');
  });
});

closeProjectPopup.addEventListener('click', () => {
  projectPopup.classList.remove('active');
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
      spaceBetween: 24,
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
      spaceBetween: 24,
    },

    1208: {
      slidesPerView: 3,
      spaceBetween: 32,
    },
  },
});