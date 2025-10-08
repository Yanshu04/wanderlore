document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Header Scroll Effect ---
    // Adds a 'scrolled' class to the header when the user scrolls down
    const header = document.querySelector('.main-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- 2. Fade-in Animation on Scroll ---
    // Uses the Intersection Observer API for better performance
    const fadeElems = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null, // observes intersections relative to the viewport
        rootMargin: '0px',
        threshold: 0.1 // trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // If the element is intersecting (visible)
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Stop observing the element once it's visible to save resources
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Attach the observer to each element with the 'fade-in' class
    fadeElems.forEach(elem => {
        observer.observe(elem);
    });

    // --- 3. Authentication System ---
    class AuthManager {
        constructor() {
            this.currentUser = null;
            this.initializeAuth();
            this.bindEvents();
            this.checkUserSession();
        }

        initializeAuth() {
            // Get DOM elements
            this.overlay = document.getElementById('auth-overlay');
            this.signInModal = document.getElementById('sign-in-modal');
            this.signUpModal = document.getElementById('sign-up-modal');
            this.forgotPasswordModal = document.getElementById('forgot-password-modal');
            
            // Navigation elements
            this.signInBtn = document.getElementById('sign-in-btn');
            this.userMenu = document.getElementById('user-menu');
            this.userMenuBtn = document.getElementById('user-menu-btn');
            this.headerUserName = document.getElementById('header-user-name');
            this.headerUserAvatar = document.getElementById('header-user-avatar');
            
            // Sidebar elements
            this.userSidebar = document.getElementById('user-sidebar');
            this.sidebarOverlay = document.getElementById('sidebar-overlay');
            this.closeSidebarBtn = document.getElementById('close-sidebar');
            this.sidebarUserName = document.getElementById('sidebar-user-name');
            this.sidebarUserEmail = document.getElementById('sidebar-user-email');
            this.sidebarSignOutBtn = document.getElementById('sidebar-sign-out');
            
            // Forms
            this.signInForm = document.getElementById('sign-in-form');
            this.signUpForm = document.getElementById('sign-up-form');
            this.forgotPasswordForm = document.getElementById('forgot-password-form');
        }

        bindEvents() {
            // Navigation events
            this.signInBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Check if user has ever registered
                const hasEverRegistered = localStorage.getItem('wanderlore_has_registered');
                
                if (!hasEverRegistered) {
                    // Force registration first
                    this.showModal('sign-up-modal');
                    this.makeRegistrationMandatory();
                    this.showRegistrationMessage();
                } else {
                    // Normal sign-in flow
                    this.showModal('sign-in-modal');
                }
            });

            // User menu and sidebar events
            this.userMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSidebar();
            });

            this.closeSidebarBtn.addEventListener('click', () => {
                this.hideSidebar();
            });

            this.sidebarOverlay.addEventListener('click', () => {
                this.hideSidebar();
            });

            this.sidebarSignOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.signOut();
            });

            // Sidebar navigation events
            this.bindSidebarNavigation();

            // Modal switching events
            document.getElementById('show-signup').addEventListener('click', (e) => {
                e.preventDefault();
                this.switchModal('sign-in-modal', 'sign-up-modal');
            });

            document.getElementById('show-signin').addEventListener('click', (e) => {
                e.preventDefault();
                this.switchModal('sign-up-modal', 'sign-in-modal');
            });

            document.getElementById('forgot-password-link').addEventListener('click', (e) => {
                e.preventDefault();
                this.switchModal('sign-in-modal', 'forgot-password-modal');
            });

            document.getElementById('back-to-signin').addEventListener('click', (e) => {
                e.preventDefault();
                this.switchModal('forgot-password-modal', 'sign-in-modal');
            });

            // Close modal events
            document.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.hideModal();
                });
            });

            // Overlay click to close
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hideModal();
                }
            });

            // Escape key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                    this.hideModal();
                }
            });

            // Form submissions
            this.signInForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignIn();
            });

            this.signUpForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignUp();
            });

            this.forgotPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });

            // Password strength checker
            document.getElementById('signup-password').addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });

            // Real-time validation
            this.setupRealTimeValidation();

            // Google Auth buttons
            document.querySelectorAll('.google-auth-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.handleGoogleAuth();
                });
            });
        }

        showModal(modalId) {
            this.overlay.classList.add('active');
            document.querySelectorAll('.auth-modal').forEach(modal => {
                modal.style.display = 'none';
            });
            document.getElementById(modalId).style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        hideModal() {
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
            // Clear all forms
            this.clearAllForms();
        }

        switchModal(fromModalId, toModalId) {
            document.getElementById(fromModalId).style.display = 'none';
            document.getElementById(toModalId).style.display = 'block';
            this.clearAllForms();
        }

        clearAllForms() {
            document.querySelectorAll('.auth-form').forEach(form => {
                form.reset();
                form.querySelectorAll('.error-message').forEach(error => {
                    error.textContent = '';
                });
                form.querySelectorAll('input').forEach(input => {
                    input.classList.remove('error');
                });
            });
            
            // Reset password strength indicator
            const strengthFill = document.querySelector('.strength-fill');
            const strengthText = document.querySelector('.strength-text');
            if (strengthFill && strengthText) {
                strengthFill.className = 'strength-fill';
                strengthFill.style.width = '0%';
                strengthText.textContent = 'Password strength';
            }
        }

        setupRealTimeValidation() {
            // Email validation
            document.querySelectorAll('input[type="email"]').forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateEmail(input);
                });
            });

            // Password confirmation
            document.getElementById('signup-confirm-password').addEventListener('input', () => {
                this.validatePasswordConfirmation();
            });

            // Name validation
            document.getElementById('signup-name').addEventListener('blur', () => {
                this.validateName(document.getElementById('signup-name'));
            });
        }

        validateEmail(input) {
            const email = input.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const errorElement = document.getElementById(input.id + '-error');
            
            if (!email) {
                this.showError(input, errorElement, 'Email is required');
                return false;
            } else if (!emailRegex.test(email)) {
                this.showError(input, errorElement, 'Please enter a valid email address');
                return false;
            } else {
                this.clearError(input, errorElement);
                return true;
            }
        }

        validateName(input) {
            const name = input.value.trim();
            const errorElement = document.getElementById(input.id + '-error');
            
            if (!name) {
                this.showError(input, errorElement, 'Full name is required');
                return false;
            } else if (name.length < 2) {
                this.showError(input, errorElement, 'Name must be at least 2 characters long');
                return false;
            } else {
                this.clearError(input, errorElement);
                return true;
            }
        }

        validatePassword(password, inputElement, errorElement) {
            if (!password) {
                this.showError(inputElement, errorElement, 'Password is required');
                return false;
            } else if (password.length < 8) {
                this.showError(inputElement, errorElement, 'Password must be at least 8 characters long');
                return false;
            } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                this.showError(inputElement, errorElement, 'Password must contain uppercase, lowercase, and number');
                return false;
            } else {
                this.clearError(inputElement, errorElement);
                return true;
            }
        }

        validatePasswordConfirmation() {
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            const errorElement = document.getElementById('signup-confirm-password-error');
            const inputElement = document.getElementById('signup-confirm-password');
            
            if (!confirmPassword) {
                this.showError(inputElement, errorElement, 'Please confirm your password');
                return false;
            } else if (password !== confirmPassword) {
                this.showError(inputElement, errorElement, 'Passwords do not match');
                return false;
            } else {
                this.clearError(inputElement, errorElement);
                return true;
            }
        }

        checkPasswordStrength(password) {
            const strengthFill = document.querySelector('.strength-fill');
            const strengthText = document.querySelector('.strength-text');
            
            if (!password) {
                strengthFill.className = 'strength-fill';
                strengthFill.style.width = '0%';
                strengthText.textContent = 'Password strength';
                return;
            }

            let score = 0;
            let feedback = '';

            // Length check
            if (password.length >= 8) score++;
            if (password.length >= 12) score++;

            // Character variety
            if (/[a-z]/.test(password)) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/\d/.test(password)) score++;
            if (/[^A-Za-z0-9]/.test(password)) score++;

            // Determine strength
            if (score < 3) {
                strengthFill.className = 'strength-fill weak';
                feedback = 'Weak password';
            } else if (score < 4) {
                strengthFill.className = 'strength-fill fair';
                feedback = 'Fair password';
            } else if (score < 5) {
                strengthFill.className = 'strength-fill good';
                feedback = 'Good password';
            } else {
                strengthFill.className = 'strength-fill strong';
                feedback = 'Strong password';
            }

            strengthText.textContent = feedback;
        }

        showError(inputElement, errorElement, message) {
            inputElement.classList.add('error');
            errorElement.textContent = message;
        }

        clearError(inputElement, errorElement) {
            inputElement.classList.remove('error');
            errorElement.textContent = '';
        }

        async handleSignIn() {
            const email = document.getElementById('signin-email').value.trim();
            const password = document.getElementById('signin-password').value;
            const rememberMe = document.getElementById('remember-me').checked;

            // Validate inputs
            const emailValid = this.validateEmail(document.getElementById('signin-email'));
            const passwordValid = password.length > 0;

            if (!passwordValid) {
                this.showError(
                    document.getElementById('signin-password'),
                    document.getElementById('signin-password-error'),
                    'Password is required'
                );
            }

            if (!emailValid || !passwordValid) {
                return;
            }

            // Disable submit button
            const submitBtn = this.signInForm.querySelector('.auth-button');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';

            try {
                // Simulate API call
                await this.simulateAuthRequest();
                
                // Check if user exists in localStorage (for demo purposes)
                const users = JSON.parse(localStorage.getItem('wanderlore_users') || '[]');
                const user = users.find(u => u.email === email && u.password === password);

                if (user) {
                    this.signInSuccess(user, rememberMe);
                } else {
                    throw new Error('Invalid email or password');
                }
            } catch (error) {
                this.showError(
                    document.getElementById('signin-email'),
                    document.getElementById('signin-email-error'),
                    error.message
                );
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }

        async handleSignUp() {
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            const agreeTerms = document.getElementById('agree-terms').checked;

            // Validate all inputs
            const nameValid = this.validateName(document.getElementById('signup-name'));
            const emailValid = this.validateEmail(document.getElementById('signup-email'));
            const passwordValid = this.validatePassword(
                password,
                document.getElementById('signup-password'),
                document.getElementById('signup-password-error')
            );
            const confirmPasswordValid = this.validatePasswordConfirmation();

            if (!agreeTerms) {
                alert('Please agree to the Terms of Service and Privacy Policy');
                return;
            }

            if (!nameValid || !emailValid || !passwordValid || !confirmPasswordValid) {
                return;
            }

            // Disable submit button
            const submitBtn = this.signUpForm.querySelector('.auth-button');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';

            try {
                // Simulate API call
                await this.simulateAuthRequest();
                
                // Check if user already exists
                const users = JSON.parse(localStorage.getItem('wanderlore_users') || '[]');
                if (users.find(u => u.email === email)) {
                    throw new Error('An account with this email already exists');
                }

                // Create new user
                const newUser = {
                    id: Date.now().toString(),
                    name,
                    email,
                    password, // In real app, this would be hashed
                    createdAt: new Date().toISOString()
                };

                users.push(newUser);
                localStorage.setItem('wanderlore_users', JSON.stringify(users));
                
                // Mark that user has registered
                localStorage.setItem('wanderlore_has_registered', 'true');
                
                // Restore normal modal behavior
                this.restoreNormalModalBehavior();

                this.signInSuccess(newUser, true);
            } catch (error) {
                this.showError(
                    document.getElementById('signup-email'),
                    document.getElementById('signup-email-error'),
                    error.message
                );
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }

        async handleForgotPassword() {
            const email = document.getElementById('reset-email').value.trim();
            
            const emailValid = this.validateEmail(document.getElementById('reset-email'));
            if (!emailValid) return;

            // Disable submit button
            const submitBtn = this.forgotPasswordForm.querySelector('.auth-button');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                // Simulate API call
                await this.simulateAuthRequest();
                
                // Show success message
                alert(`Password reset link has been sent to ${email}`);
                this.switchModal('forgot-password-modal', 'sign-in-modal');
            } catch (error) {
                this.showError(
                    document.getElementById('reset-email'),
                    document.getElementById('reset-email-error'),
                    'Failed to send reset email. Please try again.'
                );
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }

        handleGoogleAuth() {
            // Simulate Google authentication
            alert('Google authentication would be implemented here with Google OAuth API');
        }

        signInSuccess(user, rememberMe) {
            this.currentUser = user;
            
            // Store session
            if (rememberMe) {
                localStorage.setItem('wanderlore_session', JSON.stringify({
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                }));
            } else {
                sessionStorage.setItem('wanderlore_session', JSON.stringify({
                    userId: user.id,
                    name: user.name,
                    email: user.email
                }));
            }

            this.updateUI(user);
            this.hideModal();
            
            // Show welcome message
            this.showWelcomeMessage(user.name);
        }

        signOut() {
            this.currentUser = null;
            localStorage.removeItem('wanderlore_session');
            sessionStorage.removeItem('wanderlore_session');
            this.updateUI(null);
        }

        checkUserSession() {
            let session = localStorage.getItem('wanderlore_session') || sessionStorage.getItem('wanderlore_session');
            
            if (session) {
                session = JSON.parse(session);
                
                // Check if session is expired (for localStorage sessions)
                if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
                    localStorage.removeItem('wanderlore_session');
                    this.showMandatoryRegistration();
                    return;
                }

                this.currentUser = session;
                this.updateUI(session);
            } else {
                // No session found - show mandatory registration for first-time users
                this.showMandatoryRegistration();
            }
        }

        showMandatoryRegistration() {
            // Check if user has ever registered before
            const hasEverRegistered = localStorage.getItem('wanderlore_has_registered');
            
            if (!hasEverRegistered) {
                // First time visitor - show mandatory registration
                setTimeout(() => {
                    this.showModal('sign-up-modal');
                    this.makeRegistrationMandatory();
                }, 2000); // Show after 2 seconds
            }
        }

        makeRegistrationMandatory() {
            // Hide the sign-in link in the sign-up modal
            const signInLink = document.getElementById('show-signin');
            const switchText = signInLink.closest('.auth-switch');
            
            if (switchText) {
                switchText.innerHTML = '<span style="color: var(--secondary-text);">Welcome to Wanderlore! Please create your account to continue your journey.</span>';
            }
            
            // Disable close buttons temporarily
            const closeButtons = this.signUpModal.querySelectorAll('.close-modal');
            closeButtons.forEach(btn => {
                btn.style.display = 'none';
            });
            
            // Prevent closing on overlay click
            this.overlay.style.pointerEvents = 'none';
            this.signUpModal.style.pointerEvents = 'all';
        }

        showSidebar() {
            this.userSidebar.classList.remove('hidden');
            this.sidebarOverlay.classList.remove('hidden');
            
            setTimeout(() => {
                this.userSidebar.classList.add('active');
                this.sidebarOverlay.classList.add('active');
            }, 10);
            
            document.body.style.overflow = 'hidden';
        }

        hideSidebar() {
            this.userSidebar.classList.remove('active');
            this.sidebarOverlay.classList.remove('active');
            
            setTimeout(() => {
                this.userSidebar.classList.add('hidden');
                this.sidebarOverlay.classList.add('hidden');
                document.body.style.overflow = '';
            }, 300);
        }

        updateUI(user) {
            if (user) {
                this.signInBtn.style.display = 'none';
                this.userMenu.classList.remove('hidden');
                
                const firstName = user.name.split(' ')[0];
                this.headerUserName.textContent = firstName;
                this.sidebarUserName.textContent = `Welcome back, ${firstName}!`;
                this.sidebarUserEmail.textContent = user.email;
            } else {
                this.signInBtn.style.display = 'block';
                this.userMenu.classList.add('hidden');
                this.hideSidebar();
            }
        }

        showWelcomeMessage(name) {
            // Create and show a temporary welcome notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 24px;
                background: linear-gradient(45deg, var(--accent-primary), var(--accent-secondary));
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                font-weight: 600;
                z-index: 3000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            `;
            notification.textContent = `Welcome back, ${name}!`;
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        showRegistrationMessage() {
            // Add a notice at the top of the sign-up modal
            const modalContent = this.signUpModal.querySelector('.auth-modal-content');
            const existingNotice = modalContent.querySelector('.registration-notice');
            
            if (!existingNotice) {
                const notice = document.createElement('div');
                notice.className = 'registration-notice';
                notice.style.cssText = `
                    background: linear-gradient(45deg, var(--accent-primary), var(--accent-secondary));
                    color: white;
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    text-align: center;
                    font-weight: 600;
                `;
                notice.innerHTML = `
                    <div style="margin-bottom: 8px;">🌟 Welcome to Wanderlore!</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">Please create your account to start your journey and access exclusive travel experiences.</div>
                `;
                
                const header = modalContent.querySelector('.auth-header');
                header.insertAdjacentElement('afterend', notice);
            }
        }

        restoreNormalModalBehavior() {
            // Restore close buttons
            const closeButtons = document.querySelectorAll('.close-modal');
            closeButtons.forEach(btn => {
                btn.style.display = 'block';
            });
            
            // Restore overlay click to close
            this.overlay.style.pointerEvents = 'all';
            
            // Remove registration notice
            const notice = document.querySelector('.registration-notice');
            if (notice) {
                notice.remove();
            }
            
            // Restore sign-in link
            const switchText = document.querySelector('#sign-up-modal .auth-switch');
            if (switchText) {
                switchText.innerHTML = 'Already have an account? <a href="#" id="show-signin">Sign in</a>';
                
                // Re-bind the show-signin event
                const showSigninBtn = document.getElementById('show-signin');
                if (showSigninBtn) {
                    showSigninBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.switchModal('sign-up-modal', 'sign-in-modal');
                    });
                }
            }
        }

        bindSidebarNavigation() {
            // My Journey section
            document.getElementById('my-trips').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('My Trips', 'View and manage your travel itineraries');
                this.hideSidebar();
            });

            document.getElementById('saved-paths').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('Saved Paths', 'Access your bookmarked travel experiences');
                this.hideSidebar();
            });

            document.getElementById('travel-journal').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('Travel Journal', 'Write and share your travel stories');
                this.hideSidebar();
            });

            document.getElementById('photos').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('My Photos', 'Organize your travel memories');
                this.hideSidebar();
            });

            // Discover section
            document.getElementById('browse-paths').addEventListener('click', (e) => {
                e.preventDefault();
                this.hideSidebar();
                // Allow normal navigation to trending paths
            });

            document.getElementById('recommendations').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('Recommendations', 'Personalized travel suggestions based on your preferences');
                this.hideSidebar();
            });

            document.getElementById('local-guides').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('Local Guides', 'Connect with experienced local storytellers');
                this.hideSidebar();
            });

            document.getElementById('upcoming-events').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('Events', 'Discover cultural events and festivals');
                this.hideSidebar();
            });

            // Account section
            document.getElementById('profile-settings').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('Profile Settings', 'Update your personal information and preferences');
                this.hideSidebar();
            });

            document.getElementById('preferences').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('Travel Preferences', 'Customize your travel style and interests');
                this.hideSidebar();
            });

            document.getElementById('notifications').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('Notifications', 'Manage your email and push notification settings');
                this.hideSidebar();
            });

            document.getElementById('subscription').addEventListener('click', (e) => {
                e.preventDefault();
                this.showFeatureNotification('Subscription', 'Upgrade to premium for exclusive features');
                this.hideSidebar();
            });
        }

        showFeatureNotification(title, description) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 24px;
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: 16px;
                padding: 24px;
                max-width: 350px;
                z-index: 3000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
            `;
            
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(45deg, var(--accent-primary), var(--accent-secondary)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">🚀</div>
                    <h4 style="margin: 0; color: var(--primary-text); font-size: 1.1rem;">${title}</h4>
                </div>
                <p style="margin: 0; color: var(--secondary-text); font-size: 0.9rem; line-height: 1.5;">${description}</p>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color); color: var(--secondary-text); font-size: 0.8rem; opacity: 0.7;">Coming soon in a future update!</div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 4000);
        }

        simulateAuthRequest() {
            return new Promise(resolve => {
                setTimeout(resolve, 800 + Math.random() * 400);
            });
        }
    }

    // Initialize authentication system
    const authManager = new AuthManager();
    
    // Add event listener for CTA button
    const ctaButton = document.getElementById('cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', (e) => {
            const hasSession = localStorage.getItem('wanderlore_session') || sessionStorage.getItem('wanderlore_session');
            
            if (!hasSession) {
                e.preventDefault();
                
                const hasEverRegistered = localStorage.getItem('wanderlore_has_registered');
                
                if (!hasEverRegistered) {
                    authManager.showModal('sign-up-modal');
                    authManager.makeRegistrationMandatory();
                    authManager.showRegistrationMessage();
                } else {
                    authManager.showModal('sign-in-modal');
                }
            }
            // If user is logged in, allow normal navigation to trending paths
        });
    }

    // --- 4. Theme Manager ---
    class ThemeManager {
        constructor() {
            this.currentTheme = 'custom-palette';
            this.initializeTheme();
            this.bindEvents();
        }

        initializeTheme() {
            // Get DOM elements first
            this.themeToggle = document.getElementById('theme-toggle');
            this.themeDropdown = document.getElementById('theme-dropdown');
            this.themeOptions = document.querySelectorAll('.theme-option');
            
            console.log('Theme elements found:', {
                toggle: !!this.themeToggle,
                dropdown: !!this.themeDropdown,
                optionsCount: this.themeOptions.length
            });
            
            // Get saved theme or use your custom palette as default
            const savedTheme = localStorage.getItem('wanderlore_theme') || 'custom-palette';
            this.setTheme(savedTheme);
        }

        bindEvents() {
            if (!this.themeToggle || !this.themeDropdown || this.themeOptions.length === 0) {
                console.error('Theme elements not found!');
                return;
            }
            
            console.log('Binding theme events...');
            
            // Toggle dropdown
            this.themeToggle.addEventListener('click', (e) => {
                console.log('Theme toggle clicked');
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown();
            });

            // Theme selection - Use event delegation for better reliability
            this.themeDropdown.addEventListener('click', (e) => {
                const themeOption = e.target.closest('.theme-option');
                if (themeOption) {
                    const theme = themeOption.dataset.theme;
                    console.log('Theme selected:', theme);
                    this.setTheme(theme);
                    this.closeDropdown();
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.themeToggle.contains(e.target) && !this.themeDropdown.contains(e.target)) {
                    this.closeDropdown();
                }
            });

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.themeDropdown.classList.contains('active')) {
                    this.closeDropdown();
                }
            });
        }

        toggleDropdown() {
            console.log('Toggling dropdown');
            const isActive = this.themeDropdown.classList.contains('active');
            console.log('Dropdown was active:', isActive);
            this.themeDropdown.classList.toggle('active');
            console.log('Dropdown is now active:', this.themeDropdown.classList.contains('active'));
        }

        closeDropdown() {
            console.log('Closing dropdown');
            this.themeDropdown.classList.remove('active');
        }

        setTheme(theme) {
            console.log('setTheme called with:', theme);
            
            // Remove current theme class
            document.documentElement.removeAttribute('data-theme');
            
            // Set new theme
            if (theme !== 'dark-cyber') {
                document.documentElement.setAttribute('data-theme', theme);
                console.log('Set data-theme attribute to:', theme);
            }
            
            this.currentTheme = theme;
            
            // Debug log to ensure theme is being set
            console.log('Current data-theme attribute:', document.documentElement.getAttribute('data-theme'));
            
            // Save to localStorage
            localStorage.setItem('wanderlore_theme', theme);
            
            // Update active state in dropdown
            this.updateActiveTheme();
            
            // Show theme change notification
            this.showThemeNotification(theme);
        }

        updateActiveTheme() {
            this.themeOptions.forEach(option => {
                option.classList.remove('active');
                if (option.dataset.theme === this.currentTheme) {
                    option.classList.add('active');
                }
            });
        }

        showThemeNotification(theme) {
            const themeNames = {
                'dark-cyber': 'Dark Cyber',
                'light-minimal': 'Light Minimal',
                'nature-green': 'Nature Green',
                'sunset-warm': 'Sunset Warm',
                'ocean-blue': 'Ocean Blue',
                'custom-palette': 'Custom Palette',
                'black-white': 'Black & White'
            };

            // Create notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 24px;
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                color: var(--primary-text);
                padding: 16px 24px;
                border-radius: 12px;
                font-weight: 600;
                z-index: 3000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                display: flex;
                align-items: center;
                gap: 12px;
            `;
            
            // Add theme preview
            const preview = document.createElement('div');
            preview.style.cssText = `
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: linear-gradient(45deg, var(--accent-primary), var(--accent-secondary));
            `;
            
            notification.appendChild(preview);
            notification.appendChild(document.createTextNode(`Theme: ${themeNames[theme]}`));
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            // Remove after 2.5 seconds
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 2500);
        }

        getThemeColors(theme) {
            const themes = {
                'dark-cyber': {
                    primary: '#00A8E8',
                    secondary: '#C430D7'
                },
                'light-minimal': {
                    primary: '#3182CE',
                    secondary: '#805AD5'
                },
                'nature-green': {
                    primary: '#48BB78',
                    secondary: '#68D391'
                },
                'sunset-warm': {
                    primary: '#FF6B35',
                    secondary: '#FFB74D'
                },
                'ocean-blue': {
                    primary: '#0EA5E9',
                    secondary: '#0284C7'
                },
                'custom-palette': {
                    primary: '#00798C',
                    secondary: '#D1495B'
                },
                'black-white': {
                    primary: '#FFFFFF',
                    secondary: '#888888'
                }
            };
            return themes[theme] || themes['dark-cyber'];
        }

        // Method to dynamically update theme variables (advanced usage)
        updateThemeVariables(customColors) {
            const root = document.documentElement;
            Object.entries(customColors).forEach(([property, value]) => {
                root.style.setProperty(`--${property}`, value);
            });
        }
    }

    // Initialize theme manager
    const themeManager = new ThemeManager();
    
    // Force apply custom palette theme immediately
    setTimeout(() => {
        themeManager.setTheme('custom-palette');
    }, 100);

});