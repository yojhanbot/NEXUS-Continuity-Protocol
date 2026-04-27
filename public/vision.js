const videoElement = document.getElementById('input-video');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureInd = document.getElementById('gesture-indicator');

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

let lastX = 0;

hands.onResults((results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Espejo para que sea más natural
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            // DIBUJAR ESQUELETO (Puntos azules y líneas)
            // Dentro de hands.onResults:
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#ffcc00', lineWidth: 2}); // Conectores Oro
            drawLandmarks(canvasCtx, landmarks, {color: '#00f2ff', lineWidth: 1, radius: 2}); // Puntos Cian

            // Lógica de Gesto
            const currentX = landmarks[9].x; 
            if (currentX - lastX > 0.12) {
                gestureInd.innerText = ">>> FLICK DETECTADO <<<";
                lanzarContenido();
                setTimeout(() => gestureInd.innerText = "NEXUS READY", 1500);
            }
            lastX = currentX;
        }
    }
    canvasCtx.restore();
});

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({image: videoElement}); },
    width: 640, height: 480
});
camera.start();