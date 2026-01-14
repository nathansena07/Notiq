let notes = [];
let activeNoteId = null;

// Init
window.onload = function() {
    const saved = localStorage.getItem('notiq_data_v1');
    if (saved) {
        notes = JSON.parse(saved);
    }
    showHome();
};

function showHome() {
    activeNoteId = null;
    document.getElementById('view-home').classList.remove('hidden');
    document.getElementById('view-editor').classList.add('hidden');
    document.getElementById('nav-home').classList.add('active');
    renderDashboard();
    renderSidebarList();
    if (window.innerWidth <= 768) closeSidebar();
}

function renderDashboard() {
    const grid = document.getElementById('notes-grid');
    const empty = document.getElementById('empty-state');
    grid.innerHTML = '';

    if (notes.length === 0) {
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        notes.forEach(function(note) {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.onclick = function() { selectNote(note.id); };

            // Extrair um pequeno texto para preview (remove HTML)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.content;
            const previewText = tempDiv.innerText.substring(0, 80) + '...';

            card.innerHTML = '<h3 class="font-bold text-sm mb-2 truncate">' + (note.title ? note.title : 'Sem título') + '</h3>' +
                             '<p class="text-xs text-gray-400 overflow-hidden flex-1">' + previewText + '</p>' +
                             '<div class="text-[10px] text-gray-300 mt-2">' + note.date + '</div>'; 
            grid.appendChild(card);
        });
    }
}

function renderSidebarList() {
    const list = document.getElementById('sidebar-notes-list');
    list.innerHTML = '';
    notes.forEach(function(note) {
        const item = document.createElement('div');
        item.className = 'nav-item ' + (activeNoteId === note.id ? 'active' : '');
        item.onclick = function() { selectNote(note.id); };
        item.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="opacity-40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>' +
                         '<span class="truncate">' + (note.title ? note.title : 'Sem título') + '</span>'; 
        list.appendChild(item);
    });
}

function createNewNote() {
    const newNote = {
        id: Date.now().toString(),
        title: "",
        content: "",
        date: new Date().toLocaleDateString('pt-BR'),
        isYellow: false
    };
    notes.unshift(newNote);
    saveData();
    selectNote(newNote.id);
}

function selectNote(id) {
    activeNoteId = id;
    const note = notes.find(function(n) { return n.id === id; });

    document.getElementById('view-home').classList.add('hidden');
    document.getElementById('view-editor').classList.remove('hidden');
    document.getElementById('nav-home').classList.remove('active');

    document.getElementById('editor-title-input').value = note.title;
    document.getElementById('editor-body').innerHTML = note.content;
    document.getElementById('breadcrumb-title').innerText = (note.title ? note.title : 'Sem título');

    const wrapper = document.getElementById('canvas-wrapper');
    if (note.isYellow) wrapper.classList.add('note-yellow');
    else wrapper.classList.remove('note-yellow');

    renderSidebarList();
    if (window.innerWidth <= 768) closeSidebar();
}

function handleTitleChange(val) {
    const note = notes.find(function(n) { return n.id === activeNoteId; });
    if (note) {
        note.title = val;
        document.getElementById('breadcrumb-title').innerText = (val ? val : 'Sem título');
        saveData();
        renderSidebarList();
    }
}

document.getElementById('editor-body').addEventListener('input', saveContent);
// also listen to title input
document.getElementById('editor-title-input').addEventListener('input', saveContent);

function saveContent() {
    if (!activeNoteId) return;
    const note = notes.find(function(n) { return n.id === activeNoteId; });
    if (!note) return;
    // support both input and display (display is for mobile view)
    var titleInput = document.getElementById('editor-title-input');
    note.title = titleInput ? titleInput.value : (note.title || '');
    note.content = document.getElementById('editor-body').innerHTML;
    note.isYellow = document.getElementById('canvas-wrapper').classList.contains('note-yellow');
    note.date = new Date().toLocaleDateString('pt-BR');
    saveData();
    renderSidebarList();
    document.getElementById('breadcrumb-title').innerText = note.title || 'Sem título';
    updateTitleDisplayText();
}

// Update the mobile display element text to mirror the input
function updateTitleDisplayText() {
    var disp = document.getElementById('editor-title-display');
    var input = document.getElementById('editor-title-input');
    if (!disp) return;
    disp.innerText = input && input.value ? input.value : 'Sem título';
}

// Switch between display (wrapping) and input (editing) based on viewport
function setTitleMode() {
    var input = document.getElementById('editor-title-input');
    var disp = document.getElementById('editor-title-display');
    if (!input || !disp) return;
    if (window.innerWidth <= 768) {
        input.style.display = 'none';
        disp.style.display = 'block';
    } else {
        input.style.display = 'block';
        disp.style.display = 'none';
    }
}

// When user taps the wrapped title on mobile, switch to the input for editing
var titleDisplayEl = document.getElementById('editor-title-display');
if (titleDisplayEl) {
    titleDisplayEl.addEventListener('click', function() {
        var input = document.getElementById('editor-title-input');
        if (!input) return;
        this.style.display = 'none';
        input.style.display = 'block';
        input.focus();
    });
}

// When the input loses focus on mobile, return to display mode
var titleInputEl = document.getElementById('editor-title-input');
if (titleInputEl) {
    titleInputEl.addEventListener('blur', function() {
        if (window.innerWidth <= 768) {
            updateTitleDisplayText();
            var disp = document.getElementById('editor-title-display');
            if (disp) disp.style.display = 'block';
            this.style.display = 'none';
            saveContent();
        }
    });
}

// Ensure mode on resize
window.addEventListener('resize', setTitleMode);


function deleteCurrentNote() {
    if (confirm('Deseja realmente excluir esta nota?')) {
        notes = notes.filter(function(n) { return n.id !== activeNoteId; });
        saveData();
        showHome();
    }
}

function clearAll() {
    if (confirm('Deseja realmente apagar toda a anotação?')) {
        const titleEl = document.getElementById('editor-title-input');
        const bodyEl = document.getElementById('editor-body');
        titleEl.value = '';
        bodyEl.innerHTML = '';
        const note = notes.find(function(n) { return n.id === activeNoteId; });
        if (note) {
            note.title = '';
            note.content = '';
            note.date = new Date().toLocaleDateString('pt-BR');
            saveData();
            renderSidebarList();
            document.getElementById('breadcrumb-title').innerText = 'Sem título';
        }
    }
}

function togglePaperColor() {
    const wrapper = document.getElementById('canvas-wrapper');
    wrapper.classList.toggle('note-yellow');
    const note = notes.find(function(n) { return n.id === activeNoteId; });
    if (note) {
        note.isYellow = wrapper.classList.contains('note-yellow');
        saveData();
    }
}

function format(cmd) {
    document.execCommand(cmd, false, null);
    document.getElementById('editor-body').focus();
    saveContent();
}

function toggleSidebar() {
    const sb = document.querySelector('.sidebar');
    const bd = document.getElementById('sidebar-backdrop');
    if (sb.classList.contains('open')) {
        sb.classList.remove('open');
        bd.classList.add('hidden');
    } else {
        sb.classList.add('open');
        bd.classList.remove('hidden');
    }
}

function closeSidebar() {
    const sb = document.querySelector('.sidebar');
    const bd = document.getElementById('sidebar-backdrop');
    sb.classList.remove('open');
    bd.classList.add('hidden');
}

window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        document.querySelector('.sidebar').classList.remove('open');
        document.getElementById('sidebar-backdrop').classList.add('hidden');
        var btn = document.querySelector('.mobile-menu-btn'); if (btn) btn.style.setProperty('display','none');
    } else {
        var btn2 = document.querySelector('.mobile-menu-btn'); if (btn2) btn2.style.setProperty('display','inline-flex');
    }
});

// ensure menu button visibility on load
if (window.innerWidth <= 768) {
    var mbtn = document.querySelector('.mobile-menu-btn'); if (mbtn) mbtn.style.setProperty('display','inline-flex');
}

function saveData() {
    localStorage.setItem('notiq_data_v1', JSON.stringify(notes));
}
