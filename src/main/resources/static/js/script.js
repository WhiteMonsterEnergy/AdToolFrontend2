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
        reader.onload = () => resolve(reader.result);
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

        console.log("Blob:", blob);
        console.log("Blob type:", blob.type, "size:", blob.size);

        const base64DataUrl = await blobToBase64(blob);
        console.log("Base64 (start):", base64DataUrl.slice(0, 200) + "...");
        lastBase64 = base64DataUrl;

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


const dashboardGrid = document.getElementById("dashboardGrid");
const dashboardEmptyMsg = document.getElementById("dashboardEmptyMsg");

if (dashboardGrid) {
    const PROFILE_ID = 1;

    fetch(`${BACKEND_URL}/ads/dashboard`, {
        headers: {
            "X-Profile-Id": PROFILE_ID
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Dashboard fetch failed");
            }
            return res.json();
        })
        .then(ads => {
            if (!ads || ads.length === 0) {
                dashboardEmptyMsg.style.display = "block";
                return;
            }

            ads.forEach(ad => {
                const card = document.createElement("div");
                card.className = "dashboard-card";

                const imageUrl = `${BACKEND_URL}/ads/${ad.id}/image`;

                // Hele kortet skal være klikbart -> åbner billedet i ny tab
                card.style.cursor = "pointer";
                card.addEventListener("click", () => {
                    window.open(imageUrl, "_blank", "noopener");
                });

                // Vi wrapper også billedet i et link, så almindeligt klik på img også føles naturligt
                const link = document.createElement("a");
                link.href = imageUrl;
                link.target = "_blank";
                link.rel = "noopener";
                link.style.display = "block";

                const img = document.createElement("img");
                img.src = imageUrl;
                img.alt = "Annonce";

                link.appendChild(img);

                const meta = document.createElement("div");
                meta.className = "dashboard-meta";
                meta.textContent = new Date(ad.createdAt).toLocaleString();

                card.appendChild(link);
                card.appendChild(meta);
                dashboardGrid.appendChild(card);
            });
        })
        .catch(err => {
            console.error(err);
            dashboardEmptyMsg.style.display = "block";
            dashboardEmptyMsg.textContent = "Kunne ikke indlæse dashboard.";
        });
}
