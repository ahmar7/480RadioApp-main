// Create session button
document.getElementById('createSessionForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const hostUsername = document.getElementById('hostUsername').value;
    const sessionPassword = document.getElementById('sessionPassword').value;
    
    try {
      const response = await fetch('/create-session', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hostUsername, sessionPassword })
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
  
      const data = await response.json();
      console.log(data); // Log the response data

    // Store session and user information into sessionStorage
      sessionStorage.setItem('sessionId', data.sessionId);
      sessionStorage.setItem('hostUsername', hostUsername);
  
    //  Redirect to web-player.html with the sessionId as a query parameter
      window.location.href = `web-player.html?sessionId=${data.sessionId}`;
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      alert('Oops! Something went wrong while submitting the form.');
    }
  });