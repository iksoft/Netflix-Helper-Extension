/**
 * Netflix Helper Pro - Popup Script
 * This script manages the popup UI and interacts with the Netflix Helper SDK.
 * Version: 2.0.0
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const statusConnection = document.getElementById('status-connection');
    const statusVideos = document.getElementById('status-videos');
    const statusOverlays = document.getElementById('status-overlays');
    const playerStatus = document.getElementById('player-status');
    const header = document.getElementById('header');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const supportLink = document.getElementById('supportLink');
    const enabledToggle = document.getElementById('enabledToggle');
    const mainContent = document.querySelector('.main-content');

    // --- Helper to send messages to content script ---
    const sendMessage = (action, params = {}) => {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length === 0 || !tabs[0].id) {
                    return reject(new Error("No active tab found."));
                }
                chrome.tabs.sendMessage(tabs[0].id, { action, ...params }, (response) => {
                    if (chrome.runtime.lastError) {
                        return reject(chrome.runtime.lastError);
                    }
                    resolve(response);
                });
            });
        });
    };

    // --- UI Update Functions ---
    const updateStatus = async () => {
        try {
            statusConnection.textContent = 'Checking...';
            statusConnection.classList.remove('connected');
            header.classList.remove('connected');

            const status = await sendMessage('getStatus');

            if (status && status.connection === 'Connected') {
                statusConnection.textContent = 'Connected';
                statusConnection.classList.add('connected');
                header.classList.add('connected');
                statusVideos.textContent = status.videoCount;
                statusOverlays.textContent = status.overlayCount;
                playerStatus.textContent = status.isPlaying ? 'Playing' : 'Paused';
                playerStatus.className = status.isPlaying ? 'playing' : '';
                updateVolumeDisplay(status.volume, status.muted);
                updatePlayPauseButton(status.isPlaying);
            } else {
                throw new Error('Not connected to Netflix tab.');
            }
        } catch (error) {
            statusConnection.textContent = 'Disconnected';
            statusVideos.textContent = 'N/A';
            statusOverlays.textContent = 'N/A';
            playerStatus.textContent = 'N/A';
            playerStatus.className = '';
            console.warn("Status update failed:", error.message);
        }
    };

    const updateVolumeDisplay = (volume, muted) => {
        volumeSlider.value = muted ? 0 : volume;
        volumeValue.textContent = muted ? 'Muted' : `${volume}%`;
        muteBtn.querySelector('i').className = muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    };

    const updatePlayPauseButton = (isPlaying) => {
        const icon = playPauseBtn.querySelector('i');
        const text = playPauseBtn.querySelector('span');
        if (isPlaying) {
            icon.className = 'fas fa-pause';
            text.textContent = 'Pause';
        } else {
            icon.className = 'fas fa-play';
            text.textContent = 'Play';
        }
    };


    // --- Event Listeners ---
    const bindEvents = () => {
        playPauseBtn.addEventListener('click', () => {
            sendMessage('playPause').then(updateStatus);
        });

        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            sendMessage('toggleFullscreen');
        });

        muteBtn.addEventListener('click', () => {
            sendMessage('toggleMute').then(updateStatus);
        });

        document.getElementById('subtitlesBtn').addEventListener('click', () => {
            sendMessage('toggleSubtitles');
        });

        document.getElementById('qualityBtn').addEventListener('click', () => {
            sendMessage('toggleQuality');
        });

        document.getElementById('removeOverlaysBtn').addEventListener('click', () => {
            sendMessage('removeOverlays');
        });

        volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value, 10);
            updateVolumeDisplay(volume, false); // Visually update immediately
            sendMessage('setVolume', { volume });
        });
        
        supportLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://t.me/netflixhelperpro' });
        });

        enabledToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            chrome.storage.local.set({ extensionEnabled: isEnabled }, () => {
                // Reload the active tab to apply changes immediately
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0] && tabs[0].id) {
                        // Check if the tab is a Netflix page before reloading
                        if (tabs[0].url && tabs[0].url.includes('netflix.com')) {
                            chrome.tabs.reload(tabs[0].id);
                        }
                    }
                });
            });
            mainContent.classList.toggle('disabled', !isEnabled);
        });
    };

    const initializeState = async () => {
        const data = await chrome.storage.local.get('extensionEnabled');
        const isEnabled = data.extensionEnabled !== false; // Default to true
        enabledToggle.checked = isEnabled;
        mainContent.classList.toggle('disabled', !isEnabled);
        if (isEnabled) {
            updateStatus();
        } else {
            statusConnection.textContent = 'Disabled';
        }
    };

    // --- Initialization ---
    initializeState();
    bindEvents();
});

