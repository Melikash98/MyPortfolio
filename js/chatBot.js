(() => {
  "use strict";
  if (!document.getElementById("cw-fab") || !document.getElementById("cw-robot")) return;
  if (window.__cwInit) return;
  window.__cwInit = true;

  const API = "https://mysite-chat.melika-shooryabi98.workers.dev";

  const DONATE_URL = location.pathname.toLowerCase().includes("/html/")
    ? "donait.html"
    : "html/donait.html";

  const T = {
    welcomeDelay: 1500,
    welcomeStay: 9000,
    coffeeDelay: 1200,
    coffeeStay: 10000,
    idleCoffee: 45000,
  };

  const PROJECT_NAMES = {
    "project-haus-suche": "Haus Suche",
    "project-brewbite": "BrewBite",
    "project-easyemail": "EasyEmail",
    "project-editify": "Editify",
    "project-morphnavbar": "MorphNavBar",
    "project-portfolio-website-1": "Portfolio Website 1",
    "project-portfolio-website-2": "Portfolio Website 2",
    "project-admin-panel": "Admin Panel",
    "project-fanjano-app": "Fanjano",
    "project-postgap": "PostGap",
    "project-plavio-1": "PLAVIO",
    "project-plavio-2": "PLAVIO",
    "project-plavio-3": "PLAVIO",
  };
  const SECTION_LABELS = {
    home: "Home", experience: "Resume", skills: "Skills", services: "Services",
    projects: "Projects", tutorials: "Tutorials", comments: "Testimonials", contact: "Contact",
  };

  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  const makeStore = get => ({
    get: k => { try { return get().getItem(k); } catch { return null; } },
    set: (k, v) => { try { get().setItem(k, v); } catch { } },
  });
  const store = makeStore(() => localStorage);
  const session = makeStore(() => sessionStorage);

  let sid = store.get("cw_sid");
  if (!sid) { sid = crypto.randomUUID(); store.set("cw_sid", sid); }

  const robot = $("cw-robot").innerHTML;
  $("cw-fab").innerHTML = robot;
  $("cw-avatar").innerHTML = robot;

  const box = $("cw-box"), msgs = $("cw-msgs"), fab = $("cw-fab");
  const lead = { name: store.get("cw_name") || "", email: "", question: "" };
  let step = lead.name ? 3 : 0;

  let since = +store.get("cw_since") || 0;
  let history = [];
  try { history = JSON.parse(store.get("cw_history") || "[]"); } catch { }
  let greeted = history.length > 0;

  const isOpen = () => box.classList.contains("open");

  function add(text, who, keep = false) {
    msgs.appendChild(el("div", "cw-m " + who, text));
    msgs.scrollTop = msgs.scrollHeight;
    if (keep) {
      history.push({ text, who });
      history = history.slice(-50);
      store.set("cw_history", JSON.stringify(history));
    }
  }
  const reply = (text, keep = false) => setTimeout(() => add(text, "bot", keep), 600);

  history.forEach(m => add(m.text, m.who));

  function greet() {
    if (greeted) return;
    greeted = true;
    add(step === 3 ? `Welcome back, ${lead.name}! 👋 How can I help?` : "Hi! 👋 How can I help you?", "bot");
  }

  const post = (path, body) => fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  function currentSection() {
    const mid = innerHeight / 2;
    for (const s of document.querySelectorAll("main section.section[id]")) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) return s.id;
    }
    return "";
  }

  function getProject() {
    const root = document.querySelector('main[data-record-collection="projects"]');
    if (!root && !location.pathname.toLowerCase().endsWith("/projects.html")) return null;
    const id = new URLSearchParams(location.search).get("id") || (root && root.dataset.recordDocumentId) || "";
    const domEl = document.querySelector('[data-record-field="appName"]');
    const name = PROJECT_NAMES[id] || (domEl && domEl.textContent.trim()) || id || "this project";
    return { id, name };
  }

  function getPageInfo() {
    const path = location.pathname.toLowerCase();
    const p = getProject();
    if (p) return `Project page › ${p.name}` + (p.id ? ` (${p.id})` : "");
    if (path.includes("donait") || document.querySelector('main[data-record-document-id="donation"]')) return "Donation page";
    if (path.includes("loading")) return "Tutorial 'coming soon' page";
    if ($("home")) {
      const s = currentSection();
      return "Main page" + (s ? ` › ${SECTION_LABELS[s] || s} section` : "");
    }
    return document.title || path;
  }

  function getMeta() {
    const ua = navigator.userAgent;
    const type = (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) ? "Tablet"
      : /Mobi|iPhone|Android/i.test(ua) ? "Mobile" : "Desktop";
    const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android"
      : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS"
        : /Linux/.test(ua) ? "Linux" : "Unknown";
    const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera"
      : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome"
        : /Safari\//.test(ua) ? "Safari" : "Unknown";
    return {
      device: `${type} · ${os} · ${browser}`,
      screen: `${screen.width}x${screen.height}`,
      lang: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localTime: new Date().toLocaleString(),
      page: location.href,
      pageName: getPageInfo(),
      ref: document.referrer,
    };
  }

  const bubble = el("div");
  bubble.id = "cw-bubble";
  bubble.setAttribute("role", "status");
  document.body.appendChild(bubble);

  let bubbleTimer = null;

  function placeBubble() {
    const r = (fab.querySelector("img") || fab).getBoundingClientRect();
    bubble.style.left = Math.max(12, r.left) + "px";
    bubble.style.bottom = (document.documentElement.clientHeight - r.top + 40) + "px";
  }
  addEventListener("resize", () => { if (bubble.classList.contains("show")) placeBubble(); });

  function hideBubble() {
    clearTimeout(bubbleTimer);
    bubble.classList.remove("show");
  }

  function showBubble(kind, build, { stay, onIgnored, onDismissed } = {}) {
    clearTimeout(bubbleTimer);
    bubble.dataset.kind = kind;
    bubble.replaceChildren();

    const x = el("button", "cw-bubble-x", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Dismiss");
    x.onclick = e => { e.stopPropagation(); hideBubble(); if (onDismissed) onDismissed(); };

    const body = el("div", "cw-bubble-body");
    build(body);
    bubble.append(x, body);
    placeBubble();
    bubble.classList.add("show");

    bubbleTimer = setTimeout(() => { hideBubble(); if (onIgnored) onIgnored(); }, stay);
  }

  bubble.addEventListener("click", () => {
    if (bubble.dataset.kind === "welcome") toggle(true);
  });

  function whenRobotVisible(cb) {
    let tries = 0;
    const ready = () => {
      if (document.hidden) return false;
      const img = fab.querySelector("img");
      if (img && !(img.complete && img.naturalWidth > 0)) return false;
      if (fab.hasAttribute("data-aos") && !fab.classList.contains("aos-animate")) return false;
      const cs = getComputedStyle(fab);
      return cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.95;
    };
    const tick = () => {
      if (ready()) return setTimeout(cb, T.welcomeDelay);
      if (!document.hidden) tries++;
      if (tries < 60) setTimeout(tick, 300);
    };
    if (document.readyState === "complete") tick();
    else addEventListener("load", tick, { once: true });
  }

  function showWelcome() {
    const key = "cw_welcome:" + location.pathname + location.search;
    if (session.get(key) || isOpen()) return;
    session.set(key, "1");

    const p = getProject();
    const hello = lead.name ? `Welcome back, ${lead.name}! 👋` : "Hello & welcome! 👋";
    const ask = p
      ? `Curious about ${p.name}? Just ask me!`
      : (lead.name ? "Anything I can help with?" : "Have a question? Just ask me!");
    showBubble("welcome", b => { b.textContent = `${hello} ${ask}`; }, { stay: T.welcomeStay });
  }

  function coffeeLink() {
    const a = el("a", "cw-coffee");
    a.href = DONATE_URL;
    const i = el("i", "fa-solid fa-mug-saucer");
    i.setAttribute("aria-hidden", "true");
    a.append(i, el("span", "", "Let's have a coffee"));
    return a;
  }

  function sendCoffeeText() {
    if (session.get("cw_coffee_text")) return;
    session.set("cw_coffee_text", "1");
    greet();
    const d = el("div", "cw-m bot", "Could you treat me to a coffee? ☕");
    d.appendChild(coffeeLink());
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  let coffeePending = false;
  function scheduleCoffeeBubble() {
    if (session.get("cw_coffee") || coffeePending) return;
    coffeePending = true;
    setTimeout(() => {
      coffeePending = false;
      if (isOpen()) return;
      session.set("cw_coffee", "1");
      showBubble("coffee", b => {
        b.append(el("p", "cw-bubble-text", "Could you treat me to a coffee? ☕"), coffeeLink());
      }, { stay: T.coffeeStay, onIgnored: sendCoffeeText });
    }, T.coffeeDelay);
  }

  let idleTimer = null;
  const resetIdle = () => {
    clearTimeout(idleTimer);
    if (isOpen()) idleTimer = setTimeout(sendCoffeeText, T.idleCoffee);
  };

  function toggle(open) {
    box.classList.toggle("open", open);
    clearTimeout(idleTimer);
    if (open) {
      hideBubble();
      fab.classList.remove("has-new");
      $("cw-input").focus();
      greet();
      resetIdle();
    }
  }
  function closeChat() { toggle(false); scheduleCoffeeBubble(); }

  fab.onclick = () => (isOpen() ? closeChat() : toggle(true));
  $("cw-close").onclick = closeChat;

  $("cw-form").onsubmit = async e => {
    e.preventDefault();
    const text = $("cw-input").value.trim();
    if (!text) return;
    $("cw-input").value = "";
    add(text, "me", step === 3);
    resetIdle();

    if (step === 0) {
      lead.question = text; step = 1;
      return reply("Thanks for reaching out! 🙌 What's your name?");
    }
    if (step === 1) {
      lead.name = text.slice(0, 80); step = 2;
      return reply(`Nice to meet you, ${lead.name}! What's your email address?`);
    }
    if (step === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        return reply("That email doesn't look right. Could you check it and send it again?");
      }
      lead.email = text;
      try {
        const r = await post("/lead", {
          sid, name: lead.name, email: lead.email, text: lead.question, meta: getMeta(),
        });
        if (!r.ok) throw new Error("lead failed");
        step = 3;
        store.set("cw_name", lead.name);
        reply("Thank you! 🙏 I've received your message and will reply here as soon as I can.", true);
      } catch (err) {
        reply("Message not sent. Please send your email again to retry.");
      }
      return;
    }

    try {
      const r = await post("/send", { sid, text, name: lead.name, pageName: getPageInfo() });
      if (!r.ok) throw new Error("send failed");
    } catch (err) {
      reply("Message not sent. Please try again.");
    }
  };

  async function poll() {
    if (document.hidden) return;
    try {
      const r = await fetch(`${API}/poll?sid=${sid}&since=${since}`);
      const data = await r.json();
      if (!data.length) return;
      greet();
      data.forEach(m => {
        add(m.text, "bot", true);
        since = Math.max(since, m.id);
      });
      store.set("cw_since", String(since));
      if (!isOpen()) fab.classList.add("has-new");
    } catch (e) { }
  }
  setInterval(poll, 3000);

  whenRobotVisible(showWelcome);
})();