// TODO: *************************************************************** Menu Slide **********************************************************************//

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