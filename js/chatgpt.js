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