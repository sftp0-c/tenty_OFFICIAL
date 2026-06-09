(function() {
    'use strict';

    const O5_CODE = 'TENTY_ULTIMATE_ACCESS';
    let contentData = null;
    let o5Granted = false;
    let idleTimer = null;
    let screamerCooldown = false;
    let audioCtx = null;

    function getAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }

    // ========================
    // COVER / FOLDER
    // ========================
    document.getElementById('folder').addEventListener('click', openFolder);

    function openFolder() {
        const cover = document.getElementById('cover-screen');
        const folder = document.getElementById('folder');

        playPaperSound();
        folder.style.transform = 'scale(1.05) rotate(-1deg)';
        folder.style.opacity = '0';
        folder.style.transition = 'all 0.8s ease';

        setTimeout(() => {
            cover.style.opacity = '0';
            cover.style.transition = 'opacity 0.6s';
            setTimeout(() => {
                cover.style.display = 'none';
                document.getElementById('document-container').classList.remove('hidden');
                initDocument();
            }, 600);
        }, 500);
    }

    function playPaperSound() {
        try {
            const ctx = getAudio();
            const dur = 0.4;
            const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                const t = i / ctx.sampleRate;
                data[i] = (Math.random() - 0.5) * Math.exp(-t / 0.08) * 0.4;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3000;
            filter.Q.value = 0.5;
            const gain = ctx.createGain();
            gain.gain.value = 0.2;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start();
        } catch(e) {}
    }

    // ========================
    // INIT DOCUMENT
    // ========================
    function initDocument() {
        loadContent();
        initGSAP();
        initO5Terminal();
        initScreamers();
        initLampFlicker();
        initAmbientSound();
        initTypingSound();
        initHoverSounds();
        initHeartbeat();
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
            document.querySelector('.document').innerHTML = '<p style="color:red;padding:40px;font-family:monospace;">[ ОШИБКА ЗАГРУЗКИ БАЗЫ ДАННЫХ ]<br>Обновите страницу (Ctrl+Shift+R)</p>';
        }
    }

    function renderContent() {
        const d = contentData;

        document.getElementById('obj-number').textContent = d.object_number;
        typewriterEffect(document.getElementById('obj-codename'), d.codename);
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
        let result = text;
        // Replace long censored blocks
        result = result.replace(/████████+/g, (m) =>
            `<span class="redacted"><span class="redacted-bar"></span><span class="redacted-text">ЗАСЕКРЕЧЕНО</span></span>`
        );
        // Replace medium blocks
        result = result.replace(/████/g,
            `<span class="redacted"><span class="redacted-bar"></span><span class="redacted-text">УДАЛЕНО</span></span>`
        );
        // Replace short blocks
        result = result.replace(/██/g,
            `<span class="redacted"><span class="redacted-bar"></span><span class="redacted-text">--</span></span>`
        );
        result = result.replace(/\n/g, '<br>');
        return result;
    }

    function formatRevealed(text) {
        return text.replace(/\n/g, '<br>');
    }

    // ========================
    // TYPEWRITER
    // ========================
    function typewriterEffect(el, text) {
        el.textContent = '';
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                el.textContent += text[i];
                i++;
                playKeyClick();
            } else {
                clearInterval(interval);
            }
        }, 80);
    }

    function playKeyClick() {
        try {
            const ctx = getAudio();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 800 + Math.random() * 400;
            gain.gain.value = 0.02;
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.02);
        } catch(e) {}
    }

    // ========================
    // RENDER FUNCTIONS
    // ========================
    function renderPhotos(photos) {
        const grid = document.getElementById('photo-grid');
        grid.innerHTML = '';
        photos.forEach((photo, i) => {
            const polaroid = document.createElement('div');
            polaroid.className = 'polaroid';

            let imageHtml;
            if (photo.url) {
                imageHtml = `<div class="polaroid-image"><img src="${photo.url}" alt="${photo.caption}"></div>`;
            } else {
                imageHtml = `<div class="polaroid-image">[ФОТО №${photo.id}]</div>`;
            }

            const tapeOrClip = i % 2 === 0
                ? '<div class="polaroid-tape"></div>'
                : '<div class="polaroid-clip"></div>';

            polaroid.innerHTML = `${tapeOrClip}${imageHtml}<div class="polaroid-caption">${photo.caption}</div>`;
            polaroid.addEventListener('mouseenter', () => photoGlitch(polaroid));
            grid.appendChild(polaroid);
        });
    }

    function renderAbilities(abilities) {
        const list = document.getElementById('abilities-list');
        list.innerHTML = '';
        abilities.forEach((a, i) => {
            const item = document.createElement('div');
            item.className = 'ability-item';
            item.setAttribute('data-index', i);
            item.innerHTML = `<div class="ability-name">${i + 1}. ${a.name}</div><div class="ability-text">${formatText(a.text)}</div>`;
            list.appendChild(item);
        });
    }

    function renderPhobia(text, videoUrl) {
        const el = document.getElementById('phobia-text');
        el.innerHTML = formatText(text);
        const videoSlot = document.getElementById('phobia-video');
        if (videoUrl) {
            videoSlot.innerHTML = `<iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe>`;
        } else {
            videoSlot.textContent = '[ВИДЕО — Инцидент 4228-Delta: уничтожение аномальных мух]';
        }
    }

    function renderIncidents(incidents) {
        const list = document.getElementById('incidents-list');
        list.innerHTML = '';
        incidents.forEach((inc) => {
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
        notes.forEach((note) => {
            const item = document.createElement('div');
            item.className = 'note-item' + (note.o5_only ? ' o5-note hidden' : '');
            if (note.o5_only) item.setAttribute('data-o5', 'true');
            item.innerHTML = `<div class="note-author">${note.author}:</div><div class="note-text">"${note.text}"</div>`;
            list.appendChild(item);
        });
    }

    // ========================
    // GSAP
    // ========================
    function initGSAP() {
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('.doc-section').forEach((section) => {
            ScrollTrigger.create({
                trigger: section,
                start: 'top 85%',
                once: true,
                onEnter: () => section.classList.add('visible')
            });
        });
    }

    // ========================
    // O5 TERMINAL — FULL REVEAL
    // ========================
    function initO5Terminal() {
        const input = document.getElementById('o5-input');
        const status = document.getElementById('o5-status');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (input.value.trim() === O5_CODE) {
                    status.textContent = '✓ ДОСТУП ПОДТВЕРЖДЁН — УРОВЕНЬ O5';
                    status.className = 'sticky-status granted';
                    playAccessGranted();
                    grantO5Access();
                } else {
                    status.textContent = '✗ КОД НЕВЕРНЫЙ';
                    status.className = 'sticky-status denied';
                    playAccessDenied();
                    shakeElement(document.getElementById('o5-sticky'));
                    setTimeout(() => { status.textContent = ''; status.className = 'sticky-status'; }, 3000);
                }
            }
        });
    }

    function playAccessGranted() {
        try {
            const ctx = getAudio();
            [600, 800, 1000].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.value = freq;
                gain.gain.value = 0.1;
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3 + i * 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.1);
                osc.stop(ctx.currentTime + 0.3 + i * 0.1);
            });
        } catch(e) {}
    }

    function playAccessDenied() {
        try {
            const ctx = getAudio();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 150;
            gain.gain.value = 0.15;
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch(e) {}
    }

    function grantO5Access() {
        if (o5Granted) return;
        o5Granted = true;
        document.body.classList.add('o5-access');

        // Reveal phobia section
        const classified = document.getElementById('phobia-classified');
        const revealed = document.getElementById('phobia-revealed');
        if (classified) classified.classList.add('hidden');
        if (revealed) revealed.classList.remove('hidden');

        // Reveal O5-only notes
        document.querySelectorAll('[data-o5]').forEach(el => el.classList.remove('hidden'));

        // Replace ALL text fields with revealed versions
        if (contentData.containment_revealed) {
            document.getElementById('obj-containment').innerHTML = formatRevealed(contentData.containment_revealed);
        }
        if (contentData.discovery_revealed) {
            document.getElementById('obj-discovery').innerHTML = formatRevealed(contentData.discovery_revealed);
        }
        if (contentData.description_revealed) {
            document.getElementById('obj-description').innerHTML = formatRevealed(contentData.description_revealed);
        }
        if (contentData.phobia_revealed) {
            document.getElementById('phobia-text').innerHTML = formatRevealed(contentData.phobia_revealed);
        }

        // Replace abilities
        const abilityItems = document.querySelectorAll('.ability-item');
        abilityItems.forEach((item, i) => {
            if (contentData.abilities[i] && contentData.abilities[i].text_revealed) {
                item.querySelector('.ability-text').innerHTML = formatRevealed(contentData.abilities[i].text_revealed);
            }
        });

        // Replace incidents
        const incidentItems = document.querySelectorAll('.incident-item');
        incidentItems.forEach((item, i) => {
            if (contentData.incidents[i] && contentData.incidents[i].text_revealed) {
                item.querySelector('.incident-text').innerHTML = formatRevealed(contentData.incidents[i].text_revealed);
            }
        });

        // Visual flash
        const lamp = document.querySelector('.lamp-light');
        lamp.style.opacity = '0';
        setTimeout(() => { lamp.style.opacity = '1'; }, 300);
        setTimeout(() => { lamp.style.opacity = '0.5'; }, 500);
        setTimeout(() => { lamp.style.opacity = '1'; }, 700);
    }

    // ========================
    // AMBIENT SOUND
    // ========================
    function initAmbientSound() {
        document.addEventListener('click', function start() {
            document.removeEventListener('click', start);
            try {
                const ctx = getAudio();
                // Very quiet ventilation hum
                const osc = ctx.createOscillator();
                const filter = ctx.createBiquadFilter();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = 60;
                filter.type = 'lowpass';
                filter.frequency.value = 80;
                gain.gain.value = 0.004;
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                osc.start();

                // Clock ticking
                setInterval(() => {
                    const tick = ctx.createOscillator();
                    const tGain = ctx.createGain();
                    tick.type = 'sine';
                    tick.frequency.value = 2200;
                    tGain.gain.value = 0.008;
                    tGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
                    tick.connect(tGain);
                    tGain.connect(ctx.destination);
                    tick.start();
                    tick.stop(ctx.currentTime + 0.015);
                }, 1000);

                // Distant footsteps (random)
                setInterval(() => {
                    if (Math.random() > 0.7) {
                        const step = ctx.createOscillator();
                        const sGain = ctx.createGain();
                        step.type = 'sine';
                        step.frequency.value = 100 + Math.random() * 50;
                        sGain.gain.value = 0.006;
                        sGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
                        step.connect(sGain);
                        sGain.connect(ctx.destination);
                        step.start();
                        step.stop(ctx.currentTime + 0.08);
                    }
                }, 2000 + Math.random() * 3000);
            } catch(e) {}
        }, { once: true });
    }

    // ========================
    // TYPING SOUND ON INPUT
    // ========================
    function initTypingSound() {
        const input = document.getElementById('o5-input');
        input.addEventListener('input', () => {
            playKeyClick();
        });
    }

    // ========================
    // HOVER SOUNDS
    // ========================
    function initHoverSounds() {
        document.querySelectorAll('.polaroid').forEach(p => {
            p.addEventListener('mouseenter', () => {
                try {
                    const ctx = getAudio();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.frequency.value = 400;
                    gain.gain.value = 0.015;
                    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.05);
                } catch(e) {}
            });
        });
    }

    // ========================
    // HEARTBEAT MONITOR (added to description section)
    // ========================
    function initHeartbeat() {
        const descSection = document.getElementById('sec-description');
        if (!descSection) return;
        const container = document.createElement('div');
        container.className = 'heartbeat-container';
        container.innerHTML = `
            <div class="heartbeat-label">МОНИТОРИНГ ОБЪЕКТА — ПУЛЬС</div>
            <div class="heartbeat-line">
                <svg class="heartbeat-svg" viewBox="0 0 400 40" preserveAspectRatio="none">
                    <polyline fill="none" stroke="#0f0" stroke-width="1.5"
                        points="0,20 30,20 35,20 40,5 45,35 50,15 55,25 60,20 100,20 130,20 135,20 140,5 145,35 150,15 155,25 160,20 200,20 230,20 235,20 240,5 245,35 250,15 255,25 260,20 300,20 330,20 335,20 340,5 345,35 350,15 355,25 360,20 400,20"/>
                </svg>
            </div>
            <div class="heartbeat-value">34 BPM — АНОМАЛЬНО НИЗКИЙ</div>
        `;
        descSection.appendChild(container);
    }

    // ========================
    // SCREAMERS
    // ========================
    function initScreamers() {
        initIdleScreamer();
        initScrollScreamer();
    }

    function showScreamer() {
        if (screamerCooldown) return;
        screamerCooldown = true;
        const el = document.getElementById('screamer');
        el.innerHTML = '<div class="screamer-face"></div>';
        el.classList.remove('hidden');
        playScreamerSound();
        setTimeout(() => { el.classList.add('hidden'); el.innerHTML = ''; }, 500);
        setTimeout(() => { screamerCooldown = false; }, 60000);
    }

    function playScreamerSound() {
        try {
            const ctx = getAudio();
            const osc = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc2.type = 'square';
            osc.frequency.value = 150;
            osc.frequency.linearRampToValueAtTime(2500, ctx.currentTime + 0.1);
            osc2.frequency.value = 80;
            osc2.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
            gain.gain.value = 0.25;
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc2.start();
            osc.stop(ctx.currentTime + 0.4);
            osc2.stop(ctx.currentTime + 0.4);
        } catch(e) {}
    }

    function initIdleScreamer() {
        function resetIdle() {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(lampBlackout, 120000);
        }
        ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
            document.addEventListener(evt, resetIdle);
        });
        resetIdle();
    }

    function lampBlackout() {
        const blackout = document.getElementById('blackout');
        blackout.classList.remove('hidden');
        blackout.classList.add('active');
        setTimeout(() => {
            showScreamer();
            setTimeout(() => {
                blackout.classList.remove('active');
                setTimeout(() => blackout.classList.add('hidden'), 2000);
            }, 600);
        }, 3000);
    }

    let lastScrollY = 0;
    let lastScrollTime = 0;

    function initScrollScreamer() {
        window.addEventListener('scroll', () => {
            const now = Date.now();
            const diff = Math.abs(window.scrollY - lastScrollY);
            const timeDiff = now - lastScrollTime;
            if (timeDiff > 0 && timeDiff < 150 && diff > 800 && Math.random() > 0.5) {
                showScreamer();
            }
            lastScrollY = window.scrollY;
            lastScrollTime = now;
        });
    }

    function photoGlitch(polaroid) {
        if (Math.random() < 0.12) {
            const img = polaroid.querySelector('.polaroid-image');
            img.style.filter = 'invert(1) hue-rotate(180deg) contrast(2)';
            img.style.transform = 'scale(1.05)';
            setTimeout(() => { img.style.filter = ''; img.style.transform = ''; }, 180);
        }
    }

    // ========================
    // LAMP FLICKER
    // ========================
    function initLampFlicker() {
        setInterval(() => {
            if (Math.random() > 0.82) {
                const lamp = document.querySelector('.lamp-light');
                lamp.style.opacity = '0.3';
                setTimeout(() => { lamp.style.opacity = '1'; }, 80);
                if (Math.random() > 0.6) {
                    setTimeout(() => {
                        lamp.style.opacity = '0.5';
                        setTimeout(() => { lamp.style.opacity = '1'; }, 60);
                    }, 130);
                }
            }
        }, 4000 + Math.random() * 3000);
    }

    // ========================
    // HELPERS
    // ========================
    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => { el.style.animation = ''; }, 400);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: rotate(1.5deg) translate(0); }
            20% { transform: rotate(1.5deg) translate(-4px, 0); }
            40% { transform: rotate(1.5deg) translate(4px, 0); }
            60% { transform: rotate(1.5deg) translate(-2px, 0); }
            80% { transform: rotate(1.5deg) translate(2px, 0); }
        }
    `;
    document.head.appendChild(style);

})();
