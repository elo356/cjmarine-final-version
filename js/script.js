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

// AOS Initialization
document.addEventListener('DOMContentLoaded', function() {
  AOS.init({
    once: true,
    duration: 600,
    easing: 'ease-in-out'
  });
});

// EmailJS Initialization and Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
  // Initialize EmailJS
  (function(){
    emailjs.init("82IJZaMlQMXi8_jjc"); 
  })();

  // Contact form handler
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function(event) {
      event.preventDefault();

      emailjs.sendForm("service_95hi6bn", "template_peqm8ik", this)
        .then(() => {
          alert("✅ ¡Mensaje enviado! Revisa tu correo.");
          document.getElementById("contactForm").reset();
        }, (error) => {
          alert("❌ Error al enviar: " + JSON.stringify(error));
        });
       emailjs.sendForm("service_95hi6bn", "template_p595vxx", this)
      .then(() => {
        document.getElementById("contactForm").reset();
      }, (error) => {
       
      });
    });
  }
});

// Force video autoplay
document.addEventListener('DOMContentLoaded', function() {
  const headerVideo = document.querySelector('.header-bg-video');
  
  if (headerVideo) {
    headerVideo.controls = false;
    headerVideo.removeAttribute('controls');
    
    // Force play
    const playVideo = () => {
      headerVideo.play().catch(error => {
        console.log('Autoplay failed:', error);
        document.addEventListener('click', () => {
          headerVideo.play().catch(e => console.log('Manual play failed:', e));
        }, { once: true });
      });
    };
    
    playVideo();

    headerVideo.addEventListener('pause', () => {
      setTimeout(() => headerVideo.play(), 100);
    });
    headerVideo.addEventListener('loadedmetadata', playVideo);
    headerVideo.addEventListener('canplay', playVideo);
  }
});


const SHOWROOM_API = "https://cjmarineapi.onrender.com/api/photos"; 
const SHOWROOM_GALLERY = document.getElementById("showroomTrack");

let cards = [];
let track;
let current = 2;
let autoPlayInterval = null;

async function loadShowroomPhotos() {
  try {
    const res = await fetch(SHOWROOM_API);
    if (!res.ok) throw new Error("Error cargando showroom");
    const photos = await res.json();

    SHOWROOM_GALLERY.innerHTML = "";

    photos.forEach(url => {
      const card = document.createElement("div");
      card.className = "showroom-card showroom-img-custom";
      card.innerHTML = `<img src="${url}" alt="Showroom Image">`;
      SHOWROOM_GALLERY.appendChild(card);
    });

    // preparar referencias
    track = SHOWROOM_GALLERY;
    cards = Array.from(document.querySelectorAll(".showroom-card"));
    current = Math.floor(cards.length / 2);

    // ⏳ Esperar a que todas las imágenes terminen de cargar antes de iniciar el carrusel
    const imgs = track.querySelectorAll("img");
    let loadedCount = 0;

    imgs.forEach(img => {
      if (img.complete) {
        loadedCount++;
        if (loadedCount === imgs.length) initShowroomCarousel();
      } else {
        img.addEventListener("load", () => {
          loadedCount++;
          if (loadedCount === imgs.length) initShowroomCarousel();
        });
      }
    });

  } catch (e) {
    console.error(e);
    SHOWROOM_GALLERY.innerHTML = "<p>Error cargando imágenes del showroom.</p>";
  }
}

function initShowroomCarousel() {
  const prevBtn = document.getElementById("showroomPrev");
  const nextBtn = document.getElementById("showroomNext");
nextBtn.click();
  function updateCarousel() {
    const cardWidth = cards[0].offsetWidth + 32;
    const trackOffset = (track.offsetWidth / 2) - (cardWidth / 2) - (cardWidth * current);
    track.style.transition = 'transform 0.6s ease';
    track.style.transform = `translateX(${trackOffset}px)`;

    cards.forEach((card, idx) => {
      card.classList.remove('active', 'prev', 'next', 'prev2', 'next2');
      const offset = idx - current;

      card.style.transition = 'all 0.6s ease';
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
      } else if (offset === 1) {
        card.classList.add('next');
        card.style.transform = 'scale(0.98)';
        card.style.zIndex = 2;
        card.style.opacity = 0.92;
      } else if (offset === -2) {
        card.classList.add('prev2');
        card.style.transform = 'scale(0.93)';
        card.style.zIndex = 1;
        card.style.opacity = 0.7;
      } else if (offset === 2) {
        card.classList.add('next2');
        card.style.transform = 'scale(0.93)';
        card.style.zIndex = 1;
        card.style.opacity = 0.7;
      } else {
        card.style.transform = 'scale(0.7)';
        card.style.opacity = 0.1;
        card.style.zIndex = 0;
        card.style.filter = 'blur(2px)';
      }
    });
  }

  function nextSlide() {
    current = (current < cards.length - 1) ? current + 1 : 0;
    updateCarousel();
  }

  function prevSlide() {
    current = (current > 0) ? current - 1 : cards.length - 1;
    updateCarousel();
  }

  prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoplay();
  });

  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoplay();
  });

  function startAutoplay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(nextSlide, 2500);
  }

  function resetAutoplay() {
    startAutoplay();
  }

  window.addEventListener('resize', updateCarousel);
  updateCarousel();
  startAutoplay();
}

document.addEventListener("DOMContentLoaded", loadShowroomPhotos);
