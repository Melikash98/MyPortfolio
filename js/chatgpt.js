document.addEventListener("DOMContentLoaded", () => {
    const robotTemplate = document.getElementById("cw-robot");
    const robotButton = document.getElementById("cw-fab");
    const robotAvatar = document.getElementById("cw-avatar");

    if (!robotTemplate || !robotButton) {
        console.error("Chat widget robot elements were not found.");
        return;
    }

    robotButton.replaceChildren(
        robotTemplate.content.cloneNode(true)
    );

    if (robotAvatar) {
        robotAvatar.replaceChildren(
            robotTemplate.content.cloneNode(true)
        );
    }
});

/* ================================================
   MELIKA SHOORYABI
   UNIVERSAL AI WEBSITE CHAT WIDGET

   Shared by every page of mshooryabi.com
   Cloudflare Worker + OpenAI + Telegram
================================================ */

(() => {

    "use strict";

    // ================================================
    // 1. CONFIGURATION
    // ================================================

    const API =
        "https://mysite-chat.melika-shooryabi98.workers.dev";

    // Add your real Buy Me a Coffee URL later.
    // Leave empty until you create your donation page.

    const DONATION_URL = "";

    const $ = id => document.getElementById(id);


    // ================================================
    // 2. CHECK REQUIRED HTML ELEMENTS
    // ================================================

    const requiredElements = [
        "cw-robot",
        "cw-fab",
        "cw-avatar",
        "cw-box",
        "cw-close",
        "cw-msgs",
        "cw-form",
        "cw-input",
        "cw-send"
    ];

    for (const id of requiredElements) {

        if (!$(id)) {
            console.warn(
                "Chat widget is missing:",
                id
            );
            return;
        }
    }


    // ================================================
    // 3. LOCAL STORAGE
    // ================================================

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
                localStorage.setItem(key, value);
            } catch {}
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch {}
        }

    };


    // ================================================
    // 4. VISITOR SESSION
    // ================================================

    function createId() {

        if (crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
            .replace(/[xy]/g, character => {

                const random = Math.random() * 16 | 0;

                const value =
                    character === "x"
                        ? random
                        : (random & 0x3 | 0x8);

                return value.toString(16);
            });
    }


    let sid = store.get("cw_sid");

    if (!sid) {
        sid = createId();
        store.set("cw_sid", sid);
    }


    // ================================================
    // 5. ROBOT AVATAR
    // ================================================

    const robotTemplate = $("cw-robot");

    const fab = $("cw-fab");

    const avatar = $("cw-avatar");

    fab.replaceChildren(
        robotTemplate.content.cloneNode(true)
    );

    avatar.replaceChildren(
        robotTemplate.content.cloneNode(true)
    );


    // ================================================
    // 6. MAIN ELEMENTS
    // ================================================

    const box = $("cw-box");

    const msgs = $("cw-msgs");

    const input = $("cw-input");

    const form = $("cw-form");

    const sendButton = $("cw-send");

    const welcome = $("cw-welcome");


    // ================================================
    // 7. VISITOR INFORMATION
    // ================================================

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


    const leadCompleted =
        store.get("cw_lead_done") === "1" ||
        Boolean(store.get("cw_name"));


    let step = leadCompleted
        ? 3
        : lead.question
            ? (lead.name ? 2 : 1)
            : 0;


    let since =
        Number(store.get("cw_since") || 0) || 0;

    let greeted = false;

    let busy = false;


    // ================================================
    // 8. MESSAGE DISPLAY
    // ================================================

    function add(text, who) {

        const message = document.createElement("div");

        message.className = "cw-m " + who;

        message.textContent = String(text ?? "");

        msgs.appendChild(message);

        msgs.scrollTop = msgs.scrollHeight;

    }


    function reply(text) {

        setTimeout(() => {
            add(text, "bot");
        }, 500);

    }


    // ================================================
    // 9. REQUEST HELPER
    // ================================================

    async function post(path, body) {

        const response = await fetch(API + path, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(body)

        });

        const data = await response.json()
            .catch(() => ({}));

        if (!response.ok) {

            throw new Error(
                data.error || "Request failed"
            );
        }

        return data;

    }


    // ================================================
    // 10. DEVICE INFORMATION
    // ================================================

    function getMeta() {

        const ua = navigator.userAgent;

        const type = (
            /iPad|Tablet|PlayBook|Silk/i.test(ua) ||
            (
                /Android/i.test(ua) &&
                !/Mobile/i.test(ua)
            )
        )
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

            device: `${type} · ${os} · ${browser}`,

            screen: `${screen.width}x${screen.height}`,

            lang: navigator.language,

            tz:
                Intl.DateTimeFormat()
                    .resolvedOptions()
                    .timeZone,

            localTime: new Date().toLocaleString(),

            page: location.href,

            ref: document.referrer

        };

    }


    // ================================================
    // 11. AUTOMATIC PAGE AND PROJECT DETECTION
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


        // Detect project from URL when no explicit ID exists.

        if (!projectId) {

            const match = path.match(
                /\/projects?\/([^/]+)/i
            );

            if (match) {

                projectId = decodeURIComponent(
                    match[1]
                )
                    .replace(/\.html$/i, "")
                    .toLowerCase();

            }

        }


        projectId = String(projectId)
            .trim()
            .toLowerCase();


        const isProject = Boolean(projectId);

        const isProjectsPage =
            !isProject &&
            (
                /\/projects\/?$/i.test(lowerPath) ||
                /projects\.html$/i.test(lowerPath) ||
                document.body.dataset.pageType === "projects"
            );


        const isHome =
            lowerPath === "/" ||
            lowerPath === "/index.html";


        let type = "other";

        if (isProject) {
            type = "project";
        } else if (isProjectsPage) {
            type = "projects";
        } else if (isHome) {
            type = "home";
        } else if (document.body.dataset.pageType) {
            type = document.body.dataset.pageType;
        }


        const pageHeading =
            document.querySelector("h1")
                ?.textContent
                ?.trim() || "";


        const projectName =
            projectElement?.dataset.projectName ||
            pageHeading ||
            projectId.replace(/-/g, " ");


        // Read the main content of the current page.

        const contentElement =
            document.querySelector("[data-page-content]") ||
            document.querySelector("main") ||
            document.querySelector(".main-content") ||
            document.body;


        // Clone the content to exclude chat interface elements.

        const clone = contentElement.cloneNode(true);

        clone.querySelectorAll(
            "script, style, nav, footer, " +
            "#cw-box, #cw-fab, #cw-welcome"
        ).forEach(element => element.remove());


        let content = (
            clone.innerText ||
            clone.textContent ||
            ""
        );

        content = content
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
            .slice(0, 5000);


        return {

            type,

            path,

            title: document.title,

            projectId,

            projectName:
                isProject ? projectName : "",

            content

        };

    }


    // ================================================
    // 12. OPEN AND CLOSE CHAT
    // ================================================

    function hideWelcome() {

        if (welcome) {
            welcome.classList.remove("visible");
        }

    }


    function toggle(open) {

        box.classList.toggle("open", open);

        if (open) {

            hideWelcome();

            fab.classList.remove("has-new");

            setTimeout(() => input.focus(), 50);

            if (!greeted) {

                greeted = true;

                if (step === 3) {

                    add(
                        `Welcome back, ${lead.name}! 👋 How can I help?`,
                        "bot"
                    );

                } else {

                    add(
                        "Hi! 👋 How can I help you?",
                        "bot"
                    );

                }

            }

        }

    }


    fab.onclick = () => {

        toggle(!box.classList.contains("open"));

    };


    $("cw-close").onclick = () => {

        toggle(false);

    };


    // ================================================
    // 13. DONATION LINK
    // ================================================

    const coffee = $("cw-coffee");


    if (
        coffee &&
        DONATION_URL.trim()
    ) {

        coffee.href = DONATION_URL.trim();

        coffee.hidden = false;

    }


    // ================================================
    // 14. TIMED WELCOME POPUP
    // ================================================

    if (welcome) {

        const closeButton =
            $("cw-welcome-close");

        const openButton =
            $("cw-welcome-open");


        if (closeButton) {

            closeButton.onclick = hideWelcome;

        }


        if (openButton) {

            openButton.onclick = () => {
                toggle(true);
            };

        }


        let alreadyShown = false;

        try {

            alreadyShown =
                sessionStorage.getItem(
                    "cw_welcome_seen"
                ) === "1";

        } catch {}


        if (!alreadyShown) {

            setTimeout(() => {

                if (!box.classList.contains("open")) {

                    welcome.classList.add("visible");

                    try {

                        sessionStorage.setItem(
                            "cw_welcome_seen",
                            "1"
                        );

                    } catch {}


                    setTimeout(
                        hideWelcome,
                        7500
                    );

                }

            }, 2500);

        }

    }


    // ================================================
    // 15. MESSAGE SUBMISSION
    // ================================================

    form.onsubmit = async event => {

        event.preventDefault();


        if (busy) return;


        const text = input.value.trim();

        if (!text) return;


        input.value = "";

        add(text, "me");


        // --------------------------------------------
        // STEP 0: FIRST QUESTION
        // --------------------------------------------

        if (step === 0) {

            lead.question = text;

            store.set(
                "cw_pending_question",
                text
            );

            step = 1;

            return reply(
                "Thanks for reaching out! 🙌 What's your name?"
            );

        }


        // --------------------------------------------
        // STEP 1: VISITOR NAME
        // --------------------------------------------

        if (step === 1) {

            lead.name = text.slice(0, 80);

            store.set(
                "cw_pending_name",
                lead.name
            );

            step = 2;

            return reply(
                `Nice to meet you, ${lead.name}! What's your email address?`
            );

        }


        // --------------------------------------------
        // STEP 2: VISITOR EMAIL
        // --------------------------------------------

        if (step === 2) {

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
            ) {

                return reply(
                    "That email doesn't look right. Could you check it and send it again?"
                );

            }


            lead.email = text;


            busy = true;

            input.disabled = true;

            sendButton.disabled = true;


            try {

                const result = await post(
                    "/lead",
                    {

                        sid,

                        name: lead.name,

                        email: lead.email,

                        text: lead.question,

                        meta: getMeta(),

                        pageContext: getPageContext()

                    }
                );


                step = 3;


                store.set(
                    "cw_name",
                    lead.name
                );

                store.set(
                    "cw_email",
                    lead.email
                );

                store.set(
                    "cw_lead_done",
                    "1"
                );


                store.remove("cw_pending_question");

                store.remove("cw_pending_name");


                // The first question is answered by AI
                // immediately after successful registration.

                if (result.reply) {

                    add(result.reply, "bot");

                } else {

                    add(
                        "Thank you! 🙏 Your information has been received.",
                        "bot"
                    );

                }


            } catch (error) {

                console.error(
                    "Lead submission failed:",
                    error
                );


                reply(
                    "I couldn't submit your message. Please check your connection and send your email again."
                );

            } finally {

                busy = false;

                input.disabled = false;

                sendButton.disabled = false;

                input.focus();

            }

            return;

        }


        // --------------------------------------------
        // STEP 3: AI CHAT
        // --------------------------------------------

        if (step === 3) {

            busy = true;

            input.disabled = true;

            sendButton.disabled = true;


            try {

                const result = await post(
                    "/chat",
                    {

                        sid,

                        name: lead.name,

                        text,

                        messageId: createId(),

                        pageContext: getPageContext()

                    }
                );


                if (!result.reply) {

                    throw new Error(
                        "The AI returned an empty response."
                    );

                }


                add(result.reply, "bot");


            } catch (error) {

                console.error(
                    "AI chat failed:",
                    error
                );


                reply(
                    "Sorry! The assistant is temporarily unavailable. Please try sending your message again."
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
    // 16. RECEIVE MANUAL TELEGRAM REPLIES
    // ================================================

    async function poll() {

        if (document.hidden) return;


        try {

            const url = new URL(
                API + "/poll"
            );

            url.searchParams.set(
                "sid",
                sid
            );

            url.searchParams.set(
                "since",
                String(since)
            );


            const response = await fetch(url.toString());

            if (!response.ok) return;


            const data = await response.json();


            if (!Array.isArray(data)) return;


            data.forEach(message => {

                const id = Number(message.id);

                if (
                    !message.text ||
                    !Number.isFinite(id) ||
                    id <= since
                ) {
                    return;
                }


                add(message.text, "bot");


                since = Math.max(
                    since,
                    id
                );


                if (!box.classList.contains("open")) {

                    fab.classList.add("has-new");

                }

            });


            store.set(
                "cw_since",
                String(since)
            );


        } catch (error) {

            console.warn(
                "Chat polling failed:",
                error
            );

        }

    }


    // Poll immediately, then every 3 seconds.

    poll();

    setInterval(poll, 3000);


})();
