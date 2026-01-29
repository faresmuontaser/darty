/**
 * Darty - Frontend Logic
 * Implements Chat History, Persistence and Sidebar Session Management
 */

const API_BASE = 'http://localhost:5000/api';

const elements = {
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),
    stopBtn: document.getElementById('stopBtn'),
    newChatBtn: document.getElementById('railNewChatBtn'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebar: document.getElementById('sidebar'),
    resizeHandle: document.getElementById('sidebarResizeHandle'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtnOverlay'),
    langToggleBtn: document.getElementById('langToggleBtnOverlay'),
    refreshDocsBtn: document.getElementById('refreshDocsBtnOverlay'),
    clearCacheBtn: document.getElementById('clearCacheBtnOverlay'),
    appContainer: document.getElementById('appContainer'),
    historyList: document.getElementById('historyList'),
    headerChatTitle: document.getElementById('headerChatTitle'),
    headerTitleArea: document.getElementById('headerTitleArea'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    progressBar: document.getElementById('topProgressBar')
};

// State
let isTutorReady = false;
let chats = JSON.parse(localStorage.getItem('darty_chats') || '[]');
let currentChatId = null;
let abortController = null;
let currentTheme = localStorage.getItem('darty_theme') || 'light';
let currentLang = localStorage.getItem('darty_lang') || 'ar';

const translations = {
    ar: {
        new_chat: 'محادثة جديدة',
        settings_title: 'الإعدادات',
        sync: 'تحديث البيانات',
        clear: 'تنظيف الذاكرة',
        history_label: 'المحفوظات',
        history_title: 'سجل المحادثات',
        theme_title: 'تبديل المظهر',
        lang_title: 'تغيير اللغة',
        stop_title: 'إيقاف',
        send_title: 'إرسال',
        placeholder: 'اكتب رسالتك لـ Darty...',
        stop: 'تم إيقاف توليد الإجابة.',
        error_init: 'يرجى الانتظار قليلاً للاتصال بالسيرفر...',
        typing: 'Darty يكتب...',
        welcome: 'أهلاً بك',
        welcome_msg: 'بماذا تفكر؟',
        toggle_sidebar: 'القائمة الجانبية'
    },
    en: {
        new_chat: 'New Chat',
        settings_title: 'Settings',
        sync: 'Sync Docs',
        clear: 'Clear Cache',
        history_label: 'History',
        history_title: 'Chat History',
        theme_title: 'Switch Appearance',
        lang_title: 'Change Language',
        stop_title: 'Stop',
        send_title: 'Send',
        placeholder: 'Message Darty...',
        stop: 'Generation stopped.',
        error_init: 'Please wait for server connection...',
        confirm_delete: 'Delete this chat permanently?',
        rename_prompt: 'Enter new chat title:',
        typing: 'Darty is typing...',
        welcome: 'Welcome',
        welcome_msg: "What's on your mind",
        toggle_sidebar: 'Toggle Sidebar'
    }
};

/**
 * Initialize Application
 */
async function initApp() {
    renderHistory();
    applyTheme(currentTheme);
    applyLanguage(currentLang);
    
    // Start with a new chat or the latest one
    if (chats.length > 0) {
        loadChat(chats[0].id);
    } else {
        createNewChat();
    }

    try {
        const response = await fetch(`${API_BASE}/status`);
        const status = await response.json();
        
        if (status.api_key_configured && !status.tutor_initialized) {
            try {
                const initResponse = await fetch(`${API_BASE}/tutor/initialize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const initResult = await initResponse.json();
                if (initResult.success) {
                    isTutorReady = true;
                }
            } catch (e) {
                console.log("Initialization retrying...");
                setTimeout(initApp, 2000);
            }
        } else if (status.tutor_initialized) {
            isTutorReady = true;
        }
    } catch (error) {
        console.log('Backend connection waiting...');
        setTimeout(initApp, 2000);
    }
}

/**
 * Chat Session Management
 */

function createNewChat() {
    currentChatId = Date.now().toString();
    const newChat = {
        id: currentChatId,
        title: 'محادثة جديدة',
        messages: [],
        timestamp: new Date().toISOString()
    };
    chats.unshift(newChat);
    saveToStorage();
    loadChat(currentChatId);
    // Don't render history twice, loadChat calls it
}

async function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    // Update Header Title
    elements.headerChatTitle.textContent = chat.title;
    
    elements.chatMessages.innerHTML = '';
    
    // Always enable renaming if a chat is loaded
    elements.headerChatTitle.setAttribute('contenteditable', 'true');
    elements.headerChatTitle.style.opacity = '1';

    if (chat.messages.length === 0) {
        showWelcomeScreen();
    } else {
        chat.messages.forEach(m => renderMessage(m.content, m.sender));
    }
    renderHistory();
}

function showWelcomeScreen() {
    elements.chatMessages.innerHTML = `
        <div class="welcome-screen">
            <span class="material-symbols-rounded" style="font-size: 80px; opacity: 0.1; margin-bottom: 2rem;">auto_awesome</span>
            <div class="logo-large">What's on your mind</div>
        </div>
    `;
    renderHistory();
}

function saveToStorage() {
    localStorage.setItem('darty_chats', JSON.stringify(chats));
}

function renderHistory() {
    elements.historyList.innerHTML = '';

    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        
        // Material icon for chat
        const icon = document.createElement('div');
        icon.className = 'chat-icon';
        icon.innerHTML = `<span class="material-symbols-rounded" style="font-size: 20px;">chat_bubble</span>`;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'chat-title';
        titleSpan.textContent = chat.title;
        
        item.onclick = () => loadChat(chat.id);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'item-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete';
        deleteBtn.innerHTML = `<span class="material-symbols-rounded" style="font-size: 18px;">delete</span>`;
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        };
        
        actionsDiv.appendChild(deleteBtn);
        item.appendChild(icon);
        item.appendChild(titleSpan);
        item.appendChild(actionsDiv);
        elements.historyList.appendChild(item);
        
        // Hide dividers for now for a cleaner list
        // const divider = document.createElement('div');
        // divider.className = 'm3-divider';
        // elements.historyList.appendChild(divider);
    });
}

/**
 * Manage Actions
 */

function renameChat(id, newTitle) {
    const targetId = id || currentChatId;
    if (!targetId) return;

    const chat = chats.find(c => c.id === targetId);
    if (!chat) return;
    
    if (newTitle && newTitle.trim()) {
        chat.title = newTitle.trim();
        saveToStorage();
        renderHistory();
    } else {
        // Revert header text if empty
        if (targetId === currentChatId) {
            elements.headerChatTitle.textContent = chat.title;
        }
    }
}

function deleteChat(id) {
    if (!confirm(translations[currentLang].confirm_delete)) return;
    
    chats = chats.filter(c => c.id !== id);
    saveToStorage();
    
    if (currentChatId === id) {
        if (chats.length > 0) {
            loadChat(chats[0].id);
        } else {
            createNewChat();
        }
    } else {
        renderHistory();
    }
}

function toggleSidebar() {
    elements.sidebar.classList.toggle('collapsed');
    
    // Reset width for transitions
    elements.sidebar.style.width = '';

    const settingsMenu = document.querySelector('.settings-fab-menu');
    if (elements.sidebar.classList.contains('collapsed')) {
        // Rail is 68px. Menu at 80px (outside rail)
        settingsMenu.style.insetInlineStart = '80px';
    } else {
        // Sidebar is 250px. Menu at 265px (outside sidebar)
        settingsMenu.style.insetInlineStart = '265px';
    }
}

function showProgress() {
    elements.progressBar.style.opacity = '1';
}

function hideProgress() {
    elements.progressBar.style.opacity = '0';
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('darty_theme', currentTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('themeIcon');
    if (!themeIcon) return;
    
    if (theme === 'dark') {
        themeIcon.textContent = 'light_mode';
    } else {
        themeIcon.textContent = 'dark_mode';
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    applyLanguage(currentLang);
    localStorage.setItem('darty_lang', currentLang);
}

function applyLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (translations[lang][key]) {
            el.setAttribute('title', translations[lang][key]);
        }
    });

    elements.chatInput.placeholder = translations[lang].placeholder;
    document.getElementById('langTextOverlay').textContent = lang === 'ar' ? 'EN' : 'AR';
    
    // Smart Layout Logic:
    // 1. Sidebar follows language direction (move Rail to right in AR)
    // 2. UI text inside Rail/Drawer/Header follows language
    // 3. Chat and Input always RTL for Arabic content
    
    const uiDir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', uiDir);
    elements.appContainer.setAttribute('dir', uiDir);
    
    // Adjust layout based on direction
    if (uiDir === 'rtl') {
        elements.appContainer.style.flexDirection = 'row-reverse';
    } else {
        elements.appContainer.style.flexDirection = 'row';
    }
    
    // Elements that follow UI language
    elements.sidebar.setAttribute('dir', uiDir);
    document.querySelector('.app-header-container').setAttribute('dir', uiDir);
    document.querySelector('.app-footer').setAttribute('dir', uiDir);
    elements.chatInput.setAttribute('dir', uiDir);
    
    // Elements that STAY RTL (Arabic content)
    elements.chatMessages.setAttribute('dir', 'rtl');

    renderHistory();
    
    // If on welcome screen, update the message
    if (!currentChatId) showWelcomeScreen();
}

/**
 * Messaging
 */

async function sendMessage() {
    const question = elements.chatInput.value.trim();
    if (!question) return;

    // Clear welcome screen if first message
    const currentChat = chats.find(c => c.id === currentChatId);
    if (currentChat && currentChat.messages.length === 0) {
        elements.chatMessages.innerHTML = '';
    }

    addMessageToCurrentChat(question, 'user');
    elements.chatInput.value = '';
    
    // Update Chat Title if it's the first message
    if (currentChat && currentChat.messages.length === 1) {
        currentChat.title = question.substring(0, 30) + (question.length > 30 ? '...' : '');
        renderHistory();
    }

    const typingId = addTypingIndicator();
    showProgress();
    
    // Toggle buttons
    elements.sendBtn.style.display = 'none';
    elements.stopBtn.style.display = 'flex';
    
    abortController = new AbortController();

    try {
        const response = await fetch(`${API_BASE}/tutor/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question }),
            signal: abortController.signal
        });
        
        const result = await response.json();
        removeTypingIndicator(typingId);
        
        if (result.success) {
            addMessageToCurrentChat(result.answer, 'assistant');
        } else {
            addMessageToCurrentChat(`خطأ: ${result.message}`, 'assistant');
        }
    } catch (error) {
        removeTypingIndicator(typingId);
        if (error.name === 'AbortError') {
            addMessageToCurrentChat('تم إيقاف توليد الإجابة.', 'assistant');
        } else {
            addMessageToCurrentChat(`خطأ في الاتصال: ${error.message}`, 'assistant');
        }
    } finally {
        elements.sendBtn.style.display = 'flex';
        elements.stopBtn.style.display = 'none';
        hideProgress();
        abortController = null;
    }
}

function stopGeneration() {
    if (abortController) {
        abortController.abort();
    }
}

function addMessageToCurrentChat(content, sender) {
    const chat = chats.find(c => c.id === currentChatId);
    if (chat) {
        chat.messages.push({ content, sender });
        saveToStorage();
        renderMessage(content, sender);
    }
}

function renderMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = parseMarkdown(content);
    
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

/**
 * Helpers
 */

function parseMarkdown(text) {
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/```(\w+)?\n([\s\S]+?)```/g, (match, lang, code) => {
        const uniqueId = `code-${Math.random().toString(36).substr(2, 9)}`;
        return `
            <div class="code-container">
                <button class="copy-btn" onclick="copyCode(this, '${uniqueId}')">نسخ</button>
                <pre><code id="${uniqueId}">${escapeHtml(code.trim())}</code></pre>
            </div>
        `;
    });
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/^\s*-\s(.*$)/gim, '<ul><li>$1</li></ul>');
    text = text.replace(/<\/ul>\n<ul>/g, ''); 
    text = text.replace(/\n/g, '<br>');
    return text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function copyCode(btn, codeId) {
    const code = document.getElementById(codeId).innerText;
    try {
        await navigator.clipboard.writeText(code);
        btn.textContent = 'تم النسخ!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = 'نسخ';
            btn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}

function addTypingIndicator() {
    const id = `typing-${Date.now()}`;
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = id;
    div.innerHTML = `<div class="message-content"><em>${translations[currentLang].typing}</em></div>`;
    elements.chatMessages.appendChild(div);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function toggleSettings() {
    elements.settingsOverlay.classList.toggle('active');
}

function closeSettings() {
    elements.settingsOverlay.classList.remove('active');
}

// Event Listeners
elements.sendBtn.onclick = sendMessage;
elements.stopBtn.onclick = stopGeneration;
elements.themeToggleBtn.onclick = () => { toggleTheme(); closeSettings(); };
elements.langToggleBtn.onclick = () => { toggleLanguage(); closeSettings(); };
elements.newChatBtn.onclick = createNewChat;
elements.sidebarToggle.onclick = toggleSidebar;

// elements.headerTitleArea.onclick removed for in-place edit
elements.chatInput.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

elements.refreshDocsBtn.onclick = async () => {
    closeSettings();
    showProgress();
    try {
        const response = await fetch(`${API_BASE}/scrape/documentation`, { method: 'POST' });
        const result = await response.json();
        if (result.success) alert(currentLang === 'ar' ? 'تم تحديث البيانات بنجاح!' : 'Data synced successfully!');
    } catch (e) { 
        alert(currentLang === 'ar' ? 'فشل التحديث' : 'Sync failed'); 
    } finally {
        hideProgress();
    }
};

elements.clearCacheBtn.onclick = async () => {
    closeSettings();
    if (confirm(translations[currentLang].confirm_delete)) {
        await fetch(`${API_BASE}/cache/clear`, { method: 'POST' });
        alert(currentLang === 'ar' ? 'تم المسح' : 'Cache cleared');
    }
};

elements.settingsBtn.onclick = toggleSettings;
elements.closeSettingsBtn.onclick = closeSettings;

elements.headerChatTitle.onclick = () => {
    document.querySelector('.floating-header').classList.add('editing');
    if (elements.headerChatTitle.textContent === 'محادثة جديدة' || elements.headerChatTitle.textContent === 'New Chat') {
        document.execCommand('selectAll', false, null);
    }
};

elements.headerChatTitle.onblur = () => {
    document.querySelector('.floating-header').classList.remove('editing');
    if (currentChatId) renameChat(currentChatId, elements.headerChatTitle.textContent);
};

elements.headerChatTitle.onkeydown = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        elements.headerChatTitle.blur();
    }
};

// Sidebar Resizing
let isResizing = false;

elements.resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.classList.add('resizing');
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
    let newWidth;
    
    if (isRTL) {
        newWidth = window.innerWidth - e.clientX;
    } else {
        newWidth = e.clientX;
    }
    
    if (newWidth >= 68 && newWidth < 600) {
        elements.sidebar.style.width = `${newWidth}px`;
        if (newWidth < 150) {
            elements.sidebar.classList.add('collapsed');
        } else {
            elements.sidebar.classList.remove('collapsed');
        }
    }
});

document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.classList.remove('resizing');
});

// Start
document.addEventListener('DOMContentLoaded', initApp);
