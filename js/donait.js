async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch {
            // Fall through to the compatibility copy method.
        }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let copied = false;
    try {
        copied = document.execCommand("copy");
    } finally {
        textarea.remove();
    }

    if (!copied) {
        throw new Error("The browser could not copy the card number.");
    }
}

function getCardNumber(button) {
    const card = button.closest(".creditCard")
        || button.closest(".giveDoneit")?.querySelector(".creditCard");

    if (!card) {
        throw new Error("The card number could not be found.");
    }

    const number = [...card.querySelectorAll(".credit__digit-group")]
        .map((group) => group.textContent.replace(/\D/g, ""))
        .join("");

    if (!/^\d{16}$/.test(number)) {
        throw new Error("The card number is incomplete.");
    }

    return number;
}

function showCopyFeedback(button, copied) {
    const label = button.querySelector(".CopyBtn-label") || button;
    const originalLabel = label.dataset.originalLabel || label.textContent.trim();
    label.dataset.originalLabel = originalLabel;
    label.textContent = copied
        ? (button.classList.contains("CopyBtn") ? "Copied!" : "Copied")
        : "Try again";

    if (button._copyFeedbackTimer) {
        window.clearTimeout(button._copyFeedbackTimer);
    }

    button._copyFeedbackTimer = window.setTimeout(() => {
        label.textContent = originalLabel;
    }, 1600);
}

const copyStatus = document.getElementById("card-copy-status");

document.querySelectorAll(".credit__type, .CopyBtn").forEach((button) => {
    button.addEventListener("click", async () => {
        try {
            const number = getCardNumber(button);
            await copyText(number);
            showCopyFeedback(button, true);

            if (copyStatus) {
                copyStatus.textContent = "Card number copied. Use it to complete your donation.";
            }

            if (button.classList.contains("credit__type")) {
                button.title = "Card number copied";
                window.setTimeout(() => {
                    button.title = "Copy card number";
                }, 1600);
            }
        } catch (error) {
            console.error(error);
            showCopyFeedback(button, false);

            if (copyStatus) {
                copyStatus.textContent = "Could not copy the card number. Please try again.";
            }
        }
    });
});
const receiptInput = document.querySelector('#receiptFiles');
const receiptStatus = document.querySelector('#receiptStatus');

receiptInput.addEventListener('change', () => {
    const files = Array.from(receiptInput.files);

    if (files.length === 0) {
        receiptStatus.textContent = 'No files selected';
        return;
    }

    const invalidFiles = files.filter((file) => {
        const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
        const isImage = file.type.startsWith('image/');
        return !isPdf && !isImage;
    });

    if (invalidFiles.length > 0) {
        receiptStatus.textContent = 'Please select PDF or image files only';
        receiptInput.value = '';
        return;
    }

    receiptStatus.textContent = files.map((file) => file.name).join(', ');
});