document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    console.log('Login form submitted');
    console.log('Username:', username);
    console.log('Password:', password);

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Login successful, storing token');
            localStorage.setItem('token', data.token);
            window.location.href = 'dashboard.html';
        } else {
            console.log('Login failed:', data.message);
            document.getElementById('login-error-message').textContent = data.message;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('login-error-message').textContent = 'An error occurred. Please try again.';
    }
});
