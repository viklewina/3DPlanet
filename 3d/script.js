import * as THREE from 'three';

// --- Инициализация сцены с эффектным фоном ---
const scene = new THREE.Scene();

// Красивый глубокий фон с градиентом (через CSS можно, но мы сделаем через текстуру)
// Создадим canvas с радиальным градиентом для фона
const canvas = document.createElement('canvas');
canvas.width = 32;
canvas.height = 32;
const ctx = canvas.getContext('2d');
const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
gradient.addColorStop(0, '#0a0a2a');
gradient.addColorStop(0.5, '#1a1a4a');
gradient.addColorStop(1, '#050510');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 32, 32);
const backgroundTexture = new THREE.CanvasTexture(canvas);
scene.background = backgroundTexture;

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 18);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: false,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ограничим для производительности
renderer.shadowMap.enabled = false; // тени не нужны
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
document.body.appendChild(renderer.domElement);

// --- Освещение — сделаем его драматичным ---
const ambientLight = new THREE.AmbientLight(0x40406b); // фиолетовый оттенок
scene.add(ambientLight);

// Основной теплый свет
const light1 = new THREE.PointLight(0xffaa66, 1.5, 30);
light1.position.set(5, 5, 5);
scene.add(light1);

// Холодный свет
const light2 = new THREE.PointLight(0x88aaff, 1.5, 30);
light2.position.set(-5, -3, 5);
scene.add(light2);

// Задний свет
const light3 = new THREE.PointLight(0xaa88ff, 1, 20);
light3.position.set(0, 0, -10);
scene.add(light3);

// Добавим вращающиеся источники для динамики
const extraLights = [];
for (let i = 0; i < 3; i++) {
    const color = new THREE.Color().setHSL(i / 3, 1, 0.5);
    const light = new THREE.PointLight(color, 0.8, 20);
    light.position.set(Math.sin(i*2)*5, Math.cos(i*2)*5, 3);
    scene.add(light);
    extraLights.push(light);
}

// --- Создаём крутые звезды (основные) ---
const starsCount = 40; // немного больше
const stars = [];

// Геометрия звезды: икосаэдр с细分 для большего количества граней (выглядит как драгоценный камень)
const starGeometry = new THREE.IcosahedronGeometry(0.45, 2); // subdivision 2

// Палитра цветов: сочные, насыщенные
const colors = [
    0xffaa66, 0xff8888, 0xff66aa, 0x88aaff, 0xaaccff, 0xddbbff, 
    0xffdd88, 0xffaa88, 0x88ffaa, 0xaaaaff, 0xff99cc
];

// Массив для хранения оригинальных состояний
const originalStates = [];

// Создадим текстуру блеска (glow) для ореолов
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.6, 'rgba(200,200,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}
const glowTexture = createGlowTexture();

for (let i = 0; i < starsCount; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Основной материал звезды — с эмиссией и металликом
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.3,
        emissiveMap: glowTexture, // добавим легкую карту для разнообразия
        emissiveIntensity: 0.5
    });
    
    const star = new THREE.Mesh(starGeometry, material);
    
    // Размещаем на сфере
    const radius = 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    star.position.x = radius * Math.sin(phi) * Math.cos(theta);
    star.position.y = radius * Math.sin(phi) * Math.sin(theta);
    star.position.z = radius * Math.cos(phi);
    
    // Случайный размер
    const scale = 0.6 + Math.random() * 0.9;
    star.scale.set(scale, scale, scale);
    
    // Добавляем ореол (glow) — отдельный спрайт или меш
    // Сделаем простой спрайт с текстурой градиента
    const spriteMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.7
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.2, 1.2, 1); // размер ореола
    star.add(sprite); // прикрепляем к звезде, чтобы двигался вместе
    
    // Добавим маленький точечный свет от звезды для реализма
    const pointLight = new THREE.PointLight(color, 0.5, 10);
    star.add(pointLight);
    
    // Сохраняем данные
    star.userData = {
        rotationSpeed: 0.002 + Math.random() * 0.008,
        id: i,
        originalPos: star.position.clone(),
        repelStrength: 0.5 + Math.random() * 0.8,
        returnSpeed: 0.03 + Math.random() * 0.04,
        originalScale: scale,
        color: color,
        sprite: sprite,
        light: pointLight
    };
    
    scene.add(star);
    stars.push(star);
    originalStates.push({ color, scale });
}

// --- Фоновые звёзды (туманность и мелкие частицы) ---
// Создадим красивую туманность с помощью множества частиц
const particleCount = 1500;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);
const particleSizes = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
    // Распределение в сфере с большим радиусом
    const r = 12 + Math.random() * 15;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    particlePositions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    particlePositions[i*3+2] = r * Math.cos(phi);
    
    // Цвета от голубого до розового
    const color = new THREE.Color().setHSL(0.6 + Math.random()*0.4, 0.8, 0.6 + Math.random()*0.3);
    particleColors[i*3] = color.r;
    particleColors[i*3+1] = color.g;
    particleColors[i*3+2] = color.b;
    
    particleSizes[i] = 0.1 + Math.random() * 0.3;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
particleGeo.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

// Создадим материал с шейдером для мерцания
function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.arc(16, 16, 14, 0, Math.PI*2);
    ctx.fill();
    const gradient = ctx.createRadialGradient(16,16,0,16,16,16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,32,32);
    return new THREE.CanvasTexture(canvas);
}

const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        pointTexture: { value: createParticleTexture() }
    },
    vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + 0.3 * sin(time * 2.0 + position.x));
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        void main() {
            vec4 texColor = texture2D(pointTexture, gl_PointCoord);
            gl_FragColor = vec4(vColor, 0.8) * texColor;
            if (gl_FragColor.a < 0.1) discard;
        }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(particleGeo, particleMaterial);
scene.add(particles);

// Добавим ещё один слой очень мелких звёзд (background)
const bgParticleGeo = new THREE.BufferGeometry();
const bgCount = 800;
const bgPositions = new Float32Array(bgCount * 3);
for (let i = 0; i < bgCount; i++) {
    const r = 25 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    bgPositions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    bgPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    bgPositions[i*3+2] = r * Math.cos(phi);
}
bgParticleGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
const bgParticleMat = new THREE.PointsMaterial({ color: 0xaaccff, size: 0.08, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
const bgParticles = new THREE.Points(bgParticleGeo, bgParticleMat);
scene.add(bgParticles);

// --- Эффектная сетка или туманность в центре ---
// Добавим легкое газовое облако (сфера с шейдером)
const cloudGeo = new THREE.SphereGeometry(8, 32, 32);
const cloudMat = new THREE.MeshPhongMaterial({
    color: 0x335588,
    emissive: 0x112233,
    transparent: true,
    opacity: 0.08,
    wireframe: false,
    side: THREE.BackSide
});
const cloud = new THREE.Mesh(cloudGeo, cloudMat);
scene.add(cloud);

// --- Raycaster для отталкивания от курсора ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseRay = null;

// --- Обработчики событий мыши / касаний ---
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mouseleave', () => mouseRay = null);
renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
renderer.domElement.addEventListener('touchend', () => mouseRay = null);
renderer.domElement.addEventListener('touchcancel', () => mouseRay = null);

function onMouseMove(event) {
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    updateMouseRay();
}

function onTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
        mouse.x = (event.touches[0].clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / renderer.domElement.clientHeight) * 2 + 1;
        updateMouseRay();
    }
}

function updateMouseRay() {
    raycaster.setFromCamera(mouse, camera);
    mouseRay = raycaster.ray.clone();
}

// --- Функция отталкивания от луча ---
function calculateRepelForce(starPos, ray, strength) {
    if (!ray) return new THREE.Vector3(0, 0, 0);
    const closestPoint = new THREE.Vector3();
    ray.closestPointToPoint(starPos, closestPoint);
    const direction = new THREE.Vector3().subVectors(starPos, closestPoint);
    const distance = direction.length();
    const repelRadius = 6.0; // увеличен радиус
    if (distance < repelRadius && distance > 0.01) {
        const forceFactor = (repelRadius - distance) / repelRadius * strength;
        return direction.normalize().multiplyScalar(forceFactor);
    }
    return new THREE.Vector3(0, 0, 0);
}

function calculateReturnForce(starPos, originalPos, speed) {
    return new THREE.Vector3().subVectors(originalPos, starPos).multiplyScalar(speed);
}

// --- Анимация ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const deltaFactor = Math.min(delta * 30, 2); // ограничим для резких скачков

    // Обновляем время для шейдеров
    if (particles.material.uniforms) {
        particles.material.uniforms.time.value += delta;
    }

    // Вращаем фоновые облака
    cloud.rotation.y += 0.0005 * deltaFactor;
    cloud.rotation.x += 0.0002 * deltaFactor;
    bgParticles.rotation.y += 0.0002 * deltaFactor;
    particles.rotation.y += 0.0003 * deltaFactor;

    // Вращаем дополнительные источники света
    extraLights.forEach((light, index) => {
        const time = performance.now() * 0.001;
        light.position.x = Math.sin(time * 0.5 + index) * 6;
        light.position.y = Math.cos(time * 0.5 + index) * 4;
        light.position.z = Math.sin(time * 0.3 + index) * 5;
    });

    // Обработка отталкивания звёзд
    stars.forEach(star => {
        const repel = calculateRepelForce(star.position, mouseRay, star.userData.repelStrength * deltaFactor);
        const ret = calculateReturnForce(star.position, star.userData.originalPos, star.userData.returnSpeed * deltaFactor);
        star.position.add(repel);
        star.position.add(ret);

        // Вращение
        star.rotation.x += star.userData.rotationSpeed * deltaFactor;
        star.rotation.y += star.userData.rotationSpeed * 1.3 * deltaFactor;
        star.rotation.z += star.userData.rotationSpeed * 0.7 * deltaFactor;

        // Визуальный фидбек: яркость и размер в зависимости от близости к лучу
        if (mouseRay) {
            const closest = new THREE.Vector3();
            mouseRay.closestPointToPoint(star.position, closest);
            const distToRay = star.position.distanceTo(closest);
            const glowRadius = 5.0;
            if (distToRay < glowRadius) {
                const intensity = 0.5 + (1 - distToRay / glowRadius) * 1.5;
                star.material.emissiveIntensity = intensity;
                // Меняем цвет эмиссии ближе к белому
                star.material.emissive.setHSL(0, 0, 1); // белый
                // Увеличиваем яркость точечного света
                if (star.userData.light) star.userData.light.intensity = 0.5 + (1 - distToRay / glowRadius) * 1.0;
                // Увеличиваем ореол
                if (star.userData.sprite) {
                    const scale = 1.2 + (1 - distToRay / glowRadius) * 0.8;
                    star.userData.sprite.scale.set(scale, scale, 1);
                }
            } else {
                star.material.emissiveIntensity = 0.4;
                star.material.emissive.setHex(star.userData.color);
                if (star.userData.light) star.userData.light.intensity = 0.5;
                if (star.userData.sprite) star.userData.sprite.scale.set(1.2, 1.2, 1);
            }
        } else {
            star.material.emissiveIntensity = 0.4;
            star.material.emissive.setHex(star.userData.color);
            if (star.userData.light) star.userData.light.intensity = 0.5;
            if (star.userData.sprite) star.userData.sprite.scale.set(1.2, 1.2, 1);
        }
    });

    renderer.render(scene, camera);
}

animate();

// --- Resize ---
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Маленькая деталь: добавим эффект параллакса для фона (движение камеры за мышью) ---
// Это необязательно, но добавит "вау"
document.addEventListener('mousemove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    camera.position.x += (x * 2 - camera.position.x) * 0.02;
    camera.position.y += (-y * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
});

console.log('✨ Сцена готова! Препод будет в шоке ✨');