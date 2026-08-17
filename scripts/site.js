/**
 * rafaelgois.com — comportamento do site, derivado de docs/design_system.html.
 *
 * Princípios de movimento (seção 07 do design system):
 *  · um gesto por elemento — nada re-anima ao rolar de volta;
 *  · só transform/opacity;
 *  · entrar rápido, sair mais rápido;
 *  · todo movimento tem um "sem movimento" (prefers-reduced-motion).
 *
 * Depende de: gsap 3.13 + ScrollTrigger + SplitText + ScrambleTextPlugin
 * (carregados antes, com defer).
 */
(function () {
  "use strict";

  /* ─── Ambiente ─────────────────────────────────────────────────────────── */
  var mqReduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  var reduced = !!(mqReduced && mqReduced.matches);
  var mqNarrow = window.matchMedia ? window.matchMedia("(max-width: 899px)") : null;
  var isNarrow = !!(mqNarrow && mqNarrow.matches);
  var mqFinePointer = window.matchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine)")
    : null;

  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  var hasSplit = hasGSAP && typeof window.SplitText !== "undefined";
  var hasScramble = hasGSAP && typeof window.ScrambleTextPlugin !== "undefined";

  if (hasST) gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) gsap.registerPlugin(SplitText);
  if (hasScramble) gsap.registerPlugin(ScrambleTextPlugin);
  if (reduced || !hasST) document.documentElement.classList.add("no-anim");

  var EASE = { gesture: "power3.out", breath: "power2.inOut", settle: "expo.out" };

  /* ─── Lenis: smooth scroll ──────────────────────────────────────────────
     Lenis continua rolando o scroll nativo (window/documentElement), então
     tudo que já lê window.scrollY ou escuta "scroll" (navbar, cursor, o
     scrub do ScrollTrigger) segue funcionando sem mudanças. Só precisa:
     (1) avançar o Lenis a cada frame e (2) avisar o ScrollTrigger da nova
     posição a cada frame — por isso ele é ligado ao ticker do GSAP em vez
     de rodar seu próprio requestAnimationFrame solto. Desligado em
     prefers-reduced-motion. */
  var lenis = null;
  if (!reduced && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ autoRaf: false });
    if (hasGSAP) {
      if (hasST) lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      });
    }
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /* ─── Ano do rodapé ───────────────────────────────────────────────────── */
  var yearEl = $("#current-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ─── Fundo do hero: orbes âmbar em canvas 2D ──────────────────────────
     Pausa fora da tela; dpr limitado; menos orbes no mobile. */
  function createOrbField(canvas, count) {
    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return null;

    var dpr = Math.min(window.devicePixelRatio || 1, isNarrow ? 1 : 2);
    var w = 1, h = 1, running = false, rafId = 0;
    var drift = { x: 0, y: 0 };
    var palette = ["255,215,120", "255,176,0", "224,154,0"];
    var orbs = [];

    for (var i = 0; i < count; i++) {
      orbs.push({
        x: 0.2 + Math.random() * 0.6,
        y: 0.2 + Math.random() * 0.6,
        r: 0.24 + Math.random() * 0.2,
        sp: 0.00012 + Math.random() * 0.0002,
        ph: Math.random() * Math.PI * 2,
        c: palette[i % palette.length],
      });
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function paint(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < orbs.length; i++) {
        var o = orbs[i];
        var ox = (o.x + Math.sin(t * o.sp + o.ph) * 0.12 + drift.x) * w;
        var oy = (o.y + Math.cos(t * o.sp * 0.8 + o.ph) * 0.1 + drift.y) * h;
        var rad = o.r * Math.min(w, h);
        var g = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad);
        g.addColorStop(0, "rgba(" + o.c + ",0.5)");
        g.addColorStop(1, "rgba(" + o.c + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ox, oy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function frame(t) {
      if (!running) return;
      paint(t);
      rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduced) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    resize();
    window.addEventListener("resize", function () {
      resize();
      if (!running) paint(0);
    });

    if (reduced) {
      paint(0); // um quadro estático: a atmosfera fica, o movimento sai
    } else if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }).observe(canvas);
    } else {
      start();
    }

    return { drift: drift };
  }

  var orbField = null;
  var heroCanvas = $("#hero-canvas");
  if (heroCanvas) orbField = createOrbField(heroCanvas, isNarrow ? 2 : 3);

  /* ─── Matemática de envelope (técnica da referência Aurelia) ───────────── */
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
  /** Rampa 0→1 entre start e end. */
  function segment(p, start, end) { return smoothstep(start, end, p); }
  /** Envelope entra-e-sai: 0 fora de [start,end], 1 no pico. */
  function range(p, start, peak, end) {
    if (p <= start || p >= end) return 0;
    if (p < peak) return smoothstep(start, peak, p);
    return 1 - smoothstep(peak, end, p);
  }

  /* Estado publicado para o módulo 3D (hero-3d.js) ler a cada frame. */
  var narrative = (window.__heroNarrative = {
    active: false,
    p: 0,
    v: 0,
    scatter: 0,
    impact: 0,
  });

  /* ─── Hero: motor cinematográfico ───────────────────────────────────────
     Um único progresso suavizado por lerp move câmera, névoa, luz, capítulos,
     HUD e o teclado 3D. Sem GSAP e sem pin: sticky + rAF, como na referência. */
  var hero = $(".hero");
  var heroTrack = $(".hero__track");
  var chapters = $$(".hero-chapter");
  var cinematic = hero && heroTrack && chapters.length && !reduced && !isNarrow;

  /* Cada capítulo: quando entra e quando sai, em fração do progresso. */
  var SCENES = [
    { inFrom: null, inTo: null, outFrom: 0.10, outTo: 0.24, num: "01", label: "A assinatura" },
    { inFrom: 0.20, inTo: 0.32, outFrom: 0.38, outTo: 0.50, num: "02", label: "A origem" },
    { inFrom: 0.46, inTo: 0.58, outFrom: 0.62, outTo: 0.72, num: "03", label: "A virada" },
    { inFrom: 0.74, inTo: 0.90, outFrom: null, outTo: null, num: "04", label: "O hoje" },
  ];
  var WORD_STAGGER = 0.055;

  function splitWords(el) {
    if (!el) return [];
    if (!hasSplit) return [el];
    try {
      return new SplitText(el, { type: "words", wordsClass: "w" }).words;
    } catch (err) {
      return [el];
    }
  }

  /**
   * Entrada do capítulo I no load. Em aba de fundo o rAF congela — animar ali
   * deixaria o texto invisível até o foco voltar; então espera a visibilidade.
   */
  function playFirstChapter(words, dir) {
    if (!words.length || !hasGSAP) return;
    var played = false;
    function play() {
      if (played) return;
      played = true;
      gsap.fromTo(words,
        { xPercent: dir * 110, opacity: 0 },
        { xPercent: 0, opacity: 1, stagger: 0.08, duration: 1.1, ease: EASE.gesture, delay: 0.35 });
    }
    if (document.visibilityState === "visible") { play(); return; }
    document.addEventListener("visibilitychange", function onVis() {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVis);
      play();
    });
  }

  function buildHeroCinematic() {
    var rig = $(".hero__rig");
    var bgImage = $(".hero__bg-image");
    var bg = $(".hero__bg");
    var light = $(".hero__light");
    var rays = $(".hero__rays");
    var fogBack = $(".hero__fog--back");
    var fogFront = $(".hero__fog--front");
    var flash = $(".hero__flash");
    var cue = $(".hero__cue");
    var hudBar = $("#hero-hud-bar");
    var hudNum = $("#hero-hud-chapter");
    var hudLabel = $("#hero-hud-label");

    var restStrokePath = $(".hero-chapter--rest .sig-stroke path");
    var restMark = $(".hero-chapter--rest [data-mark]");
    var STROKE_LEN = 320;

    var scenes = chapters.map(function (ch, i) {
      return {
        el: ch,
        inner: ch.firstElementChild || ch,
        words: ch.hasAttribute("data-chapter") && $("[data-split]", ch)
          ? splitWords($("[data-split]", ch))
          : [],
        cfg: SCENES[i] || SCENES[SCENES.length - 1],
        rest: ch.classList.contains("hero-chapter--rest"),
        side: ch.dataset.side || (i % 2 === 0 ? "left" : "right"),
        hasSide: !!ch.dataset.side,
      };
    });

    playFirstChapter(scenes[0].words, scenes[0].side === "right" ? 1 : -1);
    var firstChapterFreed = false;

    var target = 0, smooth = 0, lastP = 0, vel = 0;
    var lastHud = -1;
    var lastTime = 0;
    /* Suavização por tempo, não por frame: um lerp fixo de 0.075 por frame faz
       a narrativa correr ~2x mais rápido em tela de 120 Hz que em 60 Hz.
       Taxas equivalentes ao 0.075 / 0.12 por frame a 60 fps. */
    var SMOOTH_RATE = 4.7;
    var VEL_RATE = 7.7;

    function updateTarget() {
      var rect = heroTrack.getBoundingClientRect();
      var distance = heroTrack.offsetHeight - window.innerHeight;
      target = clamp(-rect.top / Math.max(distance, 1));
    }

    /** Palavras deslizam lateralmente — do lado do capítulo para dentro, e seguem
        para o mesmo lado ao sair — com stagger derivado do próprio progresso. */
    function writeWords(scene, inAmt, outAmt) {
      var words = scene.words;
      var n = words.length;
      if (!n) return;
      var span = 1 + n * WORD_STAGGER;
      var dir = scene.side === "right" ? 1 : -1;
      for (var i = 0; i < n; i++) {
        var enter = clamp(inAmt * span - i * WORD_STAGGER);
        var exit = clamp(outAmt * span - (n - 1 - i) * WORD_STAGGER);
        var x = dir * (mix(70, 0, enter) + exit * 60);
        var o = enter * (1 - exit);
        var w = words[i];
        w.style.opacity = o;
        w.style.transform = "translate3d(" + x.toFixed(2) + "%,0,0)";
      }
    }

    function frame(time) {
      var dt = lastTime ? Math.min((time - lastTime) / 1000, 0.25) : 1 / 60;
      lastTime = time;

      smooth += (target - smooth) * (1 - Math.exp(-SMOOTH_RATE * dt));
      vel += ((smooth - lastP) - vel) * (1 - Math.exp(-VEL_RATE * dt));
      lastP = smooth;

      var p = clamp(smooth);

      /* Beats da narrativa */
      var impact = range(p, 0.63, 0.665, 0.71);
      var finalIn = segment(p, 0.74, 0.90);
      var endingDim = segment(p, 0.95, 1);
      /* O teclado se espalha pelos capítulos e se remonta no impacto — o kata:
         repetir até restar só o movimento certo. */
      var scatter = range(p, 0.12, 0.40, 0.665);

      /* Câmera — a cada troca de capítulo a cena inteira (teclado + luz + névoa)
         desliza para o lado, como na referência: o texto não é o único a se
         mover, a imagem de fundo "empurra" com ele. */
      var camX =
        mix(0, -2.6, segment(p, 0.06, 0.30)) +
        mix(0, 5.2, segment(p, 0.30, 0.55)) -
        mix(0, 3.0, segment(p, 0.62, 0.86));
      var camY =
        mix(1.0, -1.8, segment(p, 0, 0.35)) +
        mix(0, 3.2, segment(p, 0.38, 0.64)) -
        mix(0, 2.0, segment(p, 0.72, 1));
      var camScale =
        1.02 +
        segment(p, 0, 0.22) * 0.09 -
        segment(p, 0.22, 0.43) * 0.05 +
        segment(p, 0.43, 0.63) * 0.15 -
        segment(p, 0.65, 0.84) * 0.09 +
        segment(p, 0.84, 1) * 0.06;
      var camRot =
        mix(-0.35, 0.65, segment(p, 0, 0.38)) -
        mix(0, 1.05, segment(p, 0.38, 0.68)) +
        mix(0, 0.6, segment(p, 0.68, 1));

      var shake = impact * 0.28;
      var shakeX = Math.sin(p * 920) * shake;
      var shakeY = Math.cos(p * 760) * shake * 0.65;

      if (rig) {
        rig.style.transform =
          "translate3d(" + (camX + shakeX).toFixed(3) + "%," + (camY + shakeY).toFixed(3) + "%,0) scale(" +
          camScale.toFixed(4) + ") rotate(" + camRot.toFixed(3) + "deg)";
      }
      /* Camada extra: o "chacoalhar" fino de velocidade, por cima do pan da
         câmera — dá o mesmo respiro rápido do vídeo na referência quando o
         usuário arremessa o scroll. */
      if (bg) {
        var velBlur = Math.min(Math.abs(vel) * 140, 2.2);
        bg.style.transform =
          "translate3d(" + (vel * -60).toFixed(2) + "px," + (vel * 30).toFixed(2) + "px,0) scale(" +
          (1.04 + Math.abs(vel) * 3).toFixed(4) + ")";
        bg.style.filter = velBlur > 0.02 ? "blur(" + velBlur.toFixed(2) + "px)" : "";
      }
      if (light) {
        light.style.transform = "translate3d(" + mix(-6, 9, p).toFixed(2) + "%," + mix(4, -5, p).toFixed(2) + "%,0) scale(" + (1 + p * 0.15).toFixed(3) + ")";
        light.style.opacity = (0.3 + impact * 0.3 + finalIn * 0.18 - endingDim * 0.15).toFixed(3);
      }
      if (rays) {
        rays.style.transform = "translate3d(" + mix(-5, 8, p).toFixed(2) + "%," + mix(3, -4, p).toFixed(2) + "%,0) rotate(" + mix(-6, 4, p).toFixed(2) + "deg)";
        rays.style.opacity = (0.1 + segment(p, 0.2, 0.6) * 0.16 + impact * 0.2).toFixed(3);
      }
      if (fogBack) {
        fogBack.style.transform = "translate3d(" + mix(-7, 7, p).toFixed(2) + "%," + mix(6, -6, p).toFixed(2) + "%,0) scale(" + (1.15 + p * 0.15).toFixed(3) + ")";
      }
      if (fogFront) {
        fogFront.style.transform = "translate3d(" + mix(10, -9, p).toFixed(2) + "%," + mix(7, -4, p).toFixed(2) + "%,0) scale(" + (1.2 + p * 0.2).toFixed(3) + ")";
        fogFront.style.opacity = (0.22 + segment(p, 0.4, 0.8) * 0.2 + finalIn * 0.1).toFixed(3);
      }
      if (flash) flash.style.opacity = (range(p, 0.645, 0.665, 0.695) * 0.42).toFixed(3);
      if (cue) cue.style.opacity = (1 - segment(p, 0.02, 0.1)).toFixed(3);
      if (hudBar) hudBar.style.transform = "scaleX(" + p.toFixed(4) + ")";

      /* Capítulos */
      var bgSideShift = 0, bgSidedPresence = 0;
      for (var i = 0; i < scenes.length; i++) {
        var s = scenes[i];
        var cfg = s.cfg;
        var inAmt = cfg.inFrom === null ? 1 : segment(p, cfg.inFrom, cfg.inTo);
        var outAmt = cfg.outFrom === null ? 0 : segment(p, cfg.outFrom, cfg.outTo);
        var vis = inAmt * (1 - outAmt);

        /* Fundo acompanha os capítulos alternados: o texto da esquerda entra
           puxando o fundo para a direita, e vice-versa — mesmo gesto de
           "empurrar para o lado" da referência docs/aurelia-studios-72.aura.build,
           aplicado à imagem de textura em vez do vídeo. Capítulos centrais
           (assinatura/leitor) não têm lado, então o fundo recentra entre eles. */
        if (s.hasSide) {
          var sideDir = s.side === "right" ? 1 : -1;
          bgSideShift += -sideDir * vis;
          bgSidedPresence += vis;
        }

        s.el.style.opacity = vis.toFixed(3);
        s.el.style.visibility = vis < 0.002 ? "hidden" : "visible";
        if (vis < 0.002) continue;

        var blur = (mix(0.55, 0, inAmt) + outAmt * 0.5).toFixed(3);
        var lift = mix(2.2, 0, inAmt) - outAmt * 7;
        var sc = mix(0.94, 1, inAmt) + outAmt * 0.06;
        s.inner.style.transform = "translate3d(0," + lift.toFixed(3) + "rem,0) scale(" + sc.toFixed(4) + ")";
        s.inner.style.filter = "blur(" + blur + "rem)";

        if (i === 0) {
          /* O capítulo I entra por GSAP no load; o scroll só comanda a saída. */
          if (outAmt > 0.001) {
            if (!firstChapterFreed) {
              firstChapterFreed = true;
              gsap.killTweensOf(s.words);
            }
            writeWords(s, 1, outAmt);
          }
        } else if (!s.rest) {
          writeWords(s, inAmt, outAmt);
        }
      }

      if (bgImage) {
        /* Fixa e fora do .hero, fica visível só enquanto a dobra do hero
           está em tela — senão vazaria por trás das seções seguintes. */
        var heroVisible = heroTrack.getBoundingClientRect().bottom > 0;
        if (heroVisible) {
          var bgPresence = clamp(bgSidedPresence, 0, 1);
          var bgX = clamp(bgSideShift, -1, 1) * 6.5;
          var bgY = mix(-1.4, 1.8, p);
          var bgScale = 1.07 + bgPresence * 0.05;
          bgImage.style.transform =
            "translate3d(" + bgX.toFixed(2) + "%," + bgY.toFixed(2) + "%,0) scale(" + bgScale.toFixed(4) + ")";
          bgImage.style.opacity = (0.32 + bgPresence * 0.24).toFixed(3);
        } else {
          bgImage.style.opacity = 0;
        }
      }

      /* Assinatura: a pincelada âmbar se desenha e o grifo acende logo na
         entrada, já que a assinatura agora é o primeiro capítulo. */
      if (restStrokePath) {
        restStrokePath.style.strokeDashoffset = (STROKE_LEN * (1 - segment(p, 0, 0.08))).toFixed(2);
      }
      if (restMark) {
        restMark.style.backgroundSize = (segment(p, 0.02, 0.10) * 100).toFixed(2) + "% 0.62em";
      }

      /* HUD — capítulo corrente */
      var hudIdx = p < 0.22 ? 0 : p < 0.46 ? 1 : p < 0.72 ? 2 : 3;
      if (hudIdx !== lastHud) {
        lastHud = hudIdx;
        if (hudNum) hudNum.textContent = SCENES[hudIdx].num;
        if (hudLabel) hudLabel.textContent = SCENES[hudIdx].label;
      }

      /* Publica para o teclado 3D */
      narrative.p = p;
      narrative.v = vel;
      narrative.scatter = scatter;
      narrative.impact = impact;
      narrative.active = p < 0.999;

      /* Orbes acompanham a câmera */
      if (orbField) {
        orbField.drift.x = mix(0, 0.14, segment(p, 0.1, 0.5)) - mix(0, 0.2, segment(p, 0.5, 0.95));
        orbField.drift.y = mix(0, -0.08, segment(p, 0, 0.4)) + mix(0, 0.12, segment(p, 0.6, 1));
      }

      requestAnimationFrame(frame);
    }

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget);
    updateTarget();
    requestAnimationFrame(frame);
  }

  /**
   * Hero em fluxo (mobile / sem palco sticky): sem câmera nem teclado 3D, mas
   * a mesma ideia narrativa do desktop — cada capítulo aparece e some conforme
   * o scroll, um de cada vez. Em vez do motor por-frame (buildHeroCinematic),
   * cada capítulo ganha seu próprio ScrollTrigger com scrub: a opacidade,
   * o deslocamento e o desfoque ficam amarrados à posição do scroll, então o
   * gesto acompanha o dedo do usuário (para frente e para trás) em vez de
   * disparar uma vez só.
   */
  function buildHeroFlow() {
    if (!hero) return;
    hero.classList.add("is-flow");
    chapters.forEach(function (ch) { ch.style.opacity = "1"; });
    if (!hasST || reduced) return;

    /* Um único tween por capítulo, guiado por keyframes % e escrubado pelo
       próprio ScrollTrigger. Importante: cada capítulo usa só UM tween para
       toda a jornada (entra → mantém → sai) — dois tweens independentes
       disputando as mesmas propriedades (opacity/y/filter) no mesmo elemento
       se pisam (o segundo sempre assume o controle assim que é criado),
       então a saída "engolia" a entrada antes mesmo do scroll começar. */
    chapters.forEach(function (ch) {
      var inner = ch.firstElementChild || ch;
      var isRest = ch.classList.contains("hero-chapter--rest");
      var isLast = !isRest && !ch.dataset.side;

      if (isRest) {
        /* Assinatura: já nasce visível na primeira dobra (o "pop" de entrada
           é só CSS, ver .hero-chapter--rest > div em ds.css) — aqui só a
           saída, amarrada à base do capítulo para começar a esmaecer assim
           que o scroll começa. */
        gsap.to(inner, {
          ease: "power1.in",
          keyframes: {
            "0%":   { y: 0,   opacity: 1, filter: "blur(0px)" },
            "100%": { y: -26, opacity: 0, filter: "blur(6px)" },
          },
          scrollTrigger: { trigger: ch, start: "bottom 95%", end: "bottom 45%", scrub: 0.3 },
        });
        var restStroke = $(".sig-stroke", ch);
        if (restStroke) restStroke.classList.add("is-drawn");
        return;
      }

      /* Capítulos I e II: entra, mantém-se legível, sai — o mesmo envelope
         "entra-mantém-sai" da narrativa desktop (ver range() acima). Janela
         generosa (center 97%→3%) para que a entrada de um capítulo já se
         sobreponha à saída do anterior, sem vão em branco no meio. Usa o
         CENTRO do capítulo como referência, não o topo: como cada capítulo é
         uma caixa alta (min-height) com o texto centralizado por flex (ver
         ds.css), o texto vive no meio da caixa — amarrar ao topo faria a
         entrada disparar bem antes de o texto (centralizado, bem mais abaixo)
         sequer entrar na tela.
         Capítulo III (o hoje) fecha a sequência: só entra e permanece — como
         no desktop (SCENES[3] não tem outFrom/outTo), a cena final não some
         antes da dobra do hero acabar. */
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

  if (cinematic) buildHeroCinematic();
  else buildHeroFlow();

  /* ─── Revelações de entrada ────────────────────────────────────────────── */
  var reveals = $$("[data-reveal]");
  if (hasST && !reduced) {
    reveals.forEach(function (el) {
      gsap.to(el, {
        y: 0, opacity: 1, duration: 0.8, ease: EASE.gesture,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });
  } else {
    reveals.forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  /* ─── Réguas de cabeçalho de seção ─────────────────────────────────────── */
  if (hasST && !reduced) {
    $$("[data-rule]").forEach(function (rule) {
      gsap.fromTo(rule, { scaleX: 0 }, {
        scaleX: 1, duration: 1.1, ease: EASE.gesture,
        scrollTrigger: { trigger: rule, start: "top 92%", once: true },
      });
    });
  }

  /* ─── Grifo âmbar: o marca-texto lendo junto ───────────────────────────── */
  if ("IntersectionObserver" in window) {
    var markObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-marked");
        markObserver.unobserve(e.target);
      });
    }, { threshold: 0.9 });
    $$("[data-mark]").forEach(function (m) { markObserver.observe(m); });
  } else {
    $$("[data-mark]").forEach(function (m) { m.classList.add("is-marked"); });
  }

  /* ─── Pinceladas-assinatura fora do hero ──────────────────────────────── */
  if ("IntersectionObserver" in window) {
    var strokeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-drawn");
        strokeObserver.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    $$(".cases__closing .sig-stroke, .manifesto__cite-stroke").forEach(function (s) { strokeObserver.observe(s); });
  }

  /* ─── Manifesto: aspas decorativa entra antes da citação, girando e
     encaixando no lugar — a assinatura visual da seção 100% âmbar. ──────── */
  var manifestoMark = $(".manifesto__mark");
  if (manifestoMark && hasST && !reduced) {
    gsap.to(manifestoMark, {
      opacity: 0.4, scale: 1, rotate: 0, duration: 1.3, ease: EASE.settle,
      scrollTrigger: { trigger: manifestoMark, start: "top 88%", once: true },
    });
  }

  /* ─── Manifesto: a citação entra palavra por palavra, com um leve
     desfoque que resolve em foco — mais cinematográfico que um fade puro. */
  var quote = $("[data-quote]");
  if (quote && hasST) {
    if (hasSplit && !reduced) {
      var qWords = splitWords(quote);
      gsap.fromTo(qWords,
        { yPercent: 110, opacity: 0, filter: "blur(10px)" },
        {
          yPercent: 0, opacity: 1, filter: "blur(0px)", stagger: 0.07, duration: 1.1, ease: EASE.gesture,
          scrollTrigger: { trigger: quote, start: "top 78%", once: true },
        });
    } else if (!reduced) {
      gsap.from(quote, {
        opacity: 0, y: 24, duration: 0.9, ease: EASE.gesture,
        scrollTrigger: { trigger: quote, start: "top 78%", once: true },
      });
    }
  }

  /* ─── Habilidades: a constelação ───────────────────────────────────────
     Liga os números 01 → 02 → 03 com uma curva que se desenha no scroll. */
  function initConstellation() {
    var wrapper = $("#skills-path-wrapper");
    var svg = $("#skills-svg");
    if (!wrapper || !svg || isNarrow) return;

    var nums = $$(".skill-node__num", wrapper);
    if (nums.length < 2) return;

    var path = null;
    var tip = null;

    // Ponta acesa que acompanha o traço enquanto ele se desenha — sem isso o
    // risco fino é fácil de nem notar entre os nós.
    function syncTip(len) {
      if (!tip) return;
      var offset = parseFloat(path.style.strokeDashoffset) || 0;
      var drawn = Math.max(0, Math.min(len, len - offset));
      var p = path.getPointAtLength(drawn);
      tip.setAttribute("cx", p.x);
      tip.setAttribute("cy", p.y);
      tip.classList.toggle("is-active", drawn > 1 && drawn < len - 1);
    }

    function build() {
      var box = wrapper.getBoundingClientRect();
      svg.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
      svg.setAttribute("width", box.width);
      svg.setAttribute("height", box.height);

      var pts = nums.map(function (n) {
        var r = n.getBoundingClientRect();
        return {
          x: r.left - box.left + r.width / 2,
          y: r.top - box.top + r.height / 2,
        };
      });

      var d = "M " + pts[0].x + " " + pts[0].y;
      for (var i = 1; i < pts.length; i++) {
        var prev = pts[i - 1];
        var cur = pts[i];
        var midY = (prev.y + cur.y) / 2;
        d += " C " + prev.x + " " + midY + ", " + cur.x + " " + midY + ", " + cur.x + " " + cur.y;
      }

      if (!path) {
        path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        svg.appendChild(path);
      }
      path.setAttribute("d", d);

      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = reduced ? 0 : len;

      if (!tip) {
        tip = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        tip.setAttribute("r", "4.5");
        tip.setAttribute("class", "skills-path__tip");
        svg.appendChild(tip);
      }
      syncTip(len);
      return len;
    }

    var length = build();

    if (hasST && !reduced) {
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        onUpdate: function () { syncTip(length); },
        scrollTrigger: {
          trigger: wrapper,
          start: "top 70%",
          end: "bottom 70%",
          scrub: 0.8,
        },
      });
    }

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        length = build();
        if (hasST) ScrollTrigger.refresh();
      }, 200);
    });
  }

  /* ─── Habilidades: os blocos entram varrendo de lado, como no hero ──────
     Mesmo motivo de writeWords() em buildHeroCinematic (título em palavras,
     splitWords() reaproveitado) — só que aqui cada skill-node entra do seu
     próprio lado (data-align), não do lado de uma câmera. Isso amarra o
     bloco de texto ao resto da coreografia da dobra: o fundo (initSkillsBg)
     e o teclado 3D (hero-3d.js) já alternam direita→esquerda→direita ao
     cruzar os três blocos — o texto entrando do mesmo lado do seu bloco
     reforça esse "ir para os lados" em vez de competir com ele. No mobile
     os blocos viram coluna única (ver ds.css §22) — sem alternância, todos
     entram da esquerda. Um scrub por bloco, não um reveal único: o texto
     literalmente se monta conforme o scroll passa por ele, do mesmo jeito
     que os capítulos do hero. */
  function initSkillNodeReveals() {
    if (!hasST || reduced) return;
    $$(".skill-node").forEach(function (node) {
      var dir = !isNarrow && node.dataset.align === "right" ? 1 : -1;
      var num = $(".skill-node__num", node);
      var title = $(".skill-node__title", node);
      var lede = $(".skill-node__lede", node);
      var items = $$(".skill-item", node);
      var words = title ? splitWords(title) : [];

      var tl = gsap.timeline({
        scrollTrigger: { trigger: node, start: "top 88%", end: "top 45%", scrub: 0.7 },
      });
      if (num) tl.from(num, { x: dir * 56, opacity: 0, ease: "none", duration: 0.6 }, 0);
      if (words.length) {
        tl.from(words, { xPercent: dir * 85, opacity: 0, stagger: 0.05, ease: "none", duration: 0.6 }, 0.05);
      }
      if (lede) tl.from(lede, { x: dir * 34, opacity: 0, ease: "none", duration: 0.5 }, 0.22);
      if (items.length) {
        tl.from(items, { x: dir * 24, opacity: 0, stagger: 0.045, ease: "none", duration: 0.5 }, 0.32);
      }
    });
  }

  /* ─── Habilidades: o fundo acompanha o teclado 3D ───────────────────────
     Mesma textura do hero (.hero__bg-image), mas aqui o pan lateral não
     segue o lado do texto — segue o teclado 3D, que alterna direita →
     esquerda → direita ao cruzar os três blocos (ver hero-3d.js: pose.posX
     vai de 1.6 para -1.35 no bloco Backend, depois para 1.85 no bloco
     Ofício). Os quatro trechos abaixo reusam exatamente os mesmos gatilhos
     de scroll usados lá para o fundo ficar em sincronia com o teclado sem
     acoplar os dois arquivos. Desktop-only: o teclado 3D nem existe no
     mobile (#hero-3d-container some abaixo de 900px, ver ds.css §22). */
  function initSkillsBg() {
    if (!hasST || isNarrow || reduced) return;
    var bgImage = $(".skills__bg-image");
    var fogBack = $(".skills__fog--back");
    var light = $(".skills__light");
    var fogFront = $(".skills__fog--front");
    var vignette = $(".skills__vignette");
    var skills = $("#skills");
    var backend = $("#skills-backend");
    var outros = $("#skills-outros");
    var projects = $("#projects");
    if (!bgImage || !fogBack || !light || !fogFront || !vignette || !skills || !backend || !outros || !projects) return;

    // Entrada: acende junto com o teclado chegando pela direita (bloco I).
    gsap.fromTo(bgImage,
      { xPercent: 7, yPercent: -2, rotate: 1.4, opacity: 0, scale: 1.14 },
      { xPercent: 4.5, yPercent: -1, rotate: 0.6, opacity: 0.36, scale: 1.09,
        immediateRender: false,
        scrollTrigger: { trigger: skills, start: "top bottom", end: "top center", scrub: 1 },
      }
    );

    // Bloco II (Backend): o teclado gira e desliza para a esquerda — o fundo acompanha.
    gsap.fromTo(bgImage,
      { xPercent: 4.5, yPercent: -1, rotate: 0.6, opacity: 0.36, scale: 1.09 },
      { xPercent: -5.5, yPercent: 0.4, rotate: -1.3, opacity: 0.44, scale: 1.12,
        ease: "power2.inOut",
        immediateRender: false,
        scrollTrigger: { trigger: backend, start: "top 90%", end: "top 52%", scrub: 1.2 },
      }
    );

    // Bloco III (Ofício): o teclado sobe e desliza de volta para a direita.
    gsap.fromTo(bgImage,
      { xPercent: -5.5, yPercent: 0.4, rotate: -1.3, opacity: 0.44, scale: 1.12 },
      { xPercent: 6, yPercent: 1.6, rotate: 1.1, opacity: 0.36, scale: 1.08,
        ease: "power1.inOut",
        immediateRender: false,
        scrollTrigger: { trigger: outros, start: "top 88%", end: "top 38%", scrub: 1.1 },
      }
    );

    // Saída: apaga em bloom leve enquanto o teclado se desmonta rumo a Projetos.
    gsap.fromTo(bgImage,
      { xPercent: 6, yPercent: 1.6, rotate: 1.1, opacity: 0.36, scale: 1.08 },
      { xPercent: 6, yPercent: 1.6, rotate: 1.1, opacity: 0, scale: 1.16,
        ease: "power1.inOut",
        immediateRender: false,
        scrollTrigger: { trigger: projects, start: "top 52%", end: "top 8%", scrub: 1.2 },
      }
    );

    /* Neblina + luz: mesma lógica do rig do hero (ver frame() em
       buildHeroCinematic) — pintam translúcidas por cima do canvas 3D para
       o teclado se misturar à cena em vez de ficar "duro"/recortado. Ao
       contrário da 1ª versão (drift lento e genérico), agora seguem os
       MESMOS quatro trechos de scroll do bgImage acima — a neblina literalmente
       acompanha o teclado enquanto ele alterna de lado, então o esfumaçado
       sempre fica por cima de onde o teclado está, não só ambiente solto no
       fundo. fogFront tem a maior amplitude (mais perto da "câmera"); fogBack,
       a menor (mais atrás); light fica mais colada na posição do teclado. */
    function atmoPhase(el, from, to, trigger, start, end, scrub, ease) {
      to.ease = ease || "none";
      to.immediateRender = false;
      to.scrollTrigger = { trigger: trigger, start: start, end: end, scrub: scrub };
      gsap.fromTo(el, from, to);
    }

    atmoPhase(fogBack,
      { xPercent: 4, opacity: 0, scale: 1.1 },
      { xPercent: 2.5, opacity: 0.24, scale: 1.06 },
      skills, "top bottom", "top center", 1.3);
    atmoPhase(fogBack,
      { xPercent: 2.5, opacity: 0.24, scale: 1.06 },
      { xPercent: -6, opacity: 0.3, scale: 1.1 },
      backend, "top 90%", "top 52%", 1.5, "power2.inOut");
    atmoPhase(fogBack,
      { xPercent: -6, opacity: 0.3, scale: 1.1 },
      { xPercent: 4, opacity: 0.24, scale: 1.06 },
      outros, "top 88%", "top 38%", 1.4, "power1.inOut");
    atmoPhase(fogBack,
      { xPercent: 4, opacity: 0.24, scale: 1.06 },
      { xPercent: 4, opacity: 0, scale: 1.14 },
      projects, "top 52%", "top 8%", 1.5, "power1.inOut");

    atmoPhase(light,
      { xPercent: 3.5, opacity: 0, scale: 1.02 },
      { xPercent: 2, opacity: 0.3, scale: 1.08 },
      skills, "top bottom", "top center", 1.1);
    atmoPhase(light,
      { xPercent: 2, opacity: 0.3, scale: 1.08 },
      { xPercent: -4.5, opacity: 0.36, scale: 1.16 },
      backend, "top 90%", "top 52%", 1.3, "power2.inOut");
    atmoPhase(light,
      { xPercent: -4.5, opacity: 0.36, scale: 1.16 },
      { xPercent: 3, opacity: 0.3, scale: 1.08 },
      outros, "top 88%", "top 38%", 1.2, "power1.inOut");
    atmoPhase(light,
      { xPercent: 3, opacity: 0.3, scale: 1.08 },
      { xPercent: 3, opacity: 0, scale: 1.02 },
      projects, "top 52%", "top 8%", 1.3, "power1.inOut");

    atmoPhase(fogFront,
      { xPercent: 9, opacity: 0, scale: 1.14 },
      { xPercent: 5.5, opacity: 0.3, scale: 1.1 },
      skills, "top bottom", "top center", 1.4);
    atmoPhase(fogFront,
      { xPercent: 5.5, opacity: 0.3, scale: 1.1 },
      { xPercent: -7.5, opacity: 0.38, scale: 1.16 },
      backend, "top 90%", "top 52%", 1.6, "power2.inOut");
    atmoPhase(fogFront,
      { xPercent: -7.5, opacity: 0.38, scale: 1.16 },
      { xPercent: 8, opacity: 0.3, scale: 1.1 },
      outros, "top 88%", "top 38%", 1.5, "power1.inOut");
    atmoPhase(fogFront,
      { xPercent: 8, opacity: 0.3, scale: 1.1 },
      { xPercent: 8, opacity: 0, scale: 1.2 },
      projects, "top 52%", "top 8%", 1.6, "power1.inOut");

    /* Vinhete: só esmaece as bordas retas contra o creme da seção — não
       precisa seguir o teclado, então segue solto num scrub único. */
    gsap.to(vignette, {
      keyframes: {
        "0%":   { opacity: 0 },
        "15%":  { opacity: 0.85 },
        "88%":  { opacity: 0.85 },
        "100%": { opacity: 0 },
      },
      ease: "none",
      scrollTrigger: { trigger: skills, start: "top bottom", endTrigger: projects, end: "top 8%", scrub: 1.5 },
    });
  }

  /* ─── Dobra "fora da caixa" ───────────────────────────────────────────── */
  function initBoxFold() {
    var box = $("#box");
    if (!box || !hasST) return;

    var headline = $("#box-text");
    var moldura = $("#box-moldura");

    // Headline "desembaralha" em sincronia com o scroll: cada linha começa
    // como letras embaralhadas e vai travando na palavra real conforme a
    // seção avança pela tela — não é um reveal único, acompanha o scroll
    // (scrub) como as imagens laterais logo abaixo.
    var headlineLines = headline ? $$(".box-headline__line", headline) : [];
    if (!reduced && headline && hasScramble && headlineLines.length) {
      var scrambleTl = gsap.timeline({
        scrollTrigger: { trigger: box, start: "top bottom", end: "center center", scrub: 0.7 },
      });
      headlineLines.forEach(function (line, i) {
        scrambleTl.to(line, {
          duration: 1,
          ease: "none",
          scrambleText: {
            text: true,
            chars: "upperCase",
            speed: 0.4,
            newClass: "box-headline__char--in",
            oldClass: "box-headline__char--out",
          },
        }, i * 0.4);
      });
    } else if (!reduced && headline) {
      var chars = [headline];
      if (hasSplit) {
        try {
          chars = new SplitText(headline, { type: "chars" }).chars;
        } catch (err) { chars = [headline]; }
      }
      gsap.from(chars, {
        yPercent: 60, opacity: 0, stagger: 0.02, duration: 0.9, ease: EASE.gesture,
        scrollTrigger: { trigger: box, start: "top 65%", once: true },
      });
    }

    if (!reduced && moldura) {
      gsap.from(moldura, {
        scale: 0.94, opacity: 0, duration: 1.1, ease: EASE.settle,
        scrollTrigger: { trigger: box, start: "top 70%", once: true },
      });
    }

    // Imagens laterais: só desktop (no mobile são display:none).
    if (isNarrow || reduced) return;

    var left = $("#box-left-img");
    var right = $("#box-right-img");
    var icaro = $("#box-icaro");

    if (left) {
      gsap.set(left, { yPercent: -50 });
      gsap.fromTo(left, { xPercent: -34, opacity: 0 }, {
        xPercent: 0, opacity: 1, ease: "none",
        scrollTrigger: { trigger: box, start: "top bottom", end: "center center", scrub: 0.7 },
      });
    }
    if (right) {
      gsap.set(right, { yPercent: -50 });
      gsap.fromTo(right, { xPercent: 42, opacity: 0 }, {
        xPercent: 0, opacity: 1, ease: "none",
        scrollTrigger: { trigger: box, start: "top bottom", end: "center center", scrub: 0.7 },
      });
    }
    if (icaro) {
      gsap.fromTo(icaro, { yPercent: 40, opacity: 0 }, {
        yPercent: -50, opacity: 1, ease: "none",
        scrollTrigger: { trigger: box, start: "top 75%", end: "bottom bottom", scrub: 0.7 },
      });
    }
  }

  /* ─── Navegação interna: transição em tela cheia ao sair pra outra página ─
     Efeito "wipe" (.case-wipe no ds.css): um círculo cresce a partir do
     ponto clicado até cobrir a tela inteira, e só então a navegação acontece —
     a troca de página fica encoberta, sem o "flash" branco do load. Aqui
     não há transição de volta (a página está saindo), então o círculo só
     cresce; ele desaparece sozinho junto com o documento antigo. Cliques
     que abririam nova aba (meio-clique, ctrl/cmd/shift) ficam de fora —
     o navegador cuida deles sozinho, sem o wipe.
     Selector por href (não por classe): pega tanto os cards de .work-row
     quanto os links de rodapé que apontam pras mesmas páginas — qualquer
     CTA que leve a outra página do site entra automaticamente, sem
     precisar lembrar de marcar cada um. */
  (function initInternalLinkWipe() {
    var wipeEl = $("#page-wipe");
    var links = $$('a[href$=".html"]');
    if (!wipeEl || !links.length) return;

    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var href = link.getAttribute("href");
        if (!href) return;

        if (!hasGSAP || reduced) return;

        e.preventDefault();

        var cx = e.clientX;
        var cy = e.clientY;
        var base = wipeEl.offsetWidth || 40;
        var farX = Math.max(cx, window.innerWidth - cx);
        var farY = Math.max(cy, window.innerHeight - cy);
        var radius = Math.hypot(farX, farY) * 1.06;
        var scale = (radius * 2) / base;

        gsap.set(wipeEl, { left: cx, top: cy, scale: 0, opacity: 1 });
        gsap.to(wipeEl, {
          scale: scale,
          duration: 0.32,
          ease: "power2.in",
          onComplete: function () { window.location.href = href; },
        });
      });
    });

    /* Ao sair, a página fica congelada com o círculo cobrindo a tela
       inteira — é assim que o wipe encobre a troca de documento (o
       onComplete acima navega no exato instante em que o círculo termina
       de crescer). Se o usuário volta pelo botão "voltar" do navegador, o
       Chrome/Firefox costumam restaurar essa página via bfcache — o
       snapshot congelado no estado em que ficou, círculo âmbar cobrindo
       tudo incluso — em vez de recarregar do zero. Sem reload, nenhum
       script roda de novo pra desfazer aquele estado, e o círculo fica
       preso. "pageshow" com persisted:true é o sinal de que a página
       voltou do bfcache (não de um load novo); ali dá pra devolver o
       wipe ao repouso antes do usuário ver o frame congelado. */
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      if (hasGSAP) gsap.set(wipeEl, { scale: 0, opacity: 1 });
      else wipeEl.style.transform = "scale(0)";
    });
  })();

  /* ─── Navbar: estado no topo vs. rolada ───────────────────────────────── */
  var navbar = $("#navbar");
  if (navbar) {
    var lastScrolled = null;
    var onScrollNav = function () {
      var scrolled = window.scrollY > 40;
      if (scrolled === lastScrolled) return;
      lastScrolled = scrolled;
      navbar.classList.toggle("is-scrolled", scrolled);
    };
    window.addEventListener("scroll", onScrollNav, { passive: true });
    onScrollNav();
  }

  /* ─── Menu mobile: foco preso, Esc fecha, scroll travado ──────────────── */
  (function initMobileMenu() {
    var menu = $("#mobileMenu");
    var openBtn = $("#menu-open");
    var closeBtn = $("#menu-close");
    if (!menu || !openBtn) return;

    var lastFocus = null;

    function focusables() {
      // offsetParent é null dentro de container position:fixed — usar
      // getClientRects() é o teste de visibilidade que funciona aqui.
      return $$("a[href], button", menu).filter(function (el) {
        return el.getClientRects().length > 0;
      });
    }

    function onKeydown(e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }

    function open() {
      lastFocus = document.activeElement;
      menu.classList.add("is-open");
      openBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
      document.addEventListener("keydown", onKeydown);
      var items = focusables();
      if (items.length) items[0].focus();
    }

    function close() {
      menu.classList.remove("is-open");
      openBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      if (lenis) lenis.start();
      document.removeEventListener("keydown", onKeydown);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    $$("[data-menu-link]", menu).forEach(function (link) {
      link.addEventListener("click", close);
    });
    if (mqNarrow && mqNarrow.addEventListener) {
      mqNarrow.addEventListener("change", function (e) {
        if (!e.matches && menu.classList.contains("is-open")) close();
      });
    }
  })();

  /* ─── Lightbox: fotos da timeline "Sobre mim" expandem em tela cheia ──── */
  (function initAboutLightbox() {
    var track = $("#about-scroll-track");
    var lightbox = $("#about-lightbox");
    var lightboxImg = $("#about-lightbox-img");
    var closeBtn = $("#about-lightbox-close");
    if (!track || !lightbox || !lightboxImg) return;

    var lastFocus = null;

    function onKeydown(e) {
      if (e.key === "Escape") close();
    }

    function open(img) {
      lastFocus = document.activeElement;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
      document.addEventListener("keydown", onKeydown);
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lenis) lenis.start();
      document.removeEventListener("keydown", onKeydown);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    track.addEventListener("click", function (e) {
      var img = e.target.closest && e.target.closest(".about__portrait img");
      if (!img) return;
      open(img);
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
  })();

  /* ─── Cursor custom: ponto firme + anel que respira atrás ─────────────── */
  (function initCursor() {
    var dot = $("#cursor-dot");
    var ring = $("#cursor-ring");
    if (!dot || !ring) return;

    var fine = !!(mqFinePointer && mqFinePointer.matches);
    if (!fine || reduced || !hasGSAP) {
      dot.remove();
      ring.remove();
      return;
    }

    document.body.classList.add("has-custom-cursor");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, scale: 1 });

    var dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
    var dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });
    var ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: EASE.gesture });
    var ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: EASE.gesture });
    var visible = false;

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.2, overwrite: "auto" });
      }
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    }, { passive: true });

    document.addEventListener("mouseleave", function () {
      visible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.25, overwrite: "auto" });
    });

    /* Feedback de hover sobre algo clicável: o anel cresce devagar e fica
       "respirando" (loop lento, mesmo espírito de --ease-breath usado em
       outros elementos vivos do site — ver .badge__dot--pulse, .hero__cue).
       Controlado por aqui (não por CSS) porque o GSAP já é dono do
       `transform` do anel via quickTo acima — uma transição CSS na mesma
       propriedade brigaria com ele e seria sobrescrita a cada pointermove. */
    var hoverBreath = null;
    var isHoveringInteractive = false;

    function startHoverBreath() {
      if (hoverBreath) hoverBreath.kill();
      hoverBreath = gsap.timeline({ defaults: { overwrite: "auto" } })
        .to(ring, { scale: 1.8, duration: 0.5, ease: EASE.gesture })
        .to(ring, { scale: 2.05, duration: 1.3, ease: EASE.breath, yoyo: true, repeat: -1 });
    }
    function stopHoverBreath(targetScale) {
      if (hoverBreath) { hoverBreath.kill(); hoverBreath = null; }
      gsap.to(ring, { scale: targetScale, duration: 0.4, ease: EASE.gesture, overwrite: "auto" });
    }

    var INTERACTIVE = "a, button, input, textarea, select, label, [role='button']";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest(INTERACTIVE)) {
        document.body.classList.add("is-cursor-hover");
        isHoveringInteractive = true;
        startHoverBreath();
      }
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest(INTERACTIVE)) {
        document.body.classList.remove("is-cursor-hover");
        isHoveringInteractive = false;
        stopHoverBreath(1);
      }
    });
    window.addEventListener("pointerdown", function () {
      document.body.classList.add("is-cursor-down");
      if (hoverBreath) hoverBreath.kill();
      gsap.to(ring, { scale: isHoveringInteractive ? 1.5 : 0.85, duration: 0.15, ease: "power2.out", overwrite: "auto" });
    });
    window.addEventListener("pointerup", function () {
      document.body.classList.remove("is-cursor-down");
      if (isHoveringInteractive) startHoverBreath();
      else gsap.to(ring, { scale: 1, duration: 0.3, ease: EASE.gesture, overwrite: "auto" });
    });
  })();

  /* ─── Sobre mim: painéis em scroll horizontal ──────────────────────────
     Desktop: a seção fica pinada e os painéis deslizam na horizontal
     conforme o usuário rola a página; cada painel entra animado.
     Mobile / prefers-reduced-motion: pilha vertical simples, sem pin. */
  function initAboutScroll() {
    var section = $(".about-scroll");
    var pin = $("#about-scroll-pin");
    var track = $("#about-scroll-track");
    if (!section || !pin || !track) return;

    var panels = $$("[data-panel]", track);

    if (!hasST || isNarrow || reduced) {
      panels.forEach(function (panel) {
        var media = $(".about-panel__media", panel);
        var text = $(".about-panel__text", panel);
        if (hasST && !reduced) {
          [media, text].forEach(function (el, i) {
            if (!el) return;
            gsap.fromTo(el, { y: 28, opacity: 0 }, {
              y: 0, opacity: 1, duration: 0.8, delay: i * 0.08, ease: EASE.gesture,
              scrollTrigger: { trigger: panel, start: "top 82%", once: true },
            });
          });
        }
      });

      // Mobile: versão simples da linha torta, vertical e sem pin — só
      // desenha conforme a seção passa pela tela, acompanhando a leitura
      // de cima para baixo em vez de deslizar na horizontal.
      if (isNarrow && hasST && !reduced) {
        var curveMobile = $(".about-curve-path--mobile", pin);
        if (curveMobile) {
          var mobileCurveLen = curveMobile.getTotalLength();
          curveMobile.style.strokeDasharray = mobileCurveLen;
          curveMobile.style.strokeDashoffset = mobileCurveLen;
          gsap.to(curveMobile, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: track,
              start: "top 85%",
              end: "bottom 15%",
              scrub: 0.6,
            },
          });
        }
      }
      return;
    }

    section.classList.add("is-horizontal");

    // Linha torta ao fundo: pinada junto com a seção, sua curva principal
    // se desenha conforme o scroll avança pelos três atos — "a vida segue
    // suas próprias linhas tortas". A linha de fundo fica sempre visível,
    // discreta, só para preencher o espaço atrás dos painéis.
    var curveMain = $(".about-curve-path--main", pin);
    var curveLen = 0;
    if (curveMain) {
      curveLen = curveMain.getTotalLength();
      curveMain.style.strokeDasharray = curveLen;
      curveMain.style.strokeDashoffset = curveLen;
    }

    function scrollAmount() {
      var base = Math.max(0, track.scrollWidth - pin.clientWidth);
      // Um pouco de scroll extra no final: sem isso o último ato para com a
      // borda do track encostada na borda da tela, longe do centro.
      var extra = pin.clientWidth * 0.16;
      return base + extra;
    }

    var mediaEls = panels.map(function (panel) { return $(".about-panel__media", panel); });
    var textEls = panels.map(function (panel) { return $(".about-panel__text", panel); });
    // Um tilt de base por ato — a variação assimétrica evita o efeito
    // "espelhado engessado" de painéis idênticos alternando de lado.
    var baseRotate = [-2.5, 2, -1.5];
    panels.forEach(function (panel, i) {
      gsap.set(mediaEls[i], { rotateZ: baseRotate[i] });
    });

    // HUD + marcador lateral: refletem qual ato está mais perto do centro do
    // pin e o progresso geral do scroll horizontal — mesmo padrão do
    // hero__hud, aplicado aqui para preencher o pin sem competir com a curva.
    var hudChapter = $("#about-hud-chapter", pin);
    var hudLabel = $("#about-hud-label", pin);
    var hudBar = $("#about-hud-bar", pin);
    var stepperItems = $$(".about-stepper__item", pin);
    var ACT_ROMAN = ["I", "II", "III"];
    var ACT_LABEL = ["A origem", "A virada", "O hoje"];
    var lastActive = -1;

    function updateHud(overallProgress) {
      var rect = pin.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var best = 0, bestDist = Infinity;
      panels.forEach(function (panel, i) {
        var pr = panel.getBoundingClientRect();
        var dist = Math.abs((pr.left + pr.width / 2) - centerX);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      if (best !== lastActive) {
        lastActive = best;
        if (hudChapter) hudChapter.textContent = ACT_ROMAN[best];
        if (hudLabel) hudLabel.textContent = ACT_LABEL[best];
        stepperItems.forEach(function (el, i) {
          el.classList.toggle("is-active", i === best);
        });
      }
      if (hudBar) hudBar.style.transform = "scaleX(" + clamp(overallProgress, 0, 1) + ")";
    }

    // Parallax contínuo: imagem e texto se movem em velocidades, direções e
    // rotações diferentes conforme o painel atravessa o centro da tela — o
    // gesto não é só "aparecer uma vez", ele acompanha o scroll o tempo todo.
    // Só mexe em xPercent/rotateZ (nunca opacity/y/scale, que pertencem à
    // entrada) para não competir com o tween de revealPanel.
    function applyParallax() {
      var rect = pin.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var span = Math.max(1, rect.width * 0.65);
      panels.forEach(function (panel, i) {
        var pr = panel.getBoundingClientRect();
        var panelCenter = pr.left + pr.width / 2;
        var progress = gsap.utils.clamp(-1, 1, (panelCenter - centerX) / span);
        gsap.set(mediaEls[i], {
          xPercent: progress * -11,
          rotateZ: baseRotate[i] + progress * 7,
        });
        gsap.set(textEls[i], {
          xPercent: progress * 5,
          yPercent: progress * -3,
        });
      });
    }

    function onScrub(self) {
      applyParallax();
      var progress = self && typeof self.progress === "number" ? self.progress : 0;
      updateHud(progress);
      if (curveMain && curveLen) {
        // Leve adiantamento: a curva termina de se desenhar um pouco antes
        // do fim do scroll, para o traço já estar completo quando o último
        // ato chega ao centro, em vez de ainda estar "chegando".
        var grown = clamp(progress * 1.12, 0, 1);
        curveMain.style.strokeDashoffset = curveLen * (1 - grown);
      }
    }

    gsap.to(track, {
      x: function () { return -scrollAmount(); },
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: function () { return "+=" + scrollAmount(); },
        scrub: 0.6,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: onScrub,
        onRefresh: onScrub,
      },
    });

    onScrub();
  }
  // Ordem importa: ScrollTrigger recalcula posições na ordem de registro dos
  // triggers, não na ordem do DOM. Como o pin do "Sobre mim" reserva espaço de
  // scroll extra, ele precisa ser criado antes dos triggers de #box e #skills
  // (que vêm depois dele na página) — senão eles ficam com start/end errados,
  // "furando" o cálculo do refresh() mesmo chamando-o de novo depois.
  initAboutScroll();
  initBoxFold();
  initConstellation();
  initSkillNodeReveals();
  initSkillsBg();

  /* ─── ScrollTrigger: recalcular quando fontes/imagens mudam a altura ──── */
  if (hasST) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });

    /* Um salto de scroll para uma âncora (clique num link do menu para
       #skills, por exemplo) navega via scroll-behavior:smooth do navegador,
       fora do controle do GSAP — e em muitos navegadores essa rolagem não
       dispara os eventos "scroll"/"scrollend" de forma confiável (bug
       conhecido do Chrome para navegação por fragmento). Sem esses eventos o
       ScrollTrigger não sabe que a página se moveu, e animações com scrub
       (como a constelação de habilidades) ficam travadas até o próximo
       scroll manual. Como não há evento para escutar, força algumas
       atualizações logo após qualquer navegação por âncora — via clique ou
       troca do hash — cobrindo a duração da rolagem suave nativa. */
    function resyncScrollTrigger() {
      var tries = 0;
      (function tick() {
        ScrollTrigger.update();
        if (++tries < 90) requestAnimationFrame(tick);
      })();
    }
    window.addEventListener("hashchange", resyncScrollTrigger);
    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute("href");
      var target = id && id.length > 1 ? document.querySelector(id) : null;
      if (lenis && target) {
        /* Com Lenis no controle, a rolagem por âncora vira o próprio
           lenis.scrollTo em vez do scroll-behavior:smooth nativo — assim o
           gesto fica com a mesma física suave do resto da página, e o
           evento "scroll" do Lenis já mantém o ScrollTrigger sincronizado
           frame a frame (sem precisar do polling abaixo). */
        e.preventDefault();
        lenis.scrollTo(target, { offset: -88 });
        if (window.history && window.history.pushState) {
          window.history.pushState(null, "", id);
        }
      } else {
        resyncScrollTrigger();
      }
    });
    window.addEventListener("scrollend", function () { ScrollTrigger.update(); });
  }
})();
