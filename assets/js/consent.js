// ==========================================================
// HM Portfolio — Lightweight Analytics Consent
// A slim, dismissible bar that gates Google Analytics loading.
// No cookies are set by this script itself — only localStorage
// (which is not a cookie and carries no personal data) is used
// to remember the visitor's choice.
// ==========================================================

(function () {
    const STORAGE_KEY = "hm_analytics_consent"; // "granted" | "denied"

    function getConsent() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null; // localStorage blocked (private mode etc.) — treat as no consent yet
        }
    }

    function setConsent(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (e) {
            /* ignore — storage not available */
        }
    }

    function removeBar() {
        const bar = document.getElementById("consentBar");
        if (bar) {
            bar.classList.remove("show");
            setTimeout(() => bar.remove(), 400);
        }
    }

    function init() {
        const existing = getConsent();

        if (existing === "granted") {
            window.dispatchEvent(new CustomEvent("hm-analytics-consent-granted"));
            return;
        }

        if (existing === "denied") {
            return; // respect prior choice, do not show the bar again
        }

        // No choice recorded yet — show the consent bar
        const bar = document.createElement("div");
        bar.id = "consentBar";
        bar.className = "consent-bar";
        bar.setAttribute("role", "dialog");
        bar.setAttribute("aria-label", "Cookie and analytics consent");
        bar.innerHTML = `
            <p>
                This site uses privacy-friendly analytics (Google Analytics) to understand
                traffic and improve the portfolio. No personal data is collected.
            </p>
            <div class="consent-actions">
                <button type="button" id="consentAccept" class="btn">Accept</button>
                <button type="button" id="consentDecline" class="btn btn-outline">Decline</button>
            </div>
        `;
        document.body.appendChild(bar);

        requestAnimationFrame(() => bar.classList.add("show"));

        document.getElementById("consentAccept").addEventListener("click", () => {
            setConsent("granted");
            removeBar();
            window.dispatchEvent(new CustomEvent("hm-analytics-consent-granted"));
        });

        document.getElementById("consentDecline").addEventListener("click", () => {
            setConsent("denied");
            removeBar();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
