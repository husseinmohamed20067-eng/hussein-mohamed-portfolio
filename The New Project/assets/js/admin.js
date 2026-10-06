// ==========================================================
// HM Portfolio — Admin Dashboard Logic
//
// No backend. All edits live in memory + a localStorage draft
// until you click a "Download" button, which exports the real
// JSON/JS file to replace in your GitHub repo. Nothing here can
// modify your live GitHub Pages site by itself.
// ==========================================================

(function () {
    const T = window.HM_ProjectTemplates;

    /* ============ Generic draft-backed data store ============ */
    function makeStore(key, fileUrl) {
        const draftKey = "hm_admin_draft_" + key;
        let data = [];
        let hasDraft = false;

        function load() {
            return fetch(fileUrl)
                .then((res) => res.json())
                .then((fileData) => {
                    const raw = localStorage.getItem(draftKey);
                    if (raw) {
                        try {
                            data = JSON.parse(raw);
                            hasDraft = true;
                        } catch (e) {
                            data = fileData;
                        }
                    } else {
                        data = fileData;
                    }
                    return data;
                });
        }

        function persist() {
            try {
                localStorage.setItem(draftKey, JSON.stringify(data));
                hasDraft = true;
            } catch (e) {
                console.warn("Could not save local draft:", e);
            }
        }

        function discardDraft() {
            localStorage.removeItem(draftKey);
            hasDraft = false;
            return load();
        }

        return {
            get: () => data,
            set: (newData) => { data = newData; persist(); },
            hasDraft: () => hasDraft,
            load,
            discardDraft,
            key
        };
    }

    const projectsStore = makeStore("projects", "data/projects.json");
    const skillsStore = makeStore("skills", "data/skills.json");
    const toolsStore = makeStore("tools", "data/tools.json");

    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function slugify(name) {
        return String(name).toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || ("item-" + Date.now());
    }

    function renderDraftBanner(el, store, onDiscard) {
        if (!store.hasDraft()) { el.innerHTML = ""; return; }
        el.innerHTML = `
            <div class="draft-banner">
                <span>You have unsaved local edits for this section (saved in this browser only).</span>
                <button type="button" class="admin-btn secondary small" id="discard-${store.key}">Discard local draft &amp; reload from file</button>
            </div>`;
        document.getElementById("discard-" + store.key).addEventListener("click", onDiscard);
    }

    /* ============ Tab navigation ============ */
    document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
            document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById("panel-" + btn.dataset.panel).classList.add("active");
            if (btn.dataset.panel === "statistics") renderStatistics();
            if (btn.dataset.panel === "analytics") renderAnalytics();
            if (btn.dataset.panel === "media") renderMedia();
            if (btn.dataset.panel === "dashboard") renderDashboard();
        });
    });

    /* ============================================================
       PROJECTS
    ============================================================ */
    let projectFilter = { search: "", status: "all", category: "all", featuredOnly: false };

    function renderProjectFilters() {
        const projects = projectsStore.get();
        const statusChips = document.getElementById("projectStatusChips");
        const catChips = document.getElementById("projectCategoryChips");

        const statuses = ["all", "draft", "published", "hidden"];
        statusChips.innerHTML = statuses.map((s) =>
            `<button type="button" class="chip ${projectFilter.status === s ? "active" : ""}" data-status="${s}">${s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>`
        ).join("");
        statusChips.querySelectorAll("button").forEach((b) => {
            b.addEventListener("click", () => { projectFilter.status = b.dataset.status; renderProjectsTable(); renderProjectFilters(); });
        });

        const categories = ["all", ...new Set(projects.map((p) => p.category).filter(Boolean))];
        catChips.innerHTML = categories.map((c) =>
            `<button type="button" class="chip ${projectFilter.category === c ? "active" : ""}" data-cat="${c}">${c === "all" ? "All categories" : c}</button>`
        ).join("");
        catChips.querySelectorAll("button").forEach((b) => {
            b.addEventListener("click", () => { projectFilter.category = b.dataset.cat; renderProjectsTable(); renderProjectFilters(); });
        });

        const featChip = document.getElementById("projectFeaturedChip");
        featChip.classList.toggle("active", projectFilter.featuredOnly);
    }

    function renderProjectsTable() {
        const tbody = document.getElementById("projectsTableBody");
        const projects = [...projectsStore.get()].sort((a, b) => (a.order || 0) - (b.order || 0));

        const filtered = projects.filter((p) => {
            if (projectFilter.status !== "all" && p.status !== projectFilter.status) return false;
            if (projectFilter.category !== "all" && p.category !== projectFilter.category) return false;
            if (projectFilter.featuredOnly && !p.featured) return false;
            if (projectFilter.search && !p.name.toLowerCase().includes(projectFilter.search.toLowerCase())) return false;
            return true;
        });

        tbody.innerHTML = filtered.map((p, idx) => `
            <tr data-id="${p.id}">
                <td>
                    ${p.order ?? ""}
                    <button type="button" class="admin-btn secondary small move-up" title="Move up">↑</button>
                    <button type="button" class="admin-btn secondary small move-down" title="Move down">↓</button>
                </td>
                <td>${T.esc(p.name)}</td>
                <td>${T.esc(p.category || "")}</td>
                <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                <td><button type="button" class="star-toggle ${p.featured ? "featured" : ""}" title="Toggle featured">★</button></td>
                <td class="row-actions">
                    <button type="button" class="admin-btn secondary small edit-btn">Edit</button>
                    <button type="button" class="admin-btn secondary small preview-btn">Preview</button>
                    <button type="button" class="admin-btn secondary small duplicate-btn">Duplicate</button>
                    <button type="button" class="admin-btn secondary small hide-btn">${p.status === "hidden" ? "Show" : "Hide"}</button>
                    <button type="button" class="admin-btn danger small delete-btn">Delete</button>
                </td>
            </tr>
        `).join("") || `<tr><td colspan="6" style="color:var(--text-dim);">No projects match your filters.</td></tr>`;

        tbody.querySelectorAll("tr[data-id]").forEach((row) => {
            const id = row.dataset.id;
            row.querySelector(".move-up").addEventListener("click", () => moveProject(id, -1));
            row.querySelector(".move-down").addEventListener("click", () => moveProject(id, 1));
            row.querySelector(".star-toggle").addEventListener("click", () => toggleFeatured(id));
            row.querySelector(".edit-btn").addEventListener("click", () => openProjectForm(id));
            row.querySelector(".preview-btn").addEventListener("click", () => previewProjectById(id));
            row.querySelector(".duplicate-btn").addEventListener("click", () => duplicateProject(id));
            row.querySelector(".hide-btn").addEventListener("click", () => toggleHidden(id));
            row.querySelector(".delete-btn").addEventListener("click", () => deleteProject(id));
        });
    }

    function moveProject(id, dir) {
        const projects = [...projectsStore.get()].sort((a, b) => (a.order || 0) - (b.order || 0));
        const i = projects.findIndex((p) => p.id === id);
        const j = i + dir;
        if (j < 0 || j >= projects.length) return;
        const tmp = projects[i].order;
        projects[i].order = projects[j].order;
        projects[j].order = tmp;
        projectsStore.set(projects);
        renderProjectsTable();
    }

    function toggleFeatured(id) {
        const projects = projectsStore.get().map((p) => p.id === id ? { ...p, featured: !p.featured } : p);
        projectsStore.set(projects);
        renderProjectsTable();
    }

    function toggleHidden(id) {
        const projects = projectsStore.get().map((p) => {
            if (p.id !== id) return p;
            return { ...p, status: p.status === "hidden" ? "published" : "hidden" };
        });
        projectsStore.set(projects);
        renderProjectsTable();
    }

    function duplicateProject(id) {
        const projects = projectsStore.get();
        const original = projects.find((p) => p.id === id);
        if (!original) return;
        const copy = JSON.parse(JSON.stringify(original));
        copy.id = slugify(original.name) + "-copy-" + Date.now().toString().slice(-4);
        copy.name = original.name + " (Copy)";
        copy.status = "draft";
        copy.order = Math.max(0, ...projects.map((p) => p.order || 0)) + 1;
        projectsStore.set([...projects, copy]);
        renderProjectsTable();
        renderProjectFilters();
    }

    function deleteProject(id) {
        const project = projectsStore.get().find((p) => p.id === id);
        if (!project) return;
        if (!confirm(`Delete "${project.name}"? This only affects your local draft until you export — but it cannot be undone in this browser.`)) return;
        projectsStore.set(projectsStore.get().filter((p) => p.id !== id));
        renderProjectsTable();
        renderProjectFilters();
    }

    function projectFromForm() {
        const tags = document.getElementById("pf_tags").value.split(",").map((s) => s.trim()).filter(Boolean);
        const toolsFull = document.getElementById("pf_toolsFull").value.split(",").map((s) => s.trim()).filter(Boolean);
        const approach = document.getElementById("pf_approach").value.split("\n").map((s) => s.trim()).filter(Boolean);
        const videoSrc = document.getElementById("pf_video").value.trim();
        const name = document.getElementById("pf_name").value.trim();
        const existingId = document.getElementById("pf_id").value;

        return {
            id: existingId || slugify(name),
            name,
            description: document.getElementById("pf_description").value.trim(),
            category: document.getElementById("pf_category").value.trim(),
            tags,
            toolsUsedFull: toolsFull,
            image: document.getElementById("pf_image").value.trim(),
            imageAlt: name,
            hoverNote: "",
            video: videoSrc ? {
                src: videoSrc,
                id: document.getElementById("pf_videoId").value.trim() || slugify(name),
                name: name + " Walkthrough"
            } : null,
            url: document.getElementById("pf_url").value.trim(),
            demoBadge: true,
            intro: document.getElementById("pf_description").value.trim(),
            problem: document.getElementById("pf_problem").value.trim(),
            objective: document.getElementById("pf_objective").value.trim(),
            approach,
            whatIBuilt: document.getElementById("pf_whatIBuilt").value.trim(),
            keyInsights: document.getElementById("pf_keyInsights").value.trim(),
            outcome: document.getElementById("pf_outcome").value.trim(),
            featured: document.getElementById("pf_featured").checked,
            status: document.getElementById("pf_status").value,
            order: parseInt(document.getElementById("pf_order").value, 10) || 0
        };
    }

    function fillProjectForm(p) {
        document.getElementById("pf_id").value = p.id || "";
        document.getElementById("pf_name").value = p.name || "";
        document.getElementById("pf_category").value = p.category || "";
        document.getElementById("pf_description").value = p.description || "";
        document.getElementById("pf_tags").value = (p.tags || []).join(", ");
        document.getElementById("pf_toolsFull").value = (p.toolsUsedFull || []).join(", ");
        document.getElementById("pf_image").value = p.image || "";
        document.getElementById("pf_url").value = p.url || "";
        document.getElementById("pf_video").value = p.video ? p.video.src : "";
        document.getElementById("pf_videoId").value = p.video ? p.video.id : "";
        document.getElementById("pf_problem").value = p.problem || "";
        document.getElementById("pf_objective").value = p.objective || "";
        document.getElementById("pf_approach").value = (p.approach || []).join("\n");
        document.getElementById("pf_whatIBuilt").value = p.whatIBuilt || "";
        document.getElementById("pf_keyInsights").value = p.keyInsights || "";
        document.getElementById("pf_outcome").value = p.outcome || "";
        document.getElementById("pf_status").value = p.status || "draft";
        document.getElementById("pf_order").value = p.order ?? (projectsStore.get().length + 1);
        document.getElementById("pf_featured").checked = !!p.featured;
        renderImagePreview();
    }

    function renderImagePreview() {
        const path = document.getElementById("pf_image").value.trim();
        const wrap = document.getElementById("pf_imagePreviewWrap");
        wrap.innerHTML = path
            ? `<img src="${T.esc(path)}" alt="preview" style="max-width:160px;border-radius:8px;border:1px solid var(--border);margin-bottom:10px;" onerror="this.style.display='none'">`
            : "";
    }
    document.getElementById("pf_image").addEventListener("input", renderImagePreview);

    function openProjectForm(id) {
        const isNew = !id;
        document.getElementById("projectModalTitle").textContent = isNew ? "Add Project" : "Edit Project";
        if (isNew) {
            fillProjectForm({ status: "draft" });
            document.getElementById("pf_id").value = "";
        } else {
            const p = projectsStore.get().find((x) => x.id === id);
            fillProjectForm(p);
        }
        document.getElementById("projectModalOverlay").classList.add("show");
    }

    document.getElementById("addProjectBtn").addEventListener("click", () => openProjectForm(null));
    document.getElementById("cancelProjectBtn").addEventListener("click", () => {
        document.getElementById("projectModalOverlay").classList.remove("show");
    });

    document.getElementById("projectForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const project = projectFromForm();
        if (!project.name) return;
        const existingId = document.getElementById("pf_id").value;
        let projects = projectsStore.get();
        if (existingId) {
            projects = projects.map((p) => p.id === existingId ? project : p);
        } else {
            projects = [...projects, project];
        }
        projectsStore.set(projects);
        document.getElementById("projectModalOverlay").classList.remove("show");
        renderProjectsTable();
        renderProjectFilters();
        renderDraftBanner(document.getElementById("projectsDraftBanner"), projectsStore, () => {
            projectsStore.discardDraft().then(() => { renderProjectsTable(); renderProjectFilters(); renderDraftBanner(document.getElementById("projectsDraftBanner"), projectsStore, arguments.callee); });
        });
    });

    function previewProjectById(id) {
        const p = projectsStore.get().find((x) => x.id === id);
        showPreview(p);
    }

    document.getElementById("previewProjectBtn").addEventListener("click", () => {
        showPreview(projectFromForm());
    });

    function showPreview(project) {
        const content = document.getElementById("previewContent");
        content.innerHTML = `
            <div class="preview-card-wrap">${T.renderProjectCard({ ...project, status: "published" })}</div>
            <hr style="border-color:var(--border);margin:20px 0;">
            <div class="project-page">${T.renderCaseStudy(project)}</div>
        `;
        document.getElementById("previewModalOverlay").classList.add("show");
    }
    document.getElementById("closePreviewBtn").addEventListener("click", () => {
        document.getElementById("previewModalOverlay").classList.remove("show");
    });

    document.getElementById("projectSearch").addEventListener("input", (e) => {
        projectFilter.search = e.target.value;
        renderProjectsTable();
    });
    document.getElementById("projectFeaturedChip").addEventListener("click", () => {
        projectFilter.featuredOnly = !projectFilter.featuredOnly;
        renderProjectFilters();
        renderProjectsTable();
    });
    document.getElementById("exportProjectsBtn").addEventListener("click", () => {
        downloadFile("projects.json", JSON.stringify(projectsStore.get(), null, 2));
    });
    document.getElementById("resetProjectsBtn").addEventListener("click", () => {
        if (!confirm("Discard your local project draft and reload from data/projects.json?")) return;
        projectsStore.discardDraft().then(() => {
            renderProjectsTable();
            renderProjectFilters();
            document.getElementById("projectsDraftBanner").innerHTML = "";
        });
    });

    /* ============================================================
       SKILLS + TOOLS (shared logic, different store/labels)
    ============================================================ */
    function setupItemManager(cfg) {
        const { store, tbodyId, searchId, addBtnId, exportBtnId, resetBtnId, exportName, draftBannerId, hasCategory } = cfg;

        function render() {
            const tbody = document.getElementById(tbodyId);
            const search = (document.getElementById(searchId).value || "").toLowerCase();
            const items = [...store.get()]
                .filter((i) => i.name.toLowerCase().includes(search))
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            tbody.innerHTML = items.map((item) => `
                <tr data-id="${item.id}">
                    <td>
                        ${item.order ?? ""}
                        <button type="button" class="admin-btn secondary small move-up">↑</button>
                        <button type="button" class="admin-btn secondary small move-down">↓</button>
                    </td>
                    <td><i class="${T.esc(item.icon || "")}" style="color:var(--gold);"></i></td>
                    <td>${T.esc(item.name)}</td>
                    <td>${T.esc(item.description || "")}</td>
                    <td>${item.visible !== false ? "Yes" : "No"}</td>
                    <td class="row-actions">
                        <button type="button" class="admin-btn secondary small edit-btn">Edit</button>
                        <button type="button" class="admin-btn secondary small vis-btn">${item.visible !== false ? "Hide" : "Show"}</button>
                        <button type="button" class="admin-btn danger small delete-btn">Delete</button>
                    </td>
                </tr>
            `).join("") || `<tr><td colspan="6" style="color:var(--text-dim);">Nothing here yet.</td></tr>`;

            tbody.querySelectorAll("tr[data-id]").forEach((row) => {
                const id = row.dataset.id;
                row.querySelector(".move-up").addEventListener("click", () => move(id, -1));
                row.querySelector(".move-down").addEventListener("click", () => move(id, 1));
                row.querySelector(".edit-btn").addEventListener("click", () => openForm(id));
                row.querySelector(".vis-btn").addEventListener("click", () => toggleVisible(id));
                row.querySelector(".delete-btn").addEventListener("click", () => del(id));
            });
        }

        function move(id, dir) {
            const items = [...store.get()].sort((a, b) => (a.order || 0) - (b.order || 0));
            const i = items.findIndex((x) => x.id === id);
            const j = i + dir;
            if (j < 0 || j >= items.length) return;
            const tmp = items[i].order;
            items[i].order = items[j].order;
            items[j].order = tmp;
            store.set(items);
            render();
        }

        function toggleVisible(id) {
            store.set(store.get().map((i) => i.id === id ? { ...i, visible: i.visible === false } : i));
            render();
        }

        function del(id) {
            const item = store.get().find((i) => i.id === id);
            if (!item) return;
            if (!confirm(`Delete "${item.name}"?`)) return;
            store.set(store.get().filter((i) => i.id !== id));
            render();
        }

        function openForm(id) {
            const isNew = !id;
            document.getElementById("itemModalTitle").textContent = (isNew ? "Add " : "Edit ") + cfg.label;
            document.getElementById("if_kind").value = cfg.kind;
            document.getElementById("if_id").value = id || "";
            document.getElementById("if_categoryWrap").style.display = hasCategory ? "" : "none";

            const item = isNew ? {} : store.get().find((x) => x.id === id);
            document.getElementById("if_name").value = item.name || "";
            document.getElementById("if_icon").value = item.icon || "";
            document.getElementById("if_description").value = item.description || "";
            document.getElementById("if_category").value = item.category || "";
            document.getElementById("if_order").value = item.order ?? (store.get().length + 1);
            document.getElementById("if_visible").checked = item.visible !== false;
            updateIconPreview();
            document.getElementById("itemModalOverlay").classList.add("show");
        }

        function updateIconPreview() {
            document.getElementById("if_iconPreview").className = "icon-preview " + (document.getElementById("if_icon").value || "");
        }
        document.getElementById("if_icon").addEventListener("input", updateIconPreview);

        document.getElementById(addBtnId).addEventListener("click", () => {
            currentItemKind = cfg;
            openForm(null);
        });
        document.getElementById(searchId).addEventListener("input", render);
        document.getElementById(exportBtnId).addEventListener("click", () => {
            downloadFile(exportName, JSON.stringify(store.get(), null, 2));
        });
        document.getElementById(resetBtnId).addEventListener("click", () => {
            if (!confirm("Discard your local draft and reload from the file?")) return;
            store.discardDraft().then(render);
        });

        cfg._openForm = openForm;
        cfg._render = render;
        return { render, openForm };
    }

    let currentItemKind = null;

    const skillsManager = setupItemManager({
        kind: "skill", label: "Skill", store: skillsStore,
        tbodyId: "skillsTableBody", searchId: "skillSearch",
        addBtnId: "addSkillBtn", exportBtnId: "exportSkillsBtn", resetBtnId: "resetSkillsBtn",
        exportName: "skills.json", draftBannerId: "skillsDraftBanner", hasCategory: true
    });
    const toolsManager = setupItemManager({
        kind: "tool", label: "Tool", store: toolsStore,
        tbodyId: "toolsTableBody", searchId: "toolSearch",
        addBtnId: "addToolBtn", exportBtnId: "exportToolsBtn", resetBtnId: "resetToolsBtn",
        exportName: "tools.json", draftBannerId: "toolsDraftBanner", hasCategory: false
    });

    document.getElementById("addSkillBtn").addEventListener("click", () => { currentItemKind = "skill"; });
    document.getElementById("addToolBtn").addEventListener("click", () => { currentItemKind = "tool"; });

    document.getElementById("cancelItemBtn").addEventListener("click", () => {
        document.getElementById("itemModalOverlay").classList.remove("show");
    });

    document.getElementById("itemForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const kind = document.getElementById("if_kind").value;
        const store = kind === "skill" ? skillsStore : toolsStore;
        const existingId = document.getElementById("if_id").value;
        const name = document.getElementById("if_name").value.trim();
        if (!name) return;

        const item = {
            id: existingId || slugify(name),
            name,
            icon: document.getElementById("if_icon").value.trim(),
            description: document.getElementById("if_description").value.trim(),
            category: document.getElementById("if_category").value.trim(),
            order: parseInt(document.getElementById("if_order").value, 10) || 0,
            visible: document.getElementById("if_visible").checked
        };

        let items = store.get();
        items = existingId ? items.map((i) => i.id === existingId ? item : i) : [...items, item];
        store.set(items);

        document.getElementById("itemModalOverlay").classList.remove("show");
        (kind === "skill" ? skillsManager : toolsManager).render();
    });

    /* ============================================================
       MEDIA (derived read-only view)
    ============================================================ */
    function renderMedia() {
        const projects = projectsStore.get();
        const imgBody = document.getElementById("mediaImagesBody");
        const vidBody = document.getElementById("mediaVideosBody");

        imgBody.innerHTML = projects.filter((p) => p.image).map((p) => `
            <tr>
                <td><img src="${T.esc(p.image)}" style="width:60px;border-radius:6px;" onerror="this.style.opacity='.2'"></td>
                <td>${T.esc(p.image)}</td>
                <td>${T.esc(p.imageAlt || p.name)}</td>
                <td>${T.esc(p.name)}</td>
                <td><button type="button" class="admin-btn secondary small jump-edit" data-id="${p.id}">Edit project</button></td>
            </tr>
        `).join("") || `<tr><td colspan="5" style="color:var(--text-dim);">No images referenced yet.</td></tr>`;

        vidBody.innerHTML = projects.filter((p) => p.video && p.video.src).map((p) => `
            <tr>
                <td>${T.esc(p.video.src)}</td>
                <td>${T.esc(p.video.id)}</td>
                <td>${T.esc(p.video.name)}</td>
                <td>${T.esc(p.name)}</td>
                <td><button type="button" class="admin-btn secondary small jump-edit" data-id="${p.id}">Edit project</button></td>
            </tr>
        `).join("") || `<tr><td colspan="5" style="color:var(--text-dim);">No videos referenced yet.</td></tr>`;

        document.querySelectorAll(".jump-edit").forEach((btn) => {
            btn.addEventListener("click", () => {
                document.querySelector('.nav-btn[data-panel="projects"]').click();
                openProjectForm(btn.dataset.id);
            });
        });
    }

    /* ============================================================
       STATISTICS (computed, never invented)
    ============================================================ */
    function renderStatistics() {
        const projects = projectsStore.get();
        const cards = [
            { label: "Total Projects", num: projects.length },
            { label: "Published", num: projects.filter((p) => p.status === "published").length },
            { label: "Draft", num: projects.filter((p) => p.status === "draft").length },
            { label: "Hidden", num: projects.filter((p) => p.status === "hidden").length },
            { label: "Featured", num: projects.filter((p) => p.featured).length },
            { label: "Skills Listed", num: skillsStore.get().length },
            { label: "Tools Listed", num: toolsStore.get().length }
        ];
        document.getElementById("statsComputedCards").innerHTML = cards.map((c) => `
            <div class="admin-stat-card"><div class="num">${c.num}</div><div class="label">${c.label}</div></div>
        `).join("");
    }

    /* ============================================================
       ANALYTICS
    ============================================================ */
    function renderAnalytics() {
        const CONFIG = window.HM_CONFIG || {};
        const gaId = CONFIG.GA_MEASUREMENT_ID || "";
        const configured = gaId && gaId.indexOf("XXXX") === -1;
        document.getElementById("gaStatusBox").innerHTML = configured
            ? `<strong style="color:var(--ok);">GA4 configured</strong> — Measurement ID <code>${T.esc(gaId)}</code> is set in <code>assets/js/config.js</code>. Tracking is active for visitors who accept the consent bar.`
            : `<strong style="color:var(--warn);">GA4 not configured yet</strong> — <code>GA_MEASUREMENT_ID</code> in <code>assets/js/config.js</code> is still the placeholder, so analytics is currently inactive. Set it in the Site Settings tab.`;

        let log = [];
        try { log = JSON.parse(localStorage.getItem("hm_local_event_log") || "[]"); } catch (e) { /* ignore */ }
        document.getElementById("localEventLogBody").innerHTML = log.map((e) => `
            <tr>
                <td>${T.esc(new Date(e.time).toLocaleString())}</td>
                <td>${T.esc(e.event)}</td>
                <td>${T.esc(JSON.stringify(e.params || {}))}</td>
            </tr>
        `).join("") || `<tr><td colspan="3" style="color:var(--text-dim);">No local events captured yet — browse the live site in another tab to generate some.</td></tr>`;
    }

    document.getElementById("clearLocalLogBtn").addEventListener("click", () => {
        localStorage.removeItem("hm_local_event_log");
        renderAnalytics();
    });

    /* ============================================================
       SITE SETTINGS (config.js proxy)
    ============================================================ */
    function fillSettingsForm() {
        const CONFIG = window.HM_CONFIG || {};
        document.getElementById("cfgGaId").value = CONFIG.GA_MEASUREMENT_ID || "";
        document.getElementById("cfgAvailable").checked = CONFIG.AVAILABLE_FOR_WORK !== false;
        document.getElementById("cfgAvailText").value = CONFIG.AVAILABILITY_TEXT_AVAILABLE || "";
        document.getElementById("cfgUnavailText").value = CONFIG.AVAILABILITY_TEXT_UNAVAILABLE || "";

        const social = CONFIG.SOCIAL_LINKS || {};
        document.getElementById("cfgLinkedin").value = social.linkedin || "";
        document.getElementById("cfgGithub").value = social.github || "";
        document.getElementById("cfgFiverr").value = social.fiverr || "";
        document.getElementById("cfgEmail").value = social.email || "";

        document.getElementById("cfgTypedStrings").value = (CONFIG.TYPED_STRINGS || []).join("\n");

        renderStatsEditor(CONFIG.STATS || []);
    }

    function renderStatsEditor(stats) {
        const wrap = document.getElementById("statsEditorRows");
        wrap.innerHTML = stats.map((s, i) => `
            <div class="admin-field-row" data-idx="${i}">
                <div class="admin-field"><label>Target</label><input type="number" class="admin-input stat-target" value="${s.target}"></div>
                <div class="admin-field"><label>Suffix</label><input type="text" class="admin-input stat-suffix" value="${T.esc(s.suffix || "")}"></div>
                <div class="admin-field"><label>Label</label><input type="text" class="admin-input stat-label" value="${T.esc(s.label || "")}"></div>
                <div class="admin-field" style="flex:0;"><label>&nbsp;</label><button type="button" class="admin-btn danger small remove-stat">✕</button></div>
            </div>
        `).join("");
        wrap.querySelectorAll(".remove-stat").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.target.closest("[data-idx]").remove();
            });
        });
    }

    document.getElementById("addStatRowBtn").addEventListener("click", () => {
        const wrap = document.getElementById("statsEditorRows");
        const div = document.createElement("div");
        div.className = "admin-field-row";
        div.innerHTML = `
            <div class="admin-field"><label>Target</label><input type="number" class="admin-input stat-target" value="0"></div>
            <div class="admin-field"><label>Suffix</label><input type="text" class="admin-input stat-suffix" value=""></div>
            <div class="admin-field"><label>Label</label><input type="text" class="admin-input stat-label" value="New Counter"></div>
            <div class="admin-field" style="flex:0;"><label>&nbsp;</label><button type="button" class="admin-btn danger small remove-stat">✕</button></div>
        `;
        div.querySelector(".remove-stat").addEventListener("click", () => div.remove());
        wrap.appendChild(div);
    });

    function collectStatsFromForm() {
        return [...document.querySelectorAll("#statsEditorRows .admin-field-row")].map((row) => ({
            target: parseInt(row.querySelector(".stat-target").value, 10) || 0,
            suffix: row.querySelector(".stat-suffix").value,
            label: row.querySelector(".stat-label").value
        }));
    }

    function buildConfigJsText() {
        const gaId = document.getElementById("cfgGaId").value.trim() || "G-XXXXXXXXXX";
        const available = document.getElementById("cfgAvailable").checked;
        const availText = document.getElementById("cfgAvailText").value.trim();
        const unavailText = document.getElementById("cfgUnavailText").value.trim();
        const stats = collectStatsFromForm();
        const linkedin = document.getElementById("cfgLinkedin").value.trim();
        const github = document.getElementById("cfgGithub").value.trim();
        const fiverr = document.getElementById("cfgFiverr").value.trim();
        const email = document.getElementById("cfgEmail").value.trim();
        const typedStrings = document.getElementById("cfgTypedStrings").value.split("\n").map((s) => s.trim()).filter(Boolean);
        const videoNames = (window.HM_CONFIG && window.HM_CONFIG.VIDEO_NAMES) || {};

        const statsBlock = stats.map((s) =>
            `        { target: ${s.target}, suffix: "${s.suffix}", label: "${s.label}" }`
        ).join(",\n");

        const typedBlock = typedStrings.map((s) => `        "${s.replace(/"/g, '\\"')}"`).join(",\n");

        const videoNamesBlock = Object.entries(videoNames)
            .map(([k, v]) => `        ${k}: "${v}"`).join(",\n");

        return `// ==========================================================
// HM Portfolio — Site Configuration
// Generated by admin.html — edit values here or in the dashboard,
// then re-download and commit this file to publish changes.
// ==========================================================

window.HM_CONFIG = {

    // ---------------------------------------------------------
    // GOOGLE ANALYTICS 4
    // Get it from: Google Analytics → Admin → Data Streams → your stream.
    // See ANALYTICS.md for full setup instructions.
    // ---------------------------------------------------------
    GA_MEASUREMENT_ID: "${gaId}",

    // ---------------------------------------------------------
    // AVAILABILITY BADGE
    // ---------------------------------------------------------
    AVAILABLE_FOR_WORK: ${available},
    AVAILABILITY_TEXT_AVAILABLE: "${availText}",
    AVAILABILITY_TEXT_UNAVAILABLE: "${unavailText}",

    // ---------------------------------------------------------
    // LIVE STATS (Home page counters)
    // ---------------------------------------------------------
    STATS: [
${statsBlock}
    ],

    // ---------------------------------------------------------
    // SOCIAL / CONTACT LINKS
    // Leave a value empty ("") to keep whatever is hardcoded in the HTML.
    // ---------------------------------------------------------
    SOCIAL_LINKS: {
        linkedin: "${linkedin}",
        github: "${github}",
        fiverr: "${fiverr}",
        email: "${email}"
    },

    // ---------------------------------------------------------
    // HERO TYPED-TEXT
    // ---------------------------------------------------------
    TYPED_STRINGS: [
${typedBlock}
    ],

    // ---------------------------------------------------------
    // VIDEO TRACKING LABELS
    // ---------------------------------------------------------
    VIDEO_NAMES: {
${videoNamesBlock}
    }
};
`;
    }

    document.getElementById("downloadConfigBtn").addEventListener("click", () => {
        const blob = new Blob([buildConfigJsText()], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "config.js";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    /* ============================================================
       DASHBOARD OVERVIEW
    ============================================================ */
    function renderDashboard() {
        const projects = projectsStore.get();
        const CONFIG = window.HM_CONFIG || {};
        const gaConfigured = CONFIG.GA_MEASUREMENT_ID && CONFIG.GA_MEASUREMENT_ID.indexOf("XXXX") === -1;

        const cards = [
            { label: "Total Projects", num: projects.length },
            { label: "Published", num: projects.filter((p) => p.status === "published").length },
            { label: "Skills Listed", num: skillsStore.get().length },
            { label: "Tools Listed", num: toolsStore.get().length },
            { label: "GA4 Status", num: gaConfigured ? "On" : "Off" }
        ];
        document.getElementById("dashboardCards").innerHTML = cards.map((c) => `
            <div class="admin-stat-card"><div class="num">${c.num}</div><div class="label">${c.label}</div></div>
        `).join("");
    }

    /* ============================================================
       INITIAL LOAD
    ============================================================ */
    Promise.all([projectsStore.load(), skillsStore.load(), toolsStore.load()]).then(() => {
        renderProjectFilters();
        renderProjectsTable();
        skillsManager.render();
        toolsManager.render();
        renderDashboard();
        fillSettingsForm();

        renderDraftBanner(document.getElementById("projectsDraftBanner"), projectsStore, () => {
            projectsStore.discardDraft().then(() => {
                renderProjectsTable();
                renderProjectFilters();
                document.getElementById("projectsDraftBanner").innerHTML = "";
            });
        });
        renderDraftBanner(document.getElementById("skillsDraftBanner"), skillsStore, () => {
            skillsStore.discardDraft().then(() => { skillsManager.render(); document.getElementById("skillsDraftBanner").innerHTML = ""; });
        });
        renderDraftBanner(document.getElementById("toolsDraftBanner"), toolsStore, () => {
            toolsStore.discardDraft().then(() => { toolsManager.render(); document.getElementById("toolsDraftBanner").innerHTML = ""; });
        });
    }).catch((err) => {
        console.error("Admin: failed to load data files", err);
        alert("Could not load data/projects.json, data/skills.json or data/tools.json. If you opened this file directly (file://), run a local server instead — see README.md.");
    });
})();
