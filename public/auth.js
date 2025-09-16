// Cognito Configuration
const COGNITO_CONFIG = {
    UserPoolId: 'ap-south-1_kajtyBPTH',
    ClientId: '11bsmqndbd8dj7k58hs7u6at2a',
    Region: 'ap-south-1'
};

// Initialize Cognito
AWS.config.region = COGNITO_CONFIG.Region;
const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: COGNITO_CONFIG.UserPoolId,
    ClientId: COGNITO_CONFIG.ClientId
});

let currentUser = null;

// Check if user is already logged in
function checkAuthStatus() {
    currentUser = userPool.getCurrentUser();
    
    if (currentUser) {
        currentUser.getSession((err, session) => {
            if (err) {
                console.error('Session error:', err);
                updateAuthUI(false);
                return;
            }
            
            if (session.isValid()) {
                console.log('User is logged in');
                
                // Get user attributes to get the name
                currentUser.getUserAttributes((err, attributes) => {
                    if (err) {
                        console.error('Error getting user attributes:', err);
                        updateAuthUI(true, 'Profile');
                        return;
                    }
                    
                    const nameAttr = attributes.find(attr => attr.Name === 'name');
                    const emailAttr = attributes.find(attr => attr.Name === 'email');
                    
                    const displayName = nameAttr ? nameAttr.Value : (emailAttr ? emailAttr.Value.split('@')[0] : 'Profile');
                    updateAuthUI(true, displayName);
                });
            } else {
                updateAuthUI(false);
            }
        });
    } else {
        updateAuthUI(false);
    }
}

// Update UI based on auth status
function updateAuthUI(isLoggedIn, username = '') {
    const authBtn = document.querySelector('.auth-btn');
    
    if (isLoggedIn) {
        authBtn.innerHTML = `👤 ▼`;
        authBtn.className = 'auth-btn user-profile';
        authBtn.onclick = toggleProfileMenu;
        
        // Create profile menu if it doesn't exist
        let profileMenu = document.getElementById('profileMenu');
        if (!profileMenu) {
            profileMenu = document.createElement('div');
            profileMenu.id = 'profileMenu';
            profileMenu.className = 'profile-menu';
            profileMenu.style.display = 'none';
            profileMenu.innerHTML = `
                <div class="profile-header">👤 ${username}</div>
                <div class="profile-item" onclick="showProfile()">👤 My Profile</div>
                <div class="profile-item" onclick="showSettings()">⚙️ Settings</div>
                <div class="profile-item" onclick="showSubscription()">💳 Subscription</div>
                <div class="profile-item" onclick="logout()">🚪 Logout</div>
            `;
            authBtn.parentNode.appendChild(profileMenu);
        }
    } else {
        authBtn.innerHTML = 'Login / Signup';
        authBtn.className = 'auth-btn';
        authBtn.onclick = showAuthModal;
        
        // Remove profile menu if it exists
        const profileMenu = document.getElementById('profileMenu');
        if (profileMenu) {
            profileMenu.remove();
        }
    }
}

// Show authentication modal
function showAuthModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <span class="close-modal" onclick="closeAuthModal()">&times;</span>
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="showLogin()">Login</button>
                <button class="auth-tab" onclick="showSignup()">Sign Up</button>
            </div>
            
            <!-- Login Form -->
            <div id="loginForm" class="auth-form">
                <h3>Login to PKRK FM</h3>
                <input type="email" id="loginContact" placeholder="Email Address" required>
                <div class="password-container">
                    <input type="password" id="loginPassword" placeholder="Password" required>
                    <span class="password-toggle" onclick="togglePassword('loginPassword', this)">👁️</span>
                </div>
                <button onclick="login()" class="auth-submit-btn">Login</button>
                <p class="auth-link">Forgot password? <a href="#" onclick="showForgotPassword()">Reset here</a></p>
            </div>
            
            <!-- Signup Form -->
            <div id="signupForm" class="auth-form" style="display: none;">
                <h3>Join PKRK FM</h3>
                <input type="text" id="signupName" placeholder="Full Name" required>
                <input type="email" id="signupContact" placeholder="Email Address" required>
                <div class="password-container">
                    <input type="password" id="signupPassword" placeholder="Password (min 8 chars)" required>
                    <span class="password-toggle" onclick="togglePassword('signupPassword', this)">👁️</span>
                </div>
                <div class="password-container">
                    <input type="password" id="confirmPassword" placeholder="Confirm Password" required>
                    <span class="password-toggle" onclick="togglePassword('confirmPassword', this)">👁️</span>
                </div>
                <button onclick="signup()" class="auth-submit-btn">Sign Up</button>
                <p class="auth-note">Enter your email address to create an account</p>
            </div>
            
            <!-- Verification Form -->
            <div id="verifyForm" class="auth-form" style="display: none;">
                <h3>Verify Your Account</h3>
                <p id="verifyMessage">Enter the verification code sent to your contact</p>
                <input type="text" id="verifyCode" placeholder="Verification Code" required>
                <button onclick="verifyUser()" class="auth-submit-btn">Verify</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close modal
function closeAuthModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) modal.remove();
}

// Switch between login/signup tabs
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('verifyForm').style.display = 'none';
    
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('verifyForm').style.display = 'none';
    
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

// Utility function to detect if input is email or mobile
function isEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
}

function isMobile(input) {
    const mobileRegex = /^[+]?[0-9]{10,15}$/;
    return mobileRegex.test(input.replace(/\s+/g, ''));
}

// Login function
function login() {
    console.log('Login function called');
    
    const email = document.getElementById('loginContact').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    console.log('Login values:', { email, password: password ? 'provided' : 'empty' });
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    const authenticationData = {
        Username: email,
        Password: password
    };
    
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    const userData = {
        Username: email,
        Pool: userPool
    };
    
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
            console.log('Login successful:', result);
            closeAuthModal();
            // Small delay to ensure user data is available
            setTimeout(checkAuthStatus, 500);
        },
        onFailure: (err) => {
            console.error('Login failed:', err);
            alert('Login failed: ' + err.message);
        }
    });
}

// Toggle password visibility
function togglePassword(inputId, toggleElement) {
    const input = document.getElementById(inputId);
    
    if (input && input.type === 'password') {
        input.type = 'text';
        toggleElement.innerHTML = '🙈'; // See no evil monkey
    } else if (input) {
        input.type = 'password';
        toggleElement.innerHTML = '👁️'; // Eye
    }
}

// Signup function
function signup() {
    console.log('Signup function called');
    
    const name = document.getElementById('signupName').value.trim();
    const contact = document.getElementById('signupContact').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    console.log('Form values:', { name, contact, password: password ? 'provided' : 'empty' });
    
    if (!name || !contact || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Simple email signup only for now
    if (!isEmail(contact)) {
        alert('Please enter a valid email address');
        return;
    }
    
    console.log('Starting Cognito signup...');
    
    const attributeList = [
        new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'name',
            Value: name
        }),
        new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: contact
        })
    ];
    
    userPool.signUp(contact, password, attributeList, null, (err, result) => {
        if (err) {
            console.error('Signup failed:', err);
            alert('Signup failed: ' + err.message);
            return;
        }
        
        console.log('Signup successful:', result);
        window.signupContact = contact;
        
        // Show verification form
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('verifyForm').style.display = 'block';
        document.getElementById('verifyMessage').textContent = 'Enter the verification code sent to your email';
    });
}

// Verify user
function verifyUser() {
    const code = document.getElementById('verifyCode').value.trim();
    
    if (!code) {
        alert('Please enter verification code');
        return;
    }
    
    const userData = {
        Username: window.signupContact,
        Pool: userPool
    };
    
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    
    cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
            console.error('Verification failed:', err);
            alert('Verification failed: ' + err.message);
            return;
        }
        
        console.log('Verification successful');
        alert('Account verified! Please login.');
        closeAuthModal();
    });
}

// Logout function
function logout() {
    if (currentUser) {
        currentUser.signOut();
        currentUser = null;
        updateAuthUI(false);
        console.log('User logged out');
    }
}

// Show Free Trial Signup
function showFreeTrialSignup() {
    showTrialOfferModal();
}

// Show Trial Offer Modal
function showTrialOfferModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content trial-offer">
            <span class="close-modal" onclick="closeTrialModal()">&times;</span>
            <div class="trial-content">
                <div class="trial-header">
                    <div class="trial-badge">
                        <span class="close-trial" onclick="closeTrialModal()">❌</span>
                        <span class="trial-days">7 Days FREE</span>
                        <span class="trial-rating">4.6 ⭐ (1M reviews)</span>
                    </div>
                </div>
                
                <div class="trial-offer">
                    <h3>Start trial - Pay ₹2 (Refunded)</h3>
                    <p class="trial-info">Cancel Anytime</p>
                </div>
                
                <div class="trial-benefits">
                    <div class="benefit">🎧 10,000+ shows • 🎵 Unlimited content</div>
                    <div class="benefit">📱 Offline download • 🚫 No ads</div>
                </div>
                
                <div class="trial-pricing">
                    <strong>Then ₹499/3 Months</strong>
                </div>
                
                <button onclick="proceedToSignup()" class="trial-start-btn">Start Free Trial</button>
                <p class="trial-terms">Terms & Conditions apply</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close trial modal
function closeTrialModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) modal.remove();
}

// Proceed to signup after trial offer
function proceedToSignup() {
    closeTrialModal();
    showAuthModal();
    // Auto-switch to signup tab
    setTimeout(() => {
        showSignup();
    }, 100);
}

// Go to Home
function goHome() {
    // Reset to categories view
    currentView = 'categories';
    currentCategory = '';
    currentSubcategory = '';
    currentShow = null;
    currentSeason = '';
    
    showView('categories');
    loadCategories();
}

// Show/hide email field based on contact input
function handleContactInput() {
    const contactInput = document.getElementById('signupContact');
    const emailField = document.getElementById('signupEmail');
    
    if (contactInput && emailField) {
        contactInput.addEventListener('input', function() {
            const value = this.value.trim();
            if (isMobile(value)) {
                emailField.style.display = 'block';
                emailField.required = true;
            } else {
                emailField.style.display = 'none';
                emailField.required = false;
                emailField.value = '';
            }
        });
    }
}

// Profile menu functions
function toggleProfileMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('profileMenu');
    if (menu) {
        const isVisible = menu.style.display === 'block';
        menu.style.display = isVisible ? 'none' : 'block';
        console.log('Profile menu toggled:', menu.style.display);
    } else {
        console.log('Profile menu not found');
    }
}

// Check if user is authenticated before allowing access
function requireAuth() {
    const user = userPool.getCurrentUser();
    if (!user) {
        showFreeTrialSignup();
        return false;
    }
    
    let isAuthenticated = false;
    user.getSession((err, session) => {
        if (err || !session.isValid()) {
            showFreeTrialSignup();
            return;
        }
        isAuthenticated = true;
    });
    
    if (!isAuthenticated) {
        showFreeTrialSignup();
        return false;
    }
    
    return true;
}

// Make functions globally available
window.toggleProfileMenu = toggleProfileMenu;
window.showProfile = showProfile;
window.showSettings = showSettings;
window.showSubscription = showSubscription;
window.logout = logout;
window.closeTrialModal = closeTrialModal;
window.proceedToSignup = proceedToSignup;
window.requireAuth = requireAuth;

function showProfile() {
    alert('Profile page - Coming soon!');
    toggleProfileMenu();
}

function showSettings() {
    alert('Settings page - Coming soon!');
    toggleProfileMenu();
}

function showSubscription() {
    alert('Subscription page - Coming soon!');
    toggleProfileMenu();
}

// Close profile menu when clicking outside
document.addEventListener('click', function(event) {
    const profileMenu = document.getElementById('profileMenu');
    const userProfile = document.querySelector('.user-profile');
    
    if (profileMenu && userProfile && !userProfile.contains(event.target) && !profileMenu.contains(event.target)) {
        profileMenu.style.display = 'none';
    }
});

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});