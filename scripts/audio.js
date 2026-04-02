// scripts/audio.js

document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('background-music');
    const startAudio = () => {
        if (music && music.paused) {
            music.volume = 1;
            music.play().catch(e => console.log('Audio blocked:', e));
        }
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
    };
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
});

window.playExplosion = () => {
    const explosion = document.getElementById('explosion-sound');
    if (explosion) {
        explosion.currentTime = 0;
        explosion.volume = 0.7;
        explosion.play().catch(e => console.log('Explosion error:', e));
    }
};
