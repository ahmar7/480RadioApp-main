$(document).ready(function(){

	// Function to handle the search form submission
	function handleSearchFormSubmit(event) {
		event.preventDefault(); // Prevent the default form submission

		const searchBar = document.getElementById('searchBar');
		const query = searchBar.value;
		console.log('Search query:', query); // Debugging

		if (query.length >= 3) { // Trigger search for 3 or more characters
				performYouTubeSearch(query);
		} else {
				clearSearchResults();
		}
	}

// Function to perform YouTube search
	function performYouTubeSearch(query) {
		$.ajax({
				url: `/search-youtube?q=${encodeURIComponent(query)}`,
				success: populateSearchResults,
				error: function(error) {
					console.error('Error fetching YouTube videos:', error);
				}
		});
	}

// Function to populate search results
	function populateSearchResults(data) {
		const searchResults = $('#searchResults');
		searchResults.empty();

		data.forEach(video => {
				// Define videoData inside the loop so it gets the correct data for each video
				const videoData = {
					videoId: video.videoId, // Adjusted from video.id.videoId
					title: video.title,
					thumbnail: video.thumbnail,
					channelName: video.channelName
				};

				const listSong = $("<li></li>");
				listSong.append($(`<img src="${videoData.thumbnail}" alt="Thumbnail" style="width:100px; height:auto;">`));
				listSong.append(`<span>${videoData.title}</span>`);

				listSong.click(async function(){
					// Point towards endpoint
					try {
						const response = await fetch(`/add-song-to-queue`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json'},
							body: JSON.stringify({
								sessionId: getSessionId(),
								videoData
							})
						})
						const data = await response.json();
						console.log('Song added to queue:', data);

						// Clear the search results after selection
						clearSearchResults(); 

						// populate frontend queue list
						updateQueue();
						
					} catch (error) {
						console.error('Error adding song to queue:', error);
					}
				})
				searchResults.append(listSong);
		});
	}

// Function to clear search results
	function clearSearchResults() {
		$('#searchResults').empty();
	}

// Function to get sessionID
	function getSessionId() {
		return sessionStorage.getItem('sessionId');
	}

// Event Listener for Search Form
	document.getElementById('searchForm').addEventListener('submit', handleSearchFormSubmit);

	let songs = [];
	const player = new Plyr('#player', {
		loadSprite: true,
		iconUrl: 'plyr.svg',
	});

// Function to load current song onto player
	async function loadSong() {
		const sessionId = getSessionId(); // Make sure this function correctly retrieves your session ID

		const response = await fetch(`/fetch-current-song?sessionId=${encodeURIComponent(sessionId)}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const data = await response.json();
		current = data.current;

		if(current){
			player.source = {
				type: 'video',
				sources: [
					{
						src: current.songId,
						provider: 'youtube',
					},
				],
			};

			player.poster = current.thumbnail
		}
	}

// Function to update current song
	async function updateCurrent(current = null) {
		const sessionId = getSessionId(); // Make sure this function correctly retrieves your session ID

		const response = await fetch(`/fetch-current-song?sessionId=${encodeURIComponent(sessionId)}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const data = await response.json();
		current = data.current;
		if(current){
			$("#current").html(
				$("<div class='current-track'></div>").html(
					$("<div class='track-info'></div>").html(
						$("<div class='track-title'></div>").text(current.title)
					).append(
						$("<div class='track-author'></div>").text(current.channelName)
					)
				)
			)
		}else{
			$("#current").text('No song playing.')
		}
	}

// Function to update queue
	async function updateQueue() {
		const sessionId = getSessionId(); // Make sure this function correctly retrieves your session ID
	
    // Post request
		const currentResponse = await fetch(`/fetch-current-song?sessionId=${encodeURIComponent(sessionId)}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const currentData = await currentResponse.json();
		const currentSong = currentData.current;
	
    // Post request
		const songsResponse = await fetch(`/fetch-songs?sessionId=${encodeURIComponent(sessionId)}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const songsData = await songsResponse.json();
		const songs = songsData.songs;
	
		$("#queue").empty(); // Clear previous content
	
		if (songs && songs.length > 0) {
			let filteredSongs = currentSong ? songs.filter(song => song.songId != currentSong.songId) : songs;
			
			if (filteredSongs.length > 0) {
				filteredSongs.forEach((song, index) => {
					const trackDiv = $("<div class='upcoming-track'></div>");
					trackDiv.append($("<div class='track-number'></div>").text(index + 1));
					trackDiv.append(
						$("<div class='track-info'></div>")
						.append($("<div class='track-title'></div>").text(song.title))
						.append($("<div class='track-author'></div>").text(song.channelName))
					);
					trackDiv.append(
						$("<div class='track-action'>x</div>").click(async () => {
							try {
								const response = await fetch(`/remove-song-from-queue`, {
									method: 'POST',
									headers: { 'Content-Type': 'application/json'},
									body: JSON.stringify({
										sessionId: getSessionId(),
										songId: song.songId
									})
								});
								const data = await response.json();
	
								updateQueue(); // Update the queue after removing a song
							} catch (error) {
								console.error('Error removing song from queue:', error);
							}
						})
					);
					$("#queue").append(trackDiv);
				});
			} else {
				$("#queue").text('No songs in queue');
			}
		} else {
			$("#queue").text('No songs in queue');
		}
	}

// Event Listener for Previous Button
	document.getElementById('previous-button').addEventListener('click', async function () {
		try {
			const response = await fetch(`/play-previous`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json'},
				body: JSON.stringify({
					sessionId: getSessionId()
				})
			})
			const data = await response.json();
			const songs = data.songs

			if(songs && songs.length>0){

				// load the song again
				loadSong();

				// repopulate the queue as songs list has changed.
				updateQueue();

				// update current song playing
				updateCurrent();

				player.play();
			}else{
				alert('No previous song available, Please add more.')
				console.log(data.error);
			}
		} catch (error) {
			alert('Encoutered an error while switching to previous song.')
		}
	});

// Event Listener for Play Button
	document.getElementById('play-button').addEventListener('click', async function () {
		console.log('Play button clicked');
		const sessionId = getSessionId(); // Make sure this function correctly retrieves your session ID

		const currentResponse = await fetch(`/fetch-current-song?sessionId=${encodeURIComponent(sessionId)}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const currentData = await currentResponse.json();
		currentSong = currentData.current;

		const songsResponse = await fetch(`/fetch-songs?sessionId=${encodeURIComponent(sessionId)}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const songsData = await songsResponse.json();
		songs = songsData.songs;

		if(songs.length==0){
			alert("There is no song to play")
			return;
		}

		if(!currentSong){
			$('#next-button').trigger('click');
			return;
		}

		player.togglePlay();
		if (player.paused) {
			player.poster = current.thumbnail; // Show the poster when the song is paused
		} else {
			player.poster = ''; // Hide the poster when the song is playing
		}
	});

// Event Listener for Next Button
	document.getElementById('next-button').addEventListener('click', async function () {
		console.log('Next button clicked');
		try {
			const response = await fetch(`/play-next`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json'},
				body: JSON.stringify({
					sessionId: getSessionId()
				})
			})
			const data = await response.json();
			const songs = data.songs

			if(songs && songs.length>0){

				// load the song again
				loadSong();

				// repopulate the queue as songs list has changed.
				updateQueue();

				// update current song playing
				updateCurrent();

				player.play();
			}else{
				alert('No next song available, Please add more.')
				console.log(data.error);
			}
		} catch (error) {
			alert('Encoutered an error while switching to next song.')
		}
	});

// Event Listener for Volume Up
	document.getElementById('volume-up-button').addEventListener('click', function () {
		player.increaseVolume(0.1);
    const volumeUpProgress = document.getElementById('volume-up-progress');
		volumeUpProgress.style.width = '0%';              // Set initial width to 0%
		volumeUpProgress.style.transition = 'width 0.5s'; // Add transition effect
		setTimeout(() => {
			volumeUpProgress.style.width = '100%';          // Set width to 100% after a delay
		}, 100);
	});

// Event Listener for Volume Down
	document.getElementById('volume-down-button').addEventListener('click', function () {
		player.decreaseVolume(0.1);
    const volumeDownProgress = document.getElementById('volume-down-progress');
		volumeDownProgress.style.width = '0%'; // Set initial width to 0%
		volumeDownProgress.style.transition = 'width 0.5s'; // Add transition effect
		setTimeout(() => {
			volumeDownProgress.style.width = '100%'; // Set width to 100% after a delay
		}, 100);
	});

	// Load the song for webpage
	loadSong();
	// Update CurrentSong for webpage
	updateCurrent();
	// Update Queue with CurrentSong and Rest of Songs for webpage
	updateQueue();

});


