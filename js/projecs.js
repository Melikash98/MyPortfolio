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

const contactToDonatePage = document.querySelector('.donateProject');

if (contactToDonatePage) {
  contactToDonatePage.setAttribute('role', 'link');
  contactToDonatePage.setAttribute('tabindex', '0');

  const goToDonatePage = () => {
    window.location.href = new URL('../html/donait.html', document.baseURI).href;
  };

  contactToDonatePage.addEventListener('click', goToDonatePage);
  contactToDonatePage.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToDonatePage();
    }
  });
}