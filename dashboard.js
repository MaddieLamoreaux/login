document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const postsContainer = document.getElementById('posts-container');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    fetch('http://localhost:3000/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('dashboard-message').textContent = `Welcome, ${data.username}`;
        loadPosts();
    })
    .catch(error => {
        console.error('Error:', error);
        window.location.href = 'index.html';
    });

    // Post form submission
    document.getElementById('postForm').addEventListener('submit', event => {
        event.preventDefault();
        const postContent = document.getElementById('postContent').value;

        fetch('http://localhost:3000/posts', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: postContent })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('postContent').value = '';
            loadPosts();
        })
        .catch(error => console.error('Error:', error));
    });

    // Load posts
    function loadPosts() {
        fetch('http://localhost:3000/posts', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(posts => {
            postsContainer.innerHTML = '';
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');
                postElement.innerHTML = `
                    <p class="post-content">${post.content}</p>
                    <div class="post-actions">
                        <button onclick="deletePost('${post._id}')">Delete</button>
                        <button onclick="likePost('${post._id}')">Like (${post.likes})</button>
                    </div>
                `;
                postsContainer.appendChild(postElement);
            });
        })
        .catch(error => console.error('Error:', error));
    }

    // Delete post
    window.deletePost = function(postId) {
        fetch(`http://localhost:3000/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            loadPosts();
        })
        .catch(error => console.error('Error:', error));
    }

    // Like post
    window.likePost = function(postId) {
        fetch(`http://localhost:3000/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            loadPosts();
        })
        .catch(error => console.error('Error:', error));
    }

    // Logout
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});
