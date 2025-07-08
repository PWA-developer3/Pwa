// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentUser = null;
    let selectedFiles = [];
    let currentFileView = null;
    let currentAction = null;
    let folders = [];
    let currentFolder = null;
    
    // Inicializar componentes de Bootstrap
    const toastEl = document.getElementById('toast');
    const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
    const fileModal = new bootstrap.Modal(document.getElementById('fileModal'));
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    const folderModal = new bootstrap.Modal(document.getElementById('folderModal'));
    
    // Mostrar mensaje toast
    function showToast(title, message, isError = false) {
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        // Cambiar color según si es error o no
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
    
    // Actualizar prefijo telefónico según país seleccionado
    function updatePhonePrefix() {
        const countrySelect = document.getElementById('country');
        const selectedOption = countrySelect.options[countrySelect.selectedIndex];
        const phonePrefix = document.querySelector('.input-group-text');
        
        if (selectedOption.dataset.prefix) {
            phonePrefix.textContent = selectedOption.dataset.prefix;
        } else {
            phonePrefix.textContent = '+';
        }
    }
    
    // Validar contraseña (ocultando Mpteen para usuarios normales)
    function validatePassword(password, showError = false) {
        const passwordStrength = document.getElementById('passwordStrength');
        const passwordInput = document.getElementById('password');
        
        // Expresión regular para contraseña normal
        const normalPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z]{5})(?=.*\d{4})(?=.*[@#&]{2}).{12}$/;
        // Expresión regular para desarrolladores
        const devPasswordRegex = /^Mpteen(?=.*\d{4})(?=.*[@#&]{2}).{12}$/;
        
        let isValid = false;
        let isDev = password.startsWith('Mpteen') && devPasswordRegex.test(password);
        
        // Validar según el tipo de usuario
        if (isDev) {
            isValid = true; // Es desarrollador
        } else {
            isValid = normalPasswordRegex.test(password); // Usuario normal
        }
        
        // Calcular fortaleza (ocultando el prefijo Mpteen en la interfaz)
        let displayPassword = isDev ? password.replace(/^Mpteen/, '') : password;
        let strength = 0;
        if (displayPassword.length >= (isDev ? 6 : 12)) strength++;
        if (/[A-Z]/.test(displayPassword)) strength++;
        if (/\d/.test(displayPassword)) strength++;
        if (/[@#&]/.test(displayPassword)) strength++;
        
        // Actualizar barra de fortaleza
        passwordStrength.className = `password-strength strength-${strength}`;
        
        // Mostrar error si se solicita
        if (showError && !isValid) {
            passwordInput.classList.add('is-invalid');
            showToast('Error', 'La contraseña no cumple con los requisitos', true);
            return false;
        } else if (isValid) {
            passwordInput.classList.remove('is-invalid');
        }
        
        return isValid;
    }
    
    // Manejar el formulario de registro
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar formulario
        if (validateRegisterForm()) {
            // Crear objeto de usuario
            const user = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                gender: document.getElementById('gender').value,
                country: document.getElementById('country').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value,
                isDeveloper: document.getElementById('password').value.startsWith('Mpteen'),
                createdAt: new Date().toISOString(),
                isActive: true
            };
            
            // Registrar usuario en IndexedDB
            registerUser(user)
                .then(() => {
                    // Iniciar sesión automáticamente
                    loginUser(user.email, user.password)
                        .then(user => {
                            showMainPanel(user);
                        })
                        .catch(error => {
                            showToast('Error', 'Error al iniciar sesión después del registro', true);
                        });
                })
                .catch(error => {
                    showToast('Error', 'Error al registrar el usuario: ' + error, true);
                });
        }
    });
    
    // Validar formulario de registro
    function validateRegisterForm() {
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const gender = document.getElementById('gender').value;
        const country = document.getElementById('country').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const termsCheck = document.getElementById('termsCheck').checked;
        
        // Validar nombre completo
        if (!fullName || fullName.trim().length < 3) {
            showToast('Error', 'Por favor ingresa un nombre completo válido', true);
            return false;
        }
        
        // Validar email (debe ser Gmail)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(email)) {
            document.getElementById('email').classList.add('is-invalid');
            showToast('Error', 'Por favor ingresa una dirección de Gmail válida', true);
            return false;
        } else {
            document.getElementById('email').classList.remove('is-invalid');
        }
        
        // Validar género
        if (!gender) {
            showToast('Error', 'Por favor selecciona tu género', true);
            return false;
        }
        
        // Validar país
        if (!country) {
            showToast('Error', 'Por favor selecciona tu país', true);
            return false;
        }
        
        // Validar teléfono
        const phoneRegex = /^\d{6,15}$/; // Solo números, entre 6 y 15 dígitos
        if (!phoneRegex.test(phone)) {
            showToast('Error', 'Por favor ingresa un número de teléfono válido (solo números)', true);
            return false;
        }
        
        // Validar contraseña
        if (!validatePassword(password, true)) {
            return false;
        }
        
        // Validar términos y condiciones
        if (!termsCheck) {
            showToast('Error', 'Debes aceptar los términos y condiciones', true);
            return false;
        }
        
        return true;
    }
    
    // Manejar el formulario de login
    const loginForm = document.getElementById('loginForm');
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
            })
            .catch(error => {
                showToast('Error', 'Credenciales incorrectas o usuario no registrado', true);
            });
    });
    
    // Mostrar panel principal
    function showMainPanel(user) {
        currentUser = user;
        
        document.getElementById('authPanel').style.display = 'none';
        document.getElementById('mainPanel').style.display = 'block';
        
        // Mostrar mensaje de bienvenida
        const welcomeMessage = document.getElementById('welcomeMessage');
        const saludo = user.gender === 'male' ? 'Sr.' : 'Sra.';
        welcomeMessage.textContent = `Bienvenid${user.gender === 'male' ? 'o' : 'a'} a mYpuB ${saludo} ${user.fullName}`;
        
        // Mostrar avatar de usuario
        const userAvatar = document.getElementById('userAvatar');
        const initials = user.fullName.split(' ').map(name => name[0]).join('').toUpperCase();
        userAvatar.textContent = initials.substring(0, 2);
        
        // Mostrar módulo de usuarios si es desarrollador
        if (user.isDeveloper) {
            document.getElementById('usersModuleLink').style.display = 'block';
        }
        
        // Cargar módulo inicial
        switchModule('upload');
        
        // Mostrar toast de bienvenida
        showToast('Bienvenido', `Has iniciado sesión correctamente como ${user.email}`);
    }
    
    // Cerrar sesión
    function logoutUser() {
        currentUser = null;
        document.getElementById('mainPanel').style.display = 'none';
        document.getElementById('authPanel').style.display = 'block';
        
        // Limpiar formularios
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        
        showToast('Sesión cerrada', 'Has cerrado sesión correctamente');
    }
    
    // Cambiar entre módulos
    function switchModule(moduleName) {
        // Desactivar todas las pestañas y enlaces
        document.querySelectorAll('.module-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('[data-module]').forEach(link => {
            link.classList.remove('active');
        });
        
        // Activar la pestaña seleccionada
        document.getElementById(`${moduleName}Module`).classList.add('active');
        
        // Activar el enlace seleccionado
        document.querySelector(`[data-module="${moduleName}"]`).classList.add('active');
        
        // Cargar contenido según el módulo
        switch (moduleName) {
            case 'upload':
                // Resetear selección de archivos
                selectedFiles = [];
                fileInput.value = '';
                uploadFilesBtn.disabled = true;
                document.getElementById('uploadStatus').textContent = '';
                document.getElementById('uploadProgress').style.display = 'none';
                loadUserFolders();
                break;
                
            case 'gallery':
                loadGalleryContent();
                break;
                
            case 'share':
                loadUsersForSharing();
                loadUserFilesForSharing();
                loadSharedFiles();
                break;
                
            case 'users':
                if (currentUser.isDeveloper) {
                    loadUsersForManagement();
                }
                break;
                
            case 'info':
                // No necesita carga adicional
                break;
        }
    }
    
    // Cargar contenido de la galería (carpetas y archivos)
    function loadGalleryContent() {
        loadUserFolders();
        loadGalleryFiles();
    }
    
    // Cargar carpetas del usuario
    function loadUserFolders() {
        const folderSelect = document.getElementById('fileFolder');
        const foldersContainer = document.getElementById('foldersContainer');
        
        // Limpiar select de carpetas
        folderSelect.innerHTML = '<option value="" selected>Sin carpeta</option>';
        
        // Mostrar spinner
        foldersContainer.innerHTML = `
            <div class="col-12 text-center py-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;
        
        getUserFolders(currentUser.email)
            .then(userFolders => {
                folders = userFolders;
                
                // Actualizar select de carpetas
                folders.forEach(folder => {
                    const option = document.createElement('option');
                    option.value = folder.id;
                    option.textContent = folder.name;
                    folderSelect.appendChild(option);
                });
                
                // Mostrar carpetas en la galería
                if (folders.length === 0) {
                    foldersContainer.innerHTML = '';
                    return;
                }
                
                foldersContainer.innerHTML = '';
                
                folders.forEach(folder => {
                    const col = document.createElement('div');
                    col.className = 'col-md-3 col-sm-6 mb-3';
                    
                    const card = document.createElement('div');
                    card.className = 'card folder-card h-100';
                    card.dataset.folderId = folder.id;
                    
                    // Determinar badge de privacidad
                    let privacyBadge = '';
                    if (folder.privacy === 'private') {
                        privacyBadge = '<span class="badge bg-warning privacy-badge">Privada</span>';
                    } else if (folder.privacy === 'intimate') {
                        privacyBadge = '<span class="badge bg-danger privacy-badge">Íntima</span>';
                    } else {
                        privacyBadge = '<span class="badge bg-success privacy-badge">Pública</span>';
                    }
                    
                    card.innerHTML = `
                        <div class="card-body text-center">
                            <i class="bi bi-folder folder-icon"></i>
                            <h5 class="card-title mt-2">${folder.name}</h5>
                            <p class="card-text small">${folder.files.length} archivos</p>
                            ${privacyBadge}
                        </div>
                    `;
                    
                    // Agregar event listener para abrir carpeta
                    card.addEventListener('click', function() {
                        currentFolder = folder;
                        loadGalleryFiles();
                    });
                    
                    col.appendChild(card);
                    foldersContainer.appendChild(col);
                });
            })
            .catch(error => {
                console.error('Error al cargar carpetas:', error);
                foldersContainer.innerHTML = `
                    <div class="col-12 text-center py-3">
                        <i class="bi bi-exclamation-triangle text-danger"></i>
                        <p>Error al cargar carpetas</p>
                    </div>
                `;
            });
    }
    
    // Cargar archivos para la galería
    function loadGalleryFiles() {
        const searchTerm = document.getElementById('gallerySearch').value.toLowerCase();
        const galleryFiles = document.getElementById('galleryFiles');
        
        galleryFiles.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando archivos...</p>
            </div>
        `;
        
        Promise.all([getAllFiles(), getAllFolders()])
            .then(([files, folders]) => {
                // Filtrar archivos según carpeta seleccionada
                if (currentFolder) {
                    files = files.filter(file => file.folderId === currentFolder.id);
                }
                
                // Filtrar según búsqueda
                if (searchTerm) {
                    files = files.filter(file => 
                        file.name.toLowerCase().includes(searchTerm) || 
                        file.description?.toLowerCase().includes(searchTerm) ||
                        file.userName.toLowerCase().includes(searchTerm)
                    );
                }
                
                // Filtrar según privacidad
                files = files.filter(file => {
                    // Si el archivo está en una carpeta íntima, solo el dueño puede verlo
                    if (file.folderId) {
                        const folder = folders.find(f => f.id === file.folderId);
                        if (folder && folder.privacy === 'intimate') {
                            return folder.creator === currentUser.email;
                        }
                    }
                    
                    // Si el archivo es íntimo, solo el dueño puede verlo
                    if (file.privacy === 'intimate') {
                        return file.userEmail === currentUser.email;
                    }
                    
                    // Si el archivo es privado, solo el dueño y usuarios con acceso pueden verlo
                    if (file.privacy === 'private') {
                        return file.userEmail === currentUser.email || 
                               file.sharedWith.includes(currentUser.email);
                    }
                    
                    // Archivos públicos son visibles para todos
                    return true;
                });
                
                // Ordenar por fecha más reciente
                files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
                
                if (files.length === 0) {
                    galleryFiles.innerHTML = `
                        <div class="col-12 text-center py-5">
                            <i class="bi bi-folder-x display-4 text-muted"></i>
                            <p class="mt-3">No se encontraron archivos</p>
                        </div>
                    `;
                    return;
                }
                
                galleryFiles.innerHTML = '';
                
                files.forEach(file => {
                    const col = document.createElement('div');
                    col.className = 'col-md-4 col-sm-6';
                    
                    const card = document.createElement('div');
                    card.className = 'card file-card h-100';
                    
                    let thumbnailContent = '';
                    if (file.type === 'image') {
                        thumbnailContent = `<img src="data:image/jpeg;base64,${file.data}" class="file-thumbnail card-img-top" alt="${file.name}">`;
                    } else {
                        thumbnailContent = `
                            <div class="video-thumbnail">
                                <img src="data:image/jpeg;base64,${file.data}" class="file-thumbnail card-img-top" alt="${file.name}">
                                <i class="bi bi-play-circle video-play-icon"></i>
                            </div>
                        `;
                    }
                    
                    const isLiked = file.likes.includes(currentUser.email);
                    const isOwner = file.userEmail === currentUser.email;
                    
                    // Determinar badge de privacidad
                    let privacyBadge = '';
                    if (file.privacy === 'private') {
                        privacyBadge = '<span class="badge bg-warning privacy-badge">Privado</span>';
                    } else if (file.privacy === 'intimate') {
                        privacyBadge = '<span class="badge bg-danger privacy-badge">Íntimo</span>';
                    }
                    
                    card.innerHTML = `
                        ${thumbnailContent}
                        <div class="card-body">
                            <h6 class="card-title">${file.name}</h6>
                            <p class="card-text small text-muted">Subido por: ${file.userName}</p>
                            <p class="card-text small text-muted">${new Date(file.uploadDate).toLocaleString()}</p>
                            ${privacyBadge}
                            <div class="file-actions">
                                <div>
                                    <button class="btn btn-sm ${isLiked ? 'btn-primary' : 'btn-outline-primary'} like-btn" data-file-id="${file.id}">
                                        <i class="bi bi-hand-thumbs-up"></i> ${file.likes.length}
                                    </button>
                                    ${file.privacy === 'public' || isOwner ? `
                                        <button class="btn btn-sm btn-outline-success download-btn ms-2" data-file-id="${file.id}">
                                            <i class="bi bi-download"></i>
                                        </button>
                                    ` : ''}
                                </div>
                                <button class="btn btn-sm btn-outline-secondary view-btn" data-file-id="${file.id}">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                            ${isOwner || currentUser.isDeveloper ? `
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
                
                // Agregar event listeners a los botones
                addFileEventListeners();
            })
            .catch(error => {
                console.error('Error al cargar archivos:', error);
                galleryFiles.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-exclamation-triangle display-4 text-danger"></i>
                        <p class="mt-3">Error al cargar la galería</p>
                    </div>
                `;
            });
    }
    
    // Agregar event listeners a los botones de archivos
    function addFileEventListeners() {
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                toggleLike(this.dataset.fileId);
            });
        });
        
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                downloadFile(this.dataset.fileId);
            });
        });
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                viewFile(this.dataset.fileId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                showConfirmModal(
                    'Eliminar archivo',
                    '¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.',
                    () => deleteFile(this.dataset.fileId)
                );
            });
        });
    }
    
    // Manejar creación de carpetas
    document.getElementById('createFolderBtn').addEventListener('click', function() {
        document.getElementById('folderName').value = '';
        document.getElementById('folderPrivacy').value = 'public';
        folderModal.show();
    });
    
    document.getElementById('saveFolderBtn').addEventListener('click', function() {
        const folderName = document.getElementById('folderName').value.trim();
        const privacy = document.getElementById('folderPrivacy').value;
        
        if (!folderName) {
            showToast('Error', 'Debes ingresar un nombre para la carpeta', true);
            return;
        }
        
        const newFolder = {
            id: Date.now(),
            name: folderName,
            creator: currentUser.email,
            privacy: privacy,
            createdAt: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
            files: []
        };
        
        saveFolder(newFolder)
            .then(() => {
                folderModal.hide();
                showToast('Éxito', 'Carpeta creada correctamente');
                loadUserFolders();
            })
            .catch(error => {
                showToast('Error', 'No se pudo crear la carpeta', true);
            });
    });
    
    // Verificar y eliminar carpetas vacías cada 24 horas
    function checkEmptyFolders() {
        getAllFolders()
            .then(allFolders => {
                const now = new Date();
                const twentyFourHours = 24 * 60 * 60 * 1000;
                
                allFolders.forEach(folder => {
                    // Solo verificar carpetas vacías
                    if (folder.files.length === 0) {
                        const lastChecked = new Date(folder.lastChecked);
                        const timeDiff = now - lastChecked;
                        
                        // Si han pasado más de 24 horas desde la última verificación
                        if (timeDiff > twentyFourHours) {
                            deleteFolder(folder.id)
                                .then(() => {
                                    console.log(`Carpeta ${folder.name} eliminada por estar vacía más de 24 horas`);
                                })
                                .catch(error => {
                                    console.error('Error al eliminar carpeta vacía:', error);
                                });
                        } else {
                            // Actualizar lastChecked si no ha pasado 24 horas
                            updateFolder(folder.id, { lastChecked: new Date().toISOString() });
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error al verificar carpetas vacías:', error);
            });
    }
    
    // Ejecutar cada hora
    setInterval(checkEmptyFolders, 60 * 60 * 1000);
    
    // Inicializar IndexedDB
    let db;
    const DB_NAME = 'mYpuB_DB';
    const DB_VERSION = 3; // Versión incrementada por cambios en el esquema
    const USER_STORE = 'users';
    const FILE_STORE = 'files';
    const FOLDER_STORE = 'folders';
    
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = function(event) {
                console.error('Error al abrir la base de datos:', event.target.error);
                reject('Error al abrir la base de datos');
            };
            
            request.onsuccess = function(event) {
                db = event.target.result;
                resolve(db);
            };
            
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                
                // Crear almacén de usuarios
                if (!db.objectStoreNames.contains(USER_STORE)) {
                    const userStore = db.createObjectStore(USER_STORE, { keyPath: 'email' });
                    userStore.createIndex('email', 'email', { unique: true });
                    userStore.createIndex('isActive', 'isActive', { unique: false });
                    userStore.createIndex('isDeveloper', 'isDeveloper', { unique: false });
                }
                
                // Crear almacén de archivos
                if (!db.objectStoreNames.contains(FILE_STORE)) {
                    const fileStore = db.createObjectStore(FILE_STORE, { keyPath: 'id', autoIncrement: true });
                    fileStore.createIndex('userEmail', 'userEmail', { unique: false });
                    fileStore.createIndex('type', 'type', { unique: false });
                    fileStore.createIndex('visibility', 'visibility', { unique: false });
                    fileStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                    fileStore.createIndex('folderId', 'folderId', { unique: false });
                }
                
                // Crear almacén de carpetas
                if (!db.objectStoreNames.contains(FOLDER_STORE)) {
                    const folderStore = db.createObjectStore(FOLDER_STORE, { keyPath: 'id' });
                    folderStore.createIndex('creator', 'creator', { unique: false });
                    folderStore.createIndex('privacy', 'privacy', { unique: false });
                }
            };
        });
    }
    
    // Operaciones CRUD para carpetas
    function saveFolder(folder) {
        return new Promise((resolve, reject) => {
            initDB()
                .then(db => {
                    const transaction = db.transaction([FOLDER_STORE], 'readwrite');
                    const store = transaction.objectStore(FOLDER_STORE);
                    
                    const request = store.add(folder);
                    
                    request.onsuccess = function() {
                        resolve();
                    };
                    
                    request.onerror = function() {
                        reject('Error al guardar carpeta');
                    };
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
    
    function getAllFolders() {
        return new Promise((resolve, reject) => {
            initDB()
                .then(db => {
                    const transaction = db.transaction([FOLDER_STORE], 'readonly');
                    const store = transaction.objectStore(FOLDER_STORE);
                    const request = store.getAll();
                    
                    request.onsuccess = function() {
                        resolve(request.result);
                    };
                    
                    request.onerror = function() {
                        reject('Error al obtener carpetas');
                    };
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
    
    function getUserFolders(userEmail) {
        return new Promise((resolve, reject) => {
            initDB()
                .then(db => {
                    const transaction = db.transaction([FOLDER_STORE], 'readonly');
                    const store = transaction.objectStore(FOLDER_STORE);
                    const index = store.index('creator');
                    const request = index.getAll(userEmail);
                    
                    request.onsuccess = function() {
                        resolve(request.result);
                    };
                    
                    request.onerror = function() {
                        reject('Error al obtener carpetas del usuario');
                    };
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
    
    function updateFolder(folderId, updates) {
        return new Promise((resolve, reject) => {
            initDB()
                .then(db => {
                    const transaction = db.transaction([FOLDER_STORE], 'readwrite');
                    const store = transaction.objectStore(FOLDER_STORE);
                    
                    // Primero obtener la carpeta actual
                    const getRequest = store.get(folderId);
                    
                    getRequest.onsuccess = function() {
                        const folder = getRequest.result;
                        if (!folder) {
                            reject('Carpeta no encontrada');
                            return;
                        }
                        
                        // Actualizar propiedades
                        const updatedFolder = { ...folder, ...updates };
                        
                        // Guardar cambios
                        const putRequest = store.put(updatedFolder);
                        
                        putRequest.onsuccess = function() {
                            resolve(updatedFolder);
                        };
                        
                        putRequest.onerror = function() {
                            reject('Error al actualizar carpeta');
                        };
                    };
                    
                    getRequest.onerror = function() {
                        reject('Error al obtener carpeta');
                    };
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
    
    function deleteFolder(folderId) {
        return new Promise((resolve, reject) => {
            initDB()
                .then(db => {
                    const transaction = db.transaction([FOLDER_STORE], 'readwrite');
                    const store = transaction.objectStore(FOLDER_STORE);
                    const request = store.delete(folderId);
                    
                    request.onsuccess = function() {
                        resolve();
                    };
                    
                    request.onerror = function() {
                        reject('Error al eliminar carpeta');
                    };
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
    
    // ... (resto de las funciones CRUD para usuarios y archivos se mantienen igual)
    
    // Inicializar la aplicación
    initDB().then(() => {
        // Configurar event listeners para el cambio de país
        document.getElementById('country').addEventListener('change', updatePhonePrefix);
        
        // Configurar otros event listeners
        document.getElementById('logoutBtn').addEventListener('click', logoutUser);
        
        // Configurar navegación entre módulos
        document.querySelectorAll('[data-module]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                switchModule(this.dataset.module);
            });
        });
        
        // Iniciar verificación de carpetas vacías
        checkEmptyFolders();
    }).catch(error => {
        console.error('Error al inicializar la aplicación:', error);
        showToast('Error', 'Hubo un problema al inicializar la aplicación', true);
    });
});
