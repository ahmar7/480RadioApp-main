import { createSession, addUserToSession, getSessionData, addSongToQueue, removeSongFromQueue, songNavigation } from './session.js';
import searchYouTube from './search.js';
import { checkConnection } from './redis.js';

const serverRoutes = (app) => {

// Serve static files route
    app.get('/', (req, res) => {
        res.sendFile('index.html', { root: 'webflow' });
    });

// Check redis connection route
    app.get('/check', async (req, res) => {
        try {
            const isConnected = await checkConnection();
            if (isConnected) {
                res.send('Redis Connection Status: Connected');
            } else {
                res.send('Redis Connection Status: Not Connected');
            }
        } catch (error) {
            console.error('Redis Client Error:', error);
            res.send('Redis Connection Status: Error - ' + error.message);
        }
    });

// Create session route
    app.post('/create-session', async (req, res) => {
        try {
            const { hostUsername, sessionPassword } = req.body;
            const sessionId = await createSession(hostUsername, sessionPassword);
            res.json({ message: 'Session created', sessionId });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// Add user to session route
        app.post('/add-user-to-session', async (req, res) => {
            const { sessionId, userId, password } = req.body;
            try {
                const result = await addUserToSession(sessionId, userId, password);
                if (result.error) {
                    res.status(400).json({ error: result.error });
                } else {
                    res.json({ message: 'User added to session' });
                }
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

// Youtube API Search Route
    app.get('/search-youtube', async (req, res) => {
        const query = req.query.q;
        try {
            const videoData = await searchYouTube(query);
            res.json(videoData);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// Add song to redis queue route
    app.post('/add-song-to-queue', async (req, res) => {
        const { sessionId, videoData } = req.body;
        try {
            const result = await addSongToQueue(sessionId, videoData);
            if (!result.success) {
                res.status(400).json({ error: result.error });
            } else {
                res.json({ message: result.message });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// Remove song from redis queue route
    app.post('/remove-song-from-queue', async (req, res) => {
        const { sessionId, songId } = req.body;
    
        try {
            const result = await removeSongFromQueue(sessionId, songId);
            if (result.success) {
                res.json({ message: result.message, removed: result.song });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// Shift queue backwards route
    app.post('/play-previous', async (req, res) => {
        const {sessionId} = req.body;
        try {
            const result = await songNavigation(sessionId, 'previous');
            if (result.success) {
                res.json({ message: result.message, songs: result.songs });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// Shift queue forwards route
    app.post('/play-next', async (req, res) => {
        const {sessionId} = req.body;
        try {
            const result = await songNavigation(sessionId, 'next');
            if (result.success) {
                res.json({ message: result.message, songs: result.songs });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// Fetch queue from redis route
    app.get('/fetch-songs', async (req, res) => {
        const sessionId = req.query.sessionId;
    
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
    
        try {
            const result = await getSessionData(sessionId);
    
            if (result.session) {
                res.json({ songs: result.session.songs });
            } else {
                res.status(404).json({ error: result.error || 'Session not found' });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// Fetch current song from redis route
    app.get('/fetch-current-song', async (req, res) => {
        const sessionId = req.query.sessionId;
    
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
    
        try {
            const result = await getSessionData(sessionId);
    
            if (result.session) {
                let current = null;
                if(result.session.currentSong){
                    current = result.session.songs.filter(song=>song.songId == result.session.currentSong);
                    current = current.length>0 ? current[0] : null;
                }
                res.json({ success: true, current: current });
            } else {
                res.status(404).json({ error: result.error || 'Session not found' });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};



export default serverRoutes;