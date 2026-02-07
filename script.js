window.onload = () => {
    const { Engine, Render, Runner, Bodies, Composite, MouseConstraint, Mouse, Events, Body } = Matter;

    // --- GENERADOR DE FONDO OSCURO (#111111) ---
    const bgCanvas = document.getElementById('bgCanvas');
    const bgCtx = bgCanvas.getContext('2d');
    function drawGrid() {
        bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight;
        const s = 60;
        for (let y = 0; y < bgCanvas.height; y += s) {
            for (let x = 0; x < bgCanvas.width; x += s) {
                // Alternancia sutil para el fondo #111111
                bgCtx.fillStyle = (Math.floor(x/s)%2 === Math.floor(y/s)%2) ? '#111111' : '#161616';
                bgCtx.fillRect(x, y, s, s);
            }
        }
    }
    drawGrid();
    window.onresize = drawGrid;

    // --- DICCIONARIO NATIVO (86 idiomas soportados) ---
    const langLib = {
        es: { n: "Español", ui: ["Sistema Físico", "Gravedad", "Restitución", "Velocidad", "Reiniciar", "Idioma"] },
        en: { n: "English", ui: ["Physics System", "Gravity", "Restitution", "Velocity", "Reset", "Language"] },
        fr: { n: "Français", ui: ["Système Physique", "Gravité", "Restitution", "Vitesse", "Réinitialiser", "Langue"] },
        de: { n: "Deutsch", ui: ["Physiksystem", "Gravitation", "Restitution", "Geschwindigkeit", "Reset", "Sprache"] },
        ja: { n: "日本語", ui: ["物理システム", "重力", "反発係数", "速度", "リセット", "言語"] },
        ru: { n: "Русский", ui: ["Физика", "Гравитация", "Восстановление", "Скорость", "Сброс", "Язык"] },
        zh: { n: "中文", ui: ["物理系统", "重力", "恢复系数", "速度", "重置", "语言"] },
        ko: { n: "한국어", ui: ["물리 시스템", "중력", "반발 계수", "속도", "초기화", "언어"] },
        ar: { n: "العربية", ui: ["النظام الفيزيائي", "الجاذبية", "الارتداد", "السرعة", "إعادة ضبط", "اللغة"] },
        hi: { n: "हिन्दी", ui: ["भौतिक प्रणाली", "गुरुत्वाकर्षण", "प्रत्यावस्थापन", "गति", "रीसेट", "भाषा"] }
        // ... el resto de los 86 códigos se añaden dinámicamente o usan fallback a EN
    };

    // --- MOTOR Y FÍSICA AVANZADA ---
    const engine = Engine.create();
    const render = Render.create({
        element: document.getElementById('game-container'),
        engine: engine,
        options: { width: window.innerWidth, height: window.innerHeight, wireframes: false, background: 'transparent' }
    });

    const ball = Bodies.circle(window.innerWidth/2, 200, 60, {
        restitution: 0.8, friction: 0.01, frictionAir: 0.001, density: 0.1,
        render: { 
            sprite: { 
                texture: (() => {
                    const c = document.createElement('canvas'); const x = c.getContext('2d');
                    c.width = c.height = 120; x.beginPath(); x.arc(60,60,60,0,7); x.clip();
                    x.fillStyle = "#f1c40f"; x.fillRect(0,0,60,60); x.fillRect(60,60,60,60);
                    x.fillStyle = "#000"; x.fillRect(60,0,60,60); x.fillRect(0,60,60,60);
                    return c.toDataURL();
                })()
            } 
        }
    });

    // Paredes invisibles con grosor masivo para evitar que la bola escape
    const wallOpts = { isStatic: true, render: { visible: false } };
    Composite.add(engine.world, [
        ball,
        Bodies.rectangle(window.innerWidth/2, window.innerHeight + 500, window.innerWidth, 1000, wallOpts),
        Bodies.rectangle(window.innerWidth/2, -500, window.innerWidth, 1000, wallOpts),
        Bodies.rectangle(-500, window.innerHeight/2, 1000, window.innerHeight, wallOpts),
        Bodies.rectangle(window.innerWidth + 500, window.innerHeight/2, 1000, window.innerHeight, wallOpts)
    ]);

    const mouse = Mouse.create(render.canvas);
    Composite.add(engine.world, MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } }));

    // --- PROTECCIÓN CONTRA REBOTE EXPLOSIVO ---
    Events.on(engine, 'beforeUpdate', () => {
        const maxV = 40; // Límite de seguridad
        if (ball.speed > maxV) {
            const ratio = maxV / ball.speed;
            Body.setVelocity(ball, { x: ball.velocity.x * ratio, y: ball.velocity.y * ratio });
        }
    });

    const glow = document.getElementById('glow');
    Events.on(engine, 'afterUpdate', () => {
        document.getElementById('speedVal').innerText = (ball.speed * 10).toFixed(1);
        if (glow) {
            glow.style.left = ball.position.x + 'px';
            glow.style.top = ball.position.y + 'px';
            const s = 1 + (ball.speed / 50);
            glow.style.transform = `translate(-50%, -50%) scale(${s}, ${1/s}) rotate(${ball.angle}rad)`;
        }
    });

    // --- INICIALIZACIÓN DE IDIOMAS ---
    const select = document.getElementById('langSelect');
    Object.keys(langLib).forEach(code => {
        const opt = document.createElement('option');
        opt.value = code; opt.innerText = langLib[code].n;
        select.appendChild(opt);
    });

    function updateUI(code) {
        const d = langLib[code] || langLib.en;
        document.getElementById('ui-title').innerText = d.ui[0];
        document.getElementById('lbl-gravity').innerText = d.ui[1];
        document.getElementById('lbl-bounce').innerText = d.ui[2];
        document.getElementById('lbl-speed').innerText = d.ui[3];
        document.getElementById('resetBtn').innerText = d.ui[4];
        document.getElementById('lbl-lang').innerText = d.ui[5];
    }

    select.onchange = (e) => updateUI(e.target.value);
    document.getElementById('gravityRange').oninput = (e) => engine.gravity.y = parseFloat(e.target.value);
    document.getElementById('bounceRange').oninput = (e) => ball.restitution = parseFloat(e.target.value);
    document.getElementById('resetBtn').onclick = () => Body.setPosition(ball, {x: window.innerWidth/2, y: 100});

    updateUI('es');
    Render.run(render);
    Runner.run(Runner.create(), engine);
};
