/**
 * Dart & Flutter Expert Tutor - Frontend JavaScript
 * Handles UI interactions and API communication
 */

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// DOM Elements
const elements = {
    // Config Section
    apiKeyInput: document.getElementById('apiKey'),
    toggleApiKeyBtn: document.getElementById('toggleApiKey'),
    saveBtn: document.getElementById('saveBtn'),
    statusMessage: document.getElementById('statusMessage'),
    configSection: document.getElementById('configSection'),
    
    // Chat Section
    chatSection: document.getElementById('chatSection'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),
    
    // Quick Actions
    quickBtns: document.querySelectorAll('.quick-btn'),
    
    // Sidebar Tools
    refreshDocsBtn: document.getElementById('refreshDocsBtn'),
    clearCacheBtn: document.getElementById('clearCacheBtn'),
    docsInfo: document.getElementById('docsInfo'),
    cacheInfo: document.getElementById('cacheInfo'),
    apiStatus: document.getElementById('apiStatus'),
    contextStatus: document.getElementById('contextStatus'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay')
};

// State
let isTutorReady = false;

/**
 * Show/Hide loading overlay
 */
function toggleLoading(show) {
    elements.loadingOverlay.classList.toggle('active', show);
}

/**
 * Show status message
 */
function showStatus(message, type = 'success') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message ${type}`;
    
    setTimeout(() => {
        elements.statusMessage.style.display = 'none';
    }, 5000);
}

/**
 * Toggle API key visibility
 */
elements.toggleApiKeyBtn.addEventListener('click', () => {
    const input = elements.apiKeyInput;
    input.type = input.type === 'password' ? 'text' : 'password';
});

/**
 * Save API key and initialize tutor
 */
elements.saveBtn.addEventListener('click', async () => {
    const apiKey = elements.apiKeyInput.value.trim();
    
    if (!apiKey) {
        showStatus('الرجاء إدخال مفتاح API', 'error');
        return;
    }
    
    toggleLoading(true);
    
    try {
        // Save API key
        const saveResponse = await fetch(`${API_BASE}/config/save-api-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey })
        });
        
        const saveResult = await saveResponse.json();
        
        if (!saveResult.success) {
            showStatus(saveResult.message, 'error');
            toggleLoading(false);
            return;
        }
        
        // Initialize tutor
        const initResponse = await fetch(`${API_BASE}/tutor/initialize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const initResult = await initResponse.json();
        
        if (initResult.success) {
            isTutorReady = true;
            elements.configSection.style.display = 'none';
            elements.chatSection.style.display = 'grid';
            updateSystemStatus();
            showStatus(initResult.message, 'success');
        } else {
            showStatus(initResult.message, 'error');
        }
    } catch (error) {
        showStatus(`خطأ في الاتصال: ${error.message}`, 'error');
    } finally {
        toggleLoading(false);
    }
});

/**
 * Send message to tutor
 */
async function sendMessage() {
    const question = elements.chatInput.value.trim();
    
    if (!question) return;
    
    if (!isTutorReady) {
        addMessage('يرجى تهيئة الخبير أولاً', 'assistant');
        return;
    }
    
    // Add user message to chat
    addMessage(question, 'user');
    elements.chatInput.value = '';
    
    // Show typing indicator
    const typingId = addTypingIndicator();
    
    try {
        const response = await fetch(`${API_BASE}/tutor/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
        
        const result = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        if (result.success) {
            addMessage(result.answer, 'assistant');
        } else {
            addMessage(`خطأ: ${result.message}`, 'assistant');
        }
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage(`خطأ في الاتصال: ${error.message}`, 'assistant');
    }
}

elements.sendBtn.addEventListener('click', sendMessage);
elements.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

/**
 * Add message to chat
 */
function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Parse markdown-like syntax for code blocks
    content = parseCodeBlocks(content);
    contentDiv.innerHTML = content;
    
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

/**
 * Parse code blocks in message
 */
function parseCodeBlocks(text) {
    // Convert ```dart code ``` to proper code blocks
    text = text.replace(/```(\w+)?\n([\s\S]+?)```/g, (match, lang, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Convert inline `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Add typing indicator
 */
function addTypingIndicator() {
    const id = `typing-${Date.now()}`;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = id;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<em>جاري الكتابة...</em>';
    
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    
    return id;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Quick action handlers
 */
elements.quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        
        switch (action) {
            case 'explain':
                elements.chatInput.value = 'اشرح مفهوم ';
                elements.chatInput.focus();
                elements.chatInput.setSelectionRange(11, 11);
                break;
                
            case 'exercise':
                elements.chatInput.value = 'أنشئ تمارين عن ';
                elements.chatInput.focus();
                elements.chatInput.setSelectionRange(15, 15);
                break;
                
            case 'analyze':
                elements.chatInput.value = 'حلل هذا الكود:\n```dart\n\n```';
                elements.chatInput.focus();
                const pos = elements.chatInput.value.indexOf('```dart') + 8;
                elements.chatInput.setSelectionRange(pos, pos);
                break;
        }
    });
});

/**
 * Refresh documentation
 */
elements.refreshDocsBtn.addEventListener('click', async () => {
    toggleLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/scrape/documentation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            elements.docsInfo.innerHTML = `<small>آخر تحديث: ${new Date().toLocaleString('ar')}</small>`;
            elements.contextStatus.textContent = '✓';
            addMessage('تم تحديث الوثائق بنجاح! الخبير الآن لديه أحدث المعلومات.', 'assistant');
        } else {
            addMessage(`فشل تحديث الوثائق: ${result.message}`, 'assistant');
        }
    } catch (error) {
        addMessage(`خطأ: ${error.message}`, 'assistant');
    } finally {
        toggleLoading(false);
    }
});

/**
 * Clear cache
 */
elements.clearCacheBtn.addEventListener('click', async () => {
    if (!confirm('هل أنت متأكد من مسح الذاكرة المؤقتة؟')) return;
    
    try {
        const response = await fetch(`${API_BASE}/cache/clear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            elements.cacheInfo.innerHTML = '<small>الحجم: 0 MB</small>';
            addMessage('تم مسح الذاكرة المؤقتة بنجاح', 'assistant');
        }
    } catch (error) {
        addMessage(`خطأ: ${error.message}`, 'assistant');
    }
});

/**
 * Update system status
 */
async function updateSystemStatus() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        const status = await response.json();
        
        elements.apiStatus.textContent = status.api_key_configured ? '✓' : '✗';
        elements.contextStatus.textContent = status.context_loaded ? '✓' : '⏳';
        
        if (status.cache_stats) {
            elements.cacheInfo.innerHTML = 
                `<small>الحجم: ${status.cache_stats.total_size_mb} MB</small>`;
        }
    } catch (error) {
        console.error('Error fetching status:', error);
    }
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Check if already configured
    try {
        const response = await fetch(`${API_BASE}/status`);
        const status = await response.json();
        
        if (status.tutor_initialized) {
            isTutorReady = true;
            elements.configSection.style.display = 'none';
            elements.chatSection.style.display = 'grid';
            updateSystemStatus();
        }
    } catch (error) {
        console.log('Server not ready yet');
    }
    
    // Update status periodically
    setInterval(updateSystemStatus, 30000); // Every 30 seconds
});
