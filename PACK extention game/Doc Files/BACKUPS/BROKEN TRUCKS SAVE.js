document.addEventListener("DOMContentLoaded", function () {
    const screen = document.getElementById("popup-container");
    const start = Date.now();
    console.log(start);

    //-----------------------------GLOBAL VARIABLES-----------------------------\\

    var tileEntryExit = [];





    //-----------------------------GLOBAL VARIABLES-----------------------------\\

    function getPlayTime() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['totalSavedTime'], function(result) {
                const savedTime = parseInt(result.totalSavedTime) || 0;
                const playTime = Date.now() - start;
                const totalTimePlayed = playTime + savedTime;
                
                chrome.storage.local.set({ totalSavedTime: totalTimePlayed }, function() {
                    resolve(totalTimePlayed);
                });
            });
        });
    }

    // Function to load the title screen
    function loadTitleScreen() {
        document.body.style.backgroundColor = "#3a4b52"; // Title screen background

        screen.innerHTML = `
            <div id="background-container"></div>
            <div class="start-container">
                <img id="title" src="/assets/title.png" alt="PACK Game">
            </div>
            <img id="settings" src="/assets/PACKlogo48.png" alt="Settings">
            <p id="version">PACK v1.4 by <a href="https://chromewebstore.google.com/search/rewy?hl=en-US" target="_blank" rel="noopener noreferrer">Rewy</a></p>
            <div id="settingsPopup"></div>
        `;

        // Add event listener to make the "PACK" image clickable
        document.getElementById("title").addEventListener("click", loadGameScreen);
        document.getElementById("settings").addEventListener("click", loadSettingsScreen);
        fallingPackagesInterval = setInterval(createFallingPackage, 600); // Generate packages at intervals (this part handles falling packages)
    }

    // Function to load the game screen
    function loadGameScreen() {
        document.body.style.backgroundColor = "#dbdbdb"; // Light grey background for game

        screen.innerHTML = `
            <div class="game-container"></div>
            <div id="tile-container"></div>
            <div id="structure-container"></div>
            <div id="vignette"></div>
            <div id="loadingAnimation"></div>
            <div id="savedMessage" style="display: none;">Saved!</div>
            <div id="currentMissionOverlay">
                <div class="content-wrapper">
                    <div class="difficulty-indicator na"></div>
                    <span class="mission-name">No Mission</span>
                    <div class="mission-counter">
                        <span class="delivered">0</span>
                        <span class="divider">/</span>
                        <span class="needed">0</span>
                    </div>
                </div>
            </div>
            <div id="popUpBox">
                <div id="missions"></div>
                <img id="settings" src="/assets/PACKlogo48.png" alt="Settings">
                <div id="settingsPopup"></div>
            </div>
        `;

        // Initialize game grid or any game-specific logic here
        clearInterval(fallingPackagesInterval);
        document.getElementById("settings").addEventListener("click", loadSettingsScreen);
        document.getElementById("missions").addEventListener("click", openMissions);
        img = ''
        document.documentElement.style.setProperty('--colour', '#bebebe83');
        document.documentElement.style.setProperty('--img', `${img}`);
        createTileGrid(10, 14);  // Initialize grid for the full screen
        pickStructure();
        document.documentElement.style.setProperty('--pop', 0);
        document.addEventListener("mousemove", (event) => {
            document.documentElement.style.setProperty('--pop', 1);
            let mouseY = event.y;
            let mouseX = event.x;
            menuPopup(mouseY);
            dropdownstuctures(mouseY);
            openCurrentMission(mouseX, mouseY);
        });
    }

    // Load the title screen first
    loadTitleScreen();

    function createTileGrid(rows, cols) {
        const tileContainer = document.getElementById('tile-container');
        tileContainer.innerHTML = '';

        let mouseIsDown = false;

        tileContainer.addEventListener('mousedown', (event) => {
            mouseIsDown = true;
            event.preventDefault();
        });

        tileContainer.addEventListener('mouseup', () => {
            mouseIsDown = false;
        });

        // Default to empty if no saved data

        let savedTiles = loadData();
        console.log("Last Save:", savedTiles);

        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {

                const tile = document.createElement('div');

                tile.classList.add('tile');
                tile.dataset.row = r;
                tile.dataset.col = c;

                // Create the preview element
                const preview = document.createElement('div');
                preview.classList.add('tile-preview');
                tile.appendChild(preview);

                tile.addEventListener('click', () => {
                    handleTileClick(r, c);
                });

                tile.addEventListener('mouseenter', () => {
                    if (mouseIsDown) {
                        handleTileClick(r, c);
                    }
                    updatePreview(r, c); // Update preview on hover
                });

                tileContainer.appendChild(tile);
            }
        }    
    }

    // Default missions data
    const defaultMissions = [
        { id: 0, name: "janet", amount: 3, type: "files", difficulty: 1},
        { id: 1, name: "david", amount: 5, type: "files", difficulty: 2},
        { id: 2, name: "nat", amount: 12, type: "files", difficulty: 3}
    ];
    
    // Save function
    function saveMissions(missions) {
        chrome.storage.local.set({ missions: missions });
    }
    
    // Load function
    function loadMissions(callback) {
        chrome.storage.local.get(['missions'], function(result) {
        callback(result.missions || defaultMissions);
        });
    }

  // Main function
  function openMissions() {
        // First check if overlay already exists
        if (document.getElementById("missions-overlay")) {
        document.getElementById("missions-overlay").remove();
        return;
        }
        
        // Remove settings overlay if it exists
        if (document.getElementById("settings-overlay")) {
        document.getElementById("settings-overlay").remove();
        }
        
        // Load missions and create UI
        loadMissions(function(missions) {
        const missionsOverlay = document.createElement("div");
        missionsOverlay.id = "missions-overlay";
        
        const buttonsContainer = document.createElement("div");
        buttonsContainer.id = "missions-buttons-container";
    
        missions.forEach(mission => {
            const missionButton = document.createElement("button");
            missionButton.className = "mission-button";
            missionButton.textContent = `Order from ${mission.name} | ${mission.amount} ${mission.type}`;
            
            missionButton.addEventListener("click", () => {
                setCurrentMission(mission);
                console.log("Selected mission:", mission.id);

            });
    
            buttonsContainer.appendChild(missionButton);
        });
    
        missionsOverlay.appendChild(buttonsContainer);
        document.body.appendChild(missionsOverlay);
        });
    }

    let currentMission = null;
    let deliveredCount = 0;

    function setCurrentMission(mission) {
        const overlay = document.getElementById('currentMissionOverlay');
        const difficultyIndicator = overlay.querySelector('.difficulty-indicator');
        
        // Set difficulty color (add your own logic for difficulty levels)
        difficultyIndicator.className = 'difficulty-indicator ' + getDifficultyClass(mission.difficulty);

        currentMission = mission;
        // deliveredCount = 0; // Reset counter when mission changes // ONLY RESET COUNT WHEN MISSION COMPLETE
        updateMissionDisplay();

        // Example difficulty mapping function
        function getDifficultyClass(difficulty) {
            switch(difficulty) {
                case 1: return 'easy';
                case 2: return 'medium';
                case 3: return 'hard';
                default: return 'na';
            }
        }
    }

    function updateMissionDisplay() {
        if (!currentMission) return;
        
        const overlay = document.getElementById('currentMissionOverlay');
        const counter = overlay.querySelector('.mission-counter');

        overlay.querySelector('.delivered').textContent = deliveredCount;
        overlay.querySelector('.needed').textContent = currentMission.amount;
        overlay.querySelector('.mission-name').textContent = currentMission.name;

        const counterWidth = counter.offsetWidth; // Width + margin
        const minPeek = 16; // Minimum visible peek
        const maxHidden = 256 - Math.max(minPeek, counterWidth);
        
         // Store this value for the openCurrentMission function
        overlay.dataset.hiddenPosition = `-${maxHidden}px`;
        
        // Change color when completed
        const deliveredEl = overlay.querySelector('.delivered');
        const neededEl = overlay.querySelector('.needed');
        deliveredEl.style.color = deliveredCount >= currentMission.amount 
            ? "#00ff00" // Green when complete
            : "#ffcc00"; // Yellow when in progress
        neededEl.style.color = deliveredCount >= currentMission.amount 
        ? "#00ff00" // Green when complete
        : "#00ccff"; // Blue when in progress
    }

    // Call this whenever a file is delivered
    function incrementDelivered() {
        if (!currentMission) return;
        deliveredCount++;
        updateMissionDisplay();

        const effect = document.createElement('div');
        effect.className = 'delivery-effect';
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
    }

    function resetFiles() {
        deliveredCount = 0;
        updateMissionDisplay();
    }

    function openCurrentMission(mouseX, mouseY) {
        const currentMissionOverlay = document.getElementById("currentMissionOverlay");

        //code to set a px amount based on how many files are needed

        if (mouseX > 256 || mouseY < 64 || mouseY > 96) {
            // Use dynamically calculated hidden position
            currentMissionOverlay.style.left = currentMissionOverlay.dataset.hiddenPosition || "-212px";
        } else if (mouseX > 0 && mouseX < 20 && mouseY < 96 && mouseY > 64) {
            currentMissionOverlay.style.left = "-16px";
        }
    }

    function loadSettingsScreen() {
        const settings = document.getElementById("settings-overlay");
        const missions = document.getElementById("missions-overlay");
        // Check if the settings overlay already exists to prevent duplication
        if (settings) {
            settings.remove();
            return;
        }
        if (missions) {missions.remove()}
        
        // Create settings overlay
        const settingsOverlay = document.createElement("div");
        settingsOverlay.id = "settings-overlay";
        settingsOverlay.className = "settings-container";

        // Create buttons container
        const buttonsContainer = document.createElement("div");
        buttonsContainer.id = "buttons-container";

        const keybindsButton = document.createElement("button");
        keybindsButton.id = "settingsButtons";
        keybindsButton.textContent = "KeyBinds";
        keybindsButton.addEventListener("click", () => {
            openKeybinds();
        });

        const statsButton = document.createElement("button");
                statsButton.id = "settingsButtons";
                statsButton.textContent = "STATS";
                statsButton.addEventListener("click", () => {
                    openStats();
                });

        const mainMenuButton = document.createElement("button");
        mainMenuButton.id = "settingsButtons";
        mainMenuButton.textContent = "Main Menu";
        mainMenuButton.addEventListener("click", () => {
            settingsOverlay.remove(); // Remove overlay when clicking "Close"
            loadTitleScreen();
        });

        const resetButton = document.createElement("button");
        resetButton.id = "settingsButtons";
        resetButton.textContent = "Reset Game";
        resetButton.addEventListener("click", () => {
            alert("All Data Will Be Lost!!!");
            document.getElementById("resetGameButton").classList.add("active");
        });

        const trueResetButton = document.createElement("button");
        trueResetButton.id = "resetGameButton";
        trueResetButton.textContent = "RESET!";
        trueResetButton.addEventListener("click", () => {
            trueResetButton.classList.remove("active");
            settingsOverlay.remove(); // Remove overlay when clicking "Close"
            resetGame();
            loadTitleScreen();
        });

        buttonsContainer.appendChild(keybindsButton);
        buttonsContainer.appendChild(statsButton);
        buttonsContainer.appendChild(mainMenuButton);
        buttonsContainer.appendChild(resetButton);
        buttonsContainer.appendChild(trueResetButton);
        settingsOverlay.appendChild(buttonsContainer);

        // Append the overlay to the body
        document.body.appendChild(settingsOverlay);
    }

    function resetGame() {
        chrome.storage.local.clear();
    }

    let currentHoveredTile = null;

    // Add these event listeners to your tiles when they're created
    function setupTileHoverEvents() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.addEventListener('mouseenter', () => {
                currentHoveredTile = tile;
            });
            tile.addEventListener('mouseleave', () => {
                currentHoveredTile = null;
            });
        });
    }

    function erase() {
        console.log("erase");
        selectedRotation = 0;
        flip = 0;
        const hoveredTile = document.querySelector('.tile:hover');
        const row = hoveredTile.dataset.row;
        const col = hoveredTile.dataset.col;
        const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const preview = tile.querySelector('.tile-preview');
        preview.style.backgroundImage = '';
        deleteTile(tile);
    }

    let keybinds = [
        { key: "e", description: "delete tile", action: () => {
            // Get the row and column of the currently hovered tile
            erase()
        }},
        { key: "t", description: "next tile", action: () => {
            si = (si + 1) % sheetIndex;
            document.documentElement.style.setProperty('--index', (-si * 32) + "px");
        }},
        { key: "s", description: "save game", action: saveTileData },
        { key: ",", description: "NA", action: moveCameraLeft },
        { key: ".", description: "NA", action: moveCameraRight },
        { key: "r", description: "rotate tile", action: () => {
            if (img === "url('../assets/ROADS.png')") {
                rotation = (rotation + 90) % 360;
                rotateTile(rotation);   
            }
        }},
        { key: "u", description: "flip tile", action: () => {
            if (img === "url('../assets/ROADS.png')") flipTile();
        }},
        { key: "1", description: "equip tile 1", action: () => {
            setTile(0);
        }},
        { key: "2", description: "equip tile 2", action: () => {
            setTile(1);
        }},
        { key: "3", description: "equip tile 3", action: () => {
            setTile(2);
        }},
        { key: "4", description: "equip tile 4", action: () => {
            setTile(3);
        }},
        { key: "5", description: "equip tile 5", action: () => {
            setTile(4);
        }},
        { key: "6", description: "equip tile 6", action: () => {
            setTile(5);
        }},
        { key: "7", description: "equip tile 7", action: () => {
            setTile(6);
        }},
        { key: "g", description: "Deliver File", action: () => {
            incrementDelivered();
        }},
        { key: "h", description: "Clear Files", action: () => {
            resetFiles();
        }},
        { key: "l", description: "Tile Check", action: () => {
            const DATA = tileCheck();
            console.log("THIS IS THE END: ", DATA);
        }},
        { key: "o", description: "toggle coordinates", action: () => {
            toggleCoordinates();
        }},
    ];

    let showCoordinates = false;

    function toggleCoordinates() {
        showCoordinates = !showCoordinates;
        const tiles = document.querySelectorAll('.tile');
        
        tiles.forEach(tile => {
            const row = tile.dataset.row;
            const col = tile.dataset.col;
            
            if (showCoordinates) {
                // Create or show coordinate display
                let coordDisplay = tile.querySelector('.coordinate-display');
                if (!coordDisplay) {
                    coordDisplay = document.createElement('div');
                    coordDisplay.className = 'coordinate-display';
                    coordDisplay.textContent = `${row},${col}`;
                    tile.appendChild(coordDisplay);
                } else {
                    coordDisplay.style.display = 'block';
                }
            } else {
                // Hide coordinate display
                const coordDisplay = tile.querySelector('.coordinate-display');
                if (coordDisplay) {
                    coordDisplay.style.display = 'none';
                }
            }
        });
    }

    function openKeybinds() {
        const background = document.getElementById("buttons-container");
        const keybindsContainer = document.createElement("keybinds-container");
        const statscontainer = document.getElementById("stats-container");
        keybindsContainer.id = "keybinds-container";
        const keybindscontainer = document.getElementById("keybinds-container");
        if (keybindscontainer) {
            keybindscontainer.remove();
            return;
        }
        if (statscontainer) {statscontainer.remove()}
        keybinds.forEach(bind => {
            const bindElement = document.createElement("div");
            bindElement.style.color = "#ffffff";
            bindElement.textContent = `Key: ${bind.key.toUpperCase()} - Action: ${bind.description || "Custom Function"}`;
            keybindsContainer.appendChild(bindElement);
        background.appendChild(keybindsContainer);
            });
    }

    async function openStats() {
        try {
            const background = document.getElementById("buttons-container");
            const playTime = await getPlayTime();
            const statsContainer = document.createElement("div");
            const keybindscontainer = document.getElementById("keybinds-container");
            statsContainer.id = "stats-container";
            const existingStatsContainer = document.getElementById("stats-container");
            
            if (existingStatsContainer) {
                statsOpen = false;
                existingStatsContainer.remove();
                return;
            }
            if (keybindscontainer) {
                keybindscontainer.remove();
            }
        
            let filesDelivered = 156;
            let packagesDelivered = 37;
            let ordersFulfilled = 12;
            let tilesPlaced = 237;
            let totalMinutesPlayed = playTime / 60000;
            let timeH = parseInt(totalMinutesPlayed / 60);
            let timeM = parseInt(totalMinutesPlayed % 60);
            let timePlayed = `${timeH}h ${timeM}m`;
        
            const stats = [
                {name: "Files Delivered", statistic: filesDelivered},
                {name: "Packages Delivered", statistic: packagesDelivered},
                {name: "Orders Fulfilled", statistic: ordersFulfilled},
                {name: "Tiles Placed", statistic: tilesPlaced},
                {name: "Time Played", statistic: timePlayed},
            ];

            stats.forEach(stat => {
                const bindElement = document.createElement("div");
                bindElement.style.color = "#ffffff";
                bindElement.textContent = `${stat.name} : ${stat.statistic || "No Current Stats"}`;
                statsContainer.appendChild(bindElement);
            }); background.appendChild(statsContainer)
            
        } catch (error) {
            console.error("Error loading stats:", error);
            // Fallback with default values if needed
        }
    }

    function updatePreview(row, col) {
        const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (tile) {
        const preview = tile.querySelector('.tile-preview');
        preview.style.backgroundImage = img;
        preview.style.backgroundPosition = `var(--index) 0px`;
        }
    }

    var spriteSize = 32;
    var sheetSize = 256;
    var sheetIndex = sheetSize/spriteSize;

    function dropdownstuctures(mouseY) {
        const pick = document.getElementById("structure-container")
            if (mouseY > 5) {
                pick.style.top = "-64px";
            } if (mouseY < 34) {
                pick.style.top = "0px";
            }
        }

    function pickStructure() {

        const pick = document.getElementById("structure-container");
        pick.innerHTML = ""; // Clear previous buttons

        document.documentElement.style.setProperty('--sheetSize', sheetSize + "px");

        for (let i = 0; i < sheetIndex; i++) {
            const pos = -(i * spriteSize);

            const button = document.createElement("img");
            button.classList.add("setSpriteButtons");
            button.style.backgroundImage = `url("../assets/ROADS.png")`;
            button.style.backgroundPosition = `${pos}px 0px`;
            button.dataset.pos = pos;

            button.addEventListener("click", () => {
                activeButton(button);
                console.log("active:", i);
                if (i != 7) {
                    setTile(i);
                    erase();
                } else {
                    erase();
                }
                
            });

            pick.appendChild(button);
        }
    }

    function activeButton(button) {
        document.querySelectorAll(".setSpriteButtons").forEach(b => b.classList.remove("active"));
        button.classList.add("active");
    }


    function handleTileClick(row, col) {
        let r = selectedRotation + "deg";
        let f = flip + "deg";
        const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        tile.style.transform = `rotate(${r}) rotateY(${f})`; //transform individual tiles
        setTileSprite(row, col, si); // Set first sprite from the spritesheet
    }

    function setTileSprite(row, col, spriteIndex) {
        const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (tile) {

            const spriteX = -(spriteIndex * 32); // Move left by 32 pixels per sprite
            tile.style.backgroundImage = img; // Set spritesheet
            tile.style.backgroundPosition = `${spriteX}px 0px`; // Position it to the correct sprite
            tile.style.backgroundSize = `${sheetSize}px auto`; // Keep original scaling, just shift position
            tile.style.width = "32px"; // Tile size
            tile.style.height = "32px"; // Tile size
            tile.style.backgroundRepeat = "no-repeat"; // Prevent tiling
        }
    }

    function rotateTile() {
        selectedRotation = rotation; // Update selected rotation
        document.documentElement.style.setProperty('--rot', rotation + "deg");  
    }

    function deleteTile(tile) {
        document.documentElement.style.setProperty('--colour', '#c7616183');
        const preview = tile.querySelector('.tile-preview');
        img = '';
        // Reset all relevant CSS properties
        tile.style.backgroundImage = '';
        tile.style.backgroundPosition = '';
        preview.style.transform = ''; // Reset rotation and flip
    }

    function flipTile() {
        if (flip == 0) {
            flip = 180;
            document.documentElement.style.setProperty('--flip', flip + "deg");
        } else {
            flip = 0;
            document.documentElement.style.setProperty('--flip', flip + "deg");
        }
    }

    function moveCameraLeft() {
        document.documentElement.style.setProperty('--moveX', 32 + "px");
        document.documentElement.style.setProperty('--pop', 0);
    }
    function moveCameraRight() {
        document.documentElement.style.setProperty('--moveX', -32 + "px");
        document.documentElement.style.setProperty('--pop', 1);
    }

    function saveTileData() {
        const tiles = document.querySelectorAll('.tile');
        const tileData = [];

        document.documentElement.style.setProperty('--load', "url('../assets/LoadingBox.gif')");

        // Start the animation
        const animationInterval = 3;

        tiles.forEach(tile => {
            const row = tile.dataset.row;
            const col = tile.dataset.col;
            const backgroundImage = tile.style.backgroundImage;
            const backgroundPosition = tile.style.backgroundPosition;
            const transform = tile.style.transform;

            tileData.push({
                row: row,
                col: col,
                backgroundImage: backgroundImage,
                backgroundPosition: backgroundPosition,
                transform: transform,
            });
        });

        setTimeout(() => {
            clearInterval(animationInterval);
            document.documentElement.style.setProperty('--animIndex', '0px 0px');
            document.getElementById('loadingAnimation').style.display = 'none'; // Hide animation
            document.getElementById('savedMessage').style.display = 'block'; // Show message

            // Hide the "Saved" message after a short delay
            setTimeout(() => {
                document.getElementById('savedMessage').style.display = 'none';
                document.getElementById('loadingAnimation').style.display = 'block';//show animation again.
                document.documentElement.style.setProperty('--load', "");
            }, 1000); // 2 seconds
        }, 2000);

        console.log('game saved', tileData);
        saveGame(tileData);
        return tileData;
    }

    function saveGame(tileData) {
        chrome.storage.local.set({ tileData: tileData }, function() {
            console.log("Tile data saved!");
        });
    }

    function loadData() {
        chrome.storage.local.get(["tileData"], function(result) {
            if (result.tileData) {
                console.log("Tile data loaded:", result.tileData);
                loadSave(result.tileData);
            } else {
                console.log("No saved tile data found.");
                return; // Return null if no data found
            }
        });
    }

    function loadSave(lastSave) {
        if (!lastSave || !Array.isArray(lastSave)) {
            console.error("lastSave is not loaded or not an array", lastSave);
            return;
        }
        
        lastSave.forEach(data => {

            const tile = document.querySelector(`[data-row="${data.row}"][data-col="${data.col}"]`);
            if (tile) {

                tile.style.backgroundImage = `${data.backgroundImage}`; // Set spritesheet
                tile.style.backgroundPosition = `${data.backgroundPosition}`; // Position it to the correct sprite
                tile.style.transform = `${data.transform}`; //WRONG!!
            }
        });  
    }

    function setTile(i) {
        document.documentElement.style.setProperty('--colour', '#bebebe83');

        img = "url('../assets/ROADS.png')";
        document.documentElement.style.setProperty('--img', `${img}`);
        let ind = -(i * 32); // %sheetIndex set to number of sprites
        si = i;
        document.documentElement.style.setProperty('--index', ind + "px");
        document.documentElement.style.setProperty('--flip', flip + "deg");
        document.documentElement.style.setProperty('--rot', rotation + "deg");
    }

    var rotation = 0;
    var selectedRotation = 0; // Add selectedRotation
    var flip = 0;
    var img = "url('../assets/ROADS.png')";
    var si = 0;

    document.addEventListener("keydown", (event) => {
        console.log("Key pressed:", event.key);

        // Find the keybind in the array
        let keybind = keybinds.find(bind => bind.key === event.key.toLowerCase());
        
        if (keybind) {
            keybind.action(); // Execute assigned function
        }

        // Ensure the image is always updated
        document.documentElement.style.setProperty('--img', `${img}`);
    });

    function menuPopup(mouseY) {
        document.getElementById("popUpBox");
        if (mouseY > 464) {
            popUpBox.style.bottom = "0px";
        } if (mouseY < 402) {
            popUpBox.style.bottom = "-64px";
        }
    }

    // Function to create falling packages
    function createFallingPackage() {
        const packageElement = document.createElement("div");
        packageElement.classList.add("package");

        // Random starting position
        packageElement.style.left = Math.random() * window.innerWidth + "px"; // Random position across the screen

        // Random animation duration for variety
        let duration = Math.random() * 3 + 2; // Between 2 and 5 seconds
        packageElement.style.animationDuration = `${duration}s`;

        document.getElementById("background-container").appendChild(packageElement);

        // Remove package after animation ends
        setTimeout(() => {
            packageElement.remove();
        }, duration * 1000);
    }

    function tileCheck() {
        const tiles = document.querySelectorAll('.tile');  
        const tileTypes = []; 
        const allTiles = []; 
        const newTileData = [];
        const finalTileData = new Set();
        let loop = 0;
        
        tiles.forEach(tile => {
            loop += 1;
            const row = tile.dataset.row;
            const col = tile.dataset.col;
            const backgroundImage = tile.style.backgroundImage;
            const backgroundPosition = tile.style.backgroundPosition;
            const transform = tile.style.transform;
            const matches = transform ? transform.match(/\d+/g) : null;
            const [rot, flip] = matches || [0, 0];
            getTileEntryExits(tiles, row, col, backgroundImage, backgroundPosition, rot, flip);

            tileTypes.push({
                row: row,
                col: col,
                tileEntryExit: tileEntryExit[0],
            });

            if (loop == 140) {
                let loop2 = 0;
                tileTypes.forEach(tile => {
                    loop2 += 1;
                    console.log(loop2);
                    if (tile.tileEntryExit){
                        const row = tile.row;
                        const col = tile.col;
                        const entry = tile.tileEntryExit.entry;
                        const exit = tile.tileEntryExit.exit;
                        const name = tile.tileEntryExit.name;
                        const adjacent = getAdjacentTiles(tile.row, tile.col, tileTypes);
                        const allAdjacentTiles = adjacent.map(tile => ({
                            row: tile.row, 
                            col: tile.col, 
                            entry: tile.entry, 
                            exit: tile.exit, 
                            name: tile.name,
                            dir: tile.dir
                          })); 
                        const type = getTileType(row, col, entry, exit, name, allAdjacentTiles, adjacent);

                        allTiles.push({
                            row: row,
                            col: col,
                            entry: entry,
                            exit, exit,
                            name: name,
                            type: type,
                        });
                    }

                    if (loop2 == 140) {
                        console.log("loop2 done");
                        console.log("allTiles: ", allTiles);
                        allTiles.forEach(tile => {
                            const newAdjacent = getAdjacentTiles(tile.row, tile.col, allTiles);
                            newTileData.push({
                                row: tile.row,
                                col: tile.col,
                                name: tile.name,
                                type: tile.type,
                                entry: tile.entry,
                                exit: tile.exit,
                                adjacent: newAdjacent.map(tile => ({
                                    row: tile.row,
                                    col: tile.col,
                                    name: tile.name,
                                    type: tile.type,
                                    entry: tile.entry,
                                    exit: tile.exit,
                                    dir: tile.dir,
                                }))
                            });
                            const log = `Row: ${tile.row}, Col: ${tile.col}, Name: ${tile.name}, Type: ${tile.type}, Entry: ${tile.entry}, Exit: ${tile.exit}, Adjacent: ${newAdjacent.map(tile => `[row: ${tile.row}, col: ${tile.col}, name: ${tile.name}, type: ${tile.type}, dir: ${tile.dir}, entry: ${tile.entry}, exit: ${tile.exit}]`).join(' | ')}`;                      
                            console.log(log);
                            
                            tilePathFinder(newTileData)
                        });
                    }
                });
            }    
        });
        return newTileData;
    }
    
    function getTileEntryExits(tiles, row, col, backgroundImage, backgroundPosition, rot, flip) {

        var tileType = "na";
        tileEntryExit = [];

        let entryDirections = [];
        let exitDirections = [];

        // First, check if this is a road tile (types 0-2 in your spritesheet)
        const isRoadTile = backgroundImage.includes("ROADS.png") && 
                          (backgroundPosition.includes("0px 0px") ||  // straight
                           backgroundPosition.includes("-32px") || // turn
                           backgroundPosition.includes("-64px"));   // split  

        if (isRoadTile) {
            console.log("is road tile", row, ".", col);
            } else if (!isRoadTile) {
                // Handle factory and storage tiles
                if (backgroundImage.includes("ROADS.png")) {
                    console.log("NOT roadtile tile:", row, ".", col);
                
                    if (backgroundPosition.includes("-96px")) {
                        tileType = "package-factory";
                        entryDirections = [];
                        exitDirections = ["north", "east", "south", "west"];
                        // return ["package-factory"];
                    }
                    if (backgroundPosition.includes("-128px")) {
                        tileType = "files-factory";
                        entryDirections = [];
                        exitDirections = ["north", "east", "south", "west"];
                        // return ["files-factory"];
                    }
                    if (backgroundPosition.includes("-160px")) {
                        tileType ="files-storage";
                        entryDirections = ["north", "east", "south", "west"];
                        exitDirections = ["north", "east", "south", "west"];
                        // return ["files-storage"];
                    }
                    if (backgroundPosition.includes("-192px")) {
                        tileType = "package-storage";
                        entryDirections = ["north", "east", "south", "west"];
                        exitDirections = ["north", "east", "south", "west"];
                        // return ["package-storage"];
                    }
                    } else {
                        return []; // Not a relevant tile (empty or delete)
                        }   
            }
        
        // Get rotation in degrees (normalized to 0-360)
        const rotation = parseInt(rot) || 0;
        const isFlipped = (parseInt(flip) || 0) === 180;
        
        // Determine tile shape
        const isStraight = backgroundPosition.includes("0px 0px");  //STUPID ISSUE TOOK 8 HOURS TO FIND!!! all backgroundpos include 0px
        const isTurn = backgroundPosition.includes("-32px");
        const isSplit = backgroundPosition.includes("-64px");
        
        // Get direction(s) based on rotation and flip
        
        if (isStraight) {
            tileType = "straight";
            // Straight road: entry on right (east), exit on left (west)
            switch (rotation) {
                case 0: // 0° rotation
                    entryDirections = isFlipped ? "west" : "east";
                    exitDirections = isFlipped ? "east" : "west";
                    break;
                case 90: // 90° rotation
                    entryDirections = isFlipped ? "north" : "south";
                    exitDirections = isFlipped ? "south" : "north";
                    break;
                case 180: // 180° rotation
                    entryDirections = isFlipped ? "east" : "west";
                    exitDirections = isFlipped ? "west" : "east";
                    break;
                case 270: // 270° rotation
                    entryDirections = isFlipped ? "south" : "north";
                    exitDirections = isFlipped ? "north" : "south";
                    break;
            }
        }
    
        else if (isTurn) {
            tileType = "turn";
            // Default turn logic for other tiles
            switch (rotation) {
                case 0:
                    entryDirections = isFlipped ? "west" : "east";
                    exitDirections = isFlipped ? "north" : "north";
                    break;
                case 90:
                    entryDirections = isFlipped ? "north" : "south";
                    exitDirections = isFlipped ? "east" : "east";
                    break;
                case 180:
                    entryDirections = isFlipped ? "east" : "west";
                    exitDirections = isFlipped ? "south" : "south";
                    break;
                case 270:
                    entryDirections = isFlipped ? "south" : "north";
                    exitDirections = isFlipped ? "west" : "west";
                    break;
            }
        }
    
        else if (isSplit) {
            tileType = "split";
            switch (rotation) {
                case 0: // 0° rotation
                    entryDirections = isFlipped ? ["west", "north"] : ["east", "north"];
                    exitDirections = isFlipped ? ["east"] : ["west"];
                    break;
                case 90: // 90° rotation
                    entryDirections = isFlipped ? ["north", "east"] : ["east", "south"];
                    exitDirections = isFlipped ? ["south"] : ["north"];
                    break;
                case 180: // 180° rotation
                    entryDirections = isFlipped ? ["east", "south"] : ["south", "west"];
                    exitDirections = isFlipped ? ["west"] : ["east"];
                    break;
                case 270: // 270° rotation
                    entryDirections = isFlipped ? ["south", "west"] : ["west", "north"];
                    exitDirections = isFlipped ? ["north"] : ["south"];
                    break;
            }
        }
    
        tileEntryExit.push({
            row: row,
            col: col,
            entry: entryDirections,
            exit: exitDirections,
            name: tileType,
        });
        
        const returnList = []

        returnList.push({
            tileType,
            entryDirections,
            exitDirections,
        })
        
        return returnList;
    }
    
    function getAdjacentTiles(row, col, tiles) {
        const adjacent = [];

        // Convert row & col to numbers (dataset values are strings)
        const currentRow = Number(row);
        const currentCol = Number(col);
        
        // Check each tile in the NodeList
        tiles.forEach(tile => {
            if (tile.tileEntryExit || tile.type) {
                const tileRow = Number(tile.row);  // Convert to number
                const tileCol = Number(tile.col);  // Convert to number
                const entry = tile.type ? tile.entry : tile.tileEntryExit.entry;
                const exit = tile.type ? tile.exit : tile.tileEntryExit.exit;
                const name = tile.type ? tile.name : tile.tileEntryExit.name;
                const tileType = tile.type ? tile.type : [];

                // Check if tile is adjacent (top, bottom, left, or right)
                const dir =
                    (tileRow === currentRow - 1 && tileCol === currentCol && "west") || // North
                    (tileRow === currentRow + 1 && tileCol === currentCol && "east") || // South
                    (tileRow === currentRow && tileCol === currentCol - 1 && "north") ||  // West
                    (tileRow === currentRow && tileCol === currentCol + 1 && "south");    // East

                if (dir) {
                    adjacent.push({
                        row: tileRow,
                        col: tileCol,
                        entry: entry,
                        exit: exit,
                        name: name,
                        dir: dir,
                        type: tileType,
                    });
                }
            }
        });
        
        return adjacent;
    }

    function oppDir(dir) {
        const opposites = { north: "south", south: "north", east: "west", west: "east" };
        return opposites[dir] || dir;
    }

    function isRoadTile(name) {
        if (name.includes("straight") || name.includes("turn") || name.includes("split")) {
            return true;
        } else {return false}
    }

    function getTileType(row, col, entry, exit, name, adjacent, adjacentList) {
        const types = new Set();
        const road = isRoadTile(name);
        const entry1 = (Array.isArray(entry) ? entry : [entry]);
        const exit1 = (Array.isArray(exit) ? exit : [exit]);
        adjacent.map(tile => {
            const a_row = tile.row;
            const a_col = tile.col;
            const a_entry = tile.entry;
            const a_exit = tile.exit;
            const a_name = tile.name;
            const a_dir = tile.dir;
            const a_road = isRoadTile(a_name);
            const a_entry2 = (Array.isArray(a_entry) ? a_entry : [a_entry]);
            const a_exit2 = (Array.isArray(a_exit) ? a_exit : [a_exit]);
            let type = '';

            console.log(`current tile: ${row}.${col}, ${name}, a_tile: ${a_row}.${a_col}, a_tiles: ${adjacent.map(tile => `${tile.row}.${tile.col}, ${tile.name} `)}`);

            entry1.some(en1 => {
                if (a_dir == en1) {
                    a_exit2.some(ex2 => {
                        if (oppDir(a_dir) == ex2) {
                            if (row == 0 || row == 9 || col == 1 || col == 13) {
                                if (road) {
                                    console.log(`${row}.${col} type: "end"`);
                                    type = "end";
                                }
                            }
                            else if (road && (a_name.includes("storage"))) {
                                console.log(`${row}.${col} type: "out"`);
                                type = "out";
                            }
                            else if (road && (a_name.includes("factory"))) {
                                console.log(`${row}.${col} type: "start"`);
                                type = "start";
                            }
                            else if (road && a_road) {
                                console.log(`${row}.${col} type: "connect"`);
                                type = "connect";
                            }    
                        }
                    })
                }
            })
            exit1.some(ex1 => {
                if (a_dir == ex1) {
                    a_entry2.some(en2 => {
                        if (oppDir(a_dir) == en2) {
                            if (road && a_name.includes("storage")) {
                                console.log(`${row}.${col} type: "in"`);
                                type = "in";
                            }
                            else if (name.includes("turn") && a_road) {
                                console.log(`${row}.${col} type: "connect"`);
                                type = "connect";
                            }
                        }
                    })
                }
            })
            types.add(type);
        });
        // tilePathFinder
        console.log("returning: ", types);
        const typesArray = Array.from(types);
        return typesArray;
    }

    // Forklift management system
    const forkliftManager = {
        forklifts: [],
        activeAnimations: new Map(),
        
        init(tileData) {
            this.clearAll();
            this.createForklifts(tileData);
        },
        
        clearAll() {
            document.querySelectorAll('.forklift').forEach(f => f.remove());
            this.activeAnimations.forEach(animation => {
                cancelAnimationFrame(animation);
            });
            this.activeAnimations.clear();
            this.forklifts = [];
        },
        
        createForklifts(tileData) {
            const startTiles = tileData.filter(tile => tile.type.includes("start"));
            
            startTiles.forEach(startTile => {

                const hasForklift = this.forklifts.some(f => 
                    f.row === startTile.row && f.col === startTile.col
                );
                
                if (!hasForklift) {
                    const tileContainer = document.getElementById('tile-container');
                    const forklift = document.createElement('div');
                    forklift.className = 'forklift';
                    
                    // Center the forklift on the tile (adjust 8px if needed)
                    const tileSize = 32;
                    const offset = (tileSize - 16) / 2; // For 16px forklift on 32px tile
                    const startDir = getTurnDir(startTile.exit);
                    const flip =
                        (startDir === 0 && 0) ||
                        (startDir === 90 && 0) ||
                        (startDir === 180 && 180) ||
                        (startDir === 270 && 180);
                    const transform = `rotate(${startDir}deg) rotateY(${flip}deg)`;
                    
                    forklift.style.left = `${startTile.row * tileSize}px`;
                    forklift.style.top = `${startTile.col * tileSize}px`;
                    forklift.style.transform = transform;
                    
                    tileContainer.appendChild(forklift);
                    
                    this.forklifts.push({
                        element: forklift,
                        row: startTile.row,
                        col: startTile.col,
                        path: this.findPath(startTile.row, startTile.col, tileData),
                        currentPathIndex: 0,
                        completeTrack : false,
                    });
                }
            });
            
            this.startMovement(tileData);
        },
        
        findPath(startRow, startCol, tileData, visited = new Set()) {
            const path = [];
            let currentTile = tileData.find(t => t.row == startRow && t.col == startCol);
            let reachesEdge = false;
            
            while (currentTile && !visited.has(`${currentTile.row},${currentTile.col}`)) {
                visited.add(`${currentTile.row},${currentTile.col}`);
                path.push({ 
                    row: currentTile.row, 
                    col: currentTile.col,
                    isEdge: currentTile.type.includes("end"),
                });

                if (currentTile.type.includes("end")) {
                    reachesEdge = true;
                    // break;
                }
                
                // Find first valid connected tile
                const nextTile = currentTile.adjacent.find(a_tile => {
                    const adjTile = tileData.find(t => t.row == a_tile.row && t.col == a_tile.col);
                    return adjTile && this.isConnected(currentTile, adjTile);
                });
                
                if (!nextTile) break;
                currentTile = tileData.find(t => t.row == nextTile.row && t.col == nextTile.col);
            }
            
            return reachesEdge ? path : []; // Only return valid paths to edges
        },
        
        isConnected(tile1, tile2) {
            if (!tile1 || !tile2) return false;

            const tile1Exit = Array.isArray(tile1.exit) ? tile1.exit : [tile1.exit];
            const tile2Entry = Array.isArray(tile2.entry) ? tile2.entry : [tile2.entry];

            return tile1Exit.some(exitDir => 
                tile2Entry.some(entryDir => 
                    this.getOppositeDirection(exitDir) === entryDir
                )
            );
        },
        
        getOppositeDirection(dir) {
            const opposites = { north: "south", south: "north", east: "west", west: "east" };
            return opposites[dir] || dir;
        },
        
        startMovement(tileData) {
            this.forklifts.forEach(forklift => {
                if (forklift.path.length > 1) {
                    this.animateForklift(forklift, tileData);
                }
            });
        },
        
        animateForklift(forklift, allTiles) {
            const tileSize = 32;
            const speed = 0.5; // tiles per second
            
            let startTime = performance.now();
            
            const animate = (timestamp) => {
                if (!forklift.element.isConnected) {
                    return; // Stop if forklift was removed
                }
                
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / (1000 / speed), 1);
                
                if (forklift.currentPathIndex < forklift.path.length - 1) {
                    const current = forklift.path[forklift.currentPathIndex];
                    const next = forklift.path[forklift.currentPathIndex + 1];
                    
                    // Calculate intermediate position
                    const offset = (tileSize - 16) / 2;
                    const x = current.row * tileSize + (next.row - current.row) * progress * tileSize + offset;
                    const y = current.col * tileSize + (next.col - current.col) * progress * tileSize + offset;
                    const tile = allTiles.find(t => t.row === next.row && t.col === next.col);
                    const turnDir = getTurnDir(tile.exit);
                    
                    forklift.element.style.left = `${x}px`;
                    forklift.element.style.top = `${y}px`;
                    
                    if (progress >= 1) {
                        // forklift.classList.add("moving");
                        if (tile){
                            const transform = `rotate(${turnDir}deg) scale(2)`;
                            console.log("TURNING...", transform);
                            forklift.element.style.transform = transform;

                            if (tile.type.includes("end")) {
                                incrementDelivered();
                                forklift.element.remove();
                                this.activeAnimations.delete(forklift.element);
                                return;
                            }
                        }
                        forklift.currentPathIndex++;
                        forklift.row = next.row;
                        forklift.col = next.col;
                        startTime = timestamp;
                        
                        if (forklift.currentPathIndex >= forklift.path.length - 1) {
                                
                                // Only respawn this forklift if it reached the end
                            const newPath = this.findPath(forklift.row, forklift.col, allTiles);
                            
                            if (newPath.length > 1) {
                                // Reset this forklift's path
                                forklift.path = newPath;
                                forklift.currentPathIndex = 0;
                                startTime = performance.now(); // Reset animation timer
                                this.activeAnimations.set(forklift.element, requestAnimationFrame(animate));
                                return;
                            }
                        }
                        // If not respawning, remove the forklift
                        // forklift.classList.remove('moving');
                        forklift.element.remove();
                        this.activeAnimations.delete(forklift.element);
                        
                        // Remove from forklifts array
                        const index = this.forklifts.findIndex(f => f.element === forklift.element);
                        if (index !== -1) {
                            this.forklifts.splice(index, 1);
                        } return;
                    }
                    
                    this.activeAnimations.set(forklift.element, requestAnimationFrame(animate));
                }
            };
            
            this.activeAnimations.set(forklift.element, requestAnimationFrame(animate));
        }
    };

    function getTurnDir(dir) {
        const newDir = { "north": "90", "south": "180", "east": "270", "west": "0" };
        return newDir[dir];
    }

    // Updated spawnForklift function
    function spawnForklift(tileData) {
        forkliftManager.init(tileData);
    }

    // Updated tilePathFinder function
    function tilePathFinder(tileData) {
        console.log("tilePathFinder Running...");
        spawnForklift(tileData);
        return tileData;
    }

    function logForkliftPaths() {
        forkliftManager.forklifts.forEach((forklift, i) => {
            console.log(`Forklift ${i} path:`);
            forklift.path.forEach((step, j) => {
                console.log(`  Step ${j}: [${step.row},${step.col}] ${step.isEdge ? '(EDGE)' : ''}`);
            });
        });
    }

});