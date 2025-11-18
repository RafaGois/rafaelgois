document.addEventListener("DOMContentLoaded", () => {
  // Registrar ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);
  
  const icons = document.querySelectorAll(".icon");
  const iconContainer = document.querySelector(".absolute");
  
  if (iconContainer && icons.length > 0) {
    // Obter posição do container
    const containerRect = iconContainer.getBoundingClientRect();
    
    // Calcular centro da tela relativo ao container
    const centerX = window.innerWidth / 2 - containerRect.left;
    const centerY = window.innerHeight / 2 - containerRect.top;
    
    icons.forEach((icon, index) => {
      // Posição inicial: centro da tela
      gsap.set(icon, {
        x: centerX,
        y: centerY,
        opacity: 0,
        scale: 0,
        transformOrigin: "center center",
      });
    });

    icons.forEach((icon, index) => {
      initIconsAnimation(icon, Math.random() * window.innerWidth - 200, Math.random() * window.innerHeight - 200, index);
    });
  }

  // Skills Section Animations
  initSkillsAnimations();
  
  // Projects Section Animations
  initProjectsAnimations();
  
  // Services Section Animations
  initServicesAnimations();
});

function initIconsAnimation(element, x, y) {
    gsap.to(element, {
      x: x,
      y: y,
      duration: 1,
      ease: "power2.out",
      scale: 1,
      opacity: 1,
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
        y: 30
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
          toggleActions: "play none none none"
        }
      }
    );

    // Animar items individuais dentro de cada categoria
    const skillItems = category.querySelectorAll(".skill-item");
    skillItems.forEach((item, itemIndex) => {
      gsap.fromTo(
        item,
        {
          opacity: 0,
          x: -20
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          delay: (index * 0.2) + (itemIndex * 0.1),
          ease: "power2.out",
          scrollTrigger: {
            trigger: category,
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      );
    });
  });
}

function initProjectsAnimations() {
  const projectItems = document.querySelectorAll(".project-item");
  const projectHighlight = document.querySelector(".project-highlight");
  
  if (projectItems.length === 0) return;

  projectItems.forEach((item, index) => {
    gsap.fromTo(
      item,
      {
        opacity: 0,
        y: 40
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: index * 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          end: "top 60%",
          toggleActions: "play none none none"
        }
      }
    );
  });

  // Animar bloco de destaque
  if (projectHighlight) {
    gsap.fromTo(
      projectHighlight,
      {
        opacity: 0,
        y: 30
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: projectHighlight,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );
  }
}

function initServicesAnimations() {
  const serviceItems = document.querySelectorAll(".service-item");
  const serviceCta = document.querySelector(".service-cta");
  
  if (serviceItems.length === 0) return;

  serviceItems.forEach((item, index) => {
    gsap.fromTo(
      item,
      {
        opacity: 0,
        y: 40
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: index * 0.25,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          end: "top 60%",
          toggleActions: "play none none none"
        }
      }
    );
  });

  // Animar bloco CTA
  if (serviceCta) {
    gsap.fromTo(
      serviceCta,
      {
        opacity: 0,
        y: 20
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: serviceCta,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );
  }
}

