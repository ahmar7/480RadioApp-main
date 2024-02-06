document.getElementById('joinSessionForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('userName').value;
    const sessionId = document.getElementById('sessionId').value;
    const sessionPassword = document.getElementById('sessionPassword').value;

    try {
        // Call the server to add user to the session
        const response = await fetch('/add-user-to-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId, userId: username, password: sessionPassword })
        });
        console.log("Session ID:", sessionId);
        console.log("Username:", username);
        console.log("Session Password:", sessionPassword);

        if (!response.ok) {
            throw new Error('Failed to join session: ' + response.statusText);
        }

        const data = await response.json();
        console.log(data);

        // Store session and user information in sessionStorage
        sessionStorage.setItem('sessionId', sessionId);
        sessionStorage.setItem('username', username);

        // Redirect to web-player.html
        window.location.href = `web-player.html?sessionId=${sessionId}`;
    } catch (error) {
        console.error('Error:', error);
        alert('Error joining session: ' + error.message);
    }
});