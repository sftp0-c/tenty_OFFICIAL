(function() {
    'use strict';

    const O5_CODE = 'TENTY_ULTIMATE_ACCESS';
    let contentData = null;
    let o5Granted = false;
    let idleTimer = null;
    let screamerCooldown = false;

    // ========================
    // COVER / FOLDER
    // ========================
    document.getElementById('folder').addEventListener('click', openFolder);

    function openFolder() {
        const cover = document.getElementById('cover-screen');
        const folder = document.getElementById('folder');

        playPaperSound();
        folder.style.transform = 'scale(1.1) rotate(-2deg)';
        folder.style.opacity = '0';
        folder.style.transition = 'all 0.6s ease';

        setTimeout(() => {
            cover.style.opacity = '0';
            cover.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                cover.style.display = 'none';
                document.getElementById('document-container').classList.remove('hidden');
                initDocument();
            }, 500);
        }, 400);
    }

    function playPaperSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() - 0.5) * Math.exp(-i / (ctx.sampleRate * 0.05)) * 0.3;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 2000;
            const gain = ctx.createGain();
            gain.gain.value = 0.15;
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
            document.querySelector('.document').innerHTML = '<p style="color:red;padding:40px;">Ошибка загрузки данных. Обновите страницу.</p>';
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
        return text
            .replace(/████+/g, (match) => {
                return `<span class="redacted"><span class="redacted-bar"></span><span class="redacted-text">${match}</span></span>`;
            })
            .replace(/██/g, (match) => {
                return `<span class="redacted"><span class="redacted-bar"></span><span class="redacted-text">${match}</span></span>`;
            })
            .replace(/\n/g, '<br>');
    }

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

            polaroid.innerHTML = `
                ${tapeOrClip}
                ${imageHtml}
                <div class="polaroid-caption">${photo.caption}</div>
            `;

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
            item.innerHTML = `
                <div class="ability-name">${i + 1}. ${a.name}</div>
                <div class="ability-text">${formatText(a.text)}</div>
            `;
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
            videoSlot.textContent = '[ВИДЕО — Инцидент 4228-Delta]';
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
            item.innerHTML = `
                <div class="note-author">${note.author}</div>
                <div class="note-text">"${note.text}"</div>
            `;
            list.appendChild(item);
        });
    }

    // ========================
    // GSAP SCROLL ANIMATIONS
    // ========================
    function initGSAP() {
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('.doc-section').forEach((section) => {
            ScrollTrigger.create({
                trigger: section,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    section.classList.add('visible');
                }
            });
        });
    }

    // ========================
    // O5 TERMINAL
    // ========================
    function initO5Terminal() {
        const input = document.getElementById('o5-input');
        const status = document.getElementById('o5-status');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (input.value.trim() === O5_CODE) {
                    status.textContent = '✓ ДОСТУП РАЗРЕШЁН';
                    status.className = 'sticky-status granted';
                    grantO5Access();
                } else {
                    status.textContent = '✗ КОД НЕВЕРНЫЙ';
                    status.className = 'sticky-status denied';
                    shakeElement(document.getElementById('o5-sticky'));
                    setTimeout(() => {
                        status.textContent = '';
                        status.className = 'sticky-status';
                    }, 2000);
                }
            }
        });
    }

    function grantO5Access() {
        if (o5Granted) return;
        o5Granted = true;
        document.body.classList.add('o5-access');

        // Reveal phobia
        document.getElementById('phobia-classified').classList.add('hidden');
        document.getElementById('phobia-revealed').classList.remove('hidden');

        // Reveal O5 notes
        document.querySelectorAll('[data-o5]').forEach(el => el.classList.remove('hidden'));

        // Replace text with revealed versions
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

        // Replace abilities with revealed versions
        const abilities = contentData.abilities;
        const abilityItems = document.querySelectorAll('.ability-item');
        abilityItems.forEach((item, i) => {
            if (abilities[i] && abilities[i].text_revealed) {
                item.querySelector('.ability-text').innerHTML = formatRevealed(abilities[i].text_revealed);
            }
        });

        // Replace incidents with revealed versions
        const incidents = contentData.incidents;
        const incidentItems = document.querySelectorAll('.incident-item');
        incidentItems.forEach((item, i) => {
            if (incidents[i] && incidents[i].text_revealed) {
                item.querySelector('.incident-text').innerHTML = formatRevealed(incidents[i].text_revealed);
            }
        });

        // Flash effect
        const doc = document.querySelector('.document');
        doc.style.transition = 'box-shadow 0.5s';
        doc.style.boxShadow = '0 0 30px rgba(255,0,0,0.3), 5px 5px 20px rgba(0,0,0,0.3)';
        setTimeout(() => {
            doc.style.boxShadow = '5px 5px 20px rgba(0,0,0,0.3)';
        }, 2000);
    }

    function formatRevealed(text) {
        return text.replace(/\n/g, '<br>');
    }

    // ========================
    // SCREAMERS
    // ========================
    function initScreamers() {
        initIdleScreamer();
        initScrollScreamer();
        initPhotoScreamer();
    }

    function showScreamer() {
        if (screamerCooldown) return;
        screamerCooldown = true;

        const el = document.getElementById('screamer');
        el.innerHTML = '<div class="screamer-face"></div>';
        el.classList.remove('hidden');
        playScreamerSound();

        setTimeout(() => {
            el.classList.add('hidden');
            el.innerHTML = '';
        }, 500);

        setTimeout(() => { screamerCooldown = false; }, 60000);
    }

    function playScreamerSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = 200;
            osc.frequency.linearRampToValueAtTime(2500, ctx.currentTime + 0.12);
            gain.gain.value = 0.3;
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch(e) {}
    }

    function initIdleScreamer() {
        function resetIdle() {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                lampBlackout();
            }, 120000);
        }
        ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
            document.addEventListener(evt, resetIdle);
        });
        resetIdle();
    }

    function lampBlackout() {
        const blackout = document.getElementById('blackout');
        blackout.classList.remove('hidden');
        blackout.style.opacity = '1';

        setTimeout(() => {
            showScreamer();
            setTimeout(() => {
                blackout.style.opacity = '0';
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
            if (timeDiff > 0 && timeDiff < 150 && diff > 900) {
                if (Math.random() > 0.5) showScreamer();
            }
            lastScrollY = window.scrollY;
            lastScrollTime = now;
        });
    }

    function initPhotoScreamer() {
        // handled in renderPhotos -> photoGlitch
    }

    function photoGlitch(polaroid) {
        if (Math.random() < 0.1) {
            const img = polaroid.querySelector('.polaroid-image');
            img.style.filter = 'invert(1) hue-rotate(180deg)';
            img.style.transform = 'scale(1.05)';
            setTimeout(() => {
                img.style.filter = '';
                img.style.transform = '';
            }, 200);
        }
    }

    // ========================
    // LAMP FLICKER
    // ========================
    function initLampFlicker() {
        setInterval(() => {
            if (Math.random() > 0.85) {
                const lamp = document.querySelector('.lamp-light');
                lamp.style.opacity = '0.3';
                setTimeout(() => { lamp.style.opacity = '1'; }, 100);
                if (Math.random() > 0.7) {
                    setTimeout(() => {
                        lamp.style.opacity = '0.5';
                        setTimeout(() => { lamp.style.opacity = '1'; }, 80);
                    }, 150);
                }
            }
        }, 5000);
    }

    // ========================
    // HELPERS
    // ========================
    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.3s ease';
        setTimeout(() => { el.style.animation = ''; }, 300);
    }

    // Add shake keyframe dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: rotate(1.5deg) translate(0); }
            25% { transform: rotate(1.5deg) translate(-3px, 0); }
            75% { transform: rotate(1.5deg) translate(3px, 0); }
        }
    `;
    document.head.appendChild(style);

})();
