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

  // Aguardar carregamento das fontes antes de usar SplitText
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      initAnimationsWithSplitText();
      initOtherAnimations();
    });
  } else {
    // Fallback para navegadores que não suportam Font Loading API
    setTimeout(() => {
      initAnimationsWithSplitText();
      initOtherAnimations();
    }, 500);
  }
}

// Animações que usam SplitText (precisam aguardar fontes)
function initAnimationsWithSplitText() {
  headerInitAnimations();
  titlesScrollAnimations();
}

// Animações que não usam SplitText
function initOtherAnimations() {
  aboutMeAnimations();

  // Skills Section Animations
  initSkillsAnimations();

  scrollProjectsAnimations();

  // Services Section Animations
  initServicesAnimations();

  // Testimonials Section Navigation
  initTestimonialsNavigation();

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
  const isMobile = window.innerWidth < 1024; // lg breakpoint do Tailwind
  
  projects.forEach((project, index) => {
    // No mobile, usar animação vertical para evitar scroll horizontal
    // No desktop, usar animação horizontal alternada
    const animationProps = isMobile
      ? {
          opacity: 0,
          y: 50, // Animação vertical no mobile
        }
      : {
          opacity: 0,
          x: index % 2 === 0 ? -100 : 100, // Animação horizontal no desktop
        };

    gsap.from(project, {
      ...animationProps,
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

  gsap.from(serviceItems, {
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
  });
}

function aboutMeAnimations() {
  const aboutMeTextLeft = document.querySelector(".about-me-text-left");
  const aboutMeTextRight = document.querySelector(".about-me-text-right");
  const aboutMeImage = document.querySelector(".about-me-image");

  if (!aboutMeImage) return;
  
  const isDesktop = window.innerWidth >= 1024;
  
  // Usar immediateRender: false para evitar layout shift inicial
  // Os elementos começam em suas posições finais e só animam quando o scroll trigger ativa
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: aboutMeImage,
      start: "top 75%",
      end: "bottom 30%",
      scrub: true,
    },
  });

  // Animar imagem (scale não causa layout shift)
  tl.fromTo(
    aboutMeImage,
    { 
      scale: 0.5, 
      transformOrigin: "center center",
      immediateRender: false 
    },
    { 
      scale: 1, 
      ease: "power2.out" 
    }
  );

  // Animar textos - usar immediateRender: false para evitar shift inicial
  if (isDesktop) {
    tl.fromTo(
      aboutMeTextLeft,
      { 
        x: 90, 
        opacity: 0,
        immediateRender: false 
      },
      { 
        x: -50, 
        opacity: 1, 
        ease: "power2.out" 
      },
      0
    );
    tl.fromTo(
      aboutMeTextRight,
      { 
        x: -90, 
        opacity: 0,
        immediateRender: false 
      },
      { 
        x: 50, 
        opacity: 1, 
        ease: "power2.out" 
      },
      0
    );
  } else {
    tl.fromTo(
      aboutMeTextLeft,
      { 
        y: 70, 
        opacity: 0,
        immediateRender: false 
      },
      { 
        y: 0, 
        opacity: 1, 
        ease: "power2.out" 
      },
      0
    );
    tl.fromTo(
      aboutMeTextRight,
      { 
        y: -70, 
        opacity: 0,
        immediateRender: false 
      },
      { 
        y: 0, 
        opacity: 1, 
        ease: "power2.out" 
      },
      0
    );
  }
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

  // Verificar se SplitText está disponível e se o elemento existe
  const headerSubtitle = document.querySelector(".header-subtitle");
  if (headerSubtitle && typeof SplitText !== "undefined") {
    try {
      const split = new SplitText(".header-subtitle", {
        type: "lines, words",
        mask: "lines",
      });
      if (split && split.lines) {
        tl.from(
          split.lines,
          {
            yPercent: -100,
            opacity: 0,
            ease: "expo.out",
          },
          "<0.4"
        );
      }
    } catch (error) {
      console.warn("Erro ao criar SplitText para header-subtitle:", error);
    }
  }

  // Verificar se SplitText está disponível e se o elemento existe
  const headerDescription = document.querySelector(".header-description");
  if (headerDescription && typeof SplitText !== "undefined") {
    try {
      const splitDescription = new SplitText(".header-description", {
        type: "lines, words",
        mask: "lines",
      });
      if (splitDescription && splitDescription.lines) {
        tl.from(
          splitDescription.lines,
          {
            yPercent: -100,
            opacity: 0,
            ease: "expo.out",
          },
          "<0.3"
        );
      }
    } catch (error) {
      console.warn("Erro ao criar SplitText para header-description:", error);
    }
  }

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
      },
    });

    tl.to(section.querySelector("#bar"), {
      width: "0%",
      duration: 0.8,
      delay: index * 0.2,
      ease: "power2.out",
    });

    const h2Element = section.querySelector("h2");
    const descriptionElement = section.querySelector(".section-description");

    // SplitText para o título
    if (h2Element && typeof SplitText !== "undefined") {
      try {
        const splitTitle = new SplitText(h2Element, {
          type: "lines",
          mask: "lines",
        });
        if (splitTitle && splitTitle.lines) {
          tl.from(
            splitTitle.lines,
            {
              yPercent: -100,
              opacity: 0,
              ease: "expo.out",
            },
            "<0.3"
          );
        }
      } catch (error) {
        console.warn("Erro ao criar SplitText para título:", error);
      }
    }

    // SplitText para a descrição
    if (descriptionElement && typeof SplitText !== "undefined") {
      try {
        const splitDescription = new SplitText(descriptionElement, {
          type: "lines",
          mask: "lines",
        });
        if (splitDescription && splitDescription.lines) {
          tl.from(
            splitDescription.lines,
            {
              yPercent: -100,
              opacity: 0,
              ease: "expo.out",
            },
            "<0.2"
          );
        }
      } catch (error) {
        console.warn("Erro ao criar SplitText para descrição:", error);
      }
    }
  });
}

function updateFooterYear() {
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}
