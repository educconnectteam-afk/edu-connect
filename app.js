// Variables globales
let currentUser = null;
let posts = [];
let tags = [];
let conversations = [];
let currentChat = null;
let messages = [];
let messageInterval = null;
let typingTimeout = null;
let selectedParticipants = [];
let chatType = 'individual';
let currentFilter = 'all';

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('eduConnectUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUIForUser();
            showScreen('feed');
            loadPosts();
            initMessaging();
        } catch (e) {
            console.error('Erreur de parsing:', e);
            localStorage.removeItem('eduConnectUser');
            showScreen('login');
        }
    } else {
        showScreen('login');
    }
    
    setupEventListeners();
});

// Configuration des événements
function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchPosts();
        });
    }
    
    const postContent = document.getElementById('post-content');
    if (postContent) {
        postContent.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                createPost();
            }
        });
        
        postContent.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });
    
    // Recherche de conversations
    const convSearch = document.getElementById('conversation-search');
    if (convSearch) {
        convSearch.addEventListener('input', function(e) {
            filterConversationsBySearch(e.target.value);
        });
    }
    
    // Cacher les options d'attachement
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.attach-btn') && !e.target.closest('.attach-options')) {
            document.getElementById('attach-options').style.display = 'none';
        }
    });
}

// Fonctions d'affichage des écrans
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const screenElement = document.getElementById(`${screenName}-screen`);
    if (screenElement) {
        screenElement.classList.add('active');
    }
    
    if (screenName === 'feed' && currentUser) {
        loadPosts();
    }
    
    if (screenName === 'messages' && currentUser) {
        renderConversations();
    }
    
    updateBottomNavActive(screenName);
    closeMobileMenu();
}

function updateBottomNavActive(screenName) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    if (screenName === 'feed') {
        document.querySelector('.nav-item[onclick*="showScreen(\'feed\')"]')?.classList.add('active');
    } else if (screenName === 'messages') {
        document.querySelector('.nav-item[onclick*="showScreen(\'messages\')"]')?.classList.add('active');
    }
}

// Menu mobile
function toggleMobileMenu() {
    const overlay = document.getElementById('mobile-menu-overlay');
    const menu = document.getElementById('mobile-menu');
    const body = document.body;
    
    if (menu.classList.contains('active')) {
        closeMobileMenu();
    } else {
        menuScrollPosition = window.pageYOffset;
        menu.classList.add('active');
        overlay.classList.add('active');
        body.classList.add('menu-open');
        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${menuScrollPosition}px`;
        body.style.width = '100%';
    }
}

function closeMobileMenu() {
    const overlay = document.getElementById('mobile-menu-overlay');
    const menu = document.getElementById('mobile-menu');
    const body = document.body;
    
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
        overlay.classList.remove('active');
        body.classList.remove('menu-open');
        body.style.overflow = 'auto';
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        window.scrollTo(0, menuScrollPosition);
    }
}

let menuScrollPosition = 0;

document.getElementById('mobile-menu-overlay')?.addEventListener('click', closeMobileMenu);

// Connexion
function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    if (!email || !password) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    currentUser = {
        id: 101,
        name: email.split('@')[0],
        fullName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        email: email,
        username: email.split('@')[0],
        university: "Université Abdou Moumouni (UAM)",
        avatar: null,
        joinedDate: new Date().toISOString()
    };
    
    localStorage.setItem('eduConnectUser', JSON.stringify(currentUser));
    updateUIForUser();
    showScreen('feed');
    showNotification(`Bienvenue ${currentUser.fullName}`, 'success');
    initMessaging();
    
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

// Inscription
function register() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const university = document.getElementById('register-university').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    if (!name || !email || !username || !university || !password || !confirm) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (password !== confirm) {
        showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Le mot de passe doit faire au moins 6 caractères', 'error');
        return;
    }
    
    currentUser = {
        id: Date.now(),
        name: username,
        fullName: name,
        email: email,
        username: username,
        university: university,
        avatar: null,
        joinedDate: new Date().toISOString()
    };
    
    localStorage.setItem('eduConnectUser', JSON.stringify(currentUser));
    updateUIForUser();
    showScreen('feed');
    showNotification('Inscription réussie !', 'success');
    initMessaging();
    
    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-university').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-confirm').value = '';
}

// Déconnexion
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        currentUser = null;
        localStorage.removeItem('eduConnectUser');
        updateUIForUser();
        showScreen('login');
        closeMobileMenu();
        showNotification('Déconnexion réussie', 'info');
        
        if (messageInterval) clearInterval(messageInterval);
        conversations = [];
        currentChat = null;
    }
}

// Mettre à jour l'interface utilisateur
function updateUIForUser() {
    const isLoggedIn = currentUser !== null;
    
    if (isLoggedIn) {
        document.getElementById('menu-username').textContent = currentUser.fullName;
        document.getElementById('menu-useremail').textContent = currentUser.email;
        
        document.getElementById('menu-auth').style.display = 'none';
        document.getElementById('menu-logout').style.display = 'block';
        
        if (document.getElementById('profile-name')) {
            document.getElementById('profile-name').textContent = currentUser.fullName;
            document.getElementById('profile-university').textContent = currentUser.university;
        }
        
        document.getElementById('bottom-nav').style.display = 'flex';
    } else {
        document.getElementById('menu-username').textContent = 'Invité';
        document.getElementById('menu-useremail').textContent = 'Connectez-vous';
        
        document.getElementById('menu-auth').style.display = 'block';
        document.getElementById('menu-logout').style.display = 'none';
        
        document.getElementById('bottom-nav').style.display = 'none';
    }
}

// ========== GESTION DES POSTS ==========
function loadPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> Chargement...
        </div>
    `;
    
    setTimeout(() => {
        posts = [
            {
                id: 1,
                userId: 102,
                userName: "Ahmed Diop",
                userUniv: "Université Abdou Moumouni",
                content: "Quelqu'un aurait des ressources sur les algorithmes de machine learning ?",
                time: "Il y a 2 heures",
                likes: 24,
                comments: 8,
                shares: 3,
                tags: ["#MachineLearning"],
                hasImage: false
            },
            {
                id: 2,
                userId: 103,
                userName: "Fatou Sow",
                userUniv: "Université André Salifou",
                content: "Projet de recherche sur les énergies renouvelables. Qui est intéressé ?",
                time: "Il y a 5 heures",
                likes: 42,
                comments: 15,
                shares: 7,
                tags: ["#Energie", "#Projet"],
                hasImage: false
            },
            {
                id: 3,
                userId: 104,
                userName: "Moussa Koné",
                userUniv: "Université de Zinder",
                content: "Bibliothèque ouverte jusqu'à 22h cette semaine pour les révisions !",
                time: "Il y a 1 jour",
                likes: 56,
                comments: 12,
                shares: 10,
                tags: ["#Examen"],
                hasImage: false
            }
        ];
        
        renderPosts();
    }, 1000);
}

function renderPosts() {
    const postsContainer = document.getElementById('posts-container');
    
    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="no-posts">
                <i class="fas fa-comment-slash"></i>
                <h3>Aucune publication</h3>
                <p>Soyez le premier à publier !</p>
            </div>
        `;
        return;
    }
    
    let postsHTML = '';
    
    posts.forEach(post => {
        postsHTML += `
            <div class="post-card" id="post-${post.id}">
                <div class="post-header">
                    <div class="user-avatar" onclick="quickMessage(${post.userId})">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="post-info">
                        <strong>${post.userName}</strong>
                        <small>${post.userUniv} • ${post.time}</small>
                    </div>
                </div>
                
                <div class="post-content">
                    ${post.content}
                </div>
                
                ${post.tags ? `
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="post-stats">
                    <span>${post.likes} J'aime</span>
                    <span>${post.comments} Commentaires</span>
                    <span>${post.shares} Partages</span>
                </div>
                
                <div class="post-actions">
                    <button class="post-btn" onclick="likePost(${post.id})">
                        <i class="far fa-thumbs-up"></i> J'aime
                    </button>
                    <button class="post-btn" onclick="toggleComments(${post.id})">
                        <i class="far fa-comment"></i> Commenter
                    </button>
                    <button class="post-btn" onclick="sharePost(${post.id})">
                        <i class="fas fa-share"></i> Partager
                    </button>
                </div>
                
                <div class="post-comments" id="comments-${post.id}" style="display: none;">
                    <div class="comment-form">
                        <input type="text" class="comment-input" placeholder="Écrivez un commentaire..." id="comment-input-${post.id}">
                        <button class="btn btn-primary" onclick="addComment(${post.id})">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    postsContainer.innerHTML = postsHTML;
}

function createPost() {
    if (!currentUser) {
        showNotification('Connectez-vous pour publier', 'error');
        return;
    }
    
    const content = document.getElementById('post-content').value.trim();
    
    if (!content) {
        showNotification('Le post ne peut pas être vide', 'warning');
        return;
    }
    
    const newPost = {
        id: posts.length + 1,
        userId: currentUser.id,
        userName: currentUser.fullName,
        userUniv: currentUser.university,
        content: content,
        time: "À l'instant",
        likes: 0,
        comments: 0,
        shares: 0,
        tags: tags,
        hasImage: false
    };
    
    posts.unshift(newPost);
    document.getElementById('post-content').value = '';
    tags = [];
    updatePostTags();
    renderPosts();
    showNotification('Post publié !', 'success');
}

function createPostMobile() {
    if (!currentUser) {
        showNotification('Connectez-vous pour publier', 'error');
        return;
    }
    
    showScreen('feed');
    
    setTimeout(() => {
        const postInput = document.getElementById('post-content');
        if (postInput) {
            postInput.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, 300);
}

function addImage() {
    showNotification('Ajout d\'image - Fonctionnalité à venir', 'info');
}

function addTag() {
    const tag = prompt('Entrez un tag:');
    if (tag && tag.trim()) {
        const tagText = tag.trim().startsWith('#') ? tag.trim() : '#' + tag.trim();
        if (!tags.includes(tagText)) {
            tags.push(tagText);
            updatePostTags();
        }
    }
}

function updatePostTags() {
    const tagsContainer = document.getElementById('post-tags');
    if (tagsContainer) {
        if (tags.length > 0) {
            tagsContainer.innerHTML = tags.map(tag => `
                <span class="tag">
                    ${tag}
                    <button class="tag-remove" onclick="removeTag('${tag}')">
                        <i class="fas fa-times"></i>
                    </button>
                </span>
            `).join('');
        } else {
            tagsContainer.innerHTML = '';
        }
    }
}

function removeTag(tagToRemove) {
    tags = tags.filter(tag => tag !== tagToRemove);
    updatePostTags();
}

function likePost(postId) {
    if (!currentUser) {
        showNotification('Connectez-vous', 'error');
        return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.likes++;
        renderPosts();
    }
}

function toggleComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (commentsDiv) {
        commentsDiv.style.display = commentsDiv.style.display === 'none' ? 'block' : 'none';
    }
}

function addComment(postId) {
    if (!currentUser) {
        showNotification('Connectez-vous', 'error');
        return;
    }
    
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const comment = commentInput.value.trim();
    
    if (!comment) {
        showNotification('Commentaire vide', 'warning');
        return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.comments++;
        commentInput.value = '';
        renderPosts();
        showNotification('Commentaire ajouté', 'success');
    }
}

function sharePost(postId) {
    if (!currentUser) {
        showNotification('Connectez-vous', 'error');
        return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.shares++;
        renderPosts();
        showNotification('Publication partagée', 'success');
    }
}

function filterPosts(filter) {
    if (!currentUser) {
        showNotification('Connectez-vous', 'error');
        return;
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    showNotification(`Filtre: ${filter}`, 'info');
}

function searchPosts() {
    const query = document.getElementById('search-input').value.trim();
    if (query) {
        showNotification(`Recherche: ${query}`, 'info');
    }
}

function quickMessage(userId) {
    if (!currentUser) {
        showNotification('Connectez-vous', 'error');
        return;
    }
    
    showScreen('messages');
    createIndividualConversation(userId);
}

// ========== SYSTÈME DE MESSAGERIE ==========
function initMessaging() {
    if (!currentUser) return;
    
    loadConversations();
    startMessagePolling();
}

function loadConversations() {
    setTimeout(() => {
        conversations = [
            {
                id: 1,
                type: 'individual',
                name: 'Fatou Sow',
                lastMessage: 'Tu as vu les cours de maths ?',
                lastMessageTime: new Date(Date.now() - 2*60*60*1000).toISOString(),
                unread: 2,
                online: true,
                participants: [
                    { id: 101, name: 'Moussa Koné', role: 'user' },
                    { id: 103, name: 'Fatou Sow', role: 'user' }
                ]
            },
            {
                id: 2,
                type: 'group',
                name: 'L3 Informatique',
                description: 'Groupe de la promotion',
                lastMessage: 'Rendez-vous à 14h',
                lastMessageTime: new Date(Date.now() - 5*60*60*1000).toISOString(),
                unread: 5,
                participants: [
                    { id: 101, name: 'Moussa Koné', role: 'admin' },
                    { id: 103, name: 'Fatou Sow', role: 'user' },
                    { id: 102, name: 'Ahmed Diop', role: 'user' },
                    { id: 104, name: 'Aïcha Diallo', role: 'user' }
                ]
            },
            {
                id: 3,
                type: 'individual',
                name: 'Ahmed Diop',
                lastMessage: 'Merci pour les ressources !',
                lastMessageTime: new Date(Date.now() - 24*60*60*1000).toISOString(),
                unread: 0,
                online: false,
                participants: [
  { id: 101, name: 'Moussa Koné', role: 'user' },
                    { id: 102, name: 'Ahmed Diop', role: 'user' }
                ]
            }
        ];
        
        updateMessageBadges();
        renderConversations();
    }, 500);
}

function updateMessageBadges() {
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread || 0), 0);
    
    document.getElementById('menu-messages-badge').textContent = totalUnread;
    document.getElementById('bottom-messages-badge').textContent = totalUnread;
    
    if (totalUnread === 0) {
        document.getElementById('menu-messages-badge').style.display = 'none';
        document.getElementById('bottom-messages-badge').style.display = 'none';
    } else {
        document.getElementById('menu-messages-badge').style.display = 'inline';
        document.getElementById('bottom-messages-badge').style.display = 'inline';
    }
}

function renderConversations(filter = 'all') {
    const container = document.getElementById('conversations-list');
    if (!container) return;
    
    let filteredConvs = conversations;
    
    if (filter === 'individual') {
        filteredConvs = conversations.filter(c => c.type === 'individual');
    } else if (filter === 'groups') {
        filteredConvs = conversations.filter(c => c.type === 'group');
    }
    
    if (filteredConvs.length === 0) {
        container.innerHTML = `
            <div class="no-conversations">
                <i class="fas fa-comments"></i>
                <p>Aucune conversation</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    filteredConvs.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    
    filteredConvs.forEach(conv => {
        const isActive = currentChat && currentChat.id === conv.id;
        const lastMessageTime = formatMessageTime(conv.lastMessageTime);
        const avatar = conv.type === 'group' ? 'fa-users' : 'fa-user-circle';
        
        html += `
            <div class="conversation-item ${isActive ? 'active' : ''}" onclick="selectConversation(${conv.id})">
                <div class="conversation-avatar ${conv.type}">
                    <i class="fas ${avatar}"></i>
                    ${conv.type === 'individual' && conv.online ? '<span class="online-indicator"></span>' : ''}
                </div>
                <div class="conversation-info">
                    <h4>
                        ${conv.name}
                        ${conv.type === 'group' ? '<span class="group-badge">Groupe</span>' : ''}
                    </h4>
                    <p>${conv.lastMessage || 'Aucun message'}</p>
                </div>
                <div class="conversation-meta">
                    <span class="conversation-time">${lastMessageTime}</span>
                    ${conv.unread > 0 ? `<span class="unread-badge">${conv.unread}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function filterConversations(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.conv-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderConversations(filter);
}

function filterConversationsBySearch(query) {
    if (!query) {
        renderConversations(currentFilter);
        return;
    }
    
    const filtered = conversations.filter(conv => 
        conv.name.toLowerCase().includes(query.toLowerCase())
    );
    
    const container = document.getElementById('conversations-list');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-conversations">Aucun résultat</div>';
        return;
    }
    
    let html = '';
    filtered.forEach(conv => {
        const lastMessageTime = formatMessageTime(conv.lastMessageTime);
        const avatar = conv.type === 'group' ? 'fa-users' : 'fa-user-circle';
        
        html += `
            <div class="conversation-item" onclick="selectConversation(${conv.id})">
                <div class="conversation-avatar ${conv.type}">
                    <i class="fas ${avatar}"></i>
                </div>
                <div class="conversation-info">
                    <h4>${conv.name}</h4>
                    <p>${conv.lastMessage || 'Aucun message'}</p>
                </div>
                <div class="conversation-meta">
                    <span class="conversation-time">${lastMessageTime}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function selectConversation(conversationId) {
    currentChat = conversations.find(c => c.id === conversationId);
    
    if (!currentChat) return;
    
    currentChat.unread = 0;
    updateMessageBadges();
    
    document.getElementById('no-chat-selected').style.display = 'none';
    document.getElementById('chat-active').style.display = 'flex';
    
    document.getElementById('chat-name').textContent = currentChat.name;
    document.getElementById('chat-status').textContent = getChatStatus();
    
    if (currentChat.type === 'group') {
        document.getElementById('chat-avatar').innerHTML = '<i class="fas fa-users"></i>';
    } else {
        document.getElementById('chat-avatar').innerHTML = '<i class="fas fa-user-circle"></i>';
    }
    
    if (window.innerWidth <= 768) {
        document.querySelector('.conversations-sidebar').style.display = 'none';
        document.querySelector('.chat-area').classList.add('active');
    }
    
    loadMessages(conversationId);
    renderConversations(currentFilter);
}

function loadMessages(conversationId) {
    const container = document.getElementById('messages-container');
    
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> Chargement...
        </div>
    `;
    
    setTimeout(() => {
        messages = generateMockMessages(conversationId);
        renderMessages();
    }, 500);
}

function generateMockMessages(conversationId) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
        {
            id: 1,
            conversationId: conversationId,
            senderId: 103,
            senderName: 'Fatou Sow',
            content: 'Salut ! Tu as vu les derniers cours ?',
            time: new Date(yesterday.setHours(14, 30)),
            type: 'text',
            read: true
        },
        {
            id: 2,
            conversationId: conversationId,
            senderId: 101,
            senderName: 'Moussa Koné',
            content: 'Oui, super intéressant !',
            time: new Date(yesterday.setHours(14, 32)),
            type: 'text',
            read: true
        },
        {
            id: 3,
            conversationId: conversationId,
            senderId: 103,
            senderName: 'Fatou Sow',
            content: 'J\'ai trouvé un super tutoriel',
            time: new Date(yesterday.setHours(14, 33)),
            type: 'text',
            read: true
        },
        {
            id: 4,
            conversationId: conversationId,
            senderId: 101,
            senderName: 'Moussa Koné',
            content: 'Merci beaucoup !',
            time: new Date(now.setHours(9, 15)),
            type: 'text',
            read: false
        }
    ];
}

function renderMessages() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="no-messages">
                <p>Aucun message. Commencez la conversation !</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    let lastDate = null;
    
    messages.forEach(msg => {
        const msgDate = new Date(msg.time).toDateString();
        
        if (msgDate !== lastDate) {
            html += `
                <div class="message-date">
                    <span>${formatMessageDate(msg.time)}</span>
                </div>
            `;
            lastDate = msgDate;
        }
        
        const isOwn = msg.senderId === currentUser?.id;
        const time = formatMessageHour(msg.time);
        
        html += `
            <div class="message ${isOwn ? 'own' : ''}">
                ${!isOwn ? `
                    <div class="message-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                ` : ''}
                <div class="message-content">
                    ${!isOwn && currentChat?.type === 'group' ? `
                        <div class="message-sender">${msg.senderName}</div>
                    ` : ''}
                    
                    <div class="message-text">${msg.content}</div>
                    
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    if (!currentUser || !currentChat) {
        showNotification('Sélectionnez une conversation', 'error');
        return;
    }
    
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (!content) return;
    
    const newMessage = {
        id: messages.length + 1,
        conversationId: currentChat.id,
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        content: content,
        time: new Date(),
        type: 'text',
        read: false
    };
    
    messages.push(newMessage);
    
    const conversation = conversations.find(c => c.id === currentChat.id);
    if (conversation) {
        conversation.lastMessage = content;
        conversation.lastMessageTime = new Date().toISOString();
    }
    
    renderMessages();
    renderConversations(currentFilter);
    
    input.value = '';
    input.style.height = 'auto';
    
    simulateReply();
}

function simulateReply() {
    setTimeout(() => {
        if (!currentChat) return;
        
        const replies = [
            "Intéressant !",
            "D'accord",
            "Merci pour l'info",
            "On en parle plus tard ?"
        ];
        
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        const replyMessage = {
            id: messages.length + 1,
            conversationId: currentChat.id,
            senderId: 103,
            senderName: 'Fatou Sow',
            content: randomReply,
            time: new Date(),
            type: 'text',
            read: false
        };
        
        messages.push(replyMessage);
        
        const conversation = conversations.find(c => c.id === currentChat.id);
        if (conversation) {
            conversation.lastMessage = randomReply;
            conversation.lastMessageTime = new Date().toISOString();
            conversation.unread = (conversation.unread || 0) + 1;
        }
        
        renderMessages();
        renderConversations(currentFilter);
        updateMessageBadges();
        
        showNotification('Nouveau message', 'info');
    }, 3000);
}

function handleMessageKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
    
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    
    showTypingIndicator();
}

function showTypingIndicator() {
    clearTimeout(typingTimeout);
    
    typingTimeout = setTimeout(() => {}, 1000);
}

function attachFile(type) {
    if (!currentChat) {
        showNotification('Sélectionnez une conversation', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    
    if (type === 'image') {
        input.accept = 'image/*';
    } else if (type === 'pdf') {
        input.accept = '.pdf';
    }
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadFile(file);
        }
    };
    
    input.click();
    document.getElementById('attach-options').style.display = 'none';
}

function uploadFile(file) {
    showNotification('Upload...', 'info');
    
    setTimeout(() => {
        const fileMessage = {
            id: messages.length + 1,
            conversationId: currentChat.id,
            senderId: currentUser.id,
            senderName: currentUser.fullName,
            content: `Fichier: ${file.name}`,
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            fileUrl: URL.createObjectURL(file),
            time: new Date(),
            type: file.type.startsWith('image/') ? 'image' : 'file'
        };
        
        messages.push(fileMessage);
        
        const conversation = conversations.find(c => c.id === currentChat.id);
        if (conversation) {
            conversation.lastMessage = `📎 ${file.name}`;
            conversation.lastMessageTime = new Date().toISOString();
        }
        
        renderMessages();
        renderConversations(currentFilter);
        
        showNotification('Fichier envoyé', 'success');
    }, 1500);
}

function showAttachOptions() {
    const options = document.getElementById('attach-options');
    options.style.display = options.style.display === 'none' ? 'flex' : 'none';
}

function startMessagePolling() {
    if (messageInterval) clearInterval(messageInterval);
    
    messageInterval = setInterval(() => {
        if (currentChat) {
            console.log('Polling...');
        }
    }, 5000);
}

function showNewChatModal() {
    document.getElementById('new-chat-modal').style.display = 'flex';
    loadRecentUsers();
}

function hideNewChatModal() {
    document.getElementById('new-chat-modal').style.display = 'none';
    resetNewChatForm();
}

function loadRecentUsers() {
    const recentUsers = [
        { id: 103, name: 'Fatou Sow', university: 'UAM', online: true },
        { id: 102, name: 'Ahmed Diop', university: 'UAS', online: false },
        { id: 104, name: 'Aïcha Diallo', university: 'UJH', online: true },
        { id: 105, name: 'Ibrahim Kane', university: 'UDDM', online: false }
    ];
    
    const container = document.getElementById('recent-users-list');
    if (!container) return;
    
    let html = '';
    recentUsers.forEach(user => {
        html += `
            <div class="recent-user-item" onclick="selectUser(${user.id})">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-info">
                    <strong>${user.name}</strong>
                    <small>${user.university}</small>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function selectChatType(type) {
    chatType = type;
    
    document.querySelectorAll('.chat-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.getElementById('individual-chat-form').style.display = 
        type === 'individual' ? 'block' : 'none';
    document.getElementById('group-chat-form').style.display = 
        type === 'group' ? 'block' : 'none';
}

function selectUser(userId) {
    if (chatType === 'individual') {
        createIndividualConversation(userId);
        hideNewChatModal();
    } else {
        addParticipant(userId);
    }
}

function addParticipant(userId) {
    if (selectedParticipants.some(p => p.id === userId)) {
        showNotification('Déjà ajouté', 'warning');
        return;
    }
    
    const user = {
        id: userId,
        name: userId === 103 ? 'Fatou Sow' : 
              userId === 102 ? 'Ahmed Diop' : 'Utilisateur'
    };
    
    selectedParticipants.push(user);
    renderSelectedParticipants();
}

function renderSelectedParticipants() {
    const container = document.getElementById('selected-participants');
    
    if (selectedParticipants.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    selectedParticipants.forEach(participant => {
        html += `
            <span class="selected-tag">
                ${participant.name}
                <button onclick="removeParticipant(${participant.id})">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `;
    });
    
    container.innerHTML = html;
}

function removeParticipant(participantId) {
    selectedParticipants = selectedParticipants.filter(p => p.id !== participantId);
    renderSelectedParticipants();
}

function createConversation() {
    if (chatType === 'individual') {
        showNotification('Sélectionnez un utilisateur', 'info');
    } else {
        createGroupConversation();
    }
}

function createIndividualConversation(userId) {
    const existingConv = conversations.find(c => 
        c.type === 'individual' && 
        c.participants.some(p => p.id === userId)
    );
    
    if (existingConv) {
        selectConversation(existingConv.id);
        showScreen('messages');
        return;
    }
    const userName = userId === 103 ? 'Fatou Sow' : 
                     userId === 102 ? 'Ahmed Diop' : 'Nouvel utilisateur';
    
    const newConversation = {
        id: conversations.length + 1,
        type: 'individual',
        name: userName,
        lastMessage: 'Nouvelle conversation',
        lastMessageTime: new Date().toISOString(),
        unread: 0,
        online: true,
        participants: [
            { id: currentUser.id, name: currentUser.fullName, role: 'user' },
            { id: userId, name: userName, role: 'user' }
        ]
    };
    
    conversations.push(newConversation);
    selectConversation(newConversation.id);
    showScreen('messages');
    showNotification('Conversation créée', 'success');
}

function createGroupConversation() {
    const groupName = document.getElementById('group-name').value.trim();
    
    if (!groupName) {
        showNotification('Donnez un nom au groupe', 'error');
        return;
    }
    
    if (selectedParticipants.length === 0) {
        showNotification('Ajoutez au moins un participant', 'error');
        return;
    }
    
    const allParticipants = [
        { id: currentUser.id, name: currentUser.fullName, role: 'admin' },
        ...selectedParticipants.map(p => ({ ...p, role: 'user' }))
    ];
    
    const newGroup = {
        id: conversations.length + 1,
        type: 'group',
        name: groupName,
        lastMessage: 'Groupe créé',
        lastMessageTime: new Date().toISOString(),
        unread: 0,
        participants: allParticipants
    };
    
    conversations.push(newGroup);
    selectConversation(newGroup.id);
    hideNewChatModal();
    showScreen('messages');
    showNotification('Groupe créé', 'success');
}

function resetNewChatForm() {
    selectedParticipants = [];
    chatType = 'individual';
    document.getElementById('group-name').value = '';
    document.getElementById('selected-participants').innerHTML = '';
    
    document.querySelectorAll('.chat-type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes('individual')) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById('individual-chat-form').style.display = 'block';
    document.getElementById('group-chat-form').style.display = 'none';
}

function showChatDetails() {
    if (!currentChat) return;
    
    const detailsScreen = document.getElementById('chat-details-screen');
    const mainScreen = document.getElementById('messages-screen');
    
    document.getElementById('details-chat-name').textContent = currentChat.name;
    document.getElementById('details-chat-type').textContent = 
        currentChat.type === 'group' ? 'Groupe' : 'Conversation';
    document.getElementById('participants-count').textContent = 
        `(${currentChat.participants.length})`;
    
    if (currentChat.type === 'group') {
        document.getElementById('details-avatar').innerHTML = '<i class="fas fa-users"></i>';
    } else {
        document.getElementById('details-avatar').innerHTML = '<i class="fas fa-user-circle"></i>';
    }
    
    renderParticipants();
    renderSharedMedia();
    
    mainScreen.classList.remove('active');
    detailsScreen.classList.add('active');
}

function hideChatDetails() {
    document.getElementById('chat-details-screen').classList.remove('active');
    document.getElementById('messages-screen').classList.add('active');
}

function renderParticipants() {
    const container = document.getElementById('participants-list');
    if (!container || !currentChat) return;
    
    let html = '';
    currentChat.participants.forEach(participant => {
        html += `
            <div class="participant-item">
                <div class="participant-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="participant-info">
                    <strong>${participant.name}</strong>
                    <small>${participant.role === 'admin' ? 'Admin' : 'Membre'}</small>
                </div>
                ${participant.id !== currentUser.id ? `
                    <button class="participant-action" onclick="messageParticipant(${participant.id})">
                        <i class="fas fa-envelope"></i>
                    </button>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderSharedMedia() {
    const container = document.getElementById('shared-media');
    if (!container || !currentChat) return;
    
    container.innerHTML = '<p class="no-media">Aucun média partagé</p>';
}

function hideChatOnMobile() {
    document.querySelector('.conversations-sidebar').style.display = 'block';
    document.querySelector('.chat-area').classList.remove('active');
}

function searchUsers(query) {
    if (!query) {
        document.getElementById('search-results').innerHTML = '';
        return;
    }
    
    const results = [
        { id: 103, name: 'Fatou Sow', university: 'UAM' },
        { id: 102, name: 'Ahmed Diop', university: 'UAS' },
        { id: 106, name: 'Amadou Diallo', university: 'UAM' }
    ].filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
    
    let html = '';
    results.forEach(user => {
        html += `
            <div class="search-result-item" onclick="selectUser(${user.id})">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-info">
                    <strong>${user.name}</strong>
                    <small>${user.university}</small>
                </div>
            </div>
        `;
    });
    
    document.getElementById('search-results').innerHTML = html || '<p>Aucun résultat</p>';
}

function searchGroupUsers(query) {
    if (!query) {
        document.getElementById('group-search-results').innerHTML = '';
        return;
    }
    
    const results = [
        { id: 103, name: 'Fatou Sow' },
        { id: 102, name: 'Ahmed Diop' },
        { id: 104, name: 'Aïcha Diallo' }
    ].filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
    
    let html = '';
    results.forEach(user => {
        if (!selectedParticipants.some(p => p.id === user.id)) {
            html += `
                <div class="search-result-item" onclick="addParticipant(${user.id})">
                    <div class="user-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="user-info">
                        <strong>${user.name}</strong>
                    </div>
                </div>
            `;
        }
    });
    
    document.getElementById('group-search-results').innerHTML = html;
}

function messageParticipant(userId) {
    hideChatDetails();
    createIndividualConversation(userId);
}

function showAddParticipantModal() {
    showNotification('Recherche...', 'info');
}

function leaveGroup() {
    if (!currentChat || currentChat.type !== 'group') return;
    
    if (confirm('Quitter le groupe ?')) {
        conversations = conversations.filter(c => c.id !== currentChat.id);
        
        hideChatDetails();
        document.getElementById('messages-screen').classList.add('active');
        document.getElementById('no-chat-selected').style.display = 'flex';
        document.getElementById('chat-active').style.display = 'none';
        
        currentChat = null;
        renderConversations();
        showNotification('Groupe quitté', 'info');
    }
}

function getChatStatus() {
    if (!currentChat) return '';
    
    if (currentChat.type === 'group') {
        return `${currentChat.participants.length} participants`;
    } else {
        return currentChat.online ? 'En ligne' : 'Hors ligne';
    }
}

// ========== FORMATAGE ==========
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60 * 1000) return 'À l\'instant';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} min`;
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function formatMessageHour(timestamp) {
    return new Date(timestamp).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatMessageDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) return "Aujourd'hui";
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    
    return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ========== NOTIFICATIONS ==========
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    
    let bgColor = '#1877f2';
    if (type === 'error') bgColor = '#ff3b30';
    if (type === 'success') bgColor = '#34c759';
    if (type === 'warning') bgColor = '#ff9500';
    
    notification.style.backgroundColor = bgColor;
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// ========== EXPORTS ==========
window.showScreen = showScreen;
window.login = login;
window.register = register;
window.logout = logout;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.createPost = createPost;
window.createPostMobile = createPostMobile;
window.addImage = addImage;
window.addTag = addTag;
window.removeTag = removeTag;
window.likePost = likePost;
window.toggleComments = toggleComments;
window.addComment = addComment;
window.sharePost = sharePost;
window.filterPosts = filterPosts;
window.searchPosts = searchPosts;
window.quickMessage = quickMessage;

// Messagerie
window.selectConversation = selectConversation;
window.filterConversations = filterConversations;
window.sendMessage = sendMessage;
window.handleMessageKeydown = handleMessageKeydown;
window.showAttachOptions = showAttachOptions;
window.attachFile = attachFile;
window.showNewChatModal = showNewChatModal;
window.hideNewChatModal = hideNewChatModal;
window.selectChatType = selectChatType;
window.selectUser = selectUser;
window.removeParticipant = removeParticipant;
window.createConversation = createConversation;
window.showChatDetails = showChatDetails;
window.hideChatDetails = hideChatDetails;
window.hideChatOnMobile = hideChatOnMobile;
window.showAddParticipantModal = showAddParticipantModal;
window.leaveGroup = leaveGroup;
window.searchUsers = searchUsers;
window.searchGroupUsers = searchGroupUsers;
window.addParticipant = addParticipant;