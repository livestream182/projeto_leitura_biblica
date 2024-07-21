function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.auth) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            alert('Login falhou');
        }
    });
}

function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.auth) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            alert('Registro falhou');
        }
    });
}
