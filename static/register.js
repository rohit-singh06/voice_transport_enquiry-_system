// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? '🌞' : '🌙';
});

// Voice greeting
window.addEventListener('load', () => {
  const message = "Welcome to Smart Transport Finder. Please fill in your details to create an account.";
  const speech = new SpeechSynthesisUtterance(message);
  window.speechSynthesis.speak(speech);
});

const form = document.getElementById('register-form');
const successOverlay = document.getElementById('success-overlay');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = {
    first_name: document.getElementById('first_name').value.trim(),
    last_name: document.getElementById('last_name').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value.trim(),
    phone_number: document.getElementById('phone').value.trim()
  };

  if (!user.first_name || !user.last_name || !user.email || !user.password) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    const data = await res.json();

    if (res.ok && data.success) {
      successOverlay.classList.remove('hidden');
      const msg = new SpeechSynthesisUtterance(`Welcome ${user.first_name}! Your account has been created.`);
      window.speechSynthesis.speak(msg);

      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } else {
      alert(data.error || 'Registration failed.');
    }
  } catch (err) {
    console.error('Error:', err);
    alert('An error occurred during registration.');
  }
});
