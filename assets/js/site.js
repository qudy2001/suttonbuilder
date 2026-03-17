(() => {
  const body = document.body;
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");
  const root = body.dataset.root || "./";
  const page = body.dataset.page || "";

  const routes = {
    home: `${root}index.html`,
    about: `${root}about-contact.html`,
    services: `${root}services.html`,
    areas: `${root}areas-we-cover.html`,
    gallery: `${root}gallery-projects.html`,
    reviews: `${root}reviews.html`
  };

  const serviceLinks = [
    { href: `${root}services/general-building-renovation.html`, label: "General Building & Renovation" },
    { href: `${root}services/home-extensions.html`, label: "Home Extensions" },
    { href: `${root}services/loft-garage-conversions.html`, label: "Loft & Garage Conversions" },
    { href: `${root}services/kitchen-renovations.html`, label: "Kitchen Renovations" },
    { href: `${root}services/bathroom-renovations.html`, label: "Bathroom Renovations" },
    { href: `${root}services/structural-alterations.html`, label: "Structural Alterations" },
    { href: `${root}services/carpentry-joinery.html`, label: "Carpentry & Joinery" },
    { href: `${root}services/outdoor-garden-works.html`, label: "Outdoor & Garden Works" },
    { href: `${root}services/electrical-plumbing.html`, label: "Electrical & Plumbing" },
    { href: `${root}services/handyman-small-repairs.html`, label: "Handyman & Small Repairs" }
  ];

  const quoteHref = page === "about" ? "#quote-panel" : `${routes.about}#quote-panel`;
  const callHref = "tel:01206125455";

  const navLink = (id, href, label) =>
    `<a href="${href}" class="${page === id ? "is-active" : ""}">${label}</a>`;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const sanitizeClassName = (value) =>
    String(value ?? "")
      .replace(/[^a-zA-Z0-9 _-]/g, " ")
      .trim();

  const normalizeArray = (value) => (Array.isArray(value) ? value : []);

  const resolveHref = (value) => {
    const href = String(value ?? "").trim();

    if (!href) {
      return "";
    }

    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("#") ||
      href.startsWith("/")
    ) {
      return href;
    }

    return `${root}${href}`;
  };

  const resolveAssetUrl = (value) => {
    const asset = String(value ?? "").trim();

    if (!asset) {
      return "";
    }

    if (asset.startsWith("http://") || asset.startsWith("https://") || asset.startsWith("/")) {
      return asset;
    }

    return `${root}${asset}`;
  };

  const backgroundStyle = (value) => {
    const url = resolveAssetUrl(value);
    return url ? ` style="background-image: url('${escapeHtml(url)}')"` : "";
  };

  const updateText = (selector, value) => {
    const element = document.querySelector(selector);

    if (element && value != null) {
      element.textContent = String(value);
    }
  };

  const updateLink = (selector, label, href) => {
    const element = document.querySelector(selector);

    if (!element) {
      return;
    }

    if (label != null) {
      element.textContent = String(label);
    }

    const resolvedHref = resolveHref(href);

    if (resolvedHref) {
      element.setAttribute("href", resolvedHref);
    }
  };

  const renderHeroLines = (lines) =>
    normalizeArray(lines)
      .map((line, index) => {
        const className = index === 0 ? "hero-line hero-accent" : "hero-line";
        return `<span class="${className}">${escapeHtml(line)}</span>`;
      })
      .join("");

  const renderHeroStats = (stats) =>
    normalizeArray(stats)
      .map(
        (item) => `
          <div class="hero-stat">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </div>
        `
      )
      .join("");

  const renderProjectSliderSlides = (slides) =>
    normalizeArray(slides)
      .map((slide) => {
        const placeholderClass = slide.image ? "" : sanitizeClassName(slide.placeholderClass);
        const chips = [slide.chipOne, slide.chipTwo]
          .filter(Boolean)
          .map((chip) => `<span class="gallery-chip">${escapeHtml(chip)}</span>`)
          .join("");

        return `
          <article class="slider-slide">
            <div class="gallery-slide ${placeholderClass}"${backgroundStyle(slide.image)}>
              <div class="gallery-slide-content">
                <div class="gallery-slide-meta">${chips}</div>
                <div class="gallery-copy-box">
                  <h3>${escapeHtml(slide.title)}</h3>
                  <p>${escapeHtml(slide.description)}</p>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

  const renderServiceCards = (cards) =>
    normalizeArray(cards)
      .map((card) => {
        const slides = normalizeArray(card.slides);
        const slidesMarkup = (slides.length > 0 ? slides : [{ label: "New slide", image: "", placeholderClass: "" }])
          .map((slide) => {
            const placeholderClass = slide.image ? "" : sanitizeClassName(slide.placeholderClass);

            return `
              <div class="slider-slide">
                <div class="card-slide ${placeholderClass}"${backgroundStyle(slide.image)}>
                  <div class="slider-card-meta">
                    <span class="card-slide-label">${escapeHtml(slide.label)}</span>
                  </div>
                </div>
              </div>
            `;
          })
          .join("");

        const linkHref = resolveHref(card.linkHref);
        const linkMarkup =
          linkHref && card.linkLabel
            ? `<a href="${escapeHtml(linkHref)}">${escapeHtml(card.linkLabel)}</a>`
            : "";

        return `
          <article class="service-card">
            <div class="slider card-slider" data-slider data-interval="${Number(card.interval) || 0}">
              <div class="slider-viewport">
                <div class="slider-track">
                  ${slidesMarkup}
                </div>
              </div>
              <div class="slider-dots" aria-label="${escapeHtml(card.ariaLabel || "Service previews")}"></div>
            </div>
            <span class="service-tag">${escapeHtml(card.tag)}</span>
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.description)}</p>
            ${linkMarkup}
          </article>
        `;
      })
      .join("");

  const renderGalleryProjects = (projects) =>
    normalizeArray(projects)
      .map((project) => {
        const placeholderClass = project.image ? "" : sanitizeClassName(project.placeholderClass);

        return `
          <article class="gallery-card">
            <div class="gallery-photo ${placeholderClass}"${backgroundStyle(project.image)}></div>
            <span class="service-tag">${escapeHtml(project.tag)}</span>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.description)}</p>
          </article>
        `;
      })
      .join("");

  const renderHeader = () => {
    if (!headerMount) {
      return;
    }

    headerMount.innerHTML = `
      <header class="site-header">
        <div class="container header-inner">
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
          <nav class="site-nav" id="site-nav" aria-label="Main navigation">
            <div class="nav-links">
              ${navLink("home", routes.home, "Home")}
              ${navLink("about", routes.about, "About / Contact")}
              ${navLink("services", routes.services, "Services")}
              ${navLink("areas", routes.areas, "Areas We Cover")}
              ${navLink("gallery", routes.gallery, "Gallery / Projects")}
              ${navLink("reviews", routes.reviews, "Reviews")}
            </div>
            <a class="btn btn-small" href="${quoteHref}">Free Quote</a>
          </nav>
        </div>
      </header>
    `;
  };

  const renderFooter = () => {
    if (!footerMount) {
      return;
    }

    footerMount.innerHTML = `
      <section class="footer-top">
        <div class="container footer-grid">
          <div>
            <p class="eyebrow">Ready to Talk?</p>
            <h3>Planning an extension, renovation or repair?</h3>
            <p>Call now for a free, no-obligation conversation, or use the instant quote assistant to tell us what you need before we call you back.</p>
            <div class="utility-row">
              <a class="btn no-wrap" href="${callHref}">Call 01206125455</a>
              <a class="btn-ghost" href="${quoteHref}">Use Instant Quote</a>
            </div>
          </div>
          <div>
            <h4>Main Pages</h4>
            <div class="footer-list">
              <a href="${routes.home}">Home</a>
              <a href="${routes.about}">About / Contact</a>
              <a href="${routes.services}">Services</a>
              <a href="${routes.areas}">Areas We Cover</a>
              <a href="${routes.gallery}">Gallery / Projects</a>
              <a href="${routes.reviews}">Reviews</a>
            </div>
          </div>
          <div>
            <h4>Popular Services</h4>
            <div class="footer-list">
              ${serviceLinks
                .slice(0, 5)
                .map((service) => `<a href="${service.href}">${service.label}</a>`)
                .join("")}
            </div>
          </div>
        </div>
      </section>
      <footer class="site-footer">
        <div class="container footer-bottom">
          <p>Sutton Builders serves Sutton, Cheam, Croydon, Richmond, Crawley, Redhill and nearby South London & Surrey areas.</p>
          <p>&copy; <span data-year></span> Sutton Builders. All rights reserved.</p>
        </div>
      </footer>
    `;
  };

  const initializeNav = () => {
    const navToggle = document.querySelector(".nav-toggle");
    const siteNav = document.querySelector(".site-nav");

    if (!navToggle || !siteNav) {
      return;
    }

    navToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  };

  const initializeMetaFields = () => {
    document.querySelectorAll("[data-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });

    document.querySelectorAll("[data-current-page]").forEach((element) => {
      element.value = window.location.pathname.split("/").pop() || "index.html";
    });
  };

  const initializeSliders = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll("[data-slider]").forEach((slider, sliderIndex) => {
      if (slider.dataset.sliderReady === "true") {
        return;
      }

      slider.dataset.sliderReady = "true";

      const track = slider.querySelector(".slider-track");
      const slides = Array.from(slider.querySelectorAll(".slider-slide"));
      const dotsMount = slider.querySelector(".slider-dots");
      const prevButton = slider.querySelector("[data-slider-prev]");
      const nextButton = slider.querySelector("[data-slider-next]");
      const interval = Number(slider.dataset.interval || 0);

      if (!track || slides.length === 0) {
        return;
      }

      let activeIndex = 0;
      let timerId = null;

      const render = () => {
        track.style.transform = `translateX(-${activeIndex * 100}%)`;

        if (dotsMount) {
          dotsMount.querySelectorAll(".slider-dot").forEach((dot, dotIndex) => {
            const isActive = dotIndex === activeIndex;
            dot.classList.toggle("is-active", isActive);
            dot.setAttribute("aria-current", String(isActive));
          });
        }
      };

      const goTo = (nextIndex) => {
        activeIndex = (nextIndex + slides.length) % slides.length;
        render();
      };

      const start = () => {
        if (prefersReducedMotion || interval <= 0 || slides.length < 2) {
          return;
        }

        stop();
        timerId = window.setInterval(() => {
          goTo(activeIndex + 1);
        }, interval);
      };

      const stop = () => {
        if (timerId !== null) {
          window.clearInterval(timerId);
          timerId = null;
        }
      };

      if (dotsMount) {
        dotsMount.innerHTML = "";

        slides.forEach((_, dotIndex) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "slider-dot";
          dot.setAttribute("aria-label", `Go to slide ${dotIndex + 1}`);
          dot.addEventListener("click", () => {
            goTo(dotIndex);
            start();
          });
          dotsMount.appendChild(dot);
        });
      }

      if (prevButton) {
        prevButton.addEventListener("click", () => {
          goTo(activeIndex - 1);
          start();
        });
      }

      if (nextButton) {
        nextButton.addEventListener("click", () => {
          goTo(activeIndex + 1);
          start();
        });
      }

      slider.addEventListener("mouseenter", stop);
      slider.addEventListener("mouseleave", start);
      slider.addEventListener("focusin", stop);
      slider.addEventListener("focusout", start);

      if (slides.length > 1) {
        goTo(sliderIndex % slides.length);
      } else {
        render();
      }

      start();
    });
  };

  const renderHomePage = (content) => {
    if (!content) {
      return;
    }

    const hero = content.hero || {};
    const heroHeading = document.querySelector("[data-home-hero-heading]");

    updateText("[data-home-hero-eyebrow]", hero.eyebrow);
    updateText("[data-home-hero-lead]", hero.lead);
    updateText("[data-home-panel-tag]", hero.panelTag);
    updateText("[data-home-panel-title]", hero.panelTitle);
    updateText("[data-home-panel-description]", hero.panelDescription);
    updateLink("[data-home-hero-primary]", hero.primaryCtaLabel, hero.primaryCtaHref);
    updateLink("[data-home-hero-secondary]", hero.secondaryCtaLabel, hero.secondaryCtaHref);

    if (heroHeading) {
      heroHeading.innerHTML = renderHeroLines(hero.headingLines);
    }

    const statsMount = document.querySelector("[data-home-hero-stats]");

    if (statsMount) {
      statsMount.innerHTML = renderHeroStats(hero.stats);
    }

    const sliderTrack = document.querySelector("[data-home-project-slider-track]");
    const slider = sliderTrack?.closest("[data-slider]");

    if (sliderTrack) {
      sliderTrack.innerHTML = renderProjectSliderSlides(content.projectSlider?.slides);
    }

    if (slider && content.projectSlider?.interval != null) {
      slider.dataset.interval = String(content.projectSlider.interval);
    }

    const servicesGrid = document.querySelector("[data-home-services-grid]");

    if (servicesGrid) {
      servicesGrid.innerHTML = renderServiceCards(content.servicesCards);
    }
  };

  const renderServicesPage = (content) => {
    if (!content) {
      return;
    }

    const hero = content.hero || {};

    updateText("[data-services-hero-eyebrow]", hero.eyebrow);
    updateText("[data-services-hero-title]", hero.title);
    updateText("[data-services-hero-lead]", hero.lead);

    const servicesGrid = document.querySelector("[data-services-page-grid]");

    if (servicesGrid) {
      servicesGrid.innerHTML = renderServiceCards(content.servicesCards);
    }
  };

  const renderGalleryPage = (content) => {
    if (!content) {
      return;
    }

    const hero = content.hero || {};
    const cta = content.cta || {};

    updateText("[data-gallery-hero-eyebrow]", hero.eyebrow);
    updateText("[data-gallery-hero-title]", hero.title);
    updateText("[data-gallery-hero-lead]", hero.lead);

    const galleryGrid = document.querySelector("[data-gallery-projects-grid]");

    if (galleryGrid) {
      galleryGrid.innerHTML = renderGalleryProjects(content.projects);
    }

    updateText("[data-gallery-cta-eyebrow]", cta.eyebrow);
    updateText("[data-gallery-cta-title]", cta.title);
    updateText("[data-gallery-cta-description]", cta.description);
    updateLink("[data-gallery-cta-primary]", cta.primaryCtaLabel, cta.primaryCtaHref);
    updateLink("[data-gallery-cta-secondary]", cta.secondaryCtaLabel, cta.secondaryCtaHref);
  };

  const applyEditableContent = (content) => {
    if (!content) {
      return;
    }

    if (page === "home") {
      renderHomePage(content.home);
    }

    if (page === "services") {
      renderServicesPage(content.servicesPage);
    }

    if (page === "gallery") {
      renderGalleryPage(content.galleryPage);
    }
  };

  const loadEditableContent = async () => {
    if (!["home", "services", "gallery"].includes(page)) {
      return;
    }

    try {
      const response = await fetch(`${root}assets/data/site-content.json`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Failed to load content (${response.status})`);
      }

      const content = await response.json();
      applyEditableContent(content);
    } catch (error) {
      console.warn("Using built-in page content because editable content could not be loaded.", error);
    }
  };

  const boot = async () => {
    renderHeader();
    renderFooter();
    initializeNav();
    initializeMetaFields();
    await loadEditableContent();
    initializeSliders();
  };

  void boot();
})();
