(function() {
    'use strict';

    const CREDENTIALS = { login: 'micasimka' };
    const REPO = 'sftp0-c/tenty_OFFICIAL';
    const FILE_PATH = 'data/content.json';

    let contentData = null;

    // ========================
    // AUTH
    // ========================
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const login = document.getElementById('login-input').value;
        if (login === CREDENTIALS.login) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            initAdmin();
        } else {
            document.getElementById('login-error').textContent = 'ОТКАЗАНО В ДОСТУПЕ';
        }
    });

    document.getElementById('btn-logout').addEventListener('click', () => location.reload());

    // ========================
    // TABS
    // ========================
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
        });
    });

    // ========================
    // INIT
    // ========================
    async function initAdmin() {
        const savedToken = localStorage.getItem('scp_github_token');
        if (savedToken) document.getElementById('github-token').value = savedToken;

        await loadContent();
        populateAll();
        initEvents();
    }

    async function loadContent() {
        try {
            const resp = await fetch('../' + FILE_PATH);
            contentData = await resp.json();
        } catch(e) {
            contentData = getDefaultContent();
        }
    }

    function getDefaultContent() {
        return {
            object_number: 'SCP-4228-RU',
            codename: '',
            class: 'Кетер',
            class_note: '',
            containment: '',
            containment_revealed: '',
            discovery: '',
            discovery_revealed: '',
            description: '',
            description_revealed: '',
            photos: [],
            abilities: [],
            phobia: '',
            phobia_revealed: '',
            phobia_video_url: '',
            incidents: [],
            notes: []
        };
    }

    // ========================
    // POPULATE
    // ========================
    function populateAll() {
        const d = contentData;
        document.getElementById('edit-number').value = d.object_number || '';
        document.getElementById('edit-codename').value = d.codename || '';
        document.getElementById('edit-class').value = d.class || '';
        document.getElementById('edit-class-note').value = d.class_note || '';
        document.getElementById('edit-containment').value = d.containment || '';
        document.getElementById('edit-discovery').value = d.discovery || '';
        document.getElementById('edit-description').value = d.description || '';
        document.getElementById('edit-phobia').value = d.phobia || '';
        document.getElementById('edit-phobia-video').value = d.phobia_video_url || '';

        document.getElementById('edit-containment-revealed').value = d.containment_revealed || '';
        document.getElementById('edit-discovery-revealed').value = d.discovery_revealed || '';
        document.getElementById('edit-description-revealed').value = d.description_revealed || '';
        document.getElementById('edit-phobia-revealed').value = d.phobia_revealed || '';

        renderPhotos();
        renderAbilities();
        renderAbilitiesO5();
        renderIncidents();
        renderIncidentsO5();
        renderNotes();
        renderNotifications();
        renderChatPhrases();
        renderCameras();
        renderBootLines();
        renderEasterEggs();
        loadStats();
    }

    // ========================
    // RENDER: PHOTOS
    // ========================
    function renderPhotos() {
        const container = document.getElementById('photos-editor');
        container.innerHTML = '';
        (contentData.photos || []).forEach((photo, i) => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            const preview = photo.url
                ? `<img src="${esc(photo.url)}" alt="Photo ${i+1}">`
                : `[ФОТО №${photo.id || i+1}]`;
            card.innerHTML = `
                <button class="btn-remove" data-type="photo" data-index="${i}">X</button>
                <div class="photo-preview">${preview}</div>
                <div class="field-group">
                    <label>Подпись</label>
                    <input type="text" class="full-input photo-caption" data-index="${i}" value="${esc(photo.caption || '')}">
                </div>
                <div class="field-group">
                    <label>URL</label>
                    <input type="text" class="full-input photo-url" data-index="${i}" value="${esc(photo.url || '')}" placeholder="https://...">
                </div>
            `;
            container.appendChild(card);
        });
    }

    // ========================
    // RENDER: ABILITIES (standard)
    // ========================
    function renderAbilities() {
        const container = document.getElementById('abilities-editor');
        container.innerHTML = '';
        (contentData.abilities || []).forEach((a, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <div class="item-header">
                    <span class="item-number">СВОЙСТВО #${i+1}</span>
                    <button class="btn-remove" data-type="ability" data-index="${i}">УДАЛИТЬ</button>
                </div>
                <div class="field-group">
                    <label>Название</label>
                    <input type="text" class="full-input ability-name" data-index="${i}" value="${esc(a.name || '')}">
                </div>
                <div class="field-group">
                    <label>Текст (с цензурой ████)</label>
                    <textarea class="full-textarea ability-text" data-index="${i}" rows="3">${esc(a.text || '')}</textarea>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // ========================
    // RENDER: ABILITIES O5
    // ========================
    function renderAbilitiesO5() {
        const container = document.getElementById('abilities-o5-editor');
        container.innerHTML = '';
        (contentData.abilities || []).forEach((a, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <div class="item-header">
                    <span class="item-number">#${i+1}: ${esc(a.name || 'Без названия')}</span>
                </div>
                <div class="field-group">
                    <label>Текст O5 (без цензуры)</label>
                    <textarea class="full-textarea ability-text-revealed" data-index="${i}" rows="4">${esc(a.text_revealed || '')}</textarea>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // ========================
    // RENDER: INCIDENTS (standard)
    // ========================
    function renderIncidents() {
        const container = document.getElementById('incidents-editor');
        container.innerHTML = '';
        (contentData.incidents || []).forEach((inc, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <div class="item-header">
                    <span class="item-number">ИНЦИДЕНТ #${i+1}</span>
                    <button class="btn-remove" data-type="incident" data-index="${i}">УДАЛИТЬ</button>
                </div>
                <div class="field-group">
                    <label>Название</label>
                    <input type="text" class="full-input incident-name" data-index="${i}" value="${esc(inc.name || '')}">
                </div>
                <div class="field-group">
                    <label>Локация</label>
                    <input type="text" class="full-input incident-location" data-index="${i}" value="${esc(inc.location || '')}">
                </div>
                <div class="field-group">
                    <label>Текст (с цензурой ████)</label>
                    <textarea class="full-textarea incident-text" data-index="${i}" rows="3">${esc(inc.text || '')}</textarea>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // ========================
    // RENDER: INCIDENTS O5
    // ========================
    function renderIncidentsO5() {
        const container = document.getElementById('incidents-o5-editor');
        container.innerHTML = '';
        (contentData.incidents || []).forEach((inc, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <div class="item-header">
                    <span class="item-number">#${i+1}: ${esc(inc.name || 'Без названия')}</span>
                </div>
                <div class="field-group">
                    <label>Текст O5 (без цензуры)</label>
                    <textarea class="full-textarea incident-text-revealed" data-index="${i}" rows="4">${esc(inc.text_revealed || '')}</textarea>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // ========================
    // RENDER: NOTES
    // ========================
    function renderNotes() {
        const container = document.getElementById('notes-editor');
        container.innerHTML = '';
        (contentData.notes || []).forEach((note, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <div class="item-header">
                    <span class="item-number">ПРИМЕЧАНИЕ #${i+1}</span>
                    <button class="btn-remove" data-type="note" data-index="${i}">УДАЛИТЬ</button>
                </div>
                <div class="field-group">
                    <label>Автор</label>
                    <input type="text" class="full-input note-author" data-index="${i}" value="${esc(note.author || '')}">
                </div>
                <div class="field-group">
                    <label>Текст</label>
                    <textarea class="full-textarea note-text" data-index="${i}" rows="3">${esc(note.text || '')}</textarea>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="note-o5" data-index="${i}" ${note.o5_only ? 'checked' : ''}>
                    <label>Только для O5 (скрыто до ввода кода)</label>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // ========================
    // RENDER: NOTIFICATIONS
    // ========================
    function renderNotifications() {
        if (!contentData.notifications) contentData.notifications = [];
        const container = document.getElementById('notif-editor');
        container.innerHTML = '';
        contentData.notifications.forEach((n, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <div class="item-header"><span class="item-number">#${i+1}</span><button class="btn-remove" data-type="notif" data-index="${i}">УДАЛИТЬ</button></div>
                <div class="field-row">
                    <div class="field-group"><label>Текст</label><input type="text" class="full-input notif-text" data-index="${i}" value="${esc(n.text || '')}"></div>
                    <div class="field-group"><label>Уровень (green/orange/red/black)</label><input type="text" class="full-input notif-level" data-index="${i}" value="${esc(n.level || 'green')}"></div>
                </div>`;
            container.appendChild(item);
        });
    }

    // ========================
    // RENDER: CHAT PHRASES
    // ========================
    function renderChatPhrases() {
        if (!contentData.chat_phrases) contentData.chat_phrases = [];
        const container = document.getElementById('chat-editor');
        container.innerHTML = '';
        contentData.chat_phrases.forEach((p, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <div class="item-header"><span class="item-number">#${i+1}</span><button class="btn-remove" data-type="chat" data-index="${i}">УДАЛИТЬ</button></div>
                <div class="field-row">
                    <div class="field-group"><label>Ключевое слово</label><input type="text" class="full-input chat-key" data-index="${i}" value="${esc(p.key || '')}"></div>
                    <div class="field-group"><label>Ответы (через | )</label><input type="text" class="full-input chat-responses" data-index="${i}" value="${esc((p.responses || []).join(' | '))}"></div>
                </div>`;
            container.appendChild(item);
        });
    }

    // ========================
    // RENDER: CAMERAS
    // ========================
    function renderCameras() {
        if (!contentData.cameras) contentData.cameras = [
            { id: '1', text: 'Объект лежит на койке.', status: 'stable' },
            { id: '2', text: '[ СТАТИКА ]', status: 'offline' },
            { id: '3', text: 'Коридор B-7', status: 'active' },
        ];
        const container = document.getElementById('cameras-editor');
        container.innerHTML = '';
        contentData.cameras.forEach((cam, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <div class="item-header"><span class="item-number">CAM-${cam.id || i+1}</span></div>
                <div class="field-group"><label>Текст камеры</label><textarea class="full-textarea cam-text" data-index="${i}" rows="3">${esc(cam.text || '')}</textarea></div>
                <div class="field-group"><label>Статус (stable/offline/active)</label><input type="text" class="full-input cam-status" data-index="${i}" value="${esc(cam.status || 'stable')}"></div>`;
            container.appendChild(item);
        });
    }

    // ========================
    // RENDER: BOOT LINES
    // ========================
    function renderBootLines() {
        if (!contentData.boot_lines) contentData.boot_lines = [];
        const container = document.getElementById('boot-editor');
        container.innerHTML = '';
        contentData.boot_lines.forEach((line, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <div class="item-header"><span class="item-number">#${i+1}</span><button class="btn-remove" data-type="boot" data-index="${i}">УДАЛИТЬ</button></div>
                <div class="field-row">
                    <div class="field-group"><label>Текст</label><input type="text" class="full-input boot-text" data-index="${i}" value="${esc(line.text || '')}"></div>
                    <div class="field-group"><label>Тип (ok/warn/err)</label><input type="text" class="full-input boot-type" data-index="${i}" value="${esc(line.type || 'ok')}"></div>
                </div>
                <div class="field-group"><label>Задержка (мс)</label><input type="number" class="full-input boot-delay" data-index="${i}" value="${line.delay || 400}"></div>`;
            container.appendChild(item);
        });
    }

    // ========================
    // RENDER: EASTER EGGS
    // ========================
    function renderEasterEggs() {
        if (!contentData.easter_eggs) contentData.easter_eggs = [];
        const container = document.getElementById('eggs-editor');
        container.innerHTML = '';
        contentData.easter_eggs.forEach((egg, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <div class="item-header"><span class="item-number">#${i+1}</span><button class="btn-remove" data-type="egg" data-index="${i}">УДАЛИТЬ</button></div>
                <div class="field-row">
                    <div class="field-group"><label>Триггер</label><input type="text" class="full-input egg-trigger" data-index="${i}" value="${esc(egg.trigger || '')}"></div>
                    <div class="field-group"><label>Сообщение</label><input type="text" class="full-input egg-message" data-index="${i}" value="${esc(egg.message || '')}"></div>
                </div>`;
            container.appendChild(item);
        });
    }

    // ========================
    // STATS
    // ========================
    function loadStats() {
        document.getElementById('stat-visits').textContent = localStorage.getItem('scp_stat_visits') || '0';
        document.getElementById('stat-o5').textContent = localStorage.getItem('scp_stat_o5') || '0';
        document.getElementById('stat-screamers').textContent = localStorage.getItem('scp_stat_screamers') || '0';
    }

    // ========================
    // EVENTS
    // ========================
    function initEvents() {
        document.getElementById('btn-save').addEventListener('click', saveContent);

        document.getElementById('btn-preview').addEventListener('click', () => {
            window.open('../index.html', '_blank');
        });

        document.getElementById('btn-add-ability').addEventListener('click', () => {
            contentData.abilities.push({ name: '', text: '', text_revealed: '' });
            renderAbilities();
            renderAbilitiesO5();
        });

        document.getElementById('btn-add-incident').addEventListener('click', () => {
            contentData.incidents.push({ name: '', location: '', text: '', text_revealed: '' });
            renderIncidents();
            renderIncidentsO5();
        });

        document.getElementById('btn-add-note').addEventListener('click', () => {
            contentData.notes.push({ author: '', text: '', o5_only: false });
            renderNotes();
        });

        document.getElementById('btn-add-photo').addEventListener('click', () => {
            contentData.photos.push({ id: contentData.photos.length + 1, caption: '', url: '' });
            renderPhotos();
        });

        document.getElementById('btn-add-notif').addEventListener('click', () => {
            contentData.notifications.push({ text: '', level: 'green' });
            renderNotifications();
        });

        document.getElementById('btn-add-chat').addEventListener('click', () => {
            contentData.chat_phrases.push({ key: '', responses: [] });
            renderChatPhrases();
        });

        document.getElementById('btn-add-boot').addEventListener('click', () => {
            contentData.boot_lines.push({ text: '', type: 'ok', delay: 400 });
            renderBootLines();
        });

        document.getElementById('btn-add-egg').addEventListener('click', () => {
            contentData.easter_eggs.push({ trigger: '', message: '' });
            renderEasterEggs();
        });

        document.getElementById('btn-preview-full').addEventListener('click', () => {
            window.open('../index.html', '_blank');
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove')) {
                const type = e.target.dataset.type;
                const index = parseInt(e.target.dataset.index);
                if (type === 'photo') { contentData.photos.splice(index, 1); renderPhotos(); }
                if (type === 'ability') { contentData.abilities.splice(index, 1); renderAbilities(); renderAbilitiesO5(); }
                if (type === 'incident') { contentData.incidents.splice(index, 1); renderIncidents(); renderIncidentsO5(); }
                if (type === 'note') { contentData.notes.splice(index, 1); renderNotes(); }
                if (type === 'notif') { contentData.notifications.splice(index, 1); renderNotifications(); }
                if (type === 'chat') { contentData.chat_phrases.splice(index, 1); renderChatPhrases(); }
                if (type === 'boot') { contentData.boot_lines.splice(index, 1); renderBootLines(); }
                if (type === 'egg') { contentData.easter_eggs.splice(index, 1); renderEasterEggs(); }
            }
        });

        document.getElementById('github-token').addEventListener('change', (e) => {
            localStorage.setItem('scp_github_token', e.target.value);
        });

        document.getElementById('btn-show-token').addEventListener('click', () => {
            const el = document.getElementById('github-token');
            el.type = el.type === 'password' ? 'text' : 'password';
        });

        document.getElementById('btn-export').addEventListener('click', exportJSON);
        document.getElementById('btn-import').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', importJSON);
        document.getElementById('btn-reset').addEventListener('click', () => {
            if (confirm('Сбросить все данные? Это действие необратимо.')) {
                contentData = getDefaultContent();
                populateAll();
            }
        });
    }

    // ========================
    // COLLECT DATA
    // ========================
    function collectData() {
        contentData.object_number = document.getElementById('edit-number').value;
        contentData.codename = document.getElementById('edit-codename').value;
        contentData.class = document.getElementById('edit-class').value;
        contentData.class_note = document.getElementById('edit-class-note').value;
        contentData.containment = document.getElementById('edit-containment').value;
        contentData.discovery = document.getElementById('edit-discovery').value;
        contentData.description = document.getElementById('edit-description').value;
        contentData.phobia = document.getElementById('edit-phobia').value;
        contentData.phobia_video_url = document.getElementById('edit-phobia-video').value;

        contentData.containment_revealed = document.getElementById('edit-containment-revealed').value;
        contentData.discovery_revealed = document.getElementById('edit-discovery-revealed').value;
        contentData.description_revealed = document.getElementById('edit-description-revealed').value;
        contentData.phobia_revealed = document.getElementById('edit-phobia-revealed').value;

        document.querySelectorAll('.photo-caption').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.photos[i]) contentData.photos[i].caption = el.value;
        });
        document.querySelectorAll('.photo-url').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.photos[i]) contentData.photos[i].url = el.value;
        });

        document.querySelectorAll('.ability-name').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.abilities[i]) contentData.abilities[i].name = el.value;
        });
        document.querySelectorAll('.ability-text').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.abilities[i]) contentData.abilities[i].text = el.value;
        });
        document.querySelectorAll('.ability-text-revealed').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.abilities[i]) contentData.abilities[i].text_revealed = el.value;
        });

        document.querySelectorAll('.incident-name').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.incidents[i]) contentData.incidents[i].name = el.value;
        });
        document.querySelectorAll('.incident-location').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.incidents[i]) contentData.incidents[i].location = el.value;
        });
        document.querySelectorAll('.incident-text').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.incidents[i]) contentData.incidents[i].text = el.value;
        });
        document.querySelectorAll('.incident-text-revealed').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.incidents[i]) contentData.incidents[i].text_revealed = el.value;
        });

        document.querySelectorAll('.note-author').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.notes[i]) contentData.notes[i].author = el.value;
        });
        document.querySelectorAll('.note-text').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.notes[i]) contentData.notes[i].text = el.value;
        });
        document.querySelectorAll('.note-o5').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.notes[i]) contentData.notes[i].o5_only = el.checked;
        });

        // Notifications
        document.querySelectorAll('.notif-text').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.notifications[i]) contentData.notifications[i].text = el.value;
        });
        document.querySelectorAll('.notif-level').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.notifications[i]) contentData.notifications[i].level = el.value;
        });

        // Chat phrases
        document.querySelectorAll('.chat-key').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.chat_phrases[i]) contentData.chat_phrases[i].key = el.value;
        });
        document.querySelectorAll('.chat-responses').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.chat_phrases[i]) contentData.chat_phrases[i].responses = el.value.split('|').map(s => s.trim()).filter(Boolean);
        });

        // Cameras
        document.querySelectorAll('.cam-text').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.cameras[i]) contentData.cameras[i].text = el.value;
        });
        document.querySelectorAll('.cam-status').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.cameras[i]) contentData.cameras[i].status = el.value;
        });

        // Boot lines
        document.querySelectorAll('.boot-text').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.boot_lines[i]) contentData.boot_lines[i].text = el.value;
        });
        document.querySelectorAll('.boot-type').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.boot_lines[i]) contentData.boot_lines[i].type = el.value;
        });
        document.querySelectorAll('.boot-delay').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.boot_lines[i]) contentData.boot_lines[i].delay = parseInt(el.value) || 400;
        });

        // Easter eggs
        document.querySelectorAll('.egg-trigger').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.easter_eggs[i]) contentData.easter_eggs[i].trigger = el.value;
        });
        document.querySelectorAll('.egg-message').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.easter_eggs[i]) contentData.easter_eggs[i].message = el.value;
        });
    }

    // ========================
    // SAVE TO GITHUB
    // ========================
    async function saveContent() {
        const token = document.getElementById('github-token').value || localStorage.getItem('scp_github_token');
        const status = document.getElementById('save-status');

        if (!token) {
            status.textContent = 'НУЖЕН TOKEN';
            status.style.color = '#ff0040';
            return;
        }

        localStorage.setItem('scp_github_token', token);
        collectData();
        status.textContent = 'СОХРАНЕНИЕ...';
        status.style.color = '#ffaa00';

        try {
            const existingFile = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
                headers: { 'Authorization': `token ${token}` }
            });
            const existing = await existingFile.json();
            const sha = existing.sha || undefined;

            const content = btoa(unescape(encodeURIComponent(JSON.stringify(contentData, null, 2))));

            const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Update content via admin panel',
                    content: content,
                    sha: sha
                })
            });

            if (response.ok) {
                status.textContent = 'СОХРАНЕНО ✓';
                status.style.color = '#00ff41';
                setTimeout(() => { status.textContent = ''; }, 3000);
            } else {
                const err = await response.json();
                status.textContent = 'ОШИБКА: ' + (err.message || 'Unknown');
                status.style.color = '#ff0040';
            }
        } catch(e) {
            status.textContent = 'СЕТЬ: ' + e.message;
            status.style.color = '#ff0040';
        }
    }

    // ========================
    // EXPORT / IMPORT
    // ========================
    function exportJSON() {
        collectData();
        const blob = new Blob([JSON.stringify(contentData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'content.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function importJSON(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                contentData = JSON.parse(ev.target.result);
                populateAll();
                document.getElementById('save-status').textContent = 'ИМПОРТИРОВАНО';
                document.getElementById('save-status').style.color = '#00ff41';
            } catch(err) {
                alert('Ошибка парсинга JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // ========================
    // UTILS
    // ========================
    function esc(str) {
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

})();
