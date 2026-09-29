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


