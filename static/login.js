// ===== Password Visibility Toggle =====
document.querySelectorAll('.toggle-password').forEach((toggle) => {
  const targetId = toggle.dataset.target;
  const input = document.getElementById(targetId);
  if (!input) return;
  toggle.addEventListener('click', () => {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    toggle.textContent = type === 'password' ? '👁️' : '🙈';
  });
});

// ===== Theme Toggle =====
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '🌞' : '🌙';
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });

  // Apply previously selected theme on load
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '🌞';
  }
}

// ===== Voice Greeting =====
window.addEventListener('load', () => {
  const message = "Welcome back to Smart Transport Finder. Please log in to continue.";
  const speech = new SpeechSynthesisUtterance(message);
  speech.pitch = 1;
  speech.rate = 1;
  window.speechSynthesis.speak(speech);
});

// ===== Redirect to Register Page (Fix Create Account) =====
const createAccountLink = document.getElementById('create-account-link');
if (createAccountLink) {
  createAccountLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/register'; // Flask route for registration
  });
}

// ===== Success Animation on Login =====
const loginForm = document.getElementById('login-form');
const successOverlay = document.getElementById('success-overlay');
const successMessageText = document.getElementById('success-message-text');
const toggleButtons = document.querySelectorAll('.toggle-option');
const loginHint = document.getElementById('login-hint');
let selectedRole = 'user';

async function submitLogin(email, password, requireAdmin = false) {
  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }

  let data;
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Invalid credentials');
    }
  } catch (error) {
    alert(error.message || 'Login failed');
    return;
  }

  if (requireAdmin && !data.is_admin) {
    alert('This account is not authorized for admin access. Loading the user dashboard instead.');
    window.location.href = '/';
    return;
  }

  const redirectPath = requireAdmin ? '/admin' : '/';
  if (successOverlay) {
    const message = requireAdmin ? 'Opening admin dashboard...' : 'Redirecting to dashboard...';
    if (successMessageText) {
      successMessageText.textContent = message;
    }
    successOverlay.classList.remove('hidden');
  }

  try {
    const spokenText = requireAdmin
      ? 'Admin login successful. Opening dashboard.'
      : 'Login successful! Redirecting.';
    const msg = new SpeechSynthesisUtterance(spokenText);
    window.speechSynthesis.speak(msg);
  } catch (error) {
    // speech synthesis not supported
  }

  setTimeout(() => {
    window.location.href = redirectPath;
  }, 2000);
}

toggleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    toggleButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    selectedRole = button.dataset.role === 'admin' ? 'admin' : 'user';
    if (loginHint) {
      loginHint.textContent =
        selectedRole === 'admin'
          ? 'Admins are redirected to the control room'
          : 'Standard user access';
    }
  });
});

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('username').value.trim();
    const passwordVal = document.getElementById('password').value.trim();
    submitLogin(email, passwordVal, selectedRole === 'admin');
  });
}
