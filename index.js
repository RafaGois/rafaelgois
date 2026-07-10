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

  initCustomCursor();

  window.__heroIntroRequested = true;
  window.dispatchEvent(new CustomEvent("hero:introStart"));

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
  initBoxTagline();
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
      // Preso ao próprio texto: como o #box tem 120svh e o texto fica no
      // centro, usar #box terminava o scramble antes do texto aparecer.
      // Aqui começa quando o texto entra por baixo e termina no centro da tela,
      // deixando a animação visível durante todo o percurso.
      trigger: "#box-text",
      // "top 130%": começa com o texto ainda abaixo da tela, alongando o
      // percurso do scramble até terminar no centro.
      start: "top 150%",
      end: "center center",
      scrub: true,
      invalidateOnRefresh: true,
    },
  }).to(proxy, {
    progress: 1,
    duration: 1,
    // Linear: o desembaralhamento se espalha por todo o scroll até o centro,
    // em vez de terminar cedo (power2.out concentrava tudo no início).
    ease: "none",
    onUpdate: () => {
      const p = proxy.progress;
      chars.forEach((el, i) => {
        // Escalona até 1.0 para o último caractere resolver só no fim (centro).
        const threshold = i / chars.length;
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

function initBoxTagline() {
  var tagline = document.querySelector("#box-tagline");
  if (!tagline) return;

  var prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.from(tagline, {
    y: prefersReducedMotion ? 0 : 18,
    opacity: 0,
    duration: prefersReducedMotion ? 0.4 : 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: "#box",
      start: "center 72%",
      toggleActions: "play none none reverse",
    },
  });
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
  const aboutMeTextLeft  = document.querySelector(".about-me-text-left");
  const aboutMeTextRight = document.querySelector(".about-me-text-right");
  const aboutMeImage     = document.querySelector(".about-me-image");

  if (!aboutMeImage) return;

  const isDesktop = window.innerWidth >= 768;

  // Imagem: cresce de 0.6 → 1 conforme a seção entra na tela
  gsap.fromTo(
    aboutMeImage,
    { scale: 0.6, opacity: 0, transformOrigin: "center center", immediateRender: false },
    {
      scale: 1,
      opacity: 1,
      ease: "none",
      scrollTrigger: {
        trigger: aboutMeImage,
        start: "top 85%",
        end: "center 55%",
        scrub: 1.2,
      },
    },
  );

  if (isDesktop) {
    // Desktop: textos chegam das bordas e pousam em x:0
    if (aboutMeTextLeft) {
      gsap.fromTo(
        aboutMeTextLeft,
        { x: -60, opacity: 0, immediateRender: false },
        {
          x: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: aboutMeImage,
            start: "top 85%",
            end: "center 55%",
            scrub: 1.2,
          },
        },
      );
    }
    if (aboutMeTextRight) {
      gsap.fromTo(
        aboutMeTextRight,
        { x: 60, opacity: 0, immediateRender: false },
        {
          x: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: aboutMeImage,
            start: "top 85%",
            end: "center 55%",
            scrub: 1.2,
          },
        },
      );
    }
  } else {
    // Mobile: tudo em coluna, cada bloco sobe ao aparecer
    [aboutMeTextLeft, aboutMeTextRight].forEach((el) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { y: 40, opacity: 0, immediateRender: false },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            end: "top 60%",
            scrub: 1,
          },
        },
      );
    });
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
  if (!header) return;

  const headerBars = header.querySelectorAll(".header-bar");
  const headerLetter = header.querySelector(".header-letter");
  const headerButton = header.querySelector(".header-button");
  const headerTitle = header.querySelector(".header-title");
  const headerSubtitle = header.querySelector(".header-subtitle");
  const headerDescription = header.querySelector(".header-description");
  const navItems = header.querySelectorAll("ul.flex.gap-16 li");

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (!window.__heroIntroRequested) {
    window.__heroIntroRequested = true;
    window.dispatchEvent(new CustomEvent("hero:introStart"));
  }

  if (headerTitle && typeof SplitText !== "undefined" && !prefersReducedMotion) {
    try {
      const splitTitle = new SplitText(headerTitle, { type: "chars" });
      const chars = splitTitle.chars;

      gsap.set(chars, { opacity: 0, y: 40 });
      tl.to(
        chars,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.038,
          ease: "power3.out",
        },
        0,
      );
    } catch (error) {
      console.warn("Erro ao criar SplitText para header-title:", error);
      tl.from(
        headerTitle,
        { opacity: 0, y: 30, duration: 1.1, ease: "power3.out" },
        0,
      );
    }
  } else if (headerTitle) {
    tl.from(
      headerTitle,
      { opacity: 0, y: 30, duration: 1, ease: "power3.out" },
      0,
    );
  }

  if (headerBars[0]) {
    tl.from(
      headerBars[0],
      {
        scaleX: 0,
        transformOrigin: "right center",
        duration: 1.35,
        ease: "expo.out",
      },
      0.45,
    );
  }

  if (headerBars[1]) {
    tl.from(
      headerBars[1],
      {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.35,
        ease: "expo.out",
      },
      0.45,
    );
  }

  if (headerLetter) {
    tl.from(
      headerLetter,
      {
        opacity: 0,
        scale: 0.7,
        duration: 0.7,
        ease: "power2.out",
      },
      0.72,
    );
  }

  if (headerSubtitle && typeof SplitText !== "undefined") {
    try {
      const split = new SplitText(headerSubtitle, {
        type: "lines, words",
        mask: "lines",
      });
      if (split && split.lines) {
        tl.from(
          split.lines,
          {
            yPercent: 110,
            opacity: 0,
            duration: 0.85,
            stagger: 0.08,
            ease: "expo.out",
          },
          1.35,
        );
      }
    } catch (error) {
      console.warn("Erro ao criar SplitText para header-subtitle:", error);
    }
  }

  if (headerDescription && typeof SplitText !== "undefined") {
    try {
      const splitDescription = new SplitText(headerDescription, {
        type: "lines",
        mask: "lines",
      });
      if (splitDescription && splitDescription.lines) {
        tl.from(
          splitDescription.lines,
          {
            yPercent: 100,
            opacity: 0,
            duration: 0.75,
            stagger: 0.06,
            ease: "power2.out",
          },
          1.55,
        );
      }
    } catch (error) {
      console.warn("Erro ao criar SplitText para header-description:", error);
    }
  }

  if (navItems.length) {
    tl.from(
      navItems,
      {
        y: -18,
        opacity: 0,
        duration: 0.65,
        stagger: { amount: 0.35, from: "center" },
        ease: "power2.out",
      },
      1.85,
    );
  }

  if (headerButton) {
    tl.from(
      headerButton,
      {
        y: 16,
        opacity: 0,
        scale: 0.92,
        transformOrigin: "center center",
        duration: 0.7,
        ease: "back.out(2)",
      },
      2.15,
    );
  }
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

/** Cursor customizado: ponto + anel com lag (desktop, pointer fino). */
function initCustomCursor() {
  if (typeof gsap === "undefined") return;

  var HOVER_SELECTOR =
    "a, button, input, textarea, select, label, [role='button'], .project-visual, .service-item, .testimonial-nav-btn, .dot";

  var root = null;
  var ring = null;
  var dot = null;
  var enabled = false;
  var visible = false;
  var hovering = false;
  var pressed = false;
  var hasMoved = false;

  var xRing = null;
  var yRing = null;
  var xDot = null;
  var yDot = null;

  var onMove = null;
  var onOver = null;
  var onOut = null;
  var onDown = null;
  var onUp = null;
  var onLeave = null;
  var onEnter = null;
  var onResize = null;

  function canUseCustomCursor() {
    if (window.innerWidth < 768) return false;
    if (typeof window.matchMedia !== "function") return true;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function ringLagDuration() {
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return 0.08;
    }
    return 0.55;
  }

  function setHoverState(next) {
    if (!root || hovering === next) return;
    hovering = next;
    root.classList.toggle("is-hover", next);
  }

  function setPressedState(next) {
    if (!root || pressed === next) return;
    pressed = next;
    root.classList.toggle("is-pressed", next);
  }

  function setVisible(next) {
    if (!root || visible === next) return;
    visible = next;
    root.classList.toggle("is-visible", next);
  }

  function mount() {
    if (root || !canUseCustomCursor()) return;

    root = document.createElement("div");
    root.id = "custom-cursor";
    root.className = "custom-cursor";
    root.setAttribute("aria-hidden", "true");

    ring = document.createElement("div");
    ring.className = "custom-cursor__ring";

    dot = document.createElement("div");
    dot.className = "custom-cursor__dot";

    root.appendChild(ring);
    root.appendChild(dot);
    document.body.appendChild(root);
    document.body.classList.add("custom-cursor-active");

    gsap.set([ring, dot], { left: 0, top: 0 });

    var lag = ringLagDuration();
    xRing = gsap.quickTo(ring, "left", { duration: lag, ease: "power3.out" });
    yRing = gsap.quickTo(ring, "top", { duration: lag, ease: "power3.out" });
    xDot = gsap.quickTo(dot, "left", { duration: 0.12, ease: "power3.out" });
    yDot = gsap.quickTo(dot, "top", { duration: 0.12, ease: "power3.out" });

    onMove = function (e) {
      if (!hasMoved) {
        hasMoved = true;
        gsap.set([ring, dot], { left: e.clientX, top: e.clientY });
      }
      xRing(e.clientX);
      yRing(e.clientY);
      xDot(e.clientX);
      yDot(e.clientY);
      if (!visible) setVisible(true);
    };

    onOver = function (e) {
      if (e.target.closest(HOVER_SELECTOR)) setHoverState(true);
    };

    onOut = function (e) {
      var from = e.target.closest(HOVER_SELECTOR);
      if (!from) return;
      var to = e.relatedTarget;
      if (!to || !from.contains(to)) setHoverState(false);
    };

    onDown = function () {
      setPressedState(true);
    };

    onUp = function () {
      setPressedState(false);
    };

    onLeave = function () {
      setVisible(false);
    };

    onEnter = function () {
      setVisible(true);
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    enabled = true;
  }

  function unmount() {
    if (!enabled) return;

    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseover", onOver);
    document.removeEventListener("mouseout", onOut);
    document.removeEventListener("mousedown", onDown);
    document.removeEventListener("mouseup", onUp);
    document.documentElement.removeEventListener("mouseleave", onLeave);
    document.documentElement.removeEventListener("mouseenter", onEnter);

    document.body.classList.remove("custom-cursor-active");

    if (root && root.parentNode) {
      root.parentNode.removeChild(root);
    }

    root = null;
    ring = null;
    dot = null;
    xRing = null;
    yRing = null;
    xDot = null;
    yDot = null;
    enabled = false;
    visible = false;
    hovering = false;
    pressed = false;
    hasMoved = false;
  }

  onResize = function () {
    if (canUseCustomCursor()) {
      mount();
    } else {
      unmount();
    }
  };

  mount();
  window.addEventListener("resize", onResize);
}

