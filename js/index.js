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
  link.addEventListener('click', event => {
    event.preventDefault();

    const serviceCard = link.closest('.services-swiper .card');
    const detailServices = serviceCard?.querySelector('.detailServices');

    if (!detailServices) return;

    const popupMainBox = servicesPopup.querySelector('.mainBox');

    popupMainBox.innerHTML = `
            <h6 class="popupSubtitle">
                ${detailServices.querySelector('h4')?.textContent || ''}
            </h6>

            <h1 class="popupTitle">
                ${detailServices.querySelector('h3')?.textContent || ''}
            </h1>

            <p class="popupDescription">
                ${detailServices.querySelector('p')?.textContent || ''}
            </p>

            <ul class="popupListGroup grid">
                ${[...(detailServices.querySelectorAll('li'))].map(item => `
                    <li class="popupListItem">
                        <i class="ri-git-commit-fill popupListIcon"></i>
                        <p class="popupListText">${item.textContent}</p>
                    </li>
                `).join('')}
            </ul>
        `;

    servicesPopup.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
});

closePopup?.addEventListener('click', () => {
  servicesPopup.classList.remove('active');
  document.body.style.overflow = '';
});

servicesPopup?.addEventListener('click', event => {
  if (event.target === servicesPopup) {
    servicesPopup.classList.remove('active');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', event => {
  if (
    event.key === 'Escape' &&
    servicesPopup?.classList.contains('active')
  ) {
    servicesPopup.classList.remove('active');
    document.body.style.overflow = '';
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
const projectItems = [...document.querySelectorAll('.boxCard')];

const projectsSwiper = new Swiper('.projects-swiper', {
  slidesPerView: 1,
  spaceBetween: 24,
  grabCursor: true,
  loop: false,

  grid: {
    rows: 2,
    fill: 'row',
  },

  pagination: {
    el: '.projects-swiper .swiper-pagination',
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


// ! Project Filtering
const filterButtons = document.querySelectorAll('.filterItems');

filterButtons.forEach((button) => {

  button.addEventListener('click', () => {

    // Active button
    filterButtons.forEach((btn) => {
      btn.classList.remove('active');
    });

    button.classList.add('active');

    const filterValue = button.getAttribute('data-filter');

    // Remove current slides
    projectsSwiper.removeAllSlides();

    // Filter projects
    const filteredProjects = projectItems.filter((item) => {

      const category = item.getAttribute('data-category');

      return filterValue === 'all' || category === filterValue;

    });

    // Add filtered slides
    projectsSwiper.appendSlide(filteredProjects);

    // Update swiper
    projectsSwiper.update();

    // Start from first slide
    projectsSwiper.slideTo(0, 0);

  });

});
// ! Project Popup => Show Details Project
document.addEventListener("DOMContentLoaded", () => {

  const projectPopup = document.querySelector(".projectsPopupModel");
  const projectCards = document.querySelectorAll(".projectContainer .boxCard");

  if (!projectPopup) return;

  const popupContainer = projectPopup.querySelector(".popupContainer");
  const closeButton = projectPopup.querySelector(".containerPClosed");

  const popupImage = projectPopup.querySelector(".projectCardImg img");
  const popupImageBox = projectPopup.querySelector(".projectCardImg");

  const popupName = projectPopup.querySelector(".nameProject");
  const popupCompany = projectPopup.querySelector(".companyName");
  const popupDate = projectPopup.querySelector(".dateFiishProject");
  const popupDescription = projectPopup.querySelector(".explainProject");
  const popupList = projectPopup.querySelector(".infoList ul");

  const popupGithubWrapper =
    projectPopup.querySelector(".btn-github-linke");

  const popupGithub =
    projectPopup.querySelector(".btn-github-linke a");

  const popupMore =
    projectPopup.querySelector(".btn-project-more a");


  function setPopupImage(detailImage) {

    if (!popupImage || !detailImage) return;

    popupImageBox.classList.remove("landscape", "portrait");

    popupImage.src = detailImage.src;
    popupImage.alt = detailImage.alt || "";

    popupImage.onload = () => {

      if (popupImage.naturalWidth > popupImage.naturalHeight) {
        popupImageBox.classList.add("landscape");
      } else {
        popupImageBox.classList.add("portrait");
      }

    };

  }


  function openProjectPopup(card) {

    const detail = card.querySelector(".projectDetail");

    if (!detail) return;

    const detailImage = detail.querySelector("img");
    const detailName = detail.querySelector("h4");
    const detailCompany = detail.querySelector("h6");
    const detailDate = detail.querySelector("h5");
    const detailDescription = detail.querySelector("p");
    const detailListItems = detail.querySelectorAll("ul li");

    const detailGithub =
      detail.querySelector(".btn-github-linke a");

    const detailMore =
      detail.querySelector(".btn-project-more a");


    setPopupImage(detailImage);


    if (popupName && detailName) {
      popupName.textContent =
        detailName.textContent.trim();
    }


    if (popupCompany && detailCompany) {
      popupCompany.textContent =
        detailCompany.textContent.trim();
    }


    if (popupDate && detailDate) {
      popupDate.innerHTML =
        detailDate.innerHTML;
    }


    if (popupDescription && detailDescription) {
      popupDescription.innerHTML =
        detailDescription.innerHTML.trim();
    }


    if (popupList) {

      popupList.innerHTML = "";

      detailListItems.forEach((item) => {

        const newItem =
          document.createElement("li");

        newItem.innerHTML =
          item.innerHTML;

        popupList.appendChild(newItem);

      });

    }


    if (popupGithubWrapper && popupGithub) {

      if (detailGithub) {

        popupGithub.href =
          detailGithub.getAttribute("href");

        popupGithub.target = "_blank";

        popupGithub.rel =
          "noopener noreferrer";

        popupGithubWrapper.style.display = "";

      } else {

        popupGithub.removeAttribute("href");

        popupGithub.removeAttribute("target");

        popupGithub.removeAttribute("rel");

        popupGithubWrapper.style.display = "none";

      }

    }


    if (popupMore && detailMore) {
      popupMore.href =
        detailMore.getAttribute("href");
    }


    projectPopup.classList.add("active");
    document.body.classList.add("popup-open");

  }


  projectCards.forEach((card) => {

    const showProject =
      card.querySelector(".showProject");

    if (!showProject) return;

    showProject.addEventListener("click", (event) => {

      event.preventDefault();
      event.stopPropagation();

      openProjectPopup(card);

    });

  });


  function closeProjectPopup() {

    projectPopup.classList.remove("active");
    document.body.classList.remove("popup-open");

  }


  if (closeButton) {
    closeButton.addEventListener(
      "click",
      closeProjectPopup
    );
  }


  projectPopup.addEventListener("click", (event) => {

    if (event.target === projectPopup) {
      closeProjectPopup();
    }

  });


  if (popupContainer) {

    popupContainer.addEventListener("click", (event) => {
      event.stopPropagation();
    });

  }


  document.addEventListener("keydown", (event) => {

    if (
      event.key === "Escape" &&
      projectPopup.classList.contains("active")
    ) {
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

