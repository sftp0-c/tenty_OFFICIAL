(function() {
    'use strict';

    const CONFIG = {
        O5_CODE: 'TENTY_ULTIMATE_ACCESS',
        CONTENT_URL: 'data/content.json',
        SCREAMER_DURATION: 500,
        IDLE_TIMEOUT: 180000,
        GLITCH_INTERVAL_MIN: 12000,
        GLITCH_INTERVAL_MAX: 25000,
        AMBIENT_VOLUME: 0.006,
        MATRIX_DURATION: 8000
    };

    let contentData = null;
    let fullAccessGranted = false;
    let idleTimer = null;
    let lastScrollY = 0;
    let lastScrollTime = 0;
    let screamerTriggered = { scroll: false, idle: false, select: false };
    let audioCtx = null;

    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    // ========================
    // MATRIX EFFECT
    // ========================
    function initMatrix() {
        const canvas = document.getElementById('matrix-canvas');
        const ctx = canvas.getContext('2d');
        let animId = null;
        let columns = [];
        let drops = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const fontSize = 14;
            columns = Math.floor(canvas.width / fontSize);
            drops = Array(columns).fill(1);
        }

        resize();
        window.addEventListener('resize', resize);

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()アイウエオカキクケコサシスセソ';

        function draw() {
            ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0f0';
            ctx.font = '14px monospace';

            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillStyle = Math.random() > 0.95 ? '#fff' : (Math.random() > 0.5 ? '#0f0' : '#0a0');
                ctx.fillText(char, i * 14, drops[i] * 14);
                if (drops[i] * 14 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            animId = requestAnimationFrame(draw);
        }

        function showMatrix() {
            canvas.classList.add('active');
            draw();
            setTimeout(() => {
                canvas.classList.remove('active');
                setTimeout(() => {
                    cancelAnimationFrame(animId);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }, 2000);
            }, CONFIG.MATRIX_DURATION);
        }

        setInterval(() => {
            if (Math.random() > 0.6) showMatrix();
        }, 40000 + Math.random() * 30000);

        setTimeout(showMatrix, 5000);
    }

    // ========================
    // CARD ACCESS SCREEN
    // ========================
    function initCardReader() {
        const reader = document.getElementById('cardReader');
        const card = document.getElementById('accessCard');
        const light = document.getElementById('readerLight');
        const screen = document.getElementById('access-screen');
        let startY = null;
        let swiping = false;

        function onStart(y) {
            startY = y;
            swiping = true;
            card.style.opacity = '1';
            card.style.top = '-110px';
        }

        function onMove(y) {
            if (!swiping) return;
            const diff = y - startY;
            if (diff > 0) {
                card.style.top = Math.min(diff - 110, 200) + 'px';
            }
            if (diff > 140) {
                grantAccess();
            }
        }

        function onEnd() {
            if (swiping && !screen.classList.contains('doors-open')) {
                card.style.opacity = '0';
                card.style.top = '-110px';
            }
            swiping = false;
        }

        reader.addEventListener('mousedown', (e) => onStart(e.clientY));
        reader.addEventListener('touchstart', (e) => onStart(e.touches[0].clientY));
        document.addEventListener('mousemove', (e) => onMove(e.clientY));
        document.addEventListener('touchmove', (e) => onMove(e.touches[0].clientY));
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);

        function grantAccess() {
            if (screen.classList.contains('doors-open')) return;
            swiping = false;
            light.classList.add('granted');
            playAccessBeep();

            setTimeout(() => {
                playDoorSound();
                screen.classList.add('doors-open');
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 500);
            }, 600);

            setTimeout(() => {
                screen.style.display = 'none';
                document.getElementById('main-content').classList.remove('hidden');
                initMainSite();
            }, 2800);
        }
    }

    function playAccessBeep() {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(900, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch(e) {}
    }

    function playDoorSound() {
        try {
            const ctx = getAudioCtx();
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                const t = i / ctx.sampleRate;
                data[i] = (
                    Math.sin(t * 40) * Math.exp(-t * 1.5) * 0.3 +
                    Math.sin(t * 80) * Math.exp(-t * 2) * 0.2 +
                    (Math.random() - 0.5) * Math.exp(-t * 3) * 0.4 +
                    Math.sin(t * 20) * Math.exp(-t * 0.8) * 0.2
                );
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.value = 0.4;
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start();
        } catch(e) {}
    }

    // ========================
    // MAIN SITE
    // ========================
    function initMainSite() {
        loadContent();
        initMatrix();
        initGSAP();
        initAmbient();
        initGlitchFlashes();
        initIdleScreamer();
        initScrollScreamer();
        initSelectScreamer();
        initO5Terminal();
        initDaysCounter();
        initSubliminalMessages();
        initRandomGlitchTitle();
    }

    // ========================
    // CONTENT
    // ========================
    async function loadContent() {
        try {
            const resp = await fetch(CONFIG.CONTENT_URL);
            contentData = await resp.json();
            renderContent();
        } catch(e) {
            renderFallbackContent();
        }
    }

    function renderContent() {
        const d = contentData;
        document.getElementById('obj-number').textContent = d.object_number;
        typewriterEffect('obj-codename', d.codename);
        document.getElementById('obj-class').querySelector('.class-text').textContent = d.class.toUpperCase();
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

    function renderFallbackContent() {
        document.getElementById('obj-containment').textContent = '[ОШИБКА ЗАГРУЗКИ — ОБРАТИТЕСЬ К АДМИНИСТРАТОРУ]';
    }

    function formatText(text) {
        return text
            .replace(/████+/g, '<span class="censored" data-revealed="ДАННЫЕ УДАЛЕНЫ">████████</span>')
            .replace(/██/g, '<span class="censored" data-revealed="██">██</span>')
            .replace(/\n/g, '<br>');
    }

    function renderPhotos(photos) {
        const grid = document.getElementById('photo-grid');
        grid.innerHTML = '';
        photos.forEach((photo, i) => {
            const slot = document.createElement('div');
            slot.className = 'photo-slot';
            if (photo.url) {
                slot.innerHTML = `<img src="${photo.url}" alt="${photo.caption}"><div class="photo-caption">[${photo.id}] ${photo.caption}</div>`;
            } else {
                slot.innerHTML = `<div class="photo-placeholder">[ФОТО №${photo.id}]<br><br>${photo.caption}</div>`;
            }
            slot.addEventListener('mouseenter', () => photoScreamerChance(slot));
            grid.appendChild(slot);
        });
    }

    function renderAbilities(abilities) {
        const list = document.getElementById('abilities-list');
        list.innerHTML = '';
        abilities.forEach((a, i) => {
            const item = document.createElement('div');
            item.className = 'ability-item';
            item.innerHTML = `<div class="ability-name">${i + 1}. ${a.name}</div><div class="doc-text">${formatText(a.text)}</div>`;
            list.appendChild(item);
        });
    }

    function renderPhobia(text, videoUrl) {
        const content = document.getElementById('phobia-content');
        let html = `<div class="doc-text">${formatText(text)}</div>`;
        if (videoUrl) {
            html += `<div class="video-slot"><iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe></div>`;
        } else {
            html += `<div class="video-slot"><div class="video-placeholder">[ВИДЕО — Инцидент 4228-Delta: объект уничтожает аномальных мух]</div></div>`;
        }
        content.innerHTML = html;
    }

    function renderIncidents(incidents) {
        const list = document.getElementById('incidents-list');
        list.innerHTML = '';
        incidents.forEach(inc => {
            const item = document.createElement('div');
            item.className = 'incident-item';
            let html = `<div class="incident-name">◆ ${inc.name}</div>`;
            if (inc.location) html += `<div class="incident-location">Локация: ${inc.location}</div>`;
            html += `<div class="doc-text">${formatText(inc.text)}</div>`;
            item.innerHTML = html;
            list.appendChild(item);
        });
    }

    function renderNotes(notes) {
        const list = document.getElementById('notes-list');
        list.innerHTML = '';
        notes.forEach(note => {
            const item = document.createElement('div');
            item.className = 'note-item';
            item.innerHTML = `<div class="note-author">${note.author}:</div><div class="doc-text">"${note.text}"</div>`;
            list.appendChild(item);
        });
    }

    // ========================
    // TYPEWRITER
    // ========================
    function typewriterEffect(elementId, text) {
        const el = document.getElementById(elementId);
        let i = 0;
        el.textContent = '';
        const interval = setInterval(() => {
            if (i < text.length) {
                el.textContent += text[i];
                i++;
            } else {
                clearInterval(interval);
                el.classList.remove('typewriter');
            }
        }, 70);
    }

    // ========================
    // GSAP
    // ========================
    function initGSAP() {
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('.doc-section').forEach(section => {
            gsap.to(section, {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: section,
                    start: 'top 85%',
                    once: true,
                    onEnter: () => section.classList.add('visible')
                }
            });
        });
    }

    // ========================
    // AMBIENT
    // ========================
    function initAmbient() {
        document.addEventListener('click', function startAudio() {
            document.removeEventListener('click', startAudio);
            try {
                const ctx = getAudioCtx();
                // Very quiet low drone
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                osc.type = 'sawtooth';
                osc.frequency.value = 45;
                filter.type = 'lowpass';
                filter.frequency.value = 100;
                gain.gain.value = CONFIG.AMBIENT_VOLUME;
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                osc.start();

                // Quiet random ticks
                setInterval(() => {
                    if (Math.random() > 0.5) return;
                    const tick = ctx.createOscillator();
                    const tGain = ctx.createGain();
                    tick.type = 'sine';
                    tick.frequency.value = 1500 + Math.random() * 2000;
                    tGain.gain.value = 0.008;
                    tGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.03);
                    tick.connect(tGain);
                    tGain.connect(ctx.destination);
                    tick.start();
                    tick.stop(ctx.currentTime + 0.03);
                }, 4000 + Math.random() * 6000);
            } catch(e) {}
        });
    }

    // ========================
    // GLITCH FLASHES
    // ========================
    function initGlitchFlashes() {
        function schedule() {
            const delay = CONFIG.GLITCH_INTERVAL_MIN + Math.random() * (CONFIG.GLITCH_INTERVAL_MAX - CONFIG.GLITCH_INTERVAL_MIN);
            setTimeout(() => {
                triggerGlitch();
                schedule();
            }, delay);
        }
        schedule();
    }

    function triggerGlitch() {
        const overlay = document.querySelector('.flicker-overlay');
        const color = Math.random() > 0.5 ? 'rgba(255,0,0,0.03)' : 'rgba(0,255,0,0.03)';
        overlay.style.animation = 'none';
        overlay.offsetHeight;
        overlay.style.background = color;
        overlay.style.opacity = '1';

        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.background = '';
            overlay.style.animation = 'flicker 6s infinite';
        }, 80 + Math.random() * 150);

        if (Math.random() > 0.75) {
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 250);
        }
    }

    function initRandomGlitchTitle() {
        setInterval(() => {
            const titles = document.querySelectorAll('.glitch-title');
            if (titles.length === 0) return;
            const title = titles[Math.floor(Math.random() * titles.length)];
            title.style.animation = 'glitch 0.2s';
            setTimeout(() => { title.style.animation = ''; }, 200);
        }, 10000 + Math.random() * 15000);
    }

    // ========================
    // SCREAMERS
    // ========================
    function showScreamer() {
        const el = document.getElementById('screamer');
        el.classList.remove('hidden');
        playScreamerSound();
        setTimeout(() => { el.classList.add('hidden'); }, CONFIG.SCREAMER_DURATION);
    }

    function playScreamerSound() {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc2.type = 'square';
            osc.frequency.value = 150;
            osc.frequency.linearRampToValueAtTime(3000, ctx.currentTime + 0.15);
            osc2.frequency.value = 300;
            osc2.frequency.linearRampToValueAtTime(1500, ctx.currentTime + 0.1);
            gain.gain.value = 0.35;
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

    function initScrollScreamer() {
        window.addEventListener('scroll', () => {
            const now = Date.now();
            const scrollDiff = Math.abs(window.scrollY - lastScrollY);
            const timeDiff = now - lastScrollTime;
            if (timeDiff > 0 && timeDiff < 200 && scrollDiff > 800 && !screamerTriggered.scroll) {
                screamerTriggered.scroll = true;
                showScreamer();
                setTimeout(() => { screamerTriggered.scroll = false; }, 45000);
            }
            lastScrollY = window.scrollY;
            lastScrollTime = now;
        });
    }

    function initIdleScreamer() {
        function resetIdle() {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                if (!screamerTriggered.idle) {
                    screamerTriggered.idle = true;
                    idleScreamer();
                }
            }, CONFIG.IDLE_TIMEOUT);
        }
        ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
            document.addEventListener(evt, resetIdle);
        });
        resetIdle();
    }

    function idleScreamer() {
        const overlay = document.querySelector('.flicker-overlay');
        overlay.style.background = '#000';
        overlay.style.opacity = '1';
        overlay.style.transition = 'opacity 3s';
        setTimeout(() => {
            overlay.style.background = 'radial-gradient(circle at 50% 40%, rgba(80,0,0,0.6) 0%, #000 60%)';
            setTimeout(() => {
                showScreamer();
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    overlay.style.transition = '';
                    overlay.style.background = '';
                    screamerTriggered.idle = false;
                }, 1000);
            }, 2500);
        }, 3000);
    }

    function initSelectScreamer() {
        document.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('censored') && !screamerTriggered.select) {
                if (e.detail >= 2) {
                    screamerTriggered.select = true;
                    showUnauthorized();
                    setTimeout(() => { screamerTriggered.select = false; }, 60000);
                }
            }
        });
    }

    function showUnauthorized() {
        const el = document.getElementById('unauthorized');
        el.classList.remove('hidden');
        playScreamerSound();
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 500);
        setTimeout(() => { el.classList.add('hidden'); }, 4000);
    }

    function photoScreamerChance(slot) {
        if (Math.random() < 0.12) {
            slot.style.filter = 'hue-rotate(180deg) saturate(5) brightness(0.2) contrast(3)';
            slot.style.transform = 'scale(1.03)';
            slot.style.transition = 'none';
            setTimeout(() => {
                slot.style.filter = '';
                slot.style.transform = '';
                slot.style.transition = 'all 0.3s';
            }, 150);
        }
    }

    // ========================
    // O5 TERMINAL
    // ========================
    function initO5Terminal() {
        const input = document.getElementById('o5-input');
        const status = document.getElementById('o5-status');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim();
                if (val === CONFIG.O5_CODE) {
                    status.textContent = '✓ ДОСТУП РАЗРЕШЁН — УРОВЕНЬ O5';
                    status.className = 'o5-status granted';
                    grantFullAccess();
                } else {
                    status.textContent = '✗ ОТКАЗАНО В ДОСТУПЕ';
                    status.className = 'o5-status denied';
                    document.body.classList.add('shake');
                    setTimeout(() => document.body.classList.remove('shake'), 500);
                    setTimeout(() => {
                        if (!fullAccessGranted) {
                            status.textContent = '';
                            status.className = 'o5-status';
                        }
                    }, 3000);
                }
            }
        });

        input.addEventListener('input', () => {
            if (fullAccessGranted) return;
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789█▓▒░';
            status.textContent = Array.from({length: 24}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            status.className = 'o5-status';
        });
    }

    function grantFullAccess() {
        fullAccessGranted = true;
        document.body.classList.add('full-access');

        document.getElementById('phobia-block').classList.add('hidden');
        document.getElementById('phobia-content').classList.remove('hidden');

        document.querySelectorAll('.censored').forEach(el => {
            el.style.background = 'rgba(0,255,65,0.1)';
            el.style.color = '#00ff41';
        });

        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 600);
        triggerGlitch();
        triggerGlitch();

        const canvas = document.getElementById('matrix-canvas');
        canvas.classList.add('active');
        setTimeout(() => canvas.classList.remove('active'), 5000);
    }

    // ========================
    // DAYS COUNTER
    // ========================
    function initDaysCounter() {
        const el = document.getElementById('daysCount');
        let days = Math.floor(Math.random() * 4) + 1;
        el.textContent = days;

        setInterval(() => {
            if (Math.random() > 0.8) {
                el.textContent = '0';
                el.style.fontSize = '22px';
                document.body.classList.add('shake');
                triggerGlitch();
                setTimeout(() => {
                    document.body.classList.remove('shake');
                    el.style.fontSize = '';
                    days = 0;
                }, 500);
            } else {
                days++;
                el.textContent = days;
            }
        }, 25000);
    }

    // ========================
    // SUBLIMINAL MESSAGES
    // ========================
    function initSubliminalMessages() {
        const messages = [
            'ОН СМОТРИТ НА ТЕБЯ',
            'ВЫПУСТИТЕ МЕНЯ',
            'ПОМОГИТЕ',
            'ОН ЗНАЕТ ЧТО ТЫ ЗДЕСЬ',
            'ВЫ В ОПАСНОСТИ',
            'НЕ ВЕРЬТЕ ФОНДУ',
            'ОБЪЕКТ СВОБОДЕН',
            'ОНИ ЛГУТ',
            'БЕГИ'
        ];

        setInterval(() => {
            if (Math.random() > 0.7) {
                const msg = messages[Math.floor(Math.random() * messages.length)];
                const el = document.createElement('div');
                el.style.cssText = `
                    position: fixed;
                    top: ${10 + Math.random() * 70}%;
                    left: ${5 + Math.random() * 80}%;
                    color: rgba(255, 0, 0, 0.5);
                    font-size: ${18 + Math.random() * 24}px;
                    font-family: var(--font-mono);
                    z-index: 9500;
                    pointer-events: none;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    text-shadow: 0 0 10px rgba(255,0,0,0.3);
                    white-space: nowrap;
                `;
                el.textContent = msg;
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 80 + Math.random() * 120);
            }
        }, 10000 + Math.random() * 15000);
    }

    // ========================
    // INIT
    // ========================
    document.addEventListener('DOMContentLoaded', initCardReader);
})();
