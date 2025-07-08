// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentUser = null;
    let selectedFiles = [];
    let currentFileView = null;
    let currentAction = null;
    let currentFolder = null;
    let db = null; // Variable para la base de datos
    
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
    
    // Cargar lista de países físicos
    loadCountries();
    
    // Inicializar la base de datos primero
    initDB().then(() => {
        // Una vez que la base de datos está lista, configuramos los event listeners
        
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
    }).catch(error => {
        console.error('Error al inicializar la base de datos:', error);
        showToast('Error', 'Hubo un problema al inicializar la aplicación', true);
    });
    
    // Resto del código...
    
    // Función para cargar lista física de países
    function loadCountries() {
        const countries = [
            { name: 'España', prefix: '+34' },
            { name: 'México', prefix: '+52' },
            { name: 'Estados Unidos', prefix: '+1' },
            { name: 'Argentina', prefix: '+54' },
            { name: 'Colombia', prefix: '+57' },
            { name: 'Perú', prefix: '+51' },
            { name: 'Chile', prefix: '+56' },
            { name: 'Venezuela', prefix: '+58' },
            { name: 'Ecuador', prefix: '+593' },
            { name: 'Guatemala', prefix: '+502' },
            { name: 'Cuba', prefix: '+53' },
            { name: 'República Dominicana', prefix: '+1-809' },
            { name: 'Honduras', prefix: '+504' },
            { name: 'Paraguay', prefix: '+595' },
            { name: 'El Salvador', prefix: '+503' },
            { name: 'Nicaragua', prefix: '+505' },
            { name: 'Costa Rica', prefix: '+506' },
            { name: 'Panamá', prefix: '+507' },
            { name: 'Uruguay', prefix: '+598' },
            { name: 'Guinea Ecuatorial', prefix: '+240' }
        ];
        
        const countrySelect = document.getElementById('country');
        
        // Limpiar opciones existentes
        countrySelect.innerHTML = '';
        
        // Agregar opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecciona un país';
        defaultOption.selected = true;
        defaultOption.disabled = true;
        countrySelect.appendChild(defaultOption);
        
        // Ordenar países alfabéticamente
        countries.sort((a, b) => a.name.localeCompare(b.name));
        
        // Agregar cada país al select
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.name;
            option.dataset.prefix = country.prefix;
            option.textContent = `${country.name} (${country.prefix})`;
            countrySelect.appendChild(option);
        });
    }
    
    // Actualizar prefijo telefónico según país seleccionado
    function updatePhonePrefix() {
        const countrySelect = document.getElementById('country');
        const selectedOption = countrySelect.options[countrySelect.selectedIndex];
        const phonePrefix = document.querySelector('.input-group-text');
        const phoneInput = document.getElementById('phone');
        
        if (selectedOption.dataset.prefix) {
            phonePrefix.textContent = selectedOption.dataset.prefix;
            phoneInput.value = selectedOption.dataset.prefix;
            phoneInput.focus();
        } else {
            phonePrefix.textContent = '+';
        }
    }
    
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
        const phoneRegex = /^\+\d{1,4}\d{6,15}$/; // Prefijo + números, entre 6 y 15 dígitos
        if (!phoneRegex.test(phone)) {
            showToast('Error', 'Por favor ingresa un número de teléfono válido (incluyendo prefijo)', true);
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
    
    // Validar contraseña
    function validatePassword(password, showError = false) {
        const passwordStrength = document.getElementById('passwordStrength');
        const passwordInput = document.getElementById('password');
        
        // Expresión regular para contraseña normal
        const normalPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z]{5,})(?=.*\d{4,})(?=.*[@#&]{2,}).{12,}$/;
        // Expresión regular para desarrolladores (Mpteen seguido de los mismos requisitos)
        const devPasswordRegex = /^Mpteen(?=.*[A-Z])(?=.*[a-z])(?=.*\d{4,})(?=.*[@#&]{2,}).{12,}$/;
        
        let isValid = false;
        let isDev = false;
        let strength = 0;
        
        // Verificar si es contraseña de desarrollador
        if (password.startsWith('Mpteen')) {
            isDev = devPasswordRegex.test(password);
            isValid = isDev;
        } else {
            isValid = normalPasswordRegex.test(password);
        }
        
        // Calcular fortaleza de la contraseña (simplificado)
        if (password.length >= 12) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@#&]/.test(password)) strength++;
        
        // Actualizar barra de fortaleza
        passwordStrength.className = `password-strength strength-${strength}`;
        
        // Mostrar mensaje de requisitos (sin mencionar Mpteen)
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
                break;
                
            case 'gallery':
                currentFolder = null;
                loadGalleryFiles();
                loadUserFolders();
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
    
    // Inicializar IndexedDB
    function initDB() {
        return new Promise((resolve, reject) => {
            const DB_NAME = 'mYpuB_DB';
            const DB_VERSION = 3;
            const USER_STORE = 'users';
            const FILE_STORE = 'files';
            const FOLDER_STORE = 'folders';
            
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = function(event) {
                console.error('Error al abrir la base de datos:', event.target.error);
                reject('Error al abrir la base de datos');
            };
            
            request.onsuccess = function(event) {
                db = event.target.result;
                
                // Verificar carpetas vacías periódicamente
                setInterval(checkEmptyFolders, 60 * 60 * 1000); // Cada hora
                
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
                
                // Crear almacén de carpetas (nuevo en versión 3)
                if (!db.objectStoreNames.contains(FOLDER_STORE)) {
                    const folderStore = db.createObjectStore(FOLDER_STORE, { keyPath: 'id', autoIncrement: true });
                    folderStore.createIndex('userEmail', 'userEmail', { unique: false });
                    folderStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }
    
    // Operaciones CRUD para usuarios
    function registerUser(user) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            const request = store.add(user);
            
            request.onsuccess = function() {
                resolve();
            };
            
            request.onerror = function(event) {
                if (event.target.error.name === 'ConstraintError') {
                    reject('El correo electrónico ya está registrado');
                } else {
                    reject('Error al registrar el usuario');
                }
            };
        });
    }
    
    function loginUser(email, password) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            
            const request = store.get(email);
            
            request.onsuccess = function() {
                const user = request.result;
                
                if (user && user.password === password) {
                    resolve(user);
                } else {
                    reject('Credenciales incorrectas');
                }
            };
            
            request.onerror = function() {
                reject('Error al buscar usuario');
            };
        });
    }
    
    // Resto de funciones CRUD para usuarios, archivos y carpetas...
    
    // Manejar el botón de ayuda
    const helpBtn = document.getElementById('helpBtn');
    const helpPanel = document.getElementById('helpPanel');
    const helpOverlay = document.getElementById('helpOverlay');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    
    helpBtn.addEventListener('click', function() {
        helpPanel.style.display = 'block';
        helpOverlay.style.display = 'block';
    });
    
    closeHelpBtn.addEventListener('click', function() {
        helpPanel.style.display = 'none';
        helpOverlay.style.display = 'none';
    });
    
    helpOverlay.addEventListener('click', function() {
        helpPanel.style.display = 'none';
        helpOverlay.style.display = 'none';
    });
    
    // Manejar el formulario de ayuda por email
    const emailHelpForm = document.getElementById('emailHelpForm');
    emailHelpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('helpName').value;
        const email = document.getElementById('helpEmail').value;
        
        // Abrir cliente de email
        window.location.href = `mailto:enzemajr@gmail.com?subject=Consulta%20de%20ayuda%20de%20${encodeURIComponent(name)}&body=Por%20favor%20escriba%20su%20consulta%20aqu%C3%AD...`;
        
        // Cerrar panel de ayuda
        helpPanel.style.display = 'none';
        helpOverlay.style.display = 'none';
        
        // Limpiar formulario
        emailHelpForm.reset();
        
        showToast('Éxito', 'Se ha abierto tu cliente de correo para enviar la consulta');
    });
    
    // Manejar el formulario de ayuda por WhatsApp
    const whatsappHelpForm = document.getElementById('whatsappHelpForm');
    whatsappHelpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('helpWhatsappName').value;
        const number = document.getElementById('helpWhatsappNumber').value;
        
        // Abrir WhatsApp
        window.open(`https://wa.me/+240222084663?text=Hola,%20soy%20${encodeURIComponent(name)}.%20Tengo%20una%20consulta%20sobre%20mYpuB...`, '_blank');
        
        // Cerrar panel de ayuda
        helpPanel.style.display = 'none';
        helpOverlay.style.display = 'none';
        
        // Limpiar formulario
        whatsappHelpForm.reset();
        
        showToast('Éxito', 'Se ha abierto WhatsApp para enviar tu consulta');
    });
    
    // Validar contraseña en tiempo real
    const passwordInput = document.getElementById('password');
    passwordInput.addEventListener('input', function() {
        validatePassword(this.value);
    });
    
    // Manejar cambio de país para actualizar prefijo telefónico
    const countrySelect = document.getElementById('country');
    countrySelect.addEventListener('change', function() {
        updatePhonePrefix();
    });
    
    // Manejar cierre de sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logoutUser();
        });
    }
    
    // Manejar selección de archivos
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const uploadDropzone = document.getElementById('uploadDropzone');
    
    selectFilesBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function() {
        handleFileSelection(this.files);
    });
    
    // Manejar drag and drop
    uploadDropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('active');
    });
    
    uploadDropzone.addEventListener('dragleave', function() {
        this.classList.remove('active');
    });
    
    uploadDropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('active');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files);
        }
    });
    
    uploadDropzone.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Manejar subida de archivos
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    uploadFilesBtn.addEventListener('click', function() {
        uploadSelectedFiles();
    });
    
    // Manejar navegación entre módulos
    const moduleLinks = document.querySelectorAll('[data-module]');
    moduleLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchModule(this.dataset.module);
        });
    });
    
    // Manejar búsqueda en galería
    const searchBtn = document.getElementById('searchBtn');
    searchBtn.addEventListener('click', function() {
        loadGalleryFiles();
    });
    
    const gallerySearch = document.getElementById('gallerySearch');
    gallerySearch.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            loadGalleryFiles();
        }
    });
    
    // Manejar like en archivo
    const likeBtn = document.getElementById('likeBtn');
    likeBtn.addEventListener('click', function() {
        toggleLike(currentFileView.id);
    });
    
    // Manejar descarga de archivo
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.addEventListener('click', function() {
        downloadFile(currentFileView.id);
    });
    
    // Manejar eliminación de archivo
    const deleteBtn = document.getElementById('deleteBtn');
    deleteBtn.addEventListener('click', function() {
        showConfirmModal(
            'Eliminar archivo',
            '¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.',
            () => deleteFile(currentFileView.id)
        );
    });
    
    // Manejar compartir archivo
    const shareBtn = document.getElementById('shareBtn');
    shareBtn.addEventListener('click', function() {
        shareFile();
    });
    
    // Manejar creación de carpeta
    const createFolderBtn = document.getElementById('createFolderBtn');
    createFolderBtn.addEventListener('click', function() {
        showCreateFolderModal();
    });
    
    // Manejar confirmación de acciones
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    confirmActionBtn.addEventListener('click', function() {
        if (currentAction && typeof currentAction === 'function') {
            currentAction();
        }
        confirmModal.hide();
    });
    
    // Manejar creación de carpeta
    const folderForm = document.getElementById('folderForm');
    folderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createFolder();
    });
    
    // Cargar carpetas del usuario
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
                
                // Carpeta "Todos" (por defecto)
                html += `
                    <button class="btn btn-sm ${!currentFolder ? 'btn-primary' : 'btn-outline-primary'} folder-btn" data-folder-id="">
                        <i class="bi bi-folder"></i> Todos
                    </button>
                `;
                
                // Carpetas del usuario
                folders.forEach(folder => {
                    html += `
                        <button class="btn btn-sm ${currentFolder === folder.id ? 'btn-primary' : 'btn-outline-primary'} folder-btn" data-folder-id="${folder.id}">
                            <i class="bi bi-folder${folder.visibility === 'private' ? '-fill' : ''}"></i> ${folder.name}
                        </button>
                    `;
                });
                
                html += '</div>';
                foldersContainer.innerHTML = html;
                
                // Agregar event listeners a los botones de carpeta
                document.querySelectorAll('.folder-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        currentFolder = this.dataset.folderId || null;
                        loadGalleryFiles();
                        loadUserFolders(); // Recargar para actualizar estilos
                    });
                });
            })
            .catch(error => {
                console.error('Error al cargar carpetas:', error);
                foldersContainer.innerHTML = '<p class="text-muted small">Error al cargar carpetas</p>';
            });
    }
    
    // Mostrar modal para crear carpeta
    function showCreateFolderModal() {
        document.getElementById('folderName').value = '';
        document.getElementById('folderVisibility').value = 'public';
        folderModal.show();
    }
    
    // Crear nueva carpeta
    function createFolder() {
        const name = document.getElementById('folderName').value.trim();
        const visibility = document.getElementById('folderVisibility').value;
        
        if (!name) {
            showToast('Error', 'Por favor ingresa un nombre para la carpeta', true);
            return;
        }
        
        const folderData = {
            name: name,
            visibility: visibility,
            userEmail: currentUser.email,
            createdAt: new Date().toISOString(),
            lastChecked: new Date().toISOString()
        };
        
        saveFolder(folderData)
            .then(() => {
                showToast('Éxito', 'Carpeta creada correctamente');
                folderModal.hide();
                loadUserFolders();
            })
            .catch(error => {
                console.error('Error al crear carpeta:', error);
                showToast('Error', 'No se pudo crear la carpeta', true);
            });
    }
    
    // Verificar y eliminar carpetas vacías antiguas
    function checkEmptyFolders() {
        getAllFolders()
            .then(folders => {
                const now = new Date();
                const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
                
                folders.forEach(folder => {
                    // Verificar si la carpeta está vacía y es antigua
                    if (new Date(folder.createdAt) < twentyFourHoursAgo) {
                        getFilesInFolder(folder.id)
                            .then(files => {
                                if (files.length === 0) {
                                    // Eliminar carpeta si está vacía por más de 24 horas
                                    deleteFolder(folder.id)
                                        .then(() => {
                                            console.log(`Carpeta ${folder.name} eliminada por estar vacía más de 24 horas`);
                                        })
                                        .catch(error => {
                                            console.error('Error al eliminar carpeta vacía:', error);
                                        });
                                } else {
                                    // Actualizar fecha de verificación
                                    updateFolder(folder.id, { lastChecked: new Date().toISOString() });
                                }
                            });
                    }
                });
            })
            .catch(error => {
                console.error('Error al verificar carpetas vacías:', error);
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
                <p class="mt-2">Cargando galería...</p>
            </div>
        `;
        
        getAllFiles()
            .then(files => {
                // Filtrar según carpeta actual
                if (currentFolder) {
                    files = files.filter(file => file.folderId === currentFolder);
                } else {
                    // Mostrar todos los archivos que no están en carpetas o son del usuario
                    files = files.filter(file => 
                        !file.folderId || 
                        file.userEmail === currentUser.email
                    );
                }
                
                // Filtrar según búsqueda
                if (searchTerm) {
                    files = files.filter(file => 
                        file.name.toLowerCase().includes(searchTerm) || 
                        file.description?.toLowerCase().includes(searchTerm) ||
                        file.userName.toLowerCase().includes(searchTerm)
                    );
                }
                
                // Filtrar según visibilidad
                files = files.filter(file => {
                    // Mostrar todos los archivos del usuario
                    if (file.userEmail === currentUser.email) return true;
                    
                    // Mostrar archivos públicos
                    if (file.visibility === 'public') return true;
                    
                    // Mostrar archivos compartidos con el usuario
                    if (file.sharedWith.includes(currentUser.email)) return true;
                    
                    return false;
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
                    
                    // Mostrar icono de privacidad
                    let privacyIcon = '';
                    if (file.visibility === 'private') {
                        privacyIcon = '<i class="bi bi-lock-fill text-danger ms-1" title="Privado"></i>';
                    } else if (file.sharedWith.length > 0) {
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
                                        <i class="bi bi-hand-thumbs-up"></i> ${file.likes.length}
                                    </button>
                                    ${file.visibility === 'public' || isOwner ? `
                                        <button class="btn btn-sm btn-outline-success download-btn ms-2" data-file-id="${file.id}">
                                            <i class="bi bi-download"></i>
                                        </button>
                                    ` : ''}
                                </div>
                                <button class="btn btn-sm btn-outline-secondary view-btn" data-file-id="${file.id}">
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
                
                // Agregar event listeners a los botones
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
    
    // Ver archivo en modal
    function viewFile(fileId) {
        getFileById(fileId)
            .then(file => {
                currentFileView = file;
                
                const modalTitle = document.getElementById('fileModalTitle');
                const modalContent = document.getElementById('fileModalContent');
                const likesCount = document.getElementById('fileLikesCount');
                const fileOwner = document.getElementById('fileOwner');
                const fileDate = document.getElementById('fileDate');
                const deleteBtn = document.getElementById('deleteBtn');
                
                modalTitle.textContent = file.name;
                
                if (file.type === 'image') {
                    modalContent.innerHTML = `<img src="data:image/jpeg;base64,${file.data}" class="img-fluid" alt="${file.name}">`;
                } else {
                    modalContent.innerHTML = `
                        <video controls class="w-100">
                            <source src="data:video/mp4;base64,${file.data}" type="video/mp4">
                            Tu navegador no soporta el elemento de video.
                        </video>
                    `;
                }
                
                likesCount.textContent = file.likes.length;
                fileOwner.textContent = `Por: ${file.userName}`;
                fileDate.textContent = new Date(file.uploadDate).toLocaleString();
                
                // Mostrar botón de eliminar solo para el propietario o desarrollador
                deleteBtn.style.display = (file.userEmail === currentUser.email || currentUser.isDeveloper) ? 'block' : 'none';
                
                // Configurar botón de like
                const isLiked = file.likes.includes(currentUser.email);
                likeBtn.className = isLiked ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline-primary';
                
                // Mostrar botón de descarga solo si es público, compartido o el usuario es el propietario
                const canDownload = file.visibility === 'public' || 
                                  file.sharedWith.includes(currentUser.email) || 
                                  file.userEmail === currentUser.email;
                downloadBtn.style.display = canDownload ? 'block' : 'none';
                
                fileModal.show();
            })
            .catch(error => {
                console.error('Error al cargar archivo:', error);
                showToast('Error', 'No se pudo cargar el archivo', true);
            });
    }
    
    // Alternar like en un archivo
    function toggleLike(fileId) {
        getFileById(fileId)
            .then(file => {
                const likes = [...file.likes];
                const userIndex = likes.indexOf(currentUser.email);
                
                if (userIndex === -1) {
                    likes.push(currentUser.email);
                } else {
                    likes.splice(userIndex, 1);
                }
                
                return updateFile(fileId, { likes });
            })
            .then(() => {
                // Actualizar vista si el modal está abierto
                if (currentFileView && currentFileView.id === fileId) {
                    viewFile(fileId);
                }
                
                // Recargar la galería si está activa
                if (document.getElementById('galleryModule').classList.contains('active')) {
                    loadGalleryFiles();
                }
            })
            .catch(error => {
                console.error('Error al actualizar like:', error);
                showToast('Error', 'No se pudo actualizar el like', true);
            });
    }
    
    // Descargar archivo
    function downloadFile(fileId) {
        getFileById(fileId)
            .then(file => {
                // Incrementar contador de descargas
                return updateFile(fileId, { downloads: file.downloads + 1 });
            })
            .then(file => {
                const link = document.createElement('a');
                link.href = `data:${file.type === 'image' ? 'image/jpeg' : 'video/mp4'};base64,${file.data}`;
                link.download = file.name;
                link.click();
                
                showToast('Éxito', 'Descarga iniciada');
            })
            .catch(error => {
                console.error('Error al descargar archivo:', error);
                showToast('Error', 'No se pudo descargar el archivo', true);
            });
    }
    
    // Eliminar archivo
    function deleteFile(fileId) {
        deleteFileFromDB(fileId)
            .then(() => {
                showToast('Éxito', 'Archivo eliminado correctamente');
                fileModal.hide();
                
                // Recargar la galería si está activa
                if (document.getElementById('galleryModule').classList.contains('active')) {
                    loadGalleryFiles();
                }
            })
            .catch(error => {
                console.error('Error al eliminar archivo:', error);
                showToast('Error', 'No se pudo eliminar el archivo', true);
            });
    }
    
    // Cargar usuarios para compartir
    function loadUsersForSharing() {
        const shareUserSelect = document.getElementById('shareUser');
        
        shareUserSelect.innerHTML = `
            <option value="" selected disabled>Cargando usuarios...</option>
        `;
        
        getAllUsers()
            .then(users => {
                // Filtrar usuarios (excluyendo al usuario actual y usuarios desactivados)
                users = users.filter(user => 
                    user.email !== currentUser.email && 
                    user.isActive &&
                    (!currentUser.isDeveloper || user.isDeveloper !== true) // Desarrolladores no pueden compartir con otros desarrolladores
                );
                
                if (users.length === 0) {
                    shareUserSelect.innerHTML = `
                        <option value="" selected disabled>No hay usuarios disponibles</option>
                    `;
                    return;
                }
                
                shareUserSelect.innerHTML = `
                    <option value="" selected disabled>Selecciona un usuario</option>
                    ${users.map(user => `
                        <option value="${user.email}">${user.fullName} (${user.email})</option>
                    `).join('')}
                `;
            })
            .catch(error => {
                console.error('Error al cargar usuarios:', error);
                shareUserSelect.innerHTML = `
                    <option value="" selected disabled>Error al cargar usuarios</option>
                `;
            });
    }
    
    // Cargar archivos del usuario para compartir
    function loadUserFilesForSharing() {
        const shareFileSelect = document.getElementById('shareFile');
        
        shareFileSelect.innerHTML = `
            <option value="" selected disabled>Cargando tus archivos...</option>
        `;
        
        getUserFiles(currentUser.email)
            .then(files => {
                if (files.length === 0) {
                    shareFileSelect.innerHTML = `
                        <option value="" selected disabled>No tienes archivos para compartir</option>
                    `;
                    return;
                }
                
                shareFileSelect.innerHTML = `
                    <option value="" selected disabled>Selecciona un archivo</option>
                    ${files.map(file => `
                        <option value="${file.id}">${file.name} (${new Date(file.uploadDate).toLocaleDateString()})</option>
                    `).join('')}
                `;
                
                // Habilitar botón de compartir si hay archivos
                document.getElementById('shareBtn').disabled = files.length === 0;
            })
            .catch(error => {
                console.error('Error al cargar archivos:', error);
                shareFileSelect.innerHTML = `
                    <option value="" selected disabled>Error al cargar archivos</option>
                `;
            });
    }
    
    // Compartir archivo con otro usuario
    function shareFile() {
        const shareUser = document.getElementById('shareUser').value;
        const shareFile = document.getElementById('shareFile').value;
        const shareMessage = document.getElementById('shareMessage').value;
        
        if (!shareUser || !shareFile) {
            showToast('Error', 'Debes seleccionar un usuario y un archivo', true);
            return;
        }
        
        getFileById(shareFile)
            .then(file => {
                // Verificar que el archivo no esté ya compartido con este usuario
                if (file.sharedWith.includes(shareUser)) {
                    throw new Error('Este archivo ya ha sido compartido con el usuario seleccionado');
                }
                
                // Agregar usuario a la lista de compartidos
                const sharedWith = [...file.sharedWith, shareUser];
                return updateFile(file.id, { sharedWith });
            })
            .then(() => {
                showToast('Éxito', 'Archivo compartido correctamente');
                
                // Limpiar formulario
                document.getElementById('shareMessage').value = '';
                
                // Recargar archivos compartidos
                loadSharedFiles();
            })
            .catch(error => {
                console.error('Error al compartir archivo:', error);
                showToast('Error', error.message || 'No se pudo compartir el archivo', true);
            });
    }
    
    // Cargar archivos compartidos con el usuario actual
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
        
        getAllFiles()
            .then(files => {
                // Filtrar archivos compartidos con el usuario actual
                const sharedFiles = files.filter(file => 
                    file.sharedWith.includes(currentUser.email)
                );
                
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
                
                // Agregar event listeners a los botones
                document.querySelectorAll('.view-shared-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        viewFile(this.dataset.fileId);
                    });
                });
            })
            .catch(error => {
                console.error('Error al cargar archivos compartidos:', error);
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
    
    // Cargar usuarios para gestión (solo desarrollador)
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
        
        getAllUsers()
            .then(users => {
                // Ordenar usuarios por fecha de creación
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
                            </div>
                        </td>
                    `;
                    
                    usersTable.appendChild(row);
                });
                
                // Agregar event listeners a los botones
                document.querySelectorAll('.edit-user-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        editUser(this.dataset.userEmail);
                    });
                });
                
                document.querySelectorAll('.toggle-user-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        toggleUserStatus(this.dataset.userEmail);
                    });
                });
            })
            .catch(error => {
                console.error('Error al cargar usuarios:', error);
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
    
    // Editar usuario (solo desarrollador)
    function editUser(userEmail) {
        showToast('Información', 'La edición de usuarios está en desarrollo', false);
    }
    
    // Alternar estado de usuario (activo/inactivo)
    function toggleUserStatus(userEmail) {
        getUserByEmail(userEmail)
            .then(user => {
                return updateUser(userEmail, { isActive: !user.isActive });
            })
            .then(() => {
                showToast('Éxito', 'Estado de usuario actualizado');
                loadUsersForManagement();
            })
            .catch(error => {
                console.error('Error al actualizar usuario:', error);
                showToast('Error', 'No se pudo actualizar el usuario', true);
            });
    }
    
    // Mostrar modal de confirmación
    function showConfirmModal(title, message, action) {
        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalBody').textContent = message;
        currentAction = action;
        confirmModal.show();
    }
    
    // Operaciones CRUD para usuarios
    function getAllUsers() {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.getAll();
            
            request.onsuccess = function() {
                resolve(request.result);
            };
            
            request.onerror = function() {
                reject('Error al obtener usuarios');
            };
        });
    }
    
    function getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(email);
            
            request.onsuccess = function() {
                if (request.result) {
                    resolve(request.result);
                } else {
                    reject('Usuario no encontrado');
                }
            };
            
            request.onerror = function() {
                reject('Error al buscar usuario');
            };
        });
    }
    
    function updateUser(email, updates) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            // Primero obtener el usuario actual
            const getRequest = store.get(email);
            
            getRequest.onsuccess = function() {
                const user = getRequest.result;
                if (!user) {
                    reject('Usuario no encontrado');
                    return;
                }
                
                // Actualizar propiedades
                const updatedUser = { ...user, ...updates };
                
                // Guardar cambios
                const putRequest = store.put(updatedUser);
                
                putRequest.onsuccess = function() {
                    resolve(updatedUser);
                };
                
                putRequest.onerror = function() {
                    reject('Error al actualizar usuario');
                };
            };
            
            getRequest.onerror = function() {
                reject('Error al obtener usuario');
            };
        });
    }
    
    // Operaciones CRUD para archivos
    function saveFile(fileData) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            
            const request = store.add(fileData);
            
            request.onsuccess = function() {
                resolve(request.result);
            };
            
            request.onerror = function() {
                reject('Error al guardar archivo');
            };
        });
    }
    
    function getAllFiles() {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.getAll();
            
            request.onsuccess = function() {
                resolve(request.result);
            };
            
            request.onerror = function() {
                reject('Error al obtener archivos');
            };
        });
    }
    
    function getUserFiles(userEmail) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const index = store.index('userEmail');
            const request = index.getAll(userEmail);
            
            request.onsuccess = function() {
                resolve(request.result);
            };
            
            request.onerror = function() {
                reject('Error al obtener archivos del usuario');
            };
        });
    }
    
    function getFilesInFolder(folderId) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const index = store.index('folderId');
            const request = index.getAll(folderId);
            
            request.onsuccess = function() {
                resolve(request.result);
            };
            
            request.onerror = function() {
                reject('Error al obtener archivos de la carpeta');
            };
        });
    }
    
    function getFileById(fileId) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(parseInt(fileId));
            
            request.onsuccess = function() {
                if (request.result) {
                    resolve(request.result);
                } else {
                    reject('Archivo no encontrado');
                }
            };
            
            request.onerror = function() {
                reject('Error al buscar archivo');
            };
        });
    }
    
    function updateFile(fileId, updates) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            
            // Primero obtener el archivo actual
            const getRequest = store.get(parseInt(fileId));
            
            getRequest.onsuccess = function() {
                const file = getRequest.result;
                if (!file) {
                    reject('Archivo no encontrado');
                    return;
                }
                
                // Actualizar propiedades
                const updatedFile = { ...file, ...updates };
                
                // Guardar cambios
                const putRequest = store.put(updatedFile);
                
                putRequest.onsuccess = function() {
                    resolve(updatedFile);
                };
                
                putRequest.onerror = function() {
                    reject('Error al actualizar archivo');
                };
            };
            
            getRequest.onerror = function() {
                reject('Error al obtener archivo');
            };
        });
    }
    
    function deleteFileFromDB(fileId) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.delete(parseInt(fileId));
            
            request.onsuccess = function() {
                resolve();
            };
            
            request.onerror = function() {
                reject('Error al eliminar archivo');
            };
        });
    }
    
    // Operaciones CRUD para carpetas
    function saveFolder(folderData) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['folders'], 'readwrite');
            const store = transaction.objectStore('folders');
            
            const request = store.add(folderData);
            
            request.onsuccess = function() {
                resolve(request.result);
            };
            
            request.onerror = function() {
                reject('Error al guardar carpeta');
            };
        });
    }
    
    function getAllFolders() {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['folders'], 'readonly');
            const store = transaction.objectStore('folders');
            const request = store.getAll();
            
            request.onsuccess = function() {
                resolve(request.result);
            };
            
            request.onerror = function() {
                reject('Error al obtener carpetas');
            };
        });
    }
    
    function getUserFolders(userEmail) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['folders'], 'readonly');
            const store = transaction.objectStore('folders');
            const index = store.index('userEmail');
            const request = index.getAll(userEmail);
            
            request.onsuccess = function() {
                resolve(request.result);
            };
            
            request.onerror = function() {
                reject('Error al obtener carpetas del usuario');
            };
        });
    }
    
    function getFolderById(folderId) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['folders'], 'readonly');
            const store = transaction.objectStore('folders');
            const request = store.get(parseInt(folderId));
            
            request.onsuccess = function() {
                if (request.result) {
                    resolve(request.result);
                } else {
                    reject('Carpeta no encontrada');
                }
            };
            
            request.onerror = function() {
                reject('Error al buscar carpeta');
            };
        });
    }
    
    function updateFolder(folderId, updates) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['folders'], 'readwrite');
            const store = transaction.objectStore('folders');
            
            // Primero obtener la carpeta actual
            const getRequest = store.get(parseInt(folderId));
            
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
        });
    }
    
    function deleteFolder(folderId) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject('La base de datos no está inicializada');
                return;
            }
            
            const transaction = db.transaction(['folders'], 'readwrite');
            const store = transaction.objectStore('folders');
            const request = store.delete(parseInt(folderId));
            
            request.onsuccess = function() {
                resolve();
            };
            
            request.onerror = function() {
                reject('Error al eliminar carpeta');
            };
        });
    }
});
