// ==========================================================
// HM Portfolio — Main Script
// Static site version (no Flask / server-side dependencies)
// ==========================================================

console.log("🚀 HM Portfolio Loaded Successfully");

document.addEventListener("DOMContentLoaded", () => {

    const CONFIG = window.HM_CONFIG || {};

    /* ================= LIVE STATS (from config.js) =================
       Edit window.HM_CONFIG.STATS in assets/js/config.js to update
       these numbers everywhere — no HTML editing required. */
    const statsContainer = document.getElementById("statsContainer");
    if (statsContainer && Array.isArray(CONFIG.STATS) && CONFIG.STATS.length) {
        statsContainer.innerHTML = CONFIG.STATS.map((stat) => `
            <div class="stat-box">
                <h2 class="counter" data-target="${stat.target}" data-suffix="${stat.suffix || ""}">0</h2>
                <p>${stat.label}</p>
            </div>
        `).join("");
    }

    /* ================= AVAILABILITY BADGE (from config.js) ================= */
    const availabilityEl = document.getElementById("availabilityBadge");
    if (availabilityEl) {
        const available = CONFIG.AVAILABLE_FOR_WORK !== false;
        availabilityEl.classList.toggle("is-available", available);
        availabilityEl.classList.toggle("is-unavailable", !available);
        availabilityEl.querySelector(".availability-text").textContent = available
            ? (CONFIG.AVAILABILITY_TEXT_AVAILABLE || "Available for freelance projects")
            : (CONFIG.AVAILABILITY_TEXT_UNAVAILABLE || "Currently unavailable");
    }

    /* ================= SCROLL REVEAL (sections) ================= */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll("section").forEach((section) => {
        section.classList.add("hidden");
        revealObserver.observe(section);
    });

    /* ================= NAVBAR BACKGROUND ON SCROLL ================= */
    const nav = document.querySelector(".navbar");
    if (nav) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
                nav.style.background = "rgba(0,0,0,.95)";
            } else {
                nav.style.background = "rgba(7,7,7,.7)";
            }
        });
    }

    /* ================= MOBILE NAV TOGGLE ================= */
    const navToggle = document.getElementById("navToggle");
    const navLinks = document.querySelector(".nav-links");

    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => {
            navToggle.classList.toggle("active");
            navLinks.classList.toggle("active");
        });

        // Close mobile menu when a link is clicked
        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                navToggle.classList.remove("active");
                navLinks.classList.remove("active");
            });
        });
    }

    /* ================= LOADER ================= */
    const loader = document.getElementById("loader");
    if (loader) {
        window.addEventListener("load", () => {
            setTimeout(() => {
                loader.style.opacity = "0";
                loader.style.visibility = "hidden";
            }, 700);
        });
        // Safety net in case the "load" event already fired or is delayed
        setTimeout(() => {
            loader.style.opacity = "0";
            loader.style.visibility = "hidden";
        }, 3000);
    }

    /* ================= TYPING EFFECT (from config.js) ================= */
    const typingEl = document.getElementById("typing");
    const typedStrings = (Array.isArray(CONFIG.TYPED_STRINGS) && CONFIG.TYPED_STRINGS.length)
        ? CONFIG.TYPED_STRINGS
        : ["Data Analyst", "Power BI Developer", "Excel Dashboard Expert", "KPI Dashboard Builder"];

    if (typingEl && typeof Typed !== "undefined") {
        new Typed("#typing", {
            strings: typedStrings,
            typeSpeed: 70,
            backSpeed: 40,
            backDelay: 1800,
            loop: true
        });
    }

    /* ================= SOCIAL / CONTACT LINKS (from config.js) =================
       If window.HM_CONFIG.SOCIAL_LINKS has a value for a given key, it overrides
       the link already in the HTML. If a value is missing/empty, the existing
       hardcoded href in the HTML is left exactly as-is — nothing ever breaks. */
    const SOCIAL = CONFIG.SOCIAL_LINKS || {};
    function applyLink(id, url) {
        if (!url) return;
        const el = document.getElementById(id);
        if (el) el.href = url;
    }
    applyLink("socialLinkedin", SOCIAL.linkedin);
    applyLink("socialGithub", SOCIAL.github);
    applyLink("socialEmail", SOCIAL.email ? "mailto:" + SOCIAL.email : "");
    applyLink("contactLinkedin", SOCIAL.linkedin);
    applyLink("contactFiverr", SOCIAL.fiverr);
    applyLink("contactEmail", SOCIAL.email ? "mailto:" + SOCIAL.email : "");

    /* ================= CARD VISUAL EFFECTS (tilt + reveal) =================
       Skill cards, service/tool cards, and project cards are now rendered
       dynamically (see skills-render.js / tools-render.js / portfolio-render.js)
       instead of being hardcoded in this HTML file. Each of those renderers
       calls this shared helper right after it injects its cards, so the same
       3D-tilt and scroll-reveal effects apply exactly as before. */
    window.HM_applyCardEffects = function (selector) {
        const els = document.querySelectorAll(selector);
        if (!els.length) return;

        if (typeof VanillaTilt !== "undefined") {
            VanillaTilt.init(els, {
                max: 12,
                speed: 400,
                glare: true,
                "max-glare": 0.25,
                scale: 1.03
            });
        }

        if (typeof ScrollReveal !== "undefined") {
            ScrollReveal().reveal(selector, {
                distance: "60px",
                duration: 1200,
                origin: "bottom",
                interval: 150
            });
        }
    };

    /* ================= COUNTERS ================= */
    const counters = document.querySelectorAll(".counter");
    if (counters.length) {
        const animateCounter = (counter) => {
            const target = +counter.getAttribute("data-target");
            const suffix = counter.getAttribute("data-suffix") ?? "+";
            const update = () => {
                const count = +counter.innerText.replace(/\D/g, "") || 0;
                const increment = Math.max(target / 100, 1);
                if (count < target) {
                    counter.innerText = Math.ceil(count + increment);
                    requestAnimationFrame(() => setTimeout(update, 20));
                } else {
                    counter.innerText = target + suffix;
                }
            };
            update();
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach((counter) => counterObserver.observe(counter));
    }

    /* ================= BACK TO TOP ================= */
    const backToTop = document.getElementById("backToTop");
    if (backToTop) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) {
                backToTop.classList.add("show");
            } else {
                backToTop.classList.remove("show");
            }
        });

        backToTop.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ================= SCROLLREVEAL (extra flourish) =================
       .skill-card / .card / .project-card reveal is now handled by
       window.HM_applyCardEffects(), called by each data renderer right
       after it injects its cards (see skills-render.js, tools-render.js,
       portfolio-render.js). Only the static, always-present elements
       below are revealed here. */
    if (typeof ScrollReveal !== "undefined") {
        const sr = ScrollReveal();

        sr.reveal(".about-content", {
            distance: "80px",
            duration: 1200,
            origin: "left"
        });

        sr.reveal(".hero-image", {
            distance: "80px",
            duration: 1200,
            origin: "right"
        });
    }

});
