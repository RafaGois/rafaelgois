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
  initBoxAnimations();
  initBoxSideImages();
  initBoxIcaro();
  aboutMeAnimations();

  // Skills Section Animations
  initSkillsAnimations();

  scrollProjectsAnimations();

  // Services Section Animations
  initServicesAnimations();

  // Testimonials Section Navigation
  initTestimonialsNavigation();

  // Contact - Scroll-scrubbed background video
  initContactScrollVideo();

  // Footer - Update year
  updateFooterYear();

  scheduleScrollTriggerRefresh();
}

/** Recalcula triggers após imagens/fontes (layout na nuvem costuma estabilizar mais tarde). */
function scheduleScrollTriggerRefresh() {
  if (typeof ScrollTrigger === "undefined") return;

  const refresh = () => {
    try {
      ScrollTrigger.refresh();
    } catch (_) {}
  };

  window.addEventListener("load", refresh, { once: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refresh);
  }
  setTimeout(refresh, 800);
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
  const wrapper = document.getElementById("skills-path-wrapper");
  const svg = document.getElementById("skills-svg");
  const nodes = wrapper ? wrapper.querySelectorAll(".skill-node") : [];

  if (!wrapper || !svg || nodes.length < 3) return;

  function buildPath() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var isDesktop = window.innerWidth >= 1024;
    const wRect = wrapper.getBoundingClientRect();
    const wScrollTop = wRect.top + window.scrollY;
    const cw = wrapper.offsetWidth;
    const ch = wrapper.offsetHeight;

    svg.setAttribute("viewBox", "0 0 " + cw + " " + ch);

    const points = [];
    nodes.forEach(function (node) {
      var anchor =
        node.querySelector(".skill-node-content") || node;
      var nRect = anchor.getBoundingClientRect();
      var nScrollTop = nRect.top + window.scrollY;
      var y = nScrollTop - wScrollTop + nRect.height / 2;
      var align = node.dataset.align;
      var x;

      if (isDesktop) {
        if (align === "left") {
          x = nRect.left - wRect.left + nRect.width + cw * 0.04;
          x = Math.min(x, cw * 0.62);
        } else {
          x = nRect.left - wRect.left - cw * 0.04;
          x = Math.max(x, cw * 0.38);
        }
      } else {
        x = align === "left" ? cw * 0.88 : cw * 0.12;
      }

      points.push({ x: x, y: y });
    });

    var startX = cw / 2;
    var startY = 0;
    var endX = cw / 2;
    var endY = ch;

    var d = "M " + startX + " " + startY;

    var cp1y = startY + (points[0].y - startY) * 0.55;
    d +=
      " C " + startX + " " + cp1y +
      ", " + points[0].x + " " + (points[0].y - (points[0].y - startY) * 0.25) +
      ", " + points[0].x + " " + points[0].y;

    for (var i = 0; i < points.length - 1; i++) {
      var curr = points[i];
      var next = points[i + 1];
      var midY = (curr.y + next.y) / 2;
      d +=
        " C " + curr.x + " " + midY +
        ", " + next.x + " " + midY +
        ", " + next.x + " " + next.y;
    }

    var last = points[points.length - 1];
    var cpEndY = last.y + (endY - last.y) * 0.45;
    d +=
      " C " + last.x + " " + cpEndY +
      ", " + endX + " " + cpEndY +
      ", " + endX + " " + endY;

    var strokeW = isDesktop ? 5 : 3;

    var sectionColors = [
      { color: "#c94040", label: "frontend" },
      { color: "#3b6fbf", label: "backend" },
      { color: "#b8960c", label: "outros" },
    ];

    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    var gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", "skills-gradient");
    gradient.setAttribute("x1", "0");
    gradient.setAttribute("y1", "0");
    gradient.setAttribute("x2", "0");
    gradient.setAttribute("y2", "1");

    var gradientGlow = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradientGlow.setAttribute("id", "skills-gradient-glow");
    gradientGlow.setAttribute("x1", "0");
    gradientGlow.setAttribute("y1", "0");
    gradientGlow.setAttribute("x2", "0");
    gradientGlow.setAttribute("y2", "1");

    var baseColor = "#4F4A4A";
    var spread = 0.18;

    function addStop(grad, offset, color, opacity) {
      var s = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      s.setAttribute("offset", String(Math.max(0, Math.min(1, offset))));
      s.setAttribute("stop-color", color);
      if (opacity !== undefined) s.setAttribute("stop-opacity", String(opacity));
      grad.appendChild(s);
    }

    var baseOpacity = 0.15;

    addStop(gradient, 0, baseColor, baseOpacity);
    addStop(gradientGlow, 0, baseColor, baseOpacity);

    points.forEach(function (p, i) {
      var frac = p.y / ch;
      var col = sectionColors[i] ? sectionColors[i].color : baseColor;

      addStop(gradient, frac - spread, baseColor, baseOpacity);
      addStop(gradient, frac, col, 1);
      addStop(gradient, frac + spread, baseColor, baseOpacity);

      addStop(gradientGlow, frac - spread, baseColor, baseOpacity);
      addStop(gradientGlow, frac, col, 1);
      addStop(gradientGlow, frac + spread, baseColor, baseOpacity);
    });

    addStop(gradient, 1, baseColor, baseOpacity);
    addStop(gradientGlow, 1, baseColor, baseOpacity);

    defs.appendChild(gradient);
    defs.appendChild(gradientGlow);
    svg.appendChild(defs);

    var bgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    bgPath.setAttribute("d", d);
    bgPath.setAttribute("stroke", "#4F4A4A");
    bgPath.setAttribute("stroke-width", strokeW);
    bgPath.setAttribute("stroke-linecap", "round");
    bgPath.setAttribute("fill", "none");
    bgPath.setAttribute("opacity", "0.06");
    svg.appendChild(bgPath);

    var glowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    glowPath.setAttribute("d", d);
    glowPath.setAttribute("stroke", "url(#skills-gradient-glow)");
    glowPath.setAttribute("stroke-width", String(strokeW * 5));
    glowPath.setAttribute("stroke-linecap", "round");
    glowPath.setAttribute("fill", "none");
    glowPath.setAttribute("opacity", "0.12");
    svg.appendChild(glowPath);

    var activePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    activePath.setAttribute("d", d);
    activePath.setAttribute("stroke", "url(#skills-gradient)");
    activePath.setAttribute("stroke-width", strokeW);
    activePath.setAttribute("stroke-linecap", "round");
    activePath.setAttribute("fill", "none");
    activePath.setAttribute("opacity", "0.55");
    svg.appendChild(activePath);

    var dotColors = sectionColors.map(function (s) { return s.color; });
    var dotRadius = isDesktop ? 7 : 5;
    var dots = [];
    points.forEach(function (p, i) {
      var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", p.x);
      circle.setAttribute("cy", p.y);
      circle.setAttribute("r", dotRadius);
      circle.setAttribute("fill", dotColors[i] || "#4F4A4A");
      circle.setAttribute("opacity", "0");
      svg.appendChild(circle);
      dots.push(circle);
    });

    var pathLength = activePath.getTotalLength();
    var glowLength = glowPath.getTotalLength();

    gsap.set(activePath, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
    });
    gsap.set(glowPath, {
      strokeDasharray: glowLength,
      strokeDashoffset: glowLength,
    });

    gsap.to(activePath, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: wrapper,
        start: "top 70%",
        end: "bottom 20%",
        scrub: 1.5,
      },
    });

    gsap.to(glowPath, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: wrapper,
        start: "top 70%",
        end: "bottom 20%",
        scrub: 1.5,
      },
    });

    var totalScrollRange = ch;
    dots.forEach(function (dot, i) {
      var dotY = points[i].y;
      var fraction = dotY / totalScrollRange;
      var triggerStart = "top+" + Math.round(fraction * ch * 0.5) + "px 60%";

      gsap.to(dot, {
        opacity: 0.4,
        duration: 0.4,
        ease: "power2.out",
        scrollTrigger: {
          trigger: wrapper,
          start: triggerStart,
          toggleActions: "play none none reverse",
        },
      });
    });

    return { activePath: activePath, glowPath: glowPath, dots: dots };
  }

  buildPath();

  var skillNumbers = wrapper.querySelectorAll(".skill-number");
  gsap.set(skillNumbers, { opacity: 0.06 });

  nodes.forEach(function (node, i) {
    var numberEl = node.querySelector(".skill-number");
    if (numberEl) {
      gsap.to(numberEl, {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: node,
          start: "top 70%",
          end: "top 45%",
          toggleActions: "play none none reverse",
        },
      });
    }
  });

  var isDesktopLayout = window.innerWidth >= 1024;
  nodes.forEach(function (node) {
    var align = node.dataset.align;
    var xFrom = isDesktopLayout ? (align === "left" ? -50 : 50) : 0;

    gsap.fromTo(
      node,
      { opacity: 0, x: xFrom, y: 20 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: node,
          start: "top 85%",
          end: "top 55%",
          scrub: 1,
        },
      },
    );

    var items = node.querySelectorAll(".skill-item");
    items.forEach(function (item, idx) {
      gsap.fromTo(
        item,
        { opacity: 0, x: -15 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          delay: idx * 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: node,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );
    });
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      ScrollTrigger.getAll().forEach(function (st) {
        if (st.trigger === wrapper || st.vars && st.vars.trigger === wrapper) {
          st.kill();
        }
      });
      buildPath();
      ScrollTrigger.refresh();
    }, 300);
  });
}

function initBoxAnimations() {
  const boxText = document.querySelector("#box-text");
  if (!boxText) return;

  let split;
  try {
    split = new SplitText(boxText, { type: "chars" });
  } catch (e) {
    return;
  }

  const chars = split.chars;
  const originalChars = [...chars].map((el) => el.textContent);
  const scrambleSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%";

  const proxy = { progress: 0 };
  gsap.timeline({
    scrollTrigger: {
      trigger: "#box-text",
      start: "top 80%",
      end: "bottom 30%",
      scrub: true,
    },
  }).to(proxy, {
    progress: 1,
    duration: 1,
    ease: "power2.out",
    onUpdate: () => {
      const p = proxy.progress;
      chars.forEach((el, i) => {
        const threshold = (i / chars.length) * 0.9;
        el.textContent =
          p >= threshold ? originalChars[i] : scrambleSet[Math.floor(Math.random() * scrambleSet.length)];
      });
    },
  });
}

// ─── Box — imagens laterais "Criação de Adão" ─────────────────────────────────
function initBoxSideImages() {
  var leftImg  = document.querySelector("#box-left-img");
  var rightImg = document.querySelector("#box-right-img");
  var frame    = document.querySelector("#box-moldura");
  if (!leftImg || !rightImg || !frame) return;

  var rightCursorClickTl = null;
  var rightCursorClickStarted = false;
  var prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function killRightCursorClickPulse() {
    if (rightCursorClickTl) {
      rightCursorClickTl.kill();
      rightCursorClickTl = null;
    }
    gsap.set(rightImg, { scale: 1 });
  }

  // Esquerda — animação independente
  gsap.fromTo(leftImg,
    { xPercent: -120, yPercent: -50, opacity: 0 },
    {
      xPercent: 0, yPercent: -50, opacity: 0.78,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#box-text",
        start:   "top 95%",
        end:     "bottom 32%",
        scrub:   2.4,
      },
    }
  );

  // Direita — animação independente, termina mais tarde para dar tempo de avançar bastante
  gsap.fromTo(rightImg,
    { xPercent: 120, yPercent: -50, opacity: 0 },
    {
      xPercent: -230,
      yPercent: -50,
      opacity: 0.78,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#box",
        start:   "top bottom",   // começa quando a seção entra na tela
        end:     "center center", // termina quando o box está no centro — src muda aqui
        scrub:   1.8,
        onUpdate: function (self) {
          var fr = frame.getBoundingClientRect();
          var ir = rightImg.getBoundingClientRect();
          var atFrame = ir.left <= fr.right + 8;
          var src = rightImg.src || "";
          if (atFrame && src.indexOf("2.png") === -1) {
            rightImg.src = "2.png";
          } else if (!atFrame && src.indexOf("1.png") === -1) {
            rightImg.src = "1.png";
          }

          var p = self.progress;
          if (p >= 0.995 && !rightCursorClickStarted && !prefersReducedMotion) {
            rightCursorClickStarted = true;
            killRightCursorClickPulse();
            var tipOrigin = "14% 18%";
            rightCursorClickTl = gsap.timeline({ repeat: -1 });
            rightCursorClickTl
              .to(rightImg, {
                scale: 0.86,
                duration: 0.22,
                ease: "power2.in",
                transformOrigin: tipOrigin,
              })
              .to(rightImg, {
                scale: 1,
                duration: 0.28,
                ease: "power2.out",
                transformOrigin: tipOrigin,
              })
              .to({}, { duration: 1.35 });
          } else if (p < 0.9 && rightCursorClickStarted) {
            rightCursorClickStarted = false;
            killRightCursorClickPulse();
          }
        },
      },
    }
  );
}

// ─── Box — Ícaro sobe de baixo do box central ─────────────────────────────────
function initBoxIcaro() {
  var icaro = document.querySelector("#box-icaro");
  if (!icaro) return;

  // Começa centrada atrás da moldura (top:50% + yPercent:-50 = centro exato),
  // desce conforme o scroll emergindo pela borda inferior da moldura.
  // z-index 35 < moldura z-40 → sempre atrás enquanto ainda sobreposta.
  // Posição inicial: centrada atrás da moldura (xPercent -50 + yPercent -50)
  // A imagem desce em unidades de viewport para garantir que sai visivelmente
  // por baixo da moldura independente do tamanho do elemento.
  // Dispara uma vez quando as laterais terminam (center center do box)
  // Sem scrub — animação livre com duração e easing próprios.
  gsap.fromTo(icaro,
    { xPercent: -50, yPercent: -50, opacity: 0 },
    {
      xPercent: -50,
      y: "42vh",
      opacity: 0.92,
      duration: 2.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#box",
        start:        "center center",
        toggleActions: "play none none reverse",
      },
    }
  );
}

function initServicesAnimations() {
  var serviceContainer = document.querySelector("#services");
  var items = gsap.utils.toArray(".service-item");

  if (!serviceContainer || !items.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var cardsRow =
    serviceContainer.querySelector(".services-container") || serviceContainer;

  var tlKeys = gsap.timeline({
    scrollTrigger: {
      trigger: cardsRow,
      start: "top 52%",
      toggleActions: "play none none none",
    },
    defaults: { ease: "power2.out" },
  });

  items.forEach(function (card, i) {
    var img = card.querySelector(".service-card-peek__img");
    var body = card.querySelector(":scope > div");
    if (!img) return;

    gsap.set(img, { transformOrigin: "50% 88%", force3D: true });

    var t0 = i * 0.18;

    // Surge levemente, depois "pressiona" como tecla
    tlKeys.fromTo(
      img,
      {
        opacity: 0,
        y: -26,
        scale: 0.88,
      },
      {
        opacity: 1,
        y: 8,
        scaleX: 1.04,
        scaleY: 0.91,
        duration: 0.11,
        ease: "power2.in",
        immediateRender: false,
      },
      t0,
    ).to(
      img,
      {
        y: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 0.52,
        ease: "elastic.out(1.15)",
        immediateRender: false,
      },
      t0 + 0.11,
    );

    if (body) {
      tlKeys.fromTo(
        body,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          immediateRender: false,
        },
        t0 + 0.05,
      );
    }
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
      immediateRender: false,
    },
    {
      scale: 1,
      ease: "power2.out",
    },
  );

  // Animar textos - usar immediateRender: false para evitar shift inicial
  if (isDesktop) {
    tl.fromTo(
      aboutMeTextLeft,
      {
        x: 90,
        opacity: 0,
        immediateRender: false,
      },
      {
        x: -50,
        opacity: 1,
        ease: "power2.out",
      },
      0,
    );
    tl.fromTo(
      aboutMeTextRight,
      {
        x: -90,
        opacity: 0,
        immediateRender: false,
      },
      {
        x: 50,
        opacity: 1,
        ease: "power2.out",
      },
      0,
    );
  } else {
    tl.fromTo(
      aboutMeTextLeft,
      {
        y: 70,
        opacity: 0,
        immediateRender: false,
      },
      {
        y: 0,
        opacity: 1,
        ease: "power2.out",
      },
      0,
    );
    tl.fromTo(
      aboutMeTextRight,
      {
        y: -70,
        opacity: 0,
        immediateRender: false,
      },
      {
        y: 0,
        opacity: 1,
        ease: "power2.out",
      },
      0,
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
      "<",
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
    "<0.4",
  );

  tl.from(
    headerBars[1],
    {
      scaleX: 0,
      transformOrigin: "right center",
      duration: 1.5,
      ease: "power2.out",
    },
    "<",
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
          "<0.4",
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
          "<0.3",
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
    "<0.2",
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
            "<0.3",
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
            "<0.2",
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

/**
 * Dobra de contato: vídeo `eye-motion.mp4` ao fundo, scrub controlado por scroll.
 *
 * Sequência (tudo em um único ScrollTrigger para evitar conflitos de posição):
 *  0–72% do scroll → vídeo avança/recua; conteúdo invisível.
 *  72–100%         → vídeo faz fade-out; conteúdo faz fade-in sobre fundo neutro.
 *  Fim do pin      → scroll normal retoma com formulário visível.
 *
 * Distância de scrub do vídeo propositalmente mais curta (menos scroll para o fim).
 */
function initContactScrollVideo() {
  const section = document.getElementById("contact");
  const video   = document.getElementById("contact-video");
  const content = section ? section.querySelector(".contact-content") : null;

  if (!section || !video || !content) return;
  if (typeof ScrollTrigger === "undefined") return;
  if (typeof gsap === "undefined") return;

  video.muted      = true;
  video.playsInline = true;

  // CSS sabe que JS está no controle — esconde conteúdo via .is-scroll-driven.
  content.classList.add("is-scroll-driven");

  const setup = () => {
    if (section.dataset.scrollReady === "true") return;
    section.dataset.scrollReady = "true";

    video.classList.add("is-ready");

    const duration = Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : 4;

    // 72% do scroll total é usado pelo scrub; 28% para a transição.
    const VIDEO_RATIO = 0.72;

    // Menos scroll para percorrer o vídeo: base menor (antes 0.8·vh e 0.3·vh·s).
    const totalDistance = () =>
      Math.max(window.innerHeight * 0.52, duration * window.innerHeight * 0.2) /
      VIDEO_RATIO;

    // Opacidade máxima < 1: o vídeo tem fundo branco e o bloco usa #EDEDED — mistura melhor.
    const VIDEO_BLEND_OPACITY = 0.76;

    // quickSetters: mais rápido que gsap.set() dentro de onUpdate.
    const setVideoOpacity   = gsap.quickSetter(video,   "opacity");
    const setContentOpacity = gsap.quickSetter(content, "opacity");
    const setContentY       = gsap.quickSetter(content, "y", "px");

    gsap.set(video,   { opacity: VIDEO_BLEND_OPACITY });
    gsap.set(content, { opacity: 0, y: 24 });

    let lastT = -1;
    const minStep = 1 / 60; // evita seeks redundantes

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => "+=" + totalDistance(),
      pin: true,
      pinSpacing: true,
      scrub: 0.35,          // um pouco mais rápido a acompanhar o scroll
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress; // já suavizado pelo scrub

        // ── Fase 1: scrub do vídeo ──────────────────────────────────────────
        const videoT = Math.min(p / VIDEO_RATIO, 1) * duration;
        if (Math.abs(videoT - lastT) > minStep) {
          lastT = videoT;
          try { video.currentTime = videoT; } catch (_) {}
        }

        // ── Fase 2: transição (começa quando vídeo chega ao fim) ───────────
        if (p <= VIDEO_RATIO) {
          setVideoOpacity(VIDEO_BLEND_OPACITY);
          setContentOpacity(0);
          setContentY(24);
        } else {
          const t = (p - VIDEO_RATIO) / (1 - VIDEO_RATIO); // 0→1
          setVideoOpacity(VIDEO_BLEND_OPACITY * (1 - t));
          setContentOpacity(t);
          setContentY(24 * (1 - t));
        }
      },
    });
  };

  // iOS Safari só decodifica o primeiro frame após play(). Kick silencioso.
  const kickFirstFrame = () => {
    const p = video.play();
    if (p && typeof p.then === "function") {
      p.then(() => video.pause()).catch(() => {});
    } else {
      try { video.pause(); } catch (_) {}
    }
  };

  if (video.readyState >= 1 && Number.isFinite(video.duration)) {
    kickFirstFrame();
    setup();
  } else {
    video.addEventListener("loadedmetadata", () => {
      kickFirstFrame();
      setup();
    }, { once: true });
    setTimeout(setup, 1500);
  }
}
