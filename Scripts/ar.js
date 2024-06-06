window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get('location');
    if (!locationId) {
        console.error('No location specified in URL');
        return;
    }

    fetch('./Scripts/mediaConfig.json')
        .then(response => response.json())
        .then(data => {
            if (!data[locationId]) {
                console.error('Invalid location specified');
                return;
            }
            initializeAR(data[locationId].media);
        })
        .catch(error => console.error('Error loading media config:', error));

    // Overlay functionality
    const overlay = document.getElementById('overlay');
    const startButton = document.getElementById('start-experience');
    startButton.addEventListener('click', () => {
        overlay.style.display = 'none';
    });
};

function initializeAR(mediaArray) {
    let modelIndex = 0;
    let videoEntity = null;
    let sliderTimeout = null;
    const button = document.querySelector('button[data-action="change"]');
    const slider = document.getElementById("slider");
    const buttonText = document.createElement('div');
    buttonText.className = 'button-text';
    document.body.appendChild(buttonText);

    button.className = 'action-button'; // Apply the class for the button styles
    button.style.display = 'none'; // Initially hide the button

    const isIPhone = /iphone|ipod/i.test(navigator.userAgent.toLowerCase());

    function setMediaSource() {
        const lookImage = document.getElementById('look_1');
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('iphone')) {
            lookImage.setAttribute('src', './assets/lookImage.png');
            lookImage.setAttribute('material', 'transparent: true; alphaTest: 0.5;');
        } else {
            lookImage.setAttribute('src', './assets/lookImage.png');
        }
    }

    function changeMedia() {
        modelIndex = (modelIndex + 1) % mediaArray.length;
        displayMedia(modelIndex);
    }

    function displayMedia(index) {
        let scene = document.querySelector('a-scene');
        let mediaItem = mediaArray[index];
        let lookImage = document.getElementById('look_1');

        // Remove existing media (image or video) if it's not the video we're toggling visibility
        let existingMedia = scene.querySelector('a-image:not(#look_1), a-video:not([visible=false])');
        if (existingMedia) {
            scene.removeChild(existingMedia);
        }

        // Use the fixedAngleDegrees from the configuration
        const fixedAngleDegrees = mediaItem.fixedAngleDegrees;
        const radians = fixedAngleDegrees * (Math.PI / 180);
        const x = -25 * Math.sin(radians);
        const z = -25 * Math.cos(radians);
        const rotationY = fixedAngleDegrees;

        if (videoEntity) {
            videoEntity.setAttribute('visible', 'false');
            videoEntity = null;
        }

        let entity;
        if (mediaItem.type === 'image') {
            // Show the slider
            slider.style.display = 'block';
            buttonText.innerText = "Use the slider to transition";

            // Set up the first image entity
            const blackAndWhiteImage = document.createElement('a-image');
            blackAndWhiteImage.setAttribute('src', mediaItem.url);
            blackAndWhiteImage.setAttribute('position', `${x} 5 ${z}`);
            blackAndWhiteImage.setAttribute('rotation', `0 ${rotationY} 0`);
            blackAndWhiteImage.setAttribute('scale', mediaItem.scale);

            // Set up the second image entity
            const colorImage = document.createElement('a-image');
            colorImage.setAttribute('src', mediaItem.secondImageUrl);
            colorImage.setAttribute('position', `${x} 5 ${z}`);
            colorImage.setAttribute('rotation', `0 ${rotationY} 0`);
            colorImage.setAttribute('scale', mediaItem.scale);

            scene.appendChild(blackAndWhiteImage);
            scene.appendChild(colorImage);
            lookImage.setAttribute('visible', 'true'); // Ensure lookImage is visible

            // Set initial opacity based on the slider value
            const value = slider.value;
            blackAndWhiteImage.setAttribute('opacity', `${1 - value / 100}`);
            colorImage.setAttribute('opacity', `${value / 100}`);

            // Set up slider functionality for fading between images
            slider.addEventListener("input", (event) => {
                const value = event.target.value;
                blackAndWhiteImage.setAttribute('opacity', `${1 - value / 100}`);
                colorImage.setAttribute('opacity', `${value / 100}`);

                // Show the video button only when the slider is at 100%
                if (value === '100') {
                    if (!sliderTimeout) {
                        sliderTimeout = setTimeout(() => {
                            button.style.display = 'block'; // Show the button after 3 seconds
                            buttonText.innerText = isIPhone ? "Tap to play the animation" : "Tap to go back";
                            if (!isIPhone) {
                                changeMedia(); // Automatically change to video on non-iPhone devices
                            }
                            sliderTimeout = null;
                        }, 3000);
                    }
                } else {
                    button.style.display = 'none';
                    buttonText.innerText = "Use the slider to transition";
                    if (sliderTimeout) {
                        clearTimeout(sliderTimeout);
                        sliderTimeout = null;
                    }
                }
            });

            // Check the slider value on load to determine button visibility
            if (slider.value === '100') {
                if (!sliderTimeout) {
                    sliderTimeout = setTimeout(() => {
                        button.style.display = 'block'; // Show the button after 0.1 seconds
                        buttonText.innerText = isIPhone ? "Tap to play the animation" : "Tap to go back";
                        if (!isIPhone) {
                            changeMedia(); // Automatically change to video on non-iPhone devices
                        }
                        sliderTimeout = null;
                    }, 100);
                }
            } else {
                button.style.display = 'none';
                buttonText.innerText = "Use the slider to transition";
            }
        } else if (mediaItem.type === 'video') {
            // Hide the slider when showing the video
            slider.style.display = 'none';
            buttonText.innerText = "Tap to go back";

            if (videoEntity) {
                videoEntity.setAttribute('visible', 'true');
            } else {
                // Set up the video entity
                entity = document.createElement('a-video');
                entity.setAttribute('src', mediaItem.url);
                entity.setAttribute('autoplay', 'true');
                entity.setAttribute('loop', 'true');
                entity.setAttribute('playsinline', 'true');
                entity.setAttribute('position', `${x} 5 ${z}`);
                entity.setAttribute('rotation', `0 ${rotationY} 0`);
                entity.setAttribute('scale', mediaItem.scale);
                entity.setAttribute('preload', 'true');
                scene.appendChild(entity);
                videoEntity = entity;
            }
            lookImage.setAttribute('visible', 'false'); // Hide lookImage when video is playing
        }

        const div = document.querySelector('.instructions');
        div.innerText = mediaItem.info;

        // Set opposite position for the look-around cue
        const oppositeAngleDegrees = (fixedAngleDegrees + 180) % 360;
        const oppositeRadians = oppositeAngleDegrees * (Math.PI / 180);
        const oppositeX = -25 * Math.sin(oppositeRadians);
        const oppositeZ = -25 * Math.cos(oppositeRadians);

        lookImage.setAttribute('position', `${oppositeX} 5 ${oppositeZ}`);
        lookImage.setAttribute('rotation', `0 ${oppositeAngleDegrees} 0`);
        lookImage.setAttribute('visible', 'true');
    }

    setMediaSource();
    button.addEventListener('click', () => {
        if (slider.value === '100') {
            changeMedia(); // Change to video on all devices
        } else {
            modelIndex = (modelIndex - 1 + mediaArray.length) % mediaArray.length; // Go back to images
            displayMedia(modelIndex);
        }
    });

    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        displayMedia(modelIndex); // Initial media display
    } else {
        scene.addEventListener('loaded', function () {
            displayMedia(modelIndex); // Initial media display
        });
    }
}
