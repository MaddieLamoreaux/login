document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    fetch('http://localhost:3000/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('profile-username').textContent = data.username;
        document.getElementById('profile-email').textContent = data.email;
    })
    .catch(error => {
        console.error('Error:', error);
        window.location.href = 'index.html';
    });

    document.getElementById('dashboard-button').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Ensuring profile picture click does not log out
    document.getElementById('profile-picture').addEventListener('click', (event) => {
        event.preventDefault();
    });
});
