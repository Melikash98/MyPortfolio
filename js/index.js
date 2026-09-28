// TODO: *************************************************************** Menu Slide **********************************************************************//
document.addEventListener("DOMContentLoaded", () => {
  const menuOpen = document.querySelector(".menuOpen");
  const menuClose = document.querySelector(".closedMenuSlide");
  const slideMenu = document.querySelector(".slideHeder");
  const navLinks = document.querySelectorAll(".slideNav a");
  // ! Open Menu
  function openMenu() {
    slideMenu.classList.add("is-open");
    menuOpen.classList.add("is-active");
    document.body.classList.add("menu-open");
    menuOpen.setAttribute("aria-expanded", "true");
  }
  // ! Close Menu
  function closeMenu() {
    slideMenu.classList.remove("is-open");
    menuOpen.classList.remove("is-active");
    document.body.classList.remove("menu-open");
    menuOpen.setAttribute("aria-expanded", "false");
  }
  // ! Toggle Menu
  function toggleMenu() {
    if (slideMenu.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  }
  // ! Open Button
  menuOpen.addEventListener("click", toggleMenu);
  // ! Close Button
  menuClose.addEventListener("click", closeMenu);
  // ! Close When Clicking Navigation Link
  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
  // ! Close With ESC
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
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