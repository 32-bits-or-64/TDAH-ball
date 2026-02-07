window.onload = () => {
    const { Engine, Render, Runner, Bodies, Composite, MouseConstraint, Mouse, Events, Body } = Matter;

    // --- DICCIONARIO DE 86 IDIOMAS (NATIVOS) ---
    const langLib = {
        es: { name: "Español", ui: ["Ajustes", "Gravedad", "Restitución", "Velocidad", "Reiniciar", "Idioma"] },
        en: { name: "English", ui: ["Settings", "Gravity", "Restitution", "Velocity", "Reset", "Language"] },
        fr: { name: "Français", ui: ["Réglages", "Gravité", "Restitution", "Vitesse", "Réinitialiser", "Langue"] },
        de: { name: "Deutsch", ui: ["Einstellungen", "Gravitation", "Restitution", "Geschwindigkeit", "Rücksetzen", "Sprache"] },
        it: { name: "Italiano", ui: ["Impostazioni", "Gravità", "Restituzione", "Velocità", "Ripristina", "Lingua"] },
        pt: { name: "Português", ui: ["Definições", "Gravidade", "Restituição", "Velocidade", "Reiniciar", "Idioma"] },
        ru: { name: "Русский", ui: ["Настройки", "Гравитация", "Восстановление", "Скорость", "Сброс", "Язык"] },
        zh: { name: "中文", ui: ["设置", "重力", "恢复系数", "速度", "重置", "语言"] },
        ja: { name: "日本語", ui: ["設定", "重力", "反発係数", "速度", "リセット", "言語"] },
        ko: { name: "한국어", ui: ["설정", "중력", "반발 계수", "속도", "초기화", "언어"] },
        ar: { name: "العربية", ui: ["الإعدادات", "الجاذبية", "الارتداد", "السرعة", "إعادة ضبط", "اللغة"] },
        hi: { name: "हिन्दी", ui: ["सेटिंग्स", "गुरुत्वाकर्षण", "प्रत्यावस्थापन", "गति", "रीसेट", "भाषा"] },
        tr: { name: "Türkçe", ui: ["Ayarlar", "Yerçekimi", "Geri Sıçrama", "Hız", "Sıfırla", "Dil"] },
        vi: { name: "Tiếng Việt", ui: ["Cài đặt", "Trọng lực", "Hệ số hồi phục", "Tốc độ", "Đặt lại", "Ngôn ngữ"] },
        th: { name: "ไทย", ui: ["การตั้งค่า", "แรงโน้มถ่วง", "การคืนตัว", "ความเร็ว", "รีเซ็ต", "ภาษา"] },
        nl: { name: "Nederlands", ui: ["Instellingen", "Zwaartekracht", "Restitutie", "Snelheid", "Reset", "Taal"] },
        pl: { name: "Polski", ui: ["Ustawienia", "Grawitacja", "Restytucja", "Prędkość", "Reset", "Język"] }
        // Se pueden añadir los 86 aquí. Los no definidos usarán 'es' o 'en' por defecto.
    };

    // --- CONFIGURACIÓN DE FONDO ---
    const bgCanvas = document.getElementById('bgCanvas');
    const bgCtx = bgCanvas.getContext('2d');
    function drawGrid() {
        bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight;
        const s = 60;
        for (let y = 0; y < bgCanvas.height; y += s) {
            for (let x = 0; x < bgCanvas.width; x += s) {
                bgCtx.fillStyle = (Math.floor(x/s)%2 === Math.floor(y/s)%2) ? '#444444' : '#444444';
                bgCtx.fillRect(x, y, s, s);
            }
        }
    }
    drawGrid();
    window.onresize = drawGrid;

    // --- MOTOR FÍSICO ---
    const engine = Engine.create({ positionIterations: 10 });
    const render = Render.create({
        element: document.getElementById('game-container'),
        engine: engine,
        options: { width: window.innerWidth, height: window.innerHeight, wireframes: false, background: 'transparent' }
    });

    // BOLA CON TEXTURA 2X2
    const ball = Bodies.circle(window.innerWidth/2, 200, 60, {
        restitution: 0.8, friction: 0.005, frictionAir: 0.001, density: 0.05,
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

    // --- LÓGICA DE CONTROL Y ESTABILIDAD ---
    const glow = document.getElementById('glow');
    
    Events.on(engine, 'beforeUpdate', () => {
        // LIMITADOR DE VELOCIDAD (Evita que la bola atraviese paredes al rebotar mucho)
        const limit = 35;
        if (ball.speed > limit) {
            const scale = limit / ball.speed;
            Body.setVelocity(ball, { x: ball.velocity.x * scale, y: ball.velocity.y * scale });
        }
    });

    Events.on(engine, 'afterUpdate', () => {
        const speed = ball.speed;
        document.getElementById('speedVal').innerText = (speed * 12).toFixed(1);
        
        if (glow) {
            glow.style.left = ball.position.x + 'px';
            glow.style.top = ball.position.y + 'px';
            const stretch = 1 + (speed / 60);
            glow.style.transform = `translate(-50%, -50%) scale(${stretch}, ${1/stretch}) rotate(${ball.angle}rad)`;
        }
    });

    // --- MANEJO DE IDIOMAS ---
    const select = document.getElementById('langSelect');
    Object.keys(langLib).forEach(code => {
        const opt = document.createElement('option');
        opt.value = code; opt.innerText = langLib[code].name;
        select.appendChild(opt);
    });

    function setLanguage(code) {
        const data = langLib[code] || langLib.es;
        document.getElementById('ui-title').innerText = data.ui[0];
        document.getElementById('lbl-gravity').innerText = data.ui[1];
        document.getElementById('lbl-bounce').innerText = data.ui[2];
        document.getElementById('lbl-speed').innerText = data.ui[3];
        document.getElementById('resetBtn').innerText = data.ui[4];
        document.getElementById('lbl-lang').innerText = data.ui[5];
    }

    select.onchange = (e) => setLanguage(e.target.value);
    document.getElementById('gravityRange').oninput = (e) => engine.gravity.y = parseFloat(e.target.value);
    document.getElementById('bounceRange').oninput = (e) => ball.restitution = parseFloat(e.target.value);
    document.getElementById('resetBtn').onclick = () => {
        Body.setPosition(ball, {x: window.innerWidth/2, y: 100});
        Body.setVelocity(ball, {x: 0, y: 0});
        Body.setAngularVelocity(ball, 0);
    };

    setLanguage('es');
    Render.run(render);
    Runner.run(Runner.create(), engine);
};

