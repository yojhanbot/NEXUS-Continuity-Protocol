const socket = io();
const wrapper = document.getElementById('video-wrapper');
const contentStatus = document.getElementById('content-status');

// Determinar tipo de archivo por extensión
function getFileType(url) {
    const images = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = url.split('.').pop().toLowerCase();
    return images.includes(ext) ? 'image' : 'video';
}

function renderContent(url, type, time = 0) {
    wrapper.innerHTML = ''; // Limpiar
    
    if (type === 'image') {
        wrapper.innerHTML = `<img src="${url}" id="active-content" style="max-width:100%; border-radius:15px; box-shadow: 0 0 20px var(--neon);">`;
    } else {
        wrapper.innerHTML = `
            <video id="active-video" width="100%" style="border-radius:15px;" autoplay muted playsinline controls>
                <source src="${url}" type="video/mp4">
            </video>`;
        const video = document.getElementById('active-video');
        video.currentTime = time;
        vincularControles();
    }
}

function lanzarContenido() {
    const video = document.getElementById('active-video');
    const img = document.querySelector('#video-wrapper img');
    let payload = { from: socket.id };

    if (video) {
        payload.type = 'video';
        payload.url = video.querySelector('source').src;
        payload.time = video.currentTime;
        video.pause();
    } else if (img) {
        payload.type = 'image';
        payload.url = img.src;
    } else {
        return;
    }

    socket.emit('flick-data', payload);
}

socket.on('receive-flick', (payload) => {
    renderContent(payload.url, payload.type, payload.time);
});