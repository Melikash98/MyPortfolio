// ! *************************************************************** main.js **********************************************************************//
// TODO: *************************************************************** Dark Mood & Light Mood **********************************************************************//
const themeButton = document.querySelector('.themeMoode');
const themeIcon = themeButton?.querySelector('i');

const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
    document.documentElement.classList.add('sun-mood');
    themeIcon.className = 'ri-sun-fill';
} else {
    document.documentElement.classList.remove('sun-mood');
    themeIcon.className = 'ri-moon-fill';
}

themeButton?.addEventListener('click', () => {
    const root = document.documentElement;

    if (root.classList.contains('sun-mood')) {
        root.classList.remove('sun-mood');
        themeIcon.className = 'ri-moon-fill';
        localStorage.setItem('theme', 'light');
    } else {
        root.classList.add('sun-mood');
        themeIcon.className = 'ri-sun-fill';
        localStorage.setItem('theme', 'dark');
    }
});


// TODO: *************************************************************** Translation **********************************************************************//
document.addEventListener("DOMContentLoaded", () => {

    const translateButton = document.getElementById("translateButton");
    const translateDropdown = document.getElementById("translateDropdown");
    const translateOptions = document.querySelectorAll(".translateOption");

    if (!translateButton || !translateDropdown) {
        return;
    }

    translateButton.addEventListener("click", (event) => {

        if (event.target.closest(".translateOption")) {
            return;
        }

        translateDropdown.classList.toggle("show");

    });
    document.addEventListener("click", (event) => {

        if (!translateButton.contains(event.target)) {
            translateDropdown.classList.remove("show");
        }

    });

    translateOptions.forEach((option) => {

        option.addEventListener("click", (event) => {

            event.stopPropagation();

            const language = option.dataset.lang;

            changeLanguage(language);

            translateDropdown.classList.remove("show");

        });

    });
    function changeLanguage(language) {

        const googleSelect = document.querySelector(".goog-te-combo");

        if (!googleSelect) {

            console.error(
                "Google Translate is not ready yet."
            );

            setTimeout(() => {
                changeLanguage(language);
            }, 500);

            return;
        }
        document.cookie =
            "googtrans=/en/" +
            language +
            ";path=/;max-age=31536000";
        googleSelect.value = language;

        googleSelect.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );

    }

});
// TODO: *************************************************************** Email JS **********************************************************************//
const EMAILJS_SERVICE_ID = "service_s615d4v";
const EMAILJS_TEMPLATE_ID = "template_3uzazjb";
const EMAILJS_PUBLIC_KEY = "dHviDYQd7YtLv5flq";
document.addEventListener("DOMContentLoaded", () => {
    if (typeof emailjs === "undefined") {
        console.error("EmailJS library was not loaded.");
        return;
    }

    emailjs.init({
        publicKey: EMAILJS_PUBLIC_KEY
    });
    const contactForm = document.getElementById("contactForm");
    const sendButton = document.querySelector(".contactButton");
    const termsText = document.querySelector(".terms");

    if (!contactForm) {
        console.error("Contact form #contactForm was not found.");
        return;
    }

    if (!sendButton) {
        console.error("Send button .contactButton was not found.");
        return;
    }
    sendButton.setAttribute("form", "contactForm");
    sendButton.type = "submit";
    let statusMessage = document.getElementById("emailStatus");

    if (!statusMessage) {
        statusMessage = document.createElement("p");
        statusMessage.id = "emailStatus";

        statusMessage.style.marginTop = "15px";
        statusMessage.style.fontSize = "14px";
        statusMessage.style.fontWeight = "600";
        statusMessage.style.transition = "all 0.3s ease";

        sendButton.parentElement.appendChild(statusMessage);
    }
    contactForm.addEventListener("submit", async (event) => {

        event.preventDefault();
        const name = document.getElementById("name")?.value.trim() || "";
        const email = document.getElementById("email")?.value.trim() || "";
        const subject = document.getElementById("subject")?.value.trim() || "";
        const message = document.getElementById("message")?.value.trim() || "";
        if (!name || !email || !subject || !message) {

            statusMessage.textContent =
                "Please fill in all required fields.";

            statusMessage.style.color = "#d93025";

            return;
        }
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            statusMessage.textContent =
                "Please enter a valid email address.";

            statusMessage.style.color = "#d93025";

            return;
        }
        sendButton.disabled = true;
        sendButton.style.opacity = "0.6";
        sendButton.style.cursor = "not-allowed";

        statusMessage.textContent = "Sending your message...";
        statusMessage.style.color = "#14868C";
        const templateParams = {
            name: name,
            email: email,
            subject: subject,
            message: message,
            time: new Date().toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            }),

            webpage: window.location.href,
            agreement: "Accepted",
            rating: "N/A",
            ratingStars: ""
        };

        try {
            const response = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams
            );

            console.log("EmailJS success:", response);

            statusMessage.textContent =
                "✓ Your message has been sent successfully!";

            statusMessage.style.color = "#14868C";

            contactForm.reset();

        } catch (error) {

            statusMessage.style.color = "#d93025";

            if (error?.text) {
                statusMessage.textContent =
                    `Failed to send your message: ${error.text}`;
            } else {
                statusMessage.textContent =
                    "Failed to send your message. Please try again.";
            }

        } finally {
            sendButton.disabled = false;
            sendButton.style.opacity = "1";
            sendButton.style.cursor = "pointer";
        }
    });

});
