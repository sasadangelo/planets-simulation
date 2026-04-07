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
    console.log('🏗️ Creazione vasca cilindrica...');

    const tankGroup = new THREE.Group();

    // Materiale trasparente per la parete cilindrica
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

    const radius = TANK_SIZE / 2;
    const height = TANK_SIZE;

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

    // Ruota il sole - la sua rotazione genera il vortice nel fluido
    if (sphere) {
        // Velocità angolare del Sole (radianti per frame)
        const sunAngularVelocity = 0.02 * rotationSpeed;
        sphere.rotation.y += sunAngularVelocity;

        // Salva la velocità angolare per calcolare il trascinamento del fluido
        sphere.userData.angularVelocity = sunAngularVelocity;
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
        const radiusXZ = Math.sqrt(dx * dx + dz * dz);
        const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const safeDist = Math.max(distance3D, 0.1);
        const safeRadiusXZ = Math.max(radiusXZ, 0.1);

        // Forza del vortice causata dalla rotazione del Sole
        const vortexStrength = Math.max(0, 1 - distance3D / (TANK_SIZE * 0.7));
        const powerFactor = Math.pow(vortexStrength, 0.8);

        // Calcola angolo sul piano XZ
        const angle = Math.atan2(dz, dx);

        // Velocità angolare del Sole
        const sunAngularVelocity = sphere.userData.angularVelocity || 0.02 * rotationSpeed;

        // VELOCITÀ TANGENZIALE: la Terra è trascinata dal vortice del Sole
        const tangentSpeed = sunAngularVelocity * radiusXZ * powerFactor * 1.2;
        const tangentX = -Math.sin(angle) * tangentSpeed;
        const tangentZ = Math.cos(angle) * tangentSpeed;

        // Forza centripeta (mantiene l'orbita stabile)
        const centripetalForce = powerFactor * rotationSpeed * 0.015;
        const centripetalX = -dx / safeDist * centripetalForce;
        const centripetalZ = -dz / safeDist * centripetalForce;

        // Tendenza naturale verso l'eclittica (più debole)
        // La Terra tende gradualmente verso y=0 per effetto del disco di particelle
        const eclipticForce = -dy * 0.01;

        // Aggiorna velocità lineare
        earthVelocity.x += tangentX + centripetalX;
        earthVelocity.y += eclipticForce;
        earthVelocity.z += tangentZ + centripetalZ;

        // Attrito uniforme
        earthVelocity.x *= 0.98;
        earthVelocity.y *= 0.96; // Leggermente più attrito verticale
        earthVelocity.z *= 0.98;

        // Aggiorna posizione
        x += earthVelocity.x;
        y += earthVelocity.y;
        z += earthVelocity.z;

        // Mantieni dentro la vasca cilindrica
        const tankRadius = TANK_SIZE / 2 - 1;
        const tankHeight = TANK_SIZE / 2 - 1;

        // Collisione con parete cilindrica
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter > tankRadius) {
            const angle = Math.atan2(z, x);
            x = Math.cos(angle) * tankRadius;
            z = Math.sin(angle) * tankRadius;

            // Rimbalzo
            const radialVelX = earthVelocity.x * Math.cos(angle);
            const radialVelZ = earthVelocity.z * Math.sin(angle);
            const radialVel = radialVelX + radialVelZ;

            earthVelocity.x -= 1.7 * radialVel * Math.cos(angle);
            earthVelocity.z -= 1.7 * radialVel * Math.sin(angle);
        }

        // Collisione con base e coperchio
        if (y < -tankHeight) {
            y = -tankHeight;
            earthVelocity.y *= -0.7;
        } else if (y > tankHeight) {
            y = tankHeight;
            earthVelocity.y *= -0.7;
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
    if (!particleSystem || !sphere) return;

    const positions = particleSystem.geometry.attributes.position.array;
    const velocities = particleSystem.userData.velocities;
    const time = Date.now() * 0.001;

    // Velocità angolare del Sole (radianti per frame)
    const sunAngularVelocity = sphere.userData.angularVelocity || 0.02 * rotationSpeed;

    for (let i = 0; i < positions.length; i += 3) {
        let x = positions[i];
        let y = positions[i + 1];
        let z = positions[i + 2];

        // Calcola distanza dalla sfera in 3D
        const dx = x - sphere.position.x;
        const dy = y - sphere.position.y;
        const dz = z - sphere.position.z;
        const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const radiusXZ = Math.sqrt(dx * dx + dz * dz);

        // Evita divisione per zero
        const safeDist = Math.max(distance3D, 0.1);
        const safeRadiusXZ = Math.max(radiusXZ, 0.1);

        // Forza del vortice basata sulla distanza dal Sole
        const vortexStrength = Math.max(0, 1 - distance3D / (TANK_SIZE * 0.7));
        const powerFactor = Math.pow(vortexStrength, 0.8);

        // Calcola angolo sul piano XZ
        const angle = Math.atan2(dz, dx);

        // VELOCITÀ TANGENZIALE: proporzionale alla velocità angolare del Sole
        // v = ω × r (velocità tangenziale = velocità angolare × raggio sul piano XZ)
        const tangentSpeed = sunAngularVelocity * radiusXZ * powerFactor;
        const tangentX = -Math.sin(angle) * tangentSpeed;
        const tangentZ = Math.cos(angle) * tangentSpeed;

        // Forza centripeta debole (mantiene le particelle in orbita)
        const centripetalForce = powerFactor * rotationSpeed * 0.01;
        const centripetalX = -dx / safeDist * centripetalForce;
        const centripetalZ = -dz / safeDist * centripetalForce;

        // Turbolenza 3D per movimento naturale
        const turbulence = 0.008 * rotationSpeed;
        const turbX = (Math.sin(time * 2 + i * 0.1) - 0.5) * turbulence;
        const turbY = (Math.sin(time * 1.5 + i * 0.2) - 0.5) * turbulence;
        const turbZ = (Math.sin(time * 2.5 + i * 0.15) - 0.5) * turbulence;

        // Aggiorna velocità con tutte le forze
        velocities[i] += tangentX + centripetalX + turbX;
        velocities[i + 1] += turbY; // Solo turbolenza verticale, nessuna forzatura
        velocities[i + 2] += tangentZ + centripetalZ + turbZ;

        // Attrito uniforme
        velocities[i] *= 0.98;
        velocities[i + 1] *= 0.98;
        velocities[i + 2] *= 0.98;

        // Aggiorna posizione
        x += velocities[i];
        y += velocities[i + 1];
        z += velocities[i + 2];

        // Gestione collisioni con vasca cilindrica
        const tankRadius = TANK_SIZE / 2 - 0.3;
        const tankHeight = TANK_SIZE / 2 - 0.3;

        // Collisione con parete cilindrica
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter > tankRadius) {
            const angle = Math.atan2(z, x);
            x = Math.cos(angle) * tankRadius;
            z = Math.sin(angle) * tankRadius;

            // Rimbalzo: inverti componente radiale della velocità
            const radialVelX = velocities[i] * Math.cos(angle);
            const radialVelZ = velocities[i + 2] * Math.sin(angle);
            const radialVel = radialVelX + radialVelZ;

            velocities[i] -= 1.7 * radialVel * Math.cos(angle);
            velocities[i + 2] -= 1.7 * radialVel * Math.sin(angle);
        }

        // Collisione con base e coperchio
        if (y < -tankHeight) {
            y = -tankHeight;
            velocities[i + 1] = Math.abs(velocities[i + 1]) * 0.7;
        } else if (y > tankHeight) {
            y = tankHeight;
            velocities[i + 1] = -Math.abs(velocities[i + 1]) * 0.7;
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
