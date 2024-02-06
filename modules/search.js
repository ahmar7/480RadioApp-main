// Nick API key: AIzaSyAeYwo9OkPXCemXLJcHNIFxDUKjOlI2IZc
// Josh API key: AIzaSyA2-dPP3pomGe8ykbxfHQJlvvNOQmXKlVU
// const API_KEY = 'AIzaSyAeYwo9OkPXCemXLJcHNIFxDUKjOlI2IZc';

//async function getVideoDetails(videoId) {
//    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet`;
//    const response = await axios.get(url);
//    const videoData = response.data.items[0].snippet;

//    return {
//        videoId: videoId,
//        title: videoData.title,
//        thumbnail: videoData.thumbnails.high.url,
//        channelName: videoData.channelTitle
//    };
//}

//export default getVideoDetails;

import axios from 'axios';

const API_KEY = 'AIzaSyAeYwo9OkPXCemXLJcHNIFxDUKjOlI2IZc';

async function searchYouTube(query, maxResults = 5) {
    const YOUTUBE_SEARCH_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`;

    try {
        const response = await axios.get(YOUTUBE_SEARCH_URL);
        return response.data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelName: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url
        }));
    } catch (error) {
        console.error('YouTube API Error:', error);
        throw error;
    }
}

export default searchYouTube;