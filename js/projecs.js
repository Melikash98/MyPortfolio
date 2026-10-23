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