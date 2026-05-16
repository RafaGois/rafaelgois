/**
 * ScrollTriggers comuns à dobra `#box`: fade opcional do canvas + scrub opcional de progress.
 */
export function setupBoxFoldScrollTriggers({
  canvas,
  bindScrollScrub = true,
  scrollState,
} = {}) {
  function setup() {
    if (!window.gsap || !window.ScrollTrigger) {
      requestAnimationFrame(setup);
      return;
    }
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    if (bindScrollScrub && scrollState) {
      ScrollTrigger.create({
        trigger: '#box',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          scrollState.progress = self.progress;
        },
      });
    }

    if (!canvas) return;

    const fadeIn = () =>
      gsap.to(canvas, { opacity: 1, duration: 0.9, ease: 'power2.out' });
    const fadeOut = () =>
      gsap.to(canvas, { opacity: 0, duration: 0.4, ease: 'power1.in' });

    ScrollTrigger.create({
      trigger: '#box',
      start: 'top 85%',
      end: 'bottom 15%',
      onEnter: fadeIn,
      onLeave: fadeOut,
      onEnterBack: fadeIn,
      onLeaveBack: fadeOut,
    });
  }
  setup();
}
