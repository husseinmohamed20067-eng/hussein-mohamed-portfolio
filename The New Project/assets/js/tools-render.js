// ==========================================================
// HM Portfolio — Services / Tools Grid Renderer
// Loads data/tools.json, shows only visible tools in order.
// ==========================================================

(function () {
    const grid = document.getElementById("toolsGrid");
    if (!grid) return;

    fetch("data/tools.json")
        .then((res) => res.json())
        .then((tools) => {
            const visible = tools
                .filter((t) => t.visible !== false)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            grid.innerHTML = visible.map((t) => `
                <div class="card">
                    <i class="${t.icon || "fa-solid fa-toolbox"}"></i>
                    <h3>${t.name}</h3>
                    <p>${t.description || ""}</p>
                </div>
            `).join("");

            if (window.HM_applyCardEffects) window.HM_applyCardEffects(".card");
        })
        .catch((err) => console.warn("Tools: could not load data/tools.json", err));
})();
