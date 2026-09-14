import Lenis from "lenis";
import "lenis/dist/lenis.css";

const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

const nav = document.querySelector("#site-nav");
const toggle = document.querySelector(".nav-toggle");
const header = document.querySelector(".site-header");
const form = document.querySelector("#inquiry-form");
const statusEl = document.querySelector(".form-status");

let lenis = null;

function setHeaderScrolled(offset) {
  header?.classList.toggle("scrolled", offset > 8);
}

function setMenuOpen(open) {
  nav?.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  toggle?.setAttribute("aria-expanded", String(open));
  if (toggle) toggle.textContent = open ? "Close" : "Menu";
  if (open) lenis?.stop();
  else lenis?.start();
}

toggle?.addEventListener("click", () => {
  setMenuOpen(!nav.classList.contains("open"));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenuOpen(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) setMenuOpen(false);
});

window.addEventListener("scroll", () => {
  if (lenis) return;
  setHeaderScrolled(window.scrollY);
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  if (!ACCESS_KEY) {
    statusEl.textContent = "Form is not configured. Add VITE_WEB3FORMS_ACCESS_KEY locally or as a GitHub Actions secret.";
    statusEl.className = "form-status err";
    return;
  }

  const submit = form.querySelector('button[type="submit"]');
  const payload = new FormData(form);
  payload.set("access_key", ACCESS_KEY);
  payload.set("subject", "New inquiry from VectorEdge AI");
  payload.set("from_name", "VectorEdge AI website");

  submit.disabled = true;
  statusEl.textContent = "Sending…";
  statusEl.className = "form-status";

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: payload,
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Could not send your inquiry.");
    }
    form.reset();
    statusEl.textContent = "Received. We will reply within 24 hours.";
    statusEl.classList.add("ok");
  } catch (error) {
    statusEl.textContent = error.message || "Something went wrong. Please email us directly.";
    statusEl.classList.add("err");
  } finally {
    submit.disabled = false;
  }
});

function createNeuralField(canvas, host, options = {}) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const followPointer = Boolean(options.followPointer);
  const theme = options.theme || "hero";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");

  let width = 0;
  let height = 0;
  let nodes = [];
  let visible = true;
  const mouse = { x: 0, y: 0, active: false };
  const spotlight = { x: 0, y: 0 };

  const PRIMARY = { r: 199, g: 0, b: 0 };
  const GOLD = { r: 255, g: 193, b: 24 };
  const CHARCOAL = { r: 44, g: 44, b: 44 };
  const CREAM = { r: 243, g: 243, b: 233 };

  function mix(a, b, t) {
    return {
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t,
    };
  }

  function rgba(color, alpha) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }

  function seedNodes() {
    const divisor = theme === "tile" ? 4200 : 9000;
    const min = theme === "tile" ? 32 : 42;
    const max = theme === "tile" ? 78 : 110;
    const count = Math.max(min, Math.min(max, Math.floor((width * height) / divisor)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.2 + Math.random() * 2,
      vx: (Math.random() - 0.5) * (theme === "tile" ? 0.22 : 0.28),
      vy: (Math.random() - 0.5) * (theme === "tile" ? 0.22 : 0.28),
    }));
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.floor(rect.width));
    const nextHeight = Math.max(1, Math.floor(rect.height));
    const oldWidth = width;
    const oldHeight = height;
    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (nodes.length && oldWidth && oldHeight) {
      const ratio = (width * height) / (oldWidth * oldHeight);
      if (ratio > 1.4 || ratio < 0.7) {
        seedNodes();
        spotlight.x = width * 0.52;
        spotlight.y = height * 0.4;
      } else {
        const sx = width / oldWidth;
        const sy = height / oldHeight;
        for (const node of nodes) {
          node.x *= sx;
          node.y *= sy;
        }
        spotlight.x *= sx;
        spotlight.y *= sy;
      }
    } else {
      seedNodes();
      spotlight.x = width * 0.52;
      spotlight.y = height * 0.4;
    }

    if (shouldDraw()) draw(performance.now());
  }

  function shouldDraw() {
    if (!visible) return false;
    if (theme === "tile" && !host.classList.contains("is-active")) return false;
    return true;
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    const follow = followPointer && finePointer.matches && !reducedMotion.matches && mouse.active;
    const pulse = reducedMotion.matches ? 0.45 : Math.sin(time / 1800) * 0.5 + 0.5;
    const targetX = follow ? mouse.x : width * (0.48 + (pulse - 0.5) * 0.28);
    const targetY = follow ? mouse.y : height * (0.4 + (pulse - 0.5) * 0.16);
    const ease = follow ? 0.16 : 0.045;
    spotlight.x += (targetX - spotlight.x) * ease;
    spotlight.y += (targetY - spotlight.y) * ease;

    const radius = Math.min(width, height) * (follow ? 0.36 : 0.32);
    const connectDist = Math.min(theme === "tile" ? 168 : 190, Math.max(90, width * 0.11));

    if (!reducedMotion.matches) {
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }
    }

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > connectDist) continue;

        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const light = Math.max(0, 1 - Math.hypot(midX - spotlight.x, midY - spotlight.y) / radius);
        const strength = (1 - dist / connectDist) * (0.14 + light * 0.7);
        if (strength < 0.04) continue;

        if (theme === "tile") {
          ctx.strokeStyle = rgba(mix(CREAM, GOLD, 0.35 + light * 0.55), Math.min(0.34, strength * 0.62));
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = rgba(mix(CHARCOAL, mix(PRIMARY, GOLD, light), Math.max(0.2, light)), strength);
          ctx.lineWidth = light > 0.45 ? 1.35 : 1;
        }
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (const node of nodes) {
      const light = Math.max(0, 1 - Math.hypot(node.x - spotlight.x, node.y - spotlight.y) / radius);
      if (theme === "tile") {
        ctx.fillStyle = rgba(mix(CREAM, GOLD, 0.3 + light * 0.65), 0.16 + light * 0.28);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + light * 1.1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const color = mix(CHARCOAL, mix(PRIMARY, GOLD, light), Math.max(0.15, light));
        ctx.fillStyle = rgba(color, 0.28 + light * 0.72);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + light * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function loop(time) {
    if (shouldDraw()) draw(time);
    requestAnimationFrame(loop);
  }

  function onPointerMove(event) {
    if (!finePointer.matches) return;
    const rect = host.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.active = true;
  }

  function onPointerLeave() {
    mouse.active = false;
  }

  resize();
  if (shouldDraw()) draw(0);

  if (!reducedMotion.matches) {
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  if (typeof ResizeObserver !== "undefined") {
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(host);
  }

  if (followPointer) {
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
  }

  if (theme === "tile") {
    const classObserver = new MutationObserver(() => {
      if (host.classList.contains("is-active")) resize();
    });
    classObserver.observe(host, { attributes: true, attributeFilter: ["class"] });
  }

  if (theme !== "tile" && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(host);
  }

  return { resize };
}

function initHeroNetwork() {
  const canvas = document.querySelector("#hero-network");
  const hero = canvas?.closest(".hero");
  if (!canvas || !hero) return;
  createNeuralField(canvas, hero, { followPointer: true, theme: "hero" });
}

function initHeroKinetic() {
  const hero = document.querySelector(".hero");
  const video = document.querySelector(".hero-kinetic");
  if (!hero || !video) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) return;

  function activate() {
    hero.classList.add("has-kinetic");
  }

  video.addEventListener("loadeddata", activate);
  video.addEventListener("canplay", () => {
    video.play().catch(() => {});
  });

  if (video.readyState >= 2) activate();
  else {
    video.load();
    window.setTimeout(() => {
      if (video.readyState >= 2) activate();
    }, 1200);
  }
}

initHeroNetwork();
initHeroKinetic();

function initSmoothScroll() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) return;

  const headerOffset =
    -(Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64) - 20;

  lenis = new Lenis({
    autoRaf: true,
    smoothWheel: true,
    lerp: 0.08,
    wheelMultiplier: 0.9,
    syncTouch: false,
    stopInertiaOnNavigate: true,
    anchors: {
      offset: headerOffset,
      duration: 1.2,
    },
  });

  lenis.on("scroll", ({ scroll }) => {
    setHeaderScrolled(scroll);
  });
  setHeaderScrolled(window.scrollY);
}

initSmoothScroll();

function initWorkCarousel() {
  const scroller = document.querySelector(".quote-grid");
  const prev = document.querySelector(".work-nav.prev");
  const next = document.querySelector(".work-nav.next");
  if (!scroller || !prev || !next) return;

  function cardStep() {
    const card = scroller.querySelector(".work-card");
    if (!card) return scroller.clientWidth * 0.85;
    const styles = getComputedStyle(scroller);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 16;
    return card.getBoundingClientRect().width + gap;
  }

  function updateButtons() {
    const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth - 2);
    prev.disabled = scroller.scrollLeft <= 2;
    next.disabled = scroller.scrollLeft >= max;
  }

  prev.addEventListener("click", () => {
    scroller.scrollBy({ left: -cardStep(), behavior: "smooth" });
  });

  next.addEventListener("click", () => {
    scroller.scrollBy({ left: cardStep(), behavior: "smooth" });
  });

  scroller.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);
  updateButtons();
}

initWorkCarousel();

function initCapabilities() {
  const grid = document.querySelector(".capabilities-grid");
  if (!grid) return;

  const tiles = [...grid.querySelectorAll(".cap-tile")];
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const fields = tiles.map((tile) => {
    const canvas = tile.querySelector(".cap-network");
    if (!canvas) return null;
    return createNeuralField(canvas, tile, { followPointer: false, theme: "tile" });
  });

  function activate(tile) {
    tiles.forEach((item) => item.classList.toggle("is-active", item === tile));
    grid.classList.toggle("has-active", Boolean(tile));
    requestAnimationFrame(() => {
      fields.forEach((field) => field?.resize());
    });
  }

  tiles.forEach((tile) => {
    tile.addEventListener("pointerenter", () => {
      if (canHover.matches) activate(tile);
    });
    tile.addEventListener("focus", () => activate(tile));
    tile.addEventListener("click", () => {
      if (!canHover.matches && tile.classList.contains("is-active")) {
        activate(null);
        return;
      }
      activate(tile);
    });
    tile.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      tile.click();
    });
  });

  grid.addEventListener("pointerleave", () => {
    if (canHover.matches) activate(null);
  });
}

initCapabilities();

function initProcess() {
  const section = document.querySelector(".process");
  const steps = [...(section?.querySelectorAll(".process-steps li") || [])];
  if (!section || steps.length === 0) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let index = 0;
  let timer = 0;
  let engaged = false;
  let inView = false;

  function setCurrent(next) {
    steps.forEach((step, i) => step.classList.toggle("is-current", i === next));
  }

  function startLoop() {
    if (engaged || reducedMotion.matches || timer) return;
    setCurrent(index);
    timer = window.setInterval(() => {
      index = (index + 1) % steps.length;
      setCurrent(index);
    }, 3200);
  }

  function stopLoop() {
    window.clearInterval(timer);
    timer = 0;
  }

  function showTimeline() {
    if (engaged) return;
    engaged = true;
    stopLoop();
    steps.forEach((step) => step.classList.remove("is-current"));
    section.classList.add("is-timeline");
  }

  function resetIdle() {
    if (!engaged) return;
    engaged = false;
    section.classList.remove("is-timeline");
    index = 0;
    setCurrent(0);
    if (inView) startLoop();
  }

  if (reducedMotion.matches) {
    section.classList.add("is-timeline");
    engaged = true;
    return;
  }

  setCurrent(0);

  section.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    if (engaged) resetIdle();
    else showTimeline();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!engaged) return;
    if (!section.contains(event.target)) resetIdle();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) startLoop();
        else {
          stopLoop();
          resetIdle();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(section);
  } else {
    inView = true;
    startLoop();
  }
}

initProcess();
