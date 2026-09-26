/* ========================================================================== SPLASH PAGE JAVASCRIPT ==========================================================================
   
   TODO: This script controls the behavior and animation sequence of the website's initial Splash Page.

   Purpose:
   - Initializes the AOS (Animate On Scroll) library.
   - Controls the Splash Page animation timing.
   - Removes the initial AOS animation attribute when necessary.
   - Triggers the zoom-out animation before leaving the Splash Page.
   - Redirects the user to the main website after the exit animation.

   TODO: Splash Page Flow:
   
   1. Splash Page is displayed.
   2. AOS animation is initialized.
   3. Splash content remains visible for 4 seconds.
   4. The "zoom-out" class is added to the profile card.
   5. The Splash Page performs the exit animation.
   6. After 1 second, the user is redirected to:
      html/index.html

   TODO: Related Files:
   - splash.css → Splash Page styles and animations
   - style.css  → Main website styles
   ========================================================================== */
AOS.init({
    duration: 1000,
    once: true
});

setTimeout(function () {
    const mainElement = document.querySelector(".profileCard");

    mainElement.removeAttribute("data-aos");

    mainElement.classList.add("zoom-out");

    setTimeout(function () {
        window.location.href = "html/index.html";
    }, 1000);
}, 6000);