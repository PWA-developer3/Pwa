// =====================
// mYpuB main.js
// =====================
// Constantes globales
const DB_NAME = 'mypubDB';
const DB_VERSION = 1;
const DB_USERS = 'users';
const DB_FILES = 'files';
const DB_FOLDERS = 'folders';
const DB_SHARED = 'shared';
const STORAGE_LIMIT = 100 * 1024 * 1024 * 1024; // 100GB
const DEV_EMAIL = 'enzemajr@gmail.com';
const DEV_PASS = 'Enzema0097@&';
const DEV_PHONE = '+240222084663';

let db;
let currentUser = null;
let allCountries = [];
let isDev = false;

// ========== IndexedDB Setup ==========
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function (event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains(DB_USERS)) {
                const users = db.createObjectStore(DB_USERS, { keyPath: 'email' });
            }
            if (!db.objectStoreNames.contains(DB_FILES)) {
                const files = db.createObjectStore(DB_FILES, { keyPath: 'id', autoIncrement: true });
                files.createIndex('public', 'public', { unique: false });
                files.createIndex('owner', 'owner', { unique: false });
            }
            if (!db.objectStoreNames.contains(DB_FOLDERS)) {
                const folders = db.createObjectStore(DB_FOLDERS, { keyPath: ['owner', 'name'] });
            }
            if (!db.objectStoreNames.contains(DB_SHARED)) {
                db.createObjectStore(DB_SHARED, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = function (event) {
            db = event.target.result;
            resolve();
        };
        req.onerror = function (event) {
            reject("IndexedDB error: " + event.target.errorCode);
        };
    });
}

// ========== Utility Functions ==========
function $(selector) {
    return document.querySelector(selector);
}
function $$(selector) {
    return document.querySelectorAll(selector);
}
function show(elem) {
    elem.style.display = '';
}
function hide(elem) {
    elem.style.display = 'none';
}
function toBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(blob);
    });
}
function fromBase64(dataurl) {
    // dataurl: "data:mime;base64,...."
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    for (let i = 0; i < n; ++i) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
}
function uniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function formatDateTime(dt) {
    const d = new Date(dt);
    return d.toLocaleString('es-ES');
}
function getAvatarFromName(name) {
    const colors = ['#2a5298','#23355b','#eab308','#ee6c4d','#3a86ff','#8338ec','#001845','#1ea896'];
    let hash=0; for(let i=0;i<name.length;i++) hash+=name.charCodeAt(i)*(i+1);
    const color = colors[hash % colors.length];
    const initials = name.split(' ').map(x=>x.charAt(0)).join('').slice(0,2).toUpperCase();
    const svg = `<svg width="40" height="40"><rect width="100%" height="100%" rx="20" fill="${color}"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="16" font-family="Georgia">${initials}</text></svg>`;
    return "data:image/svg+xml;base64," + btoa(svg);
}

// ========== Países ==========
async function loadCountries() {
    // Usa API restcountries.com para obtener países y prefijos
    let res = await fetch('https://restcountries.com/v3.1/all');
    let data = await res.json();
    data.sort((a,b)=>a.name.common.localeCompare(b.name.common));
    allCountries = data.map(c=>{
        let code = c.idd && c.idd.root ? c.idd.root + (c.idd.suffixes ? c.idd.suffixes[0] : '') : '';
        if (!code) code = '+00';
        return { name: c.name.common, code: code };
    });
    const sel = $('#reg-country');
    sel.innerHTML = '<option value="">Seleccione país...</option>';
    allCountries.forEach(({name,code}) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.dataset.prefix = code;
        opt.textContent = `${name} (${code})`;
        sel.appendChild(opt);
    });
}

// ========== Auth ==========
function validatePassword(pass) {
    if (pass === DEV_PASS) return true;
    // 12 chars, 6 letters first (first uppercase), 4 digits, 2 symbols @#&
    const regex = /^([A-Z][a-zA-Z]{5})(\d{4})([@#&]{2})$/;
    return regex.test(pass);
}
function hashPassword(pass) {
    // Simple hash for demo (no crypto): base64
    return btoa(unescape(encodeURIComponent(pass)));
}
function checkEmailGmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
}
async function registerUser(user) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_USERS], 'readwrite');
        const store = tx.objectStore(DB_USERS);
        store.get(user.email).onsuccess = function(e) {
            if (e.target.result) return reject('El usuario ya existe.');
            store.add(user).onsuccess = function() { resolve(true); };
        };
        tx.onerror = e => reject('Error al registrar usuario.');
    });
}
async function getUser(email) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_USERS], 'readonly');
        const store = tx.objectStore(DB_USERS);
        store.get(email).onsuccess = function(e) {
            resolve(e.target.result);
        };
        tx.onerror = e => reject('Error al buscar usuario.');
    });
}
function setSession(user) {
    currentUser = user;
    isDev = (user.email === DEV_EMAIL && user.password === hashPassword(DEV_PASS)) || user.password === DEV_PASS;
    localStorage.setItem('mypub_user', user.email);
}
async function loadSession() {
    const email = localStorage.getItem('mypub_user');
    if (email) {
        const user = await getUser(email);
        if (user) {
            setSession(user);
            return user;
        }
    }
    return null;
}
function clearSession() {
    currentUser = null;
    isDev = false;
    localStorage.removeItem('mypub_user');
}

// ========== UI: Registro/Login ==========
function showRegister() {
    $('#register-form').style.display = '';
    $('#login-form').style.display = 'none';
    $('#form-title').innerHTML = 'Regístrate en <span style="font-family:Georgia;font-weight:bold;">mYpuB</span>';
    $('#toggle-auth-btn').textContent = '¿Ya tienes cuenta? Inicia sesión';
}
function showLogin() {
    $('#register-form').style.display = 'none';
    $('#login-form').style.display = '';
    $('#form-title').innerHTML = 'Inicie la sesión en <span style="font-family:Georgia;font-weight:bold;">mYpuB</span>';
    $('#toggle-auth-btn').textContent = '¿No tienes cuenta? Regístrate';
}
$('#toggle-auth-btn').onclick = e => {
    if ($('#register-form').style.display !== 'none') showLogin();
    else showRegister();
    hide($('#auth-error'));
};
$('#reg-country').onchange = function() {
    const opt = this.selectedOptions[0];
    $('#phone-prefix').textContent = opt ? (opt.dataset.prefix || '+00') : '+00';
};
$('#reg-password').oninput = function() {
    this.classList.remove('is-invalid');
};
$('#register-form').onsubmit = async function(e){
    e.preventDefault();
    hide($('#auth-error'));
    const name = $('#reg-name').value.trim();
    const email = $('#reg-email').value.trim().toLowerCase();
    const gender = $('#reg-gender').value;
    const country = $('#reg-country').value;
    const phone = $('#phone-prefix').textContent + $('#reg-phone').value.trim();
    const pass = $('#reg-password').value;
    if (!name || !email || !gender || !country || !phone || !pass) return showError('Todos los campos son obligatorios');
    if (!checkEmailGmail(email)) return showError('El correo debe ser @gmail.com');
    if (!validatePassword(pass)) {
        $('#reg-password').classList.add('is-invalid');
        return showError('La contraseña no cumple con el formato.');
    }
    try {
        let user = {
            name, email, gender, country, phone,
            password: pass === DEV_PASS ? DEV_PASS : hashPassword(pass),
            folders: [],
            blocked: false,
            isDev: pass === DEV_PASS,
            created: Date.now()
        };
        await registerUser(user);
        setSession(user);
        await afterLogin();
    } catch (err) {
        showError(err);
    }
};
$('#login-form').onsubmit = async function(e){
    e.preventDefault();
    hide($('#auth-error'));
    const email = $('#log-email').value.trim().toLowerCase();
    const pass = $('#log-password').value;
    if (!email || !pass) return showError('Rellena todos los campos.');
    const user = await getUser(email);
    if (!user) return showError('Usuario o contraseña incorrectos.');
    const passwordOk = pass === DEV_PASS ? (user.password === DEV_PASS) : (user.password === hashPassword(pass));
    if (!passwordOk) return showError('Usuario o contraseña incorrectos.');
    setSession(user);
    await afterLogin();
};
function showError(msg) {
    $('#auth-error').textContent = msg;
    show($('#auth-error'));
}
$('#logout-btn').onclick = function() {
    clearSession();
    location.reload();
};

// ========== Bienvenida ==========
function showWelcome() {
    const navPanel = $('#user-nav-panel');
    const welcome = $('#user-nav-welcome');
    show(navPanel);
    let msg = '';
    if (currentUser.gender === 'Hombre') msg = `Bienvenido a mYpuB Sr. ${currentUser.name}`;
    else if (currentUser.gender === 'Mujer') msg = `Bienvenida a mYpuB Sra. ${currentUser.name}`;
    else msg = `Gracias por utilizar mYpuB`;
    welcome.textContent = msg;
}

// ========== Ayuda ==========
const helpModal = new bootstrap.Modal($('#helpModal'));
$('#help-btn').onclick = () => {
    $('#help-email-form').style.display = 'none';
    $('#help-whatsapp-form').style.display = 'none';
    helpModal.show();
};
$('#help-email-btn').onclick = () => {
    $('#help-email-form').style.display = '';
    $('#help-whatsapp-form').style.display = 'none';
};
$('#help-whatsapp-btn').onclick = () => {
    $('#help-email-form').style.display = 'none';
    $('#help-whatsapp-form').style.display = '';
};
$('#help-email-form').onsubmit = function(e){
    e.preventDefault();
    const name = $('#help-email-name').value.trim();
    const mail = $('#help-email-mail').value.trim();
    if (!name || !mail) return;
    window.location = `mailto:${DEV_EMAIL}?subject=Consulta%20de%20${encodeURIComponent(name)}&body=Hola%20desarrollador,%20tengo%20una%20consulta.%0AMi%20email:%20${encodeURIComponent(mail)}`;
};
$('#help-whatsapp-form').onsubmit = function(e){
    e.preventDefault();
    const name = $('#help-whatsapp-name').value.trim();
    const phone = $('#help-whatsapp-phone').value.trim();
    if (!name || !phone) return;
    window.open(`https://wa.me/${DEV_PHONE.replace(/[^0-9]/g,'')}?text=Hola%20desarrollador,%20soy%20${encodeURIComponent(name)}.%20Mi%20número%20es%20${encodeURIComponent(phone)}.%20Tengo%20una%20consulta.`, '_blank');
};

// ========== Carpetas ==========
async function getFoldersOfUser(user) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_FOLDERS], 'readonly');
        const store = tx.objectStore(DB_FOLDERS);
        const folders = [];
        const req = store.openCursor();
        req.onsuccess = function(e){
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.owner === user.email) folders.push(cursor.value.name);
                cursor.continue();
            } else resolve(folders);
        };
        req.onerror = e => reject('Error al obtener carpetas.');
    });
}
async function createFolder(name) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_FOLDERS], 'readwrite');
        const store = tx.objectStore(DB_FOLDERS);
        store.put({ owner: currentUser.email, name });
        tx.oncomplete = () => resolve(true);
        tx.onerror = e => reject('Error al crear carpeta.');
    });
}
async function refreshFolderUI() {
    const folders = await getFoldersOfUser(currentUser);
    const cont = $('#user-folders');
    cont.innerHTML = '';
    folders.forEach(f=>{
        const el = document.createElement('span');
        el.className = 'folder-item';
        el.textContent = f;
        el.onclick = function(){
            $$('.folder-item').forEach(x=>x.classList.remove('selected'));
            el.classList.add('selected');
        };
        cont.appendChild(el);
    });
    if (folders[0]) cont.querySelector('.folder-item').classList.add('selected');
}
$('#create-folder-btn').onclick = async function(){
    const name = $('#new-folder-name').value.trim();
    if (!name) return;
    await createFolder(name);
    $('#new-folder-name').value = '';
    await refreshFolderUI();
};

// ========== Subir Archivos ==========
async function getStorageUsage() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_FILES], 'readonly');
        const store = tx.objectStore(DB_FILES);
        let total = 0;
        store.openCursor().onsuccess = function(e){
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.owner === currentUser.email) {
                    if (cursor.value.size) total += cursor.value.size;
                    else if (cursor.value.data) total += cursor.value.data.length;
                }
                cursor.continue();
            } else resolve(total);
        };
    });
}
$('#upload-form').onsubmit = async function(e){
    e.preventDefault();
    const folderEls = $$('.folder-item.selected');
    if (!folderEls.length) return updateUploadStatus('Seleccione una carpeta.', true);
    const folder = folderEls[0].textContent;
    const files = $('#file-input').files;
    const privacy = $('#file-privacy').value;
    if (!files.length) return updateUploadStatus('Seleccione archivos.', true);
    let totalUsage = await getStorageUsage();
    let totalNew = 0;
    for (let f of files) totalNew += f.size;
    if (totalUsage + totalNew > STORAGE_LIMIT) return updateUploadStatus('Espacio insuficiente.', true);
    for (let file of files) {
        const dataurl = await toBase64(file);
        const now = Date.now();
        let rec = {
            id: uniqueId(),
            owner: currentUser.email,
            ownerName: currentUser.name,
            fileName: file.name,
            folder,
            public: privacy==='public',
            download: privacy==='public',
            type: file.type,
            data: dataurl,
            size: file.size,
            created: now,
            likes: [],
            dislikes: [],
            comments: [],
            details: '',
            blocked: false
        };
        await new Promise((resolve, reject) => {
            const tx = db.transaction([DB_FILES], 'readwrite');
            tx.objectStore(DB_FILES).add(rec).onsuccess = ()=>resolve();
            tx.onerror = e=>reject();
        });
    }
    $('#file-input').value = '';
    updateUploadStatus('¡Archivos subidos exitosamente!');
    await loadGallery();
    await refreshShareFiles();
};
function updateUploadStatus(msg, isError) {
    $('#upload-status').className = isError ? 'alert alert-danger' : 'alert alert-success';
    $('#upload-status').textContent = msg;
    show($('#upload-status'));
    setTimeout(()=>hide($('#upload-status')), 3000);
}

// ========== Galería ==========
async function getPublicFiles() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_FILES], 'readonly');
        const store = tx.objectStore(DB_FILES);
        const files = [];
        store.openCursor().onsuccess = function(e){
            const cursor = e.target.result;
            if (cursor) {
                const v = cursor.value;
                if (v.public && !v.blocked) files.push(v);
                cursor.continue();
            } else resolve(files);
        };
    });
}
async function getUserFiles(email, onlyPublic=false) {
    return new Promise((resolve,reject)=>{
        const tx = db.transaction([DB_FILES], 'readonly');
        const store = tx.objectStore(DB_FILES);
        const files = [];
        store.openCursor().onsuccess = function(e){
            const cursor = e.target.result;
            if (cursor) {
                const v = cursor.value;
                if (v.owner === email && (!onlyPublic || v.public)) files.push(v);
                cursor.continue();
            } else resolve(files);
        };
    });
}
async function loadGallery() {
    const out = $('#gallery-container');
    out.innerHTML = '';
    let files = await getPublicFiles();
    files.sort((a,b)=>b.created-a.created);
    if (!files.length) return (out.innerHTML = '<div class="alert alert-info">No hay archivos públicos aún.</div>');
    files.forEach(f=>{
        const card = document.createElement('div');
        card.className = 'card mb-3 shadow-sm';
        let mediaHtml = '';
        if (f.type.startsWith('image')) {
            mediaHtml = `<img src="${f.data}" class="gallery-img" alt="${f.fileName}">`;
        } else if (f.type.startsWith('video')) {
            mediaHtml = `<video src="${f.data}" class="gallery-video" controls></video>`;
        }
        let likeCount = f.likes.length;
        let dislikeCount = f.dislikes.length;
        let liked = f.likes.includes(currentUser.email);
        let disliked = f.dislikes.includes(currentUser.email);
        let downloadBtn = f.download ? `<button class="btn btn-outline-secondary btn-sm ms-2 download-btn" data-id="${f.id}"><i class="bi bi-download"></i> Descargar</button>` : '';
        let editBtn = (f.owner===currentUser.email||isDev) ? `<button class="btn btn-outline-secondary btn-sm ms-2 edit-btn" data-id="${f.id}"><i class="bi bi-pencil"></i></button>` : '';
        let delBtn = (f.owner===currentUser.email||isDev) ? `<button class="btn btn-outline-danger btn-sm ms-2 delete-btn" data-id="${f.id}"><i class="bi bi-trash"></i></button>` : '';
        let ownerBadge = `<img src="${getAvatarFromName(f.ownerName)}" class="profile-avatar me-1"> <span>${f.ownerName}</span>`;
        let badge = f.public ? `<span class="public-badge ms-2">Público</span>` : `<span class="private-badge ms-2">Privado</span>`;
        let likesBtn = `<span class="like-btn ${liked?'liked':''}" data-id="${f.id}"><i class="bi bi-hand-thumbs-up"></i> ${likeCount}</span>
                        <span class="dislike-btn ms-2 ${disliked?'disliked':''}" data-id="${f.id}"><i class="bi bi-hand-thumbs-down"></i> ${dislikeCount}</span>`;
        card.innerHTML = `
            <div class="row g-0">
                <div class="col-md-4">${mediaHtml}</div>
                <div class="col-md-8">
                    <div class="card-body pb-1">
                        <h6 class="card-title">${f.fileName} ${badge}</h6>
                        <div class="mb-1 small text-muted">Subido por: ${ownerBadge} <span class="ms-2 text-secondary"><i class="bi bi-calendar"></i> ${formatDateTime(f.created)}</span></div>
                        <div class="mb-2">${f.details||''}</div>
                        <div class="mb-2">${likesBtn}${downloadBtn}${editBtn}${delBtn}</div>
                        <div class="mb-2">
                            <form class="comment-form d-flex" data-id="${f.id}">
                                <input class="form-control form-control-sm" placeholder="Comenta...">
                                <button class="btn btn-outline-mypub btn-sm ms-2"><i class="bi bi-chat-dots"></i></button>
                            </form>
                        </div>
                        <div class="comments-list">${renderComments(f.comments)}</div>
                    </div>
                </div>
            </div>
        `;
        out.appendChild(card);
    });
    // Eventos like, dislike, download, edit, delete, comment
    $$('.like-btn').forEach(el=>{
        el.onclick = async function(){
            const id = el.dataset.id;
            await likeFile(id);
            await loadGallery();
        };
    });
    $$('.dislike-btn').forEach(el=>{
        el.onclick = async function(){
            const id = el.dataset.id;
            await dislikeFile(id);
            await loadGallery();
        };
    });
    $$('.download-btn').forEach(el=>{
        el.onclick = function(){
            const id = el.dataset.id;
            downloadFileFromGallery(id);
        };
    });
    $$('.edit-btn').forEach(el=>{
        el.onclick = function(){
            const id = el.dataset.id;
            editFileDetails(id);
        };
    });
    $$('.delete-btn').forEach(el=>{
        el.onclick = async function(){
            const id = el.dataset.id;
            if (confirm('¿Eliminar archivo?')) {
                await deleteFile(id);
                await loadGallery();
                await refreshShareFiles();
            }
        };
    });
    $$('.comment-form').forEach(form=>{
        form.onsubmit = async function(e){
            e.preventDefault();
            const id = form.dataset.id;
            const txt = form.querySelector('input').value.trim();
            if (!txt) return;
            await addComment(id, txt);
            await loadGallery();
        };
    });
}
function renderComments(comments=[]) {
    return comments.map(c=>`
        <div class="comment-section mb-1">
            <strong>${c.name}:</strong> ${c.text} <span class="text-muted small ms-2">${formatDateTime(c.date)}</span>
        </div>
    `).join('');
}
async function likeFile(id) {
    return new Promise((resolve,reject)=>{
        const tx = db.transaction([DB_FILES],'readwrite');
        const store = tx.objectStore(DB_FILES);
        store.openCursor().onsuccess = function(e){
            const cursor = e.target.result;
            if(cursor){
                if(cursor.value.id===id){
                    let v=cursor.value;
                    if(!v.likes.includes(currentUser.email)){
                        v.likes.push(currentUser.email);
                        v.dislikes = v.dislikes.filter(x=>x!==currentUser.email);
                        cursor.update(v);
                    } else {
                        v.likes = v.likes.filter(x=>x!==currentUser.email);
                        cursor.update(v);
                    }
                    resolve();
                } else cursor.continue();
            }
        };
    });
}
async function dislikeFile(id) {
    return new Promise((resolve,reject)=>{
        const tx = db.transaction([DB_FILES],'readwrite');
        const store = tx.objectStore(DB_FILES);
        store.openCursor().onsuccess = function(e){
            const cursor = e.target.result;
            if(cursor){
                if(cursor.value.id===id){
                    let v=cursor.value;
                    if(!v.dislikes.includes(currentUser.email)){
                        v.dislikes.push(currentUser.email);
                        v.likes = v.likes.filter(x=>x!==currentUser.email);
                        cursor.update(v);
                    } else {
                        v.dislikes = v.dislikes.filter(x=>x!==currentUser.email);
                        cursor.update(v);
                    }
                    resolve();
                } else cursor.continue();
            }
        };
    });
}
async function addComment(id, text) {
    return new Promise((resolve,reject)=>{
        const tx = db.transaction([DB_FILES],'readwrite');
        const store = tx.objectStore(DB_FILES);
        store.openCursor().onsuccess = function(e){
            const cursor = e.target.result;
            if(cursor){
                if(cursor.value.id===id){
                    let v=cursor.value;
                    v.comments.push({ name: currentUser.name, text, date: Date.now() });
                    cursor.update(v);
                    resolve();
                } else cursor.continue();
            }
        };
    });
}
function downloadFileFromGallery(id) {
    const tx = db.transaction([DB_FILES],'readonly');
    const store = tx.objectStore(DB_FILES);
    store.openCursor().onsuccess = function(e){
        const cursor = e.target.result;
        if(cursor){
            if(cursor.value.id===id){
                let v=cursor.value;
                const blob = fromBase64(v.data);
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = v.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else cursor.continue();
        }
    };
}
function editFileDetails(id) {
    const tx = db.transaction([DB_FILES],'readonly');
    const store = tx.objectStore(DB_FILES);
    store.openCursor().onsuccess = function(e){
        const cursor = e.target.result;
        if(cursor){
            if(cursor.value.id===id){
                let v=cursor.value;
                const newTitle = prompt('Nuevo título para el archivo:', v.fileName);
                const newDetails = prompt('Detalles o comentarios:', v.details||'');
                if (newTitle) {
                    const tx2 = db.transaction([DB_FILES],'readwrite');
                    tx2.objectStore(DB_FILES).openCursor().onsuccess = function(ev){
                        const c2 = ev.target.result;
                        if(c2){
                            if(c2.value.id===id){
                                let vv=c2.value;
                                vv.fileName = newTitle;
                                vv.details = newDetails;
                                c2.update(vv);
                            } else c2.continue();
                        }
                    };
                }
            } else cursor.continue();
        }
    };
}
async function deleteFile(id) {
    return new Promise((resolve,reject)=>{
        const tx = db.transaction([DB_FILES],'readwrite');
        const store = tx.objectStore(DB_FILES);
        store.delete(id).onsuccess = ()=>resolve();
    });
}

// ========== Compartir ==========
async function getAllUsers(excludeSelf=true) {
    return new Promise((resolve,reject)=>{
        const tx = db.transaction([DB_USERS],'readonly');
        const store = tx.objectStore(DB_USERS);
        const users = [];
        store.openCursor().onsuccess = function(e){
            const cursor = e.target.result;
            if(cursor){
                if(!excludeSelf || cursor.value.email!==currentUser.email)
                    users.push(cursor.value);
                cursor.continue();
            } else resolve(users);
        };
    });
}
async function refreshShareUsers() {
    const users = await getAllUsers();
    const sel = $('#share-user-select');
    sel.innerHTML = '<option value="">Seleccione usuario...</option>';
    users.forEach(u=>{
        sel.innerHTML += `<option value="${u.email}">${u.name} (${u.email})</option>`;
    });
}
async function refreshShareFiles() {
    const files = await getUserFiles(currentUser.email);
    const sel = $('#share-file-select');
    sel.innerHTML = '<option value="">Seleccione archivo...</option>';
    files.forEach(f=>{
        sel.innerHTML += `<option value="${f.id}">${f.fileName}</option>`;
    });
}
$('#share-file-btn').onclick = async function(){
    const user = $('#share-user-select').value;
    const fileId = $('#share-file-select').value;
    if (!user || !fileId) return updateShareStatus('Seleccione usuario y archivo.',true);
    await new Promise((resolve,reject)=>{
        const tx = db.transaction([DB_SHARED],'readwrite');
        tx.objectStore(DB_SHARED).add({
            from: currentUser.email,
            to: user,
            fileId,
            date: Date.now()
        }).onsuccess=()=>resolve();
    });
    updateShareStatus('¡Archivo compartido exitosamente!');
    await loadSharedFiles();
};
function updateShareStatus(msg, isError) {
    $('#share-status').className = isError ? 'alert alert-danger' : 'alert alert-success';
    $('#share-status').textContent = msg;
    show($('#share-status'));
    setTimeout(()=>hide($('#share-status')), 3000);
}
async function loadSharedFiles() {
    const tx = db.transaction([DB_SHARED],'readonly');
    const store = tx.objectStore(DB_SHARED);
    const files = [];
    store.openCursor().onsuccess = async function(e){
        const cursor = e.target.result;
        if(cursor){
            if(cursor.value.to===currentUser.email){
                files.push(cursor.value);
            }
            cursor.continue();
        } else {
            const out = $('#shared-files-list');
            if (!files.length) return (out.innerHTML = '<div class="alert alert-info">No tienes archivos compartidos.</div>');
            let html = '<div class="mypub-section-title">Archivos que te han compartido</div>';
            for (let f of files) {
                // Busca archivo
                let rec = await new Promise(res=>{
                    const tx2 = db.transaction([DB_FILES],'readonly');
                    tx2.objectStore(DB_FILES).openCursor().onsuccess = function(ev){
                        const c2 = ev.target.result;
                        if(c2){
                            if(c2.value.id===f.fileId) res(c2.value);
                            else c2.continue();
                        } else res(null);
                    };
                });
                if (rec) {
                    html += `<div class="card mb-2 p-2">
                        <div><b>${rec.fileName}</b> <span class="text-muted ms-2">${formatDateTime(f.date)}</span></div>
                        <div><button class="btn btn-outline-secondary btn-sm download-shared-btn" data-id="${rec.id}"><i class="bi bi-download"></i> Descargar</button></div>
                    </div>`;
                }
            }
            out.innerHTML = html;
            $$('.download-shared-btn').forEach(btn=>{
                btn.onclick = function(){
                    downloadFileFromGallery(btn.dataset.id);
                };
            });
        }
    };
}

// ========== Gestión de Usuarios ==========
async function loadUsersTable() {
    const out = $('#users-table-container');
    const users = await getAllUsers(false);
    let html = `<table class="table table-users table-bordered">
        <thead>
            <tr>
                <th>Avatar</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Sexo</th>
                <th>País</th>
                <th>Teléfono</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>`;
    users.forEach(u=>{
        let actionBtns = '';
        if (isDev && u.email !== currentUser.email) {
            actionBtns += `<button class="btn btn-outline-danger btn-sm ms-1 user-del-btn" data-email="${u.email}"><i class="bi bi-trash"></i></button>`;
            actionBtns += u.blocked
                ? `<button class="btn btn-outline-success btn-sm ms-1 user-unblock-btn" data-email="${u.email}"><i class="bi bi-unlock"></i></button>`
                : `<button class="btn btn-outline-warning btn-sm ms-1 user-block-btn" data-email="${u.email}"><i class="bi bi-lock"></i></button>`;
        }
        html += `<tr>
            <td><img src="${getAvatarFromName(u.name)}" class="profile-avatar"></td>
            <td>${u.name} ${u.isDev?'<span class="admin-badge">Desarrollador</span>':''}</td>
            <td>${u.email}</td>
            <td>${u.gender}</td>
            <td>${u.country}</td>
            <td>${u.phone}</td>
            <td>${actionBtns}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    out.innerHTML = html;
    $$('.user-block-btn').forEach(btn=>{
        btn.onclick = async function(){
            await blockUser(btn.dataset.email,true);
            await loadUsersTable();
        };
    });
    $$('.user-unblock-btn').forEach(btn=>{
        btn.onclick = async function(){
            await blockUser(btn.dataset.email,false);
            await loadUsersTable();
        };
    });
    $$('.user-del-btn').forEach(btn=>{
        btn.onclick = async function(){
            if (confirm('¿Eliminar usuario?')) {
                await deleteUser(btn.dataset.email);
                await loadUsersTable();
            }
        };
    });
}
async function blockUser(email, block) {
    return new Promise((resolve,reject)=>{
        const tx = db.transaction([DB_USERS],'readwrite');
        const store = tx.objectStore(DB_USERS);
        store.get(email).onsuccess = function(e){
            let u = e.target.result;
            if(u){
                u.blocked = block;
                store.put(u).onsuccess = ()=>resolve();
            }
        };
    });
}
async function deleteUser(email) {
    return new Promise((resolve,reject)=>{
        const tx = db.transaction([DB_USERS],'readwrite');
        const store = tx.objectStore(DB_USERS);
        store.delete(email).onsuccess = ()=>resolve();
    });
}

// ========== Panel Principal ==========
async function afterLogin() {
    // Oculta auth, muestra main panel
    hide($('#auth-panel'));
    show($('#main-panel'));
    showWelcome();
    await refreshFolderUI();
    await loadGallery();
    await refreshShareUsers();
    await refreshShareFiles();
    await loadUsersTable();
    await loadSharedFiles();
    // Gestión de usuarios solo para desarrollador
    if (!isDev) {
        hide($('#gestion-tab').parentElement);
        hide($('#gestion'));
    } else {
        show($('#gestion-tab').parentElement);
        show($('#gestion'));
    }
}

// ========== Inicialización ==========
async function main() {
    await openDB();
    await loadCountries();
    // Restaurar sesión
    const user = await loadSession();
    if (user) await afterLogin();
    // Si no, muestra auth panel
    else show($('#auth-panel'));
}
main();
