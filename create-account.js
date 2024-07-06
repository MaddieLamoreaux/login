document.getElementById('createAccountForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('create-username').value;
    const password = document.getElementById('create-password').value;
    const email = document.getElementById('create-email').value;

    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, email })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Account created successfully! Please log in.');
            window.location.href = 'login.html';
        } else {
            document.getElementById('create-error-message').textContent = data.message;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('create-error-message').textContent = 'An error occurred. Please try again.';
    }
});
