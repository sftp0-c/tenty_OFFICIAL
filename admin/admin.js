(function() {
    'use strict';

    const CREDENTIALS = {
        login: 'micasimka'
    };

    const REPO = 'sftp0-c/tenty_OFFICIAL';
    const FILE_PATH = 'data/content.json';

    let contentData = null;

    // ========================
    // AUTH
    // ========================
    function checkAuth(login) {
        return login === CREDENTIALS.login;
    }

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const login = document.getElementById('login-input').value;

        if (checkAuth(login)) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            initAdmin();
        } else {
            document.getElementById('login-error').textContent = 'ОТКАЗАНО В ДОСТУПЕ';
        }
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        location.reload();
    });

    // ========================
    // INIT ADMIN
    // ========================
    async function initAdmin() {
        const savedToken = localStorage.getItem('scp_github_token');
        if (savedToken) {
            document.getElementById('github-token').value = savedToken;
        }

        await loadContent();
        populateFields();
        initEventListeners();
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
            codename: 'Maksssssimmuusss',
            class: 'Кетер',
            class_note: '',
            containment: '',
            discovery: '',
            description: '',
            photos: [],
            abilities: [],
            phobia: '',
            phobia_video_url: '',
            incidents: [],
            notes: []
        };
    }

    // ========================
    // POPULATE FIELDS
    // ========================
    function populateFields() {
        document.getElementById('edit-number').value = contentData.object_number || '';
        document.getElementById('edit-codename').value = contentData.codename || '';
        document.getElementById('edit-class').value = contentData.class || '';
        document.getElementById('edit-class-note').value = contentData.class_note || '';
        document.getElementById('edit-containment').value = contentData.containment || '';
        document.getElementById('edit-discovery').value = contentData.discovery || '';
        document.getElementById('edit-description').value = contentData.description || '';
        document.getElementById('edit-phobia').value = contentData.phobia || '';
        document.getElementById('edit-phobia-video').value = contentData.phobia_video_url || '';

        renderPhotosEditor();
        renderAbilitiesEditor();
        renderIncidentsEditor();
        renderNotesEditor();
    }

    function renderPhotosEditor() {
        const container = document.getElementById('photos-editor');
        container.innerHTML = '';
        (contentData.photos || []).forEach((photo, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <button class="btn-remove" data-type="photo" data-index="${i}">X</button>
                <div class="field-group">
                    <label>Подпись</label>
                    <input type="text" class="full-input photo-caption" data-index="${i}" value="${photo.caption || ''}">
                </div>
                <div class="field-group">
                    <label>URL изображения</label>
                    <input type="text" class="full-input photo-url" data-index="${i}" value="${photo.url || ''}" placeholder="https://...">
                </div>
            `;
            container.appendChild(item);
        });
    }

    function renderAbilitiesEditor() {
        const container = document.getElementById('abilities-editor');
        container.innerHTML = '';
        (contentData.abilities || []).forEach((ability, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <button class="btn-remove" data-type="ability" data-index="${i}">X</button>
                <div class="field-group">
                    <label>Название</label>
                    <input type="text" class="full-input ability-name" data-index="${i}" value="${ability.name || ''}">
                </div>
                <div class="field-group">
                    <label>Описание</label>
                    <textarea class="full-textarea ability-text" data-index="${i}" rows="3">${ability.text || ''}</textarea>
                </div>
            `;
            container.appendChild(item);
        });
    }

    function renderIncidentsEditor() {
        const container = document.getElementById('incidents-editor');
        container.innerHTML = '';
        (contentData.incidents || []).forEach((inc, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <button class="btn-remove" data-type="incident" data-index="${i}">X</button>
                <div class="field-group">
                    <label>Название</label>
                    <input type="text" class="full-input incident-name" data-index="${i}" value="${inc.name || ''}">
                </div>
                <div class="field-group">
                    <label>Локация</label>
                    <input type="text" class="full-input incident-location" data-index="${i}" value="${inc.location || ''}">
                </div>
                <div class="field-group">
                    <label>Описание</label>
                    <textarea class="full-textarea incident-text" data-index="${i}" rows="3">${inc.text || ''}</textarea>
                </div>
            `;
            container.appendChild(item);
        });
    }

    function renderNotesEditor() {
        const container = document.getElementById('notes-editor');
        container.innerHTML = '';
        (contentData.notes || []).forEach((note, i) => {
            const item = document.createElement('div');
            item.className = 'editor-item';
            item.innerHTML = `
                <button class="btn-remove" data-type="note" data-index="${i}">X</button>
                <div class="field-group">
                    <label>Автор</label>
                    <input type="text" class="full-input note-author" data-index="${i}" value="${note.author || ''}">
                </div>
                <div class="field-group">
                    <label>Текст</label>
                    <textarea class="full-textarea note-text" data-index="${i}" rows="3">${note.text || ''}</textarea>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // ========================
    // EVENT LISTENERS
    // ========================
    function initEventListeners() {
        document.getElementById('btn-save').addEventListener('click', saveContent);

        document.getElementById('btn-add-ability').addEventListener('click', () => {
            contentData.abilities.push({ name: '', text: '' });
            renderAbilitiesEditor();
        });

        document.getElementById('btn-add-incident').addEventListener('click', () => {
            contentData.incidents.push({ name: '', location: '', text: '' });
            renderIncidentsEditor();
        });

        document.getElementById('btn-add-note').addEventListener('click', () => {
            contentData.notes.push({ author: '', text: '' });
            renderNotesEditor();
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove')) {
                const type = e.target.dataset.type;
                const index = parseInt(e.target.dataset.index);
                if (type === 'photo') contentData.photos.splice(index, 1);
                if (type === 'ability') contentData.abilities.splice(index, 1);
                if (type === 'incident') contentData.incidents.splice(index, 1);
                if (type === 'note') contentData.notes.splice(index, 1);
                populateFields();
            }
        });

        document.getElementById('github-token').addEventListener('change', (e) => {
            localStorage.setItem('scp_github_token', e.target.value);
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

        document.querySelectorAll('.note-author').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.notes[i]) contentData.notes[i].author = el.value;
        });
        document.querySelectorAll('.note-text').forEach(el => {
            const i = parseInt(el.dataset.index);
            if (contentData.notes[i]) contentData.notes[i].text = el.value;
        });
    }

    // ========================
    // SAVE TO GITHUB
    // ========================
    async function saveContent() {
        const token = document.getElementById('github-token').value || localStorage.getItem('scp_github_token');
        const status = document.getElementById('save-status');

        if (!token) {
            status.textContent = 'ОШИБКА: Введите GitHub Token';
            status.style.color = '#ff0040';
            return;
        }

        localStorage.setItem('scp_github_token', token);
        collectData();
        status.textContent = 'Сохранение...';
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
                status.textContent = 'СОХРАНЕНО';
                status.style.color = '#00ff41';
            } else {
                const err = await response.json();
                status.textContent = 'ОШИБКА: ' + (err.message || 'Unknown');
                status.style.color = '#ff0040';
            }
        } catch(e) {
            status.textContent = 'ОШИБКА СЕТИ: ' + e.message;
            status.style.color = '#ff0040';
        }
    }
})();
