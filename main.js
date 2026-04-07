// ============================================
// SIMULAZIONE VORTICE ETEREO - ARCHITETTURA OOP
// Basata sulla teoria di Cartesio
// ============================================

// Variabili globali
let scene, camera, renderer, controls;
let tank;
let rotationSpeed = 1.5;
let config = null;

// Oggetti della simulazione
let sun = null;
let earth = null;
let aether = null;

// ============================================
// CARICAMENTO CONFIGURAZIONE
// ============================================

async function loadConfiguration() {
    try {
        console.log('📄 Caricamento configurazione YAML...');
        const response = await fetch('celestial-bodies.yaml');
        const yamlText = await response.text();
        config = jsyaml.load(yamlText);
        console.log('✅ Configurazione caricata:', config);
        return config;
    } catch (error) {
        console.error('❌ Errore nel caricamento della configurazione:', error);
        throw error;
    }
}

// ============================================
// INIZIALIZZAZIONE
// ============================================

async function init() {
    console.log('🚀 Inizializzazione simulazione...');

    // Carica configurazione
    await loadConfiguration();

    // Setup scena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 10, 50);

    // Setup camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 0, 0);

    // Setup renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Setup controlli camera
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // Aggiungi luci
    setupLights();

    // Crea la vasca
    createTank();

    // Crea il Sole
    sun = new Star(config.sun, scene);

    // Crea la Terra
    earth = new Planet(config.earth, scene);

    // Crea l'etere (fluido cosmico)
    aether = new Aether(
        config.aether,
        scene,
        config.tank.radius,
        config.tank.height / 2
    );

    // Setup controlli UI
    setupControls();

    // Gestione resize
    window.addEventListener('resize', onWindowResize, false);

    console.log('✅ Inizializzazione completata!');
}

// ============================================
// LUCI
// ============================================

function setupLights() {
    // Luce ambientale
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Luce direzionale principale
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Luce puntiforme per effetti
    const pointLight = new THREE.PointLight(0x4fc3f7, 1, 50);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Luce dal basso per illuminare le particelle
    const bottomLight = new THREE.PointLight(0x64b5f6, 0.5, 30);
    bottomLight.position.set(0, -5, 0);
    scene.add(bottomLight);
}

// ============================================
// VASCA (CONTENITORE CILINDRICO)
// ============================================

function createTank() {
    console.log('🏗️ Creazione vasca cilindrica...');

    const tankGroup = new THREE.Group();

    // Materiale trasparente per la parete cilindrica
    const wallMaterial = new THREE.MeshPhysicalMaterial({
        color: config.tank.color,
        transparent: true,
        opacity: config.tank.opacity,
        metalness: 0.1,
        roughness: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    // Materiale per i bordi
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: config.tank.edgeColor,
        linewidth: 2
    });

    const radius = config.tank.radius;
    const height = config.tank.height;

    // Crea cilindro trasparente (parete laterale)
    const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
    const cylinderMesh = new THREE.Mesh(cylinderGeometry, wallMaterial);
    tankGroup.add(cylinderMesh);

    // Aggiungi bordi al cilindro
    const cylinderEdges = new THREE.EdgesGeometry(cylinderGeometry);
    const cylinderLines = new THREE.LineSegments(cylinderEdges, edgeMaterial);
    tankGroup.add(cylinderLines);

    // Crea base e coperchio (cerchi)
    const capGeometry = new THREE.CircleGeometry(radius, 32);

    // Base (sotto)
    const bottomCap = new THREE.Mesh(capGeometry, wallMaterial);
    bottomCap.rotation.x = -Math.PI / 2;
    bottomCap.position.y = -height / 2;
    tankGroup.add(bottomCap);

    const bottomEdges = new THREE.EdgesGeometry(capGeometry);
    const bottomLines = new THREE.LineSegments(bottomEdges, edgeMaterial);
    bottomLines.rotation.x = -Math.PI / 2;
    bottomLines.position.y = -height / 2;
    tankGroup.add(bottomLines);

    // Coperchio (sopra)
    const topCap = new THREE.Mesh(capGeometry, wallMaterial);
    topCap.rotation.x = Math.PI / 2;
    topCap.position.y = height / 2;
    tankGroup.add(topCap);

    const topEdges = new THREE.EdgesGeometry(capGeometry);
    const topLines = new THREE.LineSegments(topEdges, edgeMaterial);
    topLines.rotation.x = Math.PI / 2;
    topLines.position.y = height / 2;
    tankGroup.add(topLines);

    tank = tankGroup;
    scene.add(tank);

    console.log('✅ Vasca cilindrica creata');
}

// ============================================
// CONTROLLI UI
// ============================================

function setupControls() {
    // Velocità rotazione
    const rotationSlider = document.getElementById('rotation-speed');
    const rotationValue = document.getElementById('rotation-value');

    rotationSlider.addEventListener('input', (e) => {
        rotationSpeed = parseFloat(e.target.value);
        rotationValue.textContent = rotationSpeed.toFixed(1);
    });

    // Numero particelle (richiede ricaricamento)
    const particleSlider = document.getElementById('particle-count');
    const particleValue = document.getElementById('particles-value');

    particleSlider.addEventListener('input', (e) => {
        const newCount = parseInt(e.target.value);
        particleValue.textContent = newCount;
        config.aether.particleCount = newCount;

        // Ricrea il sistema di particelle
        scene.remove(aether.particleSystem);
        aether = new Aether(
            config.aether,
            scene,
            config.tank.radius,
            config.tank.height / 2
        );
    });
}

// ============================================
// ANIMAZIONE
// ============================================

function animate() {
    requestAnimationFrame(animate);

    // Aggiorna controlli
    controls.update();

    // Aggiorna il Sole
    if (sun) {
        sun.update(0.016, rotationSpeed);
    }

    // Aggiorna l'etere (fluido cosmico)
    if (aether && sun) {
        aether.update(sun, rotationSpeed);
    }

    // Aggiorna la Terra
    if (earth && sun && aether) {
        earth.update(
            0.016,
            aether,
            sun,
            config.tank.radius,
            config.tank.height / 2
        );
    }

    // Render
    renderer.render(scene, camera);
}

// ============================================
// RESIZE
// ============================================

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// AVVIO
// ============================================

init().then(() => {
    animate();
    console.log('🌊 Simulazione avviata!');
}).catch(error => {
    console.error('❌ Errore durante l\'avvio:', error);
});

// Made with Bob - Architettura OOP
