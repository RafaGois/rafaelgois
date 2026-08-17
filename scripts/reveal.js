/**
 * rafaelgois.com — revelações genéricas para páginas de conteúdo (sem hero).
 * Mesmo princípio de scripts/site.js (docs/design_system.html, seção 07):
 *  · um gesto por elemento — nada re-anima ao rolar de volta;
 *  · só transform/opacity;
 *  · todo movimento tem um "sem movimento" (prefers-reduced-motion).
 *
 * Usado nas páginas de trabalho (hoje sites-institucionais), que não têm
 * three.js — só [data-reveal], [data-rule] e as dobras próprias da página.
 * A dobra de abertura é a exceção: ela É um hero cinematográfico, portado do
 * index.html sem a parte 3D (ver buildHeroCinematic mais abaixo).
 * Depende de: gsap 3.13 + ScrollTrigger (carregados antes, com defer).
 * SplitText é opcional: sem ela, o texto dos capítulos do hero e [data-quote]
 * caem num gesto por bloco em vez de palavra a palavra.
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

  var reveals = slice(document.querySelectorAll("[data-reveal]")).filter(function (el) {
    return !el.closest(".closing-cta");
  });
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

  /* ─── HERO NARRATIVO — o palco cinematográfico da página ────────────────
     Porte do motor do hero do index.html (site.js: buildHeroCinematic), sem
     as duas partes que só existem lá: o teclado 3D (esta página não carrega
     three.js) e o campo de orbes. O que fica é a técnica inteira — uma seção
     alta (.hero__track) com palco sticky (.hero__stage) e UM progresso
     suavizado por lerp alimentando câmera, névoa, luz, raios, textura de
     fundo, capítulos e HUD. Sem pin do ScrollTrigger: sticky puro.

     A diferença é de narrativa. Lá são quatro cenas de biografia; aqui são
     cinco de storytelling de serviço — a capa, e depois a história de quem
     procura a empresa no Google. Cada porquê entra como uma nota logo depois
     da frase do capítulo que o justifica, com o mesmo gesto lateral do texto.
     Como não há teclado desenhando por cima, a textura de fundo aparece com
     mais presença que no index. */
  var hero = document.querySelector(".hero--work");
  var heroTrack = hero ? hero.querySelector(".hero__track") : null;
  var chapters = hero ? slice(hero.querySelectorAll(".hero-chapter")) : [];

  /* Quando cada cena entra e quando sai, em fração do progresso da dobra.
     As janelas se sobrepõem de propósito: a entrada de uma cena começa antes
     de a anterior terminar de sair, então nunca há tela vazia no meio.
     O ritmo é do motor e vale para toda página de trabalho; o rótulo de cada
     capítulo no HUD é da PÁGINA, e vem do data-hud do próprio capítulo (o
     `label` aqui é só o repouso, para o caso de o atributo faltar). */
  var SCENES = [
    { inFrom: null, inTo: null, outFrom: 0.07, outTo: 0.18, num: "01", label: "A capa" },
    { inFrom: 0.15, inTo: 0.26, outFrom: 0.31, outTo: 0.41, num: "02", label: "Capítulo I" },
    { inFrom: 0.38, inTo: 0.48, outFrom: 0.52, outTo: 0.61, num: "03", label: "Capítulo II" },
    { inFrom: 0.58, inTo: 0.68, outFrom: 0.72, outTo: 0.80, num: "04", label: "Capítulo III" },
    { inFrom: 0.79, inTo: 0.90, outFrom: null, outTo: null, num: "05", label: "Capítulo IV" },
  ];
  /* Onde o HUD troca de capítulo — o ponto médio de cada transição. */
  var HUD_AT = [0.16, 0.39, 0.58, 0.79];
  var WORD_STAGGER = 0.055;

  /* ── Repouso das cenas ──────────────────────────────────────────────────
     Cada cena tem uma faixa de progresso em que ela está inteira em cena e
     nada está em movimento: do fim da entrada ao começo da saída. Fora dessas
     faixas há sempre uma troca acontecendo — e é exatamente ali que parar o
     scroll deixava o texto congelado no meio do gesto. Derivado de SCENES
     para as duas coisas nunca saírem de sincronia. */
  var REST_ZONES = SCENES.map(function (cfg) {
    return [cfg.inTo === null ? 0 : cfg.inTo, cfg.outFrom === null ? 1 : cfg.outFrom];
  });
  /* Quanto do caminho entre dois repousos precisa estar vencido para a cena
     terminar de entrar em vez de voltar. Baixo de propósito: quem parou no
     meio quase sempre queria ver o capítulo chegar, não desistir dele — mas um
     empurrãozinho de nada ainda devolve a cena anterior, inteira. */
  var SETTLE_BIAS = 0.35;

  /** Para onde a cena deve derivar quando o scroll para. null = já em repouso. */
  function restGoal(p) {
    var prev = null, next = null;
    for (var i = 0; i < REST_ZONES.length; i++) {
      var a = REST_ZONES[i][0], b = REST_ZONES[i][1];
      if (p >= a && p <= b) return null;
      if (b < p && (prev === null || b > prev)) prev = b;
      if (a > p && (next === null || a < next)) next = a;
    }
    if (prev === null) return next;
    if (next === null) return prev;
    return (p - prev) / (next - prev) > SETTLE_BIAS ? next : prev;
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function mix(from, to, amount) { return from + (to - from) * amount; }
  function smoothstep(start, end, value) {
    var x = clamp01((value - start) / (end - start));
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

  /**
   * Entrada da capa no load — só no palco cinematográfico. No fluxo vertical
   * quem faz esse papel é a animação CSS (.hero.is-flow .hero-chapter--rest
   * > div, em ds.css), que não disputa propriedades com o scrub de saída.
   * Aqui a timeline mexe apenas nos FILHOS da capa: o motor por-frame escreve
   * em .hero-chapter e no div interno, então as duas mãos nunca se cruzam.
   *
   * Em aba de fundo o rAF congela — o ticker do GSAP para junto, e a capa
   * ficaria no estado inicial (invisível) até o usuário voltar à aba. Por
   * isso a timeline só é montada quando a página está visível (mesmo cuidado
   * de playFirstChapter em site.js).
   */
  function playHeroIntro(restChapter) {
    var played = false;
    function play() {
      if (played) return;
      played = true;
      buildIntro(restChapter);
    }
    if (document.visibilityState === "visible") { play(); return; }
    document.addEventListener("visibilitychange", function onVis() {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVis);
      play();
    });
  }

  function buildIntro(restChapter) {
    var stroke = restChapter.querySelector(".sig-stroke");
    var mark = restChapter.querySelector("[data-mark]");
    if (!hasGSAP || reduced) {
      if (stroke) stroke.classList.add("is-drawn");
      if (mark) mark.classList.add("is-marked");
      return;
    }

    var tl = gsap.timeline({ delay: 0.25 });
    var roman = restChapter.querySelector(".hero-rest__roman");
    var rule = restChapter.querySelector(".hero-rest__rule");
    var over = restChapter.querySelector(".hero-rest__over");
    var name = restChapter.querySelector(".hero-rest__name");
    var tag = restChapter.querySelector(".hero-rest__tag");
    var actions = restChapter.querySelector(".hero-rest__actions");

    if (rule) tl.from(rule, { scaleX: 0, duration: 0.9, ease: "power3.out" }, 0);
    if (over) tl.from(over, { y: 14, opacity: 0, duration: 0.7, ease: EASE }, 0.1);
    if (name) tl.from(name, { y: 30, opacity: 0, filter: "blur(10px)", duration: 1.1, ease: EASE }, 0.18);
    if (roman) tl.from(roman, { scale: 1.18, opacity: 0, duration: 1.6, ease: "expo.out" }, 0.1);
    if (tag) tl.from(tag, { y: 20, opacity: 0, duration: 0.9, ease: EASE }, 0.5);
    if (actions) tl.from(actions, { y: 16, opacity: 0, duration: 0.8, ease: EASE }, 0.62);
    /* Traço e grifo fecham a assinatura da capa — classes, não tweens: as
       duas animações já existem em CSS (sigDraw e a transição de
       .mark-amber), e o motor por-frame não escreve nelas. */
    if (stroke) tl.add(function () { stroke.classList.add("is-drawn"); }, 0.45);
    if (mark) tl.add(function () { mark.classList.add("is-marked"); }, 0.85);
  }

  function buildHeroCinematic() {
    var rig = hero.querySelector(".hero__rig");
    var bgImage = document.querySelector(".hero__bg-image");
    var light = hero.querySelector(".hero__light");
    var rays = hero.querySelector(".hero__rays");
    var fogBack = hero.querySelector(".hero__fog--back");
    var fogFront = hero.querySelector(".hero__fog--front");
    var flash = hero.querySelector(".hero__flash");
    var cue = hero.querySelector(".hero__cue");
    var hudBar = document.getElementById("hero-hud-bar");
    var hudNum = document.getElementById("hero-hud-chapter");
    var hudLabel = document.getElementById("hero-hud-label");

    var scenes = chapters.map(function (ch, i) {
      var line = ch.querySelector("[data-split]");
      return {
        el: ch,
        inner: ch.firstElementChild || ch,
        note: ch.querySelector(".hero-chapter__note"),
        words: line ? splitWords(line) : [],
        cfg: SCENES[i] || SCENES[SCENES.length - 1],
        rest: ch.classList.contains("hero-chapter--rest"),
        side: ch.dataset.side || "",
        hasSide: !!ch.dataset.side,
      };
    });

    /* Rótulos do HUD: o texto é da página (data-hud em cada capítulo), o
       numeral é do motor. Assim o mesmo reveal.js serve as três páginas de
       trabalho sem carregar a narrativa de nenhuma delas. */
    var HUD = chapters.map(function (ch, i) {
      var base = SCENES[i] || SCENES[SCENES.length - 1];
      return { num: base.num, label: ch.dataset.hud || base.label };
    });

    playHeroIntro(scenes[0].el);

    var target = 0, smooth = 0, lastP = 0, vel = 0;
    var lastHud = -1;
    var lastTime = 0;
    /* Suavização por tempo, não por frame: um lerp fixo por frame faria a
       narrativa correr ~2x mais rápido numa tela de 120 Hz que numa de 60 Hz.
       Mesmas taxas do hero do index. */
    var SMOOTH_RATE = 4.7;
    var VEL_RATE = 7.7;

    /* Acabamento da cena quando o scroll para (ver restGoal, acima). O que
       deriva é só o progresso RENDERIZADO — a barra de rolagem fica onde o
       usuário a deixou, e o gesto seguinte retoma dali sem solavanco. */
    var idle = 0;            // segundos desde a última mudança de scroll
    var settling = false;    // trava: uma vez começado, vai até o fim
    var settleTo = 0;
    var SETTLE_DELAY = 0.16; // respiro antes de assumir que o scroll parou
    var SETTLE_EPS = 0.004;  // smooth já alcançou o target
    var SETTLE_RATE = 1.5;   // ~3x mais lento que o lerp normal: é um acabamento, não um salto

    function updateTarget() {
      var rect = heroTrack.getBoundingClientRect();
      var distance = heroTrack.offsetHeight - window.innerHeight;
      var next = clamp01(-rect.top / Math.max(distance, 1));
      /* Só um scroll que MOVE a dobra interrompe o acabamento: eventos de
         rolagem que não mudam o progresso (fim de página, gesto horizontal)
         não deveriam travar a cena de novo no meio do gesto. */
      if (next !== target) {
        idle = 0;
        settling = false;
      }
      target = next;
    }

    /** Palavras deslizam lateralmente — do lado do capítulo para dentro, e
        seguem para o mesmo lado ao sair — com stagger derivado do próprio
        progresso, não de uma duração fixa. Capítulos centrais entram pela
        esquerda, como o Capítulo I do index. */
    function writeWords(scene, inAmt, outAmt) {
      var words = scene.words;
      var n = words.length;
      if (!n) return;
      var span = 1 + n * WORD_STAGGER;
      var dir = scene.side === "right" ? 1 : -1;
      for (var i = 0; i < n; i++) {
        var enter = clamp01(inAmt * span - i * WORD_STAGGER);
        var exit = clamp01(outAmt * span - (n - 1 - i) * WORD_STAGGER);
        var x = dir * (mix(70, 0, enter) + exit * 60);
        var o = enter * (1 - exit);
        var w = words[i];
        w.style.opacity = o;
        w.style.transform = "translate3d(" + x.toFixed(2) + "%,0,0)";
      }
    }

    /** A nota do porquê chega depois da frase e sai um pouco antes dela — é a
        legenda do capítulo, não o título. */
    function writeNote(scene, inAmt, outAmt) {
      var note = scene.note;
      if (!note) return;
      var enter = clamp01((inAmt - 0.45) / 0.55);
      var exit = clamp01(outAmt * 1.3);
      var dir = scene.hasSide ? (scene.side === "right" ? 1 : -1) : 0;
      var nx = dir * (mix(3.4, 0, enter) + exit * 2.8);
      var ny = mix(1.5, 0, enter) - exit * 1.4;
      note.style.opacity = (enter * (1 - exit)).toFixed(3);
      note.style.transform = "translate3d(" + nx.toFixed(2) + "rem," + ny.toFixed(2) + "rem,0)";
    }

    function frame(time) {
      var dt = lastTime ? Math.min((time - lastTime) / 1000, 0.25) : 1 / 60;
      lastTime = time;

      idle += dt;

      /* Fluxo: se a rolagem parou no meio de uma troca de capítulo, a cena não
         fica trancada pela metade — ela se completa sozinha, devagar, até o
         repouso mais próximo. A trava (settling) existe porque, assim que o
         progresso renderizado começa a se afastar do scroll, a condição de
         entrada deixaria de valer — sem ela o motor entraria e sairia do
         acabamento a cada frame, e a cena tremeria em vez de assentar. */
      if (!settling && idle > SETTLE_DELAY && Math.abs(target - smooth) < SETTLE_EPS) {
        var rest = restGoal(smooth);
        if (rest !== null) {
          settleTo = rest;
          settling = true;
        }
      }
      var goal = settling ? settleTo : target;
      smooth += (goal - smooth) * (1 - Math.exp((settling ? -SETTLE_RATE : -SMOOTH_RATE) * dt));
      /* Chegou: crava o valor e SEGUE travado. Soltar a trava aqui devolveria
         o comando ao scroll parado, que puxaria a cena de volta ao meio do
         gesto — e o acabamento dispararia de novo, num vaivém sem fim. Quem
         solta a trava é só o próximo scroll de verdade (ver updateTarget). */
      if (settling && Math.abs(settleTo - smooth) < 0.0006) smooth = settleTo;

      vel += ((smooth - lastP) - vel) * (1 - Math.exp(-VEL_RATE * dt));
      lastP = smooth;

      var p = clamp01(smooth);

      /* Beats da narrativa: um respiro de luz na virada do Capítulo III para
         o IV (o momento em que a história vira resposta) e a chegada da cena
         final. */
      var impact = range(p, 0.68, 0.715, 0.76);
      var finalIn = segment(p, 0.79, 0.92);
      var endingDim = segment(p, 0.96, 1);

      /* Câmera — a cada troca de capítulo a cena inteira (textura + luz +
         névoa) desliza para o lado: o texto não é o único a se mover, o fundo
         empurra junto. Mesma coreografia do index, redistribuída sobre cinco
         cenas em vez de quatro. */
      var camX =
        mix(0, -2.4, segment(p, 0.05, 0.26)) +
        mix(0, 4.8, segment(p, 0.28, 0.52)) -
        mix(0, 4.4, segment(p, 0.55, 0.78)) +
        mix(0, 2.0, segment(p, 0.80, 1));
      var camY =
        mix(1.0, -1.6, segment(p, 0, 0.30)) +
        mix(0, 2.8, segment(p, 0.34, 0.60)) -
        mix(0, 2.2, segment(p, 0.66, 1));
      var camScale =
        1.02 +
        segment(p, 0, 0.20) * 0.08 -
        segment(p, 0.20, 0.40) * 0.045 +
        segment(p, 0.40, 0.60) * 0.12 -
        segment(p, 0.62, 0.80) * 0.08 +
        segment(p, 0.80, 1) * 0.07;
      var camRot =
        mix(-0.3, 0.6, segment(p, 0, 0.34)) -
        mix(0, 0.95, segment(p, 0.36, 0.66)) +
        mix(0, 0.55, segment(p, 0.68, 1));

      var shake = impact * 0.2;
      var shakeX = Math.sin(p * 920) * shake;
      var shakeY = Math.cos(p * 760) * shake * 0.65;

      if (rig) {
        rig.style.transform =
          "translate3d(" + (camX + shakeX).toFixed(3) + "%," + (camY + shakeY).toFixed(3) + "%,0) scale(" +
          camScale.toFixed(4) + ") rotate(" + camRot.toFixed(3) + "deg)";
      }
      if (light) {
        light.style.transform = "translate3d(" + mix(-6, 9, p).toFixed(2) + "%," + mix(4, -5, p).toFixed(2) + "%,0) scale(" + (1 + p * 0.15).toFixed(3) + ")";
        light.style.opacity = (0.26 + impact * 0.26 + finalIn * 0.16 - endingDim * 0.14).toFixed(3);
      }
      if (rays) {
        rays.style.transform = "translate3d(" + mix(-5, 8, p).toFixed(2) + "%," + mix(3, -4, p).toFixed(2) + "%,0) rotate(" + mix(-6, 4, p).toFixed(2) + "deg)";
        rays.style.opacity = (0.08 + segment(p, 0.18, 0.6) * 0.14 + impact * 0.16).toFixed(3);
      }
      if (fogBack) {
        fogBack.style.transform = "translate3d(" + mix(-7, 7, p).toFixed(2) + "%," + mix(6, -6, p).toFixed(2) + "%,0) scale(" + (1.15 + p * 0.15).toFixed(3) + ")";
        fogBack.style.opacity = (0.2 + segment(p, 0.1, 0.5) * 0.14).toFixed(3);
      }
      if (fogFront) {
        fogFront.style.transform = "translate3d(" + mix(10, -9, p).toFixed(2) + "%," + mix(7, -4, p).toFixed(2) + "%,0) scale(" + (1.2 + p * 0.2).toFixed(3) + ")";
        fogFront.style.opacity = (0.2 + segment(p, 0.4, 0.82) * 0.2 + finalIn * 0.1).toFixed(3);
      }
      if (flash) flash.style.opacity = (range(p, 0.695, 0.715, 0.745) * 0.3).toFixed(3);
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

        /* O fundo acompanha os capítulos alternados: o texto que entra pela
           esquerda puxa a textura para a direita, e vice-versa. É esse
           contra-movimento que dá a sensação de câmera acompanhando alguém
           andando pela cena. */
        if (s.hasSide) {
          bgSideShift += -(s.side === "right" ? 1 : -1) * vis;
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

        if (!s.rest) {
          writeWords(s, inAmt, outAmt);
          writeNote(s, inAmt, outAmt);
        }
      }

      if (bgImage) {
        /* Fixa e fora do .hero: só acende enquanto a dobra está em tela —
           senão vazaria por trás das seções seguintes. Sem teclado 3D na
           frente, ela pode aparecer bem mais que no index. */
        var heroVisible = heroTrack.getBoundingClientRect().bottom > 0;
        if (heroVisible) {
          var bgPresence = clamp01(bgSidedPresence);
          var bgX = Math.max(-1, Math.min(1, bgSideShift)) * 7.5;
          var bgY = mix(-1.6, 2.2, p);
          var bgScale = 1.07 + bgPresence * 0.05;
          bgImage.style.transform =
            "translate3d(" + bgX.toFixed(2) + "%," + bgY.toFixed(2) + "%,0) scale(" + bgScale.toFixed(4) + ")";
          bgImage.style.opacity = (0.4 + bgPresence * 0.26 - endingDim * 0.2).toFixed(3);
        } else {
          bgImage.style.opacity = 0;
        }
      }

      /* HUD — capítulo corrente */
      var hudIdx = 0;
      while (hudIdx < HUD_AT.length && p >= HUD_AT[hudIdx]) hudIdx++;
      if (hudIdx !== lastHud) {
        lastHud = hudIdx;
        if (hudNum) hudNum.textContent = HUD[hudIdx].num;
        if (hudLabel) hudLabel.textContent = HUD[hudIdx].label;
      }

      requestAnimationFrame(frame);
    }

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget);
    updateTarget();
    requestAnimationFrame(frame);
  }

  /**
   * Repouso (mobile / prefers-reduced-motion / sem ScrollTrigger): sem palco
   * sticky nem câmera, mas a mesma ideia narrativa — cada capítulo aparece e
   * some conforme o scroll, um de cada vez. Mesmo desenho de buildHeroFlow em
   * site.js: UM tween por capítulo, guiado por keyframes % e escrubado pelo
   * próprio ScrollTrigger (dois tweens disputando opacity/y/filter no mesmo
   * elemento se pisariam, e a saída engoliria a entrada).
   */
  function buildHeroFlow() {
    hero.classList.add("is-flow");
    chapters.forEach(function (ch) { ch.style.opacity = "1"; });
    playHeroIntro(chapters[0]);

    /* A textura de fundo e a atmosfera existem também no fluxo vertical — sem
       câmera, mas com o mesmo gesto de "ir para o lado" a cada capítulo
       alternado. A imagem é fixa e vive em z 0; como todas as seções depois
       do hero são opacas (--z-section), ela só aparece através da dobra
       transparente da narrativa, sem vazar página abaixo. */
    var bgImage = document.querySelector(".hero__bg-image");
    var atmo = [
      [hero.querySelector(".hero__fog--back"), 0.24],
      [hero.querySelector(".hero__light"), 0.26],
      [hero.querySelector(".hero__rays"), 0.1],
      [hero.querySelector(".hero__fog--front"), 0.34],
    ];
    atmo.forEach(function (pair) { if (pair[0]) pair[0].style.opacity = String(pair[1]); });
    if (bgImage) bgImage.style.opacity = "0.42";

    if (!hasST || reduced) return;

    if (bgImage) {
      chapters.forEach(function (ch) {
        var dir = ch.dataset.side === "right" ? 1 : ch.dataset.side === "left" ? -1 : 0;
        gsap.to(bgImage, {
          xPercent: dir * -6,
          ease: "power1.inOut",
          immediateRender: false,
          scrollTrigger: { trigger: ch, start: "top 88%", end: "center 45%", scrub: 1 },
        });
      });
      gsap.to(bgImage, {
        opacity: 0,
        immediateRender: false,
        scrollTrigger: { trigger: hero, start: "bottom 75%", end: "bottom 30%", scrub: 1 },
      });
    }

    chapters.forEach(function (ch, i) {
      var inner = ch.firstElementChild || ch;
      if (ch.classList.contains("hero-chapter--rest")) {
        /* A capa já nasce visível (o "pop" de entrada é CSS): aqui só a
           saída, presa à base do capítulo. */
        gsap.to(inner, {
          ease: "power1.in",
          keyframes: {
            "0%": { y: 0, opacity: 1, filter: "blur(0px)" },
            "100%": { y: -26, opacity: 0, filter: "blur(6px)" },
          },
          scrollTrigger: { trigger: ch, start: "bottom 95%", end: "bottom 45%", scrub: 0.3 },
        });
        return;
      }

      /* Último capítulo fecha a sequência: entra e permanece — como no palco,
         onde SCENES[4] não tem outFrom/outTo. Os demais entram, se mantêm
         legíveis e saem. A referência é o CENTRO do capítulo, não o topo:
         cada um é uma caixa alta com o texto centralizado por flex, então
         amarrar ao topo dispararia a entrada antes de o texto entrar na tela. */
      var isLast = i === chapters.length - 1;
      gsap.to(inner, {
        ease: "power1.inOut",
        keyframes: isLast ? {
          "0%": { y: 44, opacity: 0, filter: "blur(8px)" },
          "38%": { y: 0, opacity: 1, filter: "blur(0px)" },
          "100%": { y: 0, opacity: 1, filter: "blur(0px)" },
        } : {
          "0%": { y: 44, opacity: 0, filter: "blur(8px)" },
          "20%": { y: 0, opacity: 1, filter: "blur(0px)" },
          "76%": { y: 0, opacity: 1, filter: "blur(0px)" },
          "100%": { y: -40, opacity: 0, filter: "blur(7px)" },
        },
        scrollTrigger: { trigger: ch, start: "center 97%", end: "center 3%", scrub: 0.3 },
      });
    });
  }

  if (hero && heroTrack && chapters.length) {
    if (!reduced && !isNarrow && hasGSAP) buildHeroCinematic();
    else buildHeroFlow();
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

    /* Distância de ROLAGEM que a dobra pinada consome — coisa diferente da
       viagem horizontal do track (scrollAmount, acima). Antes as duas eram a
       mesma: 1 px de rolagem = 1 px de deslize, o que pedia quase três telas
       de scroll para atravessar três cases. Agora cada case custa pouco mais
       de meia tela, e o snap abaixo faz o resto — um ou dois cliques de roda
       já entregam o próximo projeto. */
    var PIN_SCREENS_PER_CASE = 0.6;
    function pinDistance() {
      return Math.max(1, Math.round(panels.length * window.innerHeight * PIN_SCREENS_PER_CASE));
    }

    /* Onde cada case fica centralizado no pin, em fração do progresso do
       track. Não é uma divisão igual (i/(n-1)): o primeiro case nasce fora da
       tela à direita e o último tem a folga do fim, então as paradas saem da
       geometria real de cada painel. Recalculado a cada chamada porque o
       trigger é invalidateOnRefresh — largura de tela nova, paradas novas. */
    function snapPoints() {
      var total = scrollAmount();
      if (total <= 0) return [0];
      var half = pin.clientWidth / 2;
      return panels.map(function (panel) {
        return clamp((panel.offsetLeft + panel.offsetWidth / 2 - half) / total, 0, 1);
      });
    }

    /* Quanto do vão entre duas paradas o gesto precisa vencer para o snap
       entender "quero o próximo" em vez de "escorreguei um pouco". Baixo de
       propósito: é isso que troca de case com um ou dois cliques de roda, em
       vez de exigir passar da metade do caminho (o comportamento padrão do
       snap, que é sempre a parada mais próxima). */
    var SNAP_INTENT = 0.2;

    /* Em que parada a dobra está descansando, e para qual ela está indo. A
       dupla é o que garante um case por gesto: uma rolada forte cai longe, às
       vezes depois do case seguinte, e sem esse trilho o snap obedeceria o
       ponto de queda e pularia direto para o último. settledIndex só avança
       quando o snap termina, então avaliações encadeadas dentro do mesmo
       gesto continuam medindo a partir do mesmo lugar. */
    var settledIndex = 0;
    var pendingIndex = 0;

    function nearestIndex(pts, value) {
      var best = 0, bestDist = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var d = Math.abs(pts[i] - value);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      return best;
    }

    /* Entrar na dobra por cima, por baixo, ou depois de um refresh: o ponto de
       partida passa a ser o case que está em cena, não o índice de antes. */
    function resyncSettled() {
      var pts = snapPoints();
      settledIndex = pendingIndex = nearestIndex(pts, slide ? slide.progress() : 0);
    }

    function snapCase(value, self) {
      var pts = snapPoints();
      if (pts.length < 2) return value;
      var dir = self ? self.direction : 0;

      /* Saída da dobra: o snap se cala além da última parada indo para frente
         (ou aquém da primeira indo para trás) — mas SÓ quando a dobra já está
         descansando nessa ponta. Sem essa condição, uma rolada forte no case
         do meio cairia depois do último e escaparia por aqui, pulando um case;
         sem a saída livre, o snap puxaria o usuário de volta para o último a
         cada rolagem e não haveria como seguir para a seção seguinte. */
      if (dir > 0 && value > pts[pts.length - 1] && settledIndex >= pts.length - 1) return value;
      if (dir < 0 && value < pts[0] && settledIndex <= 0) return value;

      var best = nearestIndex(pts, value);
      /* Direcional: se a parada mais próxima ficou para trás no sentido do
         gesto e o usuário já venceu SNAP_INTENT do vão, entrega a seguinte. */
      if (dir > 0 && best < pts.length - 1) {
        if (value - pts[best] > (pts[best + 1] - pts[best]) * SNAP_INTENT) best++;
      } else if (dir < 0 && best > 0) {
        if (pts[best] - value > (pts[best] - pts[best - 1]) * SNAP_INTENT) best--;
      }

      /* Um case por gesto. Uma rolada forte cai longe — às vezes depois do
         case seguinte, às vezes no fim do trilho — e é isso que fazia a dobra
         pular direto para o último. O destino fica preso a um passo de onde a
         dobra estava descansando, então rolar mais forte só chega mais rápido
         ao próximo, nunca ao de depois dele. */
      if (best > settledIndex + 1) best = settledIndex + 1;
      else if (best < settledIndex - 1) best = settledIndex - 1;

      pendingIndex = best;
      return pts[best];
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
      end: function () { return "+=" + pinDistance(); },
      scrub: 0.6,
      pin: true,
      invalidateOnRefresh: true,
      animation: slide,
      /* Depois que a rolagem para, a dobra se acomoda no case mais próximo —
         nada de parar no meio de dois projetos. Junto com pinDistance() é o
         que faz a dobra andar "de case em case" em vez de exigir arrastar o
         track inteiro na mão.
         O delay não é o mínimo possível de propósito: uma rolada de trackpad
         chega como uma rajada de eventos, e um delay curto demais avaliaria o
         snap no meio dela — cada avaliação andando um case, o que somaria dois
         ou três de uma vez. Esperar o gesto assentar faz cada rolada valer um
         case só. */
      snap: {
        snapTo: snapCase,
        duration: { min: 0.25, max: 0.7 },
        delay: 0.12,
        ease: "power2.inOut",
        onComplete: function () { settledIndex = pendingIndex; },
      },
      /* Esse pin reserva espaço de scroll extra, então tudo que vem depois
         dele na página (a grade de "Ferramentas que uso", o fechamento) só
         calcula start/end certo se ele for recalculado primeiro. Os
         [data-reveal] genéricos lá do topo do arquivo foram registrados
         antes deste trigger — refreshPriority garante a ordem certa sem
         depender da ordem de criação. */
      refreshPriority: 1,
      onRefresh: function () { placeStops(); onScrub(slide.progress()); resyncSettled(); },
      /* Entrando por cima (case I) ou voltando por baixo (último case), o
         trilho de "um passo por gesto" precisa partir de onde a dobra está
         agora — senão o primeiro gesto depois de reentrar mediria a partir de
         um índice velho e puxaria para o case errado. */
      onEnter: resyncSettled,
      onEnterBack: resyncSettled,
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

  /* ─── Grifo âmbar: o marca-texto lendo junto (mesmo padrão de site.js) ──
     O grifo da capa fica de fora: ele já está em tela no load, então o
     observador o acenderia no mesmo instante — quem o comanda é a timeline
     de entrada do hero (playHeroIntro), no tempo certo da sequência. */
  var marks = slice(document.querySelectorAll("[data-mark]")).filter(function (m) {
    return !m.closest(".hero-chapter--rest");
  });
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
    marks.forEach(function (m) { markObserver.observe(m); });
  } else {
    marks.forEach(function (m) { m.classList.add("is-marked"); });
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
      .querySelectorAll(".manifesto__cite-stroke")
      .forEach(function (s) { strokeObserver.observe(s); });
  }

  /* ─── Fechamento ("Próximo passo") — timeline própria, não o [data-reveal]
     genérico. Halo, traço-assinatura, overline, título palavra a palavra,
     lede e botões entram em cascata; um gesto só, once. O traço é desenhado
     pelo GSAP (não pela classe .is-drawn) para caber no tempo da sequência. */
  (function initClosingCta() {
    var section = document.querySelector(".closing-cta");
    if (!section) return;

    var halo = section.querySelector(".closing-cta__halo");
    var stroke = section.querySelector(".closing-cta__stroke");
    var path = stroke ? stroke.querySelector("path") : null;
    var over = section.querySelector(".closing-cta__over");
    var title = section.querySelector(".closing-cta__title");
    var lede = section.querySelector(".closing-cta__lede");
    var buttons = slice(section.querySelectorAll(".closing-cta__action .btn"));

    if (!hasST || reduced) {
      if (stroke) stroke.classList.add("is-drawn");
      return;
    }

    var titleWords = title ? splitWords(title) : [];
    if (title) gsap.set(title, { overflow: "hidden" });

    var dash = 320;
    if (path && typeof path.getTotalLength === "function") {
      try { dash = Math.ceil(path.getTotalLength()) + 8; } catch (err) { dash = 320; }
      gsap.set(path, { strokeDasharray: dash, strokeDashoffset: dash });
    }

    var tl = gsap.timeline({
      defaults: { ease: EASE },
      scrollTrigger: { trigger: section, start: "top 78%", once: true },
      onComplete: function () {
        if (title) gsap.set(title, { overflow: "visible" });
        if (halo) gsap.set(halo, { clearProps: "willChange" });
      },
    });

    if (halo) {
      tl.fromTo(
        halo,
        { opacity: 0, scale: 0.42, x: 48, y: -24 },
        { opacity: 1, scale: 1, x: 0, y: 0, duration: 1.45, ease: "expo.out" },
        0,
      );
    }
    if (path) {
      tl.to(path, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, 0.08);
    } else if (stroke) {
      tl.add(function () { stroke.classList.add("is-drawn"); }, 0.08);
    }
    if (over) {
      tl.fromTo(
        over,
        { opacity: 0, y: 18, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.75 },
        0.28,
      );
    }
    if (titleWords.length) {
      tl.set(title, { opacity: 1 }, 0.4);
      tl.fromTo(
        titleWords,
        { yPercent: 118, opacity: 0, filter: "blur(12px)" },
        {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.05,
          stagger: 0.055,
          ease: "power4.out",
        },
        0.4,
      );
    } else if (title) {
      tl.fromTo(
        title,
        { opacity: 0, y: 28, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.95 },
        0.4,
      );
    }
    if (lede) {
      tl.fromTo(
        lede,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        0.72,
      );
    }
    if (buttons.length) {
      tl.fromTo(
        buttons,
        { opacity: 0, y: 26, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: "back.out(1.6)",
        },
        0.88,
      );
    }
  })();

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
