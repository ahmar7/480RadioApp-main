import { v4 as uuidv4 } from 'uuid'
import redis from './redis.js'

async function createSession(hostUserId, sessionPassword) {
    const sessionId = uuidv4();
    const sessionData = {
        sessionId,
        host: hostUserId,
        password: sessionPassword,
        users: [hostUserId],
        songs: [],
        currentSong: null
    };
    await redis.set(`session:${sessionData.sessionId}`, JSON.stringify(sessionData));;
    
    // Logging sessionId,
    console.log(`Session created: sessionId=${sessionId}, host=${hostUserId}, password=${sessionPassword}`);
    return sessionId;
}


async function addUserToSession(sessionId, userId, password) {
    console.log(`Attempting to add user to session: sessionId=${sessionId}, userId=${userId}`);

    const sessionJson = await redis.get(`session:${sessionId}`);
    if (!sessionJson) {
        console.log(`Session not found: sessionId=${sessionId}`);
        return { error: "Session not found" };
    }

    const sessionData = JSON.parse(sessionJson);
    console.log(`Fetched session data:`, sessionData);
    console.log("Received password:", password);
    console.log("Stored session password:", sessionData.password);

    // Check if the provided password matches the session's password
    if (sessionData.password !== password) {
        console.log(`Incorrect password for session: sessionId=${sessionId}`);
        return { error: "Incorrect password" };
    }

    // Check if user is already in the session
    if (sessionData.users.includes(userId)) {
        console.log(`User already in session: userId=${userId}, sessionId=${sessionId}`);
        return { message: "User already in session" };
    }

    // Add the new user to the session
    sessionData.users.push(userId);
    console.log(`Adding user: userId=${userId} to sessionId=${sessionId}`);

    await redis.set(`session:${sessionData.sessionId}`, JSON.stringify(sessionData));
    console.log(`User added successfully: userId=${userId}, sessionId=${sessionId}`);
    return { message: "User added to session" };
}

async function addSongToQueue(sessionId, videoData) {
    try {
        // Prepare the song object using provided video data
        const newSong = {
            songId: videoData.videoId,
            title: videoData.title,
            thumbnail: videoData.thumbnail,
            channelName: videoData.channelName
        };

        // Retrieve the session data from Redis
        const sessionJson = await redis.get(`session:${sessionId}`);
        if (sessionJson) {
            // Deserialize the session data
            const sessionData = JSON.parse(sessionJson);
            
            // Add the new song to the session's song queue
            sessionData.songs.push(newSong);

            // Serialize and save the updated session data
            await redis.set(`session:${sessionData.sessionId}`, JSON.stringify(sessionData));

            // Log the title of the song
            console.log(`Song added to queue: ${newSong.title}`)

            return { success: true, message: 'Song added to queue' };
        } else {
            console.error(`Session with ID ${sessionId} does not exist.`);
            return { success: false, error: "Session not found" };
        }
    } catch (error) {
        console.error('Error in addSongToQueue:', error);
        return { success: false, error: error.message };
    }
}

async function setCurrentSong(sessionId, songId){
    const sessionJson = await redis.get(`session:${sessionId}`);

    if (sessionJson) {
        // Deserialize the session data
        const sessionData = JSON.parse(sessionJson);

        // Find the song in the songs list
        const song = sessionData.songs.find(s => s.songId === songId);
        if (!song) {
            console.error(`Song with ID ${songId} not found in the session.`);
            // Optionally, return an error or a specific response
            return { error: "Song not found" };
        }

        // Set the current song
        sessionData.currentSong = song;

        // Serialize and save the updated session data
        await redis.set(`session:${sessionId}`, JSON.stringify(sessionData));
    } else {
        // Handle the case where the session does not exist
        console.error(`Session with ID ${sessionId} does not exist.`);
        // Optionally, return an error or a specific response
        return { error: "Session not found" };
    }
}

async function getSessionData(sessionId){
    const sessionJson = await redis.get(`session:${sessionId}`);

    if (sessionJson) {
        // Deserialize the session data from the JSON string
        return {session: JSON.parse(sessionJson)}
    } else {
        // Handle the case where the session does not exist
        // Optionally, return an error or a specific response
        return {error: `Session with ID ${sessionId} does not exist.`};
    }
}

async function updateSessionData(sessionId, sessionData){
// It takes the session ID and the updated session data object as arguments, serializes the session data into a JSON string, and then saves it back to Redis.
 
// Serialize the session data into a JSON string
 const sessionJson = JSON.stringify(sessionData);

 // Save the serialized data back to Redis
 await redis.set(`session:${sessionId}`, sessionJson);
}

async function removeUserFromSession(sessionId, userId){
    const sessionJson = await redis.get(`session:${sessionId}`);

    if (sessionJson) {
        // Deserialize the session data
        const sessionData = JSON.parse(sessionJson);

        // Remove the user from the session's user list
        sessionData.users = sessionData.users.filter(user => user !== userId);

        // Serialize and save the updated session data
        await updateSessionData(sessionId, sessionData);
    } else {
        // Handle the case where the session does not exist
        console.error(`Session with ID ${sessionId} does not exist.`);
        // Optionally, return an error or a specific response
        return { error: "Session not found" };
    }
}

async function removeSongFromQueue(sessionId, songId){
    try {
        const sessionJson = await redis.get(`session:${sessionId}`);

        if (sessionJson) {
            let songToRemove = null;

            // Deserialize the session data
            const sessionData = JSON.parse(sessionJson);

            // Remove the song from the session's songs list
            sessionData.songs = sessionData.songs.filter(song => {
                if(song.songId == songId){
                    songToRemove = song;
                    return false;
                }
                return true;
            });

            // Serialize and save the updated session data
            await updateSessionData(sessionId, sessionData);

            return { success: true, song: songToRemove, message: 'Song removed from queue', };
        } else {
            // Handle the case where the session does not exist
            console.error(`Session with ID ${sessionId} does not exist.`);
            // Optionally, return an error or a specific response
            return { success: false, error: "Session not found" };
        }
    }
    catch(error){
        console.error('Error in removeSongFromQueue:', error);
        return { success: false, error: error.message };
    }
}

async function getNextSong(sessionId){ 
    const sessionJson = await redis.get(`session:${sessionId}`);

    if (sessionJson) {
        // Deserialize the session data
        const sessionData = JSON.parse(sessionJson);

        // Find the index of the current song
        const currentSongIndex = sessionData.songs.findIndex(song => song.songId === sessionData.currentSong.songId);

        let nextSong = null;

        // Check if there is a next song in the queue
        if (currentSongIndex >= 0 && currentSongIndex < sessionData.songs.length - 1) {
            // Get the next song in the queue
            nextSong = sessionData.songs[currentSongIndex + 1];
        } else if (sessionData.songs.length > 0) {
            // Optional: Loop back to the first song if at the end of the queue
            nextSong = sessionData.songs[0];
        }

        // Update the current song
        sessionData.currentSong = nextSong;

        // Serialize and save the updated session data
        await updateSessionData(sessionId, sessionData);

        // Return the next song
        return nextSong;
    } else {
        // Handle the case where the session does not exist
        console.error(`Session with ID ${sessionId} does not exist.`);
        // Optionally, return an error or a specific response
        return { error: "Session not found" };
    }
}

async function clearSession(sessionId){
    const sessionJson = await redis.get(`session:${sessionId}`);

    if (sessionJson) {
        // Reset the session data to its initial state
        const sessionData = {
            sessionId: sessionId,
            users: [],
            songs: [],
            currentSong: null
        };

        // Serialize and save the cleared session data
        await updateSessionData(sessionId, sessionData);
    } else {
        // Handle the case where the session does not exist
        console.error(`Session with ID ${sessionId} does not exist.`);
        // Optionally, return an error or a specific response
        return { error: "Session not found" };
    }
}

async function songNavigation(sessionId, direction){
    try {
        const sessionJson = await redis.get(`session:${sessionId}`);

        if (sessionJson) {
            // Deserialize the session data
            const sessionData = JSON.parse(sessionJson);
            // Remove the song from the session's songs list


            if(sessionData.currentSong){

                if(sessionData.songs.length == 1){
                    return { success: false, error: "No new song to play" };
                }

                if(sessionData.songs.length == 0) {
                    sessionData.currentSong = null;
                }else{
                    if(direction == 'previous'){
                        let lastItem = sessionData.songs.pop();

                        // Remove the first item
                        sessionData.songs.shift();

                        // Insert the last item in the first position
                        sessionData.songs.unshift(lastItem);
                    }else{
                        sessionData.songs.shift()
                    }

                    sessionData.currentSong = sessionData.songs[0].songId;
                }

            }else if(sessionData.songs.length>0){
                if(direction == "previous"){
                    sessionData.currentSong = sessionData.songs[sessionData.songs.length - 1].songId
                }else{
                    sessionData.currentSong = sessionData.songs[0].songId
                }
            }else{
                return { success: false, error: "No song to play" };
            }

            // Serialize and save the updated session data
            await updateSessionData(sessionId, sessionData);

            return { success: true, songs: sessionData.songs, message: 'Songs list updated', };
        } else {
            // Handle the case where the session does not exist
            console.error(`Session with ID ${sessionId} does not exist.`);
            // Optionally, return an error or a specific response
            return { success: false, error: "Session not found" };
        }
    }
    catch(error){
        console.error('Error in removeSongFromQueue:', error);
        return { success: false, error: error.message };
    }
}

export {
    createSession,
    addUserToSession,
    removeUserFromSession,
    addSongToQueue,
    removeSongFromQueue,
    setCurrentSong,
    getSessionData,
    songNavigation,
    getNextSong,
    clearSession,
    updateSessionData,
};