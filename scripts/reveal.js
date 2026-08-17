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

  /* ─── Navbar: estado no topo vs. rolada (mesmo padrão de site.js) ───────
     Ausente aqui até então porque estas páginas não tinham nenhuma dobra
     "cheia" logo no topo — agora que sites-institucionais.html abre com uma
     dobra cinematográfica longa, o navbar precisa do mesmo fundo com blur
     ao rolar que ele já ganha no index, ou o texto perde contraste sobre a
     névoa/textura do hero. */
  var navbarEl = document.querySelector(".navbar");
  if (navbarEl) {
    var navLastScrolled = null;
    var onScrollNav = function () {
      var scrolled = window.scrollY > 40;
      if (scrolled === navLastScrolled) return;
      navLastScrolled = scrolled;
      navbarEl.classList.toggle("is-scrolled", scrolled);
    };
    window.addEventListener("scroll", onScrollNav, { passive: true });
    onScrollNav();
  }

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

  /* ─── HERO da página + "por que um site" — dobra cinematográfica ────────
     Mesma técnica do hero do index (site.js: buildHeroCinematic/buildHeroFlow,
     ver ds.css seção 10), só que sem o teclado 3D: aqui o progresso de
     scroll (lerp) move só névoa, luz, textura de fundo (.hero__bg-image),
     capítulos e HUD. Desktop e sem prefers-reduced-motion: palco sticky +
     rAF (buildCinematic). Mobile/reduced-motion: capítulos em fluxo normal,
     cada um com seu próprio ScrollTrigger scrub (buildFlow) — mesmo
     fallback do index, sem textura de fundo (ela só acende na versão com
     palco sticky, igual lá). */
  (function initReasonHero() {
    var hero = document.querySelector(".hero--reason");
    if (!hero) return;
    var heroTrack = hero.querySelector(".hero__track");
    var chapters = Array.prototype.slice.call(hero.querySelectorAll(".hero-chapter"));
    if (!heroTrack || !chapters.length) return;

    var mqNarrow = window.matchMedia ? window.matchMedia("(max-width: 899px)") : null;
    var isNarrow = !!(mqNarrow && mqNarrow.matches);
    var cinematic = !reduced && !isNarrow;

    function clamp(v, min, max) {
      if (min === undefined) min = 0;
      if (max === undefined) max = 1;
      return Math.min(max, Math.max(min, v));
    }
    function mix(from, to, amount) { return from + (to - from) * amount; }
    function smoothstep(start, end, value) {
      var x = clamp((value - start) / (end - start));
      return x * x * (3 - 2 * x);
    }
    function segment(p, start, end) { return smoothstep(start, end, p); }

    /* Cada capítulo: quando entra e quando sai, em fração do progresso —
       mesmas janelas do hero do index (site.js SCENES), só os rótulos do
       HUD e o conteúdo mudam (assinatura do serviço → a pesquisa → a
       clareza → o ativo). */
    var SCENES = [
      { inFrom: null, inTo: null, outFrom: 0.10, outTo: 0.24, num: "01/04", label: "A abertura" },
      { inFrom: 0.20, inTo: 0.32, outFrom: 0.38, outTo: 0.50, num: "02/04", label: "A pesquisa" },
      { inFrom: 0.46, inTo: 0.58, outFrom: 0.62, outTo: 0.72, num: "03/04", label: "A clareza" },
      { inFrom: 0.74, inTo: 0.90, outFrom: null, outTo: null, num: "04/04", label: "O ativo" },
    ];

    function buildCinematic() {
      var rig = hero.querySelector(".hero__rig");
      var bgImage = document.querySelector(".hero__bg-image");
      var light = hero.querySelector(".hero__light");
      var rays = hero.querySelector(".hero__rays");
      var fogBack = hero.querySelector(".hero__fog--back");
      var fogFront = hero.querySelector(".hero__fog--front");
      var cue = hero.querySelector(".hero__cue");
      var hudBar = document.getElementById("reason-hero-hud-bar");
      var hudNum = document.getElementById("reason-hero-hud-chapter");
      var hudLabel = document.getElementById("reason-hero-hud-label");
      var restStrokePath = hero.querySelector(".hero-chapter--rest .sig-stroke path");
      var restMark = hero.querySelector(".hero-chapter--rest [data-mark]");
      var STROKE_LEN = 320;

      var scenes = chapters.map(function (ch, i) {
        return {
          el: ch,
          inner: ch.firstElementChild || ch,
          cfg: SCENES[i] || SCENES[SCENES.length - 1],
          side: ch.dataset.side || null,
        };
      });

      var target = 0, smooth = 0, lastHud = -1, lastTime = 0;
      var SMOOTH_RATE = 4.7;

      function updateTarget() {
        var rect = heroTrack.getBoundingClientRect();
        var distance = heroTrack.offsetHeight - window.innerHeight;
        target = clamp(-rect.top / Math.max(distance, 1));
      }

      function frame(time) {
        var dt = lastTime ? Math.min((time - lastTime) / 1000, 0.25) : 1 / 60;
        lastTime = time;
        smooth += (target - smooth) * (1 - Math.exp(-SMOOTH_RATE * dt));
        var p = clamp(smooth);

        /* Câmera: o mesmo gesto do hero do index — a cena inteira (névoa +
           luz) desliza de leve a cada troca de capítulo. */
        var camX =
          mix(0, -2, segment(p, 0.06, 0.30)) +
          mix(0, 4, segment(p, 0.30, 0.55)) -
          mix(0, 2.4, segment(p, 0.62, 0.86));
        var camY =
          mix(0.6, -1.2, segment(p, 0, 0.35)) +
          mix(0, 2, segment(p, 0.38, 0.64)) -
          mix(0, 1.4, segment(p, 0.72, 1));
        var camScale =
          1.02 +
          segment(p, 0, 0.22) * 0.06 -
          segment(p, 0.22, 0.43) * 0.03 +
          segment(p, 0.43, 0.63) * 0.10 -
          segment(p, 0.65, 0.84) * 0.06 +
          segment(p, 0.84, 1) * 0.04;
        var camRot =
          mix(-0.25, 0.4, segment(p, 0, 0.38)) -
          mix(0, 0.7, segment(p, 0.38, 0.68)) +
          mix(0, 0.4, segment(p, 0.68, 1));

        if (rig) {
          rig.style.transform =
            "translate3d(" + camX.toFixed(3) + "%," + camY.toFixed(3) + "%,0) scale(" +
            camScale.toFixed(4) + ") rotate(" + camRot.toFixed(3) + "deg)";
        }
        if (light) {
          light.style.transform = "translate3d(" + mix(-6, 9, p).toFixed(2) + "%," + mix(4, -5, p).toFixed(2) + "%,0) scale(" + (1 + p * 0.15).toFixed(3) + ")";
          light.style.opacity = (0.28 + segment(p, 0.15, 0.5) * 0.14).toFixed(3);
        }
        if (rays) {
          rays.style.transform = "translate3d(" + mix(-5, 8, p).toFixed(2) + "%," + mix(3, -4, p).toFixed(2) + "%,0) rotate(" + mix(-6, 4, p).toFixed(2) + "deg)";
          rays.style.opacity = (0.1 + segment(p, 0.2, 0.6) * 0.16).toFixed(3);
        }
        if (fogBack) {
          fogBack.style.transform = "translate3d(" + mix(-7, 7, p).toFixed(2) + "%," + mix(6, -6, p).toFixed(2) + "%,0) scale(" + (1.15 + p * 0.15).toFixed(3) + ")";
        }
        if (fogFront) {
          fogFront.style.transform = "translate3d(" + mix(10, -9, p).toFixed(2) + "%," + mix(7, -4, p).toFixed(2) + "%,0) scale(" + (1.2 + p * 0.2).toFixed(3) + ")";
          fogFront.style.opacity = (0.22 + segment(p, 0.4, 0.8) * 0.2).toFixed(3);
        }
        if (cue) cue.style.opacity = (1 - segment(p, 0.02, 0.1)).toFixed(3);
        if (hudBar) hudBar.style.transform = "scaleX(" + p.toFixed(4) + ")";

        /* Capítulos: entra do lado, sai continuando pro mesmo lado — o
           fundo (.hero__bg-image) acompanha, puxado para o lado oposto ao
           texto que está em cena, exatamente como no hero do index. */
        var bgSideShift = 0, bgSidedPresence = 0;
        for (var i = 0; i < scenes.length; i++) {
          var s = scenes[i];
          var cfg = s.cfg;
          var inAmt = cfg.inFrom === null ? 1 : segment(p, cfg.inFrom, cfg.inTo);
          var outAmt = cfg.outFrom === null ? 0 : segment(p, cfg.outFrom, cfg.outTo);
          var vis = inAmt * (1 - outAmt);

          if (s.side) {
            var sideDir = s.side === "right" ? 1 : -1;
            bgSideShift += -sideDir * vis;
            bgSidedPresence += vis;
          }

          s.el.style.opacity = vis.toFixed(3);
          s.el.style.visibility = vis < 0.002 ? "hidden" : "visible";
          if (vis < 0.002) continue;

          var blur = (mix(0.5, 0, inAmt) + outAmt * 0.45).toFixed(3);
          var lift = mix(2.2, 0, inAmt) - outAmt * 7;
          var sc = mix(0.95, 1, inAmt) + outAmt * 0.05;
          var dir = s.side === "right" ? 1 : s.side === "left" ? -1 : 0;
          var slideX = dir ? dir * (mix(9, 0, inAmt) + outAmt * 7) : 0;
          s.inner.style.transform = "translate3d(" + slideX.toFixed(2) + "%," + lift.toFixed(3) + "rem,0) scale(" + sc.toFixed(4) + ")";
          s.inner.style.filter = "blur(" + blur + "rem)";
        }

        if (bgImage) {
          /* Fixa e fora do .hero, fica visível só enquanto a dobra está em
             tela — senão vazaria por trás das seções seguintes. */
          var heroVisible = heroTrack.getBoundingClientRect().bottom > 0;
          if (heroVisible) {
            var bgPresence = clamp(bgSidedPresence, 0, 1);
            var bgX = clamp(bgSideShift, -1, 1) * 6.5;
            var bgY = mix(-1.4, 1.8, p);
            var bgScale = 1.07 + bgPresence * 0.05;
            bgImage.style.transform = "translate3d(" + bgX.toFixed(2) + "%," + bgY.toFixed(2) + "%,0) scale(" + bgScale.toFixed(4) + ")";
            bgImage.style.opacity = (0.3 + bgPresence * 0.24).toFixed(3);
          } else {
            bgImage.style.opacity = 0;
          }
        }

        if (restStrokePath) {
          restStrokePath.style.strokeDashoffset = (STROKE_LEN * (1 - segment(p, 0, 0.08))).toFixed(2);
        }
        if (restMark) {
          restMark.style.backgroundSize = (segment(p, 0.02, 0.10) * 100).toFixed(2) + "% 0.62em";
        }

        var hudIdx = p < 0.22 ? 0 : p < 0.46 ? 1 : p < 0.72 ? 2 : 3;
        if (hudIdx !== lastHud) {
          lastHud = hudIdx;
          if (hudNum) hudNum.textContent = SCENES[hudIdx].num;
          if (hudLabel) hudLabel.textContent = SCENES[hudIdx].label;
        }

        requestAnimationFrame(frame);
      }

      window.addEventListener("scroll", updateTarget, { passive: true });
      window.addEventListener("resize", updateTarget);
      updateTarget();
      requestAnimationFrame(frame);
    }

    /**
     * Fallback (mobile / prefers-reduced-motion): sem palco sticky nem
     * câmera — cada capítulo aparece e some conforme o scroll, um de cada
     * vez, escrubado pelo próprio ScrollTrigger. Mesma ideia de
     * buildHeroFlow em site.js.
     */
    function buildFlow() {
      hero.classList.add("is-flow");
      chapters.forEach(function (ch) { ch.style.opacity = "1"; });
      if (!hasST || reduced) return;

      chapters.forEach(function (ch) {
        var inner = ch.firstElementChild || ch;
        var isRest = ch.classList.contains("hero-chapter--rest");
        var isLast = !isRest && !ch.dataset.side;

        if (isRest) {
          gsap.to(inner, {
            ease: "power1.in",
            keyframes: {
              "0%":   { y: 0,   opacity: 1, filter: "blur(0px)" },
              "100%": { y: -26, opacity: 0, filter: "blur(6px)" },
            },
            scrollTrigger: { trigger: ch, start: "bottom 95%", end: "bottom 45%", scrub: 0.3 },
          });
          var restStroke = ch.querySelector(".sig-stroke");
          if (restStroke) restStroke.classList.add("is-drawn");
          return;
        }

        gsap.to(inner, {
          ease: "power1.inOut",
          keyframes: isLast ? {
            "0%":   { y: 44, opacity: 0, filter: "blur(8px)" },
            "38%":  { y: 0,  opacity: 1, filter: "blur(0px)" },
            "100%": { y: 0,  opacity: 1, filter: "blur(0px)" },
          } : {
            "0%":   { y: 44,  opacity: 0, filter: "blur(8px)" },
            "20%":  { y: 0,   opacity: 1, filter: "blur(0px)" },
            "76%":  { y: 0,   opacity: 1, filter: "blur(0px)" },
            "100%": { y: -40, opacity: 0, filter: "blur(7px)" },
          },
          scrollTrigger: { trigger: ch, start: "center 97%", end: "center 3%", scrub: 0.3 },
        });
      });
    }

    if (cinematic) buildCinematic();
    else buildFlow();
  })();

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
     cima desfaz na mesma ordem. Mesmo princípio de scrub usado nos
     capítulos do hero logo acima, só que aplicado à grade em vez de uma
     pilha vertical. */
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
