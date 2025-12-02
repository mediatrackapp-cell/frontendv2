// Media Tracker Application - Optimized Version
let mediaItems = [];
let currentFilter = 'all';
let editingId = null;
let deleteId = null;
let searchQuery = "";

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadMediaFromStorage();
    renderMedia();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderMedia();
        });
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            searchQuery = e.target.value.toLowerCase();
            renderMedia();
        });
    }

    // Add media button
    const addMediaBtn = document.getElementById('addMediaBtn');
    if (addMediaBtn) addMediaBtn.addEventListener('click', showAddModal);

    // Form submission
    const mediaForm = document.getElementById('mediaForm');
    if (mediaForm) mediaForm.addEventListener('submit', e => {
        e.preventDefault();
        saveMedia();
    });

    // Modal close buttons
    ['closeModalBtn', 'closeDeleteModalBtn', 'cancelDeleteBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => {
            id.includes('Delete') ? closeDeleteModal() : closeModal();
        });
    });

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);

    // Close modal when clicking outside
    window.addEventListener('click', event => {
        const mediaModal = document.getElementById('mediaModal');
        const deleteModal = document.getElementById('deleteModal');
        if (event.target === mediaModal) closeModal();
        if (event.target === deleteModal) closeDeleteModal();
    });

    // Media type change in form
    const mediaTypeSelect = document.getElementById('mediaType');
    if (mediaTypeSelect) mediaTypeSelect.addEventListener('change', updateStatusLabels);

    // Progress validation
    const currentInput = document.getElementById('mediaCurrent');
    const totalInput = document.getElementById('mediaTotal');
    if (currentInput && totalInput) {
        totalInput.addEventListener('input', () => {
            const total = parseInt(totalInput.value);
            const current = parseInt(currentInput.value);
            if (!isNaN(total) && total < current) totalInput.value = current;
        });
        currentInput.addEventListener('input', () => {
            const total = parseInt(totalInput.value);
            const current = parseInt(currentInput.value);
            if (!isNaN(current) && current > total) currentInput.value = total;
        });
    }
}

// Load media from localStorage
function loadMediaFromStorage() {
    try {
        const stored = localStorage.getItem('mediaTrackerData');
        mediaItems = stored ? JSON.parse(stored) : [{
            id: generateId(),
            title: 'Solo Leveling',
            type: 'manhwa',
            status: 'plan',
            current: 0,
            total: 202
        }];
        saveToStorage();
    } catch {
        mediaItems = [];
    }
}

// Save to localStorage
function saveToStorage() {
    localStorage.setItem('mediaTrackerData', JSON.stringify(mediaItems));
}

// Generate unique ID
function generateId() {
    return crypto.randomUUID ? crypto.randomUUID() : 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Render media grid
function renderMedia() {
    const grid = document.getElementById('mediaGrid');
    if (!grid) return;

    let filtered = mediaItems.filter(item => {
        const matchType = currentFilter === 'all' || item.type === currentFilter;
        const matchSearch = item.title.toLowerCase().includes(searchQuery);
        return matchType && matchSearch;
    }).sort((a, b) => a.title.localeCompare(b.title));

    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No media found</h3>
                <p>Add your first ${currentFilter === 'all' ? 'media' : currentFilter} to get started!</p>
            </div>`;
        return;
    }

    filtered.forEach(item => {
        const card = createMediaCard(item);
        grid.appendChild(card);
    });
}

// Create media card element
function createMediaCard(item) {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.dataset.id = item.id;

    const percentage = item.total > 0 ? Math.min(100, Math.round((item.current / item.total) * 100)) : 0;
    const statusInfo = getStatusInfo(item.status, item.type);

    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${escapeHtml(item.title)}</h3>
            <div class="card-actions">
                <button class="edit-button">Edit</button>
                <button class="delete-button">Delete</button>
            </div>
        </div>
        <div class="card-content">
            <div class="type-badge">${capitalizeFirst(item.type)}</div>
            <select class="status-dropdown">
                <option value="plan">Plan to ${item.type === 'anime' ? 'Watch' : 'Read'}</option>
                <option value="reading">${item.type === 'anime' ? 'Watching' : 'Reading'}</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="dropped">Dropped</option>
            </select>
            <div class="progress-section">
                <button class="decrease-btn" ${item.current <= 0 ? 'disabled' : ''}>-</button>
                <span class="progress-text">${item.current} / ${item.total ? item.total : "-"}</span>
                <button class="increase-btn" ${item.current >= item.total ? 'disabled' : ''}>+</button>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width:${percentage}%"></div>
                </div>
                <span class="progress-percentage">${percentage}%</span>
            </div>
        </div>
    `;

    // Event listeners
    const editBtn = card.querySelector('.edit-button');
    const deleteBtn = card.querySelector('.delete-button');
    const increaseBtn = card.querySelector('.increase-btn');
    const decreaseBtn = card.querySelector('.decrease-btn');
    const statusDropdown = card.querySelector('.status-dropdown');

    editBtn.addEventListener('click', () => editMedia(item.id));
    deleteBtn.addEventListener('click', () => showDeleteModal(item.id));
    increaseBtn.addEventListener('click', () => updateProgress(item.id, 1, card));
    decreaseBtn.addEventListener('click', () => updateProgress(item.id, -1, card));
    statusDropdown.value = item.status;
    statusDropdown.addEventListener('change', e => updateStatus(item.id, e.target.value, card));

    return card;
}

// Update progress of single card
function updateProgress(id, delta, card) {
    const item = mediaItems.find(m => m.id === id);
    if (!item) return;

    item.current = Math.max(0, Math.min(item.total, item.current + delta));
    if (item.current >= item.total) item.status = 'completed';
    saveToStorage();
    updateCardUI(card, item);
}

// Update status of single card
function updateStatus(id, status, card) {
    const item = mediaItems.find(m => m.id === id);
    if (!item) return;
    item.status = status;
    saveToStorage();
    updateCardUI(card, item);
}

// Update UI of a single card without re-rendering entire grid
function updateCardUI(card, item) {
    const percentage = item.total > 0 ? Math.min(100, Math.round((item.current / item.total) * 100)) : 0;
    card.querySelector('.progress-text').textContent = `${item.current} / ${item.total ? item.total : "-"}`;
    card.querySelector('.progress-bar-fill').style.width = `${percentage}%`;
    card.querySelector('.progress-percentage').textContent = `${percentage}%`;
    card.querySelector('.increase-btn').disabled = item.current >= item.total;
    card.querySelector('.decrease-btn').disabled = item.current <= 0;
    card.querySelector('.status-dropdown').value = item.status;
}

// Get status label
function getStatusInfo(status, type) {
    const isAnime = type === 'anime';
    const map = {
        'plan': { label: isAnime ? 'Plan to Watch' : 'Plan to Read', color: 'gray' },
        'reading': { label: isAnime ? 'Watching' : 'Reading', color: 'blue' },
        'completed': { label: 'Completed', color: 'green' },
        'on-hold': { label: 'On Hold', color: 'yellow' },
        'dropped': { label: 'Dropped', color: 'red' }
    };
    return map[status] || map['plan'];
}

// Show add modal
function showAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Add Media';
    document.getElementById('mediaForm').reset();
    document.getElementById('mediaCurrent').value = 0;
    updateStatusLabels();
    document.getElementById('mediaModal').classList.add('active');
}

// Edit media
function editMedia(id) {
    const item = mediaItems.find(m => m.id === id);
    if (!item) return;
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Media';
    document.getElementById('mediaId').value = item.id;
    document.getElementById('mediaTitle').value = item.title;
    document.getElementById('mediaType').value = item.type;
    document.getElementById('mediaStatus').value = item.status;
    document.getElementById('mediaCurrent').value = item.current;
    document.getElementById('mediaTotal').value = item.total;
    updateStatusLabels();
    document.getElementById('mediaModal').classList.add('active');
}

// Close modals
function closeModal() { document.getElementById('mediaModal').classList.remove('active'); editingId = null; }
function closeDeleteModal() { document.getElementById('deleteModal').classList.remove('active'); deleteId = null; }

// Save media (add or edit)
function saveMedia() {
    const title = document.getElementById('mediaTitle').value.trim();
    const type = document.getElementById('mediaType').value;
    const status = document.getElementById('mediaStatus').value;
    const current = parseInt(document.getElementById('mediaCurrent').value) || 0;
    const total = parseInt(document.getElementById('mediaTotal').value) || 1;

    if (!title || !type) return alert('Please fill in all required fields');

    if (editingId) {
        const idx = mediaItems.findIndex(m => m.id === editingId);
        mediaItems[idx] = { id: editingId, title, type, status, current, total };
    } else {
        mediaItems.push({ id: generateId(), title, type, status, current, total });
    }

    saveToStorage();
    renderMedia();
    closeModal();
}

// Delete
function showDeleteModal(id) { deleteId = id; document.getElementById('deleteModal').classList.add('active'); }
function confirmDelete() {
    if (!deleteId) return;
    mediaItems = mediaItems.filter(m => m.id !== deleteId);
    saveToStorage();
    renderMedia();
    closeDeleteModal();
}

// Update status labels in form
function updateStatusLabels() {
    const type = document.getElementById('mediaType').value;
    const statusSelect = document.getElementById('mediaStatus');
    const totalLabel = document.getElementById('mediaTotalLabel');
    statusSelect.querySelectorAll('option').forEach(option => {
        if (option.value === 'plan') option.textContent = type === 'anime' ? 'Plan to Watch' : 'Plan to Read';
        else if (option.value === 'reading') option.textContent = type === 'anime' ? 'Watching' : 'Reading';
    });
    if (totalLabel) totalLabel.textContent = type === 'anime' ? 'Total Episodes' : 'Total Chapters';
}

// Utilities
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function capitalizeFirst(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
