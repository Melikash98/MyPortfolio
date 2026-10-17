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
(() => {
    const receiptForm = document.querySelector('#receiptForm');
    const receiptInput = document.querySelector('#receiptFiles');
    const receiptStatus = document.querySelector('#receiptStatus');
    const receiptFileList = document.querySelector('#receiptFileList');
    const receiptConsent = document.querySelector('#receiptConsent');
    const receiptSendButton = document.querySelector('#receiptSendBtn');
    const receiptDropzone = receiptInput?.closest('.receiptUpload__dropzone');

    if (!receiptForm || !receiptInput || !receiptStatus || !receiptFileList
        || !receiptConsent || !receiptSendButton) {
        return;
    }

    const DONATION_ENDPOINT = 'https://mysite-chat.melika-shooryabi98.workers.dev/donation';
    const MAX_FILES = 5;
    const MAX_FILE_BYTES = 10 * 1024 * 1024;
    const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
    const ALLOWED_EXTENSIONS = new Map([
        ['.pdf', 'application/pdf'],
        ['.jpg', 'image/jpeg'],
        ['.jpeg', 'image/jpeg'],
        ['.png', 'image/png'],
        ['.webp', 'image/webp'],
        ['.gif', 'image/gif']
    ]);
    let isUploading = false;

    function safeStorageGet(key) {
        try {
            return window.localStorage.getItem(key) || '';
        } catch {
            return '';
        }
    }

    function safeStorageSet(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch {
            // Upload can continue when storage is blocked or full.
        }
    }

    function createVisitorId() {
        const cryptoApi = window.crypto;
        if (cryptoApi?.randomUUID) {
            return cryptoApi.randomUUID();
        }

        if (cryptoApi?.getRandomValues) {
            const bytes = new Uint8Array(16);
            cryptoApi.getRandomValues(bytes);
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;
            const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
            return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        }

        return `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
    }

    function getVisitorId() {
        const storedId = safeStorageGet('cw_sid').trim();
        if (/^[A-Za-z0-9._:-]{16,128}$/.test(storedId)) {
            return storedId;
        }

        const visitorId = createVisitorId();
        safeStorageSet('cw_sid', visitorId);
        return visitorId;
    }

    function cleanText(value, maxLength = 160) {
        return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
    }

    function cleanUrl(value) {
        if (!value) return '';

        try {
            const url = new URL(value, window.location.href);
            url.search = '';
            url.hash = '';
            return cleanText(url.href, 500);
        } catch {
            return '';
        }
    }

    function browserDetails() {
        const userAgent = navigator.userAgent || '';
        const device = /iPad|Tablet|PlayBook|Silk/i.test(userAgent)
            || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))
            ? 'Tablet'
            : /Mobi|iPhone|Android/i.test(userAgent) ? 'Mobile' : 'Desktop';
        const operatingSystem = /Windows/i.test(userAgent) ? 'Windows'
            : /Android/i.test(userAgent) ? 'Android'
                : /iPhone|iPad|iPod/i.test(userAgent) ? 'iOS'
                    : /Mac OS X/i.test(userAgent) ? 'macOS'
                        : /Linux/i.test(userAgent) ? 'Linux' : 'Unknown OS';
        const browser = /Edg\//i.test(userAgent) ? 'Edge'
            : /OPR\/|Opera/i.test(userAgent) ? 'Opera'
                : /Firefox\//i.test(userAgent) ? 'Firefox'
                    : /Chrome\//i.test(userAgent) ? 'Chrome'
                        : /Safari\//i.test(userAgent) ? 'Safari' : 'Unknown browser';

        let timeZone = 'Unknown';
        try {
            timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone;
        } catch {
            // Keep the non-identifying fallback.
        }

        return {
            device: cleanText(`${device} · ${operatingSystem} · ${browser}`, 120),
            screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
            lang: cleanText(navigator.language || 'Unknown', 40),
            localTime: cleanText(new Date().toLocaleString(), 100),
            tz: cleanText(timeZone, 80),
            page: cleanUrl(window.location.href),
            ref: cleanUrl(document.referrer)
        };
    }

    function selectedFiles() {
        return Array.from(receiptInput.files || []);
    }

    function validateFiles(files) {
        const errors = [];

        if (files.length === 0) {
            errors.push('Select at least one receipt file.');
            return errors;
        }

        if (files.length > MAX_FILES) {
            errors.push(`Choose no more than ${MAX_FILES} files.`);
        }

        let totalBytes = 0;
        files.forEach((file) => {
            totalBytes += file.size;
            const extension = `.${file.name.split('.').pop().toLowerCase()}`;
            const expectedMime = ALLOWED_EXTENSIONS.get(extension);
            const typeMatches = !file.type || file.type.toLowerCase() === expectedMime;

            if (!expectedMime || !typeMatches) {
                errors.push(`${cleanText(file.name, 100)} is not a supported PDF or image.`);
            } else if (!file.size) {
                errors.push(`${cleanText(file.name, 100)} is empty.`);
            } else if (file.size > MAX_FILE_BYTES) {
                errors.push(`${cleanText(file.name, 100)} is larger than 10 MB.`);
            }
        });

        if (totalBytes > MAX_TOTAL_BYTES) {
            errors.push('The total size of all files must be 20 MB or less.');
        }

        return [...new Set(errors)];
    }

    function setStatus(message, state = 'idle') {
        receiptStatus.textContent = message;
        receiptStatus.dataset.state = state;
    }

    function formatSize(bytes) {
        return `${(bytes / (1024 * 1024)).toFixed(bytes < 1024 * 1024 ? 2 : 1)} MB`;
    }

    function updateFileList(files) {
        receiptFileList.replaceChildren();
        files.forEach((file) => {
            const item = document.createElement('li');
            const name = document.createElement('span');
            const size = document.createElement('span');
            name.textContent = cleanText(file.name, 200);
            size.textContent = formatSize(file.size);
            size.setAttribute('aria-label', formatSize(file.size));
            item.append(name, size);
            receiptFileList.appendChild(item);
        });
    }

    function updateSelection() {
        const files = selectedFiles();
        const errors = validateFiles(files);
        const hasValidFiles = files.length > 0 && errors.length === 0;
        updateFileList(files);
        receiptInput.setAttribute('aria-invalid', String(files.length > 0 && !hasValidFiles));
        receiptDropzone?.classList.toggle('is-invalid', files.length > 0 && !hasValidFiles);

        if (errors.length > 0) {
            setStatus(errors.join(' '), 'error');
        } else if (!files.length) {
            setStatus('Select receipt files to continue.', 'idle');
        } else if (receiptConsent.checked) {
            setStatus(`${files.length} file${files.length === 1 ? '' : 's'} ready to send.`, 'ready');
        } else {
            setStatus(`${files.length} file${files.length === 1 ? '' : 's'} selected. Agree to the notice to enable sending.`, 'ready');
        }

        receiptSendButton.disabled = isUploading || !hasValidFiles || !receiptConsent.checked;
        return { files, errors, hasValidFiles };
    }

    function responseErrorMessage(status, payload) {
        const code = cleanText(payload?.code, 60).toLowerCase();
        const knownMessages = {
            too_many_files: 'You can send up to 5 files at a time.',
            file_too_large: 'A file is too large. Each file must be 10 MB or less.',
            upload_too_large: 'The combined upload is too large. The limit is 20 MB.',
            unsupported_file: 'The server rejected a file format. Choose a PDF, JPEG, PNG, WebP, or GIF.',
            rate_limited: 'Too many attempts were made. Please wait a little and try again.',
            turnstile_failed: 'The security check could not be completed. Please refresh the page and try again.',
            telegram_delivery_failed: 'The receipt could not be delivered. Your files are still selected; please try again later.'
        };

        if (knownMessages[code]) return knownMessages[code];
        if (status === 404) return 'The receipt service is not ready yet. Please try again later.';
        if (status === 413) return 'The combined upload is too large. The limit is 20 MB.';
        if (status === 429) return 'Too many attempts were made. Please wait a little and try again.';
        return 'The receipt was not confirmed as delivered. Your files are still selected; please try again later.';
    }

    receiptInput.addEventListener('change', updateSelection);
    receiptConsent.addEventListener('change', updateSelection);

    receiptForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (isUploading) return;

        const selection = updateSelection();
        if (!selection.hasValidFiles || !receiptConsent.checked) {
            if (!receiptConsent.checked && selection.hasValidFiles) {
                setStatus('Agree to the privacy notice before sending your receipt.', 'error');
            }
            return;
        }

        const formData = new FormData();
        const visitorId = getVisitorId();
        const visitorName = cleanText(safeStorageGet('cw_name'), 80);
        formData.append('sid', visitorId);
        formData.append('name', visitorName);
        formData.append('meta', JSON.stringify(browserDetails()));
        formData.append('consent', 'true');
        selection.files.forEach((file) => formData.append('receipts', file, file.name));

        isUploading = true;
        receiptForm.setAttribute('aria-busy', 'true');
        receiptInput.disabled = true;
        receiptConsent.disabled = true;
        receiptSendButton.disabled = true;
        setStatus('Sending your receipt securely. Please keep this page open.', 'uploading');

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 60000);

        try {
            const response = await fetch(DONATION_ENDPOINT, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok || payload?.ok !== true) {
                setStatus(responseErrorMessage(response.status, payload), 'error');
                return;
            }

            receiptInput.value = '';
            receiptConsent.checked = false;
            updateFileList([]);
            setStatus('Your receipt was sent successfully. Thank you for your support.', 'success');
        } catch (error) {
            const message = error?.name === 'AbortError'
                ? 'The upload timed out. Your files are still selected; please try again.'
                : 'The receipt could not be sent. Check your connection; your files are still selected.';
            setStatus(message, 'error');
        } finally {
            window.clearTimeout(timeoutId);
            isUploading = false;
            receiptForm.removeAttribute('aria-busy');
            receiptInput.disabled = false;
            receiptConsent.disabled = false;
            updateSendButton();
        }
    });

    function updateSendButton() {
        const hasValidFiles = selectedFiles().length > 0 && validateFiles(selectedFiles()).length === 0;
        receiptSendButton.disabled = isUploading || !hasValidFiles || !receiptConsent.checked;
    }

    updateSelection();
})();
