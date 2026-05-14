// // Show/Hide Forms

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function register(event) {
    event.preventDefault();

    const name            = document.getElementById('regName').value.trim();
    const email           = document.getElementById('regEmail').value.trim();
    const password        = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    let users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.find(u => u.email === email)) {
        alert('An account with this email already exists!');
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        balance: 0,
        invested: 0,
        returns: 0,
        transactions: [],
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert('Registration successful! Please login.');
    showLogin();
}

function login(event) {
    event.preventDefault();

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user  = users.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid email or password!');
    }
}
