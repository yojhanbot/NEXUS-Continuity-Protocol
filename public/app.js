const socket = io();
const container = document.getElementById('video-wrapper');

// --- CARGA DE DATOS AL NÚCLEO ---
async function cargarArchivoLocal(event) {
    const file = event.target.files[0];
    if (!file) return;

    actualizarStatus("UPLOADING DATA...", "#ffcc00");

    const formData = new FormData();
    formData.append('archivo', file);

    try {
        const response = await fetch('/upload', { method: 'POST', body: formData });
        const data = await response.json();
        
        // Al subir, despachamos el evento a toda la red NEXUS
        socket.emit('nexus-dispatch', {
            url: data.url,
            mimetype: data.mimetype,
            time: 0
        });
    } catch (e) {
        actualizarStatus("UPLOAD ERROR", "#ff4444");
    }
}

// --- SINCRONIZACIÓN REACTIVA ---
socket.on('nexus-sync', (state) => {
    if (!state.resource) return;
    
    console.log("NEXUS: Sincronizando recurso ->", state.mimetype);
    
    // FASE 1: Destrucción del estado anterior (Evita el congelamiento)
    container.innerHTML = ''; 
    
    // FASE 2: Re-construcción basada en MIME Type
    const fullURL = window.location.origin + state.resource;
    
    if (state.mimetype.startsWith('image/')) {
        renderImage(fullURL);
    } else if (state.mimetype.startsWith('video/')) {
        renderVideo(fullURL, state.timestamp);
    } else if (state.mimetype === 'application/pdf') {
        renderPDF(fullURL);
    } else {
        renderGeneric(fullURL, state.mimetype);
    }
    
    actualizarStatus("STREAMING", "#00ff00");
});

// --- RENDERIZADORES ESPECIALIZADOS ---

function renderImage(url) {
    const img = new Image();
    img.src = url;
    img.className = "hud-resource-fade";
    img.style.maxWidth = "100%";
    container.appendChild(img);
}

function renderVideo(url, time) {
    container.innerHTML = `
        <video id="active-video" width="100%" autoplay muted controls class="hud-resource-fade">
            <source src="${url}">
        </video>`;
    const v = document.getElementById('active-video');
    v.currentTime = time;
}

function renderPDF(url) {
    // Para PDF en móviles, lo más profesional es un Object con fallback
    container.innerHTML = `
        <object data="${url}" type="application/pdf" width="100%" height="500px">
            <div class="hud-fallback">
                <p>DOCUMENTO PDF RECIBIDO</p>
                <a href="${url}" target="_blank" class="hud-btn">ABRIR EN VISOR NATIVO</a>
            </div>
        </object>`;
}

function renderGeneric(url, type) {
    container.innerHTML = `
        <div class="hud-fallback">
            <h3>PAQUETE NO RECONOCIDO</h3>
            <p>TIPO: ${type}</p>
            <a href="${url}" download class="hud-btn">EXTRAER DATOS</a>
        </div>`;
}

function actualizarStatus(txt, col) {
    const el = document.getElementById('stat-status');
    if(el) { el.innerText = txt; el.style.color = col; }
}

function limpiarMemoriaNEXUS() {
    const videoActivo = document.getElementById('active-video');
    if (videoActivo) {
        videoActivo.pause();
        videoActivo.src = "";
        videoActivo.load();
        videoActivo.remove();
    }
    // Forzamos al navegador a olvidar la URL temporal anterior
    if (window.currentResourceURL) {
        URL.revokeObjectURL(window.currentResourceURL);
    }
}