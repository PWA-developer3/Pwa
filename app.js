// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async function() {
    // Variables globales
    let currentUser = null;
    let selectedFiles = [];
    let currentFileView = null;
    let currentAction = null;
    let currentFolder = null;
    let db = null;
    let galleryFilesCache = [];
    let notifications = [];
    let activityLog = [];

    // Inicializar Bootstrap
    const toastEl = document.getElementById('toast');
    const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
    const fileModal = new bootstrap.Modal(document.getElementById('fileModal'));
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    const folderModal = new bootstrap.Modal(document.getElementById('folderModal'));
//*********
        // ==================== MODAL DE ARCHIVO: VER, COMENTAR, LIKE, DESCARGA, COMPARTIR, ELIMINAR ====================
const likeBtn = document.getElementById('likeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const deleteBtn = document.getElementById('deleteBtn');
const shareBtn = document.getElementById('shareBtn');

likeBtn.addEventListener('click', () => currentFileView && toggleLike(currentFileView.id));
downloadBtn.addEventListener('click', () => currentFileView && downloadFile(currentFileView.id));
deleteBtn.addEventListener('click', () => {
    showConfirmModal('Eliminar archivo', '¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.', () => deleteFile(currentFileView.id));
});
shareBtn.addEventListener('click', () => shareFileModal(currentFileView));

function viewFile(fileId, galleryIdx) {
    getFileById(fileId).then(file => {
        currentFileView = file;
        let idx = galleryIdx;
        if (typeof idx !== "number") {
            idx = galleryFilesCache.findIndex(f => f.id == fileId);
        }
        renderFileModal(file, idx);
        fileModal.show();
    }).catch(() => {
        showToast('Error', 'No se pudo cargar el archivo', true);
    });
}

function renderFileModal(file, idx) {
    document.getElementById('fileModalTitle').textContent = file.name;
    const modalContent = document.getElementById('fileModalContent');
    let mediaContent = '';
    if (file.type === 'image') {
        mediaContent = `<img src="data:image/jpeg;base64,${file.data}" class="img-fluid" alt="${file.name}" id="modalImage">`;
    } else {
        mediaContent = `
            <video controls class="w-100" style="max-height:420px;" id="modalVideo">
                <source src="data:video/mp4;base64,${file.data}" type="video/mp4">
                Tu navegador no soporta el elemento de video.
            </video>
        `;
    }
    let navControls = '';
    if (galleryFilesCache.length > 1) {
        navControls = `
            <div class="${file.type === 'image' ? 'photo-controls-bar' : 'video-controls-bar'} mb-2">
                <button class="btn btn-outline-secondary btn-sm" id="prevMediaBtn"><i class="bi bi-arrow-left"></i> Anterior</button>
                ${file.type === 'video' ? `
                    <button class="btn btn-outline-secondary btn-sm" id="playBtn"><i class="bi bi-play"></i></button>
                    <button class="btn btn-outline-secondary btn-sm" id="pauseBtn"><i class="bi bi-pause"></i></button>
                    <button class="btn btn-outline-secondary btn-sm" id="stopBtn"><i class="bi bi-stop"></i></button>
                    <button class="btn btn-outline-secondary btn-sm" id="backwardBtn"><i class="bi bi-skip-backward"></i></button>
                    <button class="btn btn-outline-secondary btn-sm" id="forwardBtn"><i class="bi bi-skip-forward"></i></button>
                ` : ''}
                <button class="btn btn-outline-secondary btn-sm" id="nextMediaBtn">Siguiente <i class="bi bi-arrow-right"></i></button>
            </div>
        `;
    } else if (file.type === 'video') {
        navControls = `
            <div class="video-controls-bar mb-2">
                <button class="btn btn-outline-secondary btn-sm" id="playBtn"><i class="bi bi-play"></i></button>
                <button class="btn btn-outline-secondary btn-sm" id="pauseBtn"><i class="bi bi-pause"></i></button>
                <button class="btn btn-outline-secondary btn-sm" id="stopBtn"><i class="bi bi-stop"></i></button>
                <button class="btn btn-outline-secondary btn-sm" id="backwardBtn"><i class="bi bi-skip-backward"></i></button>
                <button class="btn btn-outline-secondary btn-sm" id="forwardBtn"><i class="bi bi-skip-forward"></i></button>
            </div>
        `;
    }
    modalContent.innerHTML = `
        ${mediaContent}
        ${navControls}
        <hr>
        <div class="comments-section">
            <h6 class="mb-2">Comentarios</h6>
            <div id="commentsList"></div>
            <form id="commentForm" class="d-flex mt-2">
                <input id="commentInput" class="form-control form-control-sm me-2" type="text" placeholder="Escribe un comentario..." maxlength="300" required>
                <button type="submit" class="btn btn-primary btn-sm">Comentar</button>
            </form>
        </div>
    `;

    document.getElementById('fileLikesCount').textContent = file.likes ? file.likes.length : 0;
    document.getElementById('fileOwner').textContent = `Por: ${file.userName}`;
    document.getElementById('fileDate').textContent = new Date(file.uploadDate).toLocaleString();
    deleteBtn.style.display = (file.userEmail === currentUser.email || currentUser.isDeveloper) ? 'block' : 'none';
    const isLiked = file.likes && file.likes.includes(currentUser.email);
    likeBtn.className = isLiked ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline-primary';
    downloadBtn.style.display = (file.visibility === 'public' || (file.sharedWith && file.sharedWith.includes(currentUser.email)) || file.userEmail === currentUser.email) ? 'block' : 'none';

    if (galleryFilesCache.length > 1) {
        document.getElementById('prevMediaBtn').onclick = function() {
            let newIdx = (idx - 1 + galleryFilesCache.length) % galleryFilesCache.length;
            viewFile(galleryFilesCache[newIdx].id, newIdx);
        };
        document.getElementById('nextMediaBtn').onclick = function() {
            let newIdx = (idx + 1) % galleryFilesCache.length;
            viewFile(galleryFilesCache[newIdx].id, newIdx);
        };
    }
    if (file.type === 'video') {
        const video = document.getElementById('modalVideo');
        if (document.getElementById('playBtn')) document.getElementById('playBtn').onclick = () => video.play();
        if (document.getElementById('pauseBtn')) document.getElementById('pauseBtn').onclick = () => video.pause();
        if (document.getElementById('stopBtn')) document.getElementById('stopBtn').onclick = () => { video.pause(); video.currentTime = 0; };
        if (document.getElementById('backwardBtn')) document.getElementById('backwardBtn').onclick = () => { video.currentTime = Math.max(0, video.currentTime - 10); };
        if (document.getElementById('forwardBtn')) document.getElementById('forwardBtn').onclick = () => { video.currentTime = Math.min(video.duration, video.currentTime + 10); };
    }
    loadComments(file.id);
    document.getElementById('commentForm').onsubmit = function(e) {
        e.preventDefault();
        const input = document.getElementById('commentInput');
        const content = input.value.trim();
        if (content.length === 0) return;
        saveComment({
            fileId: parseInt(file.id),
            user: currentUser.fullName,
            email: currentUser.email,
            comment: content,
            date: new Date().toISOString()
        }).then(() => {
            input.value = '';
            addNotification(`Nuevo comentario en el archivo <b>${file.name}</b>`);
            logActivity('Comentario', file.name);
            loadComments(file.id);
        });
    };
}

function loadComments(fileId) {
    getCommentsByFileId(fileId).then(comments => {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;
        if (!comments || comments.length === 0) {
            commentsList.innerHTML = `<div class="text-muted small">No hay comentarios aún.</div>`;
            return;
        }
        commentsList.innerHTML = '';
        comments.sort((a,b)=>new Date(a.date)-new Date(b.date));
        comments.forEach(comment => {
            const div = document.createElement('div');
            div.className = "comment-item d-flex align-items-center gap-2 mb-2";
            // Mostrar avatar si existe
            let avatarSrc = "default-avatar.png";
            if (comment.email && comment.email !== currentUser.email) {
                getUserByEmail(comment.email).then(user => {
                    if (user && user.avatar) div.querySelector('img').src = user.avatar;
                });
            }
            // Avatar propio
            if (comment.email === currentUser.email && currentUser.avatar) avatarSrc = currentUser.avatar;
            div.innerHTML = `
                <img src="${avatarSrc}" class="avatar-xs border" style="margin-right:5px;">
                <div>
                    <strong>${comment.user}</strong>
                    <span class="text-muted small">${new Date(comment.date).toLocaleString()}</span>
                    <div>${comment.comment}</div>
                    ${comment.email === currentUser.email || currentUser.isDeveloper
                        ? `<button class="btn btn-link text-danger btn-sm p-0" onclick="window.deleteCommentFromModal(${comment.id}, ${fileId})"><i class="bi bi-x-circle"></i></button>`
                        : ''}
                </div>
            `;
            commentsList.appendChild(div);
        });
        window.deleteCommentFromModal = function(commentId, fileId) {
            deleteComment(commentId).then(() => loadComments(fileId));
        }
    });
}

// ==================== LIKE, DESCARGA, ELIMINAR ====================
function toggleLike(fileId) {
    getFileById(fileId).then(file => {
        file.likes = file.likes || [];
        if (file.likes.includes(currentUser.email)) {
            file.likes = file.likes.filter(email => email !== currentUser.email);
        } else {
            file.likes.push(currentUser.email);
        }
        return updateFile(file.id, { likes: file.likes });
    }).then(() => {
        loadGalleryFiles();
        if (currentFileView && currentFileView.id == fileId) viewFile(fileId);
    });
}
function downloadFile(fileId) {
    getFileById(fileId).then(file => {
        const a = document.createElement('a');
        a.href = file.type === 'image'
            ? 'data:image/jpeg;base64,'+file.data
            : 'data:video/mp4;base64,'+file.data;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        logActivity('Descarga', file.name);
    });
}
function deleteFile(fileId) {
    deleteFileFromDB(fileId).then(() => {
        showToast('Éxito', 'Archivo eliminado correctamente');
        logActivity('Eliminación de archivo', fileId);
        loadGalleryFiles();
        fileModal.hide();
    });
}

// ==================== COMPARTIR ARCHIVOS ====================
function shareFileModal(file) {
    document.getElementById('shareFileId').value = file.id;
    document.getElementById('shareEmail').value = '';
    new bootstrap.Modal(document.getElementById('shareModal')).show();
}
document.getElementById('shareForm').addEventListener('submit', function(e){
    e.preventDefault();
    const fileId = document.getElementById('shareFileId').value;
    const email = document.getElementById('shareEmail').value;
    if (!fileId || !email) {
        showToast('Error', 'Debes seleccionar un archivo y un usuario', true);
        return;
    }
    getFileById(fileId)
        .then(file => {
            if (!file.sharedWith) file.sharedWith = [];
            if (file.sharedWith.includes(email)) throw new Error('Ya compartido');
            file.sharedWith.push(email);
            return updateFile(file.id, { sharedWith: file.sharedWith });
        })
        .then(() => {
            showToast('Éxito', 'Archivo compartido correctamente');
            addNotification(`Te han compartido un archivo: <b>${fileId}</b>`);
            logActivity('Compartiste archivo', fileId);
            document.getElementById('shareModal').querySelector('.btn-close').click();
        })
        .catch(() => showToast('Error', 'No se pudo compartir el archivo', true));
});

// ==================== GESTIÓN DE USUARIOS (SOLO DESARROLLADOR) ====================
function loadUsersForManagement() {
    const usersTable = document.querySelector('#usersTable tbody');
    usersTable.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </td>
        </tr>
    `;
    getAllUsers().then(users => {
        users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (users.length === 0) {
            usersTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="bi bi-people display-6 text-muted"></i>
                        <p class="mt-2">No hay usuarios registrados</p>
                    </td>
                </tr>
            `;
            return;
        }
        usersTable.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>${user.country}</td>
                <td>${user.phone}</td>
                <td>
                    <span class="badge ${user.isActive ? 'bg-success' : 'bg-danger'}">
                        ${user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    ${user.isDeveloper ? '<span class="badge bg-primary ms-1">Desarrollador</span>' : ''}
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary edit-user-btn" data-user-email="${user.email}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn ${user.isActive ? 'btn-outline-danger' : 'btn-outline-success'} toggle-user-btn" data-user-email="${user.email}">
                            <i class="bi ${user.isActive ? 'bi-lock' : 'bi-unlock'}"></i>
                        </button>
                        <button class="btn btn-outline-danger delete-user-btn" data-user-email="${user.email}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            usersTable.appendChild(row);
        });
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', function() { editUser(this.dataset.userEmail); });
        });
        document.querySelectorAll('.toggle-user-btn').forEach(btn => {
            btn.addEventListener('click', function() { toggleUserStatus(this.dataset.userEmail); });
        });
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', function() { 
                showConfirmModal(
                    'Eliminar usuario',
                    '¿Seguro que quieres eliminar este usuario? Esta acción es irreversible y eliminará también todos sus archivos y carpetas.',
                    () => deleteUserCompletely(this.dataset.userEmail)
                );
            });
        });
    }).catch(() => {
        usersTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="bi bi-exclamation-triangle display-6 text-danger"></i>
                    <p class="mt-2">Error al cargar usuarios</p>
                </td>
            </tr>
        `;
    });
}
function editUser(userEmail) {
    showToast('Información', 'La edición de usuarios está en desarrollo', false);
}
function toggleUserStatus(userEmail) {
    getUserByEmail(userEmail)
        .then(user => updateUser(userEmail, { isActive: !user.isActive }))
        .then(() => {
            showToast('Éxito', 'Estado de usuario actualizado');
            loadUsersForManagement();
        })
        .catch(() => showToast('Error', 'No se pudo actualizar el usuario', true));
}
function deleteUserCompletely(userEmail) {
    getUserFiles(userEmail).then(files => {
        let promises = files.map(f => deleteFileFromDB(f.id));
        return Promise.all(promises);
    }).then(() => {
        return getUserFolders(userEmail).then(folders => {
            let promises = folders.map(f => deleteFolder(f.id));
            return Promise.all(promises);
        });
    }).then(() => {
        return deleteUserFromDB(userEmail);
    }).then(() => {
        showToast('Éxito', 'Usuario eliminado correctamente');
        loadUsersForManagement();
    }).catch(() => showToast('Error', 'No se pudo eliminar el usuario', true));
}

// ==================== HISTORIAL Y ACTIVIDAD ====================
function logActivity(action, details = '') {
    activityLog.unshift({ action, details, date: new Date() });
    renderActivityLog();
}
function renderActivityLog() {
    const logPanel = document.getElementById('activityLogPanel');
    logPanel.innerHTML = activityLog.length === 0 ? '<div class="p-3 text-muted">No hay actividad reciente</div>' :
      '<ul class="list-group">' +
      activityLog.map(log =>
        `<li class="list-group-item small">${log.action} ${log.details ? '— '+log.details : ''}<br><span class="text-muted">${new Date(log.date).toLocaleString()}</span></li>`
      ).join('') +
      '</ul>';
}

// ==================== NOTIFICACIONES INTERNAS ====================
function addNotification(message) {
    notifications.unshift({ message, date: new Date(), seen: false });
    renderNotifications();
}
function renderNotifications() {
    const notifIcon = document.getElementById('notifIcon');
    const notifPanel = document.getElementById('notifPanel');
    const unseen = notifications.filter(n => !n.seen).length;
    notifIcon.innerHTML = `<i class="bi bi-bell${unseen ? '-fill text-danger' : ''}"></i>${unseen ? '<span class="badge bg-danger">'+unseen+'</span>' : ''}`;
    notifPanel.innerHTML = notifications.length === 0 ? '<div class="p-3 text-muted">Sin notificaciones</div>' :
      notifications.map(n => `<div class="border-bottom p-2 small ${n.seen ? 'text-muted' : 'fw-bold'}">${n.message}<br><span class="small">${new Date(n.date).toLocaleString()}</span></div>`).join('');
}
document.getElementById('notifIcon').onclick = () => {
    notifications.forEach(n => n.seen = true);
    renderNotifications();
    document.getElementById('notifPanel').style.display = 'block';
};
document.body.addEventListener('click', function(e){
    if (!e.target.closest('#notifPanel') && !e.target.closest('#notifIcon')) {
        document.getElementById('notifPanel').style.display = 'none';
    }
});

// ==================== PERFIL USUARIO Y AVATAR ====================
document.getElementById('userAvatar').addEventListener('click', showProfileModal);

function showProfileModal() {
    document.getElementById('profileName').value = currentUser.fullName;
    document.getElementById('profileCountry').value = currentUser.country;
    document.getElementById('profilePhone').value = currentUser.phone;
    document.getElementById('profileAvatarPreview').src = currentUser.avatar || 'default-avatar.png';
    new bootstrap.Modal(document.getElementById('profileModal')).show();
}
document.getElementById('profileAvatar').addEventListener('change', function() {
    if (this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            document.getElementById('profileAvatarPreview').src = evt.target.result;
        };
        reader.readAsDataURL(this.files[0]);
    }
});
document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('profileName').value.trim();
    const country = document.getElementById('profileCountry').value;
    const phone = document.getElementById('profilePhone').value;
    const avatarFile = document.getElementById('profileAvatar').files[0];
    if (avatarFile) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            updateUser(currentUser.email, { fullName: name, country, phone, avatar: evt.target.result })
                .then(updated => {
                    currentUser = updated;
                    showToast('Perfil actualizado', 'Tu perfil se actualizó correctamente');
                    document.getElementById('userAvatar').src = updated.avatar;
                });
        };
        reader.readAsDataURL(avatarFile);
    } else {
        updateUser(currentUser.email, { fullName: name, country, phone })
            .then(updated => {
                currentUser = updated;
                showToast('Perfil actualizado', 'Tu perfil se actualizó correctamente');
            });
    }
});

// ==================== AYUDA Y CONTACTO ====================
const helpPanel = document.getElementById('helpPanel');
const helpOverlay = document.getElementById('helpOverlay');
const closeHelpBtn = document.getElementById('closeHelpBtn');
if (closeHelpBtn) closeHelpBtn.addEventListener('click', hideHelp);
if (helpOverlay) helpOverlay.addEventListener('click', hideHelp);

function showHelp() {
    if (helpPanel) helpPanel.style.display = 'block';
    if (helpOverlay) helpOverlay.style.display = 'block';
}
function hideHelp() {
    if (helpPanel) helpPanel.style.display = 'none';
    if (helpOverlay) helpOverlay.style.display = 'none';
}
const emailHelpForm = document.getElementById('emailHelpForm');
if (emailHelpForm)
    emailHelpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('helpName').value;
        window.location.href = `mailto:soporte@tudominio.com?subject=Consulta%20de%20ayuda%20de%20${encodeURIComponent(name)}&body=Por%20favor%20escriba%20su%20consulta%20aquí...`;
        hideHelp();
        this.reset();
        showToast('Éxito', 'Se ha abierto tu cliente de correo para enviar la consulta');
    });
const whatsappHelpForm = document.getElementById('whatsappHelpForm');
if (whatsappHelpForm)
    whatsappHelpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('helpWhatsappName').value;
        window.open(`https://wa.me/1234567890?text=Hola,%20soy%20${encodeURIComponent(name)}.%20Tengo%20una%20consulta%20sobre%20la%20aplicación...`, '_blank');
        hideHelp();
        this.reset();
        showToast('Éxito', 'Se ha abierto WhatsApp para enviar tu consulta');
    });

// ==================== LOGOUT Y CAMBIO DE MÓDULOS ====================
function logout() {
    logActivity('Cierre de sesión');
    currentUser = null;
    document.getElementById('mainPanel').style.display = 'none';
    document.getElementById('authPanel').style.display = '';
    document.getElementById('mainNav').style.display = 'none';
    document.getElementById('userNav').style.display = 'none';
    showToast('Sesión cerrada', 'Has cerrado sesión correctamente');
}
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

// Cambiar entre módulos/pestañas principales
function switchModule(moduleName) {
    const modules = ['galleryModule', 'foldersModule', 'shareModule', 'usersModule', 'activityModule'];
    modules.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const active = document.getElementById(moduleName + 'Module');
    if (active) active.style.display = '';
    document.querySelectorAll('.main-nav-link').forEach(link => link.classList.remove('active'));
    const navLink = document.querySelector(`.main-nav-link[data-module="${moduleName}"]`);
    if (navLink) navLink.classList.add('active');
}
document.querySelectorAll('.main-nav-link').forEach(link => {
    link.addEventListener('click', function() {
        switchModule(this.dataset.module);
    });
});

// ==================== PANEL PRINCIPAL: MOSTRAR AL INICIAR SESIÓN ====================
function showMainPanel(user) {
    currentUser = user;
    document.getElementById('authPanel').style.display = 'none';
    document.getElementById('mainPanel').style.display = '';
    document.getElementById('mainNav').style.display = '';
    document.getElementById('userNav').style.display = '';
    document.getElementById('userNameNav').textContent = user.fullName;
    document.getElementById('userAvatar').src = user.avatar || 'default-avatar.png';
    document.getElementById('navUsers').style.display = user.isDeveloper ? '' : 'none';
    switchModule('gallery');
    loadUserFolders();
    loadGalleryFiles();
    loadSharedFiles();
    renderNotifications();
    renderActivityLog();
    if (user.isDeveloper) loadUsersForManagement();
}

// ==================== ARCHIVOS COMPARTIDOS CONMIGO ====================
function loadSharedFiles() {
    const sharedFilesTable = document.querySelector('#sharedFilesTable tbody');
    sharedFilesTable.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </td>
        </tr>
    `;
    getAllFiles().then(files => {
        const sharedFiles = files.filter(file => file.sharedWith && file.sharedWith.includes(currentUser.email));
        if (sharedFiles.length === 0) {
            sharedFilesTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <i class="bi bi-folder-x display-6 text-muted"></i>
                        <p class="mt-2">No tienes archivos compartidos</p>
                    </td>
                </tr>
            `;
            return;
        }
        sharedFilesTable.innerHTML = '';
        sharedFiles.forEach(file => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${file.name}</td>
                <td>${file.userName}</td>
                <td>${new Date(file.uploadDate).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-shared-btn" data-file-id="${file.id}">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                </td>
            `;
            sharedFilesTable.appendChild(row);
        });
        document.querySelectorAll('.view-shared-btn').forEach(btn => {
            btn.addEventListener('click', function() { viewFile(this.dataset.fileId); });
        });
    }).catch(() => {
        sharedFilesTable.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <i class="bi bi-exclamation-triangle display-6 text-danger"></i>
                    <p class="mt-2">Error al cargar archivos compartidos</p>
                </td>
            </tr>
        `;
    });
}
    // ==================== BASE DE DATOS ====================
    await initDB();

    function initDB() {
        return new Promise((resolve, reject) => {
            const DB_NAME = 'mYpuB_DB';
            const DB_VERSION = 4;
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject('Error al abrir la base de datos');
            request.onsuccess = event => {
                db = event.target.result;
                setInterval(checkEmptyFolders, 60 * 60 * 1000);
                resolve(db);
            };
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'email' });
                    userStore.createIndex('email', 'email', { unique: true });
                    userStore.createIndex('isActive', 'isActive', { unique: false });
                    userStore.createIndex('isDeveloper', 'isDeveloper', { unique: false });
                }
                if (!db.objectStoreNames.contains('files')) {
                    const fileStore = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
                    fileStore.createIndex('userEmail', 'userEmail', { unique: false });
                    fileStore.createIndex('type', 'type', { unique: false });
                    fileStore.createIndex('visibility', 'visibility', { unique: false });
                    fileStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                    fileStore.createIndex('folderId', 'folderId', { unique: false });
                }
                if (!db.objectStoreNames.contains('folders')) {
                    const folderStore = db.createObjectStore('folders', { keyPath: 'id', autoIncrement: true });
                    folderStore.createIndex('userEmail', 'userEmail', { unique: false });
                    folderStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                if (!db.objectStoreNames.contains('comments')) {
                    const commentStore = db.createObjectStore('comments', { keyPath: 'id', autoIncrement: true });
                    commentStore.createIndex('fileId', 'fileId', { unique: false });
                    commentStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    // ==================== AUTENTICACIÓN ====================
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTabBtn = document.getElementById('loginTabBtn');
    const registerTabBtn = document.getElementById('registerTabBtn');
    const toRegisterLink = document.getElementById('toRegisterLink');
    const toLoginLink = document.getElementById('toLoginLink');

    loginTabBtn.addEventListener('click', function(){
        loginTabBtn.classList.add('active');
        registerTabBtn.classList.remove('active');
        loginForm.style.display = '';
        registerForm.style.display = 'none';
    });
    registerTabBtn.addEventListener('click', function(){
        registerTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
        registerForm.style.display = '';
        loginForm.style.display = 'none';
    });
    toRegisterLink.addEventListener('click', function(e){
        e.preventDefault();
        registerTabBtn.click();
    });
    toLoginLink.addEventListener('click', function(e){
        e.preventDefault();
        loginTabBtn.click();
    });

    document.getElementById('helpBtnLogin').addEventListener('click', showHelp);
    document.getElementById('helpBtnRegister').addEventListener('click', showHelp);

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        loginUser(email, password)
            .then(user => {
                if (!user.isActive) {
                    showToast('Error', 'Tu cuenta ha sido desactivada por el administrador', true);
                    return;
                }
                showMainPanel(user);
                logActivity('Inicio de sesión');
            })
            .catch(() => {
                showToast('Error', 'Credenciales incorrectas o usuario no registrado', true);
            });
    });

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateRegisterForm()) {
            const user = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                gender: document.getElementById('gender').value,
                country: document.getElementById('country').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value,
                isDeveloper: document.getElementById('password').value === 'Mpteen2025@&',
                avatar: "default-avatar.png",
                createdAt: new Date().toISOString(),
                isActive: true
            };
            registerUser(user)
                .then(() => {
                    showToast('Registro exitoso', 'Usuario registrado correctamente');
                    loginTabBtn.click();
                    document.getElementById('loginEmail').value = user.email;
                    document.getElementById('loginPassword').focus();
                })
                .catch(error => {
                    showToast('Error', 'Error al registrar el usuario: ' + error, true);
                });
        }
    });

    // ==================== TOAST ====================
    function showToast(title, message, isError = false) {
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        const toastHeader = toastEl.querySelector('.toast-header');
        if (isError) {
            toastHeader.classList.add('bg-danger', 'text-white');
            toastHeader.classList.remove('bg-success');
        } else {
            toastHeader.classList.add('bg-success', 'text-white');
            toastHeader.classList.remove('bg-danger');
        }
        toast.show();
    }

    // ==================== PAÍSES ====================
    loadCountries();
    function loadCountries() {
        const countries = [
            { name: 'Afghanistan', prefix: '+93' }, { name: 'Albania', prefix: '+355' }, { name: 'Algeria', prefix: '+213' },
            { name: 'Andorra', prefix: '+376' }, { name: 'Angola', prefix: '+244' }, { name: 'Antigua and Barbuda', prefix: '+1-268' },
            { name: 'Argentina', prefix: '+54' }, { name: 'Armenia', prefix: '+374' }, { name: 'Australia', prefix: '+61' },
            { name: 'Austria', prefix: '+43' }, { name: 'Azerbaijan', prefix: '+994' }, { name: 'Bahamas', prefix: '+1-242' },
            { name: 'Bahrain', prefix: '+973' }, { name: 'Bangladesh', prefix: '+880' }, { name: 'Barbados', prefix: '+1-246' },
            { name: 'Belarus', prefix: '+375' }, { name: 'Belgium', prefix: '+32' }, { name: 'Belize', prefix: '+501' },
            { name: 'Benin', prefix: '+229' }, { name: 'Bhutan', prefix: '+975' }, { name: 'Bolivia', prefix: '+591' },
            { name: 'Bosnia and Herzegovina', prefix: '+387' }, { name: 'Botswana', prefix: '+267' }, { name: 'Brazil', prefix: '+55' },
            { name: 'Brunei', prefix: '+673' }, { name: 'Bulgaria', prefix: '+359' }, { name: 'Burkina Faso', prefix: '+226' },
            { name: 'Burundi', prefix: '+257' }, { name: 'Cabo Verde', prefix: '+238' }, { name: 'Cambodia', prefix: '+855' },
            { name: 'Cameroon', prefix: '+237' }, { name: 'Canada', prefix: '+1' }, { name: 'Central African Republic', prefix: '+236' },
            { name: 'Chad', prefix: '+235' }, { name: 'Chile', prefix: '+56' }, { name: 'China', prefix: '+86' },
            { name: 'Colombia', prefix: '+57' }, { name: 'Comoros', prefix: '+269' }, { name: 'Congo', prefix: '+242' },
            { name: 'Costa Rica', prefix: '+506' }, { name: 'Croatia', prefix: '+385' }, { name: 'Cuba', prefix: '+53' },
            { name: 'Cyprus', prefix: '+357' }, { name: 'Czech Republic', prefix: '+420' }, { name: 'Denmark', prefix: '+45' },
            { name: 'Djibouti', prefix: '+253' }, { name: 'Dominica', prefix: '+1-767' }, { name: 'Dominican Republic', prefix: '+1-809' },
            { name: 'Ecuador', prefix: '+593' }, { name: 'Egypt', prefix: '+20' }, { name: 'El Salvador', prefix: '+503' },
            { name: 'Equatorial Guinea', prefix: '+240' }, { name: 'Eritrea', prefix: '+291' }, { name: 'Estonia', prefix: '+372' },
            { name: 'Eswatini', prefix: '+268' }, { name: 'Ethiopia', prefix: '+251' }, { name: 'Fiji', prefix: '+679' },
            { name: 'Finland', prefix: '+358' }, { name: 'France', prefix: '+33' }, { name: 'Gabon', prefix: '+241' },
            { name: 'Gambia', prefix: '+220' }, { name: 'Georgia', prefix: '+995' }, { name: 'Germany', prefix: '+49' },
            { name: 'Ghana', prefix: '+233' }, { name: 'Greece', prefix: '+30' }, { name: 'Grenada', prefix: '+1-473' },
            { name: 'Guatemala', prefix: '+502' }, { name: 'Guinea', prefix: '+224' }, { name: 'Guinea-Bissau', prefix: '+245' },
            { name: 'Guyana', prefix: '+592' }, { name: 'Haiti', prefix: '+509' }, { name: 'Honduras', prefix: '+504' },
            { name: 'Hungary', prefix: '+36' }, { name: 'Iceland', prefix: '+354' }, { name: 'India', prefix: '+91' },
            { name: 'Indonesia', prefix: '+62' }, { name: 'Iran', prefix: '+98' }, { name: 'Iraq', prefix: '+964' },
            { name: 'Ireland', prefix: '+353' }, { name: 'Israel', prefix: '+972' }, { name: 'Italy', prefix: '+39' },
            { name: 'Jamaica', prefix: '+1-876' }, { name: 'Japan', prefix: '+81' }, { name: 'Jordan', prefix: '+962' },
            { name: 'Kazakhstan', prefix: '+7' }, { name: 'Kenya', prefix: '+254' }, { name: 'Kiribati', prefix: '+686' },
            { name: 'Kuwait', prefix: '+965' }, { name: 'Kyrgyzstan', prefix: '+996' }, { name: 'Laos', prefix: '+856' },
            { name: 'Latvia', prefix: '+371' }, { name: 'Lebanon', prefix: '+961' }, { name: 'Lesotho', prefix: '+266' },
            { name: 'Liberia', prefix: '+231' }, { name: 'Libya', prefix: '+218' }, { name: 'Liechtenstein', prefix: '+423' },
            { name: 'Lithuania', prefix: '+370' }, { name: 'Luxembourg', prefix: '+352' }, { name: 'Madagascar', prefix: '+261' },
            { name: 'Malawi', prefix: '+265' }, { name: 'Malaysia', prefix: '+60' }, { name: 'Maldives', prefix: '+960' },
            { name: 'Mali', prefix: '+223' }, { name: 'Malta', prefix: '+356' }, { name: 'Marshall Islands', prefix: '+692' },
            { name: 'Mauritania', prefix: '+222' }, { name: 'Mauritius', prefix: '+230' }, { name: 'Mexico', prefix: '+52' },
            { name: 'Micronesia', prefix: '+691' }, { name: 'Moldova', prefix: '+373' }, { name: 'Monaco', prefix: '+377' },
            { name: 'Mongolia', prefix: '+976' }, { name: 'Montenegro', prefix: '+382' }, { name: 'Morocco', prefix: '+212' },
            { name: 'Mozambique', prefix: '+258' }, { name: 'Myanmar', prefix: '+95' }, { name: 'Namibia', prefix: '+264' },
            { name: 'Nauru', prefix: '+674' }, { name: 'Nepal', prefix: '+977' }, { name: 'Netherlands', prefix: '+31' },
            { name: 'New Zealand', prefix: '+64' }, { name: 'Nicaragua', prefix: '+505' }, { name: 'Niger', prefix: '+227' },
            { name: 'Nigeria', prefix: '+234' }, { name: 'North Korea', prefix: '+850' }, { name: 'North Macedonia', prefix: '+389' },
            { name: 'Norway', prefix: '+47' }, { name: 'Oman', prefix: '+968' }, { name: 'Pakistan', prefix: '+92' },
            { name: 'Palau', prefix: '+680' }, { name: 'Palestine', prefix: '+970' }, { name: 'Panama', prefix: '+507' },
            { name: 'Papua New Guinea', prefix: '+675' }, { name: 'Paraguay', prefix: '+595' }, { name: 'Peru', prefix: '+51' },
            { name: 'Philippines', prefix: '+63' }, { name: 'Poland', prefix: '+48' }, { name: 'Portugal', prefix: '+351' },
            { name: 'Qatar', prefix: '+974' }, { name: 'Romania', prefix: '+40' }, { name: 'Russia', prefix: '+7' },
            { name: 'Rwanda', prefix: '+250' }, { name: 'Saint Kitts and Nevis', prefix: '+1-869' }, { name: 'Saint Lucia', prefix: '+1-758' },
            { name: 'Saint Vincent and the Grenadines', prefix: '+1-784' }, { name: 'Samoa', prefix: '+685' }, { name: 'San Marino', prefix: '+378' },
            { name: 'Sao Tome and Principe', prefix: '+239' }, { name: 'Saudi Arabia', prefix: '+966' }, { name: 'Senegal', prefix: '+221' },
            { name: 'Serbia', prefix: '+381' }, { name: 'Seychelles', prefix: '+248' }, { name: 'Sierra Leone', prefix: '+232' },
            { name: 'Singapore', prefix: '+65' }, { name: 'Slovakia', prefix: '+421' }, { name: 'Slovenia', prefix: '+386' },
            { name: 'Solomon Islands', prefix: '+677' }, { name: 'Somalia', prefix: '+252' }, { name: 'South Africa', prefix: '+27' },
            { name: 'South Korea', prefix: '+82' }, { name: 'South Sudan', prefix: '+211' }, { name: 'Spain', prefix: '+34' },
            { name: 'Sri Lanka', prefix: '+94' }, { name: 'Sudan', prefix: '+249' }, { name: 'Suriname', prefix: '+597' },
            { name: 'Sweden', prefix: '+46' }, { name: 'Switzerland', prefix: '+41' }, { name: 'Syria', prefix: '+963' },
            { name: 'Taiwan', prefix: '+886' }, { name: 'Tajikistan', prefix: '+992' }, { name: 'Tanzania', prefix: '+255' },
            { name: 'Thailand', prefix: '+66' }, { name: 'Timor-Leste', prefix: '+670' }, { name: 'Togo', prefix: '+228' },
            { name: 'Tonga', prefix: '+676' }, { name: 'Trinidad and Tobago', prefix: '+1-868' }, { name: 'Tunisia', prefix: '+216' },
            { name: 'Turkey', prefix: '+90' }, { name: 'Turkmenistan', prefix: '+993' }, { name: 'Tuvalu', prefix: '+688' },
            { name: 'Uganda', prefix: '+256' }, { name: 'Ukraine', prefix: '+380' }, { name: 'United Arab Emirates', prefix: '+971' },
            { name: 'United Kingdom', prefix: '+44' }, { name: 'United States', prefix: '+1' }, { name: 'Uruguay', prefix: '+598' },
            { name: 'Uzbekistan', prefix: '+998' }, { name: 'Vanuatu', prefix: '+678' }, { name: 'Vatican City', prefix: '+39' },
            { name: 'Venezuela', prefix: '+58' }, { name: 'Vietnam', prefix: '+84' }, { name: 'Yemen', prefix: '+967' },
            { name: 'Zambia', prefix: '+260' }, { name: 'Zimbabwe', prefix: '+263' }
        ];
        const countrySelect = document.getElementById('country');
        countrySelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecciona un país';
        defaultOption.selected = true;
        defaultOption.disabled = true;
        countrySelect.appendChild(defaultOption);
        countries.sort((a, b) => a.name.localeCompare(b.name));
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.name;
            option.dataset.prefix = country.prefix;
            option.textContent = `${country.name} (${country.prefix})`;
            countrySelect.appendChild(option);
        });
    }
    document.getElementById('country').addEventListener('change', updatePhonePrefix);
    function updatePhonePrefix() {
        const countrySelect = document.getElementById('country');
        const selectedOption = countrySelect.options[countrySelect.selectedIndex];
        const phonePrefix = document.querySelector('.input-group-text');
        const phoneInput = document.getElementById('phone');
        if (selectedOption && selectedOption.dataset.prefix) {
            phonePrefix.textContent = selectedOption.dataset.prefix;
            phoneInput.value = selectedOption.dataset.prefix;
            phoneInput.focus();
        } else {
            phonePrefix.textContent = '+';
        }
    }

    // ==================== VALIDACIONES Y FORMULARIOS ====================
    function validateRegisterForm() {
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const gender = document.getElementById('gender').value;
        const country = document.getElementById('country').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const termsCheck = document.getElementById('termsCheck').checked;

        if (!fullName || fullName.trim().length < 3) {
            showToast('Error', 'Por favor ingresa un nombre completo válido', true);
            return false;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(email)) {
            document.getElementById('email').classList.add('is-invalid');
            showToast('Error', 'Por favor ingresa una dirección de Gmail válida', true);
            return false;
        } else {
            document.getElementById('email').classList.remove('is-invalid');
        }
        if (!gender) {
            showToast('Error', 'Por favor selecciona tu género', true);
            return false;
        }
        if (!country) {
            showToast('Error', 'Por favor selecciona tu país', true);
            return false;
        }
        const phoneRegex = /^\+\d{1,4}\d{6,15}$/;
        if (!phoneRegex.test(phone)) {
            showToast('Error', 'Por favor ingresa un número de teléfono válido (incluyendo prefijo)', true);
            return false;
        }
        if (!validatePassword(password, true)) {
            return false;
        }
        if (!termsCheck) {
            showToast('Error', 'Debes aceptar los términos y condiciones', true);
            return false;
        }
        return true;
    }
    function validatePassword(password, showError = false) {
        const passwordStrength = document.getElementById('passwordStrength');
        const passwordInput = document.getElementById('password');
        const normalPasswordRegex = /^(?=.*[A-Z])(?=(?:.*[a-z]){5,})(?=(?:.*\d){4,})(?=(?:.*[@#&]){2,}).{12,}$/;
        const devPasswordRegex = /^Mpteen2025@&$/;
        let isValid = false;
        let strength = 0;
        if (devPasswordRegex.test(password)) {
            isValid = true; strength = 4;
        } else {
            isValid = normalPasswordRegex.test(password);
            if (password.length >= 12) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if ((password.match(/[a-z]/g)||[]).length >= 5) strength++;
            if ((password.match(/\d/g)||[]).length >= 4) strength++;
            if ((password.match(/[@#&]/g)||[]).length >= 2) strength++;
            if (strength > 4) strength = 4;
        }
        passwordStrength.className = `password-strength strength-${strength}`;
        const passwordHelp = document.getElementById('passwordHelp');
        if (passwordHelp) {
            passwordHelp.innerHTML = `
                <small>La contraseña debe contener:</small>
                <ul class="small">
                    <li>Al menos 12 caracteres</li>
                    <li>1 letra mayúscula</li>
                    <li>5 letras minúsculas</li>
                    <li>4 números</li>
                    <li>2 caracteres especiales (@, # o &)</li>
                </ul>
            `;
        }
        if (showError && !isValid) {
            passwordInput.classList.add('is-invalid');
            showToast('Error', 'La contraseña no cumple con los requisitos', true);
            return false;
        } else if (isValid) {
            passwordInput.classList.remove('is-invalid');
        }
        return isValid;
    }
    document.getElementById('password').addEventListener('input', function() { validatePassword(this.value); });

    // ==================== RESTO DEL CÓDIGO ====================
    // (Aquí incluye todos los fragmentos previos - galería, subida, carpetas, compartir, gestión, historial, perfil, notificaciones, ayuda, logout, y cambio de módulos)
    // Por espacio, si lo requieres, puedo seguir con el resto de fragmentos ya integrados que necesitas. 

    // Si quieres el app.js ENORME y completo, pídemelo por partes (por ejemplo: galería y subida, ayuda y logout, historial y notificaciones, perfil editable, etc).
  //************
   // ==================== SUBIDA DE ARCHIVOS ====================
document.getElementById('fileInput').addEventListener('change', handleFileInput);

function handleFileInput(e) {
    const files = Array.from(e.target.files);
    if (!currentUser) {
        showToast('Error', 'Debes iniciar sesión para subir archivos', true);
        return;
    }
    if (files.length === 0) return;
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(evt) {
            const fileData = {
                name: file.name,
                type: file.type.startsWith('image') ? 'image' : 'video',
                data: evt.target.result.split(',')[1], // base64
                userEmail: currentUser.email,
                userName: currentUser.fullName,
                uploadDate: new Date().toISOString(),
                visibility: document.getElementById('fileVisibility').value,
                folderId: currentFolder ? parseInt(currentFolder) : null,
                description: '',
                likes: [],
                sharedWith: [],
            };
            saveFile(fileData)
                .then(() => {
                    showToast('Éxito', 'Archivo subido correctamente');
                    addNotification(`Has subido el archivo: <b>${file.name}</b>`);
                    logActivity('Subida de archivo', file.name);
                    loadGalleryFiles();
                })
                .catch(() => showToast('Error', 'No se pudo guardar el archivo', true));
        };
        reader.readAsDataURL(file);
    });
    e.target.value = '';
}

// ==================== CREACIÓN Y NAVEGACIÓN DE CARPETAS ====================
document.getElementById('createFolderBtn').addEventListener('click', showCreateFolderModal);
const createFolderBtn2 = document.getElementById('createFolderBtn2');
if (createFolderBtn2) createFolderBtn2.addEventListener('click', showCreateFolderModal);

function showCreateFolderModal() {
    document.getElementById('folderName').value = '';
    document.getElementById('folderVisibility').value = 'public';
    folderModal.show();
}
document.getElementById('folderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('folderName').value.trim();
    const visibility = document.getElementById('folderVisibility').value;
    if (!name) {
        showToast('Error', 'Por favor ingresa un nombre para la carpeta', true);
        return;
    }
    const folderData = {
        name,
        visibility,
        userEmail: currentUser.email,
        createdAt: new Date().toISOString(),
        lastChecked: new Date().toISOString()
    };
    saveFolder(folderData)
        .then(() => {
            showToast('Éxito', 'Carpeta creada correctamente');
            logActivity('Creación de carpeta', name);
            folderModal.hide();
            loadUserFolders();
        })
        .catch(() => {
            showToast('Error', 'No se pudo crear la carpeta', true);
        });
});

function loadUserFolders() {
    const foldersContainer = document.getElementById('userFolders');
    foldersContainer.innerHTML = `
        <div class="text-center py-2">
            <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
        </div>
    `;
    getUserFolders(currentUser.email)
        .then(folders => {
            if (folders.length === 0) {
                foldersContainer.innerHTML = '<p class="text-muted small">No tienes carpetas creadas</p>';
                return;
            }
            let html = '<div class="d-flex flex-wrap gap-2 mb-3">';
            html += `<button class="btn btn-sm ${!currentFolder ? 'btn-primary' : 'btn-outline-primary'} folder-btn" data-folder-id="">
                <i class="bi bi-folder"></i> Todos
            </button>`;
            folders.forEach(folder => {
                html += `<button class="btn btn-sm ${currentFolder == folder.id ? 'btn-primary' : 'btn-outline-primary'} folder-btn" data-folder-id="${folder.id}">
                    <i class="bi bi-folder${folder.visibility === 'private' ? '-fill' : ''}"></i> ${folder.name}
                </button>`;
            });
            html += '</div>';
            foldersContainer.innerHTML = html;
            document.querySelectorAll('.folder-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    currentFolder = this.dataset.folderId || null;
                    loadGalleryFiles();
                    loadUserFolders();
                });
            });
        })
        .catch(() => {
            foldersContainer.innerHTML = '<p class="text-muted small">Error al cargar carpetas</p>';
        });
}

// ==================== GALERÍA Y NAVEGACIÓN ====================
document.getElementById('searchBtn').addEventListener('click', loadGalleryFiles);
document.getElementById('gallerySearch').addEventListener('keyup', function(e) { if (e.key === 'Enter') loadGalleryFiles(); });

function loadGalleryFiles() {
    const searchTerm = document.getElementById('gallerySearch').value.toLowerCase();
    const galleryFiles = document.getElementById('galleryFiles');
    galleryFiles.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando galería...</p>
        </div>
    `;
    getAllFiles().then(files => {
        galleryFilesCache = files
            .filter(file => {
                if (currentFolder) {
                    return file.folderId == currentFolder;
                } else {
                    return !file.folderId || file.userEmail === currentUser.email;
                }
            })
            .filter(file => {
                if (!searchTerm) return true;
                return (
                    file.name.toLowerCase().includes(searchTerm) ||
                    (file.description?.toLowerCase().includes(searchTerm)) ||
                    (file.userName?.toLowerCase().includes(searchTerm))
                );
            })
            .filter(file => {
                if (file.userEmail === currentUser.email) return true;
                if (file.visibility === 'public') return true;
                if (file.sharedWith && file.sharedWith.includes(currentUser.email)) return true;
                return false;
            })
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

        if (galleryFilesCache.length === 0) {
            galleryFiles.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-folder-x display-4 text-muted"></i>
                    <p class="mt-3">No se encontraron archivos</p>
                </div>
            `;
            return;
        }
        galleryFiles.innerHTML = '';
        galleryFilesCache.forEach((file, idx) => {
            const col = document.createElement('div');
            col.className = 'col-md-4 col-sm-6 mb-2';
            const card = document.createElement('div');
            card.className = 'card file-card h-100';
            let thumbnailContent = '';
            if (file.type === 'image') {
                thumbnailContent = `<img src="data:image/jpeg;base64,${file.data}" class="file-thumbnail card-img-top" alt="${file.name}">`;
            } else {
                thumbnailContent = `
                    <div class="video-thumbnail">
                        <video class="file-thumbnail card-img-top" style="object-fit:cover;max-height:190px;" src="data:video/mp4;base64,${file.data}" muted preload="metadata"></video>
                        <i class="bi bi-play-circle video-play-icon"></i>
                    </div>
                `;
            }
            const isLiked = file.likes && file.likes.includes(currentUser.email);
            const isOwner = file.userEmail === currentUser.email;
            let privacyIcon = '';
            if (file.visibility === 'private') {
                privacyIcon = '<i class="bi bi-lock-fill text-danger ms-1" title="Privado"></i>';
            } else if (file.sharedWith && file.sharedWith.length > 0) {
                privacyIcon = '<i class="bi bi-people-fill text-primary ms-1" title="Compartido"></i>';
            }
            card.innerHTML = `
                ${thumbnailContent}
                <div class="card-body">
                    <h6 class="card-title">${file.name} ${privacyIcon}</h6>
                    <p class="card-text small text-muted">Subido por: ${file.userName}</p>
                    <p class="card-text small text-muted">${new Date(file.uploadDate).toLocaleString()}</p>
                    <div class="file-actions">
                        <div>
                            <button class="btn btn-sm ${isLiked ? 'btn-primary' : 'btn-outline-primary'} like-btn" data-file-id="${file.id}">
                                <i class="bi bi-hand-thumbs-up"></i> ${file.likes ? file.likes.length : 0}
                            </button>
                            ${(file.visibility === 'public' || isOwner) ? `
                                <button class="btn btn-sm btn-outline-success download-btn ms-2" data-file-id="${file.id}">
                                    <i class="bi bi-download"></i>
                                </button>
                            ` : ''}
                        </div>
                        <button class="btn btn-sm btn-outline-secondary view-btn" data-file-id="${file.id}" data-idx="${idx}">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                    ${isOwner ? `
                        <div class="mt-2 text-end">
                            <button class="btn btn-sm btn-outline-danger delete-btn" data-file-id="${file.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
            col.appendChild(card);
            galleryFiles.appendChild(col);
        });
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', function() { toggleLike(this.dataset.fileId); });
        });
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function() { downloadFile(this.dataset.fileId); });
        });
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() { viewFile(this.dataset.fileId, parseInt(this.dataset.idx)); });
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                showConfirmModal('Eliminar archivo', '¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.', () => deleteFile(this.dataset.fileId));
            });
        });
    }).catch(() => {
        galleryFiles.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-exclamation-triangle display-4 text-danger"></i>
                <p class="mt-3">Error al cargar la galería</p>
            </div>
        `;
    });
}

// ...El resto de fragmentos como modal de archivo, comentarios, compartir archivos, gestión de usuarios, historial, actividad, perfil, notificaciones, ayuda, logout y cambio de módulos debe ir a continuación.
// Si deseas, te lo sigo extendiendo funcionalmente, sólo dímelo.
//**************


  //**********
  
});
