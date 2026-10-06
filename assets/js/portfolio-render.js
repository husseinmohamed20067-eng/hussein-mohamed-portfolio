// ==========================================================
// HM Portfolio — Portfolio Grid Renderer
//
// Loads data/projects.json, shows only Published projects,
// builds the filter bar from whatever categories actually
// exist, and renders the project cards. Adding a new
// Published project to the JSON is enough — no HTML editing.
// ==========================================================

(function () {
    const T = window.HM_ProjectTemplates;
    const gridEl = document.getElementById("portfolioGrid");
    const filtersEl = document.getElementById("portfolioFilters");
    if (!gridEl || !filtersEl || !T) return;

    fetch("data/projects.json")
        .then((res) => res.json())
        .then((projects) => {
            const published = projects
                .filter(T.isPublic)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            if (!published.length) {
                gridEl.innerHTML = "";
                filtersEl.innerHTML = "";
                return;
            }

            filtersEl.innerHTML = T.renderFilterButtons(T.getCategories(published));
            gridEl.innerHTML = T.renderProjectGrid(published);

            if (window.HM_applyCardEffects) window.HM_applyCardEffects(".project-card");

            // Filtering (replaces the old static filter.js, since
            // categories are now data-driven instead of fixed in HTML).
            const buttons = filtersEl.querySelectorAll(".filter-btn");
            const cards = gridEl.querySelectorAll(".project-card[data-category]");

            buttons.forEach((btn) => {
                btn.addEventListener("click", () => {
                    const category = btn.getAttribute("data-filter");
                    buttons.forEach((b) => b.classList.remove("active"));
                    btn.classList.add("active");

                    cards.forEach((card) => {
                        const matches = category === "all" || card.getAttribute("data-category") === category;
                        card.classList.toggle("card-hidden", !matches);
                    });

                    if (typeof window.hmTrack === "function") {
                        window.hmTrack("portfolio_filter", { filter: category });
                    }
                });
            });
        })
        .catch((err) => {
            console.warn("Portfolio: could not load data/projects.json", err);
        });
})();
