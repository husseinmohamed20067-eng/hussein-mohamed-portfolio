// ==========================================================
// HM Portfolio — Exit Feedback / Star Rating
//
// Shows a small, dismissible "before you go" rating popup:
// - Desktop: triggered by exit-intent (mouse leaves toward the
//   browser chrome at the top of the viewport).
// - Touch/mobile (no reliable exit-intent): triggered once the
//   visitor scrolls into the footer, a natural "reached the end"
//   signal.
// Shown at most once every few days per browser (localStorage
// cooldown) and never more than once per page load.
//
// Privacy: only an anonymous star rating (1-5) is sent to
// analytics. Any typed feedback text stays in the browser only —
// it is never transmitted or stored anywhere, since this site
// has no backend to store it.
// ==========================================================

(function () {
    const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
    const STORAGE_KEY = "hm_exit_feedback_last_shown";
    let shownThisPageLoad = false;

    function canShow() {
        // Don't stack on top of the consent bar if it's still showing
        if (document.getElementById("consentBar")) return false;

        try {
            const last = localStorage.getItem(STORAGE_KEY);
            if (!last) return true;
            return Date.now() - parseInt(last, 10) > COOLDOWN_MS;
        } catch (e) {
            return true;
        }
    }

    function markShown() {
        try {
            localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch (e) {
            /* ignore */
        }
    }

    function buildPopup() {
        const overlay = document.createElement("div");
        overlay.id = "exitFeedbackOverlay";
        overlay.className = "exit-feedback-overlay";

        const wrap = document.createElement("div");
        wrap.id = "exitFeedback";
        wrap.className = "exit-feedback";
        wrap.setAttribute("role", "dialog");
        wrap.setAttribute("aria-modal", "true");
        wrap.setAttribute("aria-label", "Feedback survey");

        wrap.innerHTML = `
            <button type="button" class="exit-feedback-close" aria-label="Close">×</button>
            <div class="exit-feedback-step" data-step="rate">
                <p class="exit-feedback-title">Before you go 👋</p>
                <p class="exit-feedback-sub">How would you rate your experience?</p>
                <div class="exit-feedback-stars" role="group" aria-label="Rate 1 to 5 stars">
                    ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="star" data-value="${n}" aria-label="${n} star">★</button>`).join("")}
                </div>
                <button type="button" class="exit-feedback-later">Maybe later</button>
            </div>
            <div class="exit-feedback-step" data-step="comment" hidden>
                <p class="exit-feedback-title" id="exitFeedbackFollowUp">Thanks!</p>
                <textarea class="exit-feedback-textarea" maxlength="300" placeholder="Type here (optional)"></textarea>
                <div class="exit-feedback-actions">
                    <button type="button" class="btn exit-feedback-submit">Submit</button>
                    <button type="button" class="exit-feedback-later">Maybe later</button>
                </div>
            </div>
            <div class="exit-feedback-step" data-step="thanks" hidden>
                <p class="exit-feedback-title">Thank you for your feedback! 🙏</p>
            </div>
        `;

        overlay.appendChild(wrap);
        document.body.appendChild(overlay);
        requestAnimationFrame(() => {
            overlay.classList.add("show");
            wrap.classList.add("show");
        });

        const closeBtn = wrap.querySelector(".exit-feedback-close");
        const laterBtns = wrap.querySelectorAll(".exit-feedback-later");
        const stars = wrap.querySelectorAll(".star");
        const rateStep = wrap.querySelector('[data-step="rate"]');
        const commentStep = wrap.querySelector('[data-step="comment"]');
        const thanksStep = wrap.querySelector('[data-step="thanks"]');
        const followUp = wrap.querySelector("#exitFeedbackFollowUp");
        const submitBtn = wrap.querySelector(".exit-feedback-submit");

        let selectedRating = null;

        function close() {
            overlay.classList.remove("show");
            wrap.classList.remove("show");
            setTimeout(() => overlay.remove(), 300);
        }

        closeBtn.addEventListener("click", close);
        laterBtns.forEach((btn) => btn.addEventListener("click", close));
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) close();
        });

        stars.forEach((star) => {
            star.addEventListener("click", () => {
                selectedRating = parseInt(star.getAttribute("data-value"), 10);

                stars.forEach((s) => {
                    s.classList.toggle("filled", parseInt(s.getAttribute("data-value"), 10) <= selectedRating);
                });

                followUp.textContent =
                    selectedRating <= 3
                        ? "What could I improve?"
                        : "What did you like most?";

                rateStep.hidden = true;
                commentStep.hidden = false;

                // Analytics: anonymous rating only — no free text is ever sent.
                if (typeof window.hmTrack === "function") {
                    window.hmTrack("site_rating", {
                        rating: selectedRating,
                        page: window.location.pathname
                    });
                }
            });
        });

        submitBtn.addEventListener("click", () => {
            // Note: any typed text is intentionally discarded here —
            // this is a static site with no backend to store it.
            commentStep.hidden = true;
            thanksStep.hidden = false;
            setTimeout(close, 1800);
        });
    }

    function showPopup() {
        if (shownThisPageLoad || !canShow()) return;
        shownThisPageLoad = true;
        markShown();
        buildPopup();
    }

    function init() {
        // Desktop exit-intent
        document.addEventListener("mouseout", (e) => {
            if (!e.relatedTarget && e.clientY <= 0) {
                showPopup();
            }
        });

        // Touch / mobile fallback: trigger when the footer scrolls into view
        const footer = document.querySelector("footer");
        if (footer && "IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        showPopup();
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.6 });
            observer.observe(footer);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
