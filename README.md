# 🌊 Simulazione Vortice Planetario 3D

Una simulazione interattiva 3D di un fluido in una vasca con una sfera rotante che genera un vortice, simile a un pianeta.

## 🎯 Caratteristiche

- **Rendering 3D** con Three.js
- **Sistema di particelle** per simulare il fluido (5000+ particelle)
- **Fisica del vortice** con rotazione realistica
- **Sfera rotante** centrale che genera il vortice
- **Vasca trasparente** con bordi luminosi
- **Controlli interattivi** per velocità e numero di particelle
- **Camera orbitale** per esplorare la scena da ogni angolazione

## 🚀 Come Avviare

### Metodo 1: Server Locale (Consigliato)

```bash
# Con Python 3
python -m http.server 8000

# Con Python 2
python -m SimpleHTTPServer 8000

# Con Node.js (se hai http-server installato)
npx http-server -p 8000
```

Poi apri il browser su: `http://localhost:8000`

### Metodo 2: Apertura Diretta

Apri semplicemente il file `index.html` nel browser (alcuni browser potrebbero avere restrizioni CORS).

## 🎮 Controlli

- **Mouse Sinistro + Trascina**: Ruota la camera
- **Rotella Mouse**: Zoom in/out
- **Mouse Destro + Trascina**: Pan (sposta la vista)
- **Slider Velocità Rotazione**: Controlla la velocità della sfera e del vortice
- **Slider Numero Particelle**: Cambia il numero di particelle (1000-20000)

## 📁 Struttura del Progetto

```
planet-theory/
├── index.html          # Pagina principale con UI
├── main.js            # Logica della simulazione
└── README.md          # Documentazione
```

## 🔧 Tecnologie Utilizzate

- **Three.js** (r128): Libreria 3D per WebGL
- **OrbitControls**: Controllo camera interattivo
- **JavaScript ES6**: Logica dell'applicazione

## 📊 Fasi di Sviluppo

### ✅ Fase 1: Setup Iniziale
- [x] Struttura HTML base
- [x] Configurazione Three.js
- [x] Setup camera e renderer
- [x] Controlli UI

### ✅ Fase 2: Elementi 3D
- [x] Creazione vasca trasparente
- [x] Sfera rotante centrale
- [x] Sistema di illuminazione

### ✅ Fase 3: Sistema Particelle
- [x] Generazione particelle
- [x] Colori dinamici
- [x] Rendering ottimizzato

### ✅ Fase 4: Fisica del Vortice
- [x] Forza tangenziale (rotazione)
- [x] Componente verticale (spirale)
- [x] Collisioni con pareti
- [x] Attrito e damping

### 🔄 Fase 5: Miglioramenti Futuri
- [ ] Texture per la sfera (mappa planetaria)
- [ ] Effetti particellari avanzati (trails)
- [ ] Suoni ambientali
- [ ] Preset di configurazione
- [ ] Export/Import configurazioni

## 🎨 Personalizzazione

### Modificare i Parametri

Nel file `main.js`, puoi modificare:

```javascript
// Dimensioni
const TANK_SIZE = 10;          // Dimensione vasca
const SPHERE_RADIUS = 2;       // Raggio sfera
const PARTICLE_SIZE = 0.05;    // Dimensione particelle

// Fisica
rotationSpeed = 1.0;           // Velocità rotazione
particleCount = 5000;          // Numero particelle
```

### Cambiare i Colori

```javascript
// Colore vasca
color: 0x1e88e5

// Colore sfera
color: 0xff6b35

// Colore particelle (HSL)
color.setHSL(0.55, 0.8, 0.5)  // Hue, Saturation, Lightness
```

## 🐛 Risoluzione Problemi

### Le particelle non si muovono
- Verifica che la velocità di rotazione sia > 0
- Controlla la console del browser per errori

### Performance basse
- Riduci il numero di particelle
- Disabilita le ombre nel renderer
- Riduci la qualità antialiasing

### La scena non si carica
- Verifica la connessione internet (Three.js viene caricato da CDN)
- Controlla la console per errori di caricamento

## 📝 Note Tecniche

### Sistema di Particelle

Il sistema utilizza `BufferGeometry` per performance ottimali:
- Posizioni aggiornate ogni frame
- Velocità calcolate in base alla distanza dalla sfera
- Forza del vortice inversamente proporzionale alla distanza

### Fisica del Vortice

La fisica implementa:
1. **Forza tangenziale**: Rotazione attorno all'asse Y
2. **Forza verticale**: Movimento su/giù (spirale)
3. **Attrito**: Damping delle velocità (0.98)
4. **Collisioni**: Rimbalzo elastico sulle pareti

## 🤝 Contributi

Questo è un progetto educativo. Sentiti libero di:
- Sperimentare con i parametri
- Aggiungere nuove funzionalità
- Migliorare le performance
- Creare variazioni artistiche

## 📄 Licenza

Progetto open source per scopi educativi.

## 🎓 Apprendimento

Questo progetto dimostra:
- Rendering 3D con WebGL/Three.js
- Sistemi di particelle
- Fisica base (forze, velocità, collisioni)
- Interazione utente in 3D
- Ottimizzazione performance

---

**Creato con ❤️ per esplorare la fisica dei fluidi in 3D**# planets-simulation
