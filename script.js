(function() {
    'use strict';

    const O5_CODE = 'TENTY_ULTIMATE_ACCESS';
    let contentData = null;
    let o5Granted = false;
    let breachLevel = 0;
    let audioCtx = null;
    let screamerCooldown = false;

    function getAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }

    // ========================
    // BOOT SEQUENCE
    // ========================
    const BOOT_LINES = [
        { text: '[  <span class="ok">OK</span>  ] Initializing SCP Foundation kernel 7.4.28...', delay: 400 },
        { text: '[  <span class="ok">OK</span>  ] Loading cryptographic modules...', delay: 300 },
        { text: '[  <span class="ok">OK</span>  ] Mounting secure filesystem /scp/...', delay: 500 },
        { text: '[  <span class="ok">OK</span>  ] Connecting to SITE-17 database...', delay: 600 },
        { text: '[  <span class="ok">OK</span>  ] Verifying clearance level 4/4228...', delay: 400 },
        { text: '[  <span class="ok">OK</span>  ] Loading containment protocols...', delay: 350 },
        { text: '[ <span class="warn">WARN</span> ] Anomalous EM signature detected in sector 7...', delay: 700 },
        { text: '[ <span class="warn">WARN</span> ] Object activity: ELEVATED (last 24h)...', delay: 500 },
        { text: '[  <span class="ok">OK</span>  ] Loading dossier: SCP-4228-RU...', delay: 400 },
        { text: '[  <span class="ok">OK</span>  ] Decrypting classified attachments...', delay: 600 },
        { text: '', delay: 300 },
        { text: '<span class="ok">&gt; ACCESS GRANTED — LEVEL 4/4228</span>', delay: 500 },
        { text: '<span class="dim">&gt; Launching terminal interface...</span>', delay: 800 },
    ];

    async function runBoot() {
        const log = document.getElementById('boot-log');
        const bar = document.getElementById('boot-bar');
        const total = BOOT_LINES.length;

        for (let i = 0; i < total; i++) {
            await sleep(BOOT_LINES[i].delay);
            const line = document.createElement('div');
            line.className = 'boot-line';
            line.innerHTML = BOOT_LINES[i].text;
            log.appendChild(line);
            bar.style.width = ((i + 1) / total * 100) + '%';
            log.scrollTop = log.scrollHeight;
            playBeep(800 + i * 50, 0.02, 0.02);
        }

        await sleep(600);
        document.getElementById('boot-screen').style.opacity = '0';
        document.getElementById('boot-screen').style.transition = 'opacity 0.8s';
        await sleep(800);
        document.getElementById('boot-screen').classList.add('hidden');
        document.getElementById('terminal').classList.remove('hidden');
        initTerminal();
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ========================
    // INIT TERMINAL
    // ========================
    function initTerminal() {
        loadContent();
        initClock();
        initScrollReveal();
        initO5Input();
        initBreachSystem();
        initAmbientSound();
        initNoiseCanvas();
        initIdleScreamer();
        initScrollScreamer();
        initInteractiveFeatures();
    }

    // ========================
    // LOAD CONTENT
    // ========================
    async function loadContent() {
        try {
            const resp = await fetch('data/content.json');
            contentData = await resp.json();
            renderContent();
        } catch(e) {
            document.getElementById('term-content').innerHTML =
                '<div class="term-section visible"><div class="term-output"><span class="t-danger">ERROR: Failed to load database.</span></div></div>';
        }
    }

    function renderContent() {
        const d = contentData;
        document.getElementById('obj-number').textContent = d.object_number;
        document.getElementById('obj-codename').textContent = d.codename;
        document.getElementById('obj-class').textContent = d.class.toUpperCase();
        document.getElementById('obj-class-note').textContent = '(' + d.class_note + ')';

        document.getElementById('obj-containment').innerHTML = formatText(d.containment);
        document.getElementById('obj-discovery').innerHTML = formatText(d.discovery);
        document.getElementById('obj-description').innerHTML = formatText(d.description);

        renderPhotos(d.photos);
        renderAbilities(d.abilities);
        renderPhobia(d.phobia, d.phobia_video_url);
        renderIncidents(d.incidents);
        renderNotes(d.notes);
    }

    function formatText(text) {
        if (!text) return '';
        let result = text;
        result = result.replace(/████████+/g, '<span class="redacted"><span class="redacted-bar">█████████</span></span>');
        result = result.replace(/████/g, '<span class="redacted"><span class="redacted-bar">████</span></span>');
        result = result.replace(/██/g, '<span class="redacted"><span class="redacted-bar">██</span></span>');
        result = result.replace(/\n/g, '<br>');
        return result;
    }

    function renderPhotos(photos) {
        const grid = document.getElementById('photo-grid');
        grid.innerHTML = '';
        (photos || []).forEach((photo, i) => {
            const item = document.createElement('div');
            item.className = 'photo-item';
            const img = photo.url
                ? `<img src="${photo.url}" alt="${photo.caption}">`
                : `<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:11px;padding:10px;">[NO DATA]</div>`;
            item.innerHTML = `<span class="photo-id">IMG_${String(i+1).padStart(3,'0')}</span>${img}<div class="photo-label">${photo.caption}</div>`;
            grid.appendChild(item);
        });
    }

    function renderAbilities(abilities) {
        const list = document.getElementById('abilities-list');
        list.innerHTML = '';
        (abilities || []).forEach((a, i) => {
            const item = document.createElement('div');
            item.className = 'ability-item';
            item.innerHTML = `<div class="ability-name">${i+1}. ${a.name}</div><div class="ability-text">${formatText(a.text)}</div>`;
            list.appendChild(item);
        });
    }

    function renderPhobia(text, videoUrl) {
        document.getElementById('phobia-text').innerHTML = formatText(text);
        const slot = document.getElementById('phobia-video');
        if (videoUrl) slot.innerHTML = `<iframe src="${videoUrl}" allowfullscreen></iframe>`;
    }

    function renderIncidents(incidents) {
        const list = document.getElementById('incidents-list');
        list.innerHTML = '';
        (incidents || []).forEach(inc => {
            const item = document.createElement('div');
            item.className = 'incident-item';
            let html = `<div class="incident-name">${inc.name}</div>`;
            if (inc.location) html += `<div class="incident-location">${inc.location}</div>`;
            html += `<div class="incident-text">${formatText(inc.text)}</div>`;
            item.innerHTML = html;
            list.appendChild(item);
        });
    }

    function renderNotes(notes) {
        const list = document.getElementById('notes-list');
        list.innerHTML = '';
        (notes || []).forEach(note => {
            const item = document.createElement('div');
            item.className = 'note-item' + (note.o5_only ? ' o5-note hidden' : '');
            if (note.o5_only) item.dataset.o5 = 'true';
            item.innerHTML = `<div class="note-author">${note.author}:</div><div class="note-text">"${note.text}"</div>`;
            list.appendChild(item);
        });
    }

    // ========================
    // CLOCK
    // ========================
    function initClock() {
        const el = document.getElementById('term-clock');
        function update() { el.textContent = new Date().toTimeString().slice(0, 8); }
        update();
        setInterval(update, 1000);
    }

    // ========================
    // SCROLL REVEAL (typewriter)
    // ========================
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('visible')) {
                    entry.target.classList.add('visible');
                    playBeep(600, 0.03, 0.05);
                    typewriteSection(entry.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.term-section').forEach(s => observer.observe(s));
    }

    function typewriteSection(section) {
        const prompt = section.querySelector('.term-prompt');
        if (!prompt) return;
        const text = prompt.textContent;
        prompt.textContent = '';
        prompt.style.visibility = 'visible';
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                prompt.textContent += text[i];
                i++;
                if (Math.random() < 0.3) playBeep(1200 + Math.random() * 500, 0.01, 0.01);
            } else {
                clearInterval(interval);
            }
        }, 25);
    }

    // ========================
    // O5 ACCESS
    // ========================
    function initO5Input() {
        const input = document.getElementById('o5-input');
        const status = document.getElementById('o5-status');

        input.addEventListener('keydown', (e) => {
            playBeep(900 + Math.random() * 200, 0.015, 0.015);
            if (e.key === 'Enter') {
                if (input.value.trim() === O5_CODE) {
                    status.textContent = '✓ ACCESS GRANTED — O5 CLEARANCE CONFIRMED';
                    status.className = 'o5-status granted';
                    grantO5();
                } else {
                    status.textContent = '✗ ACCESS DENIED — INVALID CREDENTIALS';
                    status.className = 'o5-status denied';
                    playDenied();
                    setTimeout(() => { status.textContent = ''; status.className = 'o5-status'; }, 3000);
                }
            }
        });
    }

    function grantO5() {
        if (o5Granted) return;
        o5Granted = true;
        playGranted();
        document.body.classList.add('o5-mode');
        breachLevel = 0;
        updateBreachUI();

        const classified = document.getElementById('phobia-classified');
        const revealed = document.getElementById('phobia-revealed');
        if (classified) classified.classList.add('hidden');
        if (revealed) revealed.classList.remove('hidden');

        document.querySelectorAll('[data-o5]').forEach(el => el.classList.remove('hidden'));

        if (contentData.containment_revealed)
            document.getElementById('obj-containment').innerHTML = contentData.containment_revealed.replace(/\n/g, '<br>');
        if (contentData.discovery_revealed)
            document.getElementById('obj-discovery').innerHTML = contentData.discovery_revealed.replace(/\n/g, '<br>');
        if (contentData.description_revealed)
            document.getElementById('obj-description').innerHTML = contentData.description_revealed.replace(/\n/g, '<br>');
        if (contentData.phobia_revealed)
            document.getElementById('phobia-text').innerHTML = contentData.phobia_revealed.replace(/\n/g, '<br>');

        document.querySelectorAll('.ability-item').forEach((item, i) => {
            if (contentData.abilities[i] && contentData.abilities[i].text_revealed)
                item.querySelector('.ability-text').innerHTML = contentData.abilities[i].text_revealed.replace(/\n/g, '<br>');
        });
        document.querySelectorAll('.incident-item').forEach((item, i) => {
            if (contentData.incidents[i] && contentData.incidents[i].text_revealed)
                item.querySelector('.incident-text').innerHTML = contentData.incidents[i].text_revealed.replace(/\n/g, '<br>');
        });

        document.getElementById('term-status').textContent = '● O5 MODE';
        document.getElementById('term-status').style.color = 'var(--blue)';
    }

    // ========================
    // BREACH SYSTEM (мягкий, без глитчей)
    // ========================
    function initBreachSystem() {
        window.addEventListener('scroll', () => {
            const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollMax > 0 && !o5Granted) {
                breachLevel = Math.min(1, window.scrollY / scrollMax);
                updateBreachUI();
            }
        });
    }

    function updateBreachUI() {
        const pct = Math.round(breachLevel * 100);
        const el = document.getElementById('breach-level');
        el.textContent = pct + '%';

        if (breachLevel < 0.3) { el.className = 't-green'; }
        else if (breachLevel < 0.6) { el.className = 't-warn'; }
        else { el.className = 't-danger'; }

        const status = document.getElementById('term-status');
        if (o5Granted) return;
        if (breachLevel < 0.3) {
            status.textContent = '● STABLE';
            status.style.color = 'var(--green)';
        } else if (breachLevel < 0.6) {
            status.textContent = '● ELEVATED';
            status.style.color = 'var(--yellow)';
        } else if (breachLevel < 0.85) {
            status.textContent = '● WARNING';
            status.style.color = 'var(--red)';
        } else {
            status.textContent = '● CRITICAL';
            status.style.color = 'var(--red)';
        }

        // Noise canvas opacity — subtle
        const noise = document.getElementById('noise-canvas');
        noise.style.opacity = breachLevel > 0.6 ? ((breachLevel - 0.6) * 0.15) : 0;
    }

    // ========================
    // NOISE CANVAS (subtle static)
    // ========================
    function initNoiseCanvas() {
        const canvas = document.getElementById('noise-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        function draw() {
            const img = ctx.createImageData(128, 128);
            for (let i = 0; i < img.data.length; i += 4) {
                const v = Math.random() * 255;
                img.data[i] = img.data[i+1] = img.data[i+2] = v;
                img.data[i+3] = 10;
            }
            ctx.putImageData(img, 0, 0);
            requestAnimationFrame(draw);
        }
        draw();
    }

    // ========================
    // INTERACTIVE FEATURES (6 new)
    // ========================
    function initInteractiveFeatures() {
        initCommandLine();
        initDecryptOnClick();
        initLiveRadar();
        initMorseCode();
        initDragClassified();
        initMatrixRain();
    }

    // --- 1. COMMAND LINE: пользователь может вводить команды ---
    function initCommandLine() {
        const section = document.createElement('section');
        section.className = 'term-section visible';
        section.innerHTML = `
            <div class="term-output cmd-terminal">
                <div class="section-label">[ ИНТЕРАКТИВНЫЙ ТЕРМИНАЛ ]</div>
                <div class="cmd-history" id="cmd-history"></div>
                <div class="cmd-input-row">
                    <span class="t-green">user@site17:~$</span>
                    <input type="text" id="cmd-input" class="cmd-input" autocomplete="off" spellcheck="false" placeholder="введите команду...">
                </div>
            </div>
        `;
        document.getElementById('term-content').appendChild(section);

        const input = document.getElementById('cmd-input');
        const history = document.getElementById('cmd-history');
        const commands = {
            'help': () => 'Доступные команды: help, status, ping, scan, whereami, joke, clear, breach, time',
            'status': () => `Объект: ${contentData ? contentData.object_number : 'N/A'}\nСтатус: CONTAINED\nBreach level: ${Math.round(breachLevel*100)}%\nO5 Mode: ${o5Granted ? 'ACTIVE' : 'INACTIVE'}`,
            'ping': () => { playBeep(1000, 0.05, 0.05); return 'PONG! Latency: ' + (Math.random()*50+5).toFixed(1) + 'ms'; },
            'scan': () => 'Scanning sector 7...\n████████████████████ 100%\nAnomalous signatures: 1 detected\nThreat level: BLACK',
            'whereami': () => 'Location: SITE-17\nCoordinates: 68°N 73°E\nDepth: -47m (underground)\nTemp: -12°C (external)',
            'joke': () => 'Почему SCP-173 не моргает?\n\n...Потому что это ВЫ не должны моргать.',
            'clear': () => { history.innerHTML = ''; return ''; },
            'breach': () => { breachLevel = Math.min(1, breachLevel + 0.2); updateBreachUI(); return '⚠ BREACH LEVEL INCREASED TO ' + Math.round(breachLevel*100) + '%'; },
            'time': () => new Date().toLocaleString('ru-RU'),
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim().toLowerCase();
                input.value = '';
                if (!cmd) return;

                const line = document.createElement('div');
                line.className = 'cmd-line';
                line.innerHTML = `<span class="t-green">user@site17:~$</span> ${cmd}`;
                history.appendChild(line);

                const result = commands[cmd] ? commands[cmd]() : `bash: ${cmd}: command not found`;
                if (result) {
                    const out = document.createElement('div');
                    out.className = 'cmd-result';
                    out.innerHTML = result.replace(/\n/g, '<br>');
                    history.appendChild(out);
                }
                history.scrollTop = history.scrollHeight;
                playBeep(600, 0.02, 0.03);
            }
        });
    }

    // --- 2. DECRYPT ON CLICK: кликай на ████ чтобы "расшифровать" ---
    function initDecryptOnClick() {
        document.addEventListener('click', (e) => {
            const bar = e.target.closest('.redacted-bar');
            if (!bar) return;
            if (o5Granted) return;

            bar.style.transition = 'all 0.5s';
            bar.style.background = 'var(--red)';
            bar.style.color = 'var(--red)';
            bar.textContent = '[ОТКАЗАНО]';
            playDenied();

            setTimeout(() => {
                bar.style.background = '';
                bar.style.color = '';
                bar.textContent = '████████';
            }, 2000);
        });
    }

    // --- 3. LIVE RADAR: анимированный радар в углу ---
    function initLiveRadar() {
        const radar = document.createElement('div');
        radar.className = 'radar-widget';
        radar.innerHTML = `
            <canvas id="radar-canvas" width="100" height="100"></canvas>
            <div class="radar-label">SECTOR SCAN</div>
        `;
        document.getElementById('terminal').appendChild(radar);

        const canvas = document.getElementById('radar-canvas');
        const ctx = canvas.getContext('2d');
        let angle = 0;
        let blips = [{x:65, y:35, age:0}, {x:30, y:70, age:0}];

        function drawRadar() {
            ctx.fillStyle = 'rgba(0, 10, 0, 0.15)';
            ctx.fillRect(0, 0, 100, 100);

            // Grid
            ctx.strokeStyle = 'rgba(0, 255, 65, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(50, 50, 20, 0, Math.PI*2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(50, 50, 40, 0, Math.PI*2);
            ctx.stroke();

            // Sweep
            ctx.strokeStyle = 'rgba(0, 255, 65, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(50, 50);
            ctx.lineTo(50 + Math.cos(angle) * 45, 50 + Math.sin(angle) * 45);
            ctx.stroke();

            // Blips
            blips.forEach(b => {
                b.age++;
                if (b.age > 120) { b.x = Math.random()*80+10; b.y = Math.random()*80+10; b.age = 0; }
                const alpha = Math.max(0, 1 - b.age/120);
                ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
                ctx.beginPath();
                ctx.arc(b.x, b.y, 2, 0, Math.PI*2);
                ctx.fill();
            });

            angle += 0.03;
            requestAnimationFrame(drawRadar);
        }
        drawRadar();
    }

    // --- 4. MORSE CODE: объект стучит в стену (интерактивная расшифровка) ---
    function initMorseCode() {
        const morseWidget = document.createElement('div');
        morseWidget.className = 'morse-widget';
        morseWidget.innerHTML = `
            <div class="morse-header">AUDIO INTERCEPT — CELL #4228</div>
            <div class="morse-display" id="morse-display">...</div>
            <div class="morse-decoded" id="morse-decoded"></div>
            <button class="morse-btn" id="morse-btn">▶ ВОСПРОИЗВЕСТИ</button>
        `;
        document.getElementById('terminal').appendChild(morseWidget);

        const messages = ['ВЫПУСТИТЕ', 'Я СЛЫШУ ВАС', 'МНЕ ХОЛОДНО', 'МАМА', 'ОТКРОЙТЕ'];
        const morseAlphabet = {
            'А':'.-','Б':'-...','В':'.--','Г':'--.','Д':'-..','Е':'.','Ж':'...-','З':'--..','И':'..','Й':'.---',
            'К':'-.-','Л':'.-..','М':'--','Н':'-.','О':'---','П':'.--.','Р':'.-.','С':'...','Т':'-','У':'..-',
            'Ф':'..-.','Х':'....','Ц':'-.-.','Ч':'---.','Ш':'----','Щ':'--.-','Ъ':'--.--','Ы':'-.--','Ь':'-..-',
            'Э':'..-..','Ю':'..--','Я':'.-.-',' ':' '
        };

        let playing = false;
        document.getElementById('morse-btn').addEventListener('click', async () => {
            if (playing) return;
            playing = true;
            const msg = messages[Math.floor(Math.random() * messages.length)];
            const display = document.getElementById('morse-display');
            const decoded = document.getElementById('morse-decoded');
            decoded.textContent = '';
            display.textContent = '';

            for (let ch of msg) {
                const code = morseAlphabet[ch.toUpperCase()] || '';
                if (ch === ' ') { await sleep(400); display.textContent += '  '; decoded.textContent += ' '; continue; }
                for (let symbol of code) {
                    display.textContent += symbol;
                    if (symbol === '.') { playBeep(800, 0.1, 0.08); await sleep(120); }
                    else { playBeep(800, 0.1, 0.2); await sleep(250); }
                    await sleep(80);
                }
                decoded.textContent += ch;
                display.textContent += ' ';
                await sleep(200);
            }
            playing = false;
        });
    }

    // --- 5. DRAG TO REVEAL: тащи "classified tape" чтобы открыть ---
    function initDragClassified() {
        const classified = document.getElementById('phobia-classified');
        if (!classified) return;

        let startX = 0, dragOffset = 0, isDragging = false;

        classified.style.cursor = 'grab';
        classified.title = 'Потяните вправо чтобы попробовать открыть';

        classified.addEventListener('mousedown', (e) => {
            if (o5Granted) return;
            isDragging = true;
            startX = e.clientX;
            classified.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            dragOffset = Math.max(0, e.clientX - startX);
            classified.style.transform = `translateX(${Math.min(dragOffset, 100)}px)`;
            classified.style.opacity = 1 - Math.min(dragOffset / 300, 0.7);
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            classified.style.cursor = 'grab';

            if (dragOffset > 200) {
                classified.style.transition = 'all 0.3s';
                classified.style.transform = 'translateX(500px)';
                classified.style.opacity = '0';
                playDenied();
                setTimeout(() => {
                    classified.style.transform = '';
                    classified.style.opacity = '1';
                    classified.style.transition = '';
                    const warn = document.createElement('div');
                    warn.className = 'cmd-result';
                    warn.style.color = 'var(--red)';
                    warn.textContent = '⚠ UNAUTHORIZED ACCESS ATTEMPT LOGGED. Report filed.';
                    classified.parentElement.insertBefore(warn, classified);
                    setTimeout(() => warn.remove(), 3000);
                }, 500);
            } else {
                classified.style.transform = '';
                classified.style.opacity = '';
            }
            dragOffset = 0;
        });
    }

    // --- 6. MATRIX RAIN: фоновый эффект "падающих символов" ---
    function initMatrixRain() {
        const canvas = document.createElement('canvas');
        canvas.className = 'matrix-canvas';
        canvas.id = 'matrix-canvas';
        document.getElementById('terminal').appendChild(canvas);

        const ctx = canvas.getContext('2d');
        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);

        const chars = 'SCP0123456789КЕТЕРБЕЗОПАСНОЕВВЕДИТЕКОДДОСТУП';
        const fontSize = 12;
        let columns = Math.floor(canvas.width / fontSize);
        let drops = Array(columns).fill(1);

        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 255, 65, 0.12)';
            ctx.font = fontSize + 'px ' + 'Share Tech Mono';

            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(char, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.97) drops[i] = 0;
                drops[i]++;
            }
            requestAnimationFrame(draw);
        }
        draw();

        window.addEventListener('resize', () => {
            columns = Math.floor(canvas.width / fontSize);
            drops = Array(columns).fill(1);
        });
    }

    // ========================
    // SCREAMERS
    // ========================
    function initIdleScreamer() {
        let timer;
        function reset() {
            clearTimeout(timer);
            timer = setTimeout(() => { if (!o5Granted) triggerScreamer(); }, 90000);
        }
        ['mousemove','keydown','scroll','touchstart'].forEach(e => document.addEventListener(e, reset));
        reset();
    }

    function initScrollScreamer() {
        let lastY = 0, lastT = 0;
        window.addEventListener('scroll', () => {
            const now = Date.now();
            const diff = Math.abs(window.scrollY - lastY);
            const dt = now - lastT;
            if (dt > 0 && dt < 150 && diff > 900 && Math.random() > 0.65) triggerScreamer();
            lastY = window.scrollY;
            lastT = now;
        });
    }

    function triggerScreamer() {
        if (screamerCooldown || o5Granted) return;
        screamerCooldown = true;
        const el = document.getElementById('screamer');
        el.innerHTML = '<div class="screamer-face"></div>';
        el.classList.remove('hidden');
        playScreamerSound();
        setTimeout(() => { el.classList.add('hidden'); el.innerHTML = ''; }, 400);
        setTimeout(() => { screamerCooldown = false; }, 60000);
    }

    // ========================
    // SOUNDS
    // ========================
    function initAmbientSound() {
        document.addEventListener('click', function start() {
            document.removeEventListener('click', start);
            try {
                const ctx = getAudio();
                const osc = ctx.createOscillator();
                const filter = ctx.createBiquadFilter();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = 60;
                filter.type = 'lowpass';
                filter.frequency.value = 100;
                gain.gain.value = 0.005;
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                osc.start();

                setInterval(() => playBeep(2000, 0.006, 0.01), 1000);
            } catch(e) {}
        }, { once: true });
    }

    function playBeep(freq, vol, dur) {
        try {
            const ctx = getAudio();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.value = vol;
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + dur);
        } catch(e) {}
    }

    function playGranted() {
        try {
            const ctx = getAudio();
            [400, 600, 800, 1000].forEach((f, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.value = f;
                gain.gain.value = 0.08;
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2 + i * 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.08);
                osc.stop(ctx.currentTime + 0.2 + i * 0.08);
            });
        } catch(e) {}
    }

    function playDenied() {
        try {
            const ctx = getAudio();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 120;
            gain.gain.value = 0.12;
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch(e) {}
    }

    function playScreamerSound() {
        try {
            const ctx = getAudio();
            const osc = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc2.type = 'square';
            osc.frequency.value = 200;
            osc.frequency.linearRampToValueAtTime(3000, ctx.currentTime + 0.1);
            osc2.frequency.value = 100;
            osc2.frequency.linearRampToValueAtTime(1500, ctx.currentTime + 0.15);
            gain.gain.value = 0.3;
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc2.start();
            osc.stop(ctx.currentTime + 0.35);
            osc2.stop(ctx.currentTime + 0.35);
        } catch(e) {}
    }

    // ========================
    // START
    // ========================
    runBoot();

})();
