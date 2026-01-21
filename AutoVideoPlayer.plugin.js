/**
 * @name AutoVideoPlayer
 * @author AlexRasterhoff
 * @description Automatically plays videos when they enter the viewport and pauses them when they leave.
 * @version 2.1.1
 */

module.exports = class AutoplayVideoFiles {
    constructor() {
        // DOM observer voor nieuwe video's
        this.observer = null;
        // Viewport zichtbaarheid tracker
        this.intersectionObserver = null;
        // Backup check interval
        this.checkInterval = null;
        // Standaard instellingen
        this.defaultSettings = {
            enableAutoplay: true,
            respectManualPause: true,
            replayFinishedVideos: true,
            autoReplayOnEnd: false,
            viewportThreshold: 50,
            muteVideos: false
        };
        // Laad opgeslagen instellingen
        this.settings = Object.assign({}, this.defaultSettings, BdApi.Data.load("AutoplayVideoFiles", "settings"));
        // Handmatig gepauzeerde video's
        this.manuallyPausedVideos = new WeakSet();
        // Afgelopen video's
        this.finishedVideos = new WeakSet();
    }

    // Plugin start
    start() {
        this.setupIntersectionObserver();
        this.observeNewVideos();
        this.processExistingVideos();
        this.startPlayingVideoCheck();
    }

    // Plugin stop/cleanup
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // IntersectionObserver setup
    setupIntersectionObserver() {
        const threshold = this.settings.viewportThreshold / 100;

        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        console.log('[AutoplayVideoFiles] Video in viewport:', video);
                        this.clickPlayPauseButton(video, true);
                    } else {
                        console.log('[AutoplayVideoFiles] Video uit viewport:', video);
                        this.clickPlayPauseButton(video, false);
                    }
                });
            },
            { threshold: threshold }
        );
    }

    // Klik Discord play/pause knop
    clickPlayPauseButton(video, shouldPlay) {
        if (shouldPlay && !this.settings.enableAutoplay) {
            console.log('[AutoplayVideoFiles] Autoplay uit, skip');
            return;
        }

        const wrapper = video.closest('[class*="wrapper"]');

        if (!wrapper) {
            console.log('[AutoplayVideoFiles] Geen wrapper, fallback');
            if (shouldPlay) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
            return;
        }

        if (shouldPlay) {
            // Skip multi-attachment
            const mediaContainer = video.closest('[class*="visualMediaItemContainer"]');
            if (mediaContainer) {
                const gridContainer = mediaContainer.firstElementChild;
                if (gridContainer && gridContainer.className) {
                    const isSingleItem = /ByOneGridSingle|ByTwoGridSingle|ByThreeGridSingle/.test(gridContainer.className);
                    const isMosaic = /GridMosaic/.test(gridContainer.className);
                    if (isMosaic || !isSingleItem) {
                        console.log('[AutoplayVideoFiles] Multi-attachment, skip');
                        return;
                    }
                }
            }

            const playCover = wrapper.querySelector('[class*="cover"][aria-label="Play"]');
            const playButton = wrapper.querySelector('[class*="videoButton"][aria-label="Play"]');
            const replayButton = wrapper.querySelector('[class*="videoButton"][aria-label="Play again"]');

            // Respecteer handmatige pauze
            if (this.settings.respectManualPause && this.manuallyPausedVideos.has(video)) {
                console.log('[AutoplayVideoFiles] Handmatig gepauzeerd, skip');
                return;
            }

            // Check replay setting
            if (!this.settings.replayFinishedVideos && this.finishedVideos.has(video)) {
                console.log('[AutoplayVideoFiles] Replay uit, skip');
                return;
            }

            video.muted = this.settings.muteVideos;

            if (playCover) {
                console.log('[AutoplayVideoFiles] Klik play cover');
                playCover.click();
                this.finishedVideos.delete(video);
            } else if (replayButton) {
                console.log('[AutoplayVideoFiles] Klik replay');
                replayButton.click();
                this.finishedVideos.delete(video);
            } else if (playButton) {
                console.log('[AutoplayVideoFiles] Klik play');
                playButton.click();
            } else {
                console.log('[AutoplayVideoFiles] Fallback play()');
                video.play().catch(() => {});
            }
        } else {
            const pauseButton = wrapper.querySelector('[class*="videoButton"][aria-label="Pause"]');
            if (pauseButton) {
                console.log('[AutoplayVideoFiles] Klik pause');
                pauseButton.click();
            } else {
                console.log('[AutoplayVideoFiles] Fallback pause()');
                video.pause();
            }
        }
    }

    // Observeer nieuwe video's
    observeNewVideos() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const videos = node.querySelectorAll?.("video") || [];
                        videos.forEach((video) => {
                            if (this.isMessageVideo(video)) {
                                this.observeVideo(video);
                            }
                        });
                        if (node.tagName === "VIDEO" && this.isMessageVideo(node)) {
                            this.observeVideo(node);
                        }
                    }
                });
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Verwerk bestaande video's
    processExistingVideos() {
        document.querySelectorAll("video").forEach((video) => {
            if (this.isMessageVideo(video)) {
                this.observeVideo(video);
            }
        });
    }

    // Check of video in bericht zit
    isMessageVideo(video) {
        const wrapper = video.closest('[class*="wrapper"]');
        if (!wrapper) return false;

        const mediaContainer = video.closest('[class*="visualMediaItemContainer"]') ||
                              video.closest('[class*="imageWrapper"]') ||
                              video.closest('[class*="mosaicItem"]');
        if (!mediaContainer) return false;

        const accessoriesContainer = video.closest('[class*="container"]');
        if (!accessoriesContainer) return false;

        return true;
    }

    // Start video observatie
    observeVideo(video) {
        this.intersectionObserver.observe(video);

        // Klik overlay (exclusief controls)
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = 'calc(100% - 64px)';
        overlay.style.zIndex = '1';
        overlay.style.cursor = 'pointer';
        overlay.style.backgroundColor = 'transparent';
        overlay.style.pointerEvents = 'auto';

        const wrapper = video.closest('[class*="wrapper"]');
        if (wrapper) {
            if (getComputedStyle(wrapper).position === 'static') {
                wrapper.style.position = 'relative';
            }
            wrapper.appendChild(overlay);

            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const clickedElement = e.target;
                const isControl = clickedElement.closest('[class*="videoButton"]') ||
                                 clickedElement.closest('[class*="slider"]') ||
                                 clickedElement.closest('[class*="volumeButton"]') ||
                                 clickedElement.closest('button') ||
                                 clickedElement.closest('input');

                if (isControl) {
                    console.log('[AutoplayVideoFiles] Control klik, doorlaten');
                    return;
                }

                console.log('[AutoplayVideoFiles] Toggle play/pause');

                const pauseButton = wrapper.querySelector('[class*="videoButton"][aria-label="Pause"]');
                const playButton = wrapper.querySelector('[class*="videoButton"][aria-label="Play"]');
                const playCover = wrapper.querySelector('[class*="cover"][aria-label="Play"]');

                if (video.paused) {
                    console.log('[AutoplayVideoFiles] Play');
                    this.manuallyPausedVideos.delete(video);

                    if (playButton) {
                        playButton.click();
                    } else if (playCover && playCover.style.display !== 'none') {
                        playCover.click();
                    } else {
                        if (playCover) playCover.style.display = 'none';
                        video.play().catch(() => {});
                    }
                } else {
                    console.log('[AutoplayVideoFiles] Pause');
                    this.manuallyPausedVideos.add(video);

                    if (pauseButton) {
                        pauseButton.click();
                    } else {
                        video.pause();
                    }
                }
            });
        }

        video.addEventListener('pause', () => {
            console.log('[AutoplayVideoFiles] Pause event:', video);
        });

        video.addEventListener('play', () => {
            console.log('[AutoplayVideoFiles] Play event:', video);
        });

        video.addEventListener('ended', () => {
            console.log('[AutoplayVideoFiles] Video ended:', video);
            this.finishedVideos.add(video);

            if (this.settings.autoReplayOnEnd && this.isVideoInViewport(video)) {
                console.log('[AutoplayVideoFiles] Auto-replay');
                const wrapper = video.closest('[class*="wrapper"]');
                if (wrapper) {
                    setTimeout(() => {
                        const replayButton = wrapper.querySelector('[class*="videoButton"][aria-label="Play again"]');
                        if (replayButton) {
                            replayButton.click();
                            this.finishedVideos.delete(video);
                        } else {
                            video.play().catch(() => {});
                        }
                    }, 100);
                }
            }
        });
    }

    // Check viewport positie
    isVideoInViewport(video) {
        const rect = video.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        const verticalInView = rect.top < windowHeight && rect.bottom > 0;
        const horizontalInView = rect.left < windowWidth && rect.right > 0;

        return verticalInView && horizontalInView;
    }

    // Periodieke check video's buiten viewport
    startPlayingVideoCheck() {
        this.checkInterval = setInterval(() => {
            document.querySelectorAll("video").forEach((video) => {
                if (!this.isMessageVideo(video)) return;

                if (!video.paused && !video.ended) {
                    if (!this.isVideoInViewport(video)) {
                        this.clickPlayPauseButton(video, false);
                    }
                }
            });
        }, 500);
    }

    // Settings panel
    getSettingsPanel() {
        return BdApi.UI.buildSettingsPanel({
            settings: [
                {
                    type: "category",
                    id: "playback",
                    name: "Playback Settings",
                    collapsible: true,
                    shown: true,
                    settings: [
                        {
                            id: "enableAutoplay",
                            name: "Enable Autoplay",
                            note: "Automatically play videos when they enter the viewport",
                            type: "switch",
                            value: this.settings.enableAutoplay
                        },
                        {
                            id: "muteVideos",
                            name: "Mute Videos",
                            note: "Mute videos when autoplaying them",
                            type: "switch",
                            value: this.settings.muteVideos
                        },
                        {
                            id: "viewportThreshold",
                            name: "Viewport Threshold",
                            note: "Percentage of video that must be visible before autoplay triggers (1-100%)",
                            type: "slider",
                            value: this.settings.viewportThreshold,
                            min: 1,
                            max: 100,
                            markers: [1, 25, 50, 75, 100],
                            stickToMarkers: false
                        }
                    ]
                },
                {
                    type: "category",
                    id: "behavior",
                    name: "Behavior Settings",
                    collapsible: true,
                    shown: true,
                    settings: [
                        {
                            id: "respectManualPause",
                            name: "Respect Manual Pause",
                            note: "Don't autoplay videos you've manually paused when they scroll back into view",
                            type: "switch",
                            value: this.settings.respectManualPause
                        },
                        {
                            id: "replayFinishedVideos",
                            name: "Replay Finished Videos",
                            note: "Automatically replay videos that have finished when they scroll back into view",
                            type: "switch",
                            value: this.settings.replayFinishedVideos
                        },
                        {
                            id: "autoReplayOnEnd",
                            name: "Auto-Replay on End",
                            note: "Automatically replay videos immediately when they finish (continuous loop)",
                            type: "switch",
                            value: this.settings.autoReplayOnEnd
                        }
                    ]
                }
            ],
            onChange: (_category, id, value) => {
                this.settings[id] = value;
                BdApi.Data.save("AutoplayVideoFiles", "settings", this.settings);

                if (id === "viewportThreshold") {
                    console.log('[AutoplayVideoFiles] Threshold changed, restart');
                    this.stop();
                    this.start();
                }
            }
        });
    }
};
