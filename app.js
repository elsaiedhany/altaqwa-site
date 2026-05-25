/* global SITE_CONFIG */
(function(){
  const C = window.SITE_CONFIG;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setHref = (id, val) => { const el = document.getElementById(id); if (el) el.setAttribute("href", val); };

  // Bind basics
  setText("brandName", C.brand);
  setText("ownerName", C.owner);
  setText("cityLine", C.cityLine);
  setText("govLine", C.governorate);
  setText("phoneDisplay", C.phoneDisplay);

  // links
  const tel = `tel:${C.phoneTel}`;
  const waBase = `https://wa.me/${C.whatsapp}`;
  const waQuick = `${waBase}?text=${encodeURIComponent("عاوز استفسار عن مطبخ/ألوميتال")}`;

  setHref("telTop", tel);
  setHref("waTop", waQuick);
  setHref("telBtn", tel);
  setHref("waBtn", waQuick);
  setHref("waFloat", waQuick);

  const fb = C.facebookUrl || "#";
  const ig = C.instagramUrl || "#";
  setHref("fbLink", fb);
  setHref("igLink", ig);

  // update map
  const map = document.getElementById("mapFrame");
  if (map) map.src = C.mapEmbedUrl;

  // Counters in hero
  const expYears = document.getElementById("expYears");
  if (expYears) expYears.textContent = `+${C.experienceYears}`;
  const warrantyYears = document.getElementById("warrantyYears");
  if (warrantyYears) warrantyYears.textContent = String(C.warrantyYears);

  const expCount = document.getElementById("expCount");
  if (expCount) expCount.setAttribute("data-count", String(C.experienceYears));

  // Mobile menu
  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");
  if (burger && mobileMenu) {
    burger.addEventListener("click", () => mobileMenu.classList.toggle("show"));
    $$(".mobile-links a", mobileMenu).forEach(a => a.addEventListener("click", () => mobileMenu.classList.remove("show")));
  }

  // Active link on scroll
  const sections = ["home","services","portfolio","about","faq","contact"]
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const navLinks = $$(".nav-links a");

  const setActive = () => {
    const y = window.scrollY + 140;
    let current = "home";
    sections.forEach(sec => { if (sec.offsetTop <= y) current = sec.id; });
    navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${current}`));
  };
  window.addEventListener("scroll", setActive, { passive:true });
  setActive();

  // Reveal on scroll
  const revealEls = $$(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // Counters animation
  const counterEls = $$("[data-count]");
  let countersDone = false;
  function animateCounters() {
    if (countersDone) return;
    countersDone = true;
    counterEls.forEach(el => {
      const target = Number(el.getAttribute("data-count") || "0");
      const duration = 900;
      const startTime = performance.now();
      function tick(now) {
        const p = Math.min((now - startTime) / duration, 1);
        const val = Math.floor(target * (0.2 + 0.8 * p));
        el.textContent = val.toString();
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toString();
      }
      requestAnimationFrame(tick);
    });
  }
  const hero = $(".hero");
  if (hero) {
    const heroIO = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) animateCounters(); });
    }, { threshold: 0.4 });
    heroIO.observe(hero);
  }

  // Before/After slider
  const baRange = $("#baRange");
  const baBefore = $("#baBefore");
  const baLine = $("#baLine");
  const baHandle = $("#baHandle");
  function setBA(v) {
    const value = Number(v);
    if (baBefore) baBefore.style.width = value + "%";
    if (baLine) baLine.style.right = value + "%";
    if (baHandle) baHandle.style.right = `calc(${value}% - 18px)`;
  }
  if (baRange) {
    setBA(baRange.value);
    baRange.addEventListener("input", (e) => setBA(e.target.value));
  }

  // Render services
  const servicesWrap = $("#servicesWrap");
  if (servicesWrap) {
    servicesWrap.innerHTML = C.services.map(s => `
      <article class="card reveal">
        <h3>${escapeHtml(s.title)}</h3>
        <p class="muted">${escapeHtml(s.desc)}</p>
      </article>
    `).join("");
    $$(".reveal", servicesWrap).forEach(el => io.observe(el));
  }

  // Render portfolio
  const grid = $("#portfolioGrid");
  if (grid) {
    grid.innerHTML = C.portfolio.map(p => `
      <button class="work" data-cat="${p.cat}" data-title="${escapeHtml(p.title)}" data-label="${escapeHtml(p.label)}"
              data-images="${p.images.join(",")}" aria-label="${escapeHtml(p.title)}">
        <img src="${p.images[0]}" alt="${escapeHtml(p.title)}" loading="lazy" />
        <div class="work-meta">
          <span class="tag">${escapeHtml(p.label)}</span>
          <span class="work-title">${escapeHtml(p.title)}</span>
        </div>
      </button>
    `).join("");
  }

  // Portfolio filter
  const filters = $("#filters");
  function applyFilter(cat) {
    $$(".work").forEach(item => {
      const c = item.getAttribute("data-cat");
      const show = (cat === "all") || (c === cat);
      item.style.display = show ? "" : "none";
    });
  }
  if (filters) {
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".chipBtn");
      if (!btn) return;
      $$(".chipBtn", filters).forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilter(btn.getAttribute("data-filter"));
    });
  }

  // Modal gallery
  const modal = $("#modal");
  const modalBackdrop = $("#modalBackdrop");
  const modalClose = $("#modalClose");
  const modalTitle = $("#modalTitle");
  const modalTag = $("#modalTag");
  const modalImg = $("#modalImg");
  const modalThumbs = $("#modalThumbs");

  let currentImages = [];
  let currentIndex = 0;

  function openModal(title, label, imgs) {
    currentImages = imgs;
    currentIndex = 0;
    if (modalTitle) modalTitle.textContent = title || "عمل";
    if (modalTag) modalTag.textContent = label || "عمل";
    renderModalImage();
    renderThumbs();
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function renderModalImage() {
    if (!modalImg) return;
    modalImg.src = currentImages[currentIndex];
  }

  function renderThumbs() {
    if (!modalThumbs) return;
    modalThumbs.innerHTML = "";
    currentImages.forEach((src, idx) => {
      const t = document.createElement("button");
      t.className = "thumb" + (idx === currentIndex ? " active" : "");
      t.type = "button";
      t.innerHTML = `<img src="${src}" alt="thumb" loading="lazy">`;
      t.addEventListener("click", () => {
        currentIndex = idx;
        renderModalImage();
        renderThumbs();
      });
      modalThumbs.appendChild(t);
    });
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".work");
    if (!btn) return;
    const title = btn.getAttribute("data-title") || "عمل";
    const label = btn.getAttribute("data-label") || "عمل";
    const imagesStr = btn.getAttribute("data-images") || "";
    const imgs = imagesStr.split(",").map(s => s.trim()).filter(Boolean);
    if (imgs.length) openModal(title, label, imgs);
  });

  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // Testimonials
  const tWrap = $("#testimonialsWrap");
  if (tWrap) {
    tWrap.innerHTML = C.testimonials.map(t => `
      <article class="card reveal">
        <h3>${escapeHtml(t.name)}</h3>
        <p class="muted">${escapeHtml(t.text)}</p>
      </article>
    `).join("");
    $$(".reveal", tWrap).forEach(el => io.observe(el));
  }

  // FAQ
  const faqWrap = $("#faqWrap");
  if (faqWrap) {
    faqWrap.innerHTML = C.faq.map(f => `
      <div class="faq-item">
        <button class="faq-q" type="button" aria-expanded="false">
          <span>${escapeHtml(f.q)}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-a">${escapeHtml(f.a)}</div>
      </div>
    `).join("");
  }
  if (faqWrap) {
    faqWrap.addEventListener("click", (e) => {
      const q = e.target.closest(".faq-q");
      if (!q) return;
      const item = q.closest(".faq-item");
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Contact form -> WhatsApp
  const contactForm = $("#contactForm");
  const formHint = $("#formHint");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(contactForm);
      const name = (fd.get("name") || "").toString().trim();
      const phone = (fd.get("phone") || "").toString().trim();
      const msg = (fd.get("msg") || "").toString().trim();

      const text = `السلام عليكم\nالاسم: ${name}\nرقم: ${phone}\nالرسالة: ${msg}`;
      const url = `${waBase}?text=${encodeURIComponent(text)}`;

      if (formHint) formHint.textContent = "بيتم فتح واتساب...";
      window.open(url, "_blank");
    });
  }

  // LocalBusiness JSON-LD (SEO)
  const ld = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "name": C.brand,
    "telephone": C.phoneTel,
    "areaServed": "Dakahlia, Egypt",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Dakahlia",
      "addressLocality": C.cityLine
    },
    "sameAs": [C.facebookUrl].filter(Boolean)
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);

  // Update duplicated fields + footer binds
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const brand2 = document.getElementById("brandName2");
  if (brand2) brand2.textContent = C.brand;

  const city2 = document.getElementById("cityLine2");
  if (city2) city2.textContent = C.cityLine;

  const gov2 = document.getElementById("govLine2");
  if (gov2) gov2.textContent = C.governorate;

  const phone2 = document.getElementById("phoneDisplay2");
  if (phone2) phone2.textContent = C.phoneDisplay;

  setHref("telFooter", tel);
  setHref("telBottom", tel);

  const waCTA = `${waBase}?text=${encodeURIComponent("عاوز تسعير تقريبي - هبعت المقاسات والصور")}`;
  setHref("waBtn2", waCTA);
  setHref("waCTA", waCTA);
  setHref("waFooter", waCTA);
  setHref("waBottom", waCTA);

  const igLink = document.getElementById("igLink");
  if (igLink) igLink.style.display = C.instagramUrl ? "block" : "none";

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
})();
