// ===================== mYpuB - App Principal COMPLETO =====================
// PARTE 1/6

document.addEventListener('DOMContentLoaded', async function() {
    // =================== VARIABLES GLOBALES ===================
    let currentUser = null, currentFileView = null, currentAction = null, currentFolder = null;
    let db = null, galleryFilesCache = [], notifications = [], activityLog = [];
    const toastEl = document.getElementById('toast');
    const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
    const fileModal = new bootstrap.Modal(document.getElementById('fileModal'));
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    const folderModal = new bootstrap.Modal(document.getElementById('folderModal'));

    // =================== INICIALIZAR BASE DE DATOS ===================
    await initDB();
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('mYpuB_DB', 4);
            request.onerror = () => reject('Error al abrir la base de datos');
            request.onsuccess = e => { db = e.target.result; setInterval(checkEmptyFolders, 60*60*1000); resolve(db); };
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

    // =================== CRUD USUARIOS ===================
    function registerUser(user) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['users'], 'readwrite').objectStore('users');
            const request = store.add(user);
            request.onsuccess = () => resolve();
            request.onerror = event => {
                if (event.target.error.name === 'ConstraintError') reject('El correo electrónico ya está registrado');
                else reject('Error al registrar el usuario');
            };
        });
    }
    function loginUser(email, password) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['users'], 'readonly').objectStore('users');
            const request = store.get(email);
            request.onsuccess = function() {
                const user = request.result;
                if (user && user.password === password) resolve(user);
                else reject('Credenciales incorrectas');
            };
            request.onerror = () => reject('Error al buscar usuario');
        });
    }
    function getAllUsers() {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['users'], 'readonly').objectStore('users');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener usuarios');
        });
    }
    function getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['users'], 'readonly').objectStore('users');
            const request = store.get(email);
            request.onsuccess = () => request.result ? resolve(request.result) : reject('Usuario no encontrado');
            request.onerror = () => reject('Error al buscar usuario');
        });
    }
    function updateUser(email, updates) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['users'], 'readwrite').objectStore('users');
            const getRequest = store.get(email);
            getRequest.onsuccess = function() {
                const user = getRequest.result;
                if (!user) { reject('Usuario no encontrado'); return; }
                const updatedUser = { ...user, ...updates };
                const putRequest = store.put(updatedUser);
                putRequest.onsuccess = () => resolve(updatedUser);
                putRequest.onerror = () => reject('Error al actualizar usuario');
            };
            getRequest.onerror = () => reject('Error al obtener usuario');
        });
    }
    function deleteUserFromDB(email) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['users'], 'readwrite').objectStore('users');
            const request = store.delete(email);
            request.onsuccess = () => resolve();
            request.onerror = () => reject('Error al eliminar usuario');
        });
    }

    // =================== CRUD ARCHIVOS ===================
    function saveFile(fileData) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['files'], 'readwrite').objectStore('files');
            const request = store.add(fileData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al guardar archivo');
        });
    }
    function getAllFiles() {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['files'], 'readonly').objectStore('files');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener archivos');
        });
    }
    function getUserFiles(userEmail) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const index = db.transaction(['files'], 'readonly').objectStore('files').index('userEmail');
            const request = index.getAll(userEmail);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener archivos del usuario');
        });
    }
    function getFilesInFolder(folderId) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const index = db.transaction(['files'], 'readonly').objectStore('files').index('folderId');
            const request = index.getAll(folderId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener archivos de la carpeta');
        });
    }
    function getFileById(fileId) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['files'], 'readonly').objectStore('files');
            const request = store.get(parseInt(fileId));
            request.onsuccess = () => request.result ? resolve(request.result) : reject('Archivo no encontrado');
            request.onerror = () => reject('Error al buscar archivo');
        });
    }
    function updateFile(fileId, updates) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['files'], 'readwrite').objectStore('files');
            const getRequest = store.get(parseInt(fileId));
            getRequest.onsuccess = function() {
                const file = getRequest.result;
                if (!file) { reject('Archivo no encontrado'); return; }
                const updatedFile = { ...file, ...updates };
                const putRequest = store.put(updatedFile);
                putRequest.onsuccess = () => resolve(updatedFile);
                putRequest.onerror = () => reject('Error al actualizar archivo');
            };
            getRequest.onerror = () => reject('Error al obtener archivo');
        });
    }
    function deleteFileFromDB(fileId) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['files'], 'readwrite').objectStore('files');
            const request = store.delete(parseInt(fileId));
            request.onsuccess = () => resolve();
            request.onerror = () => reject('Error al eliminar archivo');
        });
    }

    // =================== CRUD CARPETAS ===================
    function saveFolder(folderData) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['folders'], 'readwrite').objectStore('folders');
            const request = store.add(folderData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al guardar carpeta');
        });
    }
    function getAllFolders() {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['folders'], 'readonly').objectStore('folders');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener carpetas');
        });
    }
    function getUserFolders(userEmail) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const index = db.transaction(['folders'], 'readonly').objectStore('folders').index('userEmail');
            const request = index.getAll(userEmail);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener carpetas del usuario');
        });
    }
    function getFolderById(folderId) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['folders'], 'readonly').objectStore('folders');
            const request = store.get(parseInt(folderId));
            request.onsuccess = () => request.result ? resolve(request.result) : reject('Carpeta no encontrada');
            request.onerror = () => reject('Error al buscar carpeta');
        });
    }
    function updateFolder(folderId, updates) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['folders'], 'readwrite').objectStore('folders');
            const getRequest = store.get(parseInt(folderId));
            getRequest.onsuccess = function() {
                const folder = getRequest.result;
                if (!folder) { reject('Carpeta no encontrada'); return; }
                const updatedFolder = { ...folder, ...updates };
                const putRequest = store.put(updatedFolder);
                putRequest.onsuccess = () => resolve(updatedFolder);
                putRequest.onerror = () => reject('Error al actualizar carpeta');
            };
            getRequest.onerror = () => reject('Error al obtener carpeta');
        });
    }
    function deleteFolder(folderId) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['folders'], 'readwrite').objectStore('folders');
            const request = store.delete(parseInt(folderId));
            request.onsuccess = () => resolve();
            request.onerror = () => reject('Error al eliminar carpeta');
        });
    }
    function checkEmptyFolders() {
        getAllFolders()
            .then(folders => {
                const now = new Date();
                const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
                folders.forEach(folder => {
                    if (new Date(folder.createdAt) < twentyFourHoursAgo) {
                        getFilesInFolder(folder.id)
                            .then(files => {
                                if (files.length === 0) deleteFolder(folder.id).catch(()=>{});
                                else updateFolder(folder.id, { lastChecked: new Date().toISOString() });
                            });
                    }
                });
            }).catch(()=>{});
    }
    // =================== CRUD COMENTARIOS ===================
    function saveComment(commentData) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['comments'], 'readwrite').objectStore('comments');
            const request = store.add(commentData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al guardar comentario');
        });
    }
    function getCommentsByFileId(fileId) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const index = db.transaction(['comments'], 'readonly').objectStore('comments').index('fileId');
            const request = index.getAll(parseInt(fileId));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener comentarios');
        });
    }
    function deleteComment(commentId) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['comments'], 'readwrite').objectStore('comments');
            const request = store.delete(parseInt(commentId));
            request.onsuccess = () => resolve();
            request.onerror = () => reject('Error al eliminar comentario');
        });
    }

// ===================== mYpuB - App Principal COMPLETO =====================
// PARTE 2/6

    // =================== CRUD COMENTARIOS ===================
    function saveComment(commentData) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['comments'], 'readwrite').objectStore('comments');
            const request = store.add(commentData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al guardar comentario');
        });
    }
    function getCommentsByFileId(fileId) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const index = db.transaction(['comments'], 'readonly').objectStore('comments').index('fileId');
            const request = index.getAll(parseInt(fileId));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener comentarios');
        });
    }
    function deleteComment(commentId) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('La base de datos no está inicializada');
            const store = db.transaction(['comments'], 'readwrite').objectStore('comments');
            const request = store.delete(parseInt(commentId));
            request.onsuccess = () => resolve();
            request.onerror = () => reject('Error al eliminar comentario');
        });
    }

    // =================== TOASTS Y UTILIDADES BÁSICAS ===================
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

    // ==================== AUTENTICACIÓN Y REGISTRO ====================
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

    // =================== PAÍSES ===================
    loadCountries();
    function loadCountries() {
        const countries = [
            { name: 'Argentina', prefix: '+54' }, { name: 'Bolivia', prefix: '+591' }, { name: 'Brasil', prefix: '+55' },
            { name: 'Chile', prefix: '+56' }, { name: 'Colombia', prefix: '+57' }, { name: 'Ecuador', prefix: '+593' },
            { name: 'Paraguay', prefix: '+595' }, { name: 'Perú', prefix: '+51' }, { name: 'Uruguay', prefix: '+598' },
            { name: 'Venezuela', prefix: '+58' }, { name: 'España', prefix: '+34' }, { name: 'México', prefix: '+52' },
            { name: 'Estados Unidos', prefix: '+1' }, { name: 'Canadá', prefix: '+1' }, { name: 'Francia', prefix: '+33' },
            { name: 'Italia', prefix: '+39' }, { name: 'Alemania', prefix: '+49' }, { name: 'Reino Unido', prefix: '+44' }
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

    // ... Continúa en PARTE 3/6 ...

// ===================== mYpuB - App Principal COMPLETO =====================
// PARTE 3/6

    // =================== SUBIDA DE ARCHIVOS ===================
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

    // =================== CREACIÓN Y NAVEGACIÓN DE CARPETAS ===================
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

    // =================== GALERÍA Y NAVEGACIÓN ===================
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

    // ... Continúa en PARTE 4/6 ...

// ===================== mYpuB - App Principal COMPLETO =====================
// PARTE 4/6

    // =================== MODAL DE ARCHIVO: VER, COMENTAR, LIKE, DESCARGA, COMPARTIR, ELIMINAR ===================
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
                let avatarSrc = "default-avatar.png";
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

    // =================== LIKE, DESCARGA, ELIMINAR ===================
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

    // =================== COMPARTIR ARCHIVOS ===================
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

    // ... Continúa en PARTE 5/6 ...

// ===================== mYpuB - App Principal COMPLETO =====================
// PARTE 5/6

    // =================== GESTIÓN DE USUARIOS (SOLO DESARROLLADOR) ===================
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

    // =================== HISTORIAL Y ACTIVIDAD ===================
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

    // =================== NOTIFICACIONES INTERNAS ===================
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

    // =================== PERFIL USUARIO Y AVATAR ===================
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

    // =================== AYUDA Y CONTACTO ===================
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

    // ... Continúa en PARTE 6/6 ...

// ===================== mYpuB - App Principal COMPLETO =====================
// PARTE 6/6

    // =================== LOGOUT Y CAMBIO DE MÓDULOS ===================
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

    // =================== PANEL PRINCIPAL: MOSTRAR AL INICIAR SESIÓN ===================
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

    // =================== ARCHIVOS COMPARTIDOS CONMIGO ===================
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

    // =================== PANEL DE CARPETAS (LISTADO SIMPLE) ===================
    function loadFoldersModule() {
        const foldersList = document.getElementById('foldersList');
        foldersList.innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;
        getUserFolders(currentUser.email)
            .then(folders => {
                if (!folders.length) {
                    foldersList.innerHTML = '<div class="text-muted py-3">No tienes carpetas creadas</div>';
                    return;
                }
                foldersList.innerHTML = folders.map(folder => `
                    <div class="card mb-2">
                        <div class="card-body d-flex align-items-center justify-content-between">
                            <span>
                                <i class="bi bi-folder${folder.visibility === 'private' ? '-fill' : ''} me-2"></i>
                                <strong>${folder.name}</strong>
                                <small class="text-muted ms-2">${folder.visibility === 'private' ? 'Privada' : 'Pública'}</small>
                            </span>
                            <span>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteFolderUI(${folder.id})" title="Eliminar"><i class="bi bi-trash"></i></button>
                            </span>
                        </div>
                    </div>
                `).join('');
            });
    }
    window.deleteFolderUI = function(folderId) {
        showConfirmModal('Eliminar carpeta', '¿Seguro que quieres eliminar esta carpeta y sus archivos?', function() {
            getFilesInFolder(folderId).then(files => {
                return Promise.all(files.map(f => deleteFileFromDB(f.id)));
            }).then(() => deleteFolder(folderId))
            .then(() => {
                showToast('Éxito', 'Carpeta y archivos eliminados');
                loadFoldersModule();
                loadUserFolders();
                loadGalleryFiles();
            });
        });
    };
    document.querySelector('.main-nav-link[data-module="folders"]').addEventListener('click', loadFoldersModule);

    // =================== ACCESO RÁPIDO A MI ACTIVIDAD ===================
    document.querySelector('.main-nav-link[data-module="activity"]').addEventListener('click', renderActivityLog);

    // =================== CAMBIO DE MÓDULO AL VOLVER AL PANEL PRINCIPAL ====
    document.querySelector('.main-nav-link[data-module="gallery"]').addEventListener('click', function() {
        loadUserFolders();
        loadGalleryFiles();
    });

    // =================== ACCESIBILIDAD Y USABILIDAD: TECLAS RÁPIDAS ===================
    document.addEventListener('keydown', function(e) {
        if (!currentUser) return;
        if (e.altKey) {
            if (e.key === "1") { switchModule('gallery'); }
            if (e.key === "2") { switchModule('folders'); loadFoldersModule(); }
            if (e.key === "3") { switchModule('share'); loadSharedFiles(); }
            if (e.key === "4") { switchModule('activity'); renderActivityLog(); }
            if (e.key === "5") { showProfileModal(); }
        }
    });

    // =================== MODO OSCURO SIMPLE ===================
    const darkModeBtn = document.createElement('button');
    darkModeBtn.className = "btn btn-sm btn-outline-secondary";
    darkModeBtn.innerHTML = '<i class="bi bi-moon"></i>';
    darkModeBtn.title = "Modo oscuro";
    document.getElementById('userNav').insertBefore(darkModeBtn, document.getElementById('logoutBtn'));
    let darkMode = false;
    darkModeBtn.onclick = function() {
        darkMode = !darkMode;
        document.body.classList.toggle('bg-dark', darkMode);
        document.body.classList.toggle('text-light', darkMode);
        darkModeBtn.innerHTML = darkMode ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
        darkModeBtn.title = darkMode ? "Modo claro" : "Modo oscuro";
    };

    // =================== PREVENCIÓN DE ERRORES Y USABILIDAD ===================
    document.querySelectorAll('form').forEach(f => {
        f.addEventListener('submit', function(e) {
            if (f.dataset.submitted) e.preventDefault();
            f.dataset.submitted = 'true';
            setTimeout(() => { f.dataset.submitted = ''; }, 2000);
        });
    });

    // =================== LIMPIA CAMPOS AL ABRIR MODALES ===================
    ['folderModal', 'profileModal', 'shareModal'].forEach(id => {
        const modalEl = document.getElementById(id);
        if (!modalEl) return;
        modalEl.addEventListener('show.bs.modal', function() {
            this.querySelectorAll('input,select').forEach(inp => { if (inp.type !== "hidden") inp.value = ""; });
            if (id === 'profileModal') {
                document.getElementById('profileAvatarPreview').src = currentUser.avatar || 'default-avatar.png';
            }
        });
    });

    // =================== MODAL DE CONFIRMACIÓN GENÉRICO ===================
    window.showConfirmModal = function(title, message, onConfirm) {
        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalBody').textContent = message;
        const confirmBtn = document.getElementById('confirmModalBtn');
        const handler = function() {
            confirmBtn.removeEventListener('click', handler);
            confirmModal.hide();
            if (onConfirm) onConfirm();
        };
        confirmBtn.addEventListener('click', handler);
        confirmModal.show();
    };

}); // === FIN DEL DOMContentLoaded ===
