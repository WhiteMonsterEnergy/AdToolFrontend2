const BACKEND_URL = "http://localhost:8081/api";

const form = document.getElementById('adForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const brand = document.getElementById('brandInput').value;
    const headlineRaw = document.getElementById('headlineInput').value;
    const subline = document.getElementById('sublineInput').value;
    const discount = document.getElementById('discountInput').value;
    const sizeInfo = document.getElementById('sizeInfoInput').value;
    const trust = document.getElementById('trustInput').value;
    const imageFile = document.getElementById('imageInput').files[0];

    // Beholder \n → <br> konverteringen
    const headlineHtml = headlineRaw.split("\\n").join("<br>");

    // Preview opdatering
    document.getElementById('brandName').textContent = brand;
    document.getElementById('subline').textContent = subline;
    document.getElementById('discountText').textContent = discount;
    document.getElementById('sizeInfo').textContent = sizeInfo;
    document.getElementById('trustText').textContent = trust;
    document.getElementById('headline').innerHTML = headlineHtml;

    // Lokalt billede preview
    if (imageFile) {
        const url = URL.createObjectURL(imageFile);
        document.getElementById('productImage').src = url;
    }

    // ⚠️ OPDATERET PAYLOAD – matcher din nye AdRequest
    const payload = {
        brand: brand,
        headline: headlineRaw,
        subline: subline,
        discount: discount,
        sizeInfo: sizeInfo,
        trustText: trust,

        // Prompt er valgfri → backend/AI kan bruge det senere
        prompt: `
Brand: ${brand}
Headline: ${headlineRaw}
Subline: ${subline}
Discount: ${discount}
SizeInfo: ${sizeInfo}
TrustText: ${trust}
`.trim()
    };

    try {
        const response = await fetch(`${BACKEND_URL}/ads/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Fejl ved backend-call");
        }

        const data = await response.json();

        // Backend kan overskrive felterne – ellers bruger vi fallback
        document.getElementById('brandName').textContent = data.brandName || brand;

        const finalHeadline = data.headline || headlineRaw;
        document.getElementById('headline').innerHTML = finalHeadline.split("\\n").join("<br>");

        document.getElementById('subline').textContent = data.subline || subline;
        document.getElementById('discountText').textContent = data.discountText || discount;
        document.getElementById('sizeInfo').textContent = data.sizeInfo || sizeInfo;
        document.getElementById('trustText').textContent = data.trustText || trust;

    } catch (err) {
        console.error(err);
    }
});
