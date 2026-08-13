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
 * defer).
 */
(function () {
  "use strict";

  var reduced = !!(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";

  if (hasST) gsap.registerPlugin(ScrollTrigger);
  if (reduced || !hasST) document.documentElement.classList.add("no-anim");

  /* ─── Ano do rodapé (mesmo padrão de site.js) ───────────────────────────── */
  var yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var EASE = "power3.out";

  var reveals = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
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

  /* ─── Carrossel de cases: setas + contador, scroll-snap nativo ──────────
     .cases__viewport já rola sozinho (overflow-x + scroll-snap), então as
     setas só chamam scrollIntoView no card certo — funciona igual com
     clique, trackpad ou swipe, e o contador acompanha qualquer um dos três.
     reduced-motion troca o "smooth" por salto direto. Clique nas setas
     também dispara o wipe em tela cheia (ver função abaixo) — swipe/
     trackpad não, porque ali o gesto já é a transição. */
  (function initCasesCarousel() {
    var viewport = document.querySelector(".cases__viewport");
    var track = document.getElementById("cases-track");
    var cases = track ? Array.prototype.slice.call(track.children) : [];
    var prevBtn = document.querySelector(".cases__arrow--prev");
    var nextBtn = document.querySelector(".cases__arrow--next");
    var currentEl = document.getElementById("cases-current");
    var totalEl = document.getElementById("cases-total");
    if (!viewport || !track || cases.length < 2) {
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
      return;
    }

    var idx = 0;
    /* Enquanto uma seta está conduzindo o scroll, o listener de "scroll"
       abaixo fica surdo: scrollIntoView leva bem mais que os 120ms do
       debounce pra assentar (~700-1100ms, medido), e um evento de scroll
       lido no meio do caminho recalculava o índice errado, fazendo o
       contador "voltar" sozinho um instante depois do clique. Quem clicou
       já sabe pra onde foi — não precisa redescobrir isso pela posição de
       scroll no meio da animação. */
    var isProgrammatic = false;
    var programmaticTimer;

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    function render() {
      if (currentEl) currentEl.textContent = pad(idx + 1);
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === cases.length - 1;
    }

    /* `instant`: usado pela transição em tela cheia — a troca acontece
       encoberta pelo círculo, então o scroll precisa saltar de verdade
       (sem "smooth") pra já estar pronta quando o círculo se apagar.
       Duas pegadinhas do CSSOM aqui: scrollIntoView({behavior:"auto"}) não
       basta porque .cases__viewport tem scroll-behavior:smooth no CSS, e
       "auto" só significa "obedeça o CSS" — continuaria suave. E setar
       .scrollLeft direto TAMBÉM obedece esse scroll-behavior (não é
       instantâneo por padrão como se poderia esperar) — por isso o
       scroll-behavior é derrubado pra "auto" no elemento só durante o
       salto, e devolvido ao smooth logo em seguida (pra swipe/trackpad
       continuarem suaves). */
    function goTo(i, instant) {
      idx = Math.max(0, Math.min(cases.length - 1, i));
      isProgrammatic = true;
      clearTimeout(programmaticTimer);
      if (instant || reduced) {
        var w = cases[0].getBoundingClientRect().width || viewport.clientWidth;
        var prevBehavior = viewport.style.scrollBehavior;
        viewport.style.scrollBehavior = "auto";
        viewport.scrollLeft = idx * w;
        viewport.style.scrollBehavior = prevBehavior;
      } else {
        cases[idx].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      }
      render();
      // Rede de segurança generosa: cobre a animação inteira mesmo se a aba
      // perder foco no meio (RAF throttlado alonga o scroll suave).
      programmaticTimer = setTimeout(function () { isProgrammatic = false; }, instant || reduced ? 200 : 1300);
    }

    if (totalEl) totalEl.textContent = pad(cases.length);

    /* ─── Wipe em tela cheia (efeito "confirmação de compra") ─────────────
       Um círculo cresce a partir do botão clicado (transform-origin no
       ponto do clique) até cobrir a tela — o raio necessário é calculado
       na hora, sempre alcançando o canto mais distante da viewport, então
       funciona igual clicando na seta esquerda ou direita, em qualquer
       tamanho de tela. A troca de case acontece no instante em que o
       círculo termina de crescer (tela 100% coberta); ele então só se
       apaga (opacity), revelando que a troca já aconteceu — rápido e
       direto, sem o usuário "ver" o carrossel deslizando por baixo. */
    var wipeEl = document.getElementById("case-wipe");
    var isWiping = false;

    function playWipe(cx, cy, onCovered) {
      if (!wipeEl || !hasGSAP || reduced) {
        onCovered();
        return;
      }
      // offsetWidth (não getBoundingClientRect): o círculo já nasce em
      // scale(0) via CSS, e getBoundingClientRect refletiria esse zero.
      var base = wipeEl.offsetWidth || 40;
      var farX = Math.max(cx, window.innerWidth - cx);
      var farY = Math.max(cy, window.innerHeight - cy);
      var radius = Math.hypot(farX, farY) * 1.06;
      var scale = (radius * 2) / base;

      isWiping = true;
      gsap.set(wipeEl, { left: cx, top: cy, scale: 0, opacity: 1 });
      gsap
        .timeline({ onComplete: function () { isWiping = false; } })
        .to(wipeEl, { scale: scale, duration: 0.32, ease: "power2.in" })
        .add(onCovered)
        .to(wipeEl, { opacity: 0, duration: 0.26, ease: "power2.out" }, "+=0.05")
        .set(wipeEl, { scale: 0, opacity: 1 });
    }

    function handleArrow(targetIdx, btn) {
      if (isWiping || targetIdx < 0 || targetIdx > cases.length - 1) return;
      var r = btn.getBoundingClientRect();
      playWipe(r.left + r.width / 2, r.top + r.height / 2, function () {
        goTo(targetIdx, true);
      });
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { handleArrow(idx - 1, prevBtn); });
    if (nextBtn) nextBtn.addEventListener("click", function () { handleArrow(idx + 1, nextBtn); });

    // Swipe/trackpad também move o contador — sem isso, ele só refletiria
    // navegação por botão, ficando "errado" assim que o usuário arrasta.
    var scrollT;
    viewport.addEventListener("scroll", function () {
      if (isProgrammatic) return;
      clearTimeout(scrollT);
      scrollT = setTimeout(function () {
        var w = cases[0].getBoundingClientRect().width || 1;
        idx = Math.max(0, Math.min(cases.length - 1, Math.round(viewport.scrollLeft / w)));
        render();
      }, 120);
    });

    render();
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

  /* ─── Floreio do bloco âmbar (aspas decorativa) ────────────────────────── */
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
})();
