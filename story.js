// setup Timer and Voice Recognition

let currentNodeKey = "start";
let currentChapter = 'Start';
let timer = null;
const CHOICE_TIME = 20; // seconds

// Add voice recognition setup
let recognition;
let isListening = false;

// Add a flag to prevent multiple popups
let isPaused = false;

// Voice recognition setup with permission handling
async function setupVoiceRecognition() {
    try {
        // First check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Voice recognition not supported. Please use Chrome or Edge.');
            showAlert('Voice recognition is only supported in Chrome and Edge browsers.');
            return;
        }

        // Ask for microphone permission first
        const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // If we got permission, set up recognition
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            console.log('Voice recognition started');
        };

        recognition.onend = () => {
            if (isListening) {
                recognition.start();
            }
        };

        recognition.onresult = (event) => {
            if (isPaused) return;
            
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            if (transcript.toLowerCase().includes('stop')) {
                showPausePopup();
            }
        };

        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            handleVoiceError(event.error);
        };

        // Start recognition
        recognition.start();

    } catch (error) {
        console.error('Setup error:', error);
        if (error.name === 'NotAllowedError') {
            showAlert('Please allow microphone access to use voice commands.');
        } else {
            showAlert('Could not start voice recognition. Please try refreshing the page.');
        }
    }
}

// Handle voice recognition errors
function handleVoiceError(error) {
    let message = 'An error occurred with voice recognition.';
    
    switch (error) {
        case 'not-allowed':
            message = 'Please allow microphone access to use voice commands.';
            break;
        case 'no-speech':
            message = 'No speech was detected. Please try again.';
            break;
        case 'network':
            message = 'Network error occurred. Please check your connection.';
            break;
        default:
            message = `Voice recognition error: ${error}`;
    }
    
    showAlert(message);
}

// Show browser support alert
function showBrowserSupportAlert() {
    showAlert('Voice recognition is only supported in Chrome and Edge browsers. Please switch browsers to use voice commands.');
}

// Generic alert function
function showAlert(message) {
    const existingAlert = document.querySelector('.alert-message');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = 'alert-message';
    alert.textContent = message;
    
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Add pause popup
function showPausePopup() {
    if (isPaused) return; // Don't show if already paused
    isPaused = true;

    const pauseScreen = document.createElement('div');
    pauseScreen.className = 'pause-screen';
    
    pauseScreen.innerHTML = `
        <div class="pause-content">
            <h2 class="pause-title">Game Paused</h2>
            <div class="pause-buttons">
                <button id="resumeBtn">Resume</button>
                <button id="restartBtn">Restart</button>
                <button id="menuBtn">Return to Menu</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(pauseScreen);
    
    // Stop the timer if it's running
    clearInterval(timer);

    // Add button event listeners
    const resumeBtn = pauseScreen.querySelector('#resumeBtn');
    const restartBtn = pauseScreen.querySelector('#restartBtn');
    const menuBtn = pauseScreen.querySelector('#menuBtn');
    
    resumeBtn.addEventListener('click', () => {
        pauseScreen.remove();
        isPaused = false; // Reset pause flag
        startTimer();
    });
    
    restartBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to restart? All progress will be lost.')) {
            pauseScreen.remove();
            isPaused = false; // Reset pause flag
            restartGame();
        }
    });
    
    menuBtn.addEventListener('click', () => {
        if (confirm('Return to menu? All progress will be lost.')) {
            window.location.href = 'index.html';
        }
    });
}

// Add CSS for the pause screen
const style = document.createElement('style');
style.textContent = ` 
    .pause-screen {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    }

    .pause-content {
        background: var(--primary);
        padding: 2.5rem;
        border-radius: 12px;
        box-shadow: 0 0 30px var(--glow-color);
        text-align: center;
        animation: slideIn 0.3s ease;
    }

    .pause-title {
        font-family: 'Cinzel', serif;
        font-size: 2.2rem;
        margin-bottom: 2rem;
        color: var(--text);
    }

    .pause-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .pause-buttons button {
        padding: 0.8rem 1.5rem;
        font-size: 1rem;
        background: transparent;
        border: 1px solid var(--text-muted);
        color: var(--text);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Open Sans', sans-serif;
    }

    .pause-buttons button:hover {
        background: var(--primary-light);
        border-color: var(--text);
        transform: translateY(-2px);
        box-shadow: 0 0 15px var(--glow-spread),
                    0 0 5px var(--glow-color);
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Story nodes
const storyNodes = {
    start: {
        text: "( BANDERSNATCH )\n8th July 1984\n\nYou are Stefan Butler, a young programmer adapting a choose-your-own-adventure novel into a video game. Your first choice of the day awaits...",
        choices: {
            "Sugar Puffs": "breakfast",
            "Frosties": "breakfast"
        }
    },

    breakfast: {
        text: "While eating your cereal, the Thomson Twins play on TV. Your father asks if you're heading to Tuckersoft today for the game development opportunity. Movie ratings flash across the screen. This could be your big break.",
        choices: {
            "YES": "tuckersoft-memory",
            "NO": "therapy-session"
        }
    },

    "tuckersoft-memory": {
        text: "As you prepare to leave, a sudden memory flashes - the buffer error that corrupted your game. The frustration, the late nights... The code seems to be affecting your mind. Maybe Dr. Haynes should know about this.",
        choices: {
            "Continue": "therapy-session"
        }
    },

    "therapy-session": {
        text: "1st Therapy Session\n\nDr. Haynes sits across from you in her office. 'How have you been sleeping?' she asks. The rabbit toy from your childhood sits on her desk. Your mother's death weighs heavily on your mind. The train, the delay, the choice that changed everything...",
        choices: {
            "Talk about past trauma": "talk-trauma",
            "Don't talk about it": "dont-talk"
        }
    },

    "talk-trauma": {
        text: "The words pour out. You tell Dr. Haynes about that morning - how you made your mother late for the 8:45 train. How you couldn't find your rabbit toy. How that delay meant she took the later train - the one that derailed. The guilt has haunted you ever since.",
        choices: {
            "Continue": "record-store"
        }
    },

    "dont-talk": {
        text: "Dr. Haynes notices your hesitation. 'Stefan, bottling things up won't help. Would you like to talk about what's troubling you?' Her eyes drift to the rabbit toy, a reminder of that fateful morning.",
        choices: {
            "Talk": "talk-trauma",
            "Don't talk": "record-store"
        }
    },

    "record-store": {
        text: "At the record store, you browse through albums. Two catch your eye - 'Phaedra' by Tangerine Dream and 'The Bermuda Triangle' by Isao Tomita. Something about the music feels significant to your game.",
        choices: {
            "Phaedra": "pour-tea",
            "The Bermuda Triangle": "bermuda-path"
        }
    },

    "pour-tea": {
        text: "Pour Tea on computer",
        choices: {
            "Continue": "ending-1"
        }
    },

    "bermuda-path": {
        text: "17th July 1984 → 2nd August → 20th August\n\nThe music inspires you, but your game keeps crashing at startup. The frustration builds as each attempt fails. Your father watches with growing concern as you become more obsessed. The code seems to mock you with each error.",
        choices: {
            "Shout at Dad": "shout-dad"
        }
    },

    "shout-dad": {
        text: "Your anger explodes. 'Stop watching me!' you scream. Your father backs away, hurt and concerned. In the silence that follows, two paths lie before you: seek help or follow Colin's mysterious invitation.",
        choices: {
            "Follow Colin": "follow-colin",
            "Meet Dr. Haynes": "therapy-two"
        }
    },

    "follow-colin": {
        text: "Colin's apartment is filled with code printouts and strange diagrams. 'Reality is a construct,' he explains, opening your mind to new possibilities. His theories about control and choice seem increasingly compelling. He offers you LSD, claiming it will help you see the truth.",
        choices: {
            "Take LSD": "take-lsd",
            "Refuse": "refuse-lsd"
        }
    },

    "refuse-lsd": {
        text: "You decline, but Colin smirks knowingly. 'Choice is an illusion,' he says, dropping the acid into your tea when you're not looking. The world begins to shift around you...",
        choices: {
            "Continue": "colin-jumps"
        }
    },

    "take-lsd": {
        text: "The acid takes hold. Reality bends and fractures. On Colin's balcony, the city seems to pulse with hidden meaning. 'One of us must jump,' Colin states matter-of-factly. 'A sacrifice for the program.' The ground below seems both distant and inviting.",
        choices: {
            "Stefan jumps off the roof": "ending-1",
            "Colin jumps off": "colin-jumps"
        }
    },

    "colin-jumps": {
        text: "Kitty's scream pierces the air as Colin steps off the balcony. You wake up in your father's car, gasping. Was it real? Kitty's later denial suggests otherwise, but Colin is nowhere to be found. The line between reality and fantasy blurs further.",
        choices: {
            "Continue": "therapy-two"
        }
    },

    "therapy-two": {
        text: "2nd Therapy Session\n\nDr. Haynes notices your agitation immediately. 'You seem different, Stefan.' The walls feel closer, the air thicker. Someone or something seems to be controlling your actions. Your body twitches with nervous energy.",
        choices: {
            "Bite nails": "bite-nails",
            "Pull on earlobe": "pull-earlobe"
        }
    },

    "bite-nails": {
        text: "Your teeth tear at your nails as Dr. Haynes watches. 'Someone's making you do this?' she asks. She increases your medication dosage, but you feel a strange resistance to her authority. The pills sit heavily in your hand.",
        choices: {
            "Take pills": "take-pills",
            "Flush pills": "flush-pills",
            "Throw pills away": "throw-pills"
        }
    },

    "pull-earlobe": {
        text: "Your fingers find your earlobe, pulling rhythmically. Dr. Haynes leans forward, concerned. 'These compulsions... they're getting stronger?' She writes a new prescription, but something feels wrong about the whole situation.",
        choices: {
            "Take pills": "take-pills",
            "Flush pills": "flush-pills",
            "Throw pills away": "throw-pills"
        }
    },

    "take-pills": {
        text: "12 Sept 1984 → 12 Sept 1984\n\nThe medication clouds your mind, but the game keeps crashing. During the delivery date preparation, everything falls apart. Colin's mysterious tape appears, containing impossible knowledge about your situation.",
        choices: {
            "Continue": "morning-after"
        }
    },

    "throw-pills": {
        text: "Something's deeply wrong. The pills fly across the room as your reality fractures. The world spins, and suddenly you're on the roof. The ground below promises an escape from this controlled existence.",
        choices: {
            "Continue": "morning-after"
        }
    },

    "morning-after": {
        text: "Next morning, the game crashes again. Your mind races with conspiracy theories. Colin's words echo in your head. The code seems alive, mocking you. Your computer screen flickers with malevolent purpose.",
        choices: {
            "Destroy Computer": "destroy-computer",
            "Hit Desk": "hit-desk"
        }
    },

    "hit-desk": {
        text: "Your fist slams into the desk. The pain centers you momentarily. Two objects catch your eye: a family photo from before your mother's death, and a mysterious book about government control.",
        choices: {
            "Pick up family photo": "family-photo",
            "Pick up book": "pick-book"
        }
    },

    "family-photo": {
        text: "Wakes up at night\nSees that the phone\ngame back to over and\nover again. Realizes\nwakes up over and over\nmaking new timelines",
        choices: {
            "Throw tea over computer": "netflix-path",
            "Destroy computer": "binary-path",
            "P.A.C.S": "pacs-path"
        }
    },

    "pick-book": {
        text: "The book reveals different code combinations. Each seems significant: JFD (Jerome F. Davies), PAX (Peace), PAC (Program and Control), or TOY (your childhood rabbit). Which will unlock the truth?",
        choices: {
            "JFD": "jfd-path",
            "PAX": "pax-path",
            "PAC": "pac-path",
            "TOY": "toy-path"
        }
    },

    "jfd-path": {
        text: "Wrong password. Jerome F. Davies' story feels connected to yours, but this isn't the right path.",
        choices: {
            "Try again": "pick-book"
        }
    },

    "pax-path": {
        text: "Wrong password. Peace seems far away now, as your grip on reality loosens.",
        choices: {
            "Try again": "pick-book"
        }
    },

    "pac-path": {
        text: "Wrong password. Program and Control... the words echo in your mind. There must be more to this.",
        choices: {
            "Try again": "pick-book",
            "Get angry": "pacs-path"
        }
    },

    "toy-path": {
        text: "The password triggers memories of your childhood. The toy rabbit, your mother, that fateful morning... Do you want to face these memories?",
        choices: {
            "Don't go": "ending-5",
            "Go with Mum": "ending-7"
        }
    },

    "pacs-path": {
        text: "You discover P.A.C.S files in your father's study. A keypad requires a code. The numbers seem to hold significance.",
        choices: {
            "2-0-5-4-1": "code-path",
            "Any other combination": "pick-book"
        }
    },

    "code-path": {
        text: "The truth unravels. Your father's surveillance, the therapy sessions, the train ticket - it all connects. Your game isn't just a game anymore.",
        choices: {
            "Continue": "kill-dad"
        }
    },

    "kill-dad": {
        text: "The truth about your father's control becomes too much. In a moment of rage, you've killed him. What now?",
        choices: {
            "Bury body": "bury-body",
            "Chop-up body": "chop-body",
            "Back Off": "back-off"
        }
    },

    "bury-body": {
        text: "Tucker calls about the game delivery while you're burying the body. Time is running out.",
        choices: {
            "Tell truth": "ending-4",
            "Lie": "ending-6"
        }
    },

    "chop-body": {
        text: "You make the grim choice to dispose of the evidence piece by piece. There's no going back now.",
        choices: {
            "Continue": "ending-4"
        }
    },

    "back-off": {
        text: "You step away from the body, horrified at what almost happened. Maybe there's still a chance to finish the game without losing yourself.",
        choices: {
            "Continue": "ending-3"
        }
    },

    "binary-path": {
        text: "Binary branch symbol",
        choices: {
            "Try to explain": "ending-8"
        }
    },

    "netflix-path": {
        text: "Netflix path begins",
        choices: {
            "Give more info": "more-info",
            "Stop": "stop-info"
        }
    },

    "more-info": {
        text: "Stefan gets deep into his theory",
        choices: {
            "Continue": "therapy-fight"
        }
    },

    "therapy-fight": {
        text: "3rd Therapy Session\nfight sequence begins",
        choices: {
            "Yeah": "yeah-fight",
            "FUCK 'EM": "fight-em"
        }
    },

    "yeah-fight": {
        text: "Fight sequence",
        choices: {
            "Jump out the window": "ending-8",
            "Fight her": "karate-fight"
        }
    },

    "karate-fight": {
        text: "Karate fight scene",
        choices: {
            "Karate chop dad": "ending-9",
            "Kill dad": "kill-dad"
        }
    },

    "ending-1": {
        text: "#1\nFRUSTRATION TAKES ITS TOLL\n\nALL OF STEFAN'S WORK IS LOST AND PRESUMABLY HE DROPS OUT.\nThe pressure of game development and haunting memories prove too much. Your journey ends here, the game unfinished, your story incomplete.\nTHE END",
        ending: true,
        showEnding: true
    },

    "ending-2": {
        text: "#2\nTHE ULTIMATE SACRIFICE\n\n5/5 (AVERAGE)\nGAME IS RELEASED.\nSTEFAN IS DEAD.\nYour masterpiece is complete, but at what cost? The lines between reality and game blur until the final choice. Critics praise your work, unaware of the true price paid.\nTHE END",
        ending: true,
        showEnding: true
    },

    "ending-3": {
        text: "#3\nPERFECT BALANCE\n\n5/5 (AVERAGE)\nGAME IS RELEASED\nNOBODY DIES\nYou navigate the complexities of game development while maintaining your sanity. Bandersnatch becomes a success, and you find peace with your past.\nTHE END",
        ending: true,
        showEnding: true
    },

    "ending-4": {
        text: "#4\nTHE PRICE OF TRUTH\n\n2.5/5 (AVERAGE)\nGAME IS RELEASED\nSTEFAN GOES TO JAIL\nDAD IS DEAD\nThe dark path you chose led to tragedy. The game releases, but your actions have consequences that will follow you forever.\nTHE END",
        ending: true,
        showEnding: true
    },

    "ending-5": {
        text: "#5\nREALITY BREAKS\n\nSTEFAN IS TOO STRESSED??\nDROPS OUT??\nINCONCLUSIVE.\nThe boundaries between reality and fiction collapse. Your grip on reality slips away as the game consumes your mind.\nTHE END",
        ending: true,
        showEnding: true
    },

    "ending-6": {
        text: "#6\nTHE PERFECT CRIME\n\n5/5 (Best)\nGAME IS RELEASED\nSTEFAN ESCAPED JAIL\nDAD IS DEAD\nPost credits:\nPEARL RITMAN DECIDES TO REMAKE THE GAME AND LIKE STEFAN GOES MAD\nYour masterpiece is complete, but its dark influence lives on, claiming new victims in an endless cycle.\nTHE END",
        ending: true,
        showEnding: true
    },

    "ending-7": {
        text: "#7\nTHE TRUTH REVEALED\n\nSTEFAN REMEMBERS HIS MOTHER'S DEATH FROM 1ST THERAPY SESSION\nThe past comes rushing back. The weight of your choices, both past and present, becomes clear. Some memories are better left buried.\nTHE END",
        ending: true,
        showEnding: true
    },

    "ending-8": {
        text: "#8\nMETA BREAKTHROUGH\n\nTHE GREATEST FOURTH WALL BREAK EVER. HANDS DOWN.\nReality itself breaks down as you realize the truth about your existence. The audience watches, but who's really in control?\nTHE END",
        ending: true,
        showEnding: true
    },

    "ending-9": {
        text: "#9\nDESCENT INTO MADNESS\n\nSTEFAN TOTALLY LOSES IT.\nPROGRAM GETS SENT TO THE ARCHIVES.\nThe pressure becomes too much. Your grip on reality slips away completely, and your work becomes a cautionary tale.\nTHE END",
        ending: true,
        showEnding: true
    },

    "ending-10": {
        text: "#10\nTOTAL COLLAPSE\n\nTHE GAME NEVER GETS RELEASED.\nTUCKERSOFT TANKS.\nSTEFAN ARRESTED FOR MURDER.\nEverything falls apart. The game, the company, your life - all destroyed by the choices made along the way.\nTHE END",
        ending: true,
        showEnding: true
    }
};

// Updates the timer display as time goes
function updateTimerDisplay(seconds) {
    let timerContainer = document.querySelector('.timer-container');
    if (!timerContainer) {
        timerContainer = document.createElement('div');
        timerContainer.className = 'timer-container';
        timerContainer.innerHTML = `
            <div class="timer-label">Time Remaining</div>
            <div class="timer">${seconds}</div>
        `;
        document.body.appendChild(timerContainer);
    } else {
        const timerDisplay = timerContainer.querySelector('.timer');
        if (timerDisplay) {
            timerDisplay.textContent = seconds;
        }
    }

    let timerBarContainer = document.querySelector('.timer-bar-container');
    if (!timerBarContainer) {
        timerBarContainer = document.createElement('div');
        timerBarContainer.className = 'timer-bar-container';
        timerBarContainer.innerHTML = '<div class="timer-bar"></div>';
        document.body.appendChild(timerBarContainer);
    }

    const timerBar = timerBarContainer.querySelector('.timer-bar');
    if (timerBar) {
        const percentageLeft = (seconds / CHOICE_TIME) * 100;
        timerBar.style.width = `${percentageLeft}%`;
        if (seconds <= 5) {
            timerBar.classList.add('urgent');
        } else {
            timerBar.classList.remove('urgent');
        }
    }
}

function startTimer() {
    let timeLeft = CHOICE_TIME;
    
    if (timer) {
        clearInterval(timer);
        const existingTimer = document.querySelector('.timer-container');
        const existingBar = document.querySelector('.timer-bar-container');
        if (existingTimer) existingTimer.remove();
        if (existingBar) existingBar.remove();
    }

    updateTimerDisplay(timeLeft);
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            const timerContainer = document.querySelector('.timer-container');
            const timerBarContainer = document.querySelector('.timer-bar-container');
            if (timerContainer) timerContainer.remove();
            if (timerBarContainer) timerBarContainer.remove();
            showTimeUpScreen();
        }
    }, 1000);
}
// Popup when time is over
function showTimeUpScreen() {
    const timeUpScreen = document.createElement('div');
    timeUpScreen.className = 'time-up-screen';
    
    timeUpScreen.innerHTML = `
        <div class="time-up-content">
            <h2 class="ending-title">Time's Up!</h2>
            <p class="ending-text">You took too long to make a choice.</p>
            <div class="time-up-buttons">
                <button id="tryAgainBtn">Try Again</button>
                <button id="returnMenuBtn">Return to Menu</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(timeUpScreen);
    
    const tryAgainBtn = timeUpScreen.querySelector('#tryAgainBtn');
    const returnMenuBtn = timeUpScreen.querySelector('#returnMenuBtn');
    
    tryAgainBtn.addEventListener('click', () => {
        timeUpScreen.remove();
        restartGame();
    });
    
    returnMenuBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

function showEndingScreen(text) {
    const endingScreen = document.createElement('div');
    endingScreen.className = 'ending-screen fade-out';
    
    endingScreen.innerHTML = `
        <div class="ending-content">
            <h2 class="ending-title">Game Over</h2>
            <p class="ending-text">${text}</p>
            <div class="ending-buttons">
                <button id="tryAgainBtn">Try Again</button>
                <button id="returnMenuBtn">Return to Menu</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(endingScreen);
    
    const tryAgainBtn = endingScreen.querySelector('#tryAgainBtn');
    const returnMenuBtn = endingScreen.querySelector('#returnMenuBtn');
    
    tryAgainBtn.addEventListener('click', () => {
        endingScreen.remove();
        restartGame();
    });
    
    returnMenuBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    endingScreen.offsetHeight;
    
    setTimeout(() => {
        endingScreen.classList.remove('fade-out');
        endingScreen.classList.add('fade-in');
    }, 50);
}

function updateDisplay(node) {
    const storyDiv = document.getElementById('story');
    const choicesDiv = document.getElementById('choices');
    const progressSpan = document.getElementById('progress');
    const container = document.querySelector('.container');
    
    // First fade everything out
    container.classList.add('fade-out');

    // Wait for fade-out to complete before changing content
    setTimeout(() => {
        // Update content while it's invisible
        storyDiv.textContent = node.text;
        progressSpan.textContent = `Chapter: ${currentChapter}`;
        choicesDiv.innerHTML = '';
        
        if (node.ending) {
            showEndingScreen(node.text);
            return;
        }

        // Create choice buttons
        Object.entries(node.choices).forEach(([choice, nextNode]) => {
            if (!storyNodes[nextNode]) return;
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice;
            btn.onclick = () => {
                clearInterval(timer);
                updateDisplay(storyNodes[nextNode]);
            };
            choicesDiv.appendChild(btn);
        });

        // After content is updated, fade everything back in
        setTimeout(() => {
            container.classList.remove('fade-out');
            container.classList.add('fade-in');
            
            // Remove the fade-in class after animation completes
            setTimeout(() => {
                container.classList.remove('fade-in');
            }, 300);
        }, 50);

        startTimer();
    }, 300);
}

function animateTransition(callback) {
    const container = document.querySelector('.container');
    container.classList.add('fade-out');
    
    setTimeout(() => {
        callback();
        container.classList.remove('fade-out');
        container.classList.add('fade-in');
        
        setTimeout(() => {
            container.classList.remove('fade-in');
        }, 300);
    }, 300);
}
// restart
function restartGame() {
    currentNodeKey = 'start';
    currentChapter = 'Start';
    clearInterval(timer); // Clear any existing timer
    updateDisplay(storyNodes.start);
}
// error handling and input validation
window.onload = async function() {
    try {
        if (!storyNodes || !storyNodes.start) {
            throw new Error('Game data not properly loaded');
        }

        // Add event listeners for menu and restart buttons
        const menuBtn = document.getElementById('menu-btn');
        const restartBtn = document.getElementById('restart-btn');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                if (confirm('Return to menu? All progress will be lost.')) {
                    window.location.href = 'index.html';
                }
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to restart? All progress will be lost.')) {
                    restartGame();
                }
            });
        }

        // Show initial message about voice commands
        showAlert('Click anywhere to enable voice commands (say "stop" to pause)');

        // Wait for user interaction before starting voice recognition
        document.body.addEventListener('click', async () => {
            if (!isListening) {
                await setupVoiceRecognition();
            }
        }, { once: true });

        // Initialize the game
        updateDisplay(storyNodes.start);

    } catch (error) {
        console.error('Error during initialization:', error);
        handleError(error);
    }
};

function handleError(error) {
    const errorScreen = document.createElement('div');
    errorScreen.className = 'error-screen';
    
    errorScreen.innerHTML = `
        <div class="error-content">
            <h2 class="ending-title">Error</h2>
            <p class="ending-text">Something went wrong.</p>
            <div class="error-buttons">
                <button id="returnMenuBtn">Return to Menu</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(errorScreen);
    
    const returnMenuBtn = errorScreen.querySelector('#returnMenuBtn');
    returnMenuBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// Function to handle ending popups
function showEndingPopup(text) {
    alert("You have reached an ending!\n\n" + text);
}

// Updated game logic to handle endings
function selectChoice(choice) {
    const nextNode = storyNodes[choice];
    if (nextNode.ending) {
        displayStoryNode(nextNode);
        showEndingPopup(nextNode.text);
    } else {
        displayStoryNode(nextNode);
    }
}