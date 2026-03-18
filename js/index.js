const prefersReducedMotion =
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initTilForm() {
  const tilForm = document.querySelector("#til-form");
  const tilList = document.querySelector("#til-list");

  if (!tilForm || !tilList) {
    return;
  }

  const tilDate = document.querySelector("#til-date");
  const tilTitle = document.querySelector("#til-title");
  const tilContent = document.querySelector("#til-content");

  tilForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const newArticle = document.createElement("article");
    newArticle.classList.add("til-item");

    const newTime = document.createElement("time");
    newTime.textContent = tilDate.value;

    const newTitle = document.createElement("h3");
    newTitle.textContent = tilTitle.value;

    const newContent = document.createElement("p");
    newContent.textContent = tilContent.value;

    newArticle.append(newTime, newTitle, newContent);
    tilList.prepend(newArticle);

    tilForm.reset();
  });
}

function initNavigationAnimation() {
  const nav = document.querySelector(".top-nav");
  const navList = nav?.querySelector(".nav-links");
  const navLinks = navList ? [...navList.querySelectorAll("a[href^='#']")] : [];

  if (!nav || !navList || navLinks.length === 0) {
    return;
  }

  const sections = navLinks
    .map((link) => {
      const target = document.querySelector(link.getAttribute("href"));
      return target ? { link, target } : null;
    })
    .filter(Boolean);

  if (sections.length === 0) {
    return;
  }

  const indicator = document.createElement("span");
  indicator.className = "nav-indicator";
  navList.appendChild(indicator);

  let activeLink = null;
  let isTicking = false;

  const updateIndicator = (link) => {
    const listRect = navList.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    indicator.style.width = `${linkRect.width}px`;
    indicator.style.transform = `translateX(${linkRect.left - listRect.left}px)`;
    indicator.style.opacity = "1";
  };

  const setActiveLink = (link) => {
    if (!link) {
      return;
    }

    activeLink = link;

    navLinks.forEach((item) => {
      const isActive = item === link;
      item.classList.toggle("is-active", isActive);

      if (isActive) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });

    updateIndicator(link);
  };

  const getCurrentLink = () => {
    const threshold = window.scrollY + nav.offsetHeight + 96;
    let currentLink = sections[0].link;

    for (const item of sections) {
      if (threshold >= item.target.offsetTop) {
        currentLink = item.link;
      }
    }

    return currentLink;
  };

  const syncNavigation = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
    setActiveLink(getCurrentLink());
    isTicking = false;
  };

  const requestSync = () => {
    if (isTicking) {
      return;
    }

    isTicking = true;
    window.requestAnimationFrame(syncNavigation);
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));

      if (!target) {
        return;
      }

      event.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 28;
      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });

      setActiveLink(link);

      if (window.history?.replaceState) {
        try {
          window.history.replaceState(null, "", link.getAttribute("href"));
        } catch (error) {
          // Ignore hash update failures in restricted browsing contexts.
        }
      }
    });
  });

  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", () => {
    if (activeLink) {
      updateIndicator(activeLink);
    }

    requestSync();
  });

  const initialLink =
    sections.find((item) => item.link.getAttribute("href") === window.location.hash)?.link ||
    getCurrentLink();

  window.requestAnimationFrame(() => {
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
    setActiveLink(initialLink);
  });
}

function createGalleryLightbox() {
  const root = document.createElement("div");
  root.className = "gallery-lightbox";
  root.hidden = true;
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "갤러리 이미지 확대 보기");

  root.innerHTML = `
    <button type="button" class="gallery-lightbox__backdrop" aria-label="확대 보기 닫기"></button>
    <div class="gallery-lightbox__dialog">
      <div class="gallery-lightbox__toolbar">
        <span class="gallery-lightbox__counter"></span>
        <button type="button" class="gallery-lightbox__close">닫기</button>
      </div>
      <div class="gallery-lightbox__viewport">
        <button type="button" class="gallery-lightbox__nav gallery-lightbox__nav--prev" aria-label="이전 이미지">&lt;</button>
        <figure class="gallery-lightbox__figure">
          <img class="gallery-lightbox__image" alt="" />
          <figcaption class="gallery-lightbox__caption" hidden></figcaption>
        </figure>
        <button type="button" class="gallery-lightbox__nav gallery-lightbox__nav--next" aria-label="다음 이미지">&gt;</button>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  return {
    root,
    backdrop: root.querySelector(".gallery-lightbox__backdrop"),
    counter: root.querySelector(".gallery-lightbox__counter"),
    close: root.querySelector(".gallery-lightbox__close"),
    prev: root.querySelector(".gallery-lightbox__nav--prev"),
    next: root.querySelector(".gallery-lightbox__nav--next"),
    image: root.querySelector(".gallery-lightbox__image"),
    caption: root.querySelector(".gallery-lightbox__caption"),
  };
}

function initGalleryLightbox() {
  const galleryImages = [...document.querySelectorAll(".gallery-grid img")];

  if (galleryImages.length === 0) {
    return;
  }

  const lightbox = createGalleryLightbox();
  let currentIndex = 0;
  let closeTimerId = null;
  let lastFocusedElement = null;

  const getCaption = (image) => {
    const caption = image.getAttribute("data-caption") || image.alt.trim();
    return /^갤러리 이미지 \d+$/.test(caption) ? "" : caption;
  };

  const renderImage = (index) => {
    currentIndex = (index + galleryImages.length) % galleryImages.length;

    const currentImage = galleryImages[currentIndex];
    const caption = getCaption(currentImage);

    lightbox.image.src = currentImage.currentSrc || currentImage.src;
    lightbox.image.alt = currentImage.alt;
    lightbox.counter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
    lightbox.caption.textContent = caption;
    lightbox.caption.hidden = !caption;

    const shouldDisableControls = galleryImages.length < 2;
    lightbox.prev.disabled = shouldDisableControls;
    lightbox.next.disabled = shouldDisableControls;
  };

  const openLightbox = (index, triggerElement) => {
    window.clearTimeout(closeTimerId);
    renderImage(index);

    lastFocusedElement = triggerElement;

    lightbox.root.hidden = false;
    lightbox.root.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");

    window.requestAnimationFrame(() => {
      lightbox.root.classList.add("is-open");
    });

    lightbox.close.focus();
  };

  const closeLightbox = () => {
    lightbox.root.classList.remove("is-open");
    lightbox.root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");

    closeTimerId = window.setTimeout(() => {
      lightbox.root.hidden = true;

      if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
      }
    }, 320);
  };

  const showPrevious = () => {
    renderImage(currentIndex - 1);
  };

  const showNext = () => {
    renderImage(currentIndex + 1);
  };

  galleryImages.forEach((image, index) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-haspopup", "dialog");

    image.addEventListener("click", () => {
      openLightbox(index, image);
    });

    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      openLightbox(index, image);
    });
  });

  lightbox.backdrop.addEventListener("click", closeLightbox);
  lightbox.close.addEventListener("click", closeLightbox);
  lightbox.prev.addEventListener("click", showPrevious);
  lightbox.next.addEventListener("click", showNext);

  document.addEventListener("keydown", (event) => {
    if (lightbox.root.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeLightbox();
    }

    if (event.key === "ArrowLeft") {
      showPrevious();
    }

    if (event.key === "ArrowRight") {
      showNext();
    }
  });
}

initTilForm();
initNavigationAnimation();
initGalleryLightbox();
