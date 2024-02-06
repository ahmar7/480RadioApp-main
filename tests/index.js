import { createSession, addUserToSession, setCurrentSong } from '../modules/session.js';


async function userJoins(userId) {
    try {
        let sessionId = await getCurrentSessionId(); // Function to get the current session ID

        // Check if a session exists
        if (sessionId) {
            // Check if the user is already in the session
            const sessionData = await sessionManager.getSessionData(sessionId);
            if (sessionData && sessionData.users.includes(userId)) {
                console.log(`User ${userId} is already in the session. Rejoining.`);
            } else {
                // Add the user to the session
                await sessionManager.addUserToSession(sessionId, userId);
                console.log(`User ${userId} added to session ${sessionId}`);
            }
        } else {
            // Create a new session if none exists
            sessionId = await sessionManager.createSession();
            console.log(`Created new session with ID: ${sessionId}`);

            // Add the user to the new session
            await sessionManager.addUserToSession(sessionId, userId);
            console.log(`User ${userId} added to new session ${sessionId}`);
        }

    } catch (error) {
        console.error('An error occurred:', error);
    }
}




// testing functionality methods 
// async function main() {
    try {
        // Create a new session
        const sessionId = await sessionManager.createSession();
        console.log(`Created new session with ID: ${sessionId}`);

        // Add users to the session
        await sessionManager.addUserToSession(sessionId, 'user1');
        await sessionManager.addUserToSession(sessionId, 'user2');
        console.log('Added users to the session');

        // Remove User From Session 
        await sessionManager.removeUserFromSession(sessionId, 'user1');
        console.log('Removed user1 from the session');

        // Add songs to the queue
        await sessionManager.addSongToQueue(sessionId, { songId: 'song1', title: 'Song One', artist: 'Artist A' });
        await sessionManager.addSongToQueue(sessionId, { songId: 'song2', title: 'Song Two', artist: 'Artist B' });
        console.log('Added songs to the queue');

        // Remove song from Queue 
        await sessionManager.removeSongFromQueue(sessionId, 'song1');
        console.log('Removed song1 from the queue');

        // Set the current song
        await sessionManager.setCurrentSong(sessionId, 'song1');
        console.log('Set the current song');

        //Get the next Song 
        const nextSong = await sessionManager.getNextSong(sessionId);
        console.log('Next song in the queue:', nextSong ? nextSong.title : 'No more songs in the queue');

        //Clear Session 
        await sessionManager.clearSession(sessionId);
        console.log('Cleared the session data');

        // Retrieve and log session data
        const sessionData = await sessionManager.getSessionData(sessionId);
        console.log('Current Session Data:', sessionData);
    } 

    catch (error) {
        console.error('An error occurred:', error);
    }
//}

main();