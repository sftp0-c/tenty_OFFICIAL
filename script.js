(function() {
    'use strict';

    const CONFIG = {
        O5_CODE: 'TENTY_ULTIMATE_ACCESS',
        CONTENT_URL: 'data/content.json',
        SCREAMER_DURATION: 600,
        IDLE_TIMEOUT: 180000,
        GLITCH_INTERVAL_MIN: 15000,
        GLITCH_INTERVAL_MAX: 30000
    };

    let contentData = null;
    let fullAccessGranted = false;
    let idleTimer = null;
    let lastScrollY = 0;
    let lastScrollTime = 0;
    let screamerTriggered = { scroll: false, idle: false, select: false };

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

        reader.addEventListener('mousedown', (e) => {
            startY = e.clientY;
            swiping = true;
            card.style.opacity = '1';
            card.style.top = '-100px';
        });

        reader.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            swiping = true;
            card.style.opacity = '1';
            card.style.top = '-100px';
        });

        document.addEventListener('mousemove', (e) => {
            if (!swiping) return;
            const diff = e.clientY - startY;
            if (diff > 0) {
                card.style.top = Math.min(diff - 100, 200) + 'px';
            }
            if (diff > 150) {
                grantAccess();
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!swiping) return;
            const diff = e.touches[0].clientY - startY;
            if (diff > 0) {
                card.style.top = Math.min(diff - 100, 200) + 'px';
            }
            if (diff > 150) {
                grantAccess();
            }
        });

        document.addEventListener('mouseup', () => {
            if (swiping && !screen.classList.contains('doors-open')) {
                card.style.opacity = '0';
                card.style.top = '-100px';
            }
            swiping = false;
        });

        document.addEventListener('touchend', () => {
            if (swiping && !screen.classList.contains('doors-open')) {
                card.style.opacity = '0';
                card.style.top = '-100px';
            }
            swiping = false;
        });

        function grantAccess() {
            if (screen.classList.contains('doors-open')) return;
            swiping = false;
            light.classList.add('granted');
            playAccessSound();

            setTimeout(() => {
                screen.classList.add('doors-open');
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 500);
            }, 800);

            setTimeout(() => {
                screen.style.display = 'none';
                document.getElementById('main-content').classList.remove('hidden');
                initMainSite();
            }, 2500);
        }
    }

    function playAccessSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);
            osc.frequency.linearRampToValueAtTime(1500, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch(e) {}
    }

    // ========================
    // MAIN SITE INIT
    // ========================
    function initMainSite() {
        loadContent();
        initGSAP();
        initAmbient();
        initGlitchFlashes();
        initIdleScreamer();
        initScrollScreamer();
        initSelectScreamer();
        initO5Terminal();
        initDaysCounter();
        initSubliminelMessages();
    }

    // ========================
    // LOAD CONTENT
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
        document.getElementById('obj-class').textContent = d.class;
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
        document.getElementById('obj-containment').textContent = '[ОШИБКА ЗАГРУЗКИ ДАННЫХ]';
    }

    function formatText(text) {
        return text.replace(/████+/g, '<span class="censored">████████</span>')
                   .replace(/██/g, '<span class="censored">██</span>')
                   .replace(/\n/g, '<br>');
    }

    function renderPhotos(photos) {
        const grid = document.getElementById('photo-grid');
        grid.innerHTML = '';
        photos.forEach((photo, i) => {
            const slot = document.createElement('div');
            slot.className = 'photo-slot';
            slot.setAttribute('data-photo-index', i);
            if (photo.url) {
                slot.innerHTML = `<img src="${photo.url}" alt="${photo.caption}"><div class="photo-caption">${photo.caption}</div>`;
            } else {
                slot.innerHTML = `<div class="photo-placeholder">[ФОТО №${photo.id}]<br>${photo.caption}</div>`;
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
            html += `<div class="video-slot"><div class="video-placeholder">[ВИДЕО — Инцидент 4228-Delta: объект сжигает аномальных мух]</div></div>`;
        }
        content.innerHTML = html;
    }

    function renderIncidents(incidents) {
        const list = document.getElementById('incidents-list');
        list.innerHTML = '';
        incidents.forEach(inc => {
            const item = document.createElement('div');
            item.className = 'incident-item';
            let html = `<div class="incident-name">${inc.name}</div>`;
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
    // TYPEWRITER EFFECT
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
        }, 80);
    }

    // ========================
    // GSAP ANIMATIONS
    // ========================
    function initGSAP() {
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('.doc-section').forEach(section => {
            gsap.to(section, {
                opacity: 1,
                y: 0,
                duration: 0.8,
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
    // AMBIENT SOUND
    // ========================
    function initAmbient() {
        let started = false;
        document.addEventListener('click', () => {
            if (started) return;
            started = true;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                // Low hum
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = 55;
                gain.gain.value = 0.015;
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();

                // Random clicks
                setInterval(() => {
                    const click = ctx.createOscillator();
                    const cGain = ctx.createGain();
                    click.type = 'square';
                    click.frequency.value = 2000 + Math.random() * 3000;
                    cGain.gain.value = 0.02;
                    cGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
                    click.connect(cGain);
                    cGain.connect(ctx.destination);
                    click.start();
                    click.stop(ctx.currentTime + 0.05);
                }, 3000 + Math.random() * 5000);
            } catch(e) {}
        }, { once: true });
    }

    // ========================
    // GLITCH FLASHES
    // ========================
    function initGlitchFlashes() {
        function scheduleGlitch() {
            const delay = CONFIG.GLITCH_INTERVAL_MIN + Math.random() * (CONFIG.GLITCH_INTERVAL_MAX - CONFIG.GLITCH_INTERVAL_MIN);
            setTimeout(() => {
                triggerGlitch();
                scheduleGlitch();
            }, delay);
        }
        scheduleGlitch();
    }

    function triggerGlitch() {
        const overlay = document.querySelector('.flicker-overlay');
        overlay.style.animation = 'none';
        overlay.offsetHeight;
        overlay.style.background = `rgba(${Math.random() > 0.5 ? '255,0,0' : '0,255,0'}, 0.05)`;
        overlay.style.opacity = '1';
        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.background = '';
            overlay.style.animation = 'flicker 4s infinite';
        }, 100 + Math.random() * 200);

        if (Math.random() > 0.7) {
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 300);
        }
    }

    // ========================
    // SCREAMERS
    // ========================
    function showScreamer() {
        const el = document.getElementById('screamer');
        el.classList.remove('hidden');
        playScreamerSound();
        setTimeout(() => {
            el.classList.add('hidden');
        }, CONFIG.SCREAMER_DURATION);
    }

    function playScreamerSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = 200;
            osc.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.1);
            gain.gain.value = 0.5;
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
    }

    function initScrollScreamer() {
        window.addEventListener('scroll', () => {
            const now = Date.now();
            const scrollDiff = Math.abs(window.scrollY - lastScrollY);
            const timeDiff = now - lastScrollTime;
            if (timeDiff > 0 && scrollDiff / timeDiff > 5 && !screamerTriggered.scroll) {
                if (Math.random() > 0.6) {
                    screamerTriggered.scroll = true;
                    showScreamer();
                    setTimeout(() => { screamerTriggered.scroll = false; }, 30000);
                }
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
        overlay.style.transition = 'opacity 2s';
        setTimeout(() => {
            overlay.style.background = 'radial-gradient(circle at 50% 50%, rgba(50,0,0,0.8) 0%, #000 70%)';
            setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.transition = '';
                overlay.style.background = '';
                screamerTriggered.idle = false;
            }, 3000);
        }, 2000);
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
        setTimeout(() => {
            document.body.classList.remove('shake');
        }, 500);
        setTimeout(() => {
            el.classList.add('hidden');
        }, 3000);
    }

    function photoScreamerChance(slot) {
        if (Math.random() < 0.15) {
            slot.style.filter = 'hue-rotate(180deg) saturate(5) brightness(0.3)';
            slot.style.transform = 'scale(1.02)';
            setTimeout(() => {
                slot.style.filter = '';
                slot.style.transform = '';
            }, 200);
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
                    status.textContent = 'ДОСТУП РАЗРЕШЁН — УРОВЕНЬ O5';
                    status.className = 'o5-status granted';
                    grantFullAccess();
                } else {
                    status.textContent = 'ОТКАЗАНО В ДОСТУПЕ';
                    status.className = 'o5-status denied';
                    document.body.classList.add('shake');
                    setTimeout(() => document.body.classList.remove('shake'), 500);
                }
            }
        });

        input.addEventListener('input', () => {
            // Symbol scramble effect on input
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
            if (status.textContent && !status.classList.contains('granted')) {
                status.textContent = Array.from({length: 20}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                status.className = 'o5-status';
            }
        });
    }

    function grantFullAccess() {
        fullAccessGranted = true;
        document.body.classList.add('full-access');

        // Reveal phobia
        document.getElementById('phobia-block').classList.add('hidden');
        document.getElementById('phobia-content').classList.remove('hidden');

        // Remove censorship
        document.querySelectorAll('.censored').forEach(el => {
            el.style.background = 'rgba(255,0,64,0.2)';
            el.style.color = 'var(--danger)';
        });

        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 500);

        triggerGlitch();
        triggerGlitch();
    }

    // ========================
    // DAYS COUNTER
    // ========================
    function initDaysCounter() {
        const el = document.getElementById('daysCount');
        let days = Math.floor(Math.random() * 5);
        el.textContent = days;

        setInterval(() => {
            if (Math.random() > 0.85) {
                // Reset to 0
                el.textContent = '0';
                el.style.fontSize = '32px';
                document.body.classList.add('shake');
                setTimeout(() => {
                    document.body.classList.remove('shake');
                    el.style.fontSize = '';
                }, 500);
            }
        }, 20000);
    }

    // ========================
    // SUBLIMINAL MESSAGES
    // ========================
    function initSubliminelMessages() {
        const messages = [
            'ОН СМОТРИТ',
            'ВЫПУСТИТЕ МЕНЯ',
            'ПОМОГИТЕ',
            'ОН ЗНАЕТ',
            'ВЫ В ОПАСНОСТИ',
            'НЕ ВЕРЬТЕ ИМ',
            'ОБЪЕКТ СВОБОДЕН'
        ];

        setInterval(() => {
            if (Math.random() > 0.8) {
                const msg = messages[Math.floor(Math.random() * messages.length)];
                const el = document.createElement('div');
                el.style.cssText = `
                    position: fixed;
                    top: ${Math.random() * 80}%;
                    left: ${Math.random() * 80}%;
                    color: rgba(255, 0, 0, 0.6);
                    font-size: ${20 + Math.random() * 30}px;
                    font-family: var(--font-mono);
                    z-index: 9500;
                    pointer-events: none;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                `;
                el.textContent = msg;
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 100 + Math.random() * 150);
            }
        }, 8000 + Math.random() * 12000);
    }

    // ========================
    // INIT
    // ========================
    document.addEventListener('DOMContentLoaded', initCardReader);
})();
