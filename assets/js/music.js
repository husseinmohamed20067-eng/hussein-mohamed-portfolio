// ==========================================================
// HM Portfolio — Background Music Toggle
// Wrapped defensively so a missing/blocked audio file
// never breaks the rest of the site.
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    const music = document.getElementById("bgMusic");
    const btn = document.getElementById("musicBtn");

    if (!music || !btn) return;

    let playing = false;

    btn.addEventListener("click", () => {
        if (playing) {
            music.pause();
            btn.innerHTML = "🎵";
            playing = false;
            return;
        }

        music.volume = 0.18;
        const playPromise = music.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    btn.innerHTML = "⏸";
                    playing = true;
                })
                .catch((err) => {
                    // Autoplay / playback restrictions — fail silently,
                    // keep the rest of the site fully functional.
                    console.warn("Music playback was blocked:", err);
                    playing = false;
                });
        } else {
            btn.innerHTML = "⏸";
            playing = true;
        }
    });
});
