// Hacer el video del showroom un poco más lento pero fluido
document.addEventListener('DOMContentLoaded', function() {
  var showroomVideo = document.querySelector('.showroom-video');
  if (showroomVideo) {
    showroomVideo.playbackRate = 0.85;
  }
});
// Carrusel tipo cards showroom
document.addEventListener('DOMContentLoaded', function() {
  const track = document.querySelector('.showroom-track-cards');
  const cards = Array.from(document.querySelectorAll('.showroom-card'));
  const prevBtn = document.getElementById('showroomPrev');
  const nextBtn = document.getElementById('showroomNext');
  let current = 2; // Card central inicial (ajustar según cantidad visible)

  function updateCarousel() {
    // Centrar la card activa desplazando el track
    const cardWidth = cards[0].offsetWidth + 32; // 32px gap aprox
    const trackOffset = (track.offsetWidth/2) - (cardWidth/2) - (cardWidth * current);
    track.style.transform = `translateX(${trackOffset}px)`;
    // Efectos visuales en las cards
    cards.forEach((card, idx) => {
      card.classList.remove('active', 'prev', 'next', 'prev2', 'next2');
      let offset = idx - current;
      if (offset === 0) {
        card.classList.add('active');
        card.style.transform = 'scale(1.13)';
        card.style.zIndex = 3;
        card.style.opacity = 1;
        card.style.filter = '';
      } else if (offset === -1) {
        card.classList.add('prev');
        card.style.transform = 'scale(0.98)';
        card.style.zIndex = 2;
        card.style.opacity = 0.92;
        card.style.filter = '';
      } else if (offset === 1) {
        card.classList.add('next');
        card.style.transform = 'scale(0.98)';
        card.style.zIndex = 2;
        card.style.opacity = 0.92;
        card.style.filter = '';
      } else if (offset === -2) {
        card.classList.add('prev2');
        card.style.transform = 'scale(0.93)';
        card.style.zIndex = 1;
        card.style.opacity = 0.7;
        card.style.filter = '';
      } else if (offset === 2) {
        card.classList.add('next2');
        card.style.transform = 'scale(0.93)';
        card.style.zIndex = 1;
        card.style.opacity = 0.7;
        card.style.filter = '';
      } else {
        card.style.transform = 'scale(0.7)';
        card.style.opacity = 0.1;
        card.style.zIndex = 0;
        card.style.filter = 'blur(2px)';
      }
    });
  }

  let autoPlayInterval = null;
  function startAutoplay() {
    if(autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(() => {
      current = (current < cards.length - 1) ? current + 1 : 0;
      updateCarousel();
    }, 2500);
  }

  function resetAutoplay() {
    startAutoplay();
  }

  prevBtn.addEventListener('click', function() {
    if(current > 0) {
      current--;
    } else {
      current = cards.length - 1;
    }
    updateCarousel();
    resetAutoplay();
  });
  nextBtn.addEventListener('click', function() {
    if(current < cards.length - 1) {
      current++;
    } else {
      current = 0;
    }
    updateCarousel();
    resetAutoplay();
  });

  // Inicializar
  updateCarousel();
  startAutoplay();
  window.addEventListener('resize', updateCarousel);
});
var $grid = $('.collection-list').isotope({
  // options
});
$('.filter-button-group').on( 'click', 'button', function() {
  var filterValue = $(this).attr('data-filter');
  resetFilterBtns();
  $(this).addClass('active-filter-btn');
  $grid.isotope({ filter: filterValue });
});

var filterBtns = $('.filter-button-group').find('button');
function resetFilterBtns(){
  filterBtns.each(function(){
    $(this).removeClass('active-filter-btn');
  });
}

//hide and show navbar
var scroll1 = window.pageYOffset;
window.onscroll = function(){
  var scroll2 = window.pageYOffset;
  var nav = document.querySelector('nav');
  if(scroll1 > scroll2){
    nav.style.top = "0";
  }
  else{
    nav.style.top = "-140px"; // más que la altura real para ocultar por completo
  }
  scroll1 = scroll2;
}
