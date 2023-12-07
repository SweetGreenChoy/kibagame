$(document).ready(function () {
  //메인 배너
  var swiper = new Swiper(".main_banner .swiper", {
    slidesPerView: 1,
    spaceBetween: 0,
    direction: getDirection(),
    centeredSlides: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    loop: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".main_banner .swiper-button-next",
      prevEl: ".main_banner .swiper-button-prev",
    },
    on: {
      resize: function () {
        swiper.changeDirection(getDirection());
      },
    },
  });

  function getDirection() {
    var windowWidth = window.innerWidth;
    var direction = window.innerWidth <= 0 ? "vertical" : "horizontal";

    return direction;
  }
});
