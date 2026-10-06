// ==========================================================
// HM Portfolio — Shared Project Templates
//
// Pure rendering functions with no side effects, used by:
//   - assets/js/portfolio-render.js (homepage grid)
//   - project.html (generic case-study page for new projects)
//   - admin.html (live "Preview" before publishing)
//
// Keeping this in one file means the homepage cards, the case
// study page, and the admin preview can never visually drift
// apart from each other.
// ==========================================================

(function () {
    function esc(str) {
        if (str === undefined || str === null) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // A project is visible on the public site only when Published.
    function isPublic(project) {
        return project && project.status === "published";
    }

    // ---------------------------------------------------------
    // Homepage grid card
    // ---------------------------------------------------------
    function renderProjectCard(project) {
        const isCaseStudy = project.url && !project.url.startsWith("#");
        const ctaLabel = project.ctaLabel || (isCaseStudy ? "View Case Study" : "Hire Me");
        const ctaEvent = project.ctaEvent || (isCaseStudy ? "project_click" : "hire_me_click");
        const href = project.url && project.url.trim()
            ? project.url
            : ("project.html?id=" + encodeURIComponent(project.id));

        const tags = (project.tags || [])
            .map((t) => `<span>${esc(t)}</span>`)
            .join("");

        return `
        <div class="project-card" data-category="${esc(project.category)}" data-project-id="${esc(project.id)}">
            <div class="project-media">
                <img src="${esc(project.image)}" alt="${esc(project.imageAlt || project.name)}">
                <div class="project-hover-note">${esc(project.hoverNote || "")}</div>
            </div>
            <div class="project-info">
                <h3>${esc(project.name)}</h3>
                <p>${esc(project.description)}</p>
                <div class="project-tags">${tags}</div>
                <div class="project-cta">
                    <a href="${esc(href)}" class="btn" data-analytics="${esc(ctaEvent)}" data-analytics-label="${esc(project.name)}" data-project-id="${esc(project.id)}">${esc(ctaLabel)}</a>
                </div>
            </div>
        </div>`;
    }

    function renderProjectGrid(projects) {
        return projects.map(renderProjectCard).join("\n");
    }

    // Distinct categories, in first-seen order, used to build filter buttons.
    function getCategories(projects) {
        const seen = [];
        projects.forEach((p) => {
            if (p.category && !seen.includes(p.category)) seen.push(p.category);
        });
        return seen;
    }

    const CATEGORY_LABELS = {
        excel: "Excel",
        powerbi: "Power BI",
        googlesheets: "Google Sheets",
        dashboards: "Dashboards"
    };

    function renderFilterButtons(categories) {
        const buttons = ['<button type="button" class="filter-btn active" data-filter="all">All</button>'];
        categories.forEach((cat) => {
            const label = CATEGORY_LABELS[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
            buttons.push(`<button type="button" class="filter-btn" data-filter="${esc(cat)}">${esc(label)}</button>`);
        });
        return buttons.join("\n");
    }

    // ---------------------------------------------------------
    // Full case-study page body (used inside .project-page section)
    // ---------------------------------------------------------
    function renderCaseStudyBlock(title, content) {
        if (!content || (Array.isArray(content) && !content.length)) return "";
        const body = Array.isArray(content)
            ? `<ul>${content.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>`
            : `<p>${esc(content)}</p>`;
        return `
        <div class="case-study-block">
            <h3>${esc(title)}</h3>
            ${body}
        </div>`;
    }

    function renderCaseStudy(project) {
        const badge = project.demoBadge !== false
            ? '<div class="case-study-meta"><span class="badge-demo">Personal / Portfolio Demo Project</span></div>'
            : "";

        const video = project.video && project.video.src
            ? `
        <video controls class="project-video" preload="metadata"
               data-video-id="${esc(project.video.id || project.id)}"
               data-video-name="${esc(project.video.name || project.name)}">
            <source src="${esc(project.video.src)}" type="video/mp4">
            Your browser does not support the video tag.
        </video>` : "";

        const blocks = [
            renderCaseStudyBlock("Problem", project.problem),
            renderCaseStudyBlock("Objective", project.objective),
            renderCaseStudyBlock("Approach", project.approach),
            renderCaseStudyBlock("What I Built", project.whatIBuilt),
            renderCaseStudyBlock("Key Insights", project.keyInsights),
            renderCaseStudyBlock("Outcome", project.outcome)
        ].filter(Boolean).join("\n");

        const tools = (project.toolsUsedFull || [])
            .map((t) => `<span>${esc(t)}</span>`)
            .join("");

        return `
        ${badge}
        <h1>${esc(project.name)}</h1>
        <p>${esc(project.intro || project.description)}</p>
        <img src="${esc(project.image)}" class="project-image" alt="${esc(project.imageAlt || project.name)} preview">
        ${video}
        ${blocks ? `<div class="case-study-grid">${blocks}</div>` : ""}
        ${tools ? `<h2>Tools Used</h2><div class="case-study-tools">${tools}</div>` : ""}
        <br>
        <a href="index.html#portfolio" class="btn">⬅ Back to Portfolio</a>`;
    }

    window.HM_ProjectTemplates = {
        esc,
        isPublic,
        renderProjectCard,
        renderProjectGrid,
        getCategories,
        renderFilterButtons,
        renderCaseStudy
    };
})();
