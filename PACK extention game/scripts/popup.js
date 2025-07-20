document.addEventListener("DOMContentLoaded", function () {
    const screen = document.getElementById("popup-container");
    const start = Date.now();
    console.log(start);

    //-----------------------------GLOBAL VARIABLES-----------------------------\\
    let gameState = false;
    var tileEntryExit = [];
    var newTileData = [];
    const totalStats = new Map();
    let adminMode = false;
    let missionsCompleted = 0;
    let showCoordinates = false;
    let placed = 0;
    let completeMissions = 0;
    const saveStats = [];
    let coins = 0;
    let align = 0;
    let colourMode = "light";

    chrome.storage.local.get([])
    let fileSize = 1;
    let packageSize = 2;
    let truckSize = 1;
    let vehicleSpeed = 1;

    let lockedButtons = [1, 2, 4, 5, 6];

    //-----------------------------GLOBAL VARIABLES-----------------------------\\

    // Check if a button is locked
    function isButtonLocked(buttonIndex) {
        return lockedButtons.includes(buttonIndex);
    }

    function getPlayTime() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['totalSavedTime'], function(result) {
                const savedTime = parseInt(result.totalSavedTime) || 0;
                const playTime = Date.now() - start;
                const totalTimePlayed = playTime + savedTime;
                totalStats.set('time', totalTimePlayed);
                
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
            <p id="version">PACK v1.5 by <a href="https://chromewebstore.google.com/search/rewy?hl=en-US" target="_blank" rel="noopener noreferrer">Rewy</a></p>
            <div id="settingsPopup"></div>
        `;

        // Add event listener to make the "PACK" image clickable
        updateColourMode(colourMode);
        document.getElementById("title").addEventListener("click", loadGameScreen);
        document.getElementById("settings").addEventListener("click", loadSettingsScreen);
        fallingPackagesInterval = setInterval(createFallingPackage, 600); // Generate packages at intervals (this part handles falling packages)
    }

    function loadDFDscreen() {
        // Hide tile-related elements
        document.getElementById('tile-container').style.display = 'none';
        document.getElementById('structure-container').style.display = 'none';
        
        // Keep other UI elements visible
        document.getElementById('coin').style.display = 'block';
        document.getElementById('currentMissionOverlay').style.display = 'block';
        document.getElementById('popUpBox').style.display = 'block';
        
        // Change background
        document.body.style.backgroundColor = "#dbdbdb";
        
        // Create DFD-specific content
        screen.innerHTML = `
            <div class="background-container"></div>
            <div id="dfd-content">
                <h2>Data Flow Diagram</h2>
                <div id="dfd-diagram"></div>
            </div>
        `;
        
        // Create DFD diagram here (you'll need to implement this)
        createDFDDiagram();
        
        // Keep menu functionality
        createGameMenuButtons();
        
        document.addEventListener("mousemove", (event) => {
            let mouseY = event.y;
            let mouseX = event.x;
            menuPopup(mouseY);
        });
    }

    function createDFDDiagram() {
        // Implement your DFD diagram creation logic here
        const dfdDiagram = document.getElementById('dfd-diagram');
        // Add your DFD elements to this container
    }

    // Function to load the game screen
    function loadGameScreen() {
        gameState = true;
        document.body.style.backgroundColor = "#dbdbdb"; // Light grey background for game

        screen.innerHTML = `
            <div class="game-container"></div>
            <div id="tile-container"></div>
            <div id="structure-container"></div>
            <div id="coin">
                <span id="coin-count">${totalStats.coins || 0}</span>
            </div>
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
                <div id="gameMenu"></div>
                <div id="openGameMenu">
                    <div id="missionsPopup"></div>
                    <div id="upgradesPopup"></div>
                    <div id="settingsPopup"></div>
                </div>
            </div>
            <div id="tutorial-overlay"></div>
        `;

        // Initialize game grid or any game-specific logic here
        clearInterval(fallingPackagesInterval);
        document.getElementById("gameMenu").addEventListener("click", openGamePopOut);

        // const adminSwitch = document.querySelector('.admin-switch');
        // adminSwitch.addEventListener('click', toggleAdminMode);
        img = ''
        document.documentElement.style.setProperty('--colour', '#bebebe83');
        document.documentElement.style.setProperty('--img', `${img}`);
        createTileGrid(10, 14);  // Initialize grid for the full screen
        createGameMenuButtons();
        pickStructure();
        loadAdminState();
        updateCoins();
        updateColourMode(colourMode);
        document.documentElement.style.setProperty('--pop', 0);
        let hasRun = false;
        document.addEventListener("mousemove", (event) => {
            if (gameState == true) {document.documentElement.style.setProperty('--pop', 1); gameState = false;}
            
            if (!hasRun) {
                // After a short delay (to allow DOM updates), recalculate paths
                setTimeout(() => {
                    console.log("Tile placed - recalculating paths...");
                    const tileData = tileCheck();
                    vehicleManager.updateAllPaths(tileData);
                }, 100);
                hasRun = true;
            } 
            let mouseY = event.y;
            let mouseX = event.x;
            menuPopup(mouseY);
            dropdownstuctures(mouseY);
            openCurrentMission(mouseX, mouseY);
        });
    }


    // Load the title screen first
    loadTitleScreen();


    function updateColourMode(mode) {
        let buttonColour ="rgba(178, 183, 185, 0.68)";
        if (mode == "light") {
            buttonColour ="rgba(178, 183, 185, 0.68)"
        } else if (mode == "dark") {
            buttonColour ="rgba(65, 71, 73, 0.68)"
        } else if (mode == "high-contrast") {
            buttonColour ="rgba(86, 111, 119, 0.68)"
        }
        document.documentElement.style.removeProperty ('--buttonColour');
        document.documentElement.style.setProperty('--buttonColour', buttonColour);
    }

    function openGamePopOut() {
        const gameMenu = document.getElementById("gameMenu");
        const openMenu = document.getElementById("openGameMenu");
        // const menuButton = document.getElementById("menuButton");

        gameMenu.classList.add('animated');

        openMenu.style.width = "230px";

        setTimeout(() => {
            gameMenu.classList.remove('animated');
            gameMenu.classList.add('open');
        }, 500); // Remove animation class after 0.5 second
    }

    function createGameMenuButtons() {
        const container = document.getElementById("openGameMenu");

        const settingsButton = document.createElement("img");
        settingsButton.id = "menuButton";
        settingsButton.style.right = "20%";
        settingsButton.src = "/assets/settings.png";
        settingsButton.onclick = loadSettingsScreen;

        const upgradesButton = document.createElement("img");
        upgradesButton.id = "menuButton";
        upgradesButton.style.right = "40%";
        upgradesButton.src = "/assets/upgrades.png";
        upgradesButton.onclick = loadUpgradesScreen;

        const missionsButton = document.createElement("img");
        missionsButton.id = "menuButton";
        missionsButton.style.right = "60%";
        missionsButton.src = "/assets/missions.png";
        missionsButton.onclick = openMissions;

        const tutorialButton = document.createElement("img");
        tutorialButton.id = "menuButton";
        tutorialButton.style.right = "0%";
        tutorialButton.src = "/assets/tutorial.png";
        tutorialButton.onclick = startTutorial;

        container.appendChild(settingsButton);
        container.appendChild(upgradesButton);
        container.appendChild(missionsButton);
        container.appendChild(tutorialButton);

        
    }

    

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

        tileContainer.addEventListener('mouseleave', () => {
            mouseIsDown = false;
        });

        // Default to empty if no saved data

        // loadAdminState()
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

                tile.addEventListener('click', (event) => {
                    handleTileClick(r, c, event.button);
                });

                tile.addEventListener('mouseenter', (event) => {
                    if (mouseIsDown) {
                        handleTileClick(r, c, event.button);
                    }
                    updatePreview(r, c); // Update preview on hover
                });

                tileContainer.appendChild(tile);
            }
        }    
    }

    // Default missions data
    const defaultMissions = [
        { id: 0, name: "Unlock Roads", amount: 3, type: "files", difficulty: 1 },
        { id: 1, name: "Unlock Storage", amount: 5, type: "files", difficulty: 2 },
        { id: 2, name: "Unlock Packages", amount: 15, type: "files", difficulty: 3 },
    ];

    // Procedural name generator
    function generateName() {
        const prefixes = ['j', 'd', 'n', 'm', 'r', 't', 'k', 's', 't'];
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        const suffixes = ['n', 'm', 'd', 'l', 'k', 's', 'r', 'sh'];
        
        // Generate name pattern: prefix + vowel + suffix
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const vowel = vowels[Math.floor(Math.random() * vowels.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        // Sometimes add a second vowel+suffix (50% chance)
        if (Math.random() > 0.5) {
            const vowel2 = vowels[Math.floor(Math.random() * vowels.length)];
            const suffix2 = suffixes[Math.floor(Math.random() * suffixes.length)];
            return prefix + vowel + suffix + vowel2 + suffix2;
        } else if (Math.random() > 0.3) {
            const vowel2 = vowels[Math.floor(Math.random() * vowels.length)];
            const suffix2 = suffixes[Math.floor(Math.random() * suffixes.length)];
            const suffix3 = suffixes[Math.floor(Math.random() * suffixes.length)];
            return prefix + vowel + suffix + suffix2+ vowel2 + suffix3;
        }
        
        return prefix + vowel + suffix;
    }

    // Generate a new mission with progressive difficulty
    function generateNewMission(completedMissionsCount) {
        const difficultyLevel = (Math.floor(completedMissionsCount / 3) + 1);
        const baseAmount = 5 + (difficultyLevel * 3);
        
        return {
            id: Date.now(), // Use timestamp as unique ID
            name: generateName(),
            amount: baseAmount + Math.floor(Math.random() * 5), // Some randomness
            type: "files", // Always files as requested
            difficulty: difficultyLevel
        };
    }

    // Save missions and progress
    function saveMissions(missions, completedCount, coins) {

        chrome.storage.local.set({
            missions: missions,
            missionsCompleted: completedCount,
            coins: coins,
            fileSize: fileSize,
            packageSize: packageSize,
        });
        saveTileData()
    }

    // Load missions and completed count
    function loadMissions(callback) {
        chrome.storage.local.get(['missions', 'missionsCompleted', 'coins'], function(result) {
            const loadedMissions = result.missions || [...defaultMissions]; // Copy defaults
            const loadedCompletedCount = result.missionsCompleted || 0;
            const loadedCoins = result.coins || 0;
            
            callback(loadedMissions, loadedCompletedCount, loadedCoins);
        });
    }

    // Example usage:
    let currentMissions = [];

    // Initialize
    loadMissions(function(loadedMissions, completedCount, loadedCoins) {
        missionsCompleted = completedCount;
        currentMissions = loadedMissions;
        coins = loadedCoins;
        align = 5 + (8 * String(coins).length);
        document.documentElement.style.setProperty("--alignCoinRight", align + "%");
        currentMission = currentMissions[0];
        console.log(currentMissions);
        setCurrentMission(currentMission);

    });

    // Main function
    function openMissions() {
        const missions = document.getElementById("missions-overlay");
        const upgradesScreen = document.getElementById("upgrades-overlay");
        const settings = document.getElementById("settings-overlay");
        // First check if overlay already exists
        if (missions) {
            missions.remove();
            return;
        }
        // Remove settings/upgrades overlay if they exists
        if (settings) { settings.remove(); }
        if (upgradesScreen) { upgradesScreen.remove(); }
        
        // Load missions and create UI
        loadMissions(function(missions) {
        const missionsOverlay = document.createElement("div");
        missionsOverlay.id = "missions-overlay";
        
        const buttonsContainer = document.createElement("div");
        buttonsContainer.id = "missions-buttons-container";
    
        missions.forEach(mission => {
            const missionButton = document.createElement("button");
            missionButton.className = "mission-button";
            missionButton.innerHTML = `Order from ${mission.name}<br>${mission.amount} ${mission.type}`;
            
            missionButton.addEventListener("click", () => {
                setCurrentMission(mission);
                console.log("Selected mission:", mission.id);
                missionsOverlay.remove();
            });
    
            buttonsContainer.appendChild(missionButton);
        });
    
        missionsOverlay.appendChild(buttonsContainer);
        document.body.appendChild(missionsOverlay);
        });
    }

    let missionJustCompleted = false;
    let currentMission = null;
    let deliveredCount = 0;

    function setCurrentMission(mission) {
        const overlay = document.getElementById('currentMissionOverlay');
        const difficultyIndicator = overlay.querySelector('.difficulty-indicator');
        
        // Set difficulty color (add your own logic for difficulty )
        difficultyIndicator.className = 'difficulty-indicator ' + getDifficultyClass(mission.difficulty);

        currentMission = mission;
        // deliveredCount = 0; // Reset counter when mission changes // ONLY RESET COUNT WHEN MISSION COMPLETE
        updateMissionDisplay();

        // Example difficulty mapping function
        function getDifficultyClass(difficulty) {
            switch(difficulty) {
                case 1: return 'easy';
                case 2: return 'medium';
                case difficulty >= 3: return 'hard';
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

        const counterWidth = counter.offsetWidth;
        const minPeek = 16;
        const maxHidden = 256 - Math.max(minPeek, counterWidth);
        
        // Color changes
        const isCompleted = deliveredCount >= currentMission.amount;
        const deliveredEl = overlay.querySelector('.delivered');
        const neededEl = overlay.querySelector('.needed');
        
        deliveredEl.style.color = isCompleted ? "#00ff00" : "#ffcc00";
        neededEl.style.color = isCompleted ? "#00ff00" : "#00ccff";

        // Add new mission when completed
        if (isCompleted && !missionJustCompleted) {

            if (currentMission.name == "Unlock Roads") {
                lockedButtons.splice(0, 2);
                pickStructure();
            }
            if (currentMission.name == "Unlock Packages") {
                lockedButtons.splice(2, 1);
                pickStructure();
            }
            if (currentMission.name == "Unlock Storage") {
                lockedButtons.splice(-2);
                pickStructure();
            }

            overlay.dataset.hiddenPosition = `-${maxHidden}px`;
            setTimeout(() => {
                overlay.style.left = "-16px";
            }, 800);

            missionJustCompleted = true;
            
            // Add slight delay before generating new mission
            setTimeout(() => {
                completeMission(currentMission.id);
                const newMission = addNewMission();
                currentMission = newMission;
                deliveredCount = 0;
                missionJustCompleted = false;
                updateMissionDisplay();
                
                // Optional: Show completion notification
                showMissionCompleteNotification();
            }, 100); // 0.1 second delay
        }
    }

    // And these helper functions:
    function showMissionCompleteNotification() {
        // Implement your notification logic here
        console.log("Mission completed! New mission generated.");
    }

    // Modified from previous example to set currentMission
    function addNewMission() {
        const newMission = generateNewMission(missionsCompleted);
        currentMissions.push(newMission);
        saveMissions(currentMissions, missionsCompleted, coins);
        return newMission;
    }

    function updateCoins() {
        const coinElement = document.getElementById('coin');
        const coinValue = document.getElementById('coin-count');
        
        align = 5 + (8 * String(coins).length);
        document.documentElement.style.setProperty("--alignCoinRight", align + "%");

        coinValue.textContent = coins;

        coinElement.classList.add('animated');

        setTimeout(() => {
            coinElement.classList.remove('animated');
        }, 400); // Remove animation class after 0.5 second
    }

    function completeMission(missionId) {
        completeMissions += 1;
        coins += 1 * currentMission.difficulty;
        updateCoins();
        
        totalStats.set('missions', completeMissions);
        currentMissions = currentMissions.filter(m => m.id !== missionId);
        saveMissions(currentMissions, missionsCompleted, coins);
        updateMissionDisplay();
    }

    // Call this whenever a file is delivered
    function incrementDelivered(load) {
        if (!currentMission) return;
        deliveredCount += load;
        totalStats.set('delivered', deliveredCount);
        updateMissionDisplay();
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

    // Default upgrades data (used if nothing is saved yet)
    const DEFAULT_UPGRADES = [
        {
            type: "trolley",
            name: "load",
            cost: 20,
            level: 0,
            maxLevel: 5
        },
        {
            type: "truck",
            name: "load",
            cost: 40,
            level: 0,
            maxLevel: 5
        },
        // {
        //     type: "unlock",
        //     name: "1",
        //     cost: 5,
        //     level: 0,
        //     maxLevel: 1
        // },
        // {
        //     type: "unlock",
        //     name: "2",
        //     cost: 5,
        //     level: 0,
        //     maxLevel: 1
        // },
        // {
        //     type: "unlock",
        //     name: "4",
        //     cost: 5,
        //     level: 0,
        //     maxLevel: 1
        // },
        // {
        //     type: "unlock",
        //     name: "5",
        //     cost: 5,
        //     level: 0,
        //     maxLevel: 1
        // },
        // {
        //     type: "unlock",
        //     name: "6",
        //     cost: 5,
        //     level: 0,
        //     maxLevel: 1
        // },
        // Add more default upgrades as needed
    ];

    // Save function (unchanged)
    function saveUpgrades(upgrades) {
        chrome.storage.local.set({ levelData: upgrades }, () => {
            console.log("Upgrades saved");
            saveTileData()
        });
    }

    // Improved load function (now async)
    async function loadUpgrades() {
        return new Promise((resolve) => {
            chrome.storage.local.get("levelData", (result) => {
                // Use saved data if available, otherwise use defaults
                resolve(result.levelData || DEFAULT_UPGRADES);
            });
        });
    }

    class DialogBox {
        constructor() {
            this.box = document.getElementById('tutorial_textBox');
            this.textElement = document.getElementById('tutorial_text-content');
            this.isTyping = false;
            this.currentTrigger = null;
            this.resolveCurrent = null;
            this.box.style.display = 'none';
        }

        show() {
            this.box.style.display = 'block';
        }
        
        hide() {
            this.box.style.display = 'none';
        }

        async playEventSequence(sequence) {
            for (const item of sequence) {
            // Parse the sequence item (can be string or object)
            const message = typeof item === 'string' ? item : item.text;
            const trigger = typeof item === 'string' ? null : item.trigger;
            
            await new Promise((resolve) => {
                this.resolveCurrent = resolve;
                this.currentTrigger = trigger;
                this.type(message);
                
                // If no trigger specified, allow click to continue
                if (!trigger) {
                this.box.onclick = () => this.continue();
                }
            });
            }
        }

        type(text, speed = 30) {
            this.show();
            this.isTyping = true;
            this.textElement.textContent = '';
            
            let i = 0;
            const typing = () => {
            if (i < text.length) {
                this.textElement.textContent += text.charAt(i);
                i++;
                setTimeout(typing, speed);
            } else {
                this.isTyping = false;
            }
            };
            typing();
        }

        continue() {
            if (this.isTyping) {
            // Skip typing animation if still typing
            this.textElement.textContent = this.currentMessage;
            this.isTyping = false;
            }
            if (this.resolveCurrent) {
            this.resolveCurrent();
            }
        }

        // Call this when game events occur
        checkTrigger(eventType) {
            if (this.currentTrigger === eventType) {
            this.continue();
            }
        }
    }

    let tutorialStarted = false;

    function startTutorial() {
        const overlay = document.getElementById("tutorial-overlay");
        
        if (tutorialStarted) {
            // Turn off tutorial
            overlay.style.display = 'none';
            tutorialStarted = false;
            
            // Clean up any tutorial elements
            const textBox = document.getElementById("tutorial_textBox");
            if (textBox) {
                overlay.removeChild(textBox);
            }
            
            // Clean up dialog if it exists
            if (window.dialog) {
                window.dialog = null;
            }
            
            return;
        }
        
        // Turn on tutorial
        overlay.style.display = 'block';
        tutorialStarted = true;
        console.log("tutorial started!");
        
        // Create tutorial elements
        const text_box = document.createElement("div");
        text_box.id = "tutorial_textBox";
        text_box.style.right = "-10px";
        text_box.style.bottom = "50px";

        const text = document.createElement("span");
        text.id = "tutorial_text-content";

        text_box.appendChild(text);
        overlay.appendChild(text_box);

        // Tutorial dialogues
        const scene1 = [
            "Welcome to the Tutorial... ('CLICK' to continue)",
            {
                text: "Move your mouse to the top of the screen, A drop down should appear with tiles",
                trigger: 'dropdownOpen'
            },
            {
                text: "Select the File Factory (4th-tile)",
                trigger: 'filefactory_tileSelected' // Will wait for this event
            },
            {
                text: "Now place the tile in the grid",
                trigger: 'filefactory_tilePlaced' // Will wait for this event
            },
            {
                text: "Great, go back to the dropdown",
                trigger: 'dropdownOpen'
            },
            {
                text: "Now select the straight road tile (1st tile)",
                trigger: 'straightroad_tileSelected' // Will wait for this event
            },
            "you can use r and u to rotate and flip tiles before you place them down",
            "Now place roads facing out from the file factory until they reach the edge of the grid",
            "Once you have a complete road a trolley will spawn and deliver 1 file",
            "Great now you've learnt the basics, ('CLICK' to continue)",
        ];
        
        // Initialize dialog
        const dialog = new DialogBox();
        window.dialog = dialog;
        dialog.playEventSequence(scene1);
    }


    // Main upgrades screen function (now async)
    async function loadUpgradesScreen() {
        const upgradesScreen = document.getElementById("upgrades-overlay");
        const settings = document.getElementById("settings-overlay");
        const missions = document.getElementById("missions-overlay");
        
        if (upgradesScreen) {
            upgradesScreen.remove();
            return;
        }
        if (missions) { missions.remove(); }
        if (settings) { settings.remove(); }
        
        const upgradesOverlay = document.createElement("div");
        upgradesOverlay.id = "upgrades-overlay";
        
        const buttonsContainer = document.createElement("div");
        buttonsContainer.id = "buttons-container";

        // Load upgrades (await the Promise)
        const upgrades = await loadUpgrades();

        upgrades.forEach(upgrade => {
            const upgradeButton = document.createElement("button");
            const upgradeImage = document.createElement("img");
            const upgradeCoin = document.createElement("img");
            
            upgradeButton.className = "upgradeButtons";
            upgradeButton.textContent = `${upgrade.name} ${upgrade.cost}`;

            upgradeImage.src = `/assets/${upgrade.type}.png`;
            upgradeImage.style.left = "14px";
            upgradeImage.id = "upgradeImages";

            let distance = 132 - ((upgrade.name).length * 12);
            upgradeCoin.src = '/assets/coin.png';
            upgradeCoin.style.right = `${distance}px`;
            upgradeCoin.style.width = "16px";
            upgradeCoin.style.height = "16px";
            upgradeCoin.id = "upgradeImages";

            upgradeButton.addEventListener("click", () => {
                if (upgrade.level >= (upgrade.maxLevel || 5)) return;
                
                if (coins >= upgrade.cost) {
                    coins -= upgrade.cost;
                    upgrade.level++;

                    // Upgrade logic
                    if (upgrade.type === "trolley") {
                        fileSize += 1;
                    } else if (upgrade.type === "truck") {
                        packageSize += 1;
                    } else if (upgrade.type === "unlock") {
                        unlockIndex = Number(upgrade.name);
                        lockedButtons.splice(unlockIndex, 1);
                    }
                    // Add other upgrade effects here

                    // Update button state
                    if (upgrade.level >= (upgrade.maxLevel || 5)) {
                        // upgradeButton.disabled = true;
                        upgradeButton.textContent = `MAX lvl: ${upgrade.level}`;
                    } else {
                        upgradeButton.textContent = `lvl: ${upgrade.level}`;
                    }

                    updateCoins();
                    saveUpgrades(upgrades); // Save the updated upgrades

                }
            });

            upgradeButton.appendChild(upgradeImage);
            upgradeButton.appendChild(upgradeCoin);
            buttonsContainer.appendChild(upgradeButton);
        });

        upgradesOverlay.appendChild(buttonsContainer);
        document.body.appendChild(upgradesOverlay);
    }

    function loadSettingsScreen() {
        const settings = document.getElementById("settings-overlay");
        const missions = document.getElementById("missions-overlay");
        const upgradesScreen = document.getElementById("upgrades-overlay");
        
        // Check if the settings overlay already exists to prevent duplication
        if (settings) {
            settings.remove();
            return;
        }
        if (missions) { missions.remove(); }
        if (upgradesScreen) { upgradesScreen.remove(); }
        
        // Create settings overlay
        const settingsOverlay = document.createElement("div");
        settingsOverlay.id = "settings-overlay";
        // settingsOverlay.className = "settings-container";

        // Create buttons container
        const buttonsContainer = document.createElement("div");
        buttonsContainer.id = "buttons-container";

        const halfButtonsContainer = document.createElement("div");
        halfButtonsContainer.className = "half-width-buttons-container";

        // Main buttons
        const keybindsButton = createPopUpButtons("KeyBinds", () => {
            openKeybinds();
        });

        const statsButton = createPopUpButtons("Stats", () => {
            openStats();
        });

        const mainMenuButton = createPopUpButtons("Main Menu", () => {
            settingsOverlay.remove();
            loadTitleScreen();
        });

        const colourModeButton = createPopUpButtons(colourMode, () => {
            if (colourMode == "light") {colourMode = "dark"}
            else if (colourMode == "dark") {colourMode = "high-contrast"}
            else {colourMode = "light"}
            console.log(colourMode);
            
            colourModeButton.textContent = colourMode; // or whatever property needs updating
            updateColourMode(colourMode);
        })

        // const logInButton = createSettingsButton("Log In", () => {
        //     logInButton.classList.add("half-width-button");
        //     settingsOverlay.remove();
        //     openLogIn();
        // });

        // const signUpButton = createSettingsButton("Sign Up", () => {
        //     signUpButton.classList.add("half-width-button");
        //     settingsOverlay.remove();
        //     openSignUp();
        // });

        const resetButton = createPopUpButtons("Reset Game", () => {
            const statscontainer = document.getElementById("stats-container");
            const keybindscontainer = document.getElementById("keybinds-container");
            if (statscontainer) {statscontainer.remove()}
            if (keybindscontainer) {keybindscontainer.remove()}

            alert("All Data Will Be Lost!!!");
            document.getElementById("resetGameButton")?.classList.add("active");
        });

        const trueResetButton = document.createElement("button");
            trueResetButton.id = "resetGameButton";
            trueResetButton.textContent = "RESET!";
            trueResetButton.addEventListener("click", () => {
                trueResetButton.classList.remove("active");
                settingsOverlay.remove();
                resetGame();
                loadTitleScreen();
        });

        function resetGame() {
            // Clear all chrome.storage.local data
            chrome.storage.local.clear(function() {
                console.log("All game data has been cleared");
            });
            
            // Reset all in-memory variables
            totalStats.clear();
            missionsCompleted = 0;
            placed = 0;
            currentMissions = [...defaultMissions]; // Reset to default missions
            deliveredCount = 0;
            currentMission = null;  
            coins = 0;
        }

        // Helper function to create consistent buttons
        function createPopUpButtons(text, clickHandler) {
            const button = document.createElement("button");
            button.className = "settingsButtons";
            button.textContent = text;
            button.addEventListener("click", clickHandler);
            return button;
        }

        // Add main buttons to container

        // halfButtonsContainer.appendChild(logInButton);
        // halfButtonsContainer.appendChild(signUpButton);

        buttonsContainer.appendChild(keybindsButton);
        buttonsContainer.appendChild(statsButton);
        buttonsContainer.appendChild(mainMenuButton);
        buttonsContainer.appendChild(colourModeButton);
        buttonsContainer.appendChild(halfButtonsContainer);
        buttonsContainer.appendChild(resetButton);
        buttonsContainer.appendChild(trueResetButton);

        // Add containers to overlay
        settingsOverlay.appendChild(buttonsContainer);
        // settingsOverlay.appendChild(contentContainer);

        // Append the overlay to the body
        document.body.appendChild(settingsOverlay);
    }

    // function openLogIn() {
    //     const logInOverlay = document.createElement("div");
    //     logInOverlay.id = "log-in-overlay";
    //     logInOverlay.className = "log-in-container";

    //     const logInButton = document.createElement("button");
    //     logInButton.id = "log-in-button";
    //     logInButton.textContent = "Log In";
    //     logInButton.addEventListener("click", () => {
    //         logInOverlay.remove();
    //     });

    //     logInOverlay.appendChild(logInButton);
    //     document.body.appendChild(logInOverlay);

    // }

    function toggleAdminMode() {
        const adminSwitch = document.querySelector('.admin-switch');
        adminMode = !adminMode;
        
        if (adminMode) {
            adminSwitch.classList.add('active');
            console.log("Admin mode activated");
            // Call your admin functions here
            activateAdminFeatures();
        } else {
            adminSwitch.classList.remove('active');
            console.log("Admin mode deactivated");
            // Call functions to deactivate admin features if needed
            deactivateAdminFeatures();
        }

        // Save admin mode state
        chrome.storage.local.set({ adminMode: adminMode });
    }

    // Load admin mode state when the game starts
    function loadAdminState() {
        chrome.storage.local.get(['adminMode'], function(result) {
            if (result.adminMode) {
                adminMode = result.adminMode;
                const adminSwitch = document.querySelector('.admin-switch');
                if (adminMode) {
                    adminSwitch?.classList.add('active');
                    activateAdminFeatures();
                } else {
                    adminSwitch?.classList.remove('active');
                }
            }
        });
    }

    function activateAdminFeatures() {
        // Add all your admin functions here
        console.log("Admin features activated");
        // Show coordinates
        toggleCoordinates();
        // Show truck paths
        visualizeAllVehiclePaths();
    }

    function deactivateAdminFeatures() {
        // Add functions to revert admin changes if needed
        console.log("Admin features deactivated");
        toggleCoordinates();
        // Hide truck paths
        document.querySelectorAll('.path-debug').forEach(el => el.remove());
    }

    function erase() {
        console.log("erase");
        // selectedRotation = 0;
        // flip = 0;
        const hoveredTile = document.querySelector('.tile:hover');
        const row = hoveredTile.dataset.row;
        const col = hoveredTile.dataset.col;
        const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const preview = tile.querySelector('.tile-preview');
        // preview.style.backgroundImage = '';
        deleteTile(tile);
        const tileData = tileCheck();
        vehicleManager.updateAllPaths(tileData);
    }

    let keybinds = [
        { key: "e", description: "delete tile", action: () => {
            // Get the row and column of the currently hovered tile
            erase()
        }},
        { key: "t", description: "next tile", action: () => {
            if (isButtonLocked(i)) {
                console.log("locked!");
                return; // Exit early
            }
            si = (si + 1) % sheetIndex;
            document.documentElement.style.setProperty('--index', (-si * 32) + "px");
        }},
        { key: "s", description: "save game", action: saveTileData },
        { key: "i", description: "zoom in", action: zoomCameraIn },
        { key: "o", description: "zoom out", action: zoomCameraOut },
        { key: "r", description: "rotate tile", action: () => {
            if (img === "url('../assets/tileSpriteSheet.png')") {
                rotation = (rotation + 90) % 360;
                rotateTile(rotation);   
            }
        }},
        { key: "u", description: "flip tile", action: () => {
            if (img === "url('../assets/tileSpriteSheet.png')") flipTile();
        }},
        { key: "1", description: "straight road", action: () => {
            setTile(0);
        }},
        { key: "2", description: "turn road", action: () => {
            setTile(1);
        }},
        { key: "3", description: "split road", action: () => {
            setTile(2);
        }},
        { key: "4", description: "files factory", action: () => {
            setTile(3);
        }},
        { key: "5", description: "package factory", action: () => {
            setTile(4);
        }},
        { key: "6", description: "files storage", action: () => {
            setTile(5);
        }},
        { key: "7", description: "package storage", action: () => {
            setTile(6);
        }},
        { key: "g", description: "DEBUG Deliver File", action: () => {
            incrementDelivered(1);
        }},
        { key: "h", description: "DEBUG Clear Files", action: () => {
            resetFiles();
        }},
        { key: "l", description: "DEBUG Tile Check", action: () => {
            const tileData = tileCheck();
            vehicleManager.updateAllPaths(tileData);
            console.log("PRINT ALL DATA: ", tileData);
        }},
        { key: "o", description: "DEBUG toggle coordinates", action: () => {
            toggleCoordinates();
        }},
    ];

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
            bindElement.textContent = `${bind.key.toUpperCase()} | ${bind.description || "Custom Function"}`;
            keybindsContainer.appendChild(bindElement);
        background.appendChild(keybindsContainer);
            });
    }

    async function openStats() {
        try {
            const background = document.getElementById("buttons-container");
            const playTime = await getPlayTime();
            const keybindscontainer = document.getElementById("keybinds-container");
            const statsContainer = document.createElement("div");
            statsContainer.id = "stats-container";
            const existingStatsContainer = document.getElementById("stats-container");
            const stats = [];
            
            if (existingStatsContainer) {
                statsOpen = false;
                existingStatsContainer.remove();
                return;
            }
            if (keybindscontainer) {
                keybindscontainer.remove();
            }
            console.log(totalStats);
            const statsObj = {};
            for (const [key, value] of totalStats) {
                statsObj[key] = value;
            }
            console.log(statsObj);

            saveStats.push(statsObj);

            const delivered = statsObj.delivered;
            const missions = statsObj.missions;
            const tilesPlaced = statsObj.placed;
            let totalMinutesPlayed = statsObj.time / 60000;
            let timeH = parseInt(totalMinutesPlayed / 60);
            let timeM = parseInt(totalMinutesPlayed % 60);
            let timePlayed = `${timeH}h ${timeM}m`;

            stats.push(
                {name: "Files Delivered", statistic: delivered},
                // {name: "Packages Delivered", statistic: packagesDelivered},
                {name: "Orders Fulfilled", statistic: missions},
                {name: "Tiles Placed", statistic: tilesPlaced},
                {name: "Time Played", statistic: timePlayed},
            );

            stats.forEach(stat => {
                const bindElement = document.createElement("div");
                bindElement.style.color = "#ffffff";
                bindElement.textContent = `${stat.name} : ${stat.statistic || "0"}`;
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
        const currency = document.getElementById("coin")
            if (mouseY > 5) {
                pick.style.top = "-39px";
                currency.style.top = "-0px";
            } if (mouseY < 34) {
                pick.style.top = "0px";
                currency.style.top = "42px";
                if (window.dialog) {window.dialog.checkTrigger('dropdownOpen');}
            }
        }

    function pickStructure() {

        const pick = document.getElementById("structure-container");
        pick.innerHTML = ""; // Clear previous buttons
        const buttonContainer = document.createElement("button-container");

        document.documentElement.style.setProperty('--sheetSize', sheetSize + "px");

        for (let i = 0; i < sheetIndex; i++) {
            const pos = -(i * spriteSize);

            // Create container for each button+lock pair
            const buttonWrapper = document.createElement("div");
            buttonWrapper.className = "button-wrapper";

            //Create buttons for each structure
            const button = document.createElement("img");
            button.classList.add("setSpriteButtons");
            button.style.backgroundImage = `url("../assets/tileSpriteSheet.png")`;
            button.style.backgroundPosition = `${pos}px 0px`;
            button.dataset.pos = pos;
            button.dataset.index = i; // Store index for reference

            // Create the lock image
            const lock = document.createElement("img");
            lock.className = "lock-icon";
            lock.src = "../assets/locked.png";
            lock.style.display = "none"; // Hidden by default

            console.log("setTile: ", i);

            // Initially hide the lock (you can show it when needed)
            if (lockedButtons.includes(i)) {
                lock.style.display = "block";
                button.classList.add("locked");
            } else {
                lock.style.display = "none";
                button.classList.remove("locked");
            }

            button.addEventListener("click", () => {
                console.log("active:", i);
                if (i != 7) {
                    setTile(i);
                    erase();
                } else {
                    erase();
                }
                activeButton(button);
                
            });

            // Add both elements to the wrapper
            buttonWrapper.appendChild(button);
            buttonWrapper.appendChild(lock);
            
            // Add the wrapper to the container
            buttonContainer.appendChild(buttonWrapper);

            pick.appendChild(buttonContainer);
            // pick.appendChild(lock);
        }  
    }

    function activeButton(button) {
        document.querySelectorAll(".setSpriteButtons").forEach(b => b.classList.remove("active"));
        button.classList.add("active");
    }


    function handleTileClick(row, col, mb) {

        if (mb === 0){
            let r = selectedRotation + "deg";
            let f = flip + "deg";
            const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            tile.style.transform = `rotate(${r}) rotateY(${f})`;
            setTileSprite(row, col, si);
            
            // After a short delay (to allow DOM updates), recalculate paths
            if (tile.style.backgroundImage != ''){
                placed += 1;
                setTimeout(() => {
                    console.log("Tile placed - recalculating paths...");
                    const tileData = tileCheck();
                    vehicleManager.updateAllPaths(tileData);
                }, 100);
            }
            totalStats.set('placed', placed);

            if (window.dialog) {window.dialog.checkTrigger('filefactory_tilePlaced');}
        }
        
        
        
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
        // preview.style.removeProperty('background-image');
        img = '';
        // Reset all relevant CSS properties
        // tile.style.backgroundImage = 'none';
        tile.removeAttribute('style');
        // tile.style.transform = 'none';
        // preview.style.transform = 'none'; // Reset rotation and flip
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

    function zoomCameraOut() {
        const tiles = document.querySelectorAll('.tile');
        const lastTileData = []
        tiles.forEach(tile => {
            if (tile.hasAttribute('style')) {
                const styleValue = tile.getAttribute('style');

                lastTileData.push ({
                    row: tile.dataset.row,
                    col: tile.dataset.col,
                    style: styleValue,
                });
                tile.removeAttribute('style');
                const tileData = tileCheck();
                vehicleManager.updateAllPaths(tileData);
            }  
        });
        document.documentElement.style.setProperty('--pop', 0);
        loadDFD(lastTileData, tiles);
    }

    function zoomCameraIn() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            if (tile.hasAttribute('style')) {
                tile.style.backgroundImage = `url("../assets/tileSpriteSheet.png")`;
            }
        })
        document.documentElement.style.setProperty('--pop', 1);

    }

    function loadDFD(lastTileData, tiles) {
        lastTileData.forEach(savedTile => {
            const matchingTile = Array.from(tiles).find(tile => 
                tile.dataset.row === savedTile.row && 
                tile.dataset.col === savedTile.col
            );

            if (matchingTile) {
                // Create a new style string with the DFD spritesheet

                const newStyle = `${savedTile.style}; background-image: url("/assets/DFDspritesheet.png"); background-color: #ffffff80;`;
                matchingTile.setAttribute('style', newStyle);
            }
        });
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

        if (isButtonLocked(i)) {
            console.log("locked!");
            return; // Exit early
        }

        if (window.dialog) {
            if (i == 0) {window.dialog.checkTrigger('straightroad_tileSelected');}
            if (i == 3) {window.dialog.checkTrigger('filefactory_tileSelected');}
        };

        document.documentElement.style.setProperty('--colour', '#bebebe83');

        img = "url('../assets/tileSpriteSheet.png')";
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
    var img = "url('../assets/tileSpriteSheet.png')";
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
        const popUpBox = document.getElementById("popUpBox");
        const gameMenu = document.getElementById("gameMenu");
        const openMenu = document.getElementById("openGameMenu");
        if (mouseY > 464) {
            popUpBox.style.bottom = "0px";
        } if (mouseY < 402) {
            popUpBox.style.bottom = "-64px";
            openMenu.style.width = "0px";
            gameMenu.classList.remove('open');
            // menuButton.style.visibility = "hidden";
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
        vehicleManager.clearAll();
        const tiles = document.querySelectorAll('.tile');
        const tileTypes = []; 
        const allTiles = []; 
        newTileData = [];
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
        spawnVehicle(newTileData);
        return newTileData;
    }
    
    function getTileEntryExits(tiles, row, col, backgroundImage, backgroundPosition, rot, flip) {

        var tileType = "na";
        tileEntryExit = [];

        let entryDirections = [];
        let exitDirections = [];

        // First, check if this is a road tile (types 0-2 in your spritesheet)
        const isRoadTile = backgroundImage.includes("tileSpriteSheet.png") && 
                          (backgroundPosition.includes("0px 0px") ||  // straight
                           backgroundPosition.includes("-32px") || // turn
                           backgroundPosition.includes("-64px"));   // split  

        if (isRoadTile) {
            console.log("is road tile", row, ".", col);
            } else if (!isRoadTile) {
                // Handle factory and storage tiles
                if (backgroundImage.includes("tileSpriteSheet.png")) {
                    console.log("NOT roadtile tile:", row, ".", col);
                
                    if (backgroundPosition.includes("-96px")) {
                        tileType = "files-factory";
                        entryDirections = [];
                        exitDirections = ["north", "east", "south", "west"];
                    }
                    if (backgroundPosition.includes("-128px")) {
                        tileType = "package-factory";
                        entryDirections = ["north", "east", "south", "west"];
                        exitDirections = ["north", "east", "south", "west"];
                    }
                    if (backgroundPosition.includes("-160px")) {
                        tileType ="files-storage";
                        entryDirections = ["north", "east", "south", "west"];
                        exitDirections = ["north", "east", "south", "west"];
                    }
                    if (backgroundPosition.includes("-192px")) {
                        tileType = "package-storage";
                        entryDirections = ["north", "east", "south", "west"];
                        exitDirections = ["north", "east", "south", "west"];
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
            
            exit1.some(ex1 => {
                if (a_dir == ex1) {
                    a_entry2.some(en2 => {
                        if (oppDir(a_dir) == en2) {
                            if (road && a_name.includes("storage")) {
                                console.log(`${row}.${col} type: "in"`);
                                type = "in";
                            }
                            if (road && a_name.includes("package-factory")) {
                                console.log(`${row}.${col} type: "pack in"`);
                                type = "pack in";
                            }
                            else if (name.includes("turn") && a_road) {
                                console.log(`${row}.${col} type: "connect"`);
                                type = "connect";
                            }
                        }
                    })
                }
            })
            entry1.some(en1 => {
                if (a_dir == en1) {
                    a_exit2.some(ex2 => {
                        if (oppDir(a_dir) == ex2) {
                            if (row == 0 || row == 9 || col == 0 || col == 13) {
                                if (road) {
                                    console.log(`${row}.${col} type: "end"`);
                                    type = "end";
                                }
                            }
                            else if (road && (a_name.includes("storage"))) {
                                console.log(`${row}.${col} type: "out"`);
                                type = "out";
                            }
                            else if (road && (a_name.includes("files-factory"))) {
                                console.log(`${row}.${col} type: "start trolley"`);
                                type = "start trolley";
                            }
                            else if (road && (a_name.includes("package-factory"))) {
                                console.log(`${row}.${col} type: "start truck"`);
                                type = "start truck";
                            }
                            else if (road && a_road) {
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

    // Vehicle management system
    const vehicleManager = {
        vehicles: [],
        activeAnimations: new Map(),
        loop4: 0,
        
        init(tileData) {
            this.clearAll();
            this.createVehicles(tileData, false);
        },
        
        clearAll() {
            document.querySelectorAll('.vehicle').forEach(f => f.remove());
            this.activeAnimations.forEach(animation => {
                cancelAnimationFrame(animation);
            });
            this.activeAnimations.clear();
            this.vehicles = [];
        },

        printVehicleStatus() {
            console.log("Current Vehicle Status:");
            this.vehicles.forEach((vehicle, index) => {
                console.log(`Vehicle ${index}:`);
                console.log(`- Position: ${vehicle.row},${vehicle.col}`);
                console.log(`- Path: ${vehicle.path.map(p => `${p.row},${p.col}`).join(' → ')}`);
                console.log(`- Current index: ${vehicle.currentPathIndex}`);
                console.log(`- Complete: ${vehicle.completeTrack}`);
            });
        },

        updateAllPaths(tileData) {
            // Only update if we have vehicles
            if (this.vehicles.length === 0) return;
            
            console.log("Updating all vehicle paths...");
            
            this.vehicles.forEach(vehicle => {
                const newPath = this.findPath(vehicle.row, vehicle.col, tileData);
                
                if (newPath.length >= 1) {
                    console.log(`Updating path for vehicle at ${vehicle.row},${vehicle.col}`);
                    vehicle.path = newPath;
                    vehicle.currentPathIndex = 0;

                    if (adminMode) {
                        visualizePath(vehicle.path);
                    }
                    
                    // If this vehicle isn't currently animating, restart it
                    if (!this.activeAnimations.has(vehicle.element)) {
                        this.animateVehicle(vehicle, tileData);
                    }
                } else {
                    console.log(`No valid path found for vehicle at ${vehicle.row},${vehicle.col}`);
                }
            });
        },
        
        createVehicles(tileData, spawnTruck) {
            let startTiles = [];
            if (spawnTruck) {
                startTiles = tileData.filter(tile => tile.type.includes("start truck"));
            } else {
                startTiles = tileData.filter(tile => tile.type.includes("start trolley"));
            }

            // Don't spawn new vehicles if existing ones are still active
            if (this.vehicles.length > 0 && !spawnTruck) {
                this.updateAllPaths(tileData);
                return;
            }

            startTiles.forEach(startTile => {
                const path = this.findPath(startTile.row, startTile.col, tileData);
                 
                // Only create vehicle if path reaches an appropriate destination
                const reachesDestination = path.some(t => {
                    const tile = tileData.find(td => td.row == t.row && td.col == t.col);
                    return (spawnTruck && tile.type.includes("pack in")) || 
                        (!spawnTruck && tile.type.includes("end"));
                });

                if (reachesDestination && path.length > 1) {
                    const tileContainer = document.getElementById('tile-container');
                    const vehicle = document.createElement('div');
                    vehicle.className = 'vehicle';
                    let vehicleType = '';

                    if (startTile.type.includes("start trolley")) vehicleType = 'trolley';
                    if (startTile.type.includes("start truck") && fileSize >= 3) vehicleType = 'truck';
                    
                    // Center the vehicle on the tile
                    const tileSize = 32;
                    const nextDir = startTile.adjacent.map(tile => 
                        tile.type.includes("connect") && startTile.exit == (tile.dir && tile.entry));
                    const startDir = getTurnDir(nextDir);
                    const flip = (startDir === 0 && 0) || (startDir === 90 && 0) || 
                                (startDir === 180 && 180) || (startDir === 270 && 180);
                    const transform = `rotate(${startDir}deg) rotateY(${flip}deg)`;
                    
                    vehicle.style.left = `${startTile.row * tileSize}px`;
                    vehicle.style.top = `${startTile.col * tileSize}px`;
                    vehicle.style.transform = transform;
                    
                    tileContainer.appendChild(vehicle);

                    this.vehicles.push({
                        element: vehicle,
                        row: startTile.row,
                        col: startTile.col,
                        completeTrack: false,
                        load: vehicleType == 'truck' ? packageSize + fileSize : fileSize,
                        speed: vehicleSpeed,
                        bgimg: vehicleType,
                        path: path,
                        currentPathIndex: 0,
                    });
                }
            });
            
            this.startMovement(tileData);
        },
        
        findPath(startRow, startCol, tileData, visited = new Set(), path = []) {
            const currentTile = tileData.find(t => t.row == startRow && t.col == startCol);
            if (!currentTile || visited.has(`${currentTile.row},${currentTile.col}`)) {
                return path;
            }

            visited.add(`${currentTile.row},${currentTile.col}`);
            path.push({ row: currentTile.row, col: currentTile.col });

            // If this is an end tile (for trolleys) or pack in tile (for trucks), return the path
            if (currentTile.type.includes("end") || currentTile.type.includes("pack in")) {
                return path;
            }

            // Find all valid connected tiles
            const nextTiles = currentTile.adjacent
                .filter(a_tile => {
                    const adjTile = tileData.find(t => t.row == a_tile.row && t.col == a_tile.col);
                    return adjTile && this.isConnected(currentTile, adjTile);
                })
                .sort((a, b) => {
                    // Prioritize paths that lead to storage/end tiles
                    const aTile = tileData.find(t => t.row == a.row && t.col == a.col);
                    const bTile = tileData.find(t => t.row == b.row && t.col == b.col);
                    return (bTile.type.includes("storage") || bTile.type.includes("end")) ? 1 : -1;
                });

            // Try each possible path
            for (const nextTile of nextTiles) {
                const result = this.findPath(nextTile.row, nextTile.col, tileData, new Set(visited), [...path]);
                if (result.length > path.length && 
                    (result.some(t => {
                        const tile = tileData.find(td => td.row == t.row && td.col == t.col);
                        return tile.type.includes("end") || tile.type.includes("pack in");
                    }))) {
                    return result;
                }
            }
            
            return path; // Return incomplete path if no complete path found
        },
        
        isConnected(tile1, tile2) {
            if (!tile1 || !tile2) return false;

            // Convert to arrays if they aren't already
            const tile1Exit = Array.isArray(tile1.exit) ? tile1.exit : [tile1.exit];
            const tile2Entry = Array.isArray(tile2.entry) ? tile2.entry : [tile2.entry];
            
            // Special case for storage tiles - they can receive from any direction
            if (tile2.type.includes("storage")) {
                return true;
            }
            
            // Special case for factory tiles - they can only send out
            if (tile1.type.includes("factory")) {
                return true;
            }
            
            // Check all exit-to-entry connections
            return tile1Exit.some(exitDir => {
                const oppositeDir = this.getOppositeDirection(exitDir);
                return tile2Entry.some(entryDir => entryDir === oppositeDir);
            });
        },
        
        getOppositeDirection(dir) {
            const opposites = { north: "south", south: "north", east: "west", west: "east" };
            return opposites[dir] || dir;
        },
        
        startMovement(tileData) {
            this.vehicles.forEach(vehicle => {
                if (vehicle.path.length > 1) {
                    this.animateVehicle(vehicle, tileData);
                }
            });
        },
        
        animateVehicle(vehicle, allTiles) {
            // Clear any existing animation
            if (this.activeAnimations.has(vehicle.element)) {
                cancelAnimationFrame(this.activeAnimations.get(vehicle.element));
            }

            if (adminMode) {
                visualizePath(vehicle.path);
            }

            const tileSize = 32;
            const speed = vehicle.speed;
            
            let startTime = performance.now();
            
            const animate = (timestamp) => {
                if (!vehicle.element.isConnected) {
                    this.activeAnimations.delete(vehicle.element);
                    return;
                }
                
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / (1000 / speed), 1);
                
                if (vehicle.currentPathIndex < vehicle.path.length - 1) {
                    const current = vehicle.path[vehicle.currentPathIndex];
                    const next = vehicle.path[vehicle.currentPathIndex + 1];
                    
                    // Calculate intermediate position
                    const offset = (tileSize - 16) / 2;
                    const x = current.row * tileSize + (next.row - current.row) * progress * tileSize + offset;
                    const y = current.col * tileSize + (next.col - current.col) * progress * tileSize + offset;
                    
                    vehicle.element.style.left = `${x}px`;
                    vehicle.element.style.top = `${y}px`;
                    vehicle.element.style.backgroundImage = `url('../assets/${vehicle.bgimg}.png')`;
                    
                    if (progress >= 1) {
                        vehicle.currentPathIndex++;
                        vehicle.row = next.row;
                        vehicle.col = next.col;
                        startTime = timestamp;
                        
                        // Update vehicle direction
                        if (vehicle.currentPathIndex < vehicle.path.length - 1) {
                            const nextNext = vehicle.path[vehicle.currentPathIndex + 1];
                            const direction = this.calculateDirection(next, nextNext);
                            vehicle.element.style.transform = `rotate(${direction}deg) scale(2)`;
                        }
                        
                        // Check if reached end of path
                        if (vehicle.currentPathIndex >= vehicle.path.length - 1) {
                            const currentTile = allTiles.find(t => 
                                t.row === vehicle.row && t.col === vehicle.col
                            );
                            
                            // Only complete if we reached the proper destination
                            const reachedDestination = 
                                (vehicle.bgimg === 'trolley' && currentTile.type.includes("end")) ||
                                (vehicle.bgimg === 'truck' && currentTile.type.includes("pack in"));
                            
                            if (reachedDestination) {
                                this.endPath(vehicle, allTiles, currentTile);
                                return;
                            } else {
                                // Vehicle reached end of path but not destination - remove it
                                this.activeAnimations.delete(vehicle.element);
                                vehicle.element.remove();
                                const index = this.vehicles.findIndex(f => f === vehicle);
                                if (index !== -1) {
                                    this.vehicles.splice(index, 1);
                                }
                                return;
                            }
                        }
                    }
                    
                    this.activeAnimations.set(vehicle.element, requestAnimationFrame(animate));
                }
            };
            
            this.activeAnimations.set(vehicle.element, requestAnimationFrame(animate));
        },

        endPath(vehicle, tileData, currentTile) {
            if (currentTile.type.includes("end")) {
                incrementDelivered(vehicle.load);
            } else if (currentTile.type.includes("pack in") && vehicle.bgimg == "trolley") {
                this.createVehicles(newTileData, true);
            } 
            
            // Remove the vehicle visually
            this.activeAnimations.delete(vehicle.element);
            vehicle.element.remove();
            
            // Remove from vehicles array
            const index = this.vehicles.findIndex(f => f === vehicle);
            if (index !== -1) {
                this.vehicles.splice(index, 1);
            }
            
            // Respawn the vehicle after a short delay
            setTimeout(() => {
                this.createVehicles(newTileData, false); // Use the latest tile data
            }, 1000); // 1 second delay before respawning
        },

        calculateDirection(current, next) {
            if (next.row > current.row) return 180; // east
            if (next.row < current.row) return 0;  // west
            if (next.col > current.col) return 270; // south
            return 90; // north
        },
    };

    function getTurnDir(dir) {
        const newDir = { "north": "90", "south": "270", "east": "180", "west": "0" };
        return newDir[dir];
    }

    // Updated spawnVehicle function
    function spawnVehicle(tileData) {
        vehicleManager.init(tileData);
    }

    // Updated tilePathFinder function
    function tilePathFinder(tileData) {
        console.log("tilePathFinder Running...");
        spawnVehicle(tileData);
        return tileData;
    }

    function visualizeAllVehiclePaths() {
        if (!adminMode) return;
        
        vehicleManager.vehicles.forEach(vehicle => {
            visualizePath(vehicle.path);
        });
    }

    function visualizePath(path) {
        if (!adminMode) return;
        // Remove any existing debug elements
        document.querySelectorAll('.path-debug').forEach(el => el.remove());
        
        path.forEach((tile, index) => {
            const debug = document.createElement('div');
            debug.className = 'path-debug';
            debug.textContent = index;
            debug.style.position = 'absolute';
            debug.style.left = `${tile.row * 32 + 8}px`;
            debug.style.top = `${tile.col * 32 + 8}px`;
            debug.style.color = 'red';
            debug.style.zIndex = '1000';
            document.getElementById('tile-container').appendChild(debug);
        });
    }
});