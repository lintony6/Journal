// Dashboard Page Logic

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    initApp();
});

// State
let entries = [];
let tags = [];
let currentView = 'entries';
let currentSort = 'newest';
let currentViewMode = 'grid';
let editingEntry = null;
let selectedTags = [];

// Toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">×</button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 5000);
}

async function initApp() {
    loadUserInfo();
    initSidebar();
    initNavigation();
    initSearch();
    initModals();
    initEntryForm();
    initTagForm();
    initSortDropdown();
    initViewToggle();
    await loadData();
}

function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || '{}');
    document.getElementById('user-name').textContent = user.username || 'User';
    document.getElementById('user-email').textContent = user.email || '';
    document.getElementById('user-initial').textContent = (user.username || 'U')[0].toUpperCase();
}

// Sidebar
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const logoutBtn = document.getElementById('logout-btn');

    mobileBtn?.addEventListener('click', () => sidebar.classList.toggle('active'));

    logoutBtn?.addEventListener('click', () => {
        api.logout();
        window.location.href = 'index.html';
    });

    // Close on outside click (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// Navigation
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${view}-view`)?.classList.add('active');

    if (view === 'favorites') renderFavorites();
    if (view === 'tags') renderTagsView();
    if (view === 'calendar') renderCalendar();
}

// Data loading
async function loadData() {
    try {
        document.getElementById('loading-state')?.classList.remove('hidden');

        const [entriesData, tagsData] = await Promise.all([
            api.getEntries(),
            api.getTags()
        ]);

        entries = entriesData.entries || [];
        tags = tagsData.tags || [];

        renderEntries();
        renderSidebarTags();

    } catch (error) {
        showToast('Failed to load data', 'error');
    } finally {
        document.getElementById('loading-state')?.classList.add('hidden');
    }
}

// Render entries
function renderEntries() {
    const container = document.getElementById('entries-container');
    const emptyState = document.getElementById('empty-state');
    const countEl = document.getElementById('entry-count');

    countEl.textContent = entries.length;

    if (entries.length === 0) {
        container.innerHTML = '';
        emptyState?.classList.remove('hidden');
        return;
    }

    emptyState?.classList.add('hidden');

    const sorted = sortEntries([...entries]);
    container.innerHTML = sorted.map(entry => createEntryCard(entry)).join('');

    // Add event listeners
    container.querySelectorAll('.entry-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.entry-action')) {
                editEntry(card.dataset.id);
            }
        });
    });

    container.querySelectorAll('.entry-action.edit').forEach(btn => {
        btn.addEventListener('click', () => editEntry(btn.dataset.id));
    });

    container.querySelectorAll('.entry-action.delete').forEach(btn => {
        btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
    });

    container.querySelectorAll('.entry-action.favorite').forEach(btn => {
        btn.addEventListener('click', () => toggleFavorite(btn.dataset.id));
    });
}

function createEntryCard(entry) {
    const date = new Date(entry.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
    const tagsHtml = (entry.tags || []).map(tagId => {
        const tag = tags.find(t => t._id === tagId);
        return tag ? `<span class="entry-tag" style="background: ${tag.color}20; color: ${tag.color}">${tag.name}</span>` : '';
    }).join('');

    return `
        <article class="entry-card" data-id="${entry._id}">
            <div class="entry-card-header">
                <span class="entry-date">${date}</span>
                ${entry.is_favorite ? '<span class="entry-favorite">⭐</span>' : ''}
            </div>
            <h3 class="entry-card-title">${escapeHtml(entry.title)}</h3>
            <p class="entry-card-preview">${escapeHtml(entry.content.substring(0, 150))}...</p>
            <div class="entry-card-tags">${tagsHtml}</div>
            <div class="entry-card-actions">
                <button class="entry-action edit" data-id="${entry._id}" title="Edit">✏️</button>
                <button class="entry-action favorite" data-id="${entry._id}" title="Favorite">${entry.is_favorite ? '⭐' : '☆'}</button>
                <button class="entry-action delete" data-id="${entry._id}" title="Delete">🗑️</button>
            </div>
        </article>
    `;
}

function sortEntries(list) {
    switch (currentSort) {
        case 'oldest': return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        case 'updated': return list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        default: return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
}

// Favorites
function renderFavorites() {
    const container = document.getElementById('favorites-container');
    const emptyState = document.getElementById('favorites-empty');
    const favorites = entries.filter(e => e.is_favorite);

    document.getElementById('favorite-count').textContent = favorites.length;

    if (favorites.length === 0) {
        container.innerHTML = '';
        emptyState?.classList.remove('hidden');
        return;
    }

    emptyState?.classList.add('hidden');
    container.innerHTML = favorites.map(entry => createEntryCard(entry)).join('');
}

async function toggleFavorite(id) {
    const entry = entries.find(e => e._id === id);
    if (!entry) return;

    try {
        await api.updateEntry(id, { is_favorite: !entry.is_favorite });
        entry.is_favorite = !entry.is_favorite;
        renderEntries();
        showToast(entry.is_favorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (error) {
        showToast('Failed to update', 'error');
    }
}

// Tags
function renderSidebarTags() {
    const list = document.getElementById('tag-list');
    list.innerHTML = tags.map(tag => `
        <li data-id="${tag._id}">
            <span class="tag-dot" style="background: ${tag.color}"></span>
            <span>${escapeHtml(tag.name)}</span>
        </li>
    `).join('');

    // Add click handlers to filter by tag
    list.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => filterByTag(item.dataset.id));
    });
}

function renderTagsView() {
    const grid = document.getElementById('tags-grid');
    document.getElementById('tag-count').textContent = tags.length;

    grid.innerHTML = tags.map(tag => {
        const count = entries.filter(e => (e.tags || []).includes(tag._id)).length;
        return `
            <div class="tag-card" data-id="${tag._id}">
                <span class="tag-color" style="background: ${tag.color}"></span>
                <div class="tag-info">
                    <span class="tag-info-name">${escapeHtml(tag.name)}</span>
                    <span class="tag-info-count">${count} entries</span>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers to filter by tag
    grid.querySelectorAll('.tag-card').forEach(card => {
        card.addEventListener('click', () => filterByTag(card.dataset.id));
    });
}

// Filter entries by tag and switch to entries view
function filterByTag(tagId) {
    const tag = tags.find(t => t._id === tagId);
    const filteredEntries = entries.filter(e => (e.tags || []).includes(tagId));

    // Switch to entries view
    switchView('entries');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-view="entries"]').classList.add('active');

    // Render filtered entries
    const container = document.getElementById('entries-container');
    const emptyState = document.getElementById('empty-state');

    if (filteredEntries.length === 0) {
        container.innerHTML = '';
        emptyState?.classList.remove('hidden');
        document.getElementById('entry-count').textContent = 0;
        showToast(`No entries with tag "${tag?.name}"`, 'info');
        return;
    }

    emptyState?.classList.add('hidden');
    document.getElementById('entry-count').textContent = `${filteredEntries.length} (filtered by: ${tag?.name})`;

    const sorted = sortEntries([...filteredEntries]);
    container.innerHTML = sorted.map(entry => createEntryCard(entry)).join('');

    // Re-add event listeners
    container.querySelectorAll('.entry-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.entry-action')) {
                editEntry(card.dataset.id);
            }
        });
    });

    container.querySelectorAll('.entry-action.edit').forEach(btn => {
        btn.addEventListener('click', () => editEntry(btn.dataset.id));
    });

    container.querySelectorAll('.entry-action.delete').forEach(btn => {
        btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
    });

    container.querySelectorAll('.entry-action.favorite').forEach(btn => {
        btn.addEventListener('click', () => toggleFavorite(btn.dataset.id));
    });

    showToast(`Showing entries with tag "${tag?.name}"`, 'success');
}

// Calendar
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    document.getElementById('current-month').textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const entriesByDate = {};
    entries.forEach(e => {
        const date = new Date(e.created_at).toDateString();
        entriesByDate[date] = (entriesByDate[date] || 0) + 1;
    });

    let html = '<div class="calendar-header">';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => html += `<span>${d}</span>`);
    html += '</div><div class="calendar-grid">';

    for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day other-month"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === new Date().toDateString();
        const hasEntries = entriesByDate[date.toDateString()];
        html += `<div class="calendar-day${isToday ? ' today' : ''}${hasEntries ? ' has-entries' : ''}">${day}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

// Search
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchModal = document.getElementById('search-modal');

    searchInput?.addEventListener('focus', () => openModal(searchModal));

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openModal(searchModal);
        }
        if (e.key === 'Escape') closeAllModals();
    });

    document.getElementById('modal-search-input')?.addEventListener('input', debounce(handleSearch, 300));
}

async function handleSearch(e) {
    const query = e.target.value.trim();
    const entriesContainer = document.querySelector('#search-entries ul');
    const tagsContainer = document.querySelector('#search-tags-results ul');
    const emptyState = document.getElementById('search-empty');

    if (!query) {
        entriesContainer.innerHTML = '';
        tagsContainer.innerHTML = '';
        return;
    }

    const matchedEntries = entries.filter(e =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.content.toLowerCase().includes(query.toLowerCase())
    );

    const matchedTags = tags.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase())
    );

    if (matchedEntries.length === 0 && matchedTags.length === 0) {
        emptyState?.classList.remove('hidden');
        entriesContainer.innerHTML = '';
        tagsContainer.innerHTML = '';
        return;
    }

    emptyState?.classList.add('hidden');

    entriesContainer.innerHTML = matchedEntries.slice(0, 5).map(e => `
        <li data-id="${e._id}">${escapeHtml(e.title)}</li>
    `).join('');

    tagsContainer.innerHTML = matchedTags.map(t => `
        <li data-id="${t._id}"><span class="tag-dot" style="background: ${t.color}"></span> ${escapeHtml(t.name)}</li>
    `).join('');
}

// Modals
function initModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    document.getElementById('new-entry-btn')?.addEventListener('click', () => openNewEntryModal());
    document.getElementById('empty-new-entry')?.addEventListener('click', () => openNewEntryModal());
    document.getElementById('new-tag-btn')?.addEventListener('click', () => openTagModal());
    document.getElementById('cancel-entry')?.addEventListener('click', closeAllModals);
    document.getElementById('cancel-delete')?.addEventListener('click', closeAllModals);
}

function openModal(modal) {
    modal?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
    editingEntry = null;
    selectedTags = [];
}

function openNewEntryModal() {
    editingEntry = null;
    document.getElementById('modal-title').textContent = 'New Entry';
    document.getElementById('save-btn-text').textContent = 'Save Entry';
    document.getElementById('entry-form').reset();
    selectedTags = [];
    renderTagSelector();
    openModal(document.getElementById('entry-modal'));
}

function editEntry(id) {
    const entry = entries.find(e => e._id === id);
    if (!entry) return;

    editingEntry = entry;
    document.getElementById('modal-title').textContent = 'Edit Entry';
    document.getElementById('save-btn-text').textContent = 'Update Entry';
    document.getElementById('entry-title').value = entry.title;
    document.getElementById('entry-content').value = entry.content;
    document.getElementById('entry-favorite').checked = entry.is_favorite;

    selectedTags = [...(entry.tags || [])];
    renderTagSelector();

    openModal(document.getElementById('entry-modal'));
}

function renderTagSelector() {
    const container = document.getElementById('tag-selector');

    if (tags.length === 0) {
        container.innerHTML = '<span class="tag-selector-empty">No tags created yet. Create tags in the Tags section.</span>';
        return;
    }

    container.innerHTML = tags.map(tag => {
        const isSelected = selectedTags.includes(tag._id);
        return `
            <span class="tag-selector-item ${isSelected ? 'selected' : ''}" 
                  data-id="${tag._id}"
                  style="background: ${tag.color}30; color: ${tag.color}">
                ${escapeHtml(tag.name)}
                <span class="tag-check">✓</span>
            </span>
        `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.tag-selector-item').forEach(item => {
        item.addEventListener('click', () => {
            const tagId = item.dataset.id;
            if (selectedTags.includes(tagId)) {
                selectedTags = selectedTags.filter(id => id !== tagId);
                item.classList.remove('selected');
            } else {
                selectedTags.push(tagId);
                item.classList.add('selected');
            }
        });
    });
}

// Entry form
function initEntryForm() {
    const form = document.getElementById('entry-form');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            title: document.getElementById('entry-title').value,
            content: document.getElementById('entry-content').value,
            is_favorite: document.getElementById('entry-favorite').checked,
            tags: selectedTags
        };

        try {
            if (editingEntry) {
                await api.updateEntry(editingEntry._id, data);
                const index = entries.findIndex(e => e._id === editingEntry._id);
                if (index !== -1) entries[index] = { ...entries[index], ...data };
                showToast('Entry updated!', 'success');
            } else {
                const response = await api.createEntry(data);
                entries.unshift(response.entry);
                showToast('Entry created!', 'success');
            }

            renderEntries();
            closeAllModals();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

// Delete confirmation
let deleteId = null;

function confirmDelete(id) {
    deleteId = id;
    openModal(document.getElementById('delete-modal'));
}

document.getElementById('confirm-delete')?.addEventListener('click', async () => {
    if (!deleteId) return;

    try {
        await api.deleteEntry(deleteId);
        entries = entries.filter(e => e._id !== deleteId);
        renderEntries();
        closeAllModals();
        showToast('Entry deleted', 'success');
    } catch (error) {
        showToast('Failed to delete', 'error');
    }

    deleteId = null;
});

// Tag form
function initTagForm() {
    const form = document.getElementById('tag-form');
    const colorPicker = document.getElementById('color-picker');
    let selectedColor = '#6366f1';

    colorPicker?.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            colorPicker.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedColor = btn.dataset.color;
        });
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('tag-name').value;

        try {
            const response = await api.createTag({ name, color: selectedColor });
            tags.push(response.tag);
            renderSidebarTags();
            renderTagsView();
            closeAllModals();
            showToast('Tag created!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

function openTagModal() {
    document.getElementById('tag-form').reset();
    document.querySelectorAll('.color-option').forEach((b, i) => b.classList.toggle('active', i === 0));
    openModal(document.getElementById('tag-modal'));
}

// Sort dropdown
function initSortDropdown() {
    const btn = document.getElementById('sort-btn');
    const menu = document.getElementById('sort-menu');

    btn?.addEventListener('click', () => menu.classList.toggle('active'));

    menu?.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            currentSort = item.dataset.sort;
            btn.querySelector('span').textContent = item.textContent;
            menu.querySelectorAll('li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            menu.classList.remove('active');
            renderEntries();
        });
    });

    document.addEventListener('click', (e) => {
        if (!btn?.contains(e.target)) menu?.classList.remove('active');
    });
}

// View toggle
function initViewToggle() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentViewMode = btn.dataset.view;
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const container = document.getElementById('entries-container');
            container.classList.toggle('grid-view', currentViewMode === 'grid');
            container.classList.toggle('list-view', currentViewMode === 'list');
        });
    });
}

// Utilities
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
