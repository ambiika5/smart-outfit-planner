console.log("NEW VERSION LOADED");
/* Smart Outfit Planner - script.js */
/* Beginner-friendly code with detailed comments */

// Data structures
let clothes = []; // All uploaded clothes
let outfits = []; // Saved outfits
let currentOutfit = { top: null, bottom: null, shoes: null, accessory: null }; // Current mix/match



// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    // addSampleDataIfEmpty(); // Disabled

    renderWardrobe();
    setupEventListeners();
    renderSavedOutfits();
    updateFilters();
    
    console.log('Smart Outfit Planner loaded! Start by uploading your clothes 👗');

});

// Load data from localStorage
function loadData() {
    const savedClothes = localStorage.getItem('clothes');
    const savedOutfits = localStorage.getItem('outfits');
    
    if (savedClothes) clothes = JSON.parse(savedClothes);
    if (savedOutfits) outfits = JSON.parse(savedOutfits);
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('clothes', JSON.stringify(clothes));
    localStorage.setItem('outfits', JSON.stringify(outfits));
}

// Empty wardrobe check removed - users must upload clothes first
function addSampleDataIfEmpty() {
    // No sample data
}


// Setup all event listeners
function setupEventListeners() {
    // Upload
    document.getElementById('uploadBtn').addEventListener('click', handleUpload);
    document.getElementById('imageInput').addEventListener('change', previewImage);
    
    // Filters
    document.getElementById('filterCategory').addEventListener('change', renderWardrobe);
    document.getElementById('filterColor').addEventListener('change', renderWardrobe);
    document.getElementById('searchInput').addEventListener('input', renderWardrobe);
    
    // Builder actions
    document.getElementById('randomBtn').addEventListener('click', generateRandomOutfit);
    document.getElementById('clearBtn').addEventListener('click', clearOutfit);
    document.getElementById('saveOutfit').addEventListener('click', saveCurrentOutfit);
    
    // Occasion buttons
    document.querySelectorAll('.occasion-btn').forEach(btn => {
        btn.addEventListener('click', suggestOutfitForOccasion);
    });
    
    // Drag & drop
    setupDragAndDrop();
    
    // Dark mode
    document.getElementById('darkToggle').addEventListener('click', toggleDarkMode);
}

// Image preview
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('preview').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            document.getElementById('preview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

// Handle upload
function handleUpload() {
    const fileInput = document.getElementById('imageInput');
    const category = document.getElementById('categorySelect').value;
    const color = document.getElementById('colorInput').value.trim();
    const occasionsText = document.getElementById('occasionInput').value.trim();
    
    if (!fileInput.files[0] || !category || !color) {
        alert('Please select image, category, and color!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const newCloth = {
            id: Date.now(),
            image: e.target.result, // base64
            category,
            color: color.toLowerCase(),
            occasions: occasionsText.split(',').map(o => o.trim().toLowerCase()).filter(o => o)
        };
        
        clothes.push(newCloth);
        saveData();
        renderWardrobe();
        updateFilters();
        
        // Reset form
        fileInput.value = '';
        document.getElementById('categorySelect').value = '';
        document.getElementById('colorInput').value = '';
        document.getElementById('occasionInput').value = '';
        document.getElementById('preview').classList.add('hidden');
        
    };
    reader.readAsDataURL(fileInput.files[0]);
}

// Render wardrobe with filters
function renderWardrobe() {
    const categoryFilter = document.getElementById('filterCategory').value;
    const colorFilter = document.getElementById('filterColor').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = clothes.filter(cloth => {
        const matchesCategory = !categoryFilter || cloth.category === categoryFilter;
        const matchesColor = !colorFilter || cloth.color === colorFilter;
        const matchesSearch = !search || 
            cloth.category.toLowerCase().includes(search) ||
            cloth.color.toLowerCase().includes(search);
        return matchesCategory && matchesColor && matchesSearch;
    });
    
    const grid = document.getElementById('wardrobeGrid');
    grid.innerHTML = filtered.map(cloth => `
        <div class="clothing-card" draggable="true" data-id="${cloth.id}" data-category="${cloth.category}">
            <img src="${cloth.image}" alt="${cloth.category} - ${cloth.color}" loading="lazy">
            <div class="card-tags">
                <h4>${cloth.category.toUpperCase()}</h4>
                <div class="tag">${cloth.color}</div>
                ${cloth.occasions.map(o => `<div class="tag">${o}</div>`).join('')}
            </div>
        </div>
    `).join('');
}

// Update color filter options dynamically
function updateFilters() {
    const colors = [...new Set(clothes.map(c => c.color))].sort();
    const colorSelect = document.getElementById('filterColor');
    colorSelect.innerHTML = '<option value="">All Colors</option>' + 
        colors.map(color => `<option value="${color}">${color}</option>`).join('');
}

// Drag & Drop setup
function setupDragAndDrop() {
    const wardrobeCards = document.querySelectorAll('.clothing-card');
    const slots = document.querySelectorAll('.slot');
    
    // Drag start
    document.addEventListener('dragstart', e => {
        if (e.target.classList.contains('clothing-card')) {
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            e.target.style.opacity = '0.5';
        }
    });
    
    // Drag end
    document.addEventListener('dragend', e => {
        if (e.target.classList.contains('clothing-card')) {
            e.target.style.opacity = '1';
        }
    });
    
    // Drag over slots
    slots.forEach(slot => {
        slot.addEventListener('dragover', e => {
            e.preventDefault();
            slot.classList.add('drag-over');
        });
        
        slot.addEventListener('dragleave', e => {
            slot.classList.remove('drag-over');
        });
        
        // Drop
        slot.addEventListener('drop', e => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            const clothId = e.dataTransfer.getData('text/plain');
            const cloth = clothes.find(c => c.id == clothId);
            if (!cloth) return;

// Dress handling - goes to bottom slot only
if (cloth.category === 'dress') {
    addToOutfitSlot('bottom', cloth);
    return;
}

// Normal items
if (cloth.category === slot.dataset.slot) {
    addToOutfitSlot(slot.dataset.slot, cloth);
}
        });
    });
}

// Add to outfit slot (only in builder section)
function addToOutfitSlot(slotName, cloth) {
    currentOutfit[slotName] = cloth;
    const slot = document.querySelector(`.builder-section [data-slot="${slotName}"]`);
    if (slot) slot.innerHTML = `<img src="${cloth.image}" alt="${cloth.category}">`;
}

// Clear current outfit
function clearOutfit() {
    currentOutfit = { top: null, bottom: null, shoes: null, accessory: null };
    // Only clear builder slots, not saved outfit slots
    const builderSlots = document.querySelectorAll('.builder-section .slot');
    builderSlots.forEach(slot => {
        slot.innerHTML = `<span>${slot.dataset.slot}</span>`;
    });
    renderSavedOutfits(); // Refresh saved outfits display
}

// Generate random outfit
function generateRandomOutfit() {
    clearOutfit();

    const tops = clothes.filter(c => c.category === 'top');
    const bottoms = clothes.filter(c => c.category === 'bottom');
    const shoes = clothes.filter(c => c.category === 'shoes');
    const accessories = clothes.filter(c => c.category === 'accessory');
    const dresses = clothes.filter(c => c.category === 'dress');

    // Build outfit: prefer top+bottom, only use dress if missing pieces
    if (tops.length) {
        addToOutfitSlot('top', tops[Math.floor(Math.random() * tops.length)]);
    }
    if (bottoms.length) {
        addToOutfitSlot('bottom', bottoms[Math.floor(Math.random() * bottoms.length)]);
    }
    // Only use dress if no top OR no bottom available
    if (!tops.length && !bottoms.length && dresses.length) {
        addToOutfitSlot('bottom', dresses[Math.floor(Math.random() * dresses.length)]);
    }

    if (shoes.length) {
        addToOutfitSlot('shoes', shoes[Math.floor(Math.random() * shoes.length)]);
    }

    if (accessories.length) {
        addToOutfitSlot('accessory', accessories[Math.floor(Math.random() * accessories.length)]);
    }
}

// Suggest outfit for occasion
function suggestOutfitForOccasion(e) {
    const occasion = e.target.dataset.occasion;

    document.querySelectorAll('.occasion-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    const occasionClothes = clothes.filter(c => c.occasions.includes(occasion));

    if (occasionClothes.length === 0) {
        document.getElementById('suggestionDisplay').innerHTML =
            '<p>No clothes for this occasion yet! Upload some 😊</p>';
        return;
    }

    const tops = occasionClothes.filter(c => c.category === 'top');
    const bottoms = occasionClothes.filter(c => c.category === 'bottom');
    const dresses = occasionClothes.filter(c => c.category === 'dress');
    const shoes = occasionClothes.filter(c => c.category === 'shoes');
    const accessories = occasionClothes.filter(c => c.category === 'accessory');

    let suggestionHTML = '<div class="outfit-preview">';

    // Dress goes to bottom slot only
    if (dresses.length) {
        const dress = dresses[Math.floor(Math.random() * dresses.length)];
        suggestionHTML += `<div class="slot"><img src="${dress.image}" alt="dress"></div>`;
    } else {
        if (tops.length) {
            const top = tops[Math.floor(Math.random() * tops.length)];
            suggestionHTML += `<div class="slot"><img src="${top.image}" alt="top"></div>`;
        }

        if (bottoms.length) {
            const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
            suggestionHTML += `<div class="slot"><img src="${bottom.image}" alt="bottom"></div>`;
        }
    }

    if (shoes.length) {
        const shoe = shoes[Math.floor(Math.random() * shoes.length)];
        suggestionHTML += `<div class="slot"><img src="${shoe.image}" alt="shoes"></div>`;
    }

    if (accessories.length) {
        const acc = accessories[Math.floor(Math.random() * accessories.length)];
        suggestionHTML += `<div class="slot"><img src="${acc.image}" alt="accessory"></div>`;
    }

    suggestionHTML += `
        <h3>${occasion.charAt(0).toUpperCase() + occasion.slice(1)} Ready ✨</h3>
    </div>`;

    document.getElementById('suggestionDisplay').innerHTML = suggestionHTML;
}

// Save current outfit
function saveCurrentOutfit() {
    const name = document.getElementById('outfitName').value.trim() || 'Untitled Outfit';
    const items = Object.values(currentOutfit).filter(Boolean);
    
    if (items.length < 2) {
        alert('Please create an outfit with at least 2 items first!');
        return;
    }
    
    const newOutfit = {
        id: Date.now(),
        name,
        occasion: 'custom',
        items,
        date: new Date().toLocaleDateString()
    };
    
    outfits.unshift(newOutfit);
    saveData();
    renderSavedOutfits();
    document.getElementById('outfitName').value = '';
    alert('Outfit saved! 💾');
}

// Render saved outfits
function renderSavedOutfits() {
    const grid = document.getElementById('savedOutfits');
    grid.innerHTML = outfits.map(outfit => {
        const slotsHTML = outfit.items.map(item => 
            `<div class="slot"><img src="${item.image}" alt="${item.category}"></div>`
        ).join('');
        
        return `
            <div class="saved-card">
                <h4>${outfit.name}</h4>
                <p><small>${outfit.date} • ${outfit.items.length} items</small></p>
                <div class="outfit-slots">${slotsHTML}</div>
                <button class="delete-btn" onclick="deleteOutfit(${outfit.id})">Delete</button>
            </div>
        `;
    }).join('');
}

// Delete outfit
window.deleteOutfit = function(id) {
    if (confirm('Delete this outfit?')) {
        outfits = outfits.filter(o => o.id !== id);
        saveData();
        renderSavedOutfits();
    }
};

// Dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('darkToggle').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark);
}

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    document.getElementById('darkToggle').textContent = '☀️';
}

// Color matching bonus (simple complementary colors)
const complementaryColors = {
    'red': 'green',
    'blue': 'orange',
    'green': 'red',
    'orange': 'blue',
    'yellow': 'purple',
    'purple': 'yellow',
    'black': 'white',
    'white': 'black'
};

console.log('All features loaded! Features: Upload, Filter, Drag-Drop, Suggestions, Save, Dark Mode, Responsive 🎨✨');