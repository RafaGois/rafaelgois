document.addEventListener("DOMContentLoaded", () => {
  // Registrar ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  const icons = document.querySelectorAll(".icon");
  const iconContainer = document.querySelector(".absolute");

  aboutMeAnimations();

  if (iconContainer && icons.length > 0) {
    // Obter posição do container
    const containerRect = iconContainer.getBoundingClientRect();

    // Calcular centro da tela relativo ao container
    const centerX = window.innerWidth / 2 - containerRect.left;
    const centerY = window.innerHeight / 2 - containerRect.top;

    icons.forEach((icon, index) => {
      // Posição inicial: centro da tela
      gsap.set(icon, {
        x: centerX,
        y: centerY,
        opacity: 0,
        scale: 0,
        transformOrigin: "center center",
      });
    });

    icons.forEach((icon, index) => {
      initIconsAnimation(
        icon,
        Math.random() * window.innerWidth - 200,
        Math.random() * window.innerHeight - 200,
        index
      );
    });
  }

  // Skills Section Animations
  initSkillsAnimations();

  // Projects Section Animations
  initProjectsAnimations();

  // Services Section Animations
  initServicesAnimations();

  // Testimonials Section Navigation
  initTestimonialsNavigation();

  titlesScrollAnimations();

  // Footer - Update year
  updateFooterYear();
});

function initIconsAnimation(element, x, y) {
  gsap.to(element, {
    x: x,
    y: y,
    duration: 1,
    ease: "power2.out",
    scale: 1,
    opacity: 1,
  });
}

function initSkillsAnimations() {
  const skillCategories = document.querySelectorAll(".skill-category");

  if (skillCategories.length === 0) return;

  skillCategories.forEach((category, index) => {
    gsap.fromTo(
      category,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: index * 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: category,
          start: "top 80%",
          end: "top 50%",
          toggleActions: "play none none none",
        },
      }
    );

    // Animar items individuais dentro de cada categoria
    const skillItems = category.querySelectorAll(".skill-item");
    skillItems.forEach((item, itemIndex) => {
      gsap.fromTo(
        item,
        {
          opacity: 0,
          x: -20,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          delay: index * 0.2 + itemIndex * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: category,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    });
  });
}

function initProjectsAnimations() {
  const projectItems = document.querySelectorAll(".project-item");
  const projectHighlight = document.querySelector(".project-highlight");

  if (projectItems.length === 0) return;

  projectItems.forEach((item, index) => {
    gsap.fromTo(
      item,
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: index * 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          end: "top 60%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  // Animar bloco de destaque
  if (projectHighlight) {
    gsap.fromTo(
      projectHighlight,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: projectHighlight,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );
  }
}

function initServicesAnimations() {
  const serviceItems = document.querySelectorAll(".service-item");
  const serviceCta = document.querySelector(".service-cta");

  if (serviceItems.length === 0) return;

  serviceItems.forEach((item, index) => {
    gsap.fromTo(
      item,
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: index * 0.25,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          end: "top 60%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  // Animar bloco CTA
  if (serviceCta) {
    gsap.fromTo(
      serviceCta,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: serviceCta,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );
  }
}

function aboutMeAnimations() {
  const aboutMeTextLeft = document.querySelector(".about-me-text-left");
  const aboutMeTextRight = document.querySelector(".about-me-text-right");
  const aboutMeImage = document.querySelector(".about-me-image");

  if (!aboutMeImage) return;
  gsap.set(aboutMeImage, { scale: 0.5 });
  if (window.innerWidth >= 1024) {
    gsap.set(aboutMeTextLeft, { x: 90 });
    gsap.set(aboutMeTextRight, { x: -90 });
  } else {
    gsap.set(aboutMeTextLeft, { y: 70 });
    gsap.set(aboutMeTextRight, { y: -70 });
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: aboutMeImage,
      start: "top 75%",
      end: "bottom 30%",
      scrub: true,
    },
  });

  tl.to(aboutMeImage, {
    scale: 1,
    ease: "power2.out",
  });

  if (window.innerWidth >= 1024) {
    tl.to(
      aboutMeTextLeft,
      {
        x: -50,
        ease: "power2.out",
      },
      0
    ).to(
      aboutMeTextRight,
      {
        x: 50,
        ease: "power2.out",
      },
      0
    );
  } else {
    tl.to(
      aboutMeTextLeft,
      {
        y: 0,
      },
      0
    );
  }
  tl.to(
    aboutMeTextRight,
    {
      y: 0,
    },
    0
  );
}

function toggleMenu() {
  const mobileMenu = document.getElementById("mobileMenu");

  if (!mobileMenu) return;

  if (mobileMenu.classList.contains("hidden")) {
    // Mostrar o menu
    mobileMenu.classList.remove("hidden");
    mobileMenu.classList.add("flex");
    document.body.classList.add("overflow-hidden");

    // Resetar posição e opacidade
    gsap.set(mobileMenu, {
      yPercent: -100,
      opacity: 0,
      display: "flex",
    });

    // Resetar itens para visíveis
    const menuLinks = mobileMenu.querySelectorAll(".mobile-menu-link");
    /*     gsap.set(menuLinks, { 
      opacity: 1,
      x: 0,
      display: "block"
    }); */

    const tl = gsap.timeline();
    tl.to(mobileMenu, {
      yPercent: 0,
      opacity: 1,
      ease: "power2.out",
    });
    tl.from(
      menuLinks,
      {
        yPercent: -100,
        opacity: 0,
        stagger: 0.08,
      },
      "<"
    );
  } else {
    closeMenu();
  }
}

function closeMenu() {
  const mobileMenu = document.getElementById("mobileMenu");

  if (!mobileMenu) return;

  document.body.classList.remove("overflow-hidden");

  // Animar menu subindo
  gsap.to(mobileMenu, {
    yPercent: -100,
    opacity: 0,
    duration: 0.3,
    ease: "power2.in",
    onComplete: () => {
      mobileMenu.classList.add("hidden");
      mobileMenu.classList.remove("flex");
    },
  });
}

function initTestimonialsNavigation() {
  const testimonialItems = document.querySelectorAll(".testimonial-item");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");
  const dots = document.querySelectorAll(".dot");

  if (testimonialItems.length === 0) return;

  let currentPage = 0;
  const itemsPerPage = 3;
  const totalPages = Math.ceil(testimonialItems.length / itemsPerPage);

  function showPage(page) {
    testimonialItems.forEach((item, index) => {
      const itemPage = Math.floor(index / itemsPerPage);
      if (itemPage === page) {
        item.classList.remove("hidden");
      } else {
        item.classList.add("hidden");
      }
    });

    // Update dots
    dots.forEach((dot, index) => {
      if (index === page) {
        dot.classList.add("active");
        dot.style.backgroundColor = "#4F4A4A";
      } else {
        dot.classList.remove("active");
        dot.style.backgroundColor = "#4F4A4A30";
      }
    });

    // Update buttons
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page === totalPages - 1;

    if (page === 0) {
      prevBtn.style.opacity = "0.5";
      prevBtn.style.cursor = "not-allowed";
    } else {
      prevBtn.style.opacity = "1";
      prevBtn.style.cursor = "pointer";
    }

    if (page === totalPages - 1) {
      nextBtn.style.opacity = "0.5";
      nextBtn.style.cursor = "not-allowed";
    } else {
      nextBtn.style.opacity = "1";
      nextBtn.style.cursor = "pointer";
    }
  }

  prevBtn.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage--;
      showPage(currentPage);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages - 1) {
      currentPage++;
      showPage(currentPage);
    }
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      currentPage = index;
      showPage(currentPage);
    });
  });

  // Initialize
  showPage(0);
}

function titlesScrollAnimations() {
  const sections = document.querySelectorAll(".section-title");
  sections.forEach((section, index) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 60%",
        toggleActions: "play none none none",
        scrub: true,
      },
    });

    tl.to(section.querySelector("#bar"), {
  
      width: "0%",
      duration: 0.8,
      delay: index * 0.2,
      ease: "power2.out",
    });

    tl.from(section.querySelector("h2"), {
      opacity: 0,
      y: -30,
      duration: 0.8,
      delay: index * 0.2,
      ease: "power2.out",
    });

    tl.from(section.querySelector(".section-description"), {
      opacity: 0,
      y: 30,
      duration: 0.8,
      delay: index * 0.2,
      ease: "power2.out",
    });
  });
}

function updateFooterYear() {
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}
