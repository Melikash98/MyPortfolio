(() => {
  "use strict";
  if (!document.getElementById("cw-fab")) return;

  const API = "https://mysite-chat.melika-shooryabi98.workers.dev";

  // ⚠️ اسم واقعی فایل صفحه‌ی donate را اینجا بگذار
  const DONATE_URL = location.pathname.toLowerCase().includes("/html/")
    ? "donait.html"
    : "html/donait.html";

  // زمان‌ها (میلی‌ثانیه)
  const T = {
    welcomeDelay: 2500,   // تا نمایش حباب خوش‌آمد
    welcomeStay: 9000,    // مدت ماندن حباب خوش‌آمد
    coffeeDelay: 1200,    // بعد از بستن چت تا حباب قهوه
    coffeeStay: 10000,    // مدت ماندن حباب قهوه قبل از تبدیل به پیام متنی
    idleCoffee: 45000,    // چت باز ولی بی‌فعالیت → پیام متنی قهوه
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

  /* ---------- helpers ---------- */
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
  let since = 0, greeted = false;
  const lead = { name: store.get("cw_name") || "", email: "", question: "" };
  let step = lead.name ? 3 : 0;

  const isOpen = () => box.classList.contains("open");

  function add(text, who) {
    const d = el("div", "cw-m " + who, text);
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }
  const reply = text => setTimeout(() => add(text, "bot"), 600);

  const post = (path, body) => fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  /* ---------- page awareness ---------- */
  function currentSection() {
    const mid = innerHeight / 2;
    for (const s of document.querySelectorAll("main section.section[id]")) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) return s.id;
    }
    return "";
  }

  function getPageInfo() {
    const path = location.pathname.toLowerCase();
    const params = new URLSearchParams(location.search);
    const projectRoot = document.querySelector('main[data-record-collection="projects"]');

    if (projectRoot || path.endsWith("/projects.html")) {
      const id = params.get("id") || (projectRoot && projectRoot.dataset.recordDocumentId) || "";
      const domEl = document.querySelector('[data-record-field="appName"]');
      const domName = domEl ? domEl.textContent.trim() : "";
      const name = PROJECT_NAMES[id] || domName || id || "unknown";
      return `Project page › ${name}` + (id ? ` (${id})` : "");
    }
    if (path.includes("donait") || document.querySelector('main[data-record-document-id="donation"]')) {
      return "Donation page";
    }
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

  /* ---------- thought bubble ---------- */
  const bubble = el("div");
  bubble.id = "cw-bubble";
  bubble.setAttribute("role", "status");
  document.body.appendChild(bubble);

  let bubbleTimer = null;

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
    bubble.classList.add("show");

    bubbleTimer = setTimeout(() => { hideBubble(); if (onIgnored) onIgnored(); }, stay);
  }

  // کلیک روی حباب خوش‌آمد → باز شدن چت
  bubble.addEventListener("click", () => {
    if (bubble.dataset.kind === "welcome") toggle(true);
  });

  function showWelcome() {
    if (session.get("cw_welcome") || isOpen()) return;
    session.set("cw_welcome", "1");
    showBubble("welcome", b => {
      b.textContent = lead.name
        ? `Welcome back, ${lead.name}! 👋 Anything I can help with?`
        : "Hello & welcome! 👋 Have a question? Just ask me!";
    }, { stay: T.welcomeStay });
  }

  /* ---------- coffee ---------- */
  function coffeeLink() {
    const a = el("a", "cw-coffee");
    a.href = DONATE_URL;
    const i = el("i", "fa-solid fa-mug-saucer");
    i.setAttribute("aria-hidden", "true");
    a.append(i, el("span", "", "Let's have a coffee"));
    return a;
  }

  let coffeeTextSent = false;
  function sendCoffeeText() {            // به‌صورت پیام متنی داخل چت
    if (coffeeTextSent) return;
    coffeeTextSent = true;
    const d = el("div", "cw-m bot", "Could you treat me to a coffee? ☕");
    d.appendChild(coffeeLink());
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    if (!isOpen()) fab.classList.add("has-new");
  }

  let coffeePending = false;
  function scheduleCoffeeBubble() {      // بعد از بستن چت
    if (session.get("cw_coffee") || coffeePending) return;
    coffeePending = true;
    setTimeout(() => {
      coffeePending = false;
      if (isOpen()) return;
      session.set("cw_coffee", "1");
      showBubble("coffee", b => {
        b.append(el("p", "cw-bubble-text", "Could you treat me to a coffee? ☕"), coffeeLink());
      }, { stay: T.coffeeStay, onIgnored: sendCoffeeText });   // بسته نشد → پیام متنی
    }, T.coffeeDelay);
  }

  /* ---------- chat open / close ---------- */
  let idleTimer = null;

  function toggle(open) {
    box.classList.toggle("open", open);
    clearTimeout(idleTimer);
    if (open) {
      hideBubble();
      fab.classList.remove("has-new");
      $("cw-input").focus();
      if (!greeted) {
        greeted = true;
        add(step === 3 ? `Welcome back, ${lead.name}! 👋 How can I help?` : "Hi! 👋 How can I help you?", "bot");
      }
      idleTimer = setTimeout(sendCoffeeText, T.idleCoffee);
    }
  }
  function closeChat() { toggle(false); scheduleCoffeeBubble(); }

  fab.onclick = () => (isOpen() ? closeChat() : toggle(true));
  $("cw-close").onclick = closeChat;

  /* ---------- form ---------- */
  $("cw-form").onsubmit = async e => {
    e.preventDefault();
    const text = $("cw-input").value.trim();
    if (!text) return;
    $("cw-input").value = "";
    add(text, "me");

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
        reply("Thank you! 🙏 I've received your message and will reply here as soon as I can.");
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

  /* ---------- polling ---------- */
  async function poll() {
    if (document.hidden) return;
    try {
      const r = await fetch(`${API}/poll?sid=${sid}&since=${since}`);
      const data = await r.json();
      data.forEach(m => {
        add(m.text, "bot");
        since = Math.max(since, m.id);
        if (!isOpen()) fab.classList.add("has-new");
      });
    } catch (e) { }
  }
  setInterval(poll, 3000);

  setTimeout(showWelcome, T.welcomeDelay);
})();