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
    function initReceiptUpload() {
        const receiptForm = document.querySelector('#receiptForm');
        const receiptInput = document.querySelector('#receiptFiles');
        const receiptStatus = document.querySelector('#receiptStatus');
        const receiptFileList = document.querySelector('#receiptFileList');
        const receiptConsent = document.querySelector('#receiptConsent');
        const receiptSendButton = document.querySelector('#receiptSendBtn');
        const receiptDropzone = receiptInput?.closest('.receiptUpload__dropzone');
        const receiptFormats = document.querySelector('#receiptFormats');

        if (
            !receiptForm ||
            !receiptInput ||
            !receiptStatus ||
            !receiptFileList ||
            !receiptConsent ||
            !receiptSendButton
        ) {
            return;
        }

        const DONATION_ENDPOINT =
            'https://dark-dawn-fb61.melika-shooryabi98.workers.dev/submit';

        const MAX_FILE_BYTES = 20 * 1024 * 1024;

        const ALLOWED_EXTENSIONS = new Set([
            '.pdf',
            '.jpg',
            '.jpeg',
            '.png',
            '.webp',
            '.gif',
            '.heic',
            '.avif'
        ]);

        let isUploading = false;

        receiptInput.multiple = false;
        receiptInput.accept = [
            '.pdf',
            '.jpg',
            '.jpeg',
            '.png',
            '.webp',
            '.gif',
            '.heic',
            '.avif'
        ].join(',');

        if (receiptFormats) {
            receiptFormats.textContent =
                'One file only. PDF or image, up to 20 MB.';
        }

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
                return;
            }
        }

        function createVisitorId() {
            if (window.crypto?.randomUUID) {
                return window.crypto.randomUUID();
            }

            if (window.crypto?.getRandomValues) {
                const bytes = new Uint8Array(16);
                window.crypto.getRandomValues(bytes);

                bytes[6] = (bytes[6] & 0x0f) | 0x40;
                bytes[8] = (bytes[8] & 0x3f) | 0x80;

                const hex = Array.from(bytes)
                    .map((byte) => byte.toString(16).padStart(2, '0'))
                    .join('');

                return [
                    hex.slice(0, 8),
                    hex.slice(8, 12),
                    hex.slice(12, 16),
                    hex.slice(16, 20),
                    hex.slice(20)
                ].join('-');
            }

            return `visitor-${Date.now().toString(36)}-${Math.random()
                .toString(36)
                .slice(2, 14)}`;
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
            return String(value ?? '')
                .replace(/[\u0000-\u001f\u007f]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, maxLength);
        }

        function cleanUrl(value) {
            if (!value) {
                return '';
            }

            try {
                const url = new URL(value, window.location.href);

                if (url.protocol !== 'https:' && url.protocol !== 'http:') {
                    return '';
                }

                url.username = '';
                url.password = '';
                url.search = '';
                url.hash = '';

                return cleanText(url.href, 500);
            } catch {
                return '';
            }
        }

        function getBrowserDetails() {
            const userAgent = navigator.userAgent || '';

            const device = /iPad|Tablet|PlayBook|Silk/i.test(userAgent) ||
                (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))
                ? 'Tablet'
                : /Mobi|iPhone|Android/i.test(userAgent)
                    ? 'Mobile'
                    : 'Desktop';

            const operatingSystem = /Windows/i.test(userAgent)
                ? 'Windows'
                : /Android/i.test(userAgent)
                    ? 'Android'
                    : /iPhone|iPad|iPod/i.test(userAgent)
                        ? 'iOS'
                        : /Mac OS X/i.test(userAgent)
                            ? 'macOS'
                            : /Linux/i.test(userAgent)
                                ? 'Linux'
                                : 'Unknown OS';

            const browser = /Edg\//i.test(userAgent)
                ? 'Edge'
                : /OPR\/|Opera/i.test(userAgent)
                    ? 'Opera'
                    : /Firefox\//i.test(userAgent)
                        ? 'Firefox'
                        : /CriOS\//i.test(userAgent)
                            ? 'Chrome'
                            : /Chrome\//i.test(userAgent)
                                ? 'Chrome'
                                : /Safari\//i.test(userAgent)
                                    ? 'Safari'
                                    : 'Unknown browser';

            let timeZone = 'Unknown';

            try {
                timeZone =
                    Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone;
            } catch {
                timeZone = 'Unknown';
            }

            return {
                device,
                os: operatingSystem,
                browser,
                screen: {
                    width: window.screen?.width || 0,
                    height: window.screen?.height || 0
                },
                language: cleanText(navigator.language || 'Unknown', 40),
                clientTime: new Date().toLocaleString(),
                timeZone: cleanText(timeZone, 80),
                pageUrl: cleanUrl(window.location.href),
                referrer: cleanUrl(document.referrer)
            };
        }

        function selectedFiles() {
            return Array.from(receiptInput.files || []);
        }

        function validateFiles(files) {
            const errors = [];

            if (files.length === 0) {
                errors.push('Select one receipt file to continue.');
                return errors;
            }

            if (files.length !== 1) {
                errors.push('Please select exactly one file.');
                return errors;
            }

            const file = files[0];
            const lastDot = file.name.lastIndexOf('.');
            const extension = lastDot >= 0
                ? file.name.slice(lastDot).toLowerCase()
                : '';

            if (!ALLOWED_EXTENSIONS.has(extension)) {
                errors.push(
                    'Unsupported file type. Choose a PDF or a supported image.'
                );
            }

            if (file.size === 0) {
                errors.push('The selected file is empty.');
            } else if (file.size > MAX_FILE_BYTES) {
                errors.push('The file must be 20 MB or smaller.');
            }

            return errors;
        }

        function setStatus(message, state = 'idle') {
            receiptStatus.textContent = message;
            receiptStatus.dataset.state = state;
        }

        function formatSize(bytes) {
            return `${(bytes / (1024 * 1024)).toFixed(
                bytes < 1024 * 1024 ? 2 : 1
            )} MB`;
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

        function updateSendButton() {
            const files = selectedFiles();
            const hasValidFiles =
                files.length === 1 && validateFiles(files).length === 0;

            receiptSendButton.disabled =
                isUploading || !hasValidFiles || !receiptConsent.checked;
        }

        function updateSelection() {
            const files = selectedFiles();
            const errors = validateFiles(files);
            const hasValidFiles = files.length === 1 && errors.length === 0;

            updateFileList(files);

            receiptInput.setAttribute(
                'aria-invalid',
                String(files.length > 0 && !hasValidFiles)
            );

            receiptDropzone?.classList.toggle(
                'is-invalid',
                files.length > 0 && !hasValidFiles
            );

            if (errors.length > 0) {
                setStatus(errors.join(' '), 'error');
            } else if (files.length === 0) {
                setStatus('Select one receipt file to continue.', 'idle');
            } else if (receiptConsent.checked) {
                setStatus(
                    `${cleanText(files[0].name, 120)} is ready to send.`,
                    'ready'
                );
            } else {
                setStatus(
                    'File selected. Agree to the notice to enable sending.',
                    'ready'
                );
            }

            updateSendButton();

            return { files, errors, hasValidFiles };
        }

        function responseErrorMessage(response, payload) {
            if (typeof payload?.error === 'string' && payload.error.trim()) {
                return cleanText(payload.error, 240);
            }

            if (response.status === 413) {
                return 'The file or request is too large. The file limit is 20 MB.';
            }

            if (response.status === 415) {
                return 'Unsupported file format. Choose a supported PDF or image.';
            }

            if (response.status === 429) {
                return 'Too many attempts. Please wait and try again.';
            }

            if (response.status === 404) {
                return 'The receipt service endpoint was not found. Please check the Worker URL.';
            }

            return 'The receipt could not be confirmed as delivered. Your file is still selected; please try again.';
        }

        receiptInput.addEventListener('change', updateSelection);
        receiptConsent.addEventListener('change', updateSelection);

        receiptForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (isUploading) {
                return;
            }

            const selection = updateSelection();

            if (!selection.hasValidFiles) {
                setStatus(
                    selection.errors.join(' ') || 'Select one valid receipt file.',
                    'error'
                );
                return;
            }

            if (!receiptConsent.checked) {
                setStatus(
                    'Please agree to the privacy notice before sending.',
                    'error'
                );
                return;
            }

            const file = selection.files[0];
            const visitorId = getVisitorId();
            const visitorName = cleanText(safeStorageGet('cw_name'), 80);
            const metadata = getBrowserDetails();

            metadata.visitorId = visitorId;
            metadata.name = visitorName || 'Not provided';

            const formData = new FormData();
            formData.append('metadata', JSON.stringify(metadata));
            formData.append('file', file, file.name);

            isUploading = true;
            receiptForm.setAttribute('aria-busy', 'true');
            receiptInput.disabled = true;
            receiptConsent.disabled = true;
            receiptSendButton.disabled = true;

            setStatus(
                'Sending your receipt. Please keep this page open.',
                'uploading'
            );

            const controller = new AbortController();
            const timeoutId = window.setTimeout(
                () => controller.abort(),
                120000
            );

            try {
                const response = await fetch(DONATION_ENDPOINT, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });

                const payload = await response.json().catch(() => null);

                if (!response.ok || payload?.ok !== true) {
                    setStatus(
                        responseErrorMessage(response, payload),
                        'error'
                    );
                    return;
                }

                receiptInput.value = '';
                receiptConsent.checked = false;
                updateFileList([]);
                receiptInput.setAttribute('aria-invalid', 'false');
                receiptDropzone?.classList.remove('is-invalid');

                setStatus(
                    'Your receipt was sent successfully. Thank you for your support.',
                    'success'
                );
            } catch (error) {
                if (error?.name === 'AbortError') {
                    setStatus(
                        'The upload timed out. Your file is still selected; please try again.',
                        'error'
                    );
                } else {
                    setStatus(
                        'The receipt service could not be reached. Check your connection and try again.',
                        'error'
                    );
                }
            } finally {
                window.clearTimeout(timeoutId);

                isUploading = false;
                receiptForm.removeAttribute('aria-busy');
                receiptInput.disabled = false;
                receiptConsent.disabled = false;

                updateSendButton();
            }
        });

        updateSelection();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReceiptUpload, {
            once: true
        });
    } else {
        initReceiptUpload();
    }
})();