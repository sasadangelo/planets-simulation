// ============================================
// SIMULAZIONE VORTICE PLANETARIO 3D
// ============================================

// Variabili globali
let scene, camera, renderer, controls;
let tank, sphere, earth;
let particles = [];
let particleSystem;
let rotationSpeed = 1.5;
let particleCount = 8000;

// Parametri della simulazione
const TANK_SIZE = 10;
const SPHERE_RADIUS = 2;
const EARTH_RADIUS = 0.4;
const PARTICLE_SIZE = 0.15;

// Fisica della Terra (trascinata dal vortice)
let earthVelocity = { x: 0, y: 0, z: 0 };
let earthAngularVelocity = { x: 0, y: 0, z: 0 };

// ============================================
// INIZIALIZZAZIONE
// ============================================

function init() {
    console.log('🚀 Inizializzazione simulazione...');

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

    // Crea il sole (sfera centrale)
    createSphere();

    // Crea la Terra (pianeta in orbita)
    createEarth();

    // Crea il sistema di particelle
    createParticleSystem();

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
// VASCA (CONTENITORE)
// ============================================

function createTank() {
    console.log('🏗️ Creazione vasca...');

    const tankGroup = new THREE.Group();

    // Materiale trasparente per le pareti
    const wallMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1e88e5,
        transparent: true,
        opacity: 0.15,
        metalness: 0.1,
        roughness: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    // Materiale per i bordi
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x4fc3f7,
        linewidth: 2
    });

    // Dimensioni vasca
    const width = TANK_SIZE;
    const height = TANK_SIZE;
    const depth = TANK_SIZE;

    // Crea le 6 pareti
    const walls = [
        // Fronte
        { pos: [0, 0, depth / 2], rot: [0, 0, 0] },
        // Retro
        { pos: [0, 0, -depth / 2], rot: [0, Math.PI, 0] },
        // Sinistra
        { pos: [-width / 2, 0, 0], rot: [0, Math.PI / 2, 0] },
        // Destra
        { pos: [width / 2, 0, 0], rot: [0, -Math.PI / 2, 0] },
        // Sopra
        { pos: [0, height / 2, 0], rot: [Math.PI / 2, 0, 0] },
        // Sotto
        { pos: [0, -height / 2, 0], rot: [-Math.PI / 2, 0, 0] }
    ];

    walls.forEach(wall => {
        const geometry = new THREE.PlaneGeometry(width, height);
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.set(...wall.pos);
        mesh.rotation.set(...wall.rot);
        tankGroup.add(mesh);

        // Aggiungi bordi
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, edgeMaterial);
        line.position.set(...wall.pos);
        line.rotation.set(...wall.rot);
        tankGroup.add(line);
    });

    tank = tankGroup;
    scene.add(tank);

    console.log('✅ Vasca creata');
}

// ============================================
// SFERA ROTANTE
// ============================================

function createSphere() {
    console.log('☀️ Creazione sole...');

    const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 64, 64);

    // Crea texture procedurale per il sole con macchie solari
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    // Sfondo arancione base
    const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#ffdd44');
    gradient.addColorStop(0.5, '#ff8833');
    gradient.addColorStop(1, '#ff4422');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);

    // Aggiungi macchie solari scure
    context.fillStyle = 'rgba(180, 50, 20, 0.4)';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = 10 + Math.random() * 30;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    // Aggiungi dettagli luminosi
    context.fillStyle = 'rgba(255, 255, 150, 0.3)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = 5 + Math.random() * 15;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Materiale con texture procedurale
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: 0xff6b35,
        emissiveIntensity: 0.3,
        emissiveMap: texture,
        metalness: 0.1,
        roughness: 0.8
    });

    sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0);
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    scene.add(sphere);

    console.log('✅ Sole creato con texture procedurale');
}
// ============================================
// TERRA (PIANETA)
// ============================================

function createEarth() {
    console.log('🌍 Creazione Terra...');

    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 32, 32);

    // Crea texture procedurale per la Terra
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    // Oceani (blu)
    context.fillStyle = '#1e88e5';
    context.fillRect(0, 0, 256, 256);

    // Continenti (verde/marrone)
    context.fillStyle = '#4caf50';
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const width = 30 + Math.random() * 60;
        const height = 20 + Math.random() * 40;
        context.beginPath();
        context.ellipse(x, y, width, height, Math.random() * Math.PI, 0, Math.PI * 2);
        context.fill();
    }

    // Nuvole (bianche)
    context.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = 5 + Math.random() * 15;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.1,
        roughness: 0.7
    });

    earth = new THREE.Mesh(geometry, material);

    // Posizione iniziale nell'orbita (distanza dal sole)
    earth.position.set(4, 0, 0);
    earth.castShadow = true;
    earth.receiveShadow = true;

    // Velocità iniziale tangenziale per iniziare l'orbita
    earthVelocity.z = 0.08 * rotationSpeed;

    scene.add(earth);

    console.log('✅ Terra creata con fisica del vortice');
}


// ============================================
// SISTEMA PARTICELLE
// ============================================

function createParticleSystem() {
    console.log('💧 Creazione sistema particelle...');

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const velocities = [];

    // Genera particelle casuali nella vasca
    for (let i = 0; i < particleCount; i++) {
        // Posizione casuale nella vasca
        const x = (Math.random() - 0.5) * TANK_SIZE * 0.9;
        const y = (Math.random() - 0.5) * TANK_SIZE * 0.9;
        const z = (Math.random() - 0.5) * TANK_SIZE * 0.9;

        positions.push(x, y, z);

        // Colore blu con variazioni
        const color = new THREE.Color();
        color.setHSL(0.55 + Math.random() * 0.1, 0.8, 0.5 + Math.random() * 0.3);
        colors.push(color.r, color.g, color.b);

        // Velocità iniziale
        velocities.push(0, 0, 0);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Materiale particelle
    const material = new THREE.PointsMaterial({
        size: PARTICLE_SIZE,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Salva le velocità per l'animazione
    particleSystem.userData.velocities = velocities;

    console.log(`✅ Sistema particelle creato (${particleCount} particelle)`);
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
        particleCount = newCount;

        // Ricrea il sistema di particelle
        scene.remove(particleSystem);
        createParticleSystem();
    });
}

// ============================================
// ANIMAZIONE
// ============================================

function animate() {
    requestAnimationFrame(animate);

    // Aggiorna controlli
    controls.update();

    // Ruota il sole (più veloce e visibile)
    if (sphere) {
        sphere.rotation.y += 0.03 * rotationSpeed;
        sphere.rotation.x += 0.015 * rotationSpeed;
    }

    // Aggiorna fisica della Terra (trascinata dal vortice)
    updateEarth();

    // Anima le particelle (vortice)
    updateParticles();

    // Render
    // ============================================
    // FISICA TERRA
    // ============================================

    function updateEarth() {
        if (!earth || !sphere) return;

        const time = Date.now() * 0.001;

        // Posizione corrente della Terra
        let x = earth.position.x;
        let y = earth.position.y;
        let z = earth.position.z;

        // Calcola distanza dal sole
        const dx = x - sphere.position.x;
        const dy = y - sphere.position.y;
        const dz = z - sphere.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const safeDist = Math.max(distance, 0.1);

        // Forza del vortice (come per le particelle ma più forte per la Terra)
        const vortexStrength = Math.max(0, 1 - distance / (TANK_SIZE * 0.8));
        const powerFactor = Math.pow(vortexStrength, 0.5);

        // Calcola angolo per forza tangenziale
        const angle = Math.atan2(dz, dx);

        // Forza tangenziale (rivoluzione) - più forte per la Terra
        const tangentSpeed = powerFactor * rotationSpeed * 0.12;
        const tangentX = -Math.sin(angle) * tangentSpeed;
        const tangentZ = Math.cos(angle) * tangentSpeed;

        // Forza centripeta (mantiene l'orbita)
        const centripetalForce = powerFactor * rotationSpeed * 0.03;
        const centripetalX = -dx / safeDist * centripetalForce;
        const centripetalZ = -dz / safeDist * centripetalForce;

        // Componente verticale (spirale leggera)
        const verticalForce = powerFactor * rotationSpeed * 0.02 * Math.sin(time * 2 + angle);

        // Aggiorna velocità lineare
        earthVelocity.x += tangentX + centripetalX;
        earthVelocity.y += verticalForce;
        earthVelocity.z += tangentZ + centripetalZ;

        // Attrito
        earthVelocity.x *= 0.98;
        earthVelocity.y *= 0.98;
        earthVelocity.z *= 0.98;

        // Aggiorna posizione
        x += earthVelocity.x;
        y += earthVelocity.y;
        z += earthVelocity.z;

        // Mantieni dentro la vasca
        const halfSize = TANK_SIZE / 2 - 1;
        if (x < -halfSize || x > halfSize) {
            x = Math.max(-halfSize, Math.min(halfSize, x));
            earthVelocity.x *= -0.7;
        }
        if (y < -halfSize || y > halfSize) {
            y = Math.max(-halfSize, Math.min(halfSize, y));
            earthVelocity.y *= -0.7;
        }
        if (z < -halfSize || z > halfSize) {
            z = Math.max(-halfSize, Math.min(halfSize, z));
            earthVelocity.z *= -0.7;
        }

        earth.position.set(x, y, z);

        // ROTAZIONE SU SE STESSA (causata dal vortice)
        // La velocità angolare è proporzionale alla forza del vortice
        const torque = powerFactor * rotationSpeed * 0.05;

        // Il vortice causa rotazione attorno all'asse Y principalmente
        earthAngularVelocity.y += torque;

        // Attrito angolare
        earthAngularVelocity.x *= 0.95;
        earthAngularVelocity.y *= 0.95;
        earthAngularVelocity.z *= 0.95;

        // Applica rotazione
        earth.rotation.x += earthAngularVelocity.x;
        earth.rotation.y += earthAngularVelocity.y;
        earth.rotation.z += earthAngularVelocity.z;

        // Mantieni inclinazione asse terrestre
        earth.rotation.x = THREE.MathUtils.lerp(earth.rotation.x, 0.4, 0.1);
    }

    renderer.render(scene, camera);
}

// ============================================
// FISICA PARTICELLE
// ============================================

function updateParticles() {
    if (!particleSystem) return;

    const positions = particleSystem.geometry.attributes.position.array;
    const velocities = particleSystem.userData.velocities;
    const time = Date.now() * 0.001;

    for (let i = 0; i < positions.length; i += 3) {
        let x = positions[i];
        let y = positions[i + 1];
        let z = positions[i + 2];

        // Calcola distanza dalla sfera
        const dx = x - sphere.position.x;
        const dy = y - sphere.position.y;
        const dz = z - sphere.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Evita divisione per zero
        const safeDist = Math.max(distance, 0.1);

        // Forza del vortice (molto più forte!)
        const vortexStrength = Math.max(0, 1 - distance / (TANK_SIZE * 0.8));
        const powerFactor = Math.pow(vortexStrength, 0.5); // Curva più dolce

        // Calcola velocità tangenziale (rotazione attorno all'asse Y)
        const angle = Math.atan2(dz, dx);
        const radius = Math.sqrt(dx * dx + dz * dz);

        // Forza tangenziale molto più forte
        const tangentSpeed = powerFactor * rotationSpeed * 0.15;
        const tangentX = -Math.sin(angle) * tangentSpeed;
        const tangentZ = Math.cos(angle) * tangentSpeed;

        // Forza centripeta (attira verso il centro)
        const centripetalForce = powerFactor * rotationSpeed * 0.05;
        const centripetalX = -dx / safeDist * centripetalForce;
        const centripetalZ = -dz / safeDist * centripetalForce;

        // Componente verticale (spirale su e giù)
        const verticalForce = powerFactor * rotationSpeed * 0.08 * Math.sin(time * 2 + angle * 3);

        // Aggiungi turbolenza
        const turbulence = 0.02 * rotationSpeed;
        const turbX = (Math.sin(time * 3 + i * 0.1) - 0.5) * turbulence;
        const turbY = (Math.sin(time * 2 + i * 0.2) - 0.5) * turbulence;
        const turbZ = (Math.sin(time * 4 + i * 0.15) - 0.5) * turbulence;

        // Aggiorna velocità con tutte le forze
        velocities[i] += tangentX + centripetalX + turbX;
        velocities[i + 1] += verticalForce + turbY;
        velocities[i + 2] += tangentZ + centripetalZ + turbZ;

        // Applica attrito più leggero per mantenere il movimento
        velocities[i] *= 0.95;
        velocities[i + 1] *= 0.95;
        velocities[i + 2] *= 0.95;

        // Aggiorna posizione
        x += velocities[i];
        y += velocities[i + 1];
        z += velocities[i + 2];

        // Gestione collisioni con le pareti (rimbalzo morbido)
        const halfSize = TANK_SIZE / 2 - 0.3;

        if (x < -halfSize) {
            x = -halfSize;
            velocities[i] = Math.abs(velocities[i]) * 0.7;
        } else if (x > halfSize) {
            x = halfSize;
            velocities[i] = -Math.abs(velocities[i]) * 0.7;
        }

        if (y < -halfSize) {
            y = -halfSize;
            velocities[i + 1] = Math.abs(velocities[i + 1]) * 0.7;
        } else if (y > halfSize) {
            y = halfSize;
            velocities[i + 1] = -Math.abs(velocities[i + 1]) * 0.7;
        }

        if (z < -halfSize) {
            z = -halfSize;
            velocities[i + 2] = Math.abs(velocities[i + 2]) * 0.7;
        } else if (z > halfSize) {
            z = halfSize;
            velocities[i + 2] = -Math.abs(velocities[i + 2]) * 0.7;
        }

        positions[i] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
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

init();
animate();

console.log('🌊 Simulazione avviata!');

// Made with Bob
