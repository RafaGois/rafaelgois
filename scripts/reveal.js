/**
 * rafaelgois.com — revelações genéricas para páginas de conteúdo (sem hero).
 * Mesmo princípio de scripts/site.js (docs/design_system.html, seção 07):
 *  · um gesto por elemento — nada re-anima ao rolar de volta;
 *  · só transform/opacity;
 *  · todo movimento tem um "sem movimento" (prefers-reduced-motion).
 *
 * Usado nas páginas de trabalho (sites-institucionais, sistemas-de-controle,
 * aplicacoes-sob-medida), que não têm hero/three.js — só [data-reveal] e
 * [data-rule]. Depende de: gsap 3.13 + ScrollTrigger (carregados antes, com
 * defer). SplitText é opcional (registra só se a página carregar o script —
 * hoje só sites-institucionais): sem ela, [data-quote] cai no fallback de
 * fade simples em vez do gesto palavra a palavra.
 */
(function () {
  "use strict";

  var reduced = !!(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  var hasSplit = hasGSAP && typeof window.SplitText !== "undefined";
  /* Mesmo corte de site.js (e do @media do ds.css): abaixo disso, nada de
     dobra pinada — o conteúdo empilha e cada peça entra na vertical. */
  var isNarrow = !!(window.matchMedia && window.matchMedia("(max-width: 899px)").matches);

  if (hasST) gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) gsap.registerPlugin(SplitText);
  if (reduced || !hasST) document.documentElement.classList.add("no-anim");

  function splitWords(el) {
    if (!el) return [];
    if (!hasSplit) return [el];
    try {
      return new SplitText(el, { type: "words", wordsClass: "w" }).words;
    } catch (err) {
      return [el];
    }
  }

  function slice(nodes) { return Array.prototype.slice.call(nodes); }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  /* ─── Ano do rodapé (mesmo padrão de site.js) ───────────────────────────── */
  var yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var EASE = "power3.out";

  var reveals = slice(document.querySelectorAll("[data-reveal]"));
  if (hasST && !reduced) {
    reveals.forEach(function (el) {
      gsap.to(el, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: EASE,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });
  } else {
    reveals.forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  var rules = Array.prototype.slice.call(document.querySelectorAll("[data-rule]"));
  if (hasST && !reduced) {
    rules.forEach(function (rule) {
      gsap.fromTo(
        rule,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.1,
          ease: EASE,
          scrollTrigger: { trigger: rule, start: "top 92%", once: true },
        },
      );
    });
  }

  /* ─── "O que é entregue" — dossiê editorial, timeline por módulo ───────
     Cada .deliver-mod tem sua própria linha do tempo (não o [data-reveal]
     genérico): numeral-fantasma, índice, ícone, título com máscara de
     cortina e corpo entram em cascata, um gesto encadeado em vez de um
     fade único. Presa ao scroll (scrub, sem once): a entrada acompanha o
     progresso exato da rolagem e desfaz sozinha se o usuário volta. O
     numeral de fundo ainda ganha, por cima, um parallax contínuo próprio
     enquanto o módulo cruza a viewport. */
  var deliverMods = Array.prototype.slice.call(document.querySelectorAll(".deliver-mod"));
  if (deliverMods.length) {
    if (hasST && !reduced) {
      deliverMods.forEach(function (mod) {
        var watermark = mod.querySelector(".deliver-mod__watermark");
        var num = mod.querySelector(".deliver-mod__num");
        var icon = mod.querySelector(".deliver-mod__icon");
        var maskLines = mod.querySelectorAll(".deliver-mod__mask-line");
        var paragraphs = mod.querySelectorAll(".deliver-mod__body p");
        var proofs = mod.querySelectorAll(".deliver-mod__proof, .deliver-mod__chip");

        var tl = gsap.timeline({
          scrollTrigger: { trigger: mod, start: "top 78%", end: "top 20%", scrub: 0.3 },
        });

        if (watermark) {
          tl.to(watermark, { opacity: 0.09, scale: 1, duration: 1.4, ease: "expo.out" }, 0);
        }
        if (num) tl.to(num, { opacity: 1, y: 0, duration: 0.5, ease: EASE }, 0.05);
        if (icon) tl.to(icon, { opacity: 1, scale: 1, rotation: 0, duration: 0.65, ease: "back.out(2.4)" }, 0.15);
        if (maskLines.length) {
          tl.to(maskLines, { y: "0%", duration: 0.9, ease: "power4.out", stagger: 0.06 }, 0.22);
        }
        if (paragraphs.length) {
          tl.to(paragraphs, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.08 }, 0.4);
        }
        if (proofs.length) {
          tl.to(proofs, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)", stagger: 0.08 }, 0.55);
        }

        if (watermark) {
          gsap.fromTo(
            watermark,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: { trigger: mod, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      });
    } else {
      /* .no-anim já resolve o repouso via CSS (inclui a opacidade ambiente
         do numeral-fantasma, que não é 1 como o resto) — só o teatro do
         parallax contínuo depende de JS, então não há nada a fazer aqui. */
    }
  }

  /* ─── "Por que um site institucional" — mesma receita de Habilidades ───
     (site.js: initSkillsBg + initSkillNodeReveals). Nada de pin: cada
     bloco entra do seu próprio lado (data-align) num scrub preso a ele
     mesmo, e a imagem de fundo se reposiciona conforme o bloco que está
     entrando em cena — três trechos de scroll encadeados, um por bloco. */
  var reasonSection = document.querySelector(".reason-scroll");
  var reasonBlocks = reasonSection ? Array.prototype.slice.call(reasonSection.querySelectorAll(".reason-block")) : [];

  if (reasonSection && reasonBlocks.length && hasST && !reduced) {
    var reasonBg = reasonSection.querySelector(".reason-scroll__bg-image");
    var reasonFogBack = reasonSection.querySelector(".reason-scroll__fog--back");
    var reasonLight = reasonSection.querySelector(".reason-scroll__light");
    var reasonFogFront = reasonSection.querySelector(".reason-scroll__fog--front");

    if (reasonBg) {
      var reasonSides = reasonBlocks.map(function (b) { return b.dataset.align === "right" ? 1 : -1; });

      // Entrada: acende junto com o primeiro bloco.
      gsap.fromTo(
        reasonBg,
        { xPercent: reasonSides[0] * -6, opacity: 0, scale: 1.12 },
        {
          xPercent: reasonSides[0] * 5, opacity: 0.32, scale: 1.08,
          immediateRender: false,
          scrollTrigger: { trigger: reasonSection, start: "top 85%", end: "top 45%", scrub: 1 },
        },
      );
      // Um trecho por bloco seguinte: o fundo desliza para o lado do bloco que chega.
      for (var bi = 1; bi < reasonBlocks.length; bi++) {
        gsap.fromTo(
          reasonBg,
          { xPercent: reasonSides[bi - 1] * 5 },
          {
            xPercent: reasonSides[bi] * 5,
            ease: "power1.inOut",
            immediateRender: false,
            scrollTrigger: { trigger: reasonBlocks[bi], start: "top 90%", end: "top 40%", scrub: 1.1 },
          },
        );
      }
      // Saída: apaga ao fim da lista.
      gsap.fromTo(
        reasonBg,
        { opacity: 0.32 },
        {
          opacity: 0,
          immediateRender: false,
          scrollTrigger: { trigger: reasonBlocks[reasonBlocks.length - 1], start: "bottom 55%", end: "bottom 15%", scrub: 1 },
        },
      );

      function reasonAtmo(el, opacity) {
        if (!el) return;
        gsap.fromTo(el, { opacity: 0 }, {
          opacity: opacity, immediateRender: false,
          scrollTrigger: { trigger: reasonSection, start: "top 85%", end: "top 45%", scrub: 1 },
        });
        gsap.fromTo(el, { opacity: opacity }, {
          opacity: 0, immediateRender: false,
          scrollTrigger: { trigger: reasonBlocks[reasonBlocks.length - 1], start: "bottom 55%", end: "bottom 15%", scrub: 1 },
        });
      }
      reasonAtmo(reasonFogBack, 0.26);
      reasonAtmo(reasonLight, 0.3);
      reasonAtmo(reasonFogFront, 0.4);
    }

    reasonBlocks.forEach(function (block) {
      var dir = block.dataset.align === "right" ? 1 : -1;
      var roman = block.querySelector(".reason-block__roman");
      var icon = block.querySelector(".reason-block__icon");
      var label = block.querySelector(".text-overline");
      var desc = block.querySelector(".reason-block__desc");

      var tl = gsap.timeline({
        scrollTrigger: { trigger: block, start: "top 88%", end: "top 45%", scrub: 0.7 },
      });
      if (roman) tl.from(roman, { x: dir * 40, opacity: 0, ease: "none", duration: 0.6 }, 0);
      if (icon) tl.from(icon, { x: dir * 44, opacity: 0, ease: "none", duration: 0.55 }, 0.05);
      if (label) tl.from(label, { x: dir * 34, opacity: 0, ease: "none", duration: 0.5 }, 0.16);
      if (desc) tl.from(desc, { x: dir * 28, opacity: 0, ease: "none", duration: 0.5 }, 0.26);
    });
  }

  /* ─── "Trabalhos reais" — três cases em scroll horizontal ──────────────
     Mesma receita da dobra "Sobre mim" do index.html (site.js:
     initAboutScroll): no desktop a dobra fica pinada e o track desliza na
     horizontal com scrub; imagem e texto de cada case ganham um parallax
     contínuo (nunca opacity/y — isso pertenceria a uma entrada) conforme o
     painel cruza o centro do pin.

     O que essa dobra tem a mais é o fio ao fundo. Ele não é decoração
     parada: o traço cheio se desenha conforme o scroll avança (stroke-
     dashoffset preso ao progresso), uma cabeça luminosa acompanha a ponta
     desse traço, e três paradas — uma por case — acendem quando o traço
     chega nelas. Cabeça e paradas são elementos HTML posicionados sobre o
     próprio path via getPointAtLength (ver pointAt, abaixo). Por isso, esse
     fio não tem a deriva lenta que a linha do "Sobre mim" tem: qualquer
     transform no grupo tiraria a cabeça de cima da linha.

     Mobile / prefers-reduced-motion / sem ScrollTrigger: pilha vertical, o
     fio vira uma trilha vertical na lateral que se desenha na leitura de
     cima pra baixo, e cada case entra uma vez só. */
  function initCasesScroll() {
    var section = document.querySelector(".cases-scroll");
    var pin = document.getElementById("cases-scroll-pin");
    var track = document.getElementById("cases-scroll-track");
    if (!section || !pin || !track) return;

    var panels = slice(track.querySelectorAll("[data-case-panel]"));
    if (!panels.length) return;

    var accents = panels.map(function (p) {
      return getComputedStyle(p).getPropertyValue("--case-accent").trim();
    });

    /* O fio inteiro (e a cabeça, e as paradas) vestem a cor do case ativo —
       um sinal de identidade que atravessa a dobra sem virar selo. */
    var lastAccent = "";
    function setAccent(i) {
      var accent = accents[i];
      if (!accent || accent === lastAccent) return;
      lastAccent = accent;
      pin.style.setProperty("--cases-accent", accent);
    }

    /* ── Repouso: pilha vertical ─────────────────────────────────────────── */
    if (!hasST || isNarrow || reduced) {
      if (!hasST || reduced) return;

      panels.forEach(function (panel, i) {
        var media = panel.querySelector(".case-panel__media");
        var text = panel.querySelector(".case-panel__text");
        [media, text].forEach(function (el, k) {
          if (!el) return;
          gsap.fromTo(el, { y: 28, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.8, delay: k * 0.08, ease: EASE,
            scrollTrigger: { trigger: panel, start: "top 84%", once: true },
          });
        });
        ScrollTrigger.create({
          trigger: panel,
          start: "top 65%",
          end: "bottom 45%",
          onEnter: function () { setAccent(i); },
          onEnterBack: function () { setAccent(i); },
        });
      });

      var curveMobile = pin.querySelector(".cases-curve-path--mobile");
      if (curveMobile) {
        var mobileLen = curveMobile.getTotalLength();
        curveMobile.style.strokeDasharray = mobileLen;
        curveMobile.style.strokeDashoffset = mobileLen;
        gsap.to(curveMobile, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: track, start: "top 82%", end: "bottom 25%", scrub: 0.6 },
        });
      }
      setAccent(0);
      return;
    }

    /* ── Desktop: dobra pinada, cases na horizontal ──────────────────────── */
    section.classList.add("is-horizontal");
    setAccent(0);

    var VB_W = 1600, VB_H = 900; // viewBox do .cases-curve-svg
    var curveSvg = pin.querySelector(".cases-curve-svg");
    var curveMain = pin.querySelector(".cases-curve-path--main");
    var head = pin.querySelector(".cases-curve-head");
    var stops = slice(pin.querySelectorAll(".cases-curve-stop"));
    /* Onde cada case "para" no fio. Não são frações do scroll, e sim do
       comprimento do traço: é a rota que tem começo, meio e fim — o primeiro
       marco logo depois da largada, o último um pouco antes da chegada. */
    var STOP_AT = [0.15, 0.5, 0.85];
    var curveLen = 0;
    if (curveMain) {
      curveLen = curveMain.getTotalLength();
      curveMain.style.strokeDasharray = curveLen;
      curveMain.style.strokeDashoffset = curveLen;
    }

    /* Ponto do path em pixels, relativo ao pin. O SVG não cobre o pin
       inteiro (é uma faixa presa no rodapé) e ainda é esticado
       — preserveAspectRatio="none" —, então a conversão é uma regra de três
       por eixo contra a caixa real do SVG, mais o deslocamento dele dentro
       do pin. Os dois rects carregam o mesmo transform do pin, então a
       diferença entre eles já sai em coordenadas locais. */
    function pointAt(fraction) {
      var pt = curveMain.getPointAtLength(clamp(fraction, 0, 1) * curveLen);
      var sr = curveSvg.getBoundingClientRect();
      var pr = pin.getBoundingClientRect();
      return {
        x: sr.left - pr.left + (pt.x / VB_W) * sr.width,
        y: sr.top - pr.top + (pt.y / VB_H) * sr.height,
      };
    }
    function place(el, fraction) {
      var p = pointAt(fraction);
      el.style.transform = "translate(" + p.x + "px, " + p.y + "px)";
    }
    function placeStops() {
      if (!curveMain || !curveSvg || !curveLen) return;
      stops.forEach(function (stop, i) { place(stop, STOP_AT[i] || 0); });
    }

    function scrollAmount() {
      var base = Math.max(0, track.scrollWidth - pin.clientWidth);
      // Folga no fim: sem ela o último case para com a borda do track
      // encostada na tela, longe do centro.
      return base + pin.clientWidth * 0.14;
    }

    var mediaEls = panels.map(function (p) { return p.querySelector(".case-panel__media"); });
    var textEls = panels.map(function (p) { return p.querySelector(".case-panel__text"); });
    // Inclinação de base por case — a assimetria evita o efeito "espelho
    // engessado" de painéis idênticos alternando de lado.
    var baseRotate = [-1.8, 1.4, -1];
    panels.forEach(function (panel, i) {
      if (mediaEls[i]) gsap.set(mediaEls[i], { rotateZ: baseRotate[i] || 0 });
    });

    var lastActive = -1;

    /* Qual case está mais perto do centro do pin — não tem mais HUD de
       texto pra alimentar (removido: duplicava o sinal do fio colorido),
       mas o fio ainda precisa saber de quem puxar a cor. */
    function updateActiveCase() {
      var rect = pin.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var best = 0, bestDist = Infinity;
      panels.forEach(function (panel, i) {
        var pr = panel.getBoundingClientRect();
        var dist = Math.abs(pr.left + pr.width / 2 - centerX);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      if (best !== lastActive) {
        lastActive = best;
        setAccent(best);
      }
    }

    // Parallax contínuo: imagem e texto atravessam o centro em velocidades e
    // rotações diferentes. Só xPercent/yPercent/rotateZ — nada de opacity ou
    // scale, que pertencem a gestos de entrada.
    function applyParallax() {
      var rect = pin.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var span = Math.max(1, rect.width * 0.7);
      panels.forEach(function (panel, i) {
        var pr = panel.getBoundingClientRect();
        var p = gsap.utils.clamp(-1, 1, (pr.left + pr.width / 2 - centerX) / span);
        if (mediaEls[i]) {
          gsap.set(mediaEls[i], { xPercent: p * -9, rotateZ: (baseRotate[i] || 0) + p * 5 });
        }
        if (textEls[i]) gsap.set(textEls[i], { xPercent: p * 5, yPercent: p * -3 });
      });
    }

    function onScrub(progress) {
      progress = typeof progress === "number" ? progress : 0;
      applyParallax();
      updateActiveCase();
      if (!curveMain || !curveSvg || !curveLen) return;
      // Leve adiantamento: o traço termina um pouco antes do fim do scroll,
      // pra já estar completo quando o último case chega ao centro.
      var grown = clamp(progress * 1.1, 0, 1);
      curveMain.style.strokeDashoffset = curveLen * (1 - grown);
      if (head) {
        place(head, grown);
        head.style.opacity = grown > 0.01 && grown < 0.995 ? "1" : "0";
      }
      stops.forEach(function (stop, i) {
        stop.classList.toggle("is-reached", grown >= (STOP_AT[i] || 0));
      });
    }

    /* O progresso que interessa é o do tween, não o do ScrollTrigger. Com
       scrub, o callback do trigger só dispara quando a rolagem muda, enquanto
       o track continua deslizando por mais uns 0,6s até assentar — quem
       lesse o progresso do trigger acabaria de mãos dadas com uma posição
       que já não é a da tela (parar de rolar no meio da troca deixava o HUD
       anunciando o case anterior). O onUpdate do tween roda a cada frame do
       scrub, e o progresso dele é exatamente o que está renderizado: o fio,
       a cabeça, as paradas e o HUD passam a acompanhar o que se vê. */
    /* Tween e trigger criados em duas etapas (não o atalho `scrollTrigger:`
       dentro do gsap.to): o ScrollTrigger faz um refresh síncrono já na
       criação, e nesse instante a variável do tween ainda não recebeu o
       valor — os callbacks quebrariam logo no primeiro frame. Criando o
       tween primeiro, pausado, e ligando o trigger a ele depois, `slide`
       existe antes de qualquer callback rodar. */
    var slide = gsap.to(track, {
      x: function () { return -scrollAmount(); },
      ease: "none",
      paused: true,
      onUpdate: function () { onScrub(slide.progress()); },
    });

    ScrollTrigger.create({
      trigger: pin,
      start: "top top",
      end: function () { return "+=" + scrollAmount(); },
      scrub: 0.6,
      pin: true,
      invalidateOnRefresh: true,
      animation: slide,
      /* Esse pin reserva espaço de scroll extra, então tudo que vem depois
         dele na página (a grade de "Ferramentas que uso", o fechamento) só
         calcula start/end certo se ele for recalculado primeiro. Os
         [data-reveal] genéricos lá do topo do arquivo foram registrados
         antes deste trigger — refreshPriority garante a ordem certa sem
         depender da ordem de criação. */
      refreshPriority: 1,
      onRefresh: function () { placeStops(); onScrub(slide.progress()); },
    });

    placeStops();
    onScrub(0);
  }
  initCasesScroll();

  /* ─── Parallax de cursor nos cases reais ────────────────────────────────
     Janela (moldura) e mancha de cor atrás dela se deslocam em velocidades
     diferentes conforme o cursor — mesma ideia de profundidade por camada do
     cursor customizado (site.js: um quickTo por elemento, com sua própria
     duração). A moldura (mais "perto") se move mais; a mancha (mais "longe")
     se move menos — é essa diferença que lê como parallax. A área de escuta é
     o case inteiro, pra reagir também com o cursor sobre o texto ao lado.
     Escreve em .case-panel__frame / .case-panel__glow, nunca em
     .case-panel__media — esse é do parallax de scroll acima, e duas mãos na
     mesma transform brigariam. Só ponteiro fino e sem reduced-motion. */
  (function initCasesParallax() {
    if (!hasGSAP || reduced) return;
    if (!(window.matchMedia && window.matchMedia("(pointer: fine)").matches)) return;

    var FRAME_RANGE = 12; // px — moldura, camada "perto"
    var GLOW_RANGE = 5; // px — mancha, camada "longe"

    slice(document.querySelectorAll(".case-panel")).forEach(function (card) {
      var frame = card.querySelector(".case-panel__frame");
      var glow = card.querySelector(".case-panel__glow");
      if (!frame) return;

      var frameX = gsap.quickTo(frame, "x", { duration: 0.7, ease: "power3.out" });
      var frameY = gsap.quickTo(frame, "y", { duration: 0.7, ease: "power3.out" });
      var glowX = glow ? gsap.quickTo(glow, "x", { duration: 1, ease: "power3.out" }) : null;
      var glowY = glow ? gsap.quickTo(glow, "y", { duration: 1, ease: "power3.out" }) : null;

      card.addEventListener(
        "pointermove",
        function (e) {
          if (e.pointerType && e.pointerType !== "mouse") return;
          var r = card.getBoundingClientRect();
          var relX = (e.clientX - r.left) / r.width - 0.5;
          var relY = (e.clientY - r.top) / r.height - 0.5;
          frameX(relX * FRAME_RANGE * 2);
          frameY(relY * FRAME_RANGE * 2);
          if (glowX) {
            glowX(relX * GLOW_RANGE * 2);
            glowY(relY * GLOW_RANGE * 2);
          }
        },
        { passive: true },
      );

      card.addEventListener("pointerleave", function () {
        frameX(0);
        frameY(0);
        if (glowX) {
          glowX(0);
          glowY(0);
        }
      });
    });
  })();

  /* ─── "Stack típica" — revelação escrubada com o scroll ────────────────
     Timeline própria (não o [data-reveal] genérico, nem "once"): presa a
     UM scrub só, ligado à posição real do scroll — rolar pra baixo faz as
     seis células (e a régua entre as duas linhas) surgirem em sequência
     elegante, uma célula "acendendo" depois da outra; rolar de volta pra
     cima desfaz na mesma ordem. Mesmo princípio de scrub usado em
     .reason-block logo acima, só que aplicado à grade em vez de uma pilha
     vertical. */
  (function initStackGrid() {
    var grid = document.getElementById("stack-grid");
    var divider = document.getElementById("stack-grid-divider");
    var cells = grid ? Array.prototype.slice.call(grid.querySelectorAll("[data-stack-cell]")) : [];
    if (!grid || !cells.length || !hasST || reduced) return;

    var CELL_START = 0.1, CELL_DUR = 0.7, CELL_STAGGER = 0.15;
    var totalDur = CELL_START + (cells.length - 1) * CELL_STAGGER + CELL_DUR;

    var stackTl = gsap.timeline({
      scrollTrigger: { trigger: grid, start: "top 92%", end: "top 38%", scrub: 0.6 },
    });
    // Régua cresce a régua inteira do scroll (não só o começo) — o traço
    // vai se completando junto com as células, não "salta" pronto cedo.
    if (divider) stackTl.fromTo(divider, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: totalDur }, 0);
    stackTl.to(cells, { opacity: 1, y: 0, ease: "none", duration: CELL_DUR, stagger: CELL_STAGGER }, CELL_START);
  })();

  /* ─── Grifo âmbar: o marca-texto lendo junto (mesmo padrão de site.js) ── */
  if ("IntersectionObserver" in window) {
    var markObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-marked");
          markObserver.unobserve(e.target);
        });
      },
      { threshold: 0.9 },
    );
    document.querySelectorAll("[data-mark]").forEach(function (m) { markObserver.observe(m); });
  } else {
    document.querySelectorAll("[data-mark]").forEach(function (m) { m.classList.add("is-marked"); });
  }

  /* ─── Manifesto: aspas decorativa entra antes da citação, girando e
     encaixando no lugar — a assinatura visual da seção 100% âmbar (mesmo
     padrão de site.js). ────────────────────────────────────────────────── */
  var manifestoMark = document.querySelector(".manifesto__mark");
  if (manifestoMark && hasST && !reduced) {
    gsap.to(manifestoMark, {
      opacity: 0.4,
      scale: 1,
      rotate: 0,
      duration: 1.3,
      ease: "expo.out",
      scrollTrigger: { trigger: manifestoMark, start: "top 88%", once: true },
    });
  }

  /* ─── Manifesto: a citação entra palavra por palavra, com um leve
     desfoque que resolve em foco — mais cinematográfico que um fade puro
     (mesmo padrão de site.js). Sem SplitText, cai num fade simples. ────── */
  var manifestoQuote = document.querySelector("[data-quote]");
  if (manifestoQuote && hasST) {
    if (hasSplit && !reduced) {
      var quoteWords = splitWords(manifestoQuote);
      gsap.fromTo(
        quoteWords,
        { yPercent: 110, opacity: 0, filter: "blur(10px)" },
        {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          stagger: 0.07,
          duration: 1.1,
          ease: EASE,
          scrollTrigger: { trigger: manifestoQuote, start: "top 78%", once: true },
        },
      );
    } else if (!reduced) {
      gsap.from(manifestoQuote, {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: EASE,
        scrollTrigger: { trigger: manifestoQuote, start: "top 78%", once: true },
      });
    }
  }

  /* ─── Pinceladas-assinatura fora do hero (mesmo padrão de site.js) ─────── */
  if ("IntersectionObserver" in window) {
    var strokeObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-drawn");
          strokeObserver.unobserve(e.target);
        });
      },
      { threshold: 0.4 },
    );
    document
      .querySelectorAll(".closing-cta .sig-stroke, .manifesto__cite-stroke")
      .forEach(function (s) { strokeObserver.observe(s); });
  }

  /* ─── Recalcular quando fontes/imagens mudam a altura ───────────────────
     A dobra dos cases é pinada: se a página cresce depois que os triggers já
     foram medidos (fonte de display trocando o tamanho dos títulos, captura
     de tela chegando), o start/end do pin fica deslocado. Mesmo cuidado que
     site.js toma no index. */
  if (hasST) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
})();
