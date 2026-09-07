const ACCESS_KEY = "d8351e79-e331-421a-b43b-71389cc350c0";

const nav = document.querySelector("#site-nav");
const toggle = document.querySelector(".nav-toggle");
const header = document.querySelector(".site-header");
const form = document.querySelector("#inquiry-form");
const statusEl = document.querySelector(".form-status");

toggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("scroll", () => {
  header?.classList.toggle("scrolled", window.scrollY > 8);
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

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
