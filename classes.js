// ============================================
// CLASSI PER LA SIMULAZIONE DEL VORTICE ETEREO
// ============================================

/**
 * Classe base per tutti i corpi celesti
 */
class CelestialBody {
    constructor(config, scene) {
        this.config = config;
        this.scene = scene;
        this.mesh = null;
        this.velocity = {
            x: config.velocity?.x || 0,
            y: config.velocity?.y || 0,
            z: config.velocity?.z || 0
        };
        this.angularVelocity = {
            x: 0,
            y: 0,
            z: 0
        };
    }

    /**
     * Crea la mesh 3D del corpo celeste
     */
    createMesh() {
        throw new Error('createMesh() deve essere implementato nelle sottoclassi');
    }

    /**
     * Aggiorna la fisica del corpo celeste
     */
    update(deltaTime, aether) {
        throw new Error('update() deve essere implementato nelle sottoclassi');
    }

    /**
     * Ottiene la posizione corrente
     */
    getPosition() {
        return this.mesh ? this.mesh.position : { x: 0, y: 0, z: 0 };
    }

    /**
     * Imposta la posizione
     */
    setPosition(x, y, z) {
        if (this.mesh) {
            this.mesh.position.set(x, y, z);
        }
    }

    /**
     * Crea una texture procedurale
     */
    createProceduralTexture(width, height, drawFunction) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        drawFunction(context, width, height);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
}

/**
 * Classe per le stelle (Sole)
 */
class Star extends CelestialBody {
    constructor(config, scene) {
        super(config, scene);
        this.rotationPeriod = config.rotationPeriod || 25;
        this.angularVelocity.y = (Math.PI * 2) / this.rotationPeriod;
        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.config.radius, 64, 64);

        // Crea texture procedurale per la stella
        const texture = this.createProceduralTexture(512, 512, (ctx, w, h) => {
            // Sfondo con gradiente
            const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
            const colors = this.config.texture.baseColors;
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(0.5, colors[1]);
            gradient.addColorStop(1, colors[2]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            // Macchie solari scure
            ctx.fillStyle = 'rgba(180, 50, 20, 0.4)';
            for (let i = 0; i < this.config.texture.sunspots; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const radius = 10 + Math.random() * 30;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Dettagli luminosi
            ctx.fillStyle = 'rgba(255, 255, 150, 0.3)';
            for (let i = 0; i < this.config.texture.brightSpots; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const radius = 5 + Math.random() * 15;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            emissive: this.config.emissive,
            emissiveIntensity: this.config.emissiveIntensity,
            emissiveMap: texture,
            metalness: 0.1,
            roughness: 0.8
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z
        );
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Salva riferimento alla stella nella mesh
        this.mesh.userData.celestialBody = this;

        this.scene.add(this.mesh);
        console.log(`✅ Stella "${this.config.name}" creata`);
    }

    update(deltaTime, rotationSpeed) {
        if (!this.mesh) return;

        // Rotazione della stella
        const angularVel = this.angularVelocity.y * rotationSpeed;
        this.mesh.rotation.y += angularVel;

        // Salva la velocità angolare per l'etere
        this.mesh.userData.angularVelocity = angularVel;
    }
}

/**
 * Classe per i pianeti
 */
class Planet extends CelestialBody {
    constructor(config, scene) {
        super(config, scene);
        this.orbitalRadius = config.orbitalRadius || 4.0;
        this.orbitalPeriod = config.orbitalPeriod || 365;
        this.rotationPeriod = config.rotationPeriod || 1;
        this.axialTilt = (config.axialTilt || 0) * Math.PI / 180; // Converti in radianti
        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.config.radius, 32, 32);

        // Crea texture procedurale per il pianeta
        const texture = this.createProceduralTexture(256, 256, (ctx, w, h) => {
            // Oceani
            ctx.fillStyle = this.config.texture.oceanColor;
            ctx.fillRect(0, 0, w, h);

            // Continenti
            ctx.fillStyle = this.config.texture.landColor;
            for (let i = 0; i < this.config.texture.continents; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const width = 30 + Math.random() * 60;
                const height = 20 + Math.random() * 40;
                ctx.beginPath();
                ctx.ellipse(x, y, width, height, Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }

            // Nuvole
            ctx.fillStyle = this.config.texture.cloudColor;
            for (let i = 0; i < this.config.texture.clouds; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const radius = 5 + Math.random() * 15;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.1,
            roughness: 0.7,
            emissive: this.config.emissive,
            emissiveIntensity: this.config.emissiveIntensity
        });

        this.mesh = new THREE.Mesh(geometry, material);

        // Aggiungi alone luminoso
        const glowGeometry = new THREE.SphereGeometry(this.config.radius * 1.3, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.config.glowColor,
            transparent: true,
            opacity: this.config.glowOpacity,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(glow);

        this.mesh.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z
        );
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Salva riferimento al pianeta nella mesh
        this.mesh.userData.celestialBody = this;

        this.scene.add(this.mesh);
        console.log(`✅ Pianeta "${this.config.name}" creato`);
    }

    update(deltaTime, aether, star, tankRadius, tankHeight) {
        if (!this.mesh || !star) return;

        const pos = this.getPosition();
        const starPos = star.getPosition();

        // Calcola distanza dalla stella
        const dx = pos.x - starPos.x;
        const dy = pos.y - starPos.y;
        const dz = pos.z - starPos.z;
        const radiusXZ = Math.sqrt(dx * dx + dz * dz);
        const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const safeDist = Math.max(distance3D, 0.1);
        const safeRadiusXZ = Math.max(radiusXZ, 0.1);

        // Forza del vortice dell'etere
        const vortexStrength = Math.max(0, 1 - distance3D / (tankRadius * 2 * 0.7));
        const powerFactor = Math.pow(vortexStrength, 0.8);

        // Angolo sul piano XZ
        const angle = Math.atan2(dz, dx);

        // Velocità angolare della stella
        const starAngularVel = star.mesh.userData.angularVelocity || 0;

        // Velocità tangenziale: trascinata dall'etere
        const tangentSpeed = starAngularVel * radiusXZ * powerFactor * aether.config.planetDragCoefficient;
        const tangentX = Math.sin(angle) * tangentSpeed;
        const tangentZ = -Math.cos(angle) * tangentSpeed;

        // Forza centripeta
        const centripetalForce = powerFactor * aether.config.planetCentripetalForce;
        const centripetalX = -dx / safeDist * centripetalForce;
        const centripetalZ = -dz / safeDist * centripetalForce;

        // Tendenza verso l'eclittica
        const eclipticForce = -dy * 0.01;

        // Aggiorna velocità
        this.velocity.x += tangentX + centripetalX;
        this.velocity.y += eclipticForce;
        this.velocity.z += tangentZ + centripetalZ;

        // Attrito
        this.velocity.x *= aether.config.viscosity;
        this.velocity.y *= aether.config.viscosity - 0.02;
        this.velocity.z *= aether.config.viscosity;

        // Aggiorna posizione
        let x = pos.x + this.velocity.x;
        let y = pos.y + this.velocity.y;
        let z = pos.z + this.velocity.z;

        // Collisioni con vasca cilindrica
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter > tankRadius - 1) {
            const angle = Math.atan2(z, x);
            x = Math.cos(angle) * (tankRadius - 1);
            z = Math.sin(angle) * (tankRadius - 1);

            const radialVelX = this.velocity.x * Math.cos(angle);
            const radialVelZ = this.velocity.z * Math.sin(angle);
            const radialVel = radialVelX + radialVelZ;

            this.velocity.x -= 1.7 * radialVel * Math.cos(angle);
            this.velocity.z -= 1.7 * radialVel * Math.sin(angle);
        }

        if (y < -tankHeight + 1) {
            y = -tankHeight + 1;
            this.velocity.y *= -0.7;
        } else if (y > tankHeight - 1) {
            y = tankHeight - 1;
            this.velocity.y *= -0.7;
        }

        this.setPosition(x, y, z);

        // Rotazione su se stesso (causata dal fluido)
        const fluidSpeed = tangentSpeed / radiusXZ;
        const torque = fluidSpeed * powerFactor * 0.3;
        this.angularVelocity.y += torque;

        this.angularVelocity.x *= 0.96;
        this.angularVelocity.y *= 0.96;
        this.angularVelocity.z *= 0.96;

        this.mesh.rotation.x += this.angularVelocity.x;
        this.mesh.rotation.y += this.angularVelocity.y;
        this.mesh.rotation.z += this.angularVelocity.z;

        // Mantieni inclinazione assiale
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, this.axialTilt, 0.05);
    }
}

/**
 * Classe per l'etere (fluido cosmico)
 */
class Aether {
    constructor(config, scene, tankRadius, tankHeight) {
        this.config = config;
        this.scene = scene;
        this.tankRadius = tankRadius;
        this.tankHeight = tankHeight;
        this.particleSystem = null;
        this.velocities = [];
        this.createParticleSystem();
    }

    createParticleSystem() {
        console.log('💧 Creazione sistema etere...');

        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        // Genera particelle casuali nella vasca
        for (let i = 0; i < this.config.particleCount; i++) {
            // Posizione casuale nella vasca cilindrica
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.tankRadius * 0.9;
            const x = Math.cos(angle) * radius;
            const y = (Math.random() - 0.5) * this.tankHeight * 0.9;
            const z = Math.sin(angle) * radius;

            positions.push(x, y, z);

            // Colore con variazioni
            const color = new THREE.Color();
            const hue = this.config.particleColor.hue + Math.random() * 0.1;
            const sat = this.config.particleColor.saturation;
            const light = this.config.particleColor.lightnessMin +
                Math.random() * (this.config.particleColor.lightnessMax - this.config.particleColor.lightnessMin);
            color.setHSL(hue, sat, light);
            colors.push(color.r, color.g, color.b);

            // Velocità iniziale
            this.velocities.push(0, 0, 0);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: this.config.particleSize,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);

        console.log(`✅ Sistema etere creato (${this.config.particleCount} particelle)`);
    }

    update(star, rotationSpeed) {
        if (!this.particleSystem || !star) return;

        const positions = this.particleSystem.geometry.attributes.position.array;
        const time = Date.now() * 0.001;
        const starPos = star.getPosition();
        const starAngularVel = star.mesh.userData.angularVelocity || 0;

        for (let i = 0; i < positions.length; i += 3) {
            let x = positions[i];
            let y = positions[i + 1];
            let z = positions[i + 2];

            // Calcola distanza dalla stella
            const dx = x - starPos.x;
            const dy = y - starPos.y;
            const dz = z - starPos.z;
            const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const radiusXZ = Math.sqrt(dx * dx + dz * dz);

            const safeDist = Math.max(distance3D, 0.1);
            const safeRadiusXZ = Math.max(radiusXZ, 0.1);

            // Forza del vortice
            const vortexStrength = Math.max(0, 1 - distance3D / (this.tankRadius * 2 * 0.7));
            const powerFactor = Math.pow(vortexStrength, 0.8);

            // Angolo sul piano XZ
            const angle = Math.atan2(dz, dx);

            // Velocità tangenziale
            const tangentSpeed = starAngularVel * radiusXZ * powerFactor * this.config.dragCoefficient;
            const tangentX = Math.sin(angle) * tangentSpeed;
            const tangentZ = -Math.cos(angle) * tangentSpeed;

            // Forza centripeta
            const centripetalForce = powerFactor * rotationSpeed * this.config.centripetalForce;
            const centripetalX = -dx / safeDist * centripetalForce;
            const centripetalZ = -dz / safeDist * centripetalForce;

            // Turbolenza 3D
            const turbulence = this.config.turbulence * rotationSpeed;
            const turbX = (Math.sin(time * 3 + i * 0.1) - 0.5) * turbulence;
            const turbY = (Math.sin(time * 2 + i * 0.2) - 0.5) * turbulence;
            const turbZ = (Math.sin(time * 4 + i * 0.15) - 0.5) * turbulence;

            // Aggiorna velocità
            this.velocities[i] += tangentX + centripetalX + turbX;
            this.velocities[i + 1] += turbY;
            this.velocities[i + 2] += tangentZ + centripetalZ + turbZ;

            // Attrito
            this.velocities[i] *= this.config.viscosity;
            this.velocities[i + 1] *= this.config.viscosity;
            this.velocities[i + 2] *= this.config.viscosity;

            // Aggiorna posizione
            x += this.velocities[i];
            y += this.velocities[i + 1];
            z += this.velocities[i + 2];

            // Collisioni con vasca cilindrica
            const distFromCenter = Math.sqrt(x * x + z * z);
            if (distFromCenter > this.tankRadius - 0.3) {
                const angle = Math.atan2(z, x);
                x = Math.cos(angle) * (this.tankRadius - 0.3);
                z = Math.sin(angle) * (this.tankRadius - 0.3);

                const radialVelX = this.velocities[i] * Math.cos(angle);
                const radialVelZ = this.velocities[i + 2] * Math.sin(angle);
                const radialVel = radialVelX + radialVelZ;

                this.velocities[i] -= 1.7 * radialVel * Math.cos(angle);
                this.velocities[i + 2] -= 1.7 * radialVel * Math.sin(angle);
            }

            if (y < -this.tankHeight + 0.3) {
                y = -this.tankHeight + 0.3;
                this.velocities[i + 1] = Math.abs(this.velocities[i + 1]) * 0.7;
            } else if (y > this.tankHeight - 0.3) {
                y = this.tankHeight - 0.3;
                this.velocities[i + 1] = -Math.abs(this.velocities[i + 1]) * 0.7;
            }

            positions[i] = x;
            positions[i + 1] = y;
            positions[i + 2] = z;
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }
}

// Made with Bob
