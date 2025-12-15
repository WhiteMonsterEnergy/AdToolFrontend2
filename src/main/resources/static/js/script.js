const BACKEND_URL = "http://localhost:8081/api";

console.log("script.js loaded ✅ (AI-only)");

const generateImageBtn = document.getElementById("generateImageBtn");
const aiImage = document.getElementById("aiImage");

if (!generateImageBtn) console.error("Mangler #generateImageBtn i HTML");
if (!aiImage) console.error("Mangler #aiImage i HTML");

let currentImageUrl = null;

function val(id) {
    const el = document.getElementById(id);
    if (!el) console.error(`Mangler #${id} i HTML`);
    return el?.value?.trim() || "";
}

generateImageBtn?.addEventListener("click", async () => {
    console.log("Generate image button clicked ✅");

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

    console.log("Calling:", url);

    try {
        generateImageBtn.disabled = true;
        generateImageBtn.textContent = "Genererer…";

        const response = await fetch(url);

        console.log("Status:", response.status, "Content-Type:", response.headers.get("content-type"));

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            console.error("Backend error body:", text);
            throw new Error("Image endpoint returned " + response.status);
        }

        const blob = await response.blob();
        console.log("Blob:", { size: blob.size, type: blob.type });

        if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = URL.createObjectURL(blob);

        aiImage.style.display = "block";
        aiImage.src = currentImageUrl;

        console.log("Image shown ✅", currentImageUrl);

    } catch (err) {
        console.error("Image generation failed:", err);
        alert("Fejl ved billedgenerering – se console");
    } finally {
        generateImageBtn.disabled = false;
        generateImageBtn.textContent = "Generér billede med AI";
    }
});
