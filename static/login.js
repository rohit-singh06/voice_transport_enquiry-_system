// ===== Password Visibility Toggle =====
const toggle = document.getElementById('toggle-password');
const password = document.getElementById('password');
if (toggle && password) {
  toggle.addEventListener('click', () => {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    toggle.textContent = type === 'password' ? '👁️' : '🙈';
  });
}

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
const form = document.getElementById('login-form');
const successOverlay = document.getElementById('success-overlay');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const passwordVal = document.getElementById('password').value.trim();

    if (!username || !passwordVal) {
      alert("Please enter both email and password.");
      return;
    }

    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password: passwordVal })
    });

    const data = await response.json();

    if (data.success) {
      successOverlay.classList.remove('hidden');
      const msg = new SpeechSynthesisUtterance("Login successful! Redirecting...");
      window.speechSynthesis.speak(msg);
      setTimeout(() => (window.location.href = '/'), 2000);
    } else {
      alert(data.error || 'Invalid credentials');
    }
  });
}
