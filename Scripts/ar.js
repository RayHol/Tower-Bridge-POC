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

const minZoom = 10; // Minimum distance from the user
const maxZoom = 50; // Maximum distance from the user
const minY = -5; // Set minimum Y value
const maxY = 10; // Set maximum Y value
const zoomSpeed = 0.01; // Adjust the zoom speed as needed
const dragSpeedX = 0.07; // Adjust the drag speed for the x-axis
const dragSpeedY = 0.0015; // Adjust the drag speed for the y-axis

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

function addToHomeScreen() {
    console.log("Add to home screen functionality is not yet implemented.");
}

function refreshMediaPosition() {
    if (mediaEntity) {
        mediaEntity.setAttribute("position", initialMediaState.position);
        mediaEntity.setAttribute("rotation", initialMediaState.rotation);
        if (frameEntity) {
            frameEntity.setAttribute("position", initialMediaState.position);
            frameEntity.setAttribute("rotation", initialMediaState.rotation);
        }
        console.log(`Media position reset to initial values`);
    }
}

// Congrats page pop up
function showCongratulationsPopup() {
    if (!hasPopupShown && !hasPopupClosed) {
        const popup = document.getElementById('congratulations-overlay');
        popup.style.display = 'flex';
        hasPopupShown = true; // Ensure the pop-up only shows once per location
    }
}

// Function to close the congratulations overlay and prevent it from showing again in the session
function closeCongratsPopup() {
    const popup = document.getElementById('congratulations-overlay');
    popup.style.display = 'none';
    hasPopupClosed = true; // Prevent the pop-up from showing again in the same session
}

function loadNextLocation() {
    currentLocationIndex = (currentLocationIndex + 1) % locations.length;
    loadLocationMedia();
}

function loadPreviousLocation() {
    currentLocationIndex = (currentLocationIndex - 1 + locations.length) % locations.length;
    loadLocationMedia();
}

function loadLocationMedia() {
    fetch("./Scripts/mediaConfig.json")
        .then((response) => response.json())
        .then((data) => {
            hasPopupShown = false; // Reset popup shown status
            const mediaArray = data[locations[currentLocationIndex]].media;
            
            // Find the index of the first image in the media array
            modelIndex = 0; // Default to the first item
            for (let i = 0; i < mediaArray.length; i++) {
                if (mediaArray[i].type === "image") {
                    modelIndex = i;
                    break;
                }
            }

            initializeMedia(mediaArray);
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
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((data) => {
            locations = Object.keys(data);
            currentLocationIndex = locations.indexOf(locationId);

            if (!data[locationId]) {
                console.error("Invalid location specified");
                return;
            }
            initializeMedia(data[locationId].media);
        })
        .catch((error) => console.error("Error loading media config:", error));
}

document.addEventListener("DOMContentLoaded", function() {
    const arScene = document.getElementById('ar-scene');
    initializeAR(); // Initialize AR on page load

    const closePopupButton = document.getElementById('close-congrats-overlay');
    if (closePopupButton) {
        closePopupButton.addEventListener('click', closeCongratsPopup);
    }

    const viewMapButton = document.getElementById("view-map");
    const helpButton = document.getElementById("help");
    const muteButton = document.getElementById("mute");
    const refreshButton = document.getElementById("refresh");
    let isMuted = true; // Start with audio muted

    if (viewMapButton) {
        viewMapButton.addEventListener("click", () => {
            // Show the map overlay (functionality to be implemented)
            console.log("View Map button clicked");
        });
    }

    if (helpButton) {
        helpButton.addEventListener("click", () => {
            const helpOverlay = document.getElementById("help-overlay");
            if (helpOverlay) {
                helpOverlay.style.display = "flex"; // Show the help overlay
            }
        });
    }

    function toggleMuteButton(isMuted) {
        const buttonText = isMuted ? "Unmute" : "Mute";
        const buttonIcon = isMuted ? "./assets/images/UI/unmute-icon.svg" : "./assets/mute-icon.svg";

        muteButton.innerHTML = `<img src="${buttonIcon}" alt="${buttonText} button" class="button-icon"> ${buttonText}`;
    }

    if (muteButton) {
        muteButton.addEventListener("click", () => {
            if (currentAudio) {
                if (isMuted) {
                    currentAudio.play(); // Play the audio if it's muted
                }
                isMuted = !isMuted;
                currentAudio.muted = isMuted; // Toggle the muted state of the audio
                console.log(`Audio muted state: ${currentAudio.muted}`); // Debug statement
                toggleMuteButton(isMuted); // Update the button appearance
            } else {
                console.log("No audio entity found."); // Debug statement
            }
        });

        // Set initial state
        if (currentAudio) {
            toggleMuteButton(currentAudio.muted);
        } else {
            toggleMuteButton(true); // Start with mute button indicating muted state
        }
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            refreshMediaPosition();
            loadLocationMedia();
        });
    }

    const mapOverlay = document.getElementById('map-overlay');
    const closeMapOverlayButton = document.getElementById('close-map-overlay');

    if (viewMapButton && closeMapOverlayButton) {
        viewMapButton.addEventListener('click', () => {
            if (mapOverlay) {
                mapOverlay.style.display = 'flex'; // Show the map overlay
            }
        });

        closeMapOverlayButton.addEventListener('click', () => {
            if (mapOverlay) {
                mapOverlay.style.display = 'none'; // Hide the map overlay
            }
        });
    }

    const closeHelpOverlayButton = document.getElementById("close-help-overlay");

    if (helpButton && closeHelpOverlayButton) {
        helpButton.addEventListener("click", () => {
            const helpOverlay = document.getElementById("help-overlay");
            if (helpOverlay) {
                helpOverlay.style.display = "flex"; // Show the help overlay
            }
        });

        closeHelpOverlayButton.addEventListener("click", () => {
            const helpOverlay = document.getElementById("help-overlay");
            if (helpOverlay) {
                helpOverlay.style.display = "none"; // Hide the help overlay
            }
        });
    }

    const nextButton = document.getElementById('continue-button');
    const backButton = document.getElementById('back-button');

    if (nextButton) {
        nextButton.addEventListener('click', () => {
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

    // Remove 'Got It' button audio play handler as it's no longer needed
    // Apply unselectable class to relevant elements
    document
        .querySelectorAll(".button-text, h1-1, h1-2, h2, p, button")
        .forEach((el) => el.classList.add("unselectable"));
});

function removeAllMedia() {
    let scene = document.querySelector("a-scene");

    // Remove existing media elements (images, videos, audio)
    let mediaElements = scene.querySelectorAll('a-image:not([id^="look_"]), a-video:not([visible=false]), a-audio');
    mediaElements.forEach(element => {
        element.parentNode.removeChild(element);
    });

    // Remove existing frame if any
    if (frameEntity) {
        frameEntity.parentNode.removeChild(frameEntity);
        frameEntity = null;
    }

    // Remove any existing lookImages
    lookImages.forEach(lookImage => {
        if (lookImage.parentNode) {
            lookImage.parentNode.removeChild(lookImage);
        }
    });
    lookImages = []; // Clear the lookImages array

    // Stop any playing audio
    if (videoEntity) {
        videoEntity.setAttribute("visible", "false");
        videoEntity = null;
    }
}

function initializeMedia(mediaArray) {
    const button = document.querySelector('button[data-action="change"]');

    // Clear previous button text
    const existingButtonText = document.querySelector('.button-text');
    if (existingButtonText) {
        existingButtonText.remove();
    }

    const buttonText = document.createElement("div");
    buttonText.className = "button-text";
    button.insertAdjacentElement("beforebegin", buttonText);

    // Event listener for changing media
    button.addEventListener("click", () => {
        changeMedia(mediaArray); // Pass the mediaArray to changeMedia function
    });

    const scene = document.querySelector("a-scene");
    if (scene.hasLoaded) {
        displayMedia(mediaArray, modelIndex); // Pass mediaArray and modelIndex to displayMedia
    } else {
        scene.addEventListener("loaded", function () {
            displayMedia(mediaArray, modelIndex); // Pass mediaArray and modelIndex to displayMedia
        });
    }
}

function displayMedia(mediaArray, index) {
    let scene = document.querySelector("a-scene");
    let mediaItem = mediaArray[index];

    // Remove all existing media elements
    removeAllMedia();

    // Correct media element placement
    fixedAngleDegrees = mediaItem.fixedAngleDegrees; // Ensure to use fixedAngleDegrees from mediaItem
    const radians = (fixedAngleDegrees * Math.PI) / 180;
    const defaultPosition = {
        x: -currentZoom * Math.sin(radians),
        y: currentY,
        z: -currentZoom * Math.cos(radians),
    };
    const position = mediaEntity
        ? mediaEntity.getAttribute("position")
        : defaultPosition;
    const rotation = mediaEntity
        ? mediaEntity.getAttribute("rotation")
        : { x: 0, y: fixedAngleDegrees, z: 0 };

    // Store initial state
    initialMediaState.position = { ...position };
    initialMediaState.rotation = { ...rotation };

    console.log(`Setting initial position to x: ${position.x}, y: ${position.y}, z: ${position.z}`);
    console.log(`Setting initial rotation to 0, ${rotation.y}, 0`);

    let entity;
    const buttonText = document.querySelector('.button-text');
    if (mediaItem.type === "image") {
        // Set up the image entity
        entity = document.createElement("a-image");
        entity.setAttribute("src", mediaItem.url);
        entity.setAttribute("position", position); // Set initial position
        entity.setAttribute("rotation", rotation); // Set initial rotation
        entity.setAttribute("scale", mediaItem.scale);

        scene.appendChild(entity);
        document.getElementById("look_1").setAttribute("visible", "true"); // Ensure lookImage is visible
        buttonText.innerText = "Tap to play when the photo is in place";

        // Create lookImage copies at specific angles
        createLookImages();
    } else if (mediaItem.type === "video") {
        // Ensure the video element is reset and properly initialized
        entity = document.createElement("a-video");
        entity.setAttribute("src", mediaItem.url);
        entity.setAttribute("autoplay", "true");
        entity.setAttribute("loop", "true");
        entity.setAttribute("playsinline", "true");
        entity.setAttribute("muted", "true"); // Always muted
        entity.setAttribute("position", position); // Set initial position
        entity.setAttribute("rotation", rotation); // Set initial rotation
        entity.setAttribute("scale", mediaItem.scale);
        entity.setAttribute("preload", "auto"); // Ensure the video is preloaded

        entity.addEventListener('loadeddata', () => {
            console.log('Video entity loaded and ready'); // Debug statement
        });

        entity.addEventListener('canplay', () => {
            console.log('Video entity can play'); // Debug statement
        });

        scene.appendChild(entity);
        videoEntity = entity; // Ensure videoEntity is set

        console.log('Video entity created', videoEntity); // Debug statement

        document.getElementById("look_1").setAttribute("visible", "true"); // Ensure lookImage is visible
        buttonText.innerText = "Go back to the image";

        // Create lookImage copies at specific angles
        createLookImages();
    }

    // Handle audio
    if (mediaItem.audioUrl) {
        if (currentAudio) {
            currentAudio.pause();
            document.body.removeChild(currentAudio);
        }
        const audio = document.createElement('audio');
        audio.setAttribute('src', mediaItem.audioUrl);
        audio.setAttribute('id', 'audio-' + index);
        audio.setAttribute('preload', 'auto');
        audio.setAttribute('muted', 'true'); // Start muted
        audio.setAttribute('loop', 'true'); // Set audio to loop
        document.body.appendChild(audio);
        currentAudio = audio; // Update current audio reference
    }

    mediaEntity = entity;

    // Explicitly set initial position and update debug info
    mediaEntity.setAttribute("position", position);

    // Confirm attributes have been set correctly
    const confirmedPosition = mediaEntity.getAttribute("position");
    const confirmedRotation = mediaEntity.getAttribute("rotation");
    console.log(`Confirmed initial position: x: ${confirmedPosition.x}, y: ${confirmedPosition.y}, z: ${confirmedPosition.z}`);
    console.log(`Confirmed initial rotation: x: ${confirmedRotation.x}, y: ${confirmedRotation.y}, z: ${confirmedRotation.z}`);

    // Ensure attributes are not overridden
    setTimeout(() => {
        const doubleCheckPosition = mediaEntity.getAttribute("position");
        const doubleCheckRotation = mediaEntity.getAttribute("rotation");
        console.log(`Double-check position: x: ${doubleCheckPosition.x}, y: ${doubleCheckPosition.y}, z: ${doubleCheckPosition.z}`);
        console.log(`Double-check rotation: x: ${doubleCheckRotation.x}, y: ${doubleCheckRotation.y}, z: ${doubleCheckRotation.z}`);
    }, 100);
}

function createLookImages() {
    let scene = document.querySelector("a-scene");
    lookImages.forEach((lookImage) => {
        lookImage.parentNode.removeChild(lookImage);
    });
    lookImages = [];
    const angles = [90, 180, 270]; // Angles for lookImage
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
        scene.appendChild(lookImage);
        lookImages.push(lookImage);
    });
}

function changeMedia(mediaArray) {
    modelIndex = (modelIndex + 1) % mediaArray.length;
    displayMedia(mediaArray, modelIndex);

    // Unmute the video if the new media is a video
    if (mediaArray[modelIndex].type === "video") {
        setTimeout(() => {
            if (videoEntity) {
                videoEntity.muted = false;
                console.log('Video entity unmuted', videoEntity); // Debug statement
            }
        }, 100); // Small delay to ensure the video element is loaded
    }

    // Show the congratulations pop-up after a short delay for testing
    setTimeout(showCongratulationsPopup, 60000); // Set to 0 for immediate testing
}

// Existing touch and drag event handlers
document.addEventListener("touchstart", function (e) {
    e.preventDefault(); // Prevent default touch actions
    if (e.touches.length === 2) {
        initialPinchDistance = getPinchDistance(e);
        isPinching = true; // Set the flag to indicate a pinch gesture
        console.log(
            `Initial touch start. initialPinchDistance: ${initialPinchDistance}`
        );
    } else if (e.touches.length === 1) {
        isDragging = true;
        initialTouchX = e.touches[0].pageX;
        initialTouchY = e.touches[0].pageY;
        initialFixedAngle = fixedAngleDegrees;
        currentY = mediaEntity.getAttribute("position").y;
        dragAxis = null; // Reset drag axis
    }
});

document.addEventListener(
    "touchmove",
    function (e) {
        if (e.touches.length === 2 && initialPinchDistance !== null) {
            e.preventDefault(); // Prevent default pinch-to-zoom behavior
            const currentPinchDistance = getPinchDistance(e);
            updateZoom(currentPinchDistance);
        } else if (isDragging && e.touches.length === 1 && !isPinching) {
            e.preventDefault(); // Prevent default touch behavior
            const currentTouchX = e.touches[0].pageX;
            const currentTouchY = e.touches[0].pageY;
            const deltaX = currentTouchX - initialTouchX;
            const deltaY = currentTouchY - initialTouchY;

            if (dragAxis === null) {
                // Determine drag axis based on initial touch movement
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    dragAxis = "x"; // Horizontal drag
                } else {
                    dragAxis = "y"; // Vertical drag
                }
            }

            if (dragAxis === "x") {
                // Adjust fixedAngleDegrees based on horizontal movement
                fixedAngleDegrees = initialFixedAngle - deltaX * dragSpeedX; // Adjust the sensitivity as needed

                // Calculate the new position based on fixedAngleDegrees
                const radians = (fixedAngleDegrees * Math.PI) / 180;
                const x = -currentZoom * Math.sin(radians); // Adjust for current zoom level
                const z = -currentZoom * Math.cos(radians); // Adjust for current zoom level

                mediaEntity.setAttribute("position", { x, y: currentY, z });
                mediaEntity.setAttribute("rotation", `0 ${fixedAngleDegrees} 0`);
                if (frameEntity) {
                    frameEntity.setAttribute("position", { x, y: currentY, z });
                    frameEntity.setAttribute("rotation", `0 ${fixedAngleDegrees} 0`);
                }
                lookImages.forEach((lookImage, index) => {
                    const angle = (index + 1) * 90;
                    const lookRadians = ((fixedAngleDegrees + angle) * Math.PI) / 180;
                    const lookX = -25 * Math.sin(lookRadians);
                    const lookZ = -25 * Math.cos(lookRadians);
                    lookImage.setAttribute("position", { x: lookX, y: 0, z: lookZ });
                    lookImage.setAttribute("rotation", {
                        x: 0,
                        y: angle + fixedAngleDegrees,
                        z: 0,
                    });
                });
            } else if (dragAxis === "y") {
                // Calculate the new Y position
                const newY = currentY - deltaY * dragSpeedY; // Adjust the sensitivity as needed and invert the drag
                const clampedY = Math.max(minY, Math.min(maxY, newY)); // Constrain the Y value within minY and maxY

                // Update the media entity position
                const position = mediaEntity.getAttribute("position");
                mediaEntity.setAttribute("position", {
                    x: position.x,
                    y: clampedY,
                    z: position.z,
                });
                if (frameEntity) {
                    frameEntity.setAttribute("position", {
                        x: position.x,
                        y: clampedY,
                        z: position.z,
                    });
                }
                currentY = clampedY; // Store the current Y position
            }
        }
    },
    { passive: false }
);

document.addEventListener("touchend", function () {
    initialPinchDistance = null;
    isDragging = false;
    isPinching = false; // Reset the pinch flag on touch end
    dragAxis = null; // Reset drag axis on touch end
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

        // Constrain the zoom distance within minZoom and maxZoom
        newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

        const x = newZoom * directionX;
        const z = newZoom * directionZ;

        mediaEntity.setAttribute("position", { x, y: currentY, z });
        if (frameEntity) {
            frameEntity.setAttribute("position", { x, y: currentY, z }); // Ensure frame is slightly in front dynamically
        }
        currentZoom = newZoom; // Update current zoom level
    }
}
