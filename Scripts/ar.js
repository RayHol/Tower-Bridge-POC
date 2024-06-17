// v.011 pinch to zoom
// v.012 drag to rotate
// v.013 background audio
// v.014 look around images placed around the user
// v0.15 Frames added
// v0.16 IOS notification formating (motion sensors) and fixed the change displayMedia not persitstant location
// v0.17 Added new overlay page for headphones, 4 onscreen buttons for Map (with ovelay on press) save to home (not working), mute/unmute, refresh the location (not working)
// v0.19 delay to notification of the motion sensor pop up - some formatting fixes, UI buttons working, look around image updated, worked on the audio/mute/unmute, map and help button pops now showing.
// v0.2 Congrats pop up timed after video plays. Next/previos locations added
// v0.21 - didn't work
// v0.22 Nav to next/back locations working, but not skipping the welcome and before you star pages.

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
let hasPopupShown = false; //congrats popup
let currentLocationIndex = 0;
let locations = []; // This will be filled with the keys from mediaConfig.json

const minZoom = 10; // Minimum distance from the user
const maxZoom = 50; // Maximum distance from the user
const minY = -5; // Set minimum Y value
const maxY = 10; // Set maximum Y value
const zoomSpeed = 0.01; // Adjust the zoom speed as needed
const dragSpeed = 0.01; // Adjust the drag speed as needed

// Pinch-to-zoom variables
let initialPinchDistance = null;

// Drag functionality variables
let isDragging = false;
let initialTouchX = null;
let initialTouchY = null;
let initialFixedAngle = 0;
let dragAxis = null; // 'x' for rotation, 'y' for vertical movement

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
    if (!hasPopupShown) {
        const popup = document.getElementById('congratulations-overlay');
        popup.style.display = 'flex';

        const closePopupButton = document.getElementById('close-congrats-overlay');
        closePopupButton.addEventListener('click', () => {
            popup.style.display = 'none';
        });

        hasPopupShown = true; // Ensure the pop-up only shows once per location
    }
}

function addToHomeScreen() {
    if (window.navigator.standalone === true) {
        return false;
    } else if (window.matchMedia("(display-mode: standalone)").matches) {
        return false;
    }

    const prompt = window.deferredPrompt;

    if (prompt) {
        prompt.prompt();

        prompt.userChoice.then(function (choiceResult) {
            if (choiceResult.outcome === "accepted") {
                console.log("User accepted the A2HS prompt");
            } else {
                console.log("User dismissed the A2HS prompt");
            }

            window.deferredPrompt = null;
        });
    }

    return true;
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

window.onload = () => {
    // Ensure all elements exist before adding event listeners
    const headphoneOverlay = document.getElementById("headphone-overlay");
    if (headphoneOverlay) {
        const addToHomeButton = document.getElementById("add-to-home");
        const closeHeadphoneOverlayButton = document.getElementById("close-headphone-overlay");

        if (addToHomeButton) {
            addToHomeButton.addEventListener("click", () => {
                addToHomeScreen(); // Call the addToHomeScreen function
            });
        }

        if (closeHeadphoneOverlayButton) {
            closeHeadphoneOverlayButton.addEventListener("click", () => {
                headphoneOverlay.style.display = "none";
                const audio = document.getElementById("background-audio");
                audio.play();
            });
        }
    }

    const viewMapButton = document.getElementById("view-map");
    const helpButton = document.getElementById("help");
    const muteButton = document.getElementById("mute");
    const refreshButton = document.getElementById("refresh");
    let isMuted = false;

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
        const muteButton = document.getElementById("mute");
        const buttonText = isMuted ? "Unmute" : "Mute";
        const buttonIcon = isMuted ? "./assets/images/UI/unmute-icon.svg" : "./assets/mute-icon.svg";

        muteButton.innerHTML = `<img src="${buttonIcon}" alt="${buttonText} button" class="button-icon"> ${buttonText}`;
    }

    if (muteButton) {
        muteButton.addEventListener("click", () => {
            const audio = document.getElementById("background-audio");
            if (isMuted) {
                audio.play();
                isMuted = false;
            } else {
                audio.pause();
                isMuted = true;
            }
            toggleMuteButton(isMuted); // Update the button appearance
        });

        // Set initial state
        toggleMuteButton(isMuted);
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            refreshMediaPosition(); // Use the refreshMediaPosition function
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
  
    // Ensure background audio plays when 'Got It' button is clicked
    const gotItButton = document.getElementById('got-it-button');
    gotItButton.addEventListener('click', () => {
        const audio = document.getElementById("background-audio");
        if (!isMuted) {
            audio.play();
        }
    });

    // Apply unselectable class to relevant elements
    document
        .querySelectorAll(".button-text, h1-1, h1-2, h2, p, button")
        .forEach((el) => el.classList.add("unselectable"));
};

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

    const isIPhone = /iphone|ipod/i.test(navigator.userAgent.toLowerCase());

    function getPinchDistance(e) {
        const dx = e.touches[0].pageX - e.touches[1].pageX;
        const dy = e.touches[0].pageY - e.touches[1].pageY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Event listener for changing media
    button.addEventListener("click", () => {
        changeMedia(); // Change to video on button click
    });

    const scene = document.querySelector("a-scene");
    if (scene.hasLoaded) {
        displayMedia(modelIndex); // Initial media display
    } else {
        scene.addEventListener("loaded", function () {
            displayMedia(modelIndex); // Initial media display
        });
    }




    function updateZoom(currentPinchDistance) {
        if (mediaEntity) {
            const directionX = -Math.sin((fixedAngleDegrees * Math.PI) / 180);
            const directionZ = -Math.cos((fixedAngleDegrees * Math.PI) / 180);
            let distanceChange =
                (currentPinchDistance - initialPinchDistance) * zoomSpeed;
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

    document.addEventListener("touchstart", function (e) {
        e.preventDefault(); // Prevent default touch actions
        if (e.touches.length === 2) {
            initialPinchDistance = getPinchDistance(e);
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
            } else if (isDragging && e.touches.length === 1) {
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
                    fixedAngleDegrees = initialFixedAngle + deltaX * dragSpeed; // Adjust the sensitivity as needed

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
                    const newY = currentY - deltaY * dragSpeed * 0.2; // Adjust the sensitivity as needed and invert the drag
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
        dragAxis = null; // Reset drag axis on touch end
    });

    function setMediaSource() {
        const lookImage = document.getElementById("look_1");
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes("iphone")) {
            lookImage.setAttribute("src", "./assets/images/UI/look-for.svg");
            lookImage.setAttribute("material", "transparent: true; alphaTest: 0.5;");
        } else {
            lookImage.setAttribute("src", "./assets/images/UI/look-for.svg");
        }
    }

    function createLookImages() {
        let scene = document.querySelector("a-scene");
        lookImages.forEach((lookImage) =>
            lookImage.parentNode.removeChild(lookImage)
        );
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


function displayMedia(index) {
    let scene = document.querySelector("a-scene");
    let mediaItem = mediaArray[index];

    // Remove existing media (image or video)
    let existingMedia = scene.querySelector('a-image:not([id^="look_"]) , a-video:not([visible=false])');
    if (existingMedia) {
        existingMedia.parentNode.removeChild(existingMedia);
    }

    // Remove existing frame if any
    if (frameEntity) {
        frameEntity.parentNode.removeChild(frameEntity);
        frameEntity = null;
    }

    // Remove any existing lookImages
    lookImages.forEach((lookImage) => {
        if (lookImage.parentNode) {
            lookImage.parentNode.removeChild(lookImage);
        }
    });
    lookImages = []; // Clear the lookImages array

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

    if (videoEntity) {
        videoEntity.setAttribute("visible", "false");
        videoEntity = null;
    }

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
        buttonText.innerText = "Tap to play";

        // Create lookImage copies at specific angles
        createLookImages();
    } else if (mediaItem.type === "video") {
        // Ensure the video element is reset and properly initialized
        entity = document.createElement("a-video");
        entity.setAttribute("src", mediaItem.url);
        entity.setAttribute("autoplay", "true");
        entity.setAttribute("loop", "true");
        entity.setAttribute("playsinline", "true");
        entity.setAttribute("position", position); // Set initial position
        entity.setAttribute("rotation", rotation); // Set initial rotation
        entity.setAttribute("scale", mediaItem.scale);
        entity.setAttribute("preload", "auto"); // Ensure the video is preloaded
        scene.appendChild(entity);
        videoEntity = entity;

        document.getElementById("look_1").setAttribute("visible", "true"); // Ensure lookImage is visible
        buttonText.innerText = "Go back";

        // Create lookImage copies at specific angles
        createLookImages();
    }
    mediaEntity = entity;

    // Add the frame entity
    if (mediaItem.frameUrl) {
        frameEntity = document.createElement("a-image");
        frameEntity.setAttribute("src", mediaItem.frameUrl);
        frameEntity.setAttribute("position", position); // Ensure frame is slightly in front dynamically
        frameEntity.setAttribute("rotation", rotation);
        frameEntity.setAttribute("scale", mediaItem.scale);
        scene.appendChild(frameEntity);
    }

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



function changeMedia() {
    modelIndex = (modelIndex + 1) % mediaArray.length;
    displayMedia(modelIndex);

    // Show the congratulations pop-up after a short delay for testing
    setTimeout(showCongratulationsPopup, 5000); // Set to 0 for immediate testing
}
}


