/* ================================================
   MELIKA SHOORYABI - WEBSITE CHAT WIDGET
   Knowledge Base + Cloudflare Worker + Telegram
   No OpenAI API
   Keeps the existing cw-robot template and artwork.
================================================ */

(() => {
    "use strict";

    function initChatWidget() {
        const API = "https://mysite-chat.melika-shooryabi98.workers.dev";
        const DONATION_URL = "";
        const $ = id => document.getElementById(id);

        const required = [
            "cw-robot", "cw-fab", "cw-avatar", "cw-box", "cw-close",
            "cw-msgs", "cw-form", "cw-input", "cw-send"
        ];

        for (const id of required) {
            if (!$(id)) {
                console.warn("Chat widget is missing:", id);
                return;
            }
        }

        const store = {
            get(key) {
                try {
                    return localStorage.getItem(key);
                } catch {
                    return null;
                }
            },

            set(key, value) {
                try {
                    localStorage.setItem(key, String(value));
                } catch {}
            },

            remove(key) {
                try {
                    localStorage.removeItem(key);
                } catch {}
            }
        };

        function createId() {
            if (window.crypto?.randomUUID) {
                return crypto.randomUUID();
            }

            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;

                return (
                    c === "x"
                        ? r
                        : (r & 3 | 8)
                ).toString(16);
            });
        }

        let sid = store.get("cw_sid");

        if (
            !sid ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sid)
        ) {
            sid = createId();
            store.set("cw_sid", sid);
        }

        // Clone the original robot template.
        // The original artwork and image path remain unchanged.

        const robotTemplate = $("cw-robot");
        const fab = $("cw-fab");
        const avatar = $("cw-avatar");

        fab.replaceChildren(
            robotTemplate.content.cloneNode(true)
        );

        avatar.replaceChildren(
            robotTemplate.content.cloneNode(true)
        );

        const box = $("cw-box");
        const msgs = $("cw-msgs");
        const input = $("cw-input");
        const form = $("cw-form");
        const sendButton = $("cw-send");
        const welcome = $("cw-welcome");
        const coffee = $("cw-coffee");

        const lead = {
            name:
                store.get("cw_pending_name") ||
                store.get("cw_name") ||
                "",

            email:
                store.get("cw_email") ||
                "",

            question:
                store.get("cw_pending_question") ||
                ""
        };

        const leadDone =
            store.get("cw_lead_done") === "1" ||
            Boolean(store.get("cw_name"));

        let step = leadDone
            ? 3
            : lead.question
                ? (lead.name ? 2 : 1)
                : 0;

        let since =
            Number(store.get("cw_since") || 0) || 0;

        let busy = false;
        let greeted = false;

        // ================================================
        // MESSAGE DISPLAY
        // ================================================

        function addMessage(messageText, sender) {
            const node = document.createElement("div");

            node.className = `cw-m ${sender}`;
            node.textContent = String(messageText ?? "");

            msgs.appendChild(node);
            msgs.scrollTop = msgs.scrollHeight;
        }

        function delayedReply(messageText) {
            setTimeout(() => {
                addMessage(messageText, "bot");
            }, 450);
        }

        // ================================================
        // API REQUEST
        // ================================================

        async function post(endpoint, payload) {
            const controller = new AbortController();

            const timeout = setTimeout(
                () => controller.abort(),
                20000
            );

            try {
                const response = await fetch(API + endpoint, {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                const result = await response.json()
                    .catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        result.error || "Request failed"
                    );
                }

                return result;

            } finally {
                clearTimeout(timeout);
            }
        }

        // ================================================
        // VISITOR INFORMATION
        // ================================================

        function getMeta() {
            const ua = navigator.userAgent;

            const deviceType =
                /iPad|Tablet|PlayBook|Silk/i.test(ua) ||
                (/Android/i.test(ua) && !/Mobile/i.test(ua))
                    ? "Tablet"
                    : /Mobi|iPhone|Android/i.test(ua)
                        ? "Mobile"
                        : "Desktop";

            const os =
                /Windows/i.test(ua)
                    ? "Windows"
                    : /Android/i.test(ua)
                        ? "Android"
                        : /iPhone|iPad|iPod/i.test(ua)
                            ? "iOS"
                            : /Mac OS X/i.test(ua)
                                ? "macOS"
                                : /Linux/i.test(ua)
                                    ? "Linux"
                                    : "Unknown";

            const browser =
                /Edg\//.test(ua)
                    ? "Edge"
                    : /OPR\/|Opera/i.test(ua)
                        ? "Opera"
                        : /Firefox\//.test(ua)
                            ? "Firefox"
                            : /Chrome\//.test(ua)
                                ? "Chrome"
                                : /Safari\//.test(ua)
                                    ? "Safari"
                                    : "Unknown";

            return {
                device: `${deviceType} · ${os} · ${browser}`,

                screen:
                    `${screen.width}x${screen.height}`,

                lang: navigator.language,

                tz:
                    Intl.DateTimeFormat()
                        .resolvedOptions()
                        .timeZone,

                localTime:
                    new Date().toLocaleString(),

                page: location.href,

                ref: document.referrer
            };
        }

        // ================================================
        // AUTOMATIC PAGE AND PROJECT DETECTION
        // ================================================

        function getPageContext() {
            const path = location.pathname;
            const lowerPath = path.toLowerCase();

            const projectElement =
                document.querySelector("[data-project-id]");

            let projectId =
                projectElement?.dataset.projectId ||
                document.body.dataset.projectId ||
                "";

            if (!projectId) {
                const match = path.match(
                    /\/projects?\/([^/]+)/i
                );

                if (match) {
                    try {
                        projectId = decodeURIComponent(match[1])
                            .replace(/\.html$/i, "")
                            .toLowerCase();

                    } catch {
                        projectId = "";
                    }
                }
            }

            projectId = String(projectId)
                .trim()
                .toLowerCase();

            const projectPage = Boolean(projectId);

            const projectsPage =
                !projectPage &&
                (
                    /\/projects\/?$/i.test(lowerPath) ||
                    /projects\.html$/i.test(lowerPath) ||
                    document.body.dataset.pageType === "projects"
                );

            const homePage =
                lowerPath === "/" ||
                lowerPath === "/index.html";

            let type = "other";

            if (projectPage) {
                type = "project";
            } else if (projectsPage) {
                type = "projects";
            } else if (homePage) {
                type = "home";
            } else if (document.body.dataset.pageType) {
                type = document.body.dataset.pageType;
            }

            const title =
                document.title ||
                document.querySelector("h1")?.textContent?.trim() ||
                "";

            const projectName =
                projectElement?.dataset.projectName ||
                document.querySelector("h1")?.textContent?.trim() ||
                projectId.replace(/-/g, " ");

            const contentElement =
                document.querySelector("[data-page-content]") ||
                document.querySelector("main") ||
                document.querySelector(".main-content") ||
                document.body;

            const clone = contentElement.cloneNode(true);

            clone.querySelectorAll(
                "script, style, nav, footer, #cw-box, #cw-fab, #cw-welcome"
            ).forEach(element => {
                element.remove();
            });

            const content = (
                clone.innerText ||
                clone.textContent ||
                ""
            )
                .replace(/[ \t]+\n/g, "\n")
                .replace(/\n{3,}/g, "\n\n")
                .trim()
                .slice(0, 5000);

            return {
                type,
                path,
                title,
                projectId,
                projectName: projectPage ? projectName : "",
                content
            };
        }

        // ================================================
        // OPEN AND CLOSE CHAT
        // ================================================

        function hideWelcome() {
            if (welcome) {
                welcome.classList.remove("visible");
            }
        }

        function toggleChat(open) {
            box.classList.toggle("open", open);

            if (!open) return;

            hideWelcome();
            fab.classList.remove("has-new");

            setTimeout(() => {
                input.focus();
            }, 50);

            if (!greeted) {
                greeted = true;

                addMessage(
                    step === 3
                        ? `Welcome back, ${lead.name}! 👋 How can I help?`
                        : "Hi! 👋 How can I help you?",
                    "bot"
                );
            }
        }

        fab.onclick = () => {
            toggleChat(!box.classList.contains("open"));
        };

        $("cw-close").onclick = () => {
            toggleChat(false);
        };

        // ================================================
        // DONATION LINK
        // ================================================

        if (coffee && DONATION_URL.trim()) {
            coffee.href = DONATION_URL.trim();
            coffee.hidden = false;
        }

        // ================================================
        // WELCOME POPUP
        // ================================================

        if (welcome) {
            const closeWelcome = $("cw-welcome-close");
            const openWelcome = $("cw-welcome-open");

            if (closeWelcome) {
                closeWelcome.onclick = hideWelcome;
            }

            if (openWelcome) {
                openWelcome.onclick = () => {
                    toggleChat(true);
                };
            }

            let shown = false;

            try {
                shown =
                    sessionStorage.getItem("cw_welcome_seen") === "1";
            } catch {}

            if (!shown) {
                setTimeout(() => {
                    if (!box.classList.contains("open")) {
                        welcome.classList.add("visible");

                        try {
                            sessionStorage.setItem(
                                "cw_welcome_seen",
                                "1"
                            );
                        } catch {}

                        setTimeout(hideWelcome, 7500);
                    }
                }, 2500);
            }
        }

        // ================================================
        // MESSAGE SUBMISSION
        // ================================================

        form.onsubmit = async event => {
            event.preventDefault();

            if (busy) return;

            const messageText = input.value.trim();

            if (!messageText) return;

            input.value = "";
            addMessage(messageText, "me");

            // STEP 0: FIRST QUESTION

            if (step === 0) {
                lead.question = messageText;

                store.set(
                    "cw_pending_question",
                    messageText
                );

                step = 1;

                delayedReply(
                    "Thanks for reaching out! 🙌 What's your name?"
                );

                return;
            }

            // STEP 1: VISITOR NAME

            if (step === 1) {
                lead.name = messageText.slice(0, 80);

                store.set(
                    "cw_pending_name",
                    lead.name
                );

                step = 2;

                delayedReply(
                    `Nice to meet you, ${lead.name}! What's your email address?`
                );

                return;
            }

            // STEP 2: VISITOR EMAIL AND FIRST QUESTION

            if (step === 2) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(messageText)) {
                    delayedReply(
                        "That email doesn't look right. Could you check it and send it again?"
                    );

                    return;
                }

                lead.email = messageText;

                busy = true;
                input.disabled = true;
                sendButton.disabled = true;

                try {
                    const result = await post("/lead", {
                        sid,
                        name: lead.name,
                        email: lead.email,
                        text: lead.question,
                        meta: getMeta(),
                        pageContext: getPageContext()
                    });

                    step = 3;

                    store.set("cw_name", lead.name);
                    store.set("cw_email", lead.email);
                    store.set("cw_lead_done", "1");

                    store.remove("cw_pending_question");
                    store.remove("cw_pending_name");

                    addMessage(
                        result.reply ||
                        "Thank you! Your message has been received.",
                        "bot"
                    );

                } catch (error) {
                    console.error(
                        "Lead submission failed:",
                        error
                    );

                    delayedReply(
                        "I couldn't submit your message. Please check your connection and try again."
                    );

                } finally {
                    busy = false;
                    input.disabled = false;
                    sendButton.disabled = false;
                    input.focus();
                }

                return;
            }

            // STEP 3: KNOWLEDGE BASE OR HUMAN SUPPORT

            if (step === 3) {
                busy = true;
                input.disabled = true;
                sendButton.disabled = true;

                try {
                    const result = await post("/chat", {
                        sid,
                        name: lead.name,
                        text: messageText,
                        messageId: createId(),
                        pageContext: getPageContext()
                    });

                    if (!result.reply) {
                        throw new Error(
                            "Empty response from support service"
                        );
                    }

                    addMessage(result.reply, "bot");

                } catch (error) {
                    console.error(
                        "Chat message failed:",
                        error
                    );

                    delayedReply(
                        "Sorry! The support chat is temporarily unavailable. Please try again."
                    );

                } finally {
                    busy = false;
                    input.disabled = false;
                    sendButton.disabled = false;
                    input.focus();
                }
            }
        };

        // ================================================
        // RECEIVE TELEGRAM OWNER REPLIES
        // ================================================

        async function pollReplies() {
            if (document.hidden) return;

            try {
                const url = new URL(API + "/poll");

                url.searchParams.set("sid", sid);
                url.searchParams.set("since", String(since));

                const response = await fetch(
                    url.toString(),
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );

                if (!response.ok) return;

                const messages = await response.json();

                if (!Array.isArray(messages)) return;

                for (const item of messages) {
                    const id = Number(item.id);

                    if (
                        !item.text ||
                        !Number.isFinite(id) ||
                        id <= since
                    ) {
                        continue;
                    }

                    addMessage(item.text, "bot");

                    since = Math.max(since, id);

                    if (!box.classList.contains("open")) {
                        fab.classList.add("has-new");
                    }
                }

                store.set("cw_since", since);

            } catch (error) {
                console.warn(
                    "Chat polling failed:",
                    error
                );
            }
        }

        pollReplies();

        setInterval(pollReplies, 3000);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initChatWidget,
            { once: true }
        );
    } else {
        initChatWidget();
    }
})();