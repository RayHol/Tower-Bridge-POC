<!DOCTYPE html>
<html>
<head>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap">
    <link rel="stylesheet" href="./Scripts/style.css"/>
    <title>Smartify Tower Bridge AR Experience</title>
    
    <script src="https://aframe.io/releases/1.2.0/aframe.min.js"></script>
    <script src="https://raw.githack.com/jeromeetienne/AR.js/master/aframe/build/aframe-ar.min.js"></script>
  
</head>

<body style="margin: 0; overflow: hidden;">
    <!-- Welcome overlay page -->
    <div class="overlay" id="overlay">
        <div class="overlay-background"></div>
        <div class="overlay-content">
            <img src="./assets/images/UI/Logo.png" class="logo" alt="Logo"><br>
            <h1 class="overlay-header1">Launching a landmark</h1>
            <h1 class="overlay-header1-v2">The unseen opening weeks</h1>
            <div class="overlay-line"></div>
            <h2 class="overlay-header2">A new bridge for londoners</h2>
            <p class="overlay-text">Discover a unique collection of previously unseen photographs. They record the last few weeks leading up to the opening of Tower Bridge in the summer of 1894.<br><br>Explore them where they were originally taken and see the Bridge come alive through the eyes of the workers who built it. Press the start button to find the nearby photograph.</p>
            <button id="start-experience">Start Exploring</button>
            <div class="powered-by-container">
                <h3 id="powered-by-welcome">POWERED BY</h3>
                <img id="smartify-logo-welcome" src="./assets/images/UI/Smartify-Logo-White.svg" alt="Smartify Logo" width="75" height="34">
            </div>
        </div>
    </div>
  
    <!-- Full-screen overlay page -->
    <div class="overlay" id="full-screen-overlay" style="display: none;">
        <div class="overlay-content">
            <h1 class="fsinstructions-h1">BEFORE WE START</h1>
            <div class="fsinstructions-container">
                <div class="fsinstruction">
                    <img src="./assets/images/UI/Headphones-Icon.svg" alt="Headphones Icon" class="fsinstruction-icon">
                    <p class="fsinstruction-text">Use headphones to<br>enhance your experience</p>
                </div>
                <div class="fsinstruction">
                    <img src="./assets/images/UI/Camera-Icon.svg" alt="Camera Icon" class="fsinstruction-icon">
                    <p class="fsinstruction-text">Give camera permissions</p>
                </div>
                <div class="fsinstruction">
                    <img src="./assets/images/UI/Save-Icon.svg" alt="Save Icon" class="fsinstruction-icon">
                    <p class="fsinstruction-text">Save to Home screen</p>
                </div>
            </div>
            <button id="got-it-button" >GOT IT</button>
            <div class="powered-by-container">
                <h3 id="powered-by-fullscreen">POWERED BY</h3>
                <img id="smartify-logo-fullscreen" src="./assets/images/UI/Smartify-logo-Black.svg" alt="Smartify Logo" width="75" height="34">
            </div>
        </div>
    </div>

    <!-- Help overlay page -->
    <div id="help-overlay" class="overlay" style="display: none;">
        <div class="overlay-content">
            <div class="help-instruction">
                <img src="./assets/images/UI/move-icon.png" alt="Move Icon" class="help-icon">
                <div class="help-text">
                    <h2>Move Around</h2>
                    <p>Use your camera to find the photograph</p>
                </div>
            </div>
            <div class="help-instruction">
                <img src="./assets/images/UI/zoom-icon.png" alt="Zoom Icon" class="help-icon">
                <div class="help-text">
                    <h2>Zoom</h2>
                    <p>Touch and pinch your screen</p>
                </div>
            </div>
            <div class="help-instruction">
                <img src="./assets/images/UI/pan-icon.png" alt="Pan Icon" class="help-icon">
                <div class="help-text">
                    <h2>Pan</h2>
                    <p>Touch and drag with your finger</p>
                </div>
            </div>
            <button id="close-help-overlay" class="overlay-button"></button>
        </div>
    </div>

    <!-- Congratulations overlay page -->
    <div class="overlay" id="congratulations-overlay" style="display: none;">
        <div class="popup-content">
            <img src="./assets/images/UI/congrats-icon.svg" class="congrats-image" alt="Congratulations Icon">
            <h2 class="pop-up-header">Continue exploring</h2>
            <p class="congrats-text">
                There are eight photographs to find in locations across Tower Bridge - look for the QR codes on the exhibition displays on the pavements.<br>
                Visit our website to find out more: <a href="https://heritage.towerbridge.org.uk" target="_blank">heritage.towerbridge.org.uk</a>
            </p>
            <button id="continue-button">Continue to next image</button>
            <button id="back-button">Go back to previous image</button>
            <button id="close-congrats-overlay" class="close-button"></button>
        </div>
    </div>
  
    <!-- Map overlay -->
    <div id="map-overlay" class="overlay" style="display: none;">
        <div class="overlay-background"></div>
        <div class="overlay-content">
            <img src="./assets/images/UI/Map-placeholder.jpg" alt="Map Image" class="map-image">
            <button id="close-map-overlay" class="overlay-button">Close</button>
        </div>
    </div>
  
    <!--Background audio -->
    <audio id="background-audio" preload="auto" loop crossorigin="anonymous">
        <source src="./assets/audio/background2.mp3" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>
    
    <div class="centered instructions"></div>
    <a-scene id="ar-scene" vr-mode-ui="enabled: false" embedded arjs="debugUIEnabled: false;" style="display:none;">
        <a-light type="ambient" color="#ffffff"></a-light>
        <a-light type="directional" color="#ffffff" position="-2 4 5"></a-light>
        <a-entity camera look-controls position="0 1.6 0"></a-entity>
        <a-image id="look_1" position="0 0 0" rotation="0 0 0" scale="14 4 1" visible="false"></a-image>
    </a-scene>
  
    <div class="icon-buttons">
        <button id="view-map" class="icon-button">
            <img src="./assets/images/UI/map-icon.svg" alt="Map button" class="button-icon"> Map
        </button>
        <button id="mute" class="icon-button">
            <img src="./assets/mute-icon.svg" alt="Mute button" class="button-icon"> Mute
        </button>
        <button id="refresh" class="icon-button">
            <img src="./assets/images/UI/refresh-icon.svg" alt="Refresh button" class="button-icon"> Refresh
        </button>
        <button id="help" class="help-button">
            <img src="./assets/images/UI/help-icon.svg" alt="help button" class="button-icon"></button>
    </div>
    <div class="centered">
        <button data-action="change">
          <img src="./assets/images/UI/Button.svg" alt="Change Media Button" class="change-media-icon">      
        </button>
    </div>

    <script>
        
      
        document.addEventListener("DOMContentLoaded", function() {
            const startExperienceButton = document.getElementById('start-experience');
            const gotItButton = document.getElementById('got-it-button');
            const overlay = document.getElementById('overlay');
            const fullScreenOverlay = document.getElementById('full-screen-overlay');
            const arScene = document.getElementById('ar-scene');

            startExperienceButton.addEventListener('click', function() {
                overlay.style.display = 'none';
                fullScreenOverlay.style.display = 'flex';
            });

            gotItButton.addEventListener('click', function() {
                fullScreenOverlay.style.display = 'none';
                arScene.style.display = 'block';
                requestPermissionsAndStartAR();
            });

            function requestPermissionsAndStartAR() {
                initializeAR();
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
                        initializeMedia(data[locationId].media);
                    })
                    .catch((error) => console.error("Error loading media config:", error));
            }
        });
    </script>
    <script src="./Scripts/ar.js"></script>
</body>
</html>
