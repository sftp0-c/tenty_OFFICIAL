(function() {
    'use strict';

    const O5_CODE = 'TENTY_ULTIMATE_ACCESS';
    let contentData = null;
    let o5Granted = false;
    let breachLevel = 0;
    let audioCtx = null;
    let screamerCooldown = false;
    let ambientNodes = {};

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

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

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
                '<div class="term-section visible"><div class="term-output"><span class="t-danger">ERROR: Failed to load database. Connection refused.</span></div></div>';
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
                : `<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:11px;padding:10px;">[NO IMAGE DATA]</div>`;
            item.innerHTML = `<span class="photo-id">IMG_${String(i+1).padStart(3,'0')}</span>${img}<div class="photo-label">${photo.caption}</div>`;
            item.addEventListener('mouseenter', () => photoGlitch(item));
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
        if (videoUrl) {
            slot.innerHTML = `<iframe src="${videoUrl}" allowfullscreen></iframe>`;
        }
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
    // SCROLL REVEAL
    // ========================
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    playBeep(600, 0.03, 0.05);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.term-section').forEach(s => observer.observe(s));
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

        // Reset breach
        breachLevel = 0;
        updateBreachVisuals();

        // Reveal phobia
        const classified = document.getElementById('phobia-classified');
        const revealed = document.getElementById('phobia-revealed');
        if (classified) classified.classList.add('hidden');
        if (revealed) revealed.classList.remove('hidden');

        // Reveal O5 notes
        document.querySelectorAll('[data-o5]').forEach(el => el.classList.remove('hidden'));

        // Replace text with revealed versions
        if (contentData.containment_revealed) {
            document.getElementById('obj-containment').innerHTML = contentData.containment_revealed.replace(/\n/g, '<br>');
        }
        if (contentData.discovery_revealed) {
            document.getElementById('obj-discovery').innerHTML = contentData.discovery_revealed.replace(/\n/g, '<br>');
        }
        if (contentData.description_revealed) {
            document.getElementById('obj-description').innerHTML = contentData.description_revealed.replace(/\n/g, '<br>');
        }
        if (contentData.phobia_revealed) {
            document.getElementById('phobia-text').innerHTML = contentData.phobia_revealed.replace(/\n/g, '<br>');
        }

        // Replace abilities
        document.querySelectorAll('.ability-item').forEach((item, i) => {
            if (contentData.abilities[i] && contentData.abilities[i].text_revealed) {
                item.querySelector('.ability-text').innerHTML = contentData.abilities[i].text_revealed.replace(/\n/g, '<br>');
            }
        });

        // Replace incidents
        document.querySelectorAll('.incident-item').forEach((item, i) => {
            if (contentData.incidents[i] && contentData.incidents[i].text_revealed) {
                item.querySelector('.incident-text').innerHTML = contentData.incidents[i].text_revealed.replace(/\n/g, '<br>');
            }
        });

        // Update status
        document.getElementById('term-status').textContent = '● O5 MODE';
        document.getElementById('term-status').style.color = 'var(--blue)';
    }

    // ========================
    // BREACH SYSTEM
    // ========================
    function initBreachSystem() {
        window.addEventListener('scroll', () => {
            const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollMax > 0 && !o5Granted) {
                breachLevel = Math.min(1, window.scrollY / scrollMax);
                updateBreachVisuals();
            }
        });

        setInterval(() => {
            if (breachLevel > 0.3 && !o5Granted) triggerRandomGlitch();
        }, 3000);
    }

    function updateBreachVisuals() {
        const pct = Math.round(breachLevel * 100);
        const el = document.getElementById('breach-level');
        el.textContent = pct + '%';

        if (breachLevel < 0.3) {
            el.className = 't-green';
            el.style.color = '';
        } else if (breachLevel < 0.6) {
            el.className = 't-warn';
            el.style.color = '';
        } else {
            el.className = 't-danger';
            el.style.color = '';
        }

        // Status
        const status = document.getElementById('term-status');
        if (o5Granted) return;
        if (breachLevel < 0.3) {
            status.textContent = '● STABLE';
            status.className = 'term-status';
        } else if (breachLevel < 0.6) {
            status.textContent = '● UNSTABLE';
            status.className = 'term-status';
            status.style.color = 'var(--yellow)';
        } else if (breachLevel < 0.8) {
            status.textContent = '● WARNING';
            status.className = 'term-status';
            status.style.color = 'var(--red)';
        } else {
            status.textContent = '● CRITICAL';
            status.className = 'term-status breach';
        }

        // Noise canvas
        const noise = document.getElementById('noise-canvas');
        noise.style.opacity = breachLevel > 0.5 ? (breachLevel - 0.5) * 0.3 : 0;

        // Cracks
        const cracks = document.getElementById('crack-overlay');
        if (breachLevel > 0.7) {
            cracks.classList.remove('hidden');
            const lines = cracks.querySelectorAll('.crack-line');
            const numActive = Math.floor((breachLevel - 0.7) / 0.06);
            lines.forEach((l, i) => {
                if (i < numActive) l.classList.add('active');
            });
        }

        // Breach warnings
        const overlay = document.getElementById('breach-overlay');
        const warnings = document.getElementById('breach-warnings');
        if (breachLevel > 0.85 && !o5Granted) {
            overlay.classList.remove('hidden');
            if (!warnings.children.length) {
                warnings.innerHTML = '<div class="breach-alert">⚠ CONTAINMENT BREACH ⚠</div>';
            }
        } else {
            overlay.classList.add('hidden');
            warnings.innerHTML = '';
        }

        // Shake
        if (breachLevel > 0.7) {
            document.getElementById('term-content').classList.add('shake');
        } else {
            document.getElementById('term-content').classList.remove('shake');
        }

        // Chromatic
        if (breachLevel > 0.6) {
            document.querySelector('.term-content').classList.add('chromatic');
        } else {
            document.querySelector('.term-content').classList.remove('chromatic');
        }
    }

    function triggerRandomGlitch() {
        if (o5Granted) return;
        const intensity = breachLevel;

        if (Math.random() < intensity * 0.5) {
            // Visual glitch
            const content = document.getElementById('term-content');
            content.style.transform = `translateX(${(Math.random()-0.5) * intensity * 10}px)`;
            content.style.filter = `hue-rotate(${Math.random() * 30}deg)`;
            playStatic(0.05 + intensity * 0.1, 0.1);
            setTimeout(() => {
                content.style.transform = '';
                content.style.filter = '';
            }, 80 + Math.random() * 120);
        }

        if (Math.random() < intensity * 0.3 && intensity > 0.5) {
            // Flash red
            document.body.style.background = 'rgba(40, 0, 0, 1)';
            setTimeout(() => { document.body.style.background = ''; }, 60);
        }
    }

    // ========================
    // NOISE CANVAS
    // ========================
    function initNoiseCanvas() {
        const canvas = document.getElementById('noise-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;

        function drawNoise() {
            const imageData = ctx.createImageData(256, 256);
            for (let i = 0; i < imageData.data.length; i += 4) {
                const v = Math.random() * 255;
                imageData.data[i] = v;
                imageData.data[i+1] = v;
                imageData.data[i+2] = v;
                imageData.data[i+3] = 20;
            }
            ctx.putImageData(imageData, 0, 0);
            requestAnimationFrame(drawNoise);
        }
        drawNoise();
    }

    // ========================
    // PHOTO GLITCH
    // ========================
    function photoGlitch(item) {
        if (Math.random() < 0.15) {
            const img = item.querySelector('img');
            if (!img) return;
            img.style.filter = 'invert(1) hue-rotate(180deg) contrast(2)';
            playStatic(0.04, 0.08);
            setTimeout(() => { img.style.filter = ''; }, 150);
        }
    }

    // ========================
    // SCREAMERS
    // ========================
    function initIdleScreamer() {
        let timer;
        function reset() {
            clearTimeout(timer);
            timer = setTimeout(() => {
                if (!o5Granted) triggerScreamer();
            }, 90000);
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
            if (dt > 0 && dt < 150 && diff > 800 && Math.random() > 0.6) {
                triggerScreamer();
            }
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
                // CRT hum
                const osc = ctx.createOscillator();
                const filter = ctx.createBiquadFilter();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = 60;
                filter.type = 'lowpass';
                filter.frequency.value = 100;
                gain.gain.value = 0.006;
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                ambientNodes.hum = { osc, gain };

                // Ticking
                setInterval(() => {
                    playBeep(2000, 0.008, 0.012);
                }, 1000);
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

    function playStatic(vol, dur) {
        try {
            const ctx = getAudio();
            const bufferSize = ctx.sampleRate * dur;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * vol;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.value = 1;
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start();
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
            gain.gain.value = 0.15;
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
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
