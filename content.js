/**
 * Netflix Helper Pro - Enhanced Content Script
 * Advanced Netflix page interaction with premium UI and sophisticated functionality.
 * Version: 3.0.0 (Completely Enhanced)
 */

class NetflixHelperPro {
  constructor() {
      this.floatingPanel = null;
      this.observer = null;
      this.notificationQueue = [];
      this.isEnabled = true;
      this.isInitialized = false;
      this.videoPlayer = null;
      this.lastKnownState = {};
      this.controlsVisible = false;
      this.isDragging = false;
      this.dragOffset = { x: 0, y: 0 };
      
      // Advanced overlay detection patterns
      this.overlayPatterns = [
          '.player-post-play-recommendations-container',
          '[data-uia="interrupt-pane"]',
          '.watch-video--interstitial-scrim',
          '.nf-modal.interstitial-full-screen',
          '.playback-unified-overlay',
          '.watch-video--evidence-overlay',
          '.evidence-overlay',
          '.billboard-modal',
          '.postplay-rec-overlay',
          '.interstitial',
          '[data-uia="postplay-rec-overlay"]',
          '[data-uia="postplay-countdown"]',
          '.watch-video--overlay-container',
          '.postplay-container'
      ];

      this.checkInitialState();
  }

  async checkInitialState() {
      const data = await chrome.storage.local.get('extensionEnabled');
      this.isEnabled = data.extensionEnabled !== false; // Default to true

      this.bindListeners(); // Always bind listeners to catch state changes

      if (this.isEnabled) {
          this.init();
      } else {
          console.log("Netflix Helper Pro: Disabled by user setting.");
      }
  }

  init() {
      if (this.isInitialized) return;
      console.log("🎬 Netflix Helper Pro: Initializing enhanced content script");
      this.isInitialized = true;
      this.runFeatures();
      this.showNotification('Netflix Helper Pro activated!', 'success');
  }

  deactivate() {
      console.log("Netflix Helper Pro: Deactivating features.");
      if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
      }
      if (this.floatingPanel) {
          this.floatingPanel.remove();
          this.floatingPanel = null;
      }
      this.isInitialized = false;
  }

  runFeatures() {
      this.removeAdvancedOverlays();
      this.createAdvancedFloatingControls();
      this.injectAdvancedStyles();
      this.loadDependencies();
      this.setupKeyboardShortcuts();
      this.monitorVideoState();
      this.startAdvancedObserver();
  }

  bindListeners() {
      // Main message listener
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (!this.isEnabled) {
              // If the extension is disabled, don't respond to feature requests.
              sendResponse({ success: false, message: "Extension is disabled."});
              return;
          }

          const action = this.actionHandlers[request.action];
          if (typeof action === 'function') {
              try {
                  const result = action(request);
                  if (result instanceof Promise) {
                      result.then(res => sendResponse({ success: true, ...res }))
                            .catch(err => sendResponse({ success: false, message: err.message }));
                      return true; // Keep channel open for async
                  } else {
                      sendResponse({ success: true, ...result });
                  }
              } catch (error) {
                  console.error('Netflix Helper Pro Error:', error);
                  sendResponse({ success: false, message: error.message });
              }
          } else {
              sendResponse({ success: false, message: `Unknown action: ${request.action}` });
          }
          return true;
      });

      // Listen for the master toggle switch
      chrome.storage.onChanged.addListener((changes, area) => {
          if (area === 'local' && changes.extensionEnabled !== undefined) {
              const wasEnabled = this.isEnabled;
              this.isEnabled = changes.extensionEnabled.newValue;

              if (this.isEnabled && !wasEnabled) {
                  console.log("Netflix Helper Pro: Enabling...");
                  this.init();
              } else if (!this.isEnabled && wasEnabled) {
                  console.log("Netflix Helper Pro: Disabling...");
                  this.deactivate();
              }
          }
      });
  }

  // === Advanced Action Handlers ===
  actionHandlers = {
      getStatus: () => {
          const video = this.findVideoPlayer();
          const overlayCount = this.countVisibleOverlays();
          const currentTime = video ? Math.floor(video.currentTime) : 0;
          const duration = video ? Math.floor(video.duration) : 0;
          
          return {
              connection: 'Connected',
              videoCount: document.querySelectorAll('video').length,
              overlayCount: overlayCount,
              volume: video ? Math.round(video.volume * 100) : 50,
              muted: video ? video.muted : false,
              isPlaying: video ? !video.paused : false,
              currentTime: currentTime,
              duration: duration,
              fullscreen: !!document.fullscreenElement,
              quality: this.getVideoQuality(),
              subtitles: this.getSubtitleStatus()
          };
      },

      playPause: () => {
          const video = this.findVideoPlayer();
          if (!video) throw new Error("No video player found");
          
          if (video.paused) {
              video.play();
              this.showNotification('▶️ Playing', 'info');
          } else {
              video.pause();
              this.showNotification('⏸️ Paused', 'info');
          }
          
          return { isPlaying: !video.paused };
      },

      toggleMute: () => {
          const video = this.findVideoPlayer();
          if (!video) throw new Error("No video player found");
          
          video.muted = !video.muted;
          this.showNotification(video.muted ? '🔇 Muted' : '🔊 Unmuted', 'info');
          return { muted: video.muted };
      },

      setVolume: (params) => {
          const video = this.findVideoPlayer();
          if (!video) throw new Error("No video player found");
          
          const newVolume = Math.max(0, Math.min(100, parseInt(params.volume, 10))) / 100;
          video.volume = newVolume;
          video.muted = false;
          
          this.showNotification(`🔊 Volume: ${Math.round(newVolume * 100)}%`, 'info');
          return { volume: Math.round(newVolume * 100), muted: false };
      },

      toggleFullscreen: async () => {
          try {
              if (!document.fullscreenElement) {
                  await document.documentElement.requestFullscreen();
                  this.showNotification('🖥️ Fullscreen enabled', 'success');
              } else {
                  await document.exitFullscreen();
                  this.showNotification('🪟 Fullscreen disabled', 'success');
              }
              return { fullscreen: !!document.fullscreenElement };
          } catch (error) {
              throw new Error(`Fullscreen toggle failed: ${error.message}`);
          }
      },

      toggleSubtitles: () => {
          const subtitleButton = document.querySelector('[data-uia="player-controls-item-button-audio-subtitle"]') ||
                               document.querySelector('[aria-label="Audio & Subtitles"]');
          
          if (subtitleButton) {
              subtitleButton.click();
              this.showNotification('💬 Audio & Subtitles menu opened', 'info');
              return { message: "Audio & Subtitles menu opened successfully" };
          } else {
              throw new Error("Audio & Subtitles control not found");
          }
      },

      toggleQuality: () => {
          const qualityButton = document.querySelector('[data-uia="player-controls-item-button-audio-subtitle"]') ||
                              document.querySelector('[aria-label="Audio & Subtitles"]');
          
          if (qualityButton) {
              qualityButton.click();
              this.showNotification('⚙️ Quality menu opened', 'info');
              return { message: "Quality menu opened" };
          } else {
              throw new Error("Quality control not found");
          }
      },

      removeOverlays: () => {
          const removedCount = this.removeAdvancedOverlays();
          this.showNotification(`🧹 Removed ${removedCount} overlays`, 'success');
          return { message: `Removed ${removedCount} overlays`, count: removedCount };
      },

      goHome: () => {
          window.location.href = "https://www.netflix.com/browse";
          return { message: "Navigating to home" };
      },

      skipForward: () => {
          const video = this.findVideoPlayer();
          if (!video) throw new Error("No video player found");
          video.currentTime += 10; // Seek forward 10 seconds
          this.showNotification('⏭️ Skipped 10s', 'success');
          return { message: "Skipped forward 10 seconds" };
      },

      enhanceVideo: () => {
          this.applyVideoEnhancements();
          this.showNotification('✨ Video enhanced', 'success');
          return { message: "Video enhancements applied" };
      }
  };

  // === Advanced UI Components ===
  createAdvancedFloatingControls() {
      if (document.getElementById('nhp-floating-panel')) return;

      this.floatingPanel = document.createElement('div');
      this.floatingPanel.id = 'nhp-floating-panel';
      this.floatingPanel.className = 'nhp-floating-container';
      
      const controlsHTML = `
          <div class="nhp-fab" id="nhp-fab">
              <img src="${chrome.runtime.getURL('icons/icon128.png')}" class="nhp-fab-icon-img" alt="Icon">
              <div class="nhp-fab-ripple"></div>
          </div>
          
          <div class="nhp-fab nhp-telegram-fab" id="nhp-telegram-fab" title="Join Telegram Group">
              <i class="fab fa-telegram-plane nhp-fab-icon"></i>
              <div class="nhp-fab-ripple"></div>
          </div>
          
          <div class="nhp-controls-panel" id="nhp-controls-panel">
              <div class="nhp-panel-header">
                  <h3>Netflix Helper Pro</h3>
                  <button class="nhp-close-btn" id="nhp-close-btn">
                      <i class="fas fa-times"></i>
                  </button>
              </div>
              
              <div class="nhp-controls-grid">
                  <button class="nhp-control-btn nhp-primary" data-action="playPause" title="Play/Pause">
                      <i class="fas fa-play"></i>
                      <span>Play</span>
                  </button>
                  
                  <button class="nhp-control-btn" data-action="toggleMute" title="Toggle Mute">
                      <i class="fas fa-volume-up"></i>
                      <span>Mute</span>
                  </button>
                  
                  <button class="nhp-control-btn" data-action="toggleFullscreen" title="Fullscreen">
                      <i class="fas fa-expand"></i>
                      <span>Fullscreen</span>
                  </button>
                  
                  <button class="nhp-control-btn" data-action="toggleSubtitles" title="Subtitles">
                      <i class="fas fa-closed-captioning"></i>
                      <span>Subtitles</span>
                  </button>
                  
                  <button class="nhp-control-btn" data-action="skipForward" title="Skip 10s">
                      <i class="fas fa-forward"></i>
                      <span>Skip</span>
                  </button>
                  
                  <button class="nhp-control-btn nhp-danger" data-action="removeOverlays" title="Remove Overlays">
                      <i class="fas fa-eye-slash"></i>
                      <span>Clean</span>
                  </button>
              </div>
              
              <div class="nhp-volume-section">
                  <div class="nhp-volume-header">
                      <i class="fas fa-volume-up"></i>
                      <span>Volume</span>
                      <span class="nhp-volume-value" id="nhp-volume-value">50%</span>
                  </div>
                  <div class="nhp-volume-slider-container">
                      <input type="range" class="nhp-volume-slider" id="nhp-volume-slider" 
                             min="0" max="100" value="50">
                  </div>
              </div>
              
              <div class="nhp-status-indicators">
                  <div class="nhp-status-item">
                      <i class="fas fa-wifi"></i>
                      <span>Connected</span>
                  </div>
                  <div class="nhp-status-item" id="nhp-video-status">
                      <i class="fas fa-play-circle"></i>
                      <span>Ready</span>
                  </div>
              </div>
          </div>
          
          <div class="nhp-notification-container" id="nhp-notifications"></div>
      `;
      
      this.floatingPanel.innerHTML = controlsHTML;
      document.body.appendChild(this.floatingPanel);
      
      this.bindFloatingControlEvents();
      this.makeDraggable();
  }

  bindFloatingControlEvents() {
      const fab = document.getElementById('nhp-fab');
      const telegramFab = document.getElementById('nhp-telegram-fab');
      const panel = document.getElementById('nhp-controls-panel');
      const closeBtn = document.getElementById('nhp-close-btn');
      const volumeSlider = document.getElementById('nhp-volume-slider');
      const volumeValue = document.getElementById('nhp-volume-value');

      // FAB click to toggle panel
      fab.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleControlsPanel();
      });

      // Telegram FAB click to open Telegram group
      telegramFab.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openTelegramGroup();
      });

      // Close button
      closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.hideControlsPanel();
      });

      // Control buttons
      panel.addEventListener('click', (e) => {
          e.stopPropagation();
          const button = e.target.closest('[data-action]');
          if (button) {
              const action = button.dataset.action;
              this.executeAction(action);
          }
      });

      // Volume slider
      volumeSlider.addEventListener('input', (e) => {
          const volume = e.target.value;
          volumeValue.textContent = `${volume}%`;
          this.executeAction('setVolume', { volume });
      });

      // Close panel when clicking outside
      document.addEventListener('click', (e) => {
          if (!this.floatingPanel.contains(e.target) && this.controlsVisible) {
              this.hideControlsPanel();
          }
      });

      // Update video status periodically
      setInterval(() => this.updateVideoStatus(), 1000);
  }

  makeDraggable() {
      const fab = document.getElementById('nhp-fab');
      const telegramFab = document.getElementById('nhp-telegram-fab');
      let isDragging = false;
      let startX, startY, initialX, initialY;

      const startDrag = (e) => {
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          const rect = this.floatingPanel.getBoundingClientRect();
          initialX = rect.left;
          initialY = rect.top;
          
          fab.style.cursor = 'grabbing';
          telegramFab.style.cursor = 'grabbing';
      };

      fab.addEventListener('mousedown', startDrag);
      telegramFab.addEventListener('mousedown', startDrag);

      document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;
          
          const newX = Math.max(0, Math.min(window.innerWidth - 60, initialX + deltaX));
          const newY = Math.max(0, Math.min(window.innerHeight - 120, initialY + deltaY));
          
          this.floatingPanel.style.left = `${newX}px`;
          this.floatingPanel.style.top = `${newY}px`;
          this.floatingPanel.style.right = 'auto';
          this.floatingPanel.style.bottom = 'auto';
      });

      document.addEventListener('mouseup', () => {
          if (isDragging) {
              isDragging = false;
              fab.style.cursor = 'pointer';
              telegramFab.style.cursor = 'pointer';
          }
      });
  }

  toggleControlsPanel() {
      const panel = document.getElementById('nhp-controls-panel');
      this.controlsVisible = !this.controlsVisible;
      
      if (this.controlsVisible) {
          panel.classList.add('nhp-visible');
          this.updateVolumeSlider();
      } else {
          panel.classList.remove('nhp-visible');
      }
  }

  hideControlsPanel() {
      const panel = document.getElementById('nhp-controls-panel');
      panel.classList.remove('nhp-visible');
      this.controlsVisible = false;
  }

  openTelegramGroup() {
      // Open Telegram group in new tab
      window.open('https://t.me/netflixhelperpro', '_blank');
      this.showNotification('Opening Telegram group...', 'info');
  }

  // === Advanced Overlay Removal ===
  removeAdvancedOverlays() {
      let removedCount = 0;
      
      this.overlayPatterns.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
              // More aggressive removal: remove the element regardless of its visibility state.
              element.remove();
              removedCount++;
              console.log(`🎬 Netflix Helper Pro: Removed overlay: ${selector}`);
          });
      });

      // Advanced overlay detection by content analysis
      this.removeByContentAnalysis();
      
      return removedCount;
  }

  removeByContentAnalysis() {
      // Remove elements with common overlay text patterns
      const overlayTexts = [
          'Are you still watching',
          'Next Episode',
          'Watch Credits',
          'Skip Intro',
          'Continue Watching'
      ];

      document.querySelectorAll('*').forEach(element => {
          const text = element.textContent?.trim();
          if (text && overlayTexts.some(pattern => text.includes(pattern))) {
              const overlay = element.closest('[class*="overlay"], [class*="modal"], [class*="popup"]');
              // More aggressive removal for content-based detection
              if (overlay) {
                  overlay.remove();
              }
          }
      });
  }

  countVisibleOverlays() {
      let count = 0;
      this.overlayPatterns.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
              if (element.offsetParent !== null) count++;
          });
      });
      return count;
  }

  // === Advanced Monitoring ===
  startAdvancedObserver() {
      if (this.observer) this.observer.disconnect();
      
      this.observer = new MutationObserver((mutations) => {
          let shouldCheckOverlays = false;
          
          mutations.forEach(mutation => {
              // Check for new nodes that might be overlays
              mutation.addedNodes.forEach(node => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                      const element = node;
                      if (this.isLikelyOverlay(element)) {
                          shouldCheckOverlays = true;
                      }
                  }
              });
              
              // Check for attribute changes that might indicate overlays
              if (mutation.type === 'attributes' && 
                  (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                  if (this.isLikelyOverlay(mutation.target)) {
                      shouldCheckOverlays = true;
                  }
              }
          });
          
          if (shouldCheckOverlays) {
              setTimeout(() => this.removeAdvancedOverlays(), 100);
          }
      });

      this.observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
      });
  }

  isLikelyOverlay(element) {
      const classNames = element.className?.toString().toLowerCase() || '';
      const overlayKeywords = ['overlay', 'modal', 'popup', 'interstitial', 'postplay', 'interrupt'];
      return overlayKeywords.some(keyword => classNames.includes(keyword));
  }

  // === Utility Functions ===
  findVideoPlayer() {
      this.videoPlayer = document.querySelector('video') || this.videoPlayer;
      return this.videoPlayer;
  }

  getVideoQuality() {
      const video = this.findVideoPlayer();
      if (!video) return 'Unknown';
      
      const videoHeight = video.videoHeight;
      if (videoHeight >= 2160) return '4K';
      if (videoHeight >= 1440) return '1440p';
      if (videoHeight >= 1080) return '1080p';
      if (videoHeight >= 720) return '720p';
      if (videoHeight >= 480) return '480p';
      return `${videoHeight}p`;
  }

  getSubtitleStatus() {
      const subtitleTrack = document.querySelector('video track[kind="subtitles"]');
      return subtitleTrack ? 'Available' : 'None';
  }

  setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
          // Only activate shortcuts when not in input fields
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
          
          switch (e.key.toLowerCase()) {
              case 'h': // Toggle helper panel
                  if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      this.toggleControlsPanel();
                  }
                  break;
              case 'c': // Clear overlays
                  if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      this.executeAction('removeOverlays');
                  }
                  break;
          }
      });
  }

  monitorVideoState() {
      setInterval(() => {
          const video = this.findVideoPlayer();
          if (video) {
              const currentState = {
                  isPlaying: !video.paused,
                  volume: Math.round(video.volume * 100),
                  muted: video.muted
              };
              
              // Update UI if state changed
              if (JSON.stringify(currentState) !== JSON.stringify(this.lastKnownState)) {
                  this.updateVideoStatus();
                  this.lastKnownState = currentState;
              }
          }
      }, 500);
  }

  updateVideoStatus() {
      const video = this.findVideoPlayer();
      const statusElement = document.getElementById('nhp-video-status');
      
      if (video && statusElement) {
          const icon = statusElement.querySelector('i');
          const text = statusElement.querySelector('span');
          
          if (video.paused) {
              icon.className = 'fas fa-pause-circle';
              text.textContent = 'Paused';
          } else {
              icon.className = 'fas fa-play-circle';
              text.textContent = 'Playing';
          }
      }
      
      this.updateVolumeSlider();
  }

  updateVolumeSlider() {
      const video = this.findVideoPlayer();
      const slider = document.getElementById('nhp-volume-slider');
      const valueDisplay = document.getElementById('nhp-volume-value');
      
      if (video && slider && valueDisplay) {
          const volume = Math.round(video.volume * 100);
          slider.value = volume;
          valueDisplay.textContent = `${volume}%`;
      }
  }

  executeAction(actionName, params = {}) {
      const action = this.actionHandlers[actionName];
      if (typeof action === 'function') {
          try {
              const result = action(params);
              console.log(`✅ Netflix Helper Pro: ${actionName} executed successfully`, result);
              return result;
          } catch (error) {
              console.error(`❌ Netflix Helper Pro: ${actionName} failed:`, error);
              this.showNotification(`Error: ${error.message}`, 'error');
          }
      }
  }

  showNotification(message, type = 'info') {
      const container = document.getElementById('nhp-notifications');
      if (!container) return;

      const notification = document.createElement('div');
      notification.className = `nhp-notification nhp-${type}`;
      notification.innerHTML = `
          <div class="nhp-notification-content">
              <span>${message}</span>
              <button class="nhp-notification-close">
                  <i class="fas fa-times"></i>
              </button>
          </div>
      `;

      container.appendChild(notification);

      // Auto-remove after 3 seconds
      setTimeout(() => {
          notification.classList.add('nhp-fadeout');
          setTimeout(() => notification.remove(), 300);
      }, 3000);

      // Manual close
      notification.querySelector('.nhp-notification-close').addEventListener('click', () => {
          notification.classList.add('nhp-fadeout');
          setTimeout(() => notification.remove(), 300);
      });
  }

  applyVideoEnhancements() {
      const video = this.findVideoPlayer();
      if (!video) return;

      // Apply subtle visual enhancements
      video.style.filter = 'contrast(1.05) saturate(1.1) brightness(1.02)';
      video.style.transition = 'filter 0.3s ease';
  }

  injectAdvancedStyles() {
      const styles = document.createElement('style');
      styles.textContent = `
          /* Netflix Helper Pro - Advanced Styles */
          .nhp-floating-container {
              position: fixed;
              bottom: 30px;
              right: 30px;
              z-index: 2147483647;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              display: flex;
              flex-direction: column;
              gap: 12px;
              align-items: flex-end;
          }

          .nhp-fab {
              width: 64px;
              height: 64px;
              background: linear-gradient(135deg, #E50914 0%, #B20710 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              box-shadow: 
                  0 8px 25px rgba(229, 9, 20, 0.4),
                  0 4px 12px rgba(0, 0, 0, 0.3);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              overflow: hidden;
          }

          .nhp-telegram-fab {
              background: linear-gradient(135deg, #0088CC 0%, #006699 100%);
              box-shadow: 
                  0 8px 25px rgba(0, 136, 204, 0.4),
                  0 4px 12px rgba(0, 0, 0, 0.3);
          }

          .nhp-telegram-fab:hover {
              transform: scale(1.1) translateY(-2px);
              box-shadow: 
                  0 12px 35px rgba(0, 136, 204, 0.5),
                  0 6px 18px rgba(0, 0, 0, 0.4);
          }

          .nhp-fab:hover {
              transform: scale(1.1) translateY(-2px);
              box-shadow: 
                  0 12px 35px rgba(229, 9, 20, 0.5),
                  0 6px 18px rgba(0, 0, 0, 0.4);
          }

          .nhp-fab-icon-img {
              width: 40px;
              height: 40px;
              z-index: 2;
              position: relative;
          }

          .nhp-fab-icon {
              font-size: 28px;
              color: white;
              z-index: 2;
              position: relative;
          }

          .nhp-fab-ripple {
              position: absolute;
              top: 50%;
              left: 50%;
              width: 0;
              height: 0;
              background: rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              transform: translate(-50%, -50%);
              animation: nhp-pulse 2s infinite;
          }

          @keyframes nhp-pulse {
              0% {
                  width: 0;
                  height: 0;
                  opacity: 1;
              }
              100% {
                  width: 100px;
                  height: 100px;
                  opacity: 0;
              }
          }

          .nhp-controls-panel {
              position: absolute;
              bottom: 80px;
              right: 0;
              width: 320px;
              background: rgba(20, 20, 20, 0.95);
              backdrop-filter: blur(20px) saturate(180%);
              -webkit-backdrop-filter: blur(20px) saturate(180%);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 16px;
              padding: 0;
              transform-origin: bottom right;
              transform: translateY(20px) scale(0.9);
              opacity: 0;
              visibility: hidden;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: 
                  0 20px 40px rgba(0, 0, 0, 0.5),
                  0 8px 16px rgba(0, 0, 0, 0.3);
              overflow: hidden;
          }

          .nhp-controls-panel.nhp-visible {
              transform: translateY(0) scale(1);
              opacity: 1;
              visibility: visible;
          }

          .nhp-panel-header {
              background: linear-gradient(135deg, rgba(229, 9, 20, 0.9), rgba(178, 7, 16, 0.8));
              padding: 16px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .nhp-panel-header h3 {
              margin: 0;
              font-size: 16px;
              font-weight: 600;
              color: white;
          }

          .nhp-close-btn {
              background: rgba(255, 255, 255, 0.1);
              border: none;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              cursor: pointer;
              transition: background 0.2s ease;
          }

          .nhp-close-btn:hover {
              background: rgba(255, 255, 255, 0.2);
          }

          .nhp-controls-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              padding: 20px;
              padding-bottom: 16px;
          }

          .nhp-control-btn {
              background: rgba(255, 255, 255, 0.08);
              border: 1px solid rgba(255, 255, 255, 0.12);
              border-radius: 12px;
              padding: 16px 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
              cursor: pointer;
              transition: all 0.2s ease;
              color: white;
              position: relative;
              overflow: hidden;
          }

          .nhp-control-btn::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
              transition: left 0.6s ease;
          }

          .nhp-control-btn:hover::before {
              left: 100%;
          }

          .nhp-control-btn:hover {
              background: rgba(255, 255, 255, 0.15);
              border-color: rgba(255, 255, 255, 0.25);
              transform: translateY(-2px);
          }

          .nhp-control-btn.nhp-primary {
              background: linear-gradient(135deg, rgba(229, 9, 20, 0.3), rgba(178, 7, 16, 0.2));
              border-color: rgba(229, 9, 20, 0.5);
          }

          .nhp-control-btn.nhp-danger {
              background: linear-gradient(135deg, rgba(220, 38, 127, 0.3), rgba(159, 18, 57, 0.2));
              border-color: rgba(220, 38, 127, 0.5);
          }

          .nhp-control-btn i {
              font-size: 18px;
              position: relative;
              z-index: 2;
          }

          .nhp-control-btn span {
              font-size: 11px;
              font-weight: 500;
              position: relative;
              z-index: 2;
          }

          .nhp-volume-section {
              padding: 0 20px 16px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .nhp-volume-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;
              color: white;
              font-size: 14px;
              font-weight: 500;
          }

          .nhp-volume-value {
              margin-left: auto;
              color: #E50914;
              font-weight: 600;
          }

          .nhp-volume-slider-container {
              position: relative;
          }

          .nhp-volume-slider {
              width: 100%;
              height: 6px;
              -webkit-appearance: none;
              background: linear-gradient(90deg, #333, #555);
              border-radius: 3px;
              outline: none;
              cursor: pointer;
          }

          .nhp-volume-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 18px;
              height: 18px;
              background: linear-gradient(135deg, #E50914, #FF1E2D);
              border-radius: 50%;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px rgba(229, 9, 20, 0.4);
          }

          .nhp-volume-slider:hover::-webkit-slider-thumb {
              transform: scale(1.2);
              box-shadow: 0 4px 12px rgba(229, 9, 20, 0.6);
          }

          .nhp-status-indicators {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1px;
              background: rgba(255, 255, 255, 0.05);
          }

          .nhp-status-item {
              padding: 12px 16px;
              background: rgba(255, 255, 255, 0.03);
              display: flex;
              align-items: center;
              gap: 8px;
              color: rgba(255, 255, 255, 0.8);
              font-size: 12px;
              font-weight: 500;
          }

          .nhp-status-item i {
              font-size: 14px;
              color: #E50914;
          }

          .nhp-notification-container {
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 2147483648;
              pointer-events: none;
          }

          .nhp-notification {
              background: rgba(20, 20, 20, 0.95);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              margin-bottom: 8px;
              padding: 0;
              transform: translateX(100%);
              animation: nhp-slide-in 0.3s ease forwards;
              pointer-events: auto;
              min-width: 200px;
              max-width: 300px;
          }

          .nhp-notification.nhp-success {
              border-left: 4px solid #00D563;
          }

          .nhp-notification.nhp-error {
              border-left: 4px solid #FF4444;
          }

          .nhp-notification.nhp-info {
              border-left: 4px solid #E50914;
          }

          .nhp-notification-content {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px 16px;
              color: white;
              font-size: 14px;
          }

          .nhp-notification-close {
              background: none;
              border: none;
              color: rgba(255, 255, 255, 0.6);
              cursor: pointer;
              padding: 4px;
              margin-left: 12px;
              border-radius: 50%;
              transition: all 0.2s ease;
          }

          .nhp-notification-close:hover {
              background: rgba(255, 255, 255, 0.1);
              color: white;
          }

          .nhp-notification.nhp-fadeout {
              animation: nhp-slide-out 0.3s ease forwards;
          }

          @keyframes nhp-slide-in {
              from {
                  transform: translateX(100%);
                  opacity: 0;
              }
              to {
                  transform: translateX(0);
                  opacity: 1;
              }
          }

          @keyframes nhp-slide-out {
              from {
                  transform: translateX(0);
                  opacity: 1;
              }
              to {
                  transform: translateX(100%);
                  opacity: 0;
              }
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
              .nhp-controls-panel {
                  width: 280px;
                  right: -10px;
              }
              
              .nhp-floating-container {
                  bottom: 20px;
                  right: 20px;
                  gap: 8px;
              }
              
              .nhp-fab {
                  width: 56px;
                  height: 56px;
              }
              
              .nhp-fab-icon-img {
                  width: 32px;
                  height: 32px;
              }
              
              .nhp-fab-icon {
                  font-size: 24px;
              }
          }
      `;
      
      document.head.appendChild(styles);
  }

  loadDependencies() {
      // Load Font Awesome for the icons
      if (!document.querySelector('link[href*="font-awesome"]')) {
          const fontAwesomeLink = document.createElement('link');
          fontAwesomeLink.rel = 'stylesheet';
          fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
          document.head.appendChild(fontAwesomeLink);
      }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new NetflixHelperPro());
} else {
  new NetflixHelperPro();
}