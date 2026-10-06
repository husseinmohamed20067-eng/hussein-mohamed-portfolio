// ==========================================================
// HM Portfolio — Animated Particle Background
// Reduced density on small screens / reduced-motion for performance
// ==========================================================

(function () {
    const particlesEl = document.getElementById("particles-js");
    if (!particlesEl || typeof particlesJS === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const isSmallScreen = window.innerWidth < 768;

    // Fewer particles + no interactivity on mobile / low-power preference
    const particleCount = prefersReducedMotion ? 0 : isSmallScreen ? 30 : 80;
    const moveEnabled = !prefersReducedMotion;
    const hoverEnabled = !isSmallScreen && !prefersReducedMotion;

    particlesJS("particles-js", {
        particles: {
            number: {
                value: particleCount,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: "#D4AF37"
            },
            shape: {
                type: "circle"
            },
            opacity: {
                value: 0.4
            },
            size: {
                value: 3,
                random: true
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#D4AF37",
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: moveEnabled,
                speed: isSmallScreen ? 0.6 : 1.2
            }
        },

        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: {
                    enable: hoverEnabled,
                    mode: "grab"
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 0.5
                    }
                }
            }
        },

        retina_detect: true
    });
})();
