(() => {
  const app = document.querySelector("[data-admin-app]");
  const saveButton = document.querySelector("[data-save]");
  const reloadButton = document.querySelector("[data-reload]");
  const statusMount = document.querySelector("[data-status]");

  const state = {
    content: null,
    dirty: false,
    loading: true,
    saving: false
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const pathSegments = (path) =>
    String(path)
      .split(".")
      .filter(Boolean)
      .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));

  const getByPath = (object, path) =>
    pathSegments(path).reduce((current, segment) => (current == null ? current : current[segment]), object);

  const setByPath = (object, path, value) => {
    const segments = pathSegments(path);
    let current = object;

    segments.slice(0, -1).forEach((segment) => {
      current = current[segment];
    });

    current[segments[segments.length - 1]] = value;
  };

  const assetUrl = (value) => {
    const path = String(value ?? "").trim();

    if (!path) {
      return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
      return path;
    }

    return `/${path}`;
  };

  const createHeroLine = () => "New heading line";
  const createStat = () => ({ label: "New label", value: "New value" });
  const createProjectSlide = () => ({
    chipOne: "Project type",
    chipTwo: "Area",
    title: "New project title",
    description: "Add a short project summary here.",
    image: "",
    placeholderClass: ""
  });
  const createServiceSlide = () => ({
    label: "New slide label",
    image: "",
    placeholderClass: ""
  });
  const createServiceCard = () => ({
    interval: 4200,
    ariaLabel: "Service previews",
    tag: "New",
    title: "New service",
    description: "Describe this service here.",
    linkLabel: "",
    linkHref: "",
    slides: [createServiceSlide()]
  });
  const createGalleryProject = () => ({
    tag: "Project",
    title: "New gallery project",
    description: "Describe what the customer will see in this project.",
    image: "",
    placeholderClass: ""
  });

  const factories = {
    heroLine: createHeroLine,
    stat: createStat,
    projectSlide: createProjectSlide,
    serviceSlide: createServiceSlide,
    serviceCard: createServiceCard,
    galleryProject: createGalleryProject
  };

  const setStatus = (message, tone = "neutral") => {
    statusMount.textContent = message;
    statusMount.dataset.tone = tone;
  };

  const syncToolbar = () => {
    saveButton.disabled = state.loading || state.saving || !state.dirty;
    reloadButton.disabled = state.loading || state.saving;
    saveButton.textContent = state.saving ? "Saving..." : state.dirty ? "Save changes" : "Saved";
  };

  const markDirty = (message = "You have unsaved changes.") => {
    state.dirty = true;
    setStatus(message);
    syncToolbar();
  };

  const arrayActions = (path, index, removeLabel = "Remove item") => `
    <div class="row-actions">
      <button class="small-button small-button-ghost" type="button" data-action="move-item" data-path="${escapeHtml(path)}" data-index="${index}" data-direction="-1">Move up</button>
      <button class="small-button small-button-ghost" type="button" data-action="move-item" data-path="${escapeHtml(path)}" data-index="${index}" data-direction="1">Move down</button>
      <button class="small-button small-button-danger" type="button" data-action="remove-item" data-path="${escapeHtml(path)}" data-index="${index}">${escapeHtml(removeLabel)}</button>
    </div>
  `;

  const textField = (label, path, value, type = "text") => `
    <label class="admin-field">
      <span>${escapeHtml(label)}</span>
      <input type="${type}" value="${escapeHtml(value)}" data-path="${escapeHtml(path)}">
    </label>
  `;

  const numberField = (label, path, value) => `
    <label class="admin-field">
      <span>${escapeHtml(label)}</span>
      <input type="number" value="${escapeHtml(value)}" data-path="${escapeHtml(path)}" data-value-type="number">
    </label>
  `;

  const textAreaField = (label, path, value) => `
    <label class="admin-field">
      <span>${escapeHtml(label)}</span>
      <textarea data-path="${escapeHtml(path)}">${escapeHtml(value)}</textarea>
    </label>
  `;

  const imageEditor = (label, imagePath, dataPath, placeholderClass) => {
    const resolved = assetUrl(imagePath);
    const previewMarkup = resolved
      ? `<img class="image-preview" src="${escapeHtml(resolved)}" alt="${escapeHtml(label)}">`
      : `<div class="image-placeholder">No image uploaded yet</div>`;

    const placeholderNote = placeholderClass
      ? `<p class="muted-note">Fallback placeholder class: <strong>${escapeHtml(placeholderClass)}</strong></p>`
      : `<p class="muted-note">Upload an image or paste a relative path such as <strong>assets/uploads/example.jpg</strong>.</p>`;

    return `
      <div class="preview-panel">
        <div>
          ${previewMarkup}
        </div>
        <div class="subsection">
          ${textField(label, dataPath, imagePath)}
          <div class="image-actions">
            <label class="upload-button">
              <span>Upload image</span>
              <input type="file" accept="image/*" data-upload-path="${escapeHtml(dataPath)}">
            </label>
            <button class="small-button small-button-ghost" type="button" data-action="clear-field" data-path="${escapeHtml(dataPath)}">Clear image</button>
          </div>
          ${placeholderNote}
        </div>
      </div>
    `;
  };

  const renderHeroLines = (path, lines) => `
    <div class="subsection">
      <div class="subsection-header">
        <div>
          <span class="pill">Hero heading lines</span>
          <p class="muted-note">These render as the stacked homepage headline.</p>
        </div>
        <button class="small-button small-button-primary" type="button" data-action="add-item" data-path="${escapeHtml(path)}" data-factory="heroLine">Add line</button>
      </div>
      <div class="editor-stack">
        ${lines
          .map(
            (line, index) => `
              <div class="nested-card">
                <div class="subsection-header">
                  <h4>Line ${index + 1}</h4>
                  ${arrayActions(path, index, "Remove line")}
                </div>
                ${textField("Text", `${path}.${index}`, line)}
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  const renderStats = (path, stats) => `
    <div class="subsection">
      <div class="subsection-header">
        <div>
          <span class="pill">Hero stats</span>
          <p class="muted-note">These appear in the right-hand box on the homepage.</p>
        </div>
        <button class="small-button small-button-primary" type="button" data-action="add-item" data-path="${escapeHtml(path)}" data-factory="stat">Add stat</button>
      </div>
      <div class="editor-stack">
        ${stats
          .map(
            (item, index) => `
              <div class="nested-card">
                <div class="subsection-header">
                  <h4>Stat ${index + 1}</h4>
                  ${arrayActions(path, index, "Remove stat")}
                </div>
                <div class="field-grid two-up">
                  ${textField("Label", `${path}.${index}.label`, item.label)}
                  ${textField("Value", `${path}.${index}.value`, item.value)}
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  const renderHomeHeroSection = () => {
    const hero = state.content.home.hero;

    return `
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <p class="section-kicker">Homepage</p>
            <h2>Hero copy</h2>
            <p class="section-copy">Edit the top section of the homepage, including the headline, buttons, and side panel.</p>
          </div>
        </div>
        <div class="editor-stack">
          <div class="editor-card">
            <div class="field-grid two-up">
              ${textField("Eyebrow", "home.hero.eyebrow", hero.eyebrow)}
              ${textAreaField("Lead paragraph", "home.hero.lead", hero.lead)}
              ${textField("Primary button label", "home.hero.primaryCtaLabel", hero.primaryCtaLabel)}
              ${textField("Primary button link", "home.hero.primaryCtaHref", hero.primaryCtaHref)}
              ${textField("Secondary button label", "home.hero.secondaryCtaLabel", hero.secondaryCtaLabel)}
              ${textField("Secondary button link", "home.hero.secondaryCtaHref", hero.secondaryCtaHref)}
            </div>
          </div>
          ${renderHeroLines("home.hero.headingLines", hero.headingLines || [])}
          <div class="editor-card">
            <div class="subsection">
              <div class="subsection-header">
                <div>
                  <span class="pill">Right panel</span>
                  <p class="muted-note">This is the support box beside the hero text.</p>
                </div>
              </div>
              <div class="field-grid two-up">
                ${textField("Panel tag", "home.hero.panelTag", hero.panelTag)}
                ${textField("Panel heading", "home.hero.panelTitle", hero.panelTitle)}
                ${textAreaField("Panel description", "home.hero.panelDescription", hero.panelDescription)}
              </div>
            </div>
          </div>
          ${renderStats("home.hero.stats", hero.stats || [])}
        </div>
      </section>
    `;
  };

  const renderProjectSliderSection = () => {
    const slider = state.content.home.projectSlider;
    const slides = slider.slides || [];

    return `
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <p class="section-kicker">Homepage</p>
            <h2>Project slider</h2>
            <p class="section-copy">Manage the large homepage project slider. You can upload photos and add or reorder slides here.</p>
          </div>
          <div class="inline-actions">
            <button class="small-button small-button-primary" type="button" data-action="add-item" data-path="home.projectSlider.slides" data-factory="projectSlide">Add project slide</button>
          </div>
        </div>
        <div class="editor-stack">
          <div class="editor-card">
            <div class="field-grid">
              ${numberField("Slider interval (milliseconds)", "home.projectSlider.interval", slider.interval)}
            </div>
          </div>
          ${slides
            .map(
              (slide, index) => `
                <div class="editor-card">
                  <div class="subsection-header">
                    <div>
                      <h3>Homepage slide ${index + 1}</h3>
                      <p class="muted-note">Use the chips for the small labels above the project title.</p>
                    </div>
                    ${arrayActions("home.projectSlider.slides", index, "Remove slide")}
                  </div>
                  <div class="field-grid two-up">
                    ${textField("Chip one", `home.projectSlider.slides.${index}.chipOne`, slide.chipOne)}
                    ${textField("Chip two", `home.projectSlider.slides.${index}.chipTwo`, slide.chipTwo)}
                    ${textField("Title", `home.projectSlider.slides.${index}.title`, slide.title)}
                    ${textAreaField("Description", `home.projectSlider.slides.${index}.description`, slide.description)}
                  </div>
                  ${imageEditor("Image path", slide.image, `home.projectSlider.slides.${index}.image`, slide.placeholderClass)}
                </div>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  };

  const renderServiceCardEditor = (card, arrayPath, index, title) => `
    <div class="editor-card">
      <div class="subsection-header">
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p class="muted-note">Each card can have its own wording, link, slide timing, and multiple image slides.</p>
        </div>
        ${arrayActions(arrayPath, index, "Remove card")}
      </div>
      <div class="field-grid three-up">
        ${textField("Tag", `${arrayPath}.${index}.tag`, card.tag)}
        ${textField("Title", `${arrayPath}.${index}.title`, card.title)}
        ${numberField("Slider interval", `${arrayPath}.${index}.interval`, card.interval)}
        ${textAreaField("Description", `${arrayPath}.${index}.description`, card.description)}
        ${textField("Dots aria label", `${arrayPath}.${index}.ariaLabel`, card.ariaLabel)}
        ${textField("Link label", `${arrayPath}.${index}.linkLabel`, card.linkLabel)}
        ${textField("Link href", `${arrayPath}.${index}.linkHref`, card.linkHref)}
      </div>

      <div class="subsection">
        <div class="subsection-header">
          <div>
            <span class="pill">Slides</span>
            <p class="muted-note">Add as many image slides as you need for this service card.</p>
          </div>
          <button class="small-button small-button-primary" type="button" data-action="add-item" data-path="${escapeHtml(arrayPath)}.${index}.slides" data-factory="serviceSlide">Add slide</button>
        </div>
        <div class="editor-stack">
          ${(card.slides || [])
            .map(
              (slide, slideIndex) => `
                <div class="nested-card">
                  <div class="subsection-header">
                    <h4>Slide ${slideIndex + 1}</h4>
                    ${arrayActions(`${arrayPath}.${index}.slides`, slideIndex, "Remove slide")}
                  </div>
                  <div class="field-grid two-up">
                    ${textField("Label", `${arrayPath}.${index}.slides.${slideIndex}.label`, slide.label)}
                  </div>
                  ${imageEditor("Image path", slide.image, `${arrayPath}.${index}.slides.${slideIndex}.image`, slide.placeholderClass)}
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    </div>
  `;

  const renderServicesSection = (sectionTitle, kicker, description, path, cards) => `
    <section class="admin-section">
      <div class="admin-section-header">
        <div>
          <p class="section-kicker">${escapeHtml(kicker)}</p>
          <h2>${escapeHtml(sectionTitle)}</h2>
          <p class="section-copy">${escapeHtml(description)}</p>
        </div>
        <div class="inline-actions">
          <button class="small-button small-button-primary" type="button" data-action="add-item" data-path="${escapeHtml(path)}" data-factory="serviceCard">Add service card</button>
        </div>
      </div>
      <div class="editor-stack">
        ${cards.map((card, index) => renderServiceCardEditor(card, path, index, `Card ${index + 1}`)).join("")}
      </div>
    </section>
  `;

  const renderServicesHeroSection = () => {
    const hero = state.content.servicesPage.hero;

    return `
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <p class="section-kicker">Services page</p>
            <h2>Page hero</h2>
            <p class="section-copy">Edit the heading and supporting introduction shown at the top of the services page.</p>
          </div>
        </div>
        <div class="editor-card">
          <div class="field-grid two-up">
            ${textField("Eyebrow", "servicesPage.hero.eyebrow", hero.eyebrow)}
            ${textField("Title", "servicesPage.hero.title", hero.title)}
            ${textAreaField("Lead paragraph", "servicesPage.hero.lead", hero.lead)}
          </div>
        </div>
      </section>
    `;
  };

  const renderGalleryHeroSection = () => {
    const hero = state.content.galleryPage.hero;

    return `
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <p class="section-kicker">Gallery page</p>
            <h2>Page hero</h2>
            <p class="section-copy">Control the intro copy at the top of the projects gallery page.</p>
          </div>
        </div>
        <div class="editor-card">
          <div class="field-grid two-up">
            ${textField("Eyebrow", "galleryPage.hero.eyebrow", hero.eyebrow)}
            ${textField("Title", "galleryPage.hero.title", hero.title)}
            ${textAreaField("Lead paragraph", "galleryPage.hero.lead", hero.lead)}
          </div>
        </div>
      </section>
    `;
  };

  const renderGalleryProjectsSection = () => {
    const projects = state.content.galleryPage.projects || [];

    return `
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <p class="section-kicker">Gallery page</p>
            <h2>Project cards</h2>
            <p class="section-copy">Add projects, update wording, upload images, and reorder the gallery grid.</p>
          </div>
          <div class="inline-actions">
            <button class="small-button small-button-primary" type="button" data-action="add-item" data-path="galleryPage.projects" data-factory="galleryProject">Add gallery project</button>
          </div>
        </div>
        <div class="editor-stack">
          ${projects
            .map(
              (project, index) => `
                <div class="editor-card">
                  <div class="subsection-header">
                    <div>
                      <h3>Gallery project ${index + 1}</h3>
                      <p class="muted-note">These cards appear on the public gallery page.</p>
                    </div>
                    ${arrayActions("galleryPage.projects", index, "Remove project")}
                  </div>
                  <div class="field-grid two-up">
                    ${textField("Tag", `galleryPage.projects.${index}.tag`, project.tag)}
                    ${textField("Title", `galleryPage.projects.${index}.title`, project.title)}
                    ${textAreaField("Description", `galleryPage.projects.${index}.description`, project.description)}
                  </div>
                  ${imageEditor("Image path", project.image, `galleryPage.projects.${index}.image`, project.placeholderClass)}
                </div>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  };

  const renderGalleryCtaSection = () => {
    const cta = state.content.galleryPage.cta;

    return `
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <p class="section-kicker">Gallery page</p>
            <h2>Bottom call to action</h2>
            <p class="section-copy">Edit the text and buttons that appear below the gallery grid.</p>
          </div>
        </div>
        <div class="editor-card">
          <div class="field-grid two-up">
            ${textField("Eyebrow", "galleryPage.cta.eyebrow", cta.eyebrow)}
            ${textField("Title", "galleryPage.cta.title", cta.title)}
            ${textAreaField("Description", "galleryPage.cta.description", cta.description)}
            ${textField("Primary button label", "galleryPage.cta.primaryCtaLabel", cta.primaryCtaLabel)}
            ${textField("Primary button link", "galleryPage.cta.primaryCtaHref", cta.primaryCtaHref)}
            ${textField("Secondary button label", "galleryPage.cta.secondaryCtaLabel", cta.secondaryCtaLabel)}
            ${textField("Secondary button link", "galleryPage.cta.secondaryCtaHref", cta.secondaryCtaHref)}
          </div>
        </div>
      </section>
    `;
  };

  const render = () => {
    if (!state.content) {
      app.innerHTML = "";
      return;
    }

    app.innerHTML = `
      ${renderHomeHeroSection()}
      ${renderProjectSliderSection()}
      ${renderServicesSection(
        "Homepage service sliders",
        "Homepage",
        "These cards power the service slider section on the homepage.",
        "home.servicesCards",
        state.content.home.servicesCards || []
      )}
      ${renderServicesHeroSection()}
      ${renderServicesSection(
        "Services page sliders",
        "Services page",
        "These cards appear on the dedicated services page.",
        "servicesPage.servicesCards",
        state.content.servicesPage.servicesCards || []
      )}
      ${renderGalleryHeroSection()}
      ${renderGalleryProjectsSection()}
      ${renderGalleryCtaSection()}
    `;
  };

  const moveItem = (path, index, direction) => {
    const array = getByPath(state.content, path);
    const nextIndex = index + direction;

    if (!Array.isArray(array) || nextIndex < 0 || nextIndex >= array.length) {
      return;
    }

    const [item] = array.splice(index, 1);
    array.splice(nextIndex, 0, item);
  };

  const removeItem = (path, index) => {
    const array = getByPath(state.content, path);

    if (!Array.isArray(array)) {
      return;
    }

    array.splice(index, 1);
  };

  const addItem = (path, factoryName) => {
    const array = getByPath(state.content, path);
    const factory = factories[factoryName];

    if (!Array.isArray(array) || typeof factory !== "function") {
      return;
    }

    array.push(factory());
  };

  const loadContent = async () => {
    state.loading = true;
    state.dirty = false;
    syncToolbar();
    setStatus("Loading content...");

    try {
      const response = await fetch("/api/content", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Could not load content (${response.status})`);
      }

      state.content = await response.json();
      render();
      setStatus("Content loaded. Make your changes and click Save changes.", "success");
    } catch (error) {
      setStatus(error.message, "error");
      console.error(error);
    } finally {
      state.loading = false;
      syncToolbar();
    }
  };

  const saveContent = async () => {
    if (!state.content || state.saving) {
      return;
    }

    state.saving = true;
    syncToolbar();
    setStatus("Saving changes...");

    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(state.content, null, 2)
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Save failed (${response.status})`);
      }

      state.dirty = false;
      setStatus("Changes saved. The public site will read the updated content file.", "success");
    } catch (error) {
      setStatus(error.message, "error");
      console.error(error);
    } finally {
      state.saving = false;
      syncToolbar();
    }
  };

  const uploadImage = async (file, path) => {
    if (!file) {
      return;
    }

    const payload = new FormData();
    payload.set("file", file);
    setStatus(`Uploading ${file.name}...`);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: payload
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Upload failed (${response.status})`);
      }

      const data = await response.json();
      setByPath(state.content, path, data.path);
      state.dirty = true;
      render();
      setStatus(`Uploaded ${file.name}. Click Save changes to publish the new image path.`, "success");
    } catch (error) {
      setStatus(error.message, "error");
      console.error(error);
    } finally {
      syncToolbar();
    }
  };

  app.addEventListener("input", (event) => {
    const field = event.target.closest("[data-path]");

    if (!field || !state.content) {
      return;
    }

    const { path, valueType } = field.dataset;
    const value = valueType === "number" ? Number(field.value || 0) : field.value;
    setByPath(state.content, path, value);
    markDirty();
  });

  app.addEventListener("change", (event) => {
    const uploadField = event.target.closest("[data-upload-path]");

    if (!uploadField || !state.content) {
      return;
    }

    void uploadImage(uploadField.files?.[0], uploadField.dataset.uploadPath);
    uploadField.value = "";
  });

  app.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");

    if (!control || !state.content) {
      return;
    }

    const action = control.dataset.action;
    const path = control.dataset.path;
    const index = Number(control.dataset.index || 0);
    const direction = Number(control.dataset.direction || 0);
    const factoryName = control.dataset.factory;

    if (action === "add-item") {
      addItem(path, factoryName);
      render();
      markDirty("Added a new item.");
    }

    if (action === "remove-item") {
      removeItem(path, index);
      render();
      markDirty("Removed the item.");
    }

    if (action === "move-item") {
      moveItem(path, index, direction);
      render();
      markDirty("Updated the item order.");
    }

    if (action === "clear-field") {
      setByPath(state.content, path, "");
      render();
      markDirty("Cleared the image path.");
    }
  });

  saveButton.addEventListener("click", () => {
    void saveContent();
  });

  reloadButton.addEventListener("click", () => {
    if (state.dirty && !window.confirm("Discard your unsaved changes and reload from disk?")) {
      return;
    }

    void loadContent();
  });

  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  });

  void loadContent();
})();
