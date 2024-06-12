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
        const audio = document.getElementById('background-audio');
        audio.play();
    });

    // Apply unselectable class to relevant elements
    document.querySelectorAll('.button-text, h1-1, h1-2, h2, p, button').forEach(el => el.classList.add('unselectable'));
};
