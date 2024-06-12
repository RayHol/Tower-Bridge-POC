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

    // Apply unselectable class to relevant elements
    document.querySelectorAll('.button-text, h1-1, h1-2, h2, p, button').forEach(el => el.classList.add('unselectable'));
};

function initializeAR(mediaArray) {
    let modelIndex = 0;
    let videoEntity = null;
    let frameEntity = null;
    const button = document.querySelector('button[data-action="change"]');
    const buttonText = document.createElement('div');
    buttonText.className = 'button-text';
    button.insertAdjacentElement('beforebegin', buttonText);
    const isIPhone = /iphone|ipod/i.test(navigator.userAgent.toLowerCase());

    let mediaEntity = null;
    let fixedAngleDegrees = 0;
    let currentZoom = 25; // Initial distance from the user
    let currentY = 0; // Initial Y position
    const minZoom = 10; // Minimum distance from the user
    const maxZoom = 50; // Maximum distance from the user
    const minY = -5; // Set minimum Y value
    const maxY = 10; // Set maximum Y value
    const zoomSpeed = 0.02; // Adjust the zoom speed as needed

    // Pinch-to-zoom variables
    let initialPinchDistance = null;

    // Drag functionality variables
    let isDragging = false;
    let initialTouchX = null;
    let initialTouchY = null;
    let initialFixedAngle = 0;
    let dragAxis = null; // 'x' for rotation, 'y' for vertical movement

    // Debug elements to display position, rotation, and fixedAngleDegrees
    const debugDiv = document.createElement('div');
    debugDiv.id = 'debug-info';
    debugDiv.style.position = 'fixed';
    debugDiv.style.top = '10px';
    debugDiv.style.left = '10px';
    debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    debugDiv.style.color = 'white';
    debugDiv.style.padding = '10px';
    debugDiv.style.zIndex = '1000';
    document.body.appendChild(debugDiv);

    function updateDebugInfo() {
        if (mediaEntity) {
            const position = mediaEntity.getAttribute('position');
            const rotation = mediaEntity.getAttribute('rotation');
            debugDiv.innerHTML = `
                Position: x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}, z: ${position.z.toFixed(2)}<br>
                Rotation: x: ${rotation.x.toFixed(2)}, y: ${rotation.y.toFixed(2)}, z: ${rotation.z.toFixed(2)}<br>
                Fixed Angle Degrees: ${fixedAngleDegrees}
            `;
        }
    }

    function getPinchDistance(e) {
        const dx = e.touches[0].pageX - e.touches[1].pageX;
        const dy = e.touches[0].pageY - e.touches[1].pageY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function updateZoom(currentPinchDistance) {
        if (mediaEntity) {
            const scale = currentPinchDistance / initialPinchDistance;
            const directionX = -Math.sin(fixedAngleDegrees * Math.PI / 180);
            const directionZ = -Math.cos(fixedAngleDegrees * Math.PI / 180);
            let distance = currentZoom * scale;

            // Constrain the zoom distance within minZoom and maxZoom
            distance = Math.max(minZoom, Math.min(maxZoom, distance));

            const x = distance * directionX;
            const z = distance * directionZ;

            mediaEntity.setAttribute('position', { x, y: currentY, z });
            if (frameEntity) {
                frameEntity.setAttribute('position', { x, y: currentY, z: z - 0.1 }); // Ensure frame is slightly in front
            }
            currentZoom = distance; // Update current zoom level
            updateDebugInfo(); // Update debug info
        }
    }

    document.addEventListener('touchstart', function (e) {
        e.preventDefault(); // Prevent default touch actions
        if (e.touches.length === 2) {
            initialPinchDistance = getPinchDistance(e);
            console.log(`Initial touch start. initialPinchDistance: ${initialPinchDistance}`);
        } else if (e.touches.length === 1) {
            isDragging = true;
            initialTouchX = e.touches[0].pageX;
            initialTouchY = e.touches[0].pageY;
            initialFixedAngle = fixedAngleDegrees;
            currentY = mediaEntity.getAttribute('position').y;
            dragAxis = null; // Reset drag axis
        }
    });

    document.addEventListener('touchmove', function (e) {
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
                    dragAxis = 'x'; // Horizontal drag
                } else {
                    dragAxis = 'y'; // Vertical drag
                }
            }

            if (dragAxis === 'x') {
                // Adjust fixedAngleDegrees based on horizontal movement
                fixedAngleDegrees = initialFixedAngle + deltaX * 0.1; // Adjust the sensitivity as needed

                // Calculate the new position based on fixedAngleDegrees
                const radians = fixedAngleDegrees * (Math.PI / 180);
                const x = -currentZoom * Math.sin(radians); // Adjust for current zoom level
                const z = -currentZoom * Math.cos(radians); // Adjust for current zoom level

                mediaEntity.setAttribute('position', { x, y: currentY, z });
                mediaEntity.setAttribute('rotation', `0 ${fixedAngleDegrees} 0`);
                if (frameEntity) {
                    frameEntity.setAttribute('position', { x, y: currentY, z: z - 0.1 }); // Ensure frame is slightly in front
                }
            } else if (dragAxis === 'y') {
                // Calculate the new Y position
                const newY = currentY - (deltaY * 0.02); // Adjust the sensitivity as needed and invert the drag
                const clampedY = Math.max(minY, Math.min(maxY, newY)); // Constrain the Y value within minY and maxY

                // Update the media entity position
                const position = mediaEntity.getAttribute('position');
                mediaEntity.setAttribute('position', { x: position.x, y: clampedY, z: position.z });
                if (frameEntity) {
                    frameEntity.setAttribute('position', { x: position.x, y: clampedY, z: position.z - 0.1 }); // Ensure frame is slightly in front
                }
                currentY = clampedY; // Store the current Y position
            }

            // Update debug info
            updateDebugInfo();
        }
    }, { passive: false });

    document.addEventListener('touchend', function () {
        initialPinchDistance = null;
        isDragging = false;
        dragAxis = null; // Reset drag axis on touch end
    });

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

        // Remove existing media (image or video)
        let existingMedia = scene.querySelector('a-image:not(#look_1), a-video:not([visible=false])');
        if (existingMedia) {
            existingMedia.parentNode.removeChild(existingMedia);
        }

        // Remove existing frame if any
        if (frameEntity) {
            frameEntity.parentNode.removeChild(frameEntity);
            frameEntity = null;
        }

        // Correct media element placement
        fixedAngleDegrees = mediaItem.fixedAngleDegrees; // Store the fixed angle degrees for initial placement
        const radians = fixedAngleDegrees * (Math.PI / 180);
        const x = -currentZoom * Math.sin(radians); // Set initial X based on fixedAngleDegrees and current zoom level
        const z = -currentZoom * Math.cos(radians); // Set initial Z based on fixedAngleDegrees and current zoom level
        const rotationY = fixedAngleDegrees; // Set initial rotation

        console.log(`Setting initial position to x: ${x}, y: ${currentY}, z: ${z}`);
        console.log(`Setting initial rotation to 0, ${rotationY}, 0`);

        if (videoEntity) {
            videoEntity.setAttribute('visible', 'false');
            videoEntity = null;
        }

        let entity;
        if (mediaItem.type === 'image') {
            // Set up the image entity
            entity = document.createElement('a-image');
            entity.setAttribute('src', mediaItem.url);
            entity.setAttribute('position', { x, y: currentY, z }); // Set initial position
            entity.setAttribute('rotation', { x: 0, y: rotationY, z: 0 }); // Set initial rotation
            entity.setAttribute('scale', mediaItem.scale);

            scene.appendChild(entity);
            lookImage.setAttribute('visible', 'true'); // Ensure lookImage is visible
            buttonText.innerText = isIPhone ? "Tap to play the animation" : "Tap to play";

            // Set the look image opposite to the media item
            const oppositeAngleDegrees = (fixedAngleDegrees + 180) % 360;
            const oppositeRadians = oppositeAngleDegrees * (Math.PI / 180);
            const oppositeX = -currentZoom * Math.sin(oppositeRadians); // Adjusted for correct opposite placement and current zoom level
            const oppositeZ = -currentZoom * Math.cos(oppositeRadians); // Adjusted for correct opposite placement and current zoom level
            lookImage.setAttribute('position', { x: oppositeX, y: currentY, z: oppositeZ });
            lookImage.setAttribute('rotation', { x: 0, y: 180, z: 0 });
        } else if (mediaItem.type === 'video') {
            if (videoEntity) {
                videoEntity.setAttribute('visible', 'true');
            } else {
                // Set up the video entity
                entity = document.createElement('a-video');
                entity.setAttribute('src', mediaItem.url);
                entity.setAttribute('autoplay', 'true');
                entity.setAttribute('loop', 'true');
                entity.setAttribute('playsinline', 'true');
                entity.setAttribute('position', { x, y: currentY, z }); // Set initial position
                entity.setAttribute('rotation', { x: 0, y: rotationY, z: 0 }); // Set initial rotation
                entity.setAttribute('scale', mediaItem.scale);
                entity.setAttribute('preload', 'true');
                scene.appendChild(entity);
                videoEntity = entity;
            }
            lookImage.setAttribute('visible', 'false'); // Hide lookImage when video is playing
            buttonText.innerText = "Tap to go back";
        }
        mediaEntity = entity;

        // Add the frame entity
        if (mediaItem.frameUrl) {
            frameEntity = document.createElement('a-image');
            frameEntity.setAttribute('src', mediaItem.frameUrl);
            frameEntity.setAttribute('position', { x, y: currentY, z: z +1 }); // Ensure frame is slightly in front
            frameEntity.setAttribute('rotation', { x: 0, y: rotationY, z: 0 });
            frameEntity.setAttribute('scale', mediaItem.scale);
            scene.appendChild(frameEntity);
        }

        // Explicitly set initial position and update debug info
        mediaEntity.setAttribute('position', { x: x, y: currentY, z: z });

        // Confirm attributes have been set correctly
        const confirmedPosition = mediaEntity.getAttribute('position');
        const confirmedRotation = mediaEntity.getAttribute('rotation');
        console.log(`Confirmed initial position: x: ${confirmedPosition.x}, y: ${confirmedPosition.y}, z: ${confirmedPosition.z}`);
        console.log(`Confirmed initial rotation: x: ${confirmedRotation.x}, y: ${confirmedRotation.y}, z: ${confirmedRotation.z}`);

        // Ensure attributes are not overridden
        setTimeout(() => {
            const doubleCheckPosition = mediaEntity.getAttribute('position');
            const doubleCheckRotation = mediaEntity.getAttribute('rotation');
            console.log(`Double-check position: x: ${doubleCheckPosition.x}, y: ${doubleCheckPosition.y}, z: ${doubleCheckPosition.z}`);
            console.log(`Double-check rotation: x: ${doubleCheckRotation.x}, y: ${doubleCheckRotation.y}, z: ${doubleCheckRotation.z}`);
            updateDebugInfo();
        }, 100);
    }

    setMediaSource();
    button.addEventListener('click', () => {
        changeMedia(); // Change to video on button click
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
