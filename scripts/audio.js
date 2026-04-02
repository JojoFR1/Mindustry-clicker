// scripts/audio.js

window.musicVolume = localStorage.getItem('minClickerMusicVol') !== null ? parseFloat(localStorage.getItem('minClickerMusicVol')) : 1.0;
window.sfxVolume = localStorage.getItem('minClickerSfxVol') !== null ? parseFloat(localStorage.getItem('minClickerSfxVol')) : 0.7;

document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('background-music');
    if (music) music.volume = window.musicVolume;
    
    // Configuración UI
    const volMusic = document.getElementById('vol-music');
    if(volMusic) {
        volMusic.value = window.musicVolume;
        volMusic.addEventListener('input', e => {
            window.musicVolume = parseFloat(e.target.value);
            localStorage.setItem('minClickerMusicVol', window.musicVolume);
            if (music) music.volume = window.musicVolume;
        });
    }

    const volSfx = document.getElementById('vol-sfx');
    if(volSfx) {
        volSfx.value = window.sfxVolume;
        volSfx.addEventListener('input', e => {
            window.sfxVolume = parseFloat(e.target.value);
            localStorage.setItem('minClickerSfxVol', window.sfxVolume);
        });
    }

    const startAudio = () => {
        if (music && music.paused) {
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
        explosion.volume = window.sfxVolume;
        explosion.play().catch(e => console.log('Explosion error:', e));
    }
};
