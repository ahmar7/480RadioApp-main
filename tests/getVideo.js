import getVideoDetails from "../modules/search.js";

async function testGetVideoDetails() {
    const videoId = 'Xrln0-3MC3k'; // Replace with a valid YouTube video ID
    try {
        const videoDetails = await getVideoDetails(videoId);
        console.log('Video Details:', videoDetails);
    } catch (error) {
        console.error('Error fetching video details:', error);
    }
}

testGetVideoDetails();