const { Engine, Render, Runner, Bodies, Composite, MouseConstraint, Mouse, Events, Body, Vector } = Matter;

const engine = Engine.create({ positionIterations: 15 });
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');

// FONDO DE CUADROS
function drawGrid() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    const s = 60;
    for (let y = 0; y < bgCanvas.height; y += s) {
        for (let x = 0; x < bgCanvas.width; x += s) {
            bgCtx.fillStyle = (Math.floor(x/s)%2 === Math.floor(y/s)%2) ? '#ffffff' : '#f8f8f8';
            bgCtx.fillRect(x, y, s, s);
        }
    }
}
drawGrid();
window.addEventListener('resize', drawGrid);

const render = Render.create({
    element: document.getElementById('game-container'),
    engine: engine,
    options: { width: window.innerWidth, height: window.innerHeight, wireframes: false, background: 'transparent' }
});

// TEXTURA DE TU BOLA
const createBallTexture = (r) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.height = r * 2;
    ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "#f1c40f"; ctx.fillRect(0,0,r,r); ctx.fillRect(r,r,r,r);
    ctx.fillStyle = "#000"; ctx.fillRect(r,0,r,r); ctx.fillRect(0,r,r,r);
    return canvas.toDataURL();
};

const ball = Bodies.circle(window.innerWidth/2, 200, 60, {
    restitution: 0.9, friction: 0.02, density: 0.01,
    render: { sprite: { texture: createBallTexture(60) } }
});

const thick = 1000;
const wallOpts = { isStatic: true, render: { visible: false } };
Composite.add(engine.world, [
    ball,
    Bodies.rectangle(window.innerWidth/2, window.innerHeight + thick/2, window.innerWidth, thick, wallOpts),
    Bodies.rectangle(window.innerWidth/2, -thick/2, window.innerWidth, thick, wallOpts),
    Bodies.rectangle(-thick/2, window.innerHeight/2, thick, window.innerHeight, wallOpts),
    Bodies.rectangle(window.innerWidth + thick/2, window.innerHeight/2, thick, window.innerHeight, wallOpts)
]);

const mouse = Mouse.create(render.canvas);
const mConstraint = MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.15, render: { visible: false } } });
Composite.add(engine.world, mConstraint);

const glow = document.getElementById('glow');

// FÍSICA AVANZADA: CONTROL DE VELOCIDAD
Events.on(engine, 'beforeUpdate', () => {
    const maxSpeed = 35; // Evita que la bola atraviese paredes por rebote infinito
    if (ball.speed > maxSpeed) {
        const reduction = maxSpeed / ball.speed;
        Body.setVelocity(ball, { x: ball.velocity.x * reduction, y: ball.velocity.y * reduction });
    }
});

Events.on(engine, 'afterUpdate', () => {
    document.getElementById('speedVal').innerText = (ball.speed * 10).toFixed(1);
    glow.style.left = ball.position.x + 'px';
    glow.style.top = ball.position.y + 'px';
    const s = 1 + (ball.speed / 40);
    glow.style.transform = `translate(-50%, -50%) scale(${s}, ${1/s}) rotate(${ball.angle}rad)`;
});

// IDIOMAS (languages.js debe estar cargado)
const select = document.getElementById('langSelect');
if (typeof isoNames !== 'undefined') {
    Object.keys(isoNames).forEach(code => {
        let opt = document.createElement('option');
        opt.value = code; opt.innerText = isoNames[code];
        select.appendChild(opt);
    });
}

function setLang(code) {
    if (typeof i18n !== 'undefined') {
        const d = i18n[code] || i18n.en;
        document.getElementById('ui-title').innerText = d[0];
        document.getElementById('lbl-gravity').innerText = d[1];
        document.getElementById('lbl-bounce').innerText = d[2];
        document.getElementById('lbl-speed').innerText = d[3];
        document.getElementById('resetBtn').innerText = d[4];
        document.getElementById('lbl-lang').innerText = d[5];
    }
}

select.addEventListener('change', e => setLang(e.target.value));
document.getElementById('gravityRange').addEventListener('input', e => engine.gravity.y = parseFloat(e.target.value));
document.getElementById('bounceRange').addEventListener('input', e => ball.restitution = parseFloat(e.target.value));
document.getElementById('resetBtn').addEventListener('click', () => {
    Body.setPosition(ball, {x: window.innerWidth/2, y: 100});
    Body.setVelocity(ball, {x: 0, y: 0});
});

setLang('en');
Render.run(render);
Runner.run(Runner.create(), engine);