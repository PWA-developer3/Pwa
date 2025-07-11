// Global variables
let db;
let currentUser = null;
let isDeveloper = false;
const countries = [
    { name: 'Afganistán', code: 'AF', callingCode: '+93' },
    { name: 'Albania', code: 'AL', callingCode: '+355' },
    { name: 'Alemania', code: 'DE', callingCode: '+49' },
    { name: 'Andorra', code: 'AD', callingCode: '+376' },
    { name: 'Angola', code: 'AO', callingCode: '+244' },
    { name: 'Antigua y Barbuda', code: 'AG', callingCode: '+1-268' },
    { name: 'Arabia Saudita', code: 'SA', callingCode: '+966' },
    { name: 'Argelia', code: 'DZ', callingCode: '+213' },
    { name: 'Argentina', code: 'AR', callingCode: '+54' },
    { name: 'Armenia', code: 'AM', callingCode: '+374' },
    { name: 'Australia', code: 'AU', callingCode: '+61' },
    { name: 'Austria', code: 'AT', callingCode: '+43' },
    { name: 'Azerbaiyán', code: 'AZ', callingCode: '+994' },
    { name: 'Bahamas', code: 'BS', callingCode: '+1-242' },
    { name: 'Bangladés', code: 'BD', callingCode: '+880' },
    { name: 'Barbados', code: 'BB', callingCode: '+1-246' },
    { name: 'Baréin', code: 'BH', callingCode: '+973' },
    { name: 'Bélgica', code: 'BE', callingCode: '+32' },
    { name: 'Belice', code: 'BZ', callingCode: '+501' },
    { name: 'Benín', code: 'BJ', callingCode: '+229' },
    { name: 'Bielorrusia', code: 'BY', callingCode: '+375' },
    { name: 'Birmania', code: 'MM', callingCode: '+95' },
    { name: 'Bolivia', code: 'BO', callingCode: '+591' },
    { name: 'Bosnia y Herzegovina', code: 'BA', callingCode: '+387' },
    { name: 'Botsuana', code: 'BW', callingCode: '+267' },
    { name: 'Brasil', code: 'BR', callingCode: '+55' },
    { name: 'Brunéi', code: 'BN', callingCode: '+673' },
    { name: 'Bulgaria', code: 'BG', callingCode: '+359' },
    { name: 'Burkina Faso', code: 'BF', callingCode: '+226' },
    { name: 'Burundi', code: 'BI', callingCode: '+257' },
    { name: 'Bután', code: 'BT', callingCode: '+975' },
    { name: 'Cabo Verde', code: 'CV', callingCode: '+238' },
    { name: 'Camboya', code: 'KH', callingCode: '+855' },
    { name: 'Camerún', code: 'CM', callingCode: '+237' },
    { name: 'Canadá', code: 'CA', callingCode: '+1' },
    { name: 'Catar', code: 'QA', callingCode: '+974' },
    { name: 'Chad', code: 'TD', callingCode: '+235' },
    { name: 'Chile', code: 'CL', callingCode: '+56' },
    { name: 'China', code: 'CN', callingCode: '+86' },
    { name: 'Chipre', code: 'CY', callingCode: '+357' },
    { name: 'Ciudad del Vaticano', code: 'VA', callingCode: '+379' },
    { name: 'Colombia', code: 'CO', callingCode: '+57' },
    { name: 'Comoras', code: 'KM', callingCode: '+269' },
    { name: 'Corea del Norte', code: 'KP', callingCode: '+850' },
    { name: 'Corea del Sur', code: 'KR', callingCode: '+82' },
    { name: 'Costa de Marfil', code: 'CI', callingCode: '+225' },
    { name: 'Costa Rica', code: 'CR', callingCode: '+506' },
    { name: 'Croacia', code: 'HR', callingCode: '+385' },
    { name: 'Cuba', code: 'CU', callingCode: '+53' },
    { name: 'Dinamarca', code: 'DK', callingCode: '+45' },
    { name: 'Dominica', code: 'DM', callingCode: '+1-767' },
    { name: 'Ecuador', code: 'EC', callingCode: '+593' },
    { name: 'Egipto', code: 'EG', callingCode: '+20' },
    { name: 'El Salvador', code: 'SV', callingCode: '+503' },
    { name: 'Emiratos Árabes Unidos', code: 'AE', callingCode: '+971' },
    { name: 'Eritrea', code: 'ER', callingCode: '+291' },
    { name: 'Eslovaquia', code: 'SK', callingCode: '+421' },
    { name: 'Eslovenia', code: 'SI', callingCode: '+386' },
    { name: 'España', code: 'ES', callingCode: '+34' },
    { name: 'Estados Unidos', code: 'US', callingCode: '+1' },
    { name: 'Estonia', code: 'EE', callingCode: '+372' },
    { name: 'Etiopía', code: 'ET', callingCode: '+251' },
    { name: 'Filipinas', code: 'PH', callingCode: '+63' },
    { name: 'Finlandia', code: 'FI', callingCode: '+358' },
    { name: 'Fiyi', code: 'FJ', callingCode: '+679' },
    { name: 'Francia', code: 'FR', callingCode: '+33' },
    { name: 'Gabón', code: 'GA', callingCode: '+241' },
    { name: 'Gambia', code: 'GM', callingCode: '+220' },
    { name: 'Georgia', code: 'GE', callingCode: '+995' },
    { name: 'Ghana', code: 'GH', callingCode: '+233' },
    { name: 'Granada', code: 'GD', callingCode: '+1-473' },
    { name: 'Grecia', code: 'GR', callingCode: '+30' },
    { name: 'Guatemala', code: 'GT', callingCode: '+502' },
    { name: 'Guinea', code: 'GN', callingCode: '+224' },
    { name: 'Guinea Ecuatorial', code: 'GQ', callingCode: '+240' },
    { name: 'Guinea-Bisáu', code: 'GW', callingCode: '+245' },
    { name: 'Guyana', code: 'GY', callingCode: '+592' },
    { name: 'Haití', code: 'HT', callingCode: '+509' },
    { name: 'Honduras', code: 'HN', callingCode: '+504' },
    { name: 'Hungría', code: 'HU', callingCode: '+36' },
    { name: 'India', code: 'IN', callingCode: '+91' },
    { name: 'Indonesia', code: 'ID', callingCode: '+62' },
    { name: 'Irak', code: 'IQ', callingCode: '+964' },
    { name: 'Irán', code: 'IR', callingCode: '+98' },
    { name: 'Irlanda', code: 'IE', callingCode: '+353' },
    { name: 'Islandia', code: 'IS', callingCode: '+354' },
    { name: 'Islas Marshall', code: 'MH', callingCode: '+692' },
    { name: 'Islas Salomón', code: 'SB', callingCode: '+677' },
    { name: 'Israel', code: 'IL', callingCode: '+972' },
    { name: 'Italia', code: 'IT', callingCode: '+39' },
    { name: 'Jamaica', code: 'JM', callingCode: '+1-876' },
    { name: 'Japón', code: 'JP', callingCode: '+81' },
    { name: 'Jordania', code: 'JO', callingCode: '+962' },
    { name: 'Kazajistán', code: 'KZ', callingCode: '+7' },
    { name: 'Kenia', code: 'KE', callingCode: '+254' },
    { name: 'Kirguistán', code: 'KG', callingCode: '+996' },
    { name: 'Kiribati', code: 'KI', callingCode: '+686' },
    { name: 'Kuwait', code: 'KW', callingCode: '+965' },
    { name: 'Laos', code: 'LA', callingCode: '+856' },
    { name: 'Lesoto', code: 'LS', callingCode: '+266' },
    { name: 'Letonia', code: 'LV', callingCode: '+371' },
    { name: 'Líbano', code: 'LB', callingCode: '+961' },
    { name: 'Liberia', code: 'LR', callingCode: '+231' },
    { name: 'Libia', code: 'LY', callingCode: '+218' },
    { name: 'Liechtenstein', code: 'LI', callingCode: '+423' },
    { name: 'Lituania', code: 'LT', callingCode: '+370' },
    { name: 'Luxemburgo', code: 'LU', callingCode: '+352' },
    { name: 'Macedonia del Norte', code: 'MK', callingCode: '+389' },
    { name: 'Madagascar', code: 'MG', callingCode: '+261' },
    { name: 'Malasia', code: 'MY', callingCode: '+60' },
    { name: 'Malaui', code: 'MW', callingCode: '+265' },
    { name: 'Maldivas', code: 'MV', callingCode: '+960' },
    { name: 'Malí', code: 'ML', callingCode: '+223' },
    { name: 'Malta', code: 'MT', callingCode: '+356' },
    { name: 'Marruecos', code: 'MA', callingCode: '+212' },
    { name: 'Mauricio', code: 'MU', callingCode: '+230' },
    { name: 'Mauritania', code: 'MR', callingCode: '+222' },
    { name: 'México', code: 'MX', callingCode: '+52' },
    { name: 'Micronesia', code: 'FM', callingCode: '+691' },
    { name: 'Moldavia', code: 'MD', callingCode: '+373' },
    { name: 'Mónaco', code: 'MC', callingCode: '+377' },
    { name: 'Mongolia', code: 'MN', callingCode: '+976' },
    { name: 'Montenegro', code: 'ME', callingCode: '+382' },
    { name: 'Mozambique', code: 'MZ', callingCode: '+258' },
    { name: 'Namibia', code: 'NA', callingCode: '+264' },
    { name: 'Nauru', code: 'NR', callingCode: '+674' },
    { name: 'Nepal', code: 'NP', callingCode: '+977' },
    { name: 'Nicaragua', code: 'NI', callingCode: '+505' },
    { name: 'Níger', code: 'NE', callingCode: '+227' },
    { name: 'Nigeria', code: 'NG', callingCode: '+234' },
    { name: 'Noruega', code: 'NO', callingCode: '+47' },
    { name: 'Nueva Zelanda', code: 'NZ', callingCode: '+64' },
    { name: 'Omán', code: 'OM', callingCode: '+968' },
    { name: 'Países Bajos', code: 'NL', callingCode: '+31' },
    { name: 'Pakistán', code: 'PK', callingCode: '+92' },
    { name: 'Palaos', code: 'PW', callingCode: '+680' },
    { name: 'Panamá', code: 'PA', callingCode: '+507' },
    { name: 'Papúa Nueva Guinea', code: 'PG', callingCode: '+675' },
    { name: 'Paraguay', code: 'PY', callingCode: '+595' },
    { name: 'Perú', code: 'PE', callingCode: '+51' },
    { name: 'Polonia', code: 'PL', callingCode: '+48' },
    { name: 'Portugal', code: 'PT', callingCode: '+351' },
    { name: 'Reino Unido', code: 'GB', callingCode: '+44' },
    { name: 'República Centroafricana', code: 'CF', callingCode: '+236' },
    { name: 'República Checa', code: 'CZ', callingCode: '+420' },
    { name: 'República del Congo', code: 'CG', callingCode: '+242' },
    { name: 'República Democrática del Congo', code: 'CD', callingCode: '+243' },
    { name: 'República Dominicana', code: 'DO', callingCode: '+1-809, +1-829, +1-849' },
    { name: 'Ruanda', code: 'RW', callingCode: '+250' },
    { name: 'Rumanía', code: 'RO', callingCode: '+40' },
    { name: 'Rusia', code: 'RU', callingCode: '+7' },
    { name: 'Samoa', code: 'WS', callingCode: '+685' },
    { name: 'San Cristóbal y Nieves', code: 'KN', callingCode: '+1-869' },
    { name: 'San Marino', code: 'SM', callingCode: '+378' },
    { name: 'San Vicente y las Granadinas', code: 'VC', callingCode: '+1-784' },
    { name: 'Santa Lucía', code: 'LC', callingCode: '+1-758' },
    { name: 'Santo Tomé y Príncipe', code: 'ST', callingCode: '+239' },
    { name: 'Senegal', code: 'SN', callingCode: '+221' },
    { name: 'Serbia', code: 'RS', callingCode: '+381' },
    { name: 'Seychelles', code: 'SC', callingCode: '+248' },
    { name: 'Sierra Leona', code: 'SL', callingCode: '+232' },
    { name: 'Singapur', code: 'SG', callingCode: '+65' },
    { name: 'Siria', code: 'SY', callingCode: '+963' },
    { name: 'Somalia', code: 'SO', callingCode: '+252' },
    { name: 'Sri Lanka', code: 'LK', callingCode: '+94' },
    { name: 'Suazilandia', code: 'SZ', callingCode: '+268' },
    { name: 'Sudáfrica', code: 'ZA', callingCode: '+27' },
    { name: 'Sudán', code: 'SD', callingCode: '+249' },
    { name: 'Sudán del Sur', code: 'SS', callingCode: '+211' },
    { name: 'Suecia', code: 'SE', callingCode: '+46' },
    { name: 'Suiza', code: 'CH', callingCode: '+41' },
    { name: 'Surinam', code: 'SR', callingCode: '+597' },
    { name: 'Tailandia', code: 'TH', callingCode: '+66' },
    { name: 'Tanzania', code: 'TZ', callingCode: '+255' },
    { name: 'Tayikistán', code: 'TJ', callingCode: '+992' },
    { name: 'Timor Oriental', code: 'TL', callingCode: '+670' },
    { name: 'Togo', code: 'TG', callingCode: '+228' },
    { name: 'Tonga', code: 'TO', callingCode: '+676' },
    { name: 'Trinidad y Tobago', code: 'TT', callingCode: '+1-868' },
    { name: 'Túnez', code: 'TN', callingCode: '+216' },
    { name: 'Turkmenistán', code: 'TM', callingCode: '+993' },
    { name: 'Turquía', code: 'TR', callingCode: '+90' },
    { name: 'Tuvalu', code: 'TV', callingCode: '+688' },
    { name: 'Ucrania', code: 'UA', callingCode: '+380' },
    { name: 'Uganda', code: 'UG', callingCode: '+256' },
    { name: 'Uruguay', code: 'UY', callingCode: '+598' },
    { name: 'Uzbekistán', code: 'UZ', callingCode: '+998' },
    { name: 'Vanuatu', code: 'VU', callingCode: '+678' },
    { name: 'Venezuela', code: 'VE', callingCode: '+58' },
    { name: 'Vietnam', code: 'VN', callingCode: '+84' },
    { name: 'Yemen', code: 'YE', callingCode: '+967' },
    { name: 'Yibuti', code: 'DJ', callingCode: '+253' },
    { name: 'Zambia', code: 'ZM', callingCode: '+260' },
    { name: 'Zimbabue', code: 'ZW', callingCode: '+263' }
];

let allUsers = [];

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const showLoginBtn = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');
const authTitle = document.getElementById('auth-title');
const helpBtn = document.getElementById('help-btn');
const helpPanel = document.getElementById('help-panel');
const emailHelpBtn = document.getElementById('email-help');
const whatsappHelpBtn = document.getElementById('whatsapp-help');
const emailHelpForm = document.getElementById('email-help-form');
const whatsappHelpForm = document.getElementById('whatsapp-help-form');
const sendEmailBtn = document.getElementById('send-email');
const sendWhatsappBtn = document.getElementById('send-whatsapp');
const welcomeMessage = document.getElementById('welcome-message');
const sidebarUsername = document.getElementById('sidebar-username');
const logoutBtn = document.getElementById('logout-btn');
const userManagementItem = document.getElementById('user-management-item');
const uploadForm = document.getElementById('upload-form');
const foldersContainer = document.getElementById('folders-container');
const galleryContainer = document.getElementById('gallery-container');
const shareUserSelect = document.getElementById('share-user');
const shareMediaSelect = document.getElementById('share-media');
const shareBtn = document.getElementById('share-btn');
const sharedWithMeContainer = document.getElementById('shared-with-me-container');
const sharedByMeContainer = document.getElementById('shared-by-me-container');
const usersTable = document.getElementById('users-table');
const mediaModal = new bootstrap.Modal(document.getElementById('mediaModal'));
const mediaModalTitle = document.getElementById('mediaModalTitle');
const mediaModalContent = document.getElementById('mediaModalContent');
const mediaModalDescription = document.getElementById('mediaModalDescription');
const mediaModalAuthor = document.getElementById('mediaModalAuthor');
const mediaModalDate = document.getElementById('mediaModalDate');
const likeBtn = document.getElementById('like-btn');
const dislikeBtn = document.getElementById('dislike-btn');
const likeCount = document.getElementById('like-count');
const dislikeCount = document.getElementById('dislike-count');
const downloadBtn = document.getElementById('download-btn');
const shareModalBtn = document.getElementById('share-modal-btn');
const deleteMediaBtn = document.getElementById('delete-media-btn');
const commentsContainer = document.getElementById('comments-container');
const commentInput = document.getElementById('comment-input');
const postCommentBtn = document.getElementById('post-comment-btn');
const userModal = new bootstrap.Modal(document.getElementById('userModal'));
const userEditForm = document.getElementById('user-edit-form');
const saveUserBtn = document.getElementById('save-user-btn');
const deleteUserBtn = document.getElementById('delete-user-btn');
const gallerySearch = document.getElementById('gallery-search');

// Current media being viewed
let currentMedia = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize IndexedDB
    await initDB();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    checkLoggedIn();
    
    // Populate country select in registration form
    populateCountrySelect();
});

// Populate country select
function populateCountrySelect() {
    const countrySelect = document.getElementById('country');
    const editCountrySelect = document.getElementById('edit-country');
    
    // Clear existing options
    countrySelect.innerHTML = '';
    editCountrySelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecciona tu país';
    defaultOption.selected = true;
    defaultOption.disabled = true;
    countrySelect.appendChild(defaultOption);
    
    // Add all countries
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = `${country.name} (${country.callingCode})`;
        option.dataset.callingCode = country.callingCode;
        countrySelect.appendChild(option);
        
        // Also add to edit country select
        const editOption = document.createElement('option');
        editOption.value = country.code;
        editOption.textContent = `${country.name} (${country.callingCode})`;
        editOption.dataset.callingCode = country.callingCode;
        editCountrySelect.appendChild(editOption);
    });
}

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('mYpuBDB', 1);
        
        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database error');
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create users store
            const usersStore = db.createObjectStore('users', { keyPath: 'email' });
            usersStore.createIndex('email', 'email', { unique: true });
            
            // Create media store
            const mediaStore = db.createObjectStore('media', { keyPath: 'id', autoIncrement: true });
            mediaStore.createIndex('userId', 'userId', { unique: false });
            mediaStore.createIndex('folderId', 'folderId', { unique: false });
            mediaStore.createIndex('visibility', 'visibility', { unique: false });
            
            // Create folders store
            const foldersStore = db.createObjectStore('folders', { keyPath: 'id', autoIncrement: true });
            foldersStore.createIndex('userId', 'userId', { unique: false });
            
            // Create shared media store
            const sharedMediaStore = db.createObjectStore('sharedMedia', { keyPath: 'id', autoIncrement: true });
            sharedMediaStore.createIndex('mediaId', 'mediaId', { unique: false });
            sharedMediaStore.createIndex('fromUserId', 'fromUserId', { unique: false });
            sharedMediaStore.createIndex('toUserId', 'toUserId', { unique: false });
            
            // Create likes store
            const likesStore = db.createObjectStore('likes', { keyPath: ['mediaId', 'userId'] });
            likesStore.createIndex('mediaId', 'mediaId', { unique: false });
            likesStore.createIndex('userId', 'userId', { unique: false });
            
            // Create comments store
            const commentsStore = db.createObjectStore('comments', { keyPath: 'id', autoIncrement: true });
            commentsStore.createIndex('mediaId', 'mediaId', { unique: false });
            commentsStore.createIndex('userId', 'userId', { unique: false });
        };
    });
}

// Setup event listeners
function setupEventListeners() {
    // Auth form toggles
    showLoginBtn.addEventListener('click', () => {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        authTitle.textContent = 'Inicie la sesión en ';
        helpPanel.style.display = 'none';
    });
    
    showRegisterBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTitle.textContent = 'Regístrate en ';
    });
    
    // Country select change
    document.getElementById('country').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const callingCode = selectedOption.dataset.callingCode || '';
        document.getElementById('phone-prefix').textContent = callingCode;
    });
    
    // Help button
    helpBtn.addEventListener('click', () => {
        helpPanel.style.display = helpPanel.style.display === 'block' ? 'none' : 'block';
    });
    
    // Email help
    emailHelpBtn.addEventListener('click', () => {
        emailHelpForm.style.display = emailHelpForm.style.display === 'block' ? 'none' : 'block';
        whatsappHelpForm.style.display = 'none';
    });
    
    // WhatsApp help
    whatsappHelpBtn.addEventListener('click', () => {
        whatsappHelpForm.style.display = whatsappHelpForm.style.display === 'block' ? 'none' : 'block';
        emailHelpForm.style.display = 'none';
    });
    
    // Send email
    sendEmailBtn.addEventListener('click', () => {
        const name = document.getElementById('help-name').value.trim();
        const email = document.getElementById('help-email').value.trim();
        
        if (!name || !email) {
            alert('Por favor complete todos los campos');
            return;
        }
        
        if (!validateEmail(email)) {
            alert('Por favor ingrese un email válido');
            return;
        }
        
        const subject = `Consulta de ${name} sobre mYpuB`;
        const body = `Hola desarrollador,\n\nSoy ${name} y tengo una consulta sobre mYpuB.\n\nPor favor responda a este email: ${email}\n\nGracias.`;
        
        window.location.href = `mailto:enzemajr@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
    
    // Send WhatsApp
    sendWhatsappBtn.addEventListener('click', () => {
        const name = document.getElementById('whatsapp-name').value.trim();
        const phone = document.getElementById('whatsapp-phone').value.trim();
        
        if (!name || !phone) {
            alert('Por favor complete todos los campos');
            return;
        }
        
        const message = `Hola desarrollador,\n\nSoy ${name} y tengo una consulta sobre mYpuB.\n\nPor favor contácteme en este número: ${phone}\n\nGracias.`;
        
        window.open(`https://wa.me/+240222084663?text=${encodeURIComponent(message)}`, '_blank');
    });
    
    // Register form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const country = document.getElementById('country').value;
        const phonePrefix = document.getElementById('phone-prefix').textContent;
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate email (must be Gmail)
        if (!email.endsWith('@gmail.com')) {
            document.getElementById('email').classList.add('is-invalid');
            return;
        } else {
            document.getElementById('email').classList.remove('is-invalid');
        }
        
        // Validate password
        if (!validatePassword(password)) {
            document.getElementById('password').classList.add('is-invalid');
            return;
        } else {
            document.getElementById('password').classList.remove('is-invalid');
        }
        
        // Check password match
        if (password !== confirmPassword) {
            document.getElementById('confirm-password').classList.add('is-invalid');
            return;
        } else {
            document.getElementById('confirm-password').classList.remove('is-invalid');
        }
        
        // Check if user already exists
        const userExists = await getUserByEmail(email);
        if (userExists) {
            alert('Ya existe un usuario con este email');
            return;
        }
        
        // Get selected country
        const selectedCountry = countries.find(c => c.code === country);
        
        // Create user object
        const user = {
            fullname,
            email,
            gender,
            country: selectedCountry?.name || '',
            countryCode: country,
            phone: phonePrefix + phone,
            password,
            isBlocked: false,
            createdAt: new Date().toISOString()
        };
        
        // Add user to database
        try {
            await addUser(user);
            
            // Check if this is the developer
            if (password === 'Enzema0097@&') {
                isDeveloper = true;
            }
            
            // Log in the user
            currentUser = user;
            isDeveloper = password === 'Enzema0097@&';
            
            // Show welcome message
            showWelcomeMessage();
            
            // Switch to app view
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            
            // Load user data
            loadUserData();
        } catch (error) {
            console.error('Error registering user:', error);
            alert('Error al registrar el usuario');
        }
    });
    
    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        // Get user from database
        const user = await getUserByEmail(email);
        
        if (!user || user.password !== password) {
            alert('Email o contraseña incorrectos');
            return;
        }
        
        if (user.isBlocked) {
            alert('Este usuario está bloqueado. Contacte al administrador.');
            return;
        }
        
        // Log in the user
        currentUser = user;
        isDeveloper = password === 'Enzema0097@&';
        
        // Show welcome message
        showWelcomeMessage();
        
        // Switch to app view
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        
        // Load user data
        loadUserData();
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        isDeveloper = false;
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
        authTitle.textContent = 'Regístrate en ';
    });
    
    // Navigation links
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            
            // Hide all sections
            document.querySelectorAll('#app-sections > div').forEach(div => {
                div.style.display = 'none';
            });
            
            // Show selected section
            document.getElementById(`${section}-section`).style.display = 'block';
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
            
            // Load section data
            switch (section) {
                case 'gallery':
                    loadPublicGallery();
                    break;
                case 'share':
                    loadShareSection();
                    break;
                case 'users':
                    loadUsersManagement();
                    break;
            }
        });
    });
    
    // Upload form
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const filesInput = document.getElementById('media-files');
        const folderName = document.getElementById('folder-name').value.trim();
        const visibility = document.querySelector('input[name="visibility"]:checked').value;
        const title = document.getElementById('media-title').value.trim();
        const description = document.getElementById('media-description').value.trim();
        
        if (filesInput.files.length === 0) {
            alert('Por favor seleccione al menos un archivo');
            return;
        }
        
        let folderId = null;
        
        // Create folder if name is provided
        if (folderName) {
            const folder = {
                userId: currentUser.email,
                name: folderName,
                createdAt: new Date().toISOString()
            };
            
            folderId = await addFolder(folder);
        }
        
        // Process each file
        for (let i = 0; i < filesInput.files.length; i++) {
            const file = filesInput.files[i];
            
            // Read file as base64
            const base64Data = await readFileAsBase64(file);
            
            // Create media object
            const media = {
                userId: currentUser.email,
                folderId,
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' : 'video',
                data: base64Data,
                size: file.size,
                visibility,
                title: title || file.name,
                description,
                likes: 0,
                dislikes: 0,
                createdAt: new Date().toISOString()
            };
            
            // Add to database
            await addMedia(media);
        }
        
        // Reset form
        filesInput.value = '';
        document.getElementById('folder-name').value = '';
        document.getElementById('media-title').value = '';
        document.getElementById('media-description').value = '';
        
        // Reload folders and gallery
        loadUserFolders();
        loadPublicGallery();
        
        alert('Archivos subidos correctamente');
    });
    
    // Share button
    shareBtn.addEventListener('click', async () => {
        const userId = shareUserSelect.value;
        const mediaId = parseInt(shareMediaSelect.value);
        
        if (!userId || !mediaId) {
            alert('Por favor seleccione un usuario y un archivo');
            return;
        }
        
        // Check if media is already shared with this user
        const isShared = await checkIfShared(mediaId, userId);
        
        if (isShared) {
            alert('Este archivo ya ha sido compartido con este usuario');
            return;
        }
        
        // Create shared media record
        const sharedMedia = {
            mediaId,
            fromUserId: currentUser.email,
            toUserId: userId,
            sharedAt: new Date().toISOString()
        };
        
        await addSharedMedia(sharedMedia);
        
        alert('Archivo compartido correctamente');
        
        // Reload shared media lists
        loadSharedWithMe();
        loadSharedByMe();
    });
    
    // Media modal buttons
    likeBtn.addEventListener('click', async () => {
        if (!currentMedia) return;
        
        // Check if user already liked/disliked
        const existingLike = await getLike(currentMedia.id, currentUser.email);
        
        if (existingLike) {
            if (existingLike.value === 1) {
                // Already liked - remove like
                await removeLike(currentMedia.id, currentUser.email);
                currentMedia.likes--;
            } else {
                // Change dislike to like
                await updateLike(currentMedia.id, currentUser.email, 1);
                currentMedia.likes++;
                currentMedia.dislikes--;
            }
        } else {
            // Add new like
            await addLike(currentMedia.id, currentUser.email, 1);
            currentMedia.likes++;
        }
        
        // Update media in DB
        await updateMedia(currentMedia);
        
        // Update UI
        likeCount.textContent = currentMedia.likes;
        dislikeCount.textContent = currentMedia.dislikes;
    });
    
    dislikeBtn.addEventListener('click', async () => {
        if (!currentMedia) return;
        
        // Check if user already liked/disliked
        const existingLike = await getLike(currentMedia.id, currentUser.email);
        
        if (existingLike) {
            if (existingLike.value === -1) {
                // Already disliked - remove dislike
                await removeLike(currentMedia.id, currentUser.email);
                currentMedia.dislikes--;
            } else {
                // Change like to dislike
                await updateLike(currentMedia.id, currentUser.email, -1);
                currentMedia.dislikes++;
                currentMedia.likes--;
            }
        } else {
            // Add new dislike
            await addLike(currentMedia.id, currentUser.email, -1);
            currentMedia.dislikes++;
        }
        
        // Update media in DB
        await updateMedia(currentMedia);
        
        // Update UI
        likeCount.textContent = currentMedia.likes;
        dislikeCount.textContent = currentMedia.dislikes;
    });
    
    downloadBtn.addEventListener('click', () => {
        if (!currentMedia) return;
        
        downloadMedia(currentMedia);
    });
    
    shareModalBtn.addEventListener('click', () => {
        if (!currentMedia) return;
        
        // Set the media in share select
        shareMediaSelect.value = currentMedia.id;
        
        // Switch to share section
        document.querySelectorAll('#app-sections > div').forEach(div => {
            div.style.display = 'none';
        });
        document.getElementById('share-section').style.display = 'block';
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        document.querySelector('[data-section="share"]').classList.add('active');
        
        // Close modal
        mediaModal.hide();
    });
    
    deleteMediaBtn.addEventListener('click', async () => {
        if (!currentMedia) return;
        
        if (confirm('¿Está seguro que desea eliminar este archivo?')) {
            await deleteMedia(currentMedia.id);
            mediaModal.hide();
            
            // Reload galleries
            loadUserFolders();
            loadPublicGallery();
        }
    });
    
    // Post comment
    postCommentBtn.addEventListener('click', async () => {
        if (!currentMedia || !commentInput.value.trim()) return;
        
        const comment = {
            mediaId: currentMedia.id,
            userId: currentUser.email,
            text: commentInput.value.trim(),
            createdAt: new Date().toISOString()
        };
        
        await addComment(comment);
        commentInput.value = '';
        
        // Reload comments
        loadComments(currentMedia.id);
    });
    
    // User management
    saveUserBtn.addEventListener('click', async () => {
        const userId = document.getElementById('edit-user-id').value;
        const fullname = document.getElementById('edit-fullname').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const gender = document.querySelector('input[name="edit-gender"]:checked').value;
        const country = document.getElementById('edit-country').value;
        const phonePrefix = document.getElementById('edit-phone-prefix').textContent;
        const phone = document.getElementById('edit-phone').value.trim();
        const isBlocked = document.getElementById('edit-is-blocked').checked;
        
        // Get selected country
        const selectedCountry = countries.find(c => c.code === country);
        
        // Update user
        const user = {
            fullname,
            email,
            gender,
            country: selectedCountry?.name || '',
            countryCode: country,
            phone: phonePrefix + phone,
            isBlocked,
            password: allUsers.find(u => u.email === email)?.password || ''
        };
        
        await updateUser(user);
        userModal.hide();
        
        // Reload users table
        loadUsersManagement();
    });
    
    deleteUserBtn.addEventListener('click', async () => {
        const email = document.getElementById('edit-email').value;
        
        if (confirm(`¿Está seguro que desea eliminar al usuario ${email}?`)) {
            await deleteUser(email);
            userModal.hide();
            
            // Reload users table
            loadUsersManagement();
            
            // If deleted user is current user, log out
            if (currentUser.email === email) {
                currentUser = null;
                authContainer.style.display = 'block';
                appContainer.style.display = 'none';
            }
        }
    });
    
    // Gallery search
    gallerySearch.addEventListener('input', () => {
        loadPublicGallery(gallerySearch.value.trim());
    });
}

// Check if user is already logged in
function checkLoggedIn() {
    // In a real app, you would check session storage or cookies
    // For this demo, we'll just show the auth container
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
}

// Show welcome message
function showWelcomeMessage() {
    let message = '';
    
    if (currentUser.gender === 'Hombre') {
        message = `Bienvenido a <span class="brand">mYpuB</span> Sr. ${currentUser.fullname}`;
    } else if (currentUser.gender === 'Mujer') {
        message = `Bienvenida a <span class="brand">mYpuB</span> Sra. ${currentUser.fullname}`;
    } else {
        message = `Gracias por utilizar <span class="brand">mYpuB</span>`;
    }
    
    welcomeMessage.innerHTML = message;
    sidebarUsername.textContent = currentUser.fullname;
    
    // Show user management if developer
    userManagementItem.style.display = isDeveloper ? 'block' : 'none';
}

// Load user data
function loadUserData() {
    loadUserFolders();
    loadPublicGallery();
    loadSharedWithMe();
    loadSharedByMe();
}

// Load user folders
async function loadUserFolders() {
    if (!currentUser) return;
    
    const folders = await getUserFolders(currentUser.email);
    foldersContainer.innerHTML = '';
    
    if (folders.length === 0) {
        foldersContainer.innerHTML = '<p>No tienes carpetas aún. Crea una al subir archivos.</p>';
        return;
    }
    
    folders.forEach(folder => {
        const folderCol = document.createElement('div');
        folderCol.className = 'col-md-4 mb-3';
        
        folderCol.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${folder.name}</h5>
                    <button class="btn btn-sm btn-outline-primary view-folder" data-id="${folder.id}">Ver contenido</button>
                </div>
            </div>
        `;
        
        foldersContainer.appendChild(folderCol);
    });
    
    // Add event listeners to folder buttons
    document.querySelectorAll('.view-folder').forEach(btn => {
        btn.addEventListener('click', async () => {
            const folderId = parseInt(btn.getAttribute('data-id'));
            const folderMedia = await getMediaByFolder(currentUser.email, folderId);
            
            // Display media in gallery container
            displayMedia(folderMedia, galleryContainer);
            
            // Switch to gallery section
            document.querySelectorAll('#app-sections > div').forEach(div => {
                div.style.display = 'none';
            });
            document.getElementById('gallery-section').style.display = 'block';
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            document.querySelector('[data-section="gallery"]').classList.add('active');
        });
    });
}

// Load public gallery
async function loadPublicGallery(searchTerm = '') {
    let media;
    
    if (isDeveloper) {
        // Developer can see all media
        media = await getAllMedia();
    } else {
        // Regular users see public media and their own private media
        const publicMedia = await getPublicMedia();
        const userMedia = await getUserMedia(currentUser.email);
        media = [...publicMedia, ...userMedia.filter(m => m.visibility === 'private')];
    }
    
    // Filter by search term if provided
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        media = media.filter(m => 
            m.title.toLowerCase().includes(term) || 
            m.description.toLowerCase().includes(term) ||
            m.name.toLowerCase().includes(term)
        );
    }
    
    // Display media
    displayMedia(media, galleryContainer);
}

// Display media in a container
function displayMedia(media, container) {
    container.innerHTML = '';
    
    if (media.length === 0) {
        container.innerHTML = '<p>No hay archivos para mostrar.</p>';
        return;
    }
    
    media.forEach(item => {
        const mediaCol = document.createElement('div');
        mediaCol.className = 'col-md-4 mb-4';
        
        mediaCol.innerHTML = `
            <div class="card media-card">
                ${item.type === 'image' ? 
                    `<img src="${item.data}" class="card-img-top" alt="${item.title}">` : 
                    `<video class="card-img-top" controls><source src="${item.data}" type="${item.type === 'video' ? 'video/mp4' : ''}"></video>`}
                <div class="card-body">
                    <h5 class="card-title">${item.title}</h5>
                    <p class="card-text">${item.description || 'Sin descripción'}</p>
                    <small class="text-muted">Subido por: ${item.userId}</small>
                </div>
                <div class="media-actions">
                    <button class="btn btn-sm btn-outline-primary view-media" data-id="${item.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <span class="badge bg-light text-dark">
                        <i class="bi bi-hand-thumbs-up"></i> ${item.likes}
                    </span>
                </div>
            </div>
        `;
        
        container.appendChild(mediaCol);
    });
    
    // Add event listeners to media buttons
    document.querySelectorAll('.view-media').forEach(btn => {
        btn.addEventListener('click', async () => {
            const mediaId = parseInt(btn.getAttribute('data-id'));
            const mediaItem = await getMediaById(mediaId);
            
            if (!mediaItem) return;
            
            currentMedia = mediaItem;
            
            // Show media in modal
            mediaModalTitle.textContent = mediaItem.title;
            mediaModalDescription.textContent = mediaItem.description || 'Sin descripción';
            mediaModalAuthor.textContent = mediaItem.userId;
            mediaModalDate.textContent = new Date(mediaItem.createdAt).toLocaleString();
            likeCount.textContent = mediaItem.likes;
            dislikeCount.textContent = mediaItem.dislikes;
            
            // Set media content
            mediaModalContent.innerHTML = '';
            if (mediaItem.type === 'image') {
                const img = document.createElement('img');
                img.src = mediaItem.data;
                img.className = 'img-fluid';
                img.alt = mediaItem.title;
                mediaModalContent.appendChild(img);
            } else {
                const video = document.createElement('video');
                video.controls = true;
                video.className = 'img-fluid';
                const source = document.createElement('source');
                source.src = mediaItem.data;
                source.type = 'video/mp4';
                video.appendChild(source);
                mediaModalContent.appendChild(video);
            }
            
            // Show/hide action buttons
            const canEdit = isDeveloper || mediaItem.userId === currentUser.email;
            shareModalBtn.style.display = canEdit ? 'inline-block' : 'none';
            deleteMediaBtn.style.display = canEdit ? 'inline-block' : 'none';
            
            // Load comments
            loadComments(mediaItem.id);
            
            // Show modal
            mediaModal.show();
        });
    });
}

// Load share section
async function loadShareSection() {
    // Load users for sharing
    const users = await getAllUsers();
    allUsers = users;
    
    // Filter out current user
    const otherUsers = users.filter(u => u.email !== currentUser.email);
    
    // Populate user select
    shareUserSelect.innerHTML = '<option value="" selected disabled>Selecciona un usuario</option>';
    otherUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.email;
        option.textContent = `${user.fullname} (${user.email})`;
        shareUserSelect.appendChild(option);
    });
    
    // Load user's media for sharing
    const userMedia = await getUserMedia(currentUser.email);
    
    // Populate media select
    shareMediaSelect.innerHTML = '<option value="" selected disabled>Selecciona un archivo</option>';
    userMedia.forEach(media => {
        const option = document.createElement('option');
        option.value = media.id;
        option.textContent = media.title;
        shareMediaSelect.appendChild(option);
    });
    
    // Load shared media
    loadSharedWithMe();
    loadSharedByMe();
}

// Load shared with me
async function loadSharedWithMe() {
    const sharedWithMe = await getSharedWithUser(currentUser.email);
    
    if (sharedWithMe.length === 0) {
        sharedWithMeContainer.innerHTML = '<p>No tienes archivos compartidos contigo.</p>';
        return;
    }
    
    // Get media details
    const mediaItems = await Promise.all(
        sharedWithMe.map(async share => {
            const media = await getMediaById(share.mediaId);
            const user = await getUserByEmail(share.fromUserId);
            return { ...media, sharedBy: user.fullname };
        })
    );
    
    // Display media
    displaySharedMedia(mediaItems, sharedWithMeContainer, true);
}

// Load shared by me
async function loadSharedByMe() {
    const sharedByMe = await getSharedByUser(currentUser.email);
    
    if (sharedByMe.length === 0) {
        sharedByMeContainer.innerHTML = '<p>No has compartido archivos con otros usuarios.</p>';
        return;
    }
    
    // Get media details
    const mediaItems = await Promise.all(
        sharedByMe.map(async share => {
            const media = await getMediaById(share.mediaId);
            const user = await getUserByEmail(share.toUserId);
            return { ...media, sharedWith: user.fullname };
        })
    );
    
    // Display media
    displaySharedMedia(mediaItems, sharedByMeContainer, false);
}

// Display shared media
function displaySharedMedia(media, container, isSharedWithMe) {
    container.innerHTML = '';
    
    media.forEach(item => {
        const mediaCol = document.createElement('div');
        mediaCol.className = 'col-md-6 mb-3';
        
        mediaCol.innerHTML = `
            <div class="card">
                <div class="row g-0">
                    <div class="col-md-4">
                        ${item.type === 'image' ? 
                            `<img src="${item.data}" class="img-fluid rounded-start" alt="${item.title}" style="height: 100%; object-fit: cover;">` : 
                            `<video class="img-fluid rounded-start" style="height: 100%; object-fit: cover;"><source src="${item.data}" type="${item.type === 'video' ? 'video/mp4' : ''}"></video>`}
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h6 class="card-title">${item.title}</h6>
                            <p class="card-text"><small>${isSharedWithMe ? `Compartido por: ${item.sharedBy}` : `Compartido con: ${item.sharedWith}`}</small></p>
                            <button class="btn btn-sm btn-outline-primary view-shared" data-id="${item.id}">Ver</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(mediaCol);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-shared').forEach(btn => {
        btn.addEventListener('click', async () => {
            const mediaId = parseInt(btn.getAttribute('data-id'));
            const mediaItem = await getMediaById(mediaId);
            
            if (!mediaItem) return;
            
            currentMedia = mediaItem;
            
            // Show media in modal
            mediaModalTitle.textContent = mediaItem.title;
            mediaModalDescription.textContent = mediaItem.description || 'Sin descripción';
            mediaModalAuthor.textContent = mediaItem.userId;
            mediaModalDate.textContent = new Date(mediaItem.createdAt).toLocaleString();
            likeCount.textContent = mediaItem.likes;
            dislikeCount.textContent = mediaItem.dislikes;
            
            // Set media content
            mediaModalContent.innerHTML = '';
            if (mediaItem.type === 'image') {
                const img = document.createElement('img');
                img.src = mediaItem.data;
                img.className = 'img-fluid';
                img.alt = mediaItem.title;
                mediaModalContent.appendChild(img);
            } else {
                const video = document.createElement('video');
                video.controls = true;
                video.className = 'img-fluid';
                const source = document.createElement('source');
                source.src = mediaItem.data;
                source.type = 'video/mp4';
                video.appendChild(source);
                mediaModalContent.appendChild(video);
            }
            
            // Show/hide action buttons
            const canEdit = isDeveloper || mediaItem.userId === currentUser.email;
            shareModalBtn.style.display = canEdit ? 'inline-block' : 'none';
            deleteMediaBtn.style.display = canEdit ? 'inline-block' : 'none';
            
            // Load comments
            loadComments(mediaItem.id);
            
            // Show modal
            mediaModal.show();
        });
    });
}

// Load users management
async function loadUsersManagement() {
    if (!isDeveloper) return;
    
    const users = await getAllUsers();
    allUsers = users;
    
    usersTable.innerHTML = '';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${user.fullname}</td>
            <td>${user.email}</td>
            <td>${user.country}</td>
            <td>${user.isBlocked ? '<span class="badge bg-danger">Bloqueado</span>' : '<span class="badge bg-success">Activo</span>'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-user" data-email="${user.email}">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        `;
        
        usersTable.appendChild(tr);
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', async () => {
            const email = btn.getAttribute('data-email');
            const user = await getUserByEmail(email);
            
            if (!user) return;
            
            // Populate edit form
            document.getElementById('edit-user-id').value = user.email;
            document.getElementById('edit-fullname').value = user.fullname;
            document.getElementById('edit-email').value = user.email;
            
            // Set gender
            document.querySelectorAll('input[name="edit-gender"]').forEach(radio => {
                radio.checked = radio.value === user.gender;
            });
            
            // Set country
            const countrySelect = document.getElementById('edit-country');
            countrySelect.innerHTML = '';
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country.code;
                option.textContent = `${country.name} (${country.callingCode})`;
                option.dataset.callingCode = country.callingCode;
                option.selected = country.name === user.country;
                countrySelect.appendChild(option);
            });
            
            // Set phone
            const phoneParts = user.phone.match(/^(\+\d+)(\d+)$/);
            if (phoneParts) {
                document.getElementById('edit-phone-prefix').textContent = phoneParts[1];
                document.getElementById('edit-phone').value = phoneParts[2];
            }
            
            // Set blocked status
            document.getElementById('edit-is-blocked').checked = user.isBlocked;
            
            // Show delete button if not current user
            deleteUserBtn.style.display = user.email !== currentUser.email ? 'block' : 'none';
            
            // Show modal
            userModal.show();
        });
    });
}

// Load comments for media
async function loadComments(mediaId) {
    const comments = await getCommentsForMedia(mediaId);
    commentsContainer.innerHTML = '';
    
    if (comments.length === 0) {
        commentsContainer.innerHTML = '<p>No hay comentarios aún.</p>';
        return;
    }
    
    // Get user details for each comment
    const commentsWithUsers = await Promise.all(
        comments.map(async comment => {
            const user = await getUserByEmail(comment.userId);
            return { ...comment, userName: user.fullname };
        })
    );
    
    // Display comments
    commentsWithUsers.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'mb-2 p-2 bg-light rounded';
        
        commentDiv.innerHTML = `
            <div class="d-flex justify-content-between">
                <strong>${comment.userName}</strong>
                <small class="text-muted">${new Date(comment.createdAt).toLocaleString()}</small>
            </div>
            <div>${comment.text}</div>
        `;
        
        commentsContainer.appendChild(commentDiv);
    });
}

// Validate email
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return re.test(email);
}

// Validate password
function validatePassword(password) {
    // 6 letters (first uppercase), 4 numbers, 2 symbols (@#&)
    const re = /^(?=(.*[A-Z]){1})(?=(.*[a-z]){5})(?=(.*\d){4})(?=(.*[@#&]){2})[A-Za-z\d@#&]{12}$/;
    return re.test(password);
}

// Read file as base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Download media
function downloadMedia(media) {
    const link = document.createElement('a');
    link.href = media.data;
    link.download = media.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Database operations
function addUser(user) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.add(user);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.get(email);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getAllUsers() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function updateUser(user) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.put(user);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function deleteUser(email) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.delete(email);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function addFolder(folder) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['folders'], 'readwrite');
        const store = transaction.objectStore('folders');
        const request = store.add(folder);
        
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getUserFolders(userId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['folders'], 'readonly');
        const store = transaction.objectStore('folders');
        const index = store.index('userId');
        const request = index.getAll(userId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function addMedia(media) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['media'], 'readwrite');
        const store = transaction.objectStore('media');
        const request = store.add(media);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function getMediaById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['media'], 'readonly');
        const store = transaction.objectStore('media');
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getUserMedia(userId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['media'], 'readonly');
        const store = transaction.objectStore('media');
        const index = store.index('userId');
        const request = index.getAll(userId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getMediaByFolder(userId, folderId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['media'], 'readonly');
        const store = transaction.objectStore('media');
        const index = store.index('folderId');
        const request = index.getAll(folderId);
        
        request.onsuccess = () => {
            const media = request.result.filter(m => m.userId === userId);
            resolve(media);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

function getPublicMedia() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['media'], 'readonly');
        const store = transaction.objectStore('media');
        const index = store.index('visibility');
        const request = index.getAll('public');
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getAllMedia() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['media'], 'readonly');
        const store = transaction.objectStore('media');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function updateMedia(media) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['media'], 'readwrite');
        const store = transaction.objectStore('media');
        const request = store.put(media);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function deleteMedia(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['media'], 'readwrite');
        const store = transaction.objectStore('media');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function addSharedMedia(sharedMedia) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sharedMedia'], 'readwrite');
        const store = transaction.objectStore('sharedMedia');
        const request = store.add(sharedMedia);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function getSharedWithUser(userId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sharedMedia'], 'readonly');
        const store = transaction.objectStore('sharedMedia');
        const index = store.index('toUserId');
        const request = index.getAll(userId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getSharedByUser(userId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sharedMedia'], 'readonly');
        const store = transaction.objectStore('sharedMedia');
        const index = store.index('fromUserId');
        const request = index.getAll(userId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function checkIfShared(mediaId, userId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sharedMedia'], 'readonly');
        const store = transaction.objectStore('sharedMedia');
        const index = store.index('toUserId');
        const request = index.getAll(userId);
        
        request.onsuccess = () => {
            const isShared = request.result.some(share => share.mediaId === mediaId);
            resolve(isShared);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

function addLike(mediaId, userId, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['likes'], 'readwrite');
        const store = transaction.objectStore('likes');
        const request = store.add({ mediaId, userId, value });
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function getLike(mediaId, userId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['likes'], 'readonly');
        const store = transaction.objectStore('likes');
        const request = store.get([mediaId, userId]);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function updateLike(mediaId, userId, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['likes'], 'readwrite');
        const store = transaction.objectStore('likes');
        const request = store.put({ mediaId, userId, value });
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function removeLike(mediaId, userId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['likes'], 'readwrite');
        const store = transaction.objectStore('likes');
        const request = store.delete([mediaId, userId]);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function addComment(comment) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['comments'], 'readwrite');
        const store = transaction.objectStore('comments');
        const request = store.add(comment);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function getCommentsForMedia(mediaId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['comments'], 'readonly');
        const store = transaction.objectStore('comments');
        const index = store.index('mediaId');
        const request = index.getAll(mediaId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}
