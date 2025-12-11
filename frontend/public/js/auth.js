document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const userMenu = document.getElementById('userMenu');
    const usernameDisplay = document.getElementById('username');

    // Toggle between login and signup forms
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Login functionality
    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            showToast('Please enter username and password', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing In...';

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Login successful', 'success');
                showDashboard(data.user);
            } else {
                showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> Sign In';
        }
    });

    // Signup functionality
    signupBtn.addEventListener('click', async () => {
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!username || !password) {
            showToast('Please enter username and password', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        signupBtn.disabled = true;
        signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating Account...';

        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Account created successfully', 'success');
                showDashboard(data.user);
            } else {
                showToast(data.message || 'Signup failed', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            signupBtn.disabled = false;
            signupBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i> Sign Up';
        }
    });

    // Logout functionality
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST'
            });

            if (response.ok) {
                showToast('Logged out successfully', 'success');
                showAuthSection();
            } else {
                showToast('Logout failed', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Network error. Please try again.', 'error');
        }
    });

    // Check authentication status on page load
    checkAuthStatus();

    // Functions
    async function checkAuthStatus() {
        try {
            const response = await fetch('/auth/status');
            const data = await response.json();

            if (data.loggedIn) {
                showDashboard(data.user);
            } else {
                showAuthSection();
            }
        } catch (error) {
            console.error('Auth status check error:', error);
            showAuthSection();
        }
    }

    function showDashboard(user) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        userMenu.classList.remove('hidden');
        usernameDisplay.textContent = user.username;
        
        // Load files
        loadFiles();
    }

    function showAuthSection() {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        userMenu.classList.add('hidden');
        
        // Reset forms
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('signupUsername').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }

    // Make loadFiles available to other scripts
    window.loadFiles = function() {
        // This will be defined in fileManager.js
        if (typeof window.fetchFiles === 'function') {
            window.fetchFiles();
        }
    };
});
