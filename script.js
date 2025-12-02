// Media Tracker Application - Fixed Version
let mediaItems = [];
let currentFilter = 'all';
let editingId = null;
let deleteId = null;
let searchQuery = "";

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadMediaFromStorage();
    renderMedia();
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-chip');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderMedia();
        });
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderMedia();
        });
    }

    // Add media button
    const addMediaBtn = document.getElementById('addMediaBtn');
    if (addMediaBtn) {
        addMediaBtn.addEventListener('click', showAddModal);
    }

    // Form submission
    const mediaForm = document.getElementById('mediaForm');
    if (mediaForm) {
        mediaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveMedia();
        });
    }

    // Media type change
    const mediaTypeSelect = document.getElementById('mediaType');
    if (mediaTypeSelect) {
        mediaTypeSelect.addEventListener('change', updateStatusLabels);
    }

    // Progress validation
    const currentInput = document.getElementById('mediaCurrent');
    const totalInput = document.getElementById('mediaTotal');
    if (currentInput && totalInput) {
        totalInput.addEventListener('input', () => {
            const total = parseInt(totalInput.value);
            const current = parseInt(currentInput.value);
            if (!isNaN(total) && total < current) {
                totalInput.value = current;
            }
        });
        currentInput.addEventListener('input', () => {
            const total = parseInt(totalInput.value);
            const current = parseInt(currentInput.value);
            if (!isNaN(current) && current > total) {
                currentInput.value = total;
            }
        });
    }

    // Modal close buttons
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    }

    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const mediaModal = document.getElementById('mediaModal');
        const deleteModal = document.getElementById('deleteModal');
        
        if (event.target === mediaModal) {
            closeModal();
        }
        if (event.target === deleteModal) {
            closeDeleteModal();
        }
    });
}

// Update status dropdown labels based on media type
function updateStatusLabels() {
    const mediaType = document.getElementById('mediaType').value;
    const statusSelect = document.getElementById('mediaStatus');
    const totalLabel = document.getElementById('mediaTotalLabel');
    const isAnime = mediaType === 'anime';

    const options = statusSelect.querySelectorAll('option');
    options.forEach(option => {
        if (option.value === 'plan') {
            option.textContent = isAnime ? 'Plan to Watch' : 'Plan to Read';
        } else if (option.value === 'reading') {
            option.textContent = isAnime ? 'Watching' : 'Reading';
        }
    });

    if (totalLabel) {
        totalLabel.textContent = isAnime ? 'Total Episodes' : 'Total Chapters';
    }
}

// Load media from localStorage
function loadMediaFromStorage() {
    try {
        const stored = localStorage.getItem('mediaTrackerData');
        if (stored) {
            mediaItems = JSON.parse(stored);
        } else {
            // Initialize with sample data
            mediaItems = [
                {
                    id: generateId(),
                    title: 'Solo Leveling',
                    type: 'manhwa',
                    status: 'plan',
                    current: 0,
                    total: 202
                }
            ];
            saveToStorage();
        }
    } catch (e) {
        console.error('Error loading data:', e);
        mediaItems = [];
    }
}

// Save media to localStorage
function saveToStorage() {
    try {
        localStorage.setItem('mediaTrackerData', JSON.stringify(mediaItems));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

// Generate unique ID
function generateId() {
    return 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Render all media items
function renderMedia() {
    const grid = document.getElementById('mediaGrid');
    if (!grid) return;

    // Filter items
    let filteredItems = mediaItems.filter(item => {
        const matchesType = currentFilter === 'all' || item.type === currentFilter;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery);
        return matchesType && matchesSearch;
    });

    // Sort alphabetically
    filteredItems.sort((a, b) => a.title.localeCompare(b.title));

    // Clear grid
    grid.innerHTML = '';

    // Check if empty
    if (filteredItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 7v14"></path>
                    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                </svg>
                <h3>No media found</h3>
                <p>Add your first ${currentFilter === 'all' ? 'media' : currentFilter} to get started!</p>
            </div>
        `;
        return;
    }

    // Render each item
    filteredItems.forEach(item => {
        const card = createMediaCard(item);
        grid.appendChild(card);
    });
}

// Create media card element
function createMediaCard(item) {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.dataset.testid = `media-card-${item.id}`;

    const percentage = item.total > 0 ? Math.min(100, Math.round((item.current / item.total) * 100)) : 0;
    const statusInfo = getStatusInfo(item.status, item.type);

    card.innerHTML = `
        <div class="card-header">
            <div class="card-title-section">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 7v14"></path>
                    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                </svg>
                <h3 class="card-title" data-testid="media-title-${item.id}">${escapeHtml(item.title)}</h3>
            </div>
            <div class="card-actions">
                <button data-testid="edit-button-${item.id}" class="edit-button" data-id="${item.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
                    </svg>
                </button>
                <button data-testid="delete-button-${item.id}" class="delete-button" data-id="${item.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" x2="10" y1="11" y2="17"></line>
                        <line x1="14" x2="14" y1="11" y2="17"></line>
                    </svg>
                </button>
            </div>
        </div>
        <div class="card-content">
            <div class="type-badge" data-testid="type-badge-${item.id}">${capitalizeFirst(item.type)}</div>
            <div class="status-select" data-testid="status-select-${item.id}" data-id="${item.id}">
                <div class="status-badge-wrapper">
                    <span class="status-dot ${item.status}"></span>
                    <span>${statusInfo.label}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; width: 16px; height: 16px;">
                    <path d="m6 9 6 6 6-6"></path>
                </svg>
            </div>
            <div class="progress-section">
                <div class="progress-controls">
                    <button data-testid="decrease-progress-${item.id}" class="progress-button decrease-btn" data-id="${item.id}" ${item.current <= 0 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14"></path>
                        </svg>
                    </button>
                    <span class="progress-text" data-testid="progress-text-${item.id}">
                        ${item.current} / ${item.total ? item.total : "-"}
                    </span>
                    <button data-testid="increase-progress-${item.id}" class="progress-button increase-btn" data-id="${item.id}" ${item.current >= item.total ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14"></path>
                            <path d="M12 5v14"></path>
                        </svg>
                    </button>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" data-testid="progress-bar-${item.id}">
                        <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="progress-percentage">${percentage}%</span>
                </div>
            </div>
        </div>
    `;

    // Add event listeners to buttons
    const editBtn = card.querySelector('.edit-button');
    if (editBtn) {
        editBtn.addEventListener('click', () => editMedia(item.id));
    }

    const deleteBtn = card.querySelector('.delete-button');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => showDeleteModal(item.id));
    }

    const statusSelect = card.querySelector('.status-select');
    if (statusSelect) {
        statusSelect.addEventListener('click', () => changeStatus(item.id));
    }

    const increaseBtn = card.querySelector('.increase-btn');
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => increaseProgress(item.id));
    }

    const decreaseBtn = card.querySelector('.decrease-btn');
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => decreaseProgress(item.id));
    }

    return card;
}

// Get status information
function getStatusInfo(status, type) {
    const isAnime = type === 'anime';
    const statusMap = {
        'plan': { label: isAnime ? 'Plan to Watch' : 'Plan to Read', color: 'gray' },
        'reading': { label: isAnime ? 'Watching' : 'Reading', color: 'blue' },
        'completed': { label: 'Completed', color: 'green' },
        'on-hold': { label: 'On Hold', color: 'yellow' },
        'dropped': { label: 'Dropped', color: 'red' }
    };
    return statusMap[status] || statusMap['plan'];
}

// Show add modal
function showAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Media';
    document.getElementById('mediaForm').reset();
    document.getElementById('mediaId').value = '';
    document.getElementById('mediaCurrent').value = '0';
    editingId = null;
    updateStatusLabels();
    document.getElementById('mediaModal').classList.add('active');
}

// Show edit modal
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

// Close modal
function closeModal() {
    document.getElementById('mediaModal').classList.remove('active');
    editingId = null;
}

// Save media
function saveMedia() {
    const title = document.getElementById('mediaTitle').value.trim();
    const type = document.getElementById('mediaType').value;
    const status = document.getElementById('mediaStatus').value;
    const current = parseInt(document.getElementById('mediaCurrent').value) || 0;
    const total = parseInt(document.getElementById('mediaTotal').value) || 1;

    if (!title || !type) {
        alert('Please fill in all required fields');
        return;
    }

    if (editingId) {
        // Update existing item
        const index = mediaItems.findIndex(m => m.id === editingId);
        if (index !== -1) {
            mediaItems[index] = {
                id: editingId,
                title,
                type,
                status,
                current,
                total
            };
        }
    } else {
        // Add new item
        mediaItems.push({
            id: generateId(),
            title,
            type,
            status,
            current,
            total
        });
    }

    saveToStorage();
    renderMedia();
    closeModal();
}

// Change status (cycle through statuses)
function changeStatus(id) {
    const item = mediaItems.find(m => m.id === id);
    if (!item) return;

    const statuses = ['plan', 'reading', 'on-hold', 'completed', 'dropped'];
    const currentIndex = statuses.indexOf(item.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    item.status = statuses[nextIndex];

    saveToStorage();
    renderMedia();
}

// Increase progress
function increaseProgress(id) {
    const item = mediaItems.find(m => m.id === id);
    if (!item) return;

    if (!item.total || isNaN(item.total)) {
        item.current += 1;
    } else {
        if (item.current >= item.total) return;
        item.current = Math.min(item.current + 1, item.total);

        if (item.current >= item.total && item.status !== 'completed') {
            item.status = 'completed';
        }
    }

    saveToStorage();
    renderMedia();
}

// Decrease progress
function decreaseProgress(id) {
    const item = mediaItems.find(m => m.id === id);
    if (!item || item.current <= 0) return;

    item.current = Math.max(0, item.current - 1);
    saveToStorage();
    renderMedia();
}

// Show delete modal
function showDeleteModal(id) {
    deleteId = id;
    document.getElementById('deleteModal').classList.add('active');
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    deleteId = null;
}

// Confirm delete
function confirmDelete() {
    if (!deleteId) return;

    mediaItems = mediaItems.filter(m => m.id !== deleteId);
    saveToStorage();
    renderMedia();
    closeDeleteModal();
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalizeFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}