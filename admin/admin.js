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

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove')) {
                const type = e.target.dataset.type;
                const index = parseInt(e.target.dataset.index);
                if (type === 'photo') { contentData.photos.splice(index, 1); renderPhotos(); }
                if (type === 'ability') { contentData.abilities.splice(index, 1); renderAbilities(); renderAbilitiesO5(); }
                if (type === 'incident') { contentData.incidents.splice(index, 1); renderIncidents(); renderIncidentsO5(); }
                if (type === 'note') { contentData.notes.splice(index, 1); renderNotes(); }
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
