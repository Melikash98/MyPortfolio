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

