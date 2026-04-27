const videoElement = document.getElementById('input-video');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureInd = document.getElementById('gesture-indicator');

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

// OPTIMIZACIÓN: Reducimos complejidad para ganar velocidad en el 20 de mayo
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0, // 0 es más rápido que 1, ideal para no congelar la imagen
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

let lastX = 0;
let lastFrameTime = 0;
let isDispatching = false; // SEGURO: Evita envíos múltiples que congelan el PC

hands.onResults((results) => {
    // 1. Cálculo de FPS dinámico
    const now = performance.now();
    const fps = Math.round(1000 / (now - lastFrameTime));
    lastFrameTime = now;
    document.getElementById('stat-fps').innerText = fps;

    // 2. Limpieza y preparación del Canvas (Un solo ciclo de renderizado)
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Modo Espejo
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    
    // Dibujar la cámara lo más rápido posible
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            // Dibujar esqueleto HUD
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#ffcc00', lineWidth: 2});
            drawLandmarks(canvasCtx, landmarks, {color: '#00f2ff', lineWidth: 1, radius: 2});

            // Lógica de Gesto con FILTRO DE VELOCIDAD
            const currentX = landmarks[9].x; 
            const deltaX = currentX - lastX;

            // Solo disparamos si el movimiento es rápido Y no estamos procesando otro envío
            if (deltaX > 0.15 && !isDispatching) {
                isDispatching = true; // Bloqueamos nuevos disparos
                
                gestureInd.innerText = ">>> NEXUS DISPATCH <<<";
                gestureInd.style.color = "#ffcc00";

                // Ejecución asíncrona para no detener el hilo de la cámara
                setTimeout(() => {
                    lanzarContenido();
                    setTimeout(() => {
                        isDispatching = false; // Liberamos después de 1.5s
                        gestureInd.innerText = "NEXUS READY";
                        gestureInd.style.color = "#00f2ff";
                    }, 1500);
                }, 10);
            }
            lastX = currentX;
        }
    }
    canvasCtx.restore();
});

// 3. Inicio de Cámara Inteligente
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 480
});
camera.start();

// --- SISTEMA DE PROTECCIÓN TÉRMICA Y RENDIMIENTO ---
setInterval(() => {
    // Leemos el número que calculamos en el sensor de FPS
    const fpsElement = document.getElementById('stat-fps');
    if (!fpsElement) return;

    const currentFPS = parseInt(fpsElement.innerText);

    // Si el rendimiento cae por debajo de 15 FPS (umbral crítico)
    if (currentFPS < 15 && currentFPS > 0) {
        console.warn("NEXUS: Optimizando recursos por caída de rendimiento.");
        
        // Ordenamos a la IA bajar su precisión para salvar el proceso
        hands.setOptions({ 
            modelComplexity: 0, 
            minDetectionConfidence: 0.4 
        });

        // Informamos al Dashboard en el panel de Status
        const statusEl = document.getElementById('stat-status');
        if (statusEl) {
            statusEl.innerText = "POWER SAVE MODE";
            statusEl.style.color = "#ff4444"; // Rojo de advertencia
        }
    }
}, 5000); // Revisa cada 5 segundos para no saturar el CPU