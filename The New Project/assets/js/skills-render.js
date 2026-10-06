// ==========================================================
// HM Portfolio — Skills Grid Renderer
// Loads data/skills.json, shows only visible skills in order.
// ==========================================================

(function () {
    const grid = document.getElementById("skillsGrid");
    if (!grid) return;

    fetch("data/skills.json")
        .then((res) => res.json())
        .then((skills) => {
            const visible = skills
                .filter((s) => s.visible !== false)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            grid.innerHTML = visible.map((s) => `
                <div class="skill-card">
                    <i class="${s.icon || "fa-solid fa-star"}"></i>
                    <h3>${s.name}</h3>
                    <p>${s.description || ""}</p>
                </div>
            `).join("");

            if (window.HM_applyCardEffects) window.HM_applyCardEffects(".skill-card");
        })
        .catch((err) => console.warn("Skills: could not load data/skills.json", err));
})();
