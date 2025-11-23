// Com scripts defer, eles executam antes do DOMContentLoaded
// Mas adicionamos verificações de segurança
function initApp() {
  // Verificar se GSAP está carregado
  if (typeof gsap === "undefined") {
    setTimeout(initApp, 100);
    return;
  }

  // Registrar ScrollTrigger plugin
  if (typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }
  
  // Registrar SplitText plugin se disponível
  if (typeof SplitText !== "undefined") {
    gsap.registerPlugin(SplitText);
  }

  headerInitAnimations();

  aboutMeAnimations();

  // Skills Section Animations
  initSkillsAnimations();

  scrollProjectsAnimations();

  // Services Section Animations
  initServicesAnimations();

  // Testimonials Section Navigation
  initTestimonialsNavigation();

  titlesScrollAnimations();

  // Footer - Update year
  updateFooterYear();
}

// Inicializar quando DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  // DOM já está pronto
  initApp();
}

function scrollProjectsAnimations() {
  const projects = document.querySelectorAll(".project-item");
  projects.forEach((project, index) => {
    gsap.from(project, {
      opacity: 0,
      x: () => index % 2 == 0 ? -100 : 100,
      duration: 1.4,
      ease: "power2.out",
      scrollTrigger: {
        trigger: project,
        start: "top 85%",
        end: "bottom 30%",
        toggleActions: "play none none none",
        scrub: true,
      },
    });
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

function initServicesAnimations() {
  const serviceContainer = document.querySelector("#services");
  const serviceItems = document.querySelectorAll(".service-item");

  
    gsap.from(
      serviceItems,
      {
        opacity: 0,
        y: 40,
        duration: 1,
        stagger: {
          amount: 0.2,
          from: "center",
        },
        ease: "power2.out",
        scrollTrigger: {
          trigger: serviceContainer,
          start: "top 70%",
          end: "bottom 60%",
          toggleActions: "play none none none",
          scrub: true,
        },
      }
    );
  
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

function headerInitAnimations() {
  const header = document.querySelector("header");
  const headerBars = header.querySelectorAll(".header-bar");
  const headerLetter = header.querySelector(".header-letter");
  const headerButton = header.querySelector(".header-button");

  const tl = gsap.timeline();

  tl.from(header.querySelectorAll("li"), {
    scale: 0,
    duration: 0.8,
    ease: "power2.out",
    stagger: {
      amount: 0.5,
      from: "edges",
    },
  });

  tl.from(headerLetter, {
    scale: 0,
    transformOrigin: "center center",
    duration: 1.5,
    ease: "power2.out",
  });

  tl.from(
    headerBars[0],
    {
      scaleX: 0,
      transformOrigin: "left center",
      duration: 1.5,
      ease: "power2.out",
    },
    "<0.4"
  );

  tl.from(
    headerBars[1],
    {
      scaleX: 0,
      transformOrigin: "right center",
      duration: 1.5,
      ease: "power2.out",
    },
    "<"
  );

  const split = new SplitText(".header-subtitle", {
    type: "lines, words",
    mask: "lines",
  });
  tl.from(
    split.lines,
    {
      yPercent: -100,
      opacity: 0,
      ease: "expo.out",
    },
    "<0.4"
  );

  const splitDescription = new SplitText(".header-description", {
    type: "lines, words",
    mask: "lines",
  });
  tl.from(
    splitDescription.lines,
    {
      yPercent: -100,
      opacity: 0,
      ease: "expo.out",
    },
    "<0.3"
  );

  tl.from(
    headerButton,
    {
      scale: 0,
      transformOrigin: "center center",
      ease: "power2.inOut",
    },
    "<0.2"
  );
}

function titlesScrollAnimations() {
  const sections = document.querySelectorAll(".section-title");
  sections.forEach((section, index) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section.querySelector("h2"),
        start: "top 95%",
        toggleActions: "play none none none",
        scrub: true,
        markers: true,
      },
    });

    tl.to(section.querySelector("#bar"), {
      width: "0%",
      duration: 0.8,
      delay: index * 0.2,
      ease: "power2.out",
    });

    const splitTitle = new SplitText(section.querySelector("h2"), {
      type: "lines",
      mask: "lines",
    });

    tl.from(
      splitTitle.lines,
      {
        yPercent: -100,
        opacity: 0,
        ease: "expo.out",
      },
      "<0.3"
    );

    const splitDescription = new SplitText(
      section.querySelector(".section-description"),
      {
        type: "lines",
        mask: "lines",
      }
    );

    tl.from(
      splitDescription.lines,
      {
        yPercent: -100,
        opacity: 0,
        ease: "expo.out",
      },
      "<0.2"
    );
  });
}

function updateFooterYear() {
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}
