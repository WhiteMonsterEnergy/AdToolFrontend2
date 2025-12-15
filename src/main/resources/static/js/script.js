const BACKEND_URL = "http://localhost:8081/api";

console.log("script.js loaded ✅");

/* ---------------- Frontend navigation ---------------- */

document.getElementById("goToGeneratorBtn")
    ?.addEventListener("click", () => {
        window.location.href = "generateAds.html";
    });

document.getElementById("goToLoginBtn")
    ?.addEventListener("click", () => {
        window.location.href = "login.html";
    });

/* ---------------- AI image generation ---------------- */

const generateImageBtn = document.getElementById("generateImageBtn");
const aiImage = document.getElementById("aiImage");
const saveAdBtn = document.getElementById("saveAdBtn");

let currentImageUrl = null;
let lastBlob = null;
let lastBase64 = null;

function val(id) {
    return document.getElementById(id)?.value?.trim() || "";
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Kunne ikke læse blob som base64"));
        reader.onload = () => resolve(reader.result); // data:image/png;base64,...
        reader.readAsDataURL(blob);
    });
}

generateImageBtn?.addEventListener("click", async () => {
    const brand = val("brandInput");
    const headline = val("headlineInput");
    const subline = val("sublineInput");
    const discountText = val("discountInput");
    const trustText = val("trustInput");
    const modelInfo = val("sizeInfoInput");

    const url =
        `${BACKEND_URL}/ads/ai/image` +
        `?brand=${encodeURIComponent(brand)}` +
        `&headline=${encodeURIComponent(headline)}` +
        `&subline=${encodeURIComponent(subline)}` +
        `&discountText=${encodeURIComponent(discountText)}` +
        `&trustText=${encodeURIComponent(trustText)}` +
        `&modelInfo=${encodeURIComponent(modelInfo)}`;

    try {
        generateImageBtn.disabled = true;
        generateImageBtn.textContent = "Genererer…";

        if (saveAdBtn) saveAdBtn.style.display = "none";
        lastBlob = null;

        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            console.error("Backend error:", response.status, text);
            throw new Error("Image endpoint returned " + response.status);
        }

        const blob = await response.blob();
        lastBlob = blob;

        // 1) Log selve blobben (metadata + størrelse/type)
        console.log("Blob:", blob);
        console.log("Blob type:", blob.type, "size:", blob.size);

        // 2) Log base64 (som data-url). OBS: det kan være langt, så vi logger kun starten.
        const base64DataUrl = await blobToBase64(blob);
        console.log("Base64 (start):", base64DataUrl.slice(0, 200) + "...");
        lastBase64 = base64DataUrl;
        // Hvis du vil have HELE base64’en (kan spamme console):
        // console.log("Base64 (full):", base64DataUrl);

        if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = URL.createObjectURL(blob);

        if (aiImage) {
            aiImage.style.display = "block";
            aiImage.src = currentImageUrl;
        }

        if (saveAdBtn) {
            saveAdBtn.style.display = "inline-block";
        }

    } catch (err) {
        console.error("Image generation failed:", err);
        alert("Fejl ved billedgenerering – se console");
    } finally {
        generateImageBtn.disabled = false;
        generateImageBtn.textContent = "Generér billede med AI";
    }
});

/* ---------------- Save image bytes (blob) ---------------- */

saveAdBtn?.addEventListener("click", async () => {
    try {
        if (!lastBlob) {
            alert("Generér et billede først.");
            return;
        }
        console.log(lastBase64);
        saveAdBtn.disabled = true;
        saveAdBtn.textContent = "Gemmer…";

        // Hvis du også vil logge base64 ved gem (samme metode):
        // const base64DataUrl = await blobToBase64(lastBlob);
        // console.log("Saving base64 (start):", base64DataUrl.slice(0, 200) + "...");

        const formData = new FormData();
        formData.append("image", lastBlob, "ad.png");

        const response = await fetch(`${BACKEND_URL}/ads/save-image`, {
            method: "POST",
            headers: {
                "X-Profile-Id": "1"
            },
            body: formData
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            console.error("Save failed:", response.status, text);
            throw new Error("Save endpoint returned " + response.status);
        }

        const savedId = await response.json().catch(async () => await response.text());
        alert(`Annonce gemt ✅ (id: ${savedId})`);

        saveAdBtn.style.display = "none";

    } catch (err) {
        console.error("Save error:", err);
        alert("Fejl ved gemning – se console");
    } finally {
        saveAdBtn.disabled = false;
        saveAdBtn.textContent = "Gem annonce";
    }
});
