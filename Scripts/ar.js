// v.31 Adjusted audio handling to play/pause and manage mute state directly within the changeMedia function, ensuring compatibility with iOS and Android.
// v.32 Updated media handling and location change process to ensure correct media is displayed for each location and persistent positioning.
// v.33 Updated to implement smooth image-to-video transition with initial delay for video visibility and playback. Also fixed the issue with next location media elements being loaded correctly.
// v.34 Updated to include fixed angles, addition of setup elements, and updating mediaConfig.json with common values for each location.
// - Added common values (scale, rotation, fixedAngleDegrees, initialY, initialZ) to each location in mediaConfig.json to avoid redundancy.
// - Implemented setup mode elements to display current fixed angle, Y position, and Z depth for easier adjustments- "&setup=true"
// - Ensured persistence of media position and orientation when switching between media types and locations.

// Global variable definitions
let modelIndex = 0;
let videoEntity = null;
let frameEntity = null;
let lookImages = [];
let mediaEntity = null;
let fixedAngleDegrees = 0;
let currentZoom = 25; // Initial distance from the user
let currentY = 0; // Initial Y position
let initialMediaState = {
    position: null,
    rotation: null
};
let hasPopupShown = false; // congrats popup
let hasPopupClosed = false;
let currentLocationIndex = 0;
let locations = []; // This will be filled with the keys from mediaConfig.json
let mediaArray = []; // Current media array for the location

const minZoom = 10; // Minimum distance from the user
const maxZoom = 50; // Maximum distance from the user
const minY = -5; // Set minimum Y value
const maxY = 10; // Set maximum Y value
const zoomSpeed = 0.01; // Adjust the zoom speed as needed
const dragSpeedX = 0.07; // Adjust the drag speed for the x-axis
const dragSpeedY = 0.005; // Adjust the drag speed for the y-axis

// Pinch-to-zoom variables
let initialPinchDistance = null;
let isPinching = false; // Flag to indicate if a pinch-to-zoom gesture is in progress

// Drag functionality variables
let isDragging = false;
let initialTouchX = null;
let initialTouchY = null;
let initialFixedAngle = 0;
let dragAxis = null; // 'x' for rotation, 'y' for vertical movement

let currentAudio = null; // Keep track of the current playing audio
let isChangingMedia = false; // Flag to prevent repeated calls
let isFirstLoad = true; // Global flag to check if it's the first load

let currentFixedAngleDisplay;
let currentYPositionDisplay;
let currentZDepthDisplay;

function addToHomeScreen() {
    console.log("Add to home screen functionality is not yet implemented.");
}

function saveAngle(location, angle) {
    const savedAngles = JSON.parse(localStorage.getItem('savedAngles')) || {};
    savedAngles[location] = angle;
    localStorage.setItem('savedAngles', JSON.stringify(savedAngles));
}

function refreshMediaPosition() {
    if (mediaEntity) {
        const mediaItem = mediaArray[modelIndex];
        const fixedAngleDegrees = mediaItem.fixedAngleDegrees || 0;

        const radians = (fixedAngleDegrees * Math.PI) / 180;
        currentZoom = 25;  // Reset zoom
        currentY = 0;      // Reset Y position

        const position = {
            x: -currentZoom * Math.sin(radians),
            y: currentY,
            z: -currentZoom * Math.cos(radians)
        };
        const rotation = { x: 0, y: fixedAngleDegrees, z: 0 };

        initialMediaState.position = { ...position };
        initialMediaState.rotation = { ...rotation };

        mediaEntity.setAttribute("position", position);
        mediaEntity.setAttribute("rotation", rotation);

        if (frameEntity) {
            frameEntity.setAttribute("position", position);
            frameEntity.setAttribute("rotation", rotation);
        }

        console.log(`Media position reset to initial values: x: ${position.x}, y: ${position.y}, z: ${position.z}`);
        console.log(`Rotation reset to initial values: x: ${rotation.x}, y: ${rotation.y}, z: ${rotation.z}`);

        removeAllMedia();
        loadLocationMedia();

        updateCurrentValues();
    }
}


function updateLookImages() {
    lookImages.forEach((lookImage, index) => {
        const angle = (index + 1) * 90;
        const lookRadians = ((fixedAngleDegrees + angle) * Math.PI) / 180;
        const lookX = -currentZoom * Math.sin(lookRadians);
        const lookZ = -currentZoom * Math.cos(lookRadians);

        lookImage.setAttribute("position", { x: lookX, y: 0, z: lookZ });
        lookImage.setAttribute("rotation", { x: 0, y: angle + fixedAngleDegrees, z: 0 });
    });
}


function toggleMuteButton(isMuted) {
    const buttonText = isMuted ? "Unmute" : "Mute";
    const buttonIcon = isMuted ? "./assets/images/UI/unmute-icon.svg" : "./assets/images/UI/mute-icon.svg";
    const muteButton = document.getElementById("mute");

    muteButton.innerHTML = `<img src="${buttonIcon}" alt="${buttonText} button" class="button-icon"> ${buttonText}`;
}

// Congrats page pop up
function showCongratulationsPopup() {
    if (!hasPopupShown && !hasPopupClosed) {
        const popup = document.getElementById('congratulations-overlay');
        popup.style.display = 'flex';
        hasPopupShown = true;
    }
}

function closeCongratsPopup() {
    const popup = document.getElementById('congratulations-overlay');
    popup.style.display = 'none';
    hasPopupClosed = true;
}

function loadNextLocation() {
    modelIndex = 0;
    currentLocationIndex = (currentLocationIndex + 1) % locations.length;
    loadLocationMedia();
}

function loadPreviousLocation() {
    modelIndex = 0;
    currentLocationIndex = (currentLocationIndex - 1 + locations.length) % locations.length;
    loadLocationMedia();
}

function loadLocationMedia() {
    fetch("./Scripts/mediaConfig.json")
        .then((response) => response.json())
        .then((data) => {
            hasPopupShown = false;
            const locationData = data[locations[currentLocationIndex]];
            const commonValues = locationData.common;
            mediaArray = locationData.media;
            console.log(`Loading media for location index ${currentLocationIndex}:`, mediaArray);

            modelIndex = 0;
            fixedAngleDegrees = commonValues.fixedAngleDegrees || 0;
            const radians = (fixedAngleDegrees * Math.PI) / 180;
            initialMediaState.position = { x: -currentZoom * Math.sin(radians), y: commonValues.initialY, z: commonValues.initialZ };
            initialMediaState.rotation = { x: 0, y: fixedAngleDegrees, z: 0 };

            initializeMedia(mediaArray, commonValues);
        })
        .catch((error) => console.error("Error loading media config:", error));
}

function navigateToLocation(locationId) {
    currentLocationIndex = locations.indexOf(locationId);
    if (currentLocationIndex === -1) {
        console.error("Invalid location specified");
        return;
    }
    loadLocationMedia();
}

function initializeAR() {
    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get("location");

    if (!locationId) {
        console.error("No location specified in URL");
        return;
    }

    fetch("./Scripts/mediaConfig.json")
        .then((response) => response.json())
        .then((data) => {
            locations = Object.keys(data);
            currentLocationIndex = locations.indexOf(locationId);

            if (!data[locationId]) {
                console.error("Invalid location specified");
                return;
            }

            const locationData = data[locationId];
            const commonValues = locationData.common;
            mediaArray = locationData.media;

            fixedAngleDegrees = commonValues.fixedAngleDegrees || 0;
            currentY = commonValues.initialY || 0;
            currentZoom = Math.abs(commonValues.initialZ) || 25;

            const radians = (fixedAngleDegrees * Math.PI) / 180;
            initialMediaState.position = {
                x: -currentZoom * Math.sin(radians),
                y: currentY,
                z: -currentZoom * Math.cos(radians)
            };
            initialMediaState.rotation = { x: 0, y: fixedAngleDegrees, z: 0 };

            initializeMedia(mediaArray, commonValues);
        })
        .catch((error) => console.error("Error loading media config:", error));
}


function updateFixedAngleDegrees(newAngle) {
    fixedAngleDegrees = newAngle;
    saveAngle(locations[currentLocationIndex], newAngle);

    const radians = (fixedAngleDegrees * Math.PI) / 180;
    const x = -currentZoom * Math.sin(radians);
    const z = -currentZoom * Math.cos(radians);

    if (mediaEntity) {
        mediaEntity.setAttribute('position', { x, y: currentY, z });
        mediaEntity.setAttribute('rotation', `0 ${fixedAngleDegrees} 0`);
    }

    if (frameEntity) {
        frameEntity.setAttribute('position', { x, y: currentY, z });
        frameEntity.setAttribute('rotation', `0 ${fixedAngleDegrees} 0`);
    }

    updateLookImages();
    updateCurrentValues();
}

document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const isSetupMode = urlParams.get("setup") === "true";
    const fixedAngleInput = document.getElementById('fixed-angle');
    const updateAngleButton = document.getElementById('update-angle');
    const controlsDiv = document.getElementById('controls');

    currentFixedAngleDisplay = document.getElementById('current-fixed-angle');
    currentYPositionDisplay = document.getElementById('current-y-position');
    currentZDepthDisplay = document.getElementById('current-z-depth');

    if (isSetupMode) {
        controlsDiv.style.display = 'block';
    }

    updateAngleButton.addEventListener('click', () => {
        const newAngle = parseInt(fixedAngleInput.value, 10);
        if (!isNaN(newAngle)) {
            updateFixedAngleDegrees(newAngle);
        }
    });

    const arScene = document.getElementById('ar-scene');
    initializeAR();

    const closePopupButton = document.getElementById('close-congrats-overlay');
    if (closePopupButton) {
        closePopupButton.addEventListener('click', closeCongratsPopup);
    }

    const viewMapButton = document.getElementById("view-map");
    const helpButton = document.getElementById("help");
    const refreshButton = document.getElementById("refresh");

    if (viewMapButton) {
        viewMapButton.addEventListener("click", () => {
            console.log("View Map button clicked");
        });
    }

    if (helpButton) {
        helpButton.addEventListener("click", () => {
            const helpOverlay = document.getElementById("help-overlay");
            if (helpOverlay) {
                helpOverlay.style.display = "flex";
            }
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            refreshMediaPosition();
        });
    }

    const mapOverlay = document.getElementById('map-overlay');
    const closeMapOverlayButton = document.getElementById('close-map-overlay');

    if (viewMapButton && closeMapOverlayButton) {
        viewMapButton.addEventListener('click', () => {
            if (mapOverlay) {
                mapOverlay.style.display = 'flex';
            }
        });

        closeMapOverlayButton.addEventListener('click', () => {
            if (mapOverlay) {
                mapOverlay.style.display = 'none';
            }
        });
    }

    const closeHelpOverlayButton = document.getElementById("close-help-overlay");

    if (helpButton && closeHelpOverlayButton) {
        helpButton.addEventListener("click", () => {
            const helpOverlay = document.getElementById("help-overlay");
            if (helpOverlay) {
                helpOverlay.style.display = "flex";
            }
        });

        closeHelpOverlayButton.addEventListener("click", () => {
            const helpOverlay = document.getElementById("help-overlay");
            if (helpOverlay) {
                helpOverlay.style.display = "none";
            }
        });
    }

    const continueButton = document.getElementById('continue-button');
    const backButton = document.getElementById('back-button');

    if (continueButton) {
        continueButton.addEventListener('click', () => {
            loadNextLocation();
            document.getElementById('congratulations-overlay').style.display = 'none';
        });
    }

    if (backButton) {
        backButton.addEventListener('click', () => {
            loadPreviousLocation();
            document.getElementById('congratulations-overlay').style.display = 'none';
        });
    }

    document
        .querySelectorAll(".button-text, h1-1, h1-2, h2, p, button")
        .forEach((el) => el.classList.add("unselectable"));
});

function removeAllMedia() {
    console.log("removeAllMedia called");
    let scene = document.querySelector("a-scene");

    let mediaElements = scene.querySelectorAll('a-image, a-video, a-audio');
    mediaElements.forEach(element => {
        if (element.tagName === 'A-VIDEO') {
            element.pause();
            element.currentTime = 0;
        }
        console.log(`Removing media element: ${element.tagName}, src: ${element.getAttribute('src')}`);
        element.parentNode.removeChild(element);
    });

    if (currentAudio) {
        currentAudio.pause();
        document.body.removeChild(currentAudio);
        currentAudio = null;
    }

    mediaEntity = null;
    videoEntity = null;

    console.log("Media elements removed");
}

function checkOrientation() {
    const orientationOverlay = document.getElementById('orientation-overlay');
    if (window.innerHeight < window.innerWidth) {
        orientationOverlay.style.display = 'flex';
    } else {
        orientationOverlay.style.display = 'none';
    }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
window.addEventListener('DOMContentLoaded', checkOrientation);

function initializeMedia(mediaArray, commonValues) {
    console.log("Initializing media:", mediaArray);
    const button = document.querySelector('button[data-action="change"]');

    // Clear previous button text
    const existingButtonText = document.querySelector('.button-text');
    if (existingButtonText) {
        existingButtonText.remove();
    }

    const buttonText = document.createElement("div");
    buttonText.className = "button-text";
    button.insertAdjacentElement("beforebegin", buttonText);

    // Remove old event listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    // Add new event listener for changing media
    newButton.addEventListener("click", () => {
        changeMedia(mediaArray, commonValues); // Pass the mediaArray to changeMedia function
    });

    displayMedia(mediaArray, modelIndex, commonValues); // Pass mediaArray, modelIndex and commonValues to displayMedia
}


function displayMedia(mediaArray, index, commonValues, currentPosition, currentRotation) {
    console.log("Displaying media from location:", locations[currentLocationIndex], "media index:", index);
    removeAllMedia();

    let scene = document.querySelector("a-scene");
    let mediaItem = mediaArray[index];
    console.log("displayMedia called with media item:", mediaItem);

    // Calculate initial position and rotation based on the provided values or commonValues
    const fixedAngleDegrees = commonValues.fixedAngleDegrees || 0;
    const radians = (fixedAngleDegrees * Math.PI) / 180;
    const position = currentPosition || {
        x: -currentZoom * Math.sin(radians),
        y: commonValues.initialY || 0,
        z: -currentZoom * Math.cos(radians)
    };
    const rotation = currentRotation || { x: 0, y: fixedAngleDegrees, z: 0 };

    console.log(`Initial position calculated: x: ${position.x}, y: ${position.y}, z: ${position.z}`);
    console.log(`Initial rotation calculated: x: ${rotation.x}, y: ${rotation.y}, z: ${rotation.z}`);

    initialMediaState.position = { ...position };
    initialMediaState.rotation = { ...rotation };

    let entity;
    const buttonText = document.querySelector('.button-text');
    let imageEntity;

    if (mediaItem.type === "image") {
        entity = document.createElement("a-image");
        entity.setAttribute("src", mediaItem.url);
        entity.setAttribute("position", position);
        entity.setAttribute("rotation", rotation);
        entity.setAttribute("scale", commonValues.scale);
        entity.setAttribute("visible", "true");

        scene.appendChild(entity);
        entity.flushToDOM();
        imageEntity = entity;

        buttonText.innerText = mediaItem.info;
        createLookImages();
    } else if (mediaItem.type === "video") {
        console.log("Creating video entity");

        imageEntity = document.createElement("a-image");
        const placeholderUrl = mediaArray[0].type === "image" ? mediaArray[0].url : './assets/Smartify-logo.svg';
        imageEntity.setAttribute("src", placeholderUrl); 
        imageEntity.setAttribute("position", position);
        imageEntity.setAttribute("rotation", rotation);
        imageEntity.setAttribute("scale", commonValues.scale);
        imageEntity.setAttribute("visible", "true");
        scene.appendChild(imageEntity);
        imageEntity.flushToDOM();

        entity = document.createElement("a-video");
        entity.setAttribute("src", mediaItem.url);
        entity.setAttribute("autoplay", "false");
        entity.setAttribute("loop", "true");
        entity.setAttribute("playsinline", "true");
        entity.setAttribute("muted", "true");
        entity.setAttribute("position", position);
        entity.setAttribute("rotation", rotation);
        entity.setAttribute("scale", commonValues.scale);
        entity.setAttribute("preload", "auto");
        entity.setAttribute("visible", "false");

        scene.appendChild(entity);
        entity.flushToDOM();
        videoEntity = entity;

        setTimeout(() => {
            console.log('Setting video visibility to true');
            entity.setAttribute("visible", "true");

            setTimeout(() => {
                entity.play().catch((error) => console.error("Error playing video:", error));
            }, 1000);

            fadeOutElement(imageEntity);
        }, 2000);

        buttonText.innerText = mediaItem.info;
        createLookImages();
    }

    if (mediaItem.audioUrl) {
        if (currentAudio) {
            currentAudio.pause();
            document.body.removeChild(currentAudio);
        }
        const audio = document.createElement('audio');
        audio.setAttribute('src', mediaItem.audioUrl);
        audio.setAttribute('id', 'audio-' + index);
        audio.setAttribute('preload', 'auto');
        audio.setAttribute('muted', 'true');
        audio.setAttribute('loop', 'true');
        document.body.appendChild(audio);
        currentAudio = audio;

        if (!isIOS() && !isAndroid()) {
            currentAudio.play();
        }
    }

    mediaEntity = entity;

    mediaEntity.setAttribute("position", position);
    mediaEntity.setAttribute("rotation", rotation);

    const confirmedPosition = mediaEntity.getAttribute("position");
    const confirmedRotation = mediaEntity.getAttribute("rotation");
    console.log(`Confirmed initial position: x: ${confirmedPosition.x}, y: ${confirmedPosition.y}, z: ${confirmedPosition.z}`);
    console.log(`Confirmed initial rotation: x: ${confirmedRotation.x}, y: ${confirmedRotation.y}, z: ${confirmedRotation.z}`);

    setTimeout(() => {
        const doubleCheckPosition = mediaEntity.getAttribute("position");
        const doubleCheckRotation = mediaEntity.getAttribute("rotation");
        console.log(`Double-check position: x: ${doubleCheckPosition.x}, y: ${doubleCheckPosition.y}, z: ${doubleCheckPosition.z}`);
        console.log(`Double-check rotation: x: ${doubleCheckRotation.x}, y: ${doubleCheckRotation.y}, z: ${doubleCheckRotation.z}`);
    }, 100);

    setTimeout(() => {
        scene.flushToDOM();
    }, 200);

    updateCurrentValues();
    updateLookImages();
}


function fadeOutElement(element) {
    console.log(`Starting fade out animation for element: ${element.tagName}`);
    element.setAttribute("animation", {
        property: "opacity",
        to: 0,
        dur: 2000,
        easing: "easeInOutQuad",
        startEvents: "startFadeOut",
    });

    element.addEventListener("animationcomplete", () => {
        console.log(`Fade out animation completed for element: ${element.tagName}`);
        element.parentNode.removeChild(element);
        console.log(`Element removed from DOM: ${element.tagName}`);
    });

    element.emit("startFadeOut");
}

function changeMedia(mediaArray, commonValues) {
    if (isChangingMedia) {
        console.log("changeMedia called, but media is already changing");
        return;
    }
    isChangingMedia = true;
    console.log("changeMedia called");

    // Preserve current position and rotation
    const currentPosition = mediaEntity.getAttribute("position");
    const currentRotation = mediaEntity.getAttribute("rotation");

    // Update modelIndex to the next media element in the array
    modelIndex = (modelIndex + 1) % mediaArray.length;

    // Display the new media element while preserving the position and rotation
    displayMedia(mediaArray, modelIndex, commonValues, currentPosition, currentRotation);

    // Ensure any audio is handled correctly
    if (currentAudio) {
        if (currentAudio.paused) {
            currentAudio.muted = false; // Ensure the audio is unmuted
            currentAudio.play().catch(error => {
                console.log("Error playing audio:", error);
            });
            console.log("Audio is playing");
        } else {
            currentAudio.pause();
            console.log("Audio is paused");
        }
    }

    // Reset the flag after a delay to allow further media changes
    setTimeout(() => {
        isChangingMedia = false;
    }, 1000); // Adjust the timeout as needed

    // Show the congratulations pop-up after a short delay for testing
    setTimeout(showCongratulationsPopup, 60000); // Set to 0 for immediate testing
}



function createLookImages() {
    let scene = document.querySelector("a-scene");

    lookImages.forEach((lookImage) => {
        if (lookImage.parentNode) {
            lookImage.parentNode.removeChild(lookImage);
        }
    });
    lookImages = [];

    const angles = [90, 180, 270];
    angles.forEach((angle) => {
        const radians = ((fixedAngleDegrees + angle) * Math.PI) / 180;
        const lookX = -currentZoom * Math.sin(radians);
        const lookZ = -currentZoom * Math.cos(radians);

        const lookImage = document.createElement("a-image");
        lookImage.setAttribute("src", "./assets/images/UI/look-for.svg");
        lookImage.setAttribute("position", { x: lookX, y: 0, z: lookZ });
        lookImage.setAttribute("rotation", {
            x: 0,
            y: angle + fixedAngleDegrees,
            z: 0,
        });
        lookImage.setAttribute("scale", "14 4 1");
        lookImage.setAttribute("visible", "true");
        scene.appendChild(lookImage);
        lookImages.push(lookImage);
    });
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isAndroid() {
    return /Android/.test(navigator.userAgent);
}

document.addEventListener("touchstart", function (e) {
    e.preventDefault(); // Prevent default touch actions
    if (e.touches.length === 2) {
        initialPinchDistance = getPinchDistance(e);
        isPinching = true; // Set the flag to indicate a pinch gesture
        console.log(`Initial touch start. initialPinchDistance: ${initialPinchDistance}`);
    } else if (e.touches.length === 1) {
        isDragging = true;
        initialTouchX = e.touches[0].pageX;
        initialTouchY = e.touches[0].pageY;
        initialFixedAngle = fixedAngleDegrees;
        currentY = mediaEntity.getAttribute("position").y;
        dragAxis = null; // Reset drag axis
    }
});


document.addEventListener("touchmove", function (e) {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
        e.preventDefault();
        const currentPinchDistance = getPinchDistance(e);
        updateZoom(currentPinchDistance);
    } else if (isDragging && e.touches.length === 1 && !isPinching) {
        e.preventDefault();
        const currentTouchX = e.touches[0].pageX;
        const currentTouchY = e.touches[0].pageY;
        const deltaX = currentTouchX - initialTouchX;
        const deltaY = currentTouchY - initialTouchY;

        if (dragAxis === null) {
            dragAxis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
        }

        let position = mediaEntity.getAttribute("position");

        if (dragAxis === "x") {
            fixedAngleDegrees = initialFixedAngle - deltaX * dragSpeedX;

            const radians = (fixedAngleDegrees * Math.PI) / 180;
            const x = -currentZoom * Math.sin(radians);
            const z = -currentZoom * Math.cos(radians);

            mediaEntity.setAttribute("position", { x, y: position.y, z });
            mediaEntity.setAttribute("rotation", `0 ${fixedAngleDegrees} 0`);

            if (frameEntity) {
                frameEntity.setAttribute("position", { x, y: position.y, z });
                frameEntity.setAttribute("rotation", `0 ${fixedAngleDegrees} 0`);
            }

            lookImages.forEach((lookImage, index) => {
                const angle = (index + 1) * 90;
                const lookRadians = ((fixedAngleDegrees + angle) * Math.PI) / 180;
                const lookX = -currentZoom * Math.sin(lookRadians);
                const lookZ = -currentZoom * Math.cos(lookRadians);
                lookImage.setAttribute("position", { x: lookX, y: 0, z: lookZ });
                lookImage.setAttribute("rotation", { x: 0, y: angle + fixedAngleDegrees, z: 0 });
            });
        } else if (dragAxis === "y") {
            const adjustedDragSpeedY = dragSpeedY * (currentZoom / 45);
            const newY = position.y - deltaY * adjustedDragSpeedY;
            const clampedY = Math.max(minY, Math.min(maxY, newY));

            mediaEntity.setAttribute("position", { x: position.x, y: clampedY, z: position.z });

            if (frameEntity) {
                frameEntity.setAttribute("position", { x: position.x, y: clampedY, z: position.z });
            }
        }

        initialMediaState.position = { ...mediaEntity.getAttribute("position") };
        initialMediaState.rotation = { ...mediaEntity.getAttribute("rotation") };

        updateCurrentValues();
    }
}, { passive: false });


document.addEventListener("touchend", function () {
    initialPinchDistance = null;
    isDragging = false;
    isPinching = false;
    dragAxis = null;
});

function getPinchDistance(e) {
    const dx = e.touches[0].pageX - e.touches[1].pageX;
    const dy = e.touches[0].pageY - e.touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateZoom(currentPinchDistance) {
    if (mediaEntity) {
        const directionX = -Math.sin((fixedAngleDegrees * Math.PI) / 180);
        const directionZ = -Math.cos((fixedAngleDegrees * Math.PI) / 180);
        let distanceChange =
            -(currentPinchDistance - initialPinchDistance) * zoomSpeed;
        let newZoom = currentZoom + distanceChange;

        newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

        const x = newZoom * directionX;
        const z = newZoom * directionZ;

        mediaEntity.setAttribute("position", { x, y: currentY, z });
        if (frameEntity) {
            frameEntity.setAttribute("position", { x, y: currentY, z });
        }
        currentZoom = newZoom;

        initialMediaState.position = { x, y: currentY, z };

        updateCurrentValues();
    }
}

document.querySelectorAll('a-entity, a-image, a-video').forEach(el => {
    const position = el.getAttribute('position');
    if (position.x === 0 && position.y === 0 && position.z === 0) {
        console.log(`Element at origin: ${el.tagName}, id: ${el.getAttribute('id')}`);
    }
});

function updateCurrentValues() {
    currentFixedAngleDisplay.textContent = fixedAngleDegrees.toFixed(2);
    currentYPositionDisplay.textContent = currentY.toFixed(2);
    currentZDepthDisplay.textContent = mediaEntity.getAttribute('position').z.toFixed(2);
}
