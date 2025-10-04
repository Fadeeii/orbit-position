// Background starfield
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;

const stars = [];
for (let i = 0; i < 200; i++) {
    stars.push({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        radius: Math.random() * 1.5,
        opacity: Math.random()
    });
}

function drawStars() {
    bgCtx.fillStyle = '#0a0a1a';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    stars.forEach(star => {
        bgCtx.beginPath();
        bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        bgCtx.fill();
        
        star.opacity += (Math.random() - 0.5) * 0.02;
        star.opacity = Math.max(0.3, Math.min(1, star.opacity));
    });
    
    requestAnimationFrame(drawStars);
}
drawStars();

// Screen transitions
function startTracking() {
    document.getElementById('welcome-screen').classList.remove('active');
    setTimeout(() => {
        document.getElementById('main-screen').classList.add('active');
        initOrbitVisualization();
    }, 100);
}

// Three.js orbit visualization
let scene, camera, renderer, asteroid, orbitLine, sun, earth;
let animationId;
let speed = 1;
let paused = false;
let angle = 0;
let earthAngle = 0;

const asteroidData = {
    name: '433 Eros',
    semiMajorAxis: 1.458,
    eccentricity: 0.223,
    period: 643,
    baseVelocity: 24.36
};

// Predefined asteroid database for offline use
const asteroidDatabase = {
    'ceres': { name: '1 Ceres', a: 2.767, e: 0.076, per: 1682 },
    '1': { name: '1 Ceres', a: 2.767, e: 0.076, per: 1682 },
    'vesta': { name: '4 Vesta', a: 2.362, e: 0.089, per: 1325 },
    '4': { name: '4 Vesta', a: 2.362, e: 0.089, per: 1325 },
    'pallas': { name: '2 Pallas', a: 2.773, e: 0.231, per: 1686 },
    '2': { name: '2 Pallas', a: 2.773, e: 0.231, per: 1686 },
    'juno': { name: '3 Juno', a: 2.669, e: 0.257, per: 1593 },
    '3': { name: '3 Juno', a: 2.669, e: 0.257, per: 1593 },
    'eros': { name: '433 Eros', a: 1.458, e: 0.223, per: 643 },
    '433': { name: '433 Eros', a: 1.458, e: 0.223, per: 643 },
    'apophis': { name: '99942 Apophis', a: 0.922, e: 0.191, per: 324 },
    '99942': { name: '99942 Apophis', a: 0.922, e: 0.191, per: 324 },
    'bennu': { name: '101955 Bennu', a: 1.126, e: 0.204, per: 437 },
    '101955': { name: '101955 Bennu', a: 1.126, e: 0.204, per: 437 },
    'ryugu': { name: '162173 Ryugu', a: 1.190, e: 0.190, per: 474 },
    '162173': { name: '162173 Ryugu', a: 1.190, e: 0.190, per: 474 },
    'itokawa': { name: '25143 Itokawa', a: 1.324, e: 0.280, per: 556 },
    '25143': { name: '25143 Itokawa', a: 1.324, e: 0.280, per: 556 },
    'psyche': { name: '16 Psyche', a: 2.921, e: 0.134, per: 1828 },
    '16': { name: '16 Psyche', a: 2.921, e: 0.134, per: 1828 },
    'hygiea': { name: '10 Hygiea', a: 3.139, e: 0.117, per: 2034 },
    '10': { name: '10 Hygiea', a: 3.139, e: 0.117, per: 2034 }
};

function initOrbitVisualization() {
    const canvas = document.getElementById('orbit-canvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xfdb813,
        emissive: 0xfdb813,
        emissiveIntensity: 1
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Sun glow
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xfdb813,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Earth orbit reference
    const earthOrbitGeometry = new THREE.BufferGeometry();
    const earthOrbitPoints = [];
    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        earthOrbitPoints.push(
            Math.cos(angle) * 4,
            0,
            Math.sin(angle) * 4
        );
    }
    earthOrbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(earthOrbitPoints, 3));
    const earthOrbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.3
    });
    const earthOrbitLine = new THREE.Line(earthOrbitGeometry, earthOrbitMaterial);
    scene.add(earthOrbitLine);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(4, 0, 0);
    scene.add(earth);

    // Asteroid orbit
    createOrbitLine();

    // Asteroid
    const asteroidGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b6b });
    asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    scene.add(asteroid);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    animate();
}

function createOrbitLine() {
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    const a = asteroidData.semiMajorAxis * 3;
    const e = asteroidData.eccentricity;
    const b = a * Math.sqrt(1 - e * e);
    const c = a * e;

    for (let i = 0; i <= 128; i++) {
        const theta = (i / 128) * Math.PI * 2;
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
        orbitPoints.push(
            (r * Math.cos(theta)) - c,
            0,
            r * Math.sin(theta)
        );
    }
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x38bdf8,
        linewidth: 2
    });
    orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);
}

function animate() {
    if (!paused) {
        angle += 0.005 * speed;
        earthAngle += 0.003 * speed;
        
        const a = asteroidData.semiMajorAxis * 3;
        const e = asteroidData.eccentricity;
        const c = a * e;
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
        
        asteroid.position.x = (r * Math.cos(angle)) - c;
        asteroid.position.z = r * Math.sin(angle);
        
        // Update Earth position
        earth.position.x = Math.cos(earthAngle) * 4;
        earth.position.z = Math.sin(earthAngle) * 4;
        
        // Calculate distances
        const distanceAU = r / 3;
        const distanceFromEarth = Math.sqrt(
            Math.pow(asteroid.position.x - earth.position.x, 2) +
            Math.pow(asteroid.position.z - earth.position.z, 2)
        ) / 3;
        
        const velocityFactor = Math.sqrt((2 / r) - (1 / a));
        const currentVelocity = asteroidData.baseVelocity * velocityFactor;
        
        document.getElementById('distance').textContent = distanceAU.toFixed(3) + ' AU';
        document.getElementById('earth-distance').textContent = distanceFromEarth.toFixed(3) + ' AU';
        document.getElementById('velocity').textContent = currentVelocity.toFixed(2) + ' km/s';
        document.getElementById('angle').textContent = ((angle * 180 / Math.PI) % 360).toFixed(1) + '°';
    }
    
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
}

function changeSpeed(delta) {
    speed = Math.max(0.1, Math.min(5, speed + delta * 0.5));
}

function togglePause() {
    paused = !paused;
    const btn = event.target;
    btn.textContent = paused ? '▶ Play' : '⏸ Pause';
}

function showSearchDialog() {
    document.getElementById('search-dialog').style.display = 'block';
    document.getElementById('search-overlay').style.display = 'block';
    document.getElementById('asteroid-search').focus();
}

function closeSearchDialog() {
    document.getElementById('search-dialog').style.display = 'none';
    document.getElementById('search-overlay').style.display = 'none';
    document.getElementById('search-status').textContent = '';
}

async function searchAsteroid() {
    const searchInput = document.getElementById('asteroid-search').value.trim().toLowerCase();
    const statusDiv = document.getElementById('search-status');
    
    if (!searchInput) {
        statusDiv.textContent = 'Please enter an asteroid name or number';
        statusDiv.style.color = '#ef4444';
        return;
    }
    
    statusDiv.textContent = 'Searching...';
    statusDiv.style.color = '#38bdf8';
    
    // First try local database
    if (asteroidDatabase[searchInput]) {
        const data = asteroidDatabase[searchInput];
        loadAsteroidData(data.name, data.a, data.e, data.per);
        statusDiv.textContent = 'Found! Loading orbit...';
        statusDiv.style.color = '#10b981';
        setTimeout(closeSearchDialog, 1500);
        return;
    }
    
    // ⬇️ THIS IS WHERE THE CODE GOES ⬇️
    // Try NASA API through local proxy server
    try {
        // First, try local proxy server (if running)
        let response;
        let data;
        
        try {
            // Try local backend proxy first
            response = await fetch(`http://localhost:3001/api/asteroid/${encodeURIComponent(searchInput)}`);
            data = await response.json();
        } catch (localError) {
            // If local proxy fails, try public CORS proxy as fallback
            console.log('Local proxy not available, trying public proxy...');
            const publicProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(searchInput)}`)}`;
            response = await fetch(publicProxyUrl);
            data = await response.json();
        }
        
        // Check if multiple matches
        if (data.code === 300 && data.list) {
            statusDiv.innerHTML = `Multiple matches. Try:<br>${data.list.slice(0, 3).map(item => item.pdes).join(', ')}`;
            statusDiv.style.color = '#f59e0b';
            return;
        }
        
        // Check if object found
        if (data.object && data.orbit && data.orbit.elements) {
            const elements = data.orbit.elements;
            const elementMap = {};
            
            // Create a map of orbital elements
            elements.forEach(el => {
                elementMap[el.name] = parseFloat(el.value);
            });
            
            // Extract required orbital parameters
            const semiMajorAxis = elementMap.a; // Semi-major axis in AU
            const eccentricity = elementMap.e;  // Eccentricity
            const period = elementMap.per;      // Orbital period in days
            
            if (semiMajorAxis && eccentricity !== undefined && period) {
                const name = data.object.fullname || data.object.shortname || searchInput;
                loadAsteroidData(name, semiMajorAxis, eccentricity, period);
                
                statusDiv.textContent = '✅ Found! Loading orbit...';
                statusDiv.style.color = '#10b981';
                setTimeout(closeSearchDialog, 1500);
            } else {
                throw new Error('Missing orbital data');
            }
        } else {
            throw new Error('Not found');
        }
    } catch (error) {
        console.error('Search Error:', error);
        statusDiv.innerHTML = `❌ "${searchInput}" not found in NASA database.<br><br>💡 Try: Ceres, Vesta, Pallas, Eros, Bennu, Apophis, Ryugu, Itokawa`;
        statusDiv.style.color = '#ef4444';
    }
}

function loadAsteroidData(name, semiMajorAxis, eccentricity, period) {
    asteroidData.name = name;
    asteroidData.semiMajorAxis = semiMajorAxis;
    asteroidData.eccentricity = eccentricity;
    asteroidData.period = period;
    asteroidData.baseVelocity = 29.78 / Math.sqrt(semiMajorAxis);
    
    document.getElementById('asteroid-name').textContent = name;
    document.getElementById('period').textContent = Math.round(period) + ' days';
    
    scene.remove(orbitLine);
    createOrbitLine();
    angle = 0;
}

// Allow Enter key to search
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('asteroid-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchAsteroid();
            }
        });
    }
});

window.addEventListener('resize', () => {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});