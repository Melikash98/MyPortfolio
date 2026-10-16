  const numberInput = document.querySelector("#number-input");
    const nameInput = document.querySelector("#name-input");
    const expiryInput = document.querySelector("#expiry-input");
    const brandInput = document.querySelector("#brand-input");
    const copyInput = document.querySelector("#copy-input");
    const copyButton = document.querySelector("#copy-button");
    const copyStatus = document.querySelector("#copy-status");
    const cardNumber = document.querySelector("#card-number");
    const cardName = document.querySelector("#card-name");
    const cardExpiry = document.querySelector("#card-expiry");
    const cardBrand = document.querySelector("#card-brand");

    const defaults = {
      number: "0123456789012345",
      name: "Card Holder",
      expiry: "0138",
      brand: "Visa",
      code: "",
      cardColor: "#00b9e8",
      backgroundColor: "#080d25"
    };

    function updateNumber() {
      const digits = numberInput.value.replace(/\D/g, "").slice(0, 16);
      numberInput.value = digits;
      cardNumber.textContent = digits
        ? digits.match(/.{1,4}/g).join(" ")
        : "•••• •••• •••• ••••";
    }

    function updateName() {
      cardName.textContent = nameInput.value.trim() || "CARD HOLDER";
    }

    function updateExpiry() {
      const digits = expiryInput.value.replace(/\D/g, "").slice(0, 4);
      expiryInput.value = digits;
      cardExpiry.textContent = digits.length > 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits || "MM/YY";
    }

    function updateBrand() {
      cardBrand.textContent = brandInput.value.trim() || "Card";
    }

    async function copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();

      const copied = document.execCommand("copy");
      helper.remove();

      if (!copied) {
        throw new Error("Clipboard copy failed");
      }
    }

    numberInput.addEventListener("input", updateNumber);
    nameInput.addEventListener("input", updateName);
    expiryInput.addEventListener("input", updateExpiry);
    brandInput.addEventListener("input", updateBrand);

    document.querySelector("#card-color-input").addEventListener("input", event => {
      document.documentElement.style.setProperty("--card-accent", event.target.value);
    });

    document.querySelector("#background-color-input").addEventListener("input", event => {
      document.documentElement.style.setProperty("--page-background", event.target.value);
    });

    copyButton.addEventListener("click", async () => {
      const code = copyInput.value.trim();

      if (!code) {
        copyStatus.textContent = "Enter a code in the Code to copy field first.";
        copyInput.focus();
        return;
      }

      try {
        await copyToClipboard(code);
        copyStatus.textContent = "Copied. You can now paste and send it.";
        copyButton.textContent = "Copied";

        window.setTimeout(() => {
          copyButton.textContent = "Copy";
        }, 1500);
      } catch {
        copyStatus.textContent = "Copy failed. Check your browser's clipboard permissions.";
      }
    });

    document.querySelector("#reset-button").addEventListener("click", () => {
      numberInput.value = defaults.number;
      nameInput.value = defaults.name;
      expiryInput.value = defaults.expiry;
      brandInput.value = defaults.brand;
      copyInput.value = defaults.code;
      document.querySelector("#card-color-input").value = defaults.cardColor;
      document.querySelector("#background-color-input").value = defaults.backgroundColor;
      copyStatus.textContent = "";
      copyButton.textContent = "Copy";

      document.documentElement.style.setProperty("--card-accent", defaults.cardColor);
      document.documentElement.style.setProperty("--page-background", defaults.backgroundColor);

      updateNumber();
      updateName();
      updateExpiry();
      updateBrand();
    });

    updateNumber();
    updateName();
    updateExpiry();
    updateBrand();