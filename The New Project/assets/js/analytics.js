// ==========================================================
// HM Portfolio — Analytics (Google Analytics 4)
//
// - Loads GA4 ONLY after the visitor accepts the consent bar
//   (see consent.js). If declined or blocked, the site keeps
//   working normally — every call below fails silently.
// - Collects standard, anonymous GA4 data only. Does NOT collect
//   names, emails, phone numbers, or any other personal info.
// - Full list of tracked events: see ANALYTICS.md
// ==========================================================

(function () {

    const CONFIG = window.HM_CONFIG || {};
    const GA_ID = CONFIG.GA_MEASUREMENT_ID || "";
    let gaLoaded = false;

    /* ---------------------------------------------------------
       Safe gtag wrapper — never throws, never blocks the page.
    --------------------------------------------------------- */
    function gtagSafe(...args) {
        try {
            if (typeof window.gtag === "function") {
                window.gtag(...args);
            }
        } catch (err) {
            console.warn("Analytics call skipped:", err);
        }
    }
    /* ---------------------------------------------------------
       Local event log — THIS BROWSER ONLY, for the admin
       dashboard's "recent local test events" panel. This is not
       global analytics data; it never leaves this device and
       cannot show other visitors' activity. Ring buffer, max 50.
    --------------------------------------------------------- */
    const LOCAL_LOG_KEY = "hm_local_event_log";
    function logLocalEvent(eventName, params) {
        try {
            const log = JSON.parse(localStorage.getItem(LOCAL_LOG_KEY) || "[]");
            log.unshift({ event: eventName, params: params || {}, time: new Date().toISOString() });
            localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(log.slice(0, 50)));
        } catch (e) {
            /* ignore — logging must never break the site */
        }
    }

    window.hmTrack = function (eventName, params) {
        logLocalEvent(eventName, params);
        gtagSafe("event", eventName, params || {});
    };

    /* ---------------------------------------------------------
       Load GA4 script dynamically, only once, only with consent.
    --------------------------------------------------------- */
    function loadGA4() {
        if (gaLoaded) return;
        if (!GA_ID || GA_ID.indexOf("XXXX") !== -1) {
            console.info(
                "HM Portfolio: GA4 Measurement ID not configured yet — analytics disabled. " +
                "Set window.HM_CONFIG.GA_MEASUREMENT_ID in assets/js/config.js."
            );
            return;
        }

        gaLoaded = true;

        try {
            const script = document.createElement("script");
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
            script.onerror = () => console.warn("GA4 script failed to load (likely blocked). Site continues normally.");
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function () { window.dataLayer.push(arguments); };
            window.gtag("js", new Date());
            // anonymize/standard privacy-conscious config — no ad personalization signals
            window.gtag("config", GA_ID, {
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false
            });

            initTracking();
        } catch (err) {
            console.warn("Analytics initialization skipped:", err);
        }
    }

    // If consent was already granted on a previous visit, consent.js
    // dispatches this immediately. Otherwise it fires when the visitor
    // clicks "Accept" on the consent bar.
    window.addEventListener("hm-analytics-consent-granted", loadGA4);

    /* ===========================================================
       Everything below only needs to actually SEND data once GA4
       is loaded, but listeners are safe to attach immediately —
       hmTrack()/gtagSafe() silently no-op until then.
    =========================================================== */

    let trackingInitialized = false;
    function initTracking() {
        if (trackingInitialized) return; // guard against being called twice
        trackingInitialized = true;
        trackSectionViews();
        trackScrollDepth();
        trackClicks();
        trackVideos();
    }

    // Attach listeners immediately on DOM ready so no interaction is
    // missed even before GA4 finishes loading (events just no-op
    // until gtag exists). loadGA4() also calls initTracking() once
    // consent is granted — the guard above ensures it only ever runs once.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initTracking);
    } else {
        initTracking();
    }

    /* ---------------------------------------------------------
       B) SECTION VIEWS — Home / About / Skills / Portfolio / Contact
    --------------------------------------------------------- */
    function trackSectionViews() {
        const seen = new Set();
        const sections = document.querySelectorAll("section[id]");
        if (!sections.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !seen.has(entry.target.id)) {
                    seen.add(entry.target.id);
                    window.hmTrack("section_view", {
                        section_id: entry.target.id,
                        page_location: window.location.pathname
                    });
                }
            });
        }, { threshold: 0.4 });

        sections.forEach((s) => observer.observe(s));
    }

    /* ---------------------------------------------------------
       E) SCROLL DEPTH — 25 / 50 / 75 / 90 / 100
    --------------------------------------------------------- */
    function trackScrollDepth() {
        const thresholds = [25, 50, 75, 90, 100];
        const fired = new Set();
        let ticking = false;

        function checkScroll() {
            ticking = false;
            const doc = document.documentElement;
            const scrollTop = window.scrollY || doc.scrollTop;
            const scrollHeight = doc.scrollHeight - doc.clientHeight;
            if (scrollHeight <= 0) return;

            const percent = Math.min(100, Math.round((scrollTop / scrollHeight) * 100));

            thresholds.forEach((t) => {
                if (percent >= t && !fired.has(t)) {
                    fired.add(t);
                    window.hmTrack("scroll_depth", {
                        percent_scrolled: t,
                        page_location: window.location.pathname
                    });
                }
            });
        }

        window.addEventListener("scroll", () => {
            if (!ticking) {
                requestAnimationFrame(checkScroll);
                ticking = true;
            }
        });
    }

    /* ---------------------------------------------------------
       F) IMPORTANT CLICKS + I) CONVERSIONS
       Any element with data-analytics="event_name" is tracked.
       Optional data-analytics-label gives extra context.
    --------------------------------------------------------- */
    const LEAD_EVENTS = new Set(["hire_me_click", "contact_click", "email_click"]);

    function trackClicks() {
        document.addEventListener("click", (e) => {
            const el = e.target.closest("[data-analytics]");
            if (!el) return;

            const eventName = el.getAttribute("data-analytics");
            const label = el.getAttribute("data-analytics-label") || el.textContent.trim().slice(0, 60);

            window.hmTrack(eventName, {
                link_label: label,
                link_url: el.href || undefined,
                page_location: window.location.pathname
            });

            // Fire GA4's recommended lead-generation event for the
            // most important contact/hire actions, so it's easy to
            // mark as a conversion in the GA4 UI.
            if (LEAD_EVENTS.has(eventName)) {
                window.hmTrack("generate_lead", {
                    source_action: eventName,
                    page_location: window.location.pathname
                });
            }
        });
    }

    /* ---------------------------------------------------------
       G) VIDEO ANALYTICS
       Any <video> with data-video-id + data-video-name is tracked.
       Milestones: start, 10, 25, 50, 75, 90, complete — no duplicates.
    --------------------------------------------------------- */
    function trackVideos() {
        const videos = document.querySelectorAll("video[data-video-id]");

        videos.forEach((video) => {
            const videoId = video.getAttribute("data-video-id");
            const videoName =
                video.getAttribute("data-video-name") ||
                (CONFIG.VIDEO_NAMES && CONFIG.VIDEO_NAMES[videoId]) ||
                videoId;

            const milestones = [10, 25, 50, 75, 90];
            const fired = new Set();
            let started = false;
            let completed = false;

            function sendEvent(name, percent) {
                window.hmTrack(name, {
                    video_id: videoId,
                    video_name: videoName,
                    video_percent: percent !== undefined ? percent : undefined
                });
            }

            video.addEventListener("play", () => {
                if (!started) {
                    started = true;
                    sendEvent("video_start");
                }
            });

            video.addEventListener("timeupdate", () => {
                if (!video.duration || isNaN(video.duration)) return;
                const percent = Math.floor((video.currentTime / video.duration) * 100);

                milestones.forEach((m) => {
                    if (percent >= m && !fired.has(m)) {
                        fired.add(m);
                        sendEvent("video_progress", m);
                    }
                });
            });

            video.addEventListener("ended", () => {
                if (!completed) {
                    completed = true;
                    sendEvent("video_complete", 100);
                }
            });
        });
    }

    /* ---------------------------------------------------------
       H) PROJECT ANALYTICS — fired from portfolio cards via
       data-analytics="project_click" + data-project-id, handled
       by the generic click tracker above. Project *page* views
       are automatically captured as page_view + section_view
       events on each project page.
    --------------------------------------------------------- */

    // Exposed so a video added to the page AFTER initTracking() already
    // ran (e.g. project.html, which fetches its video from
    // data/projects.json) can still get tracked — it just calls
    // window.HM_trackVideos() once the <video> element exists.
    window.HM_trackVideos = trackVideos;

})();
