// ===== DEBUG SYSTEM =====
// Handles debug key holds and global debug variables
// To disable debugging, comment out or remove this entire file

export class DebugSystem {
    private qKeyHoldTimer: number = 0;
    private eKeyHoldTimer: number = 0;
    private qKeyHeld: boolean = false;
    private eKeyHeld: boolean = false;
    private readonly KEY_HOLD_DURATION: number = 800; // 0.8 seconds
    
    private onRestart: (() => void) | null = null;
    private onEndWave: (() => void) | null = null;

    constructor() {
        this.setupKeyListeners();
    }

    // Initialize debug callbacks
    initialize(onRestart: () => void, onEndWave: () => void) {
        this.onRestart = onRestart;
        this.onEndWave = onEndWave;
    }

    // Setup global debug variables
    setupGlobalDebug(player: any, game: any) {
        (window as any).myPlayer = player;
        (window as any).myGame = game;
    }

    // Update debug timers - call this from game update loop
    update(deltaTime: number, isCombatPhase: boolean) {
        // Only allow debug keys during combat phase
        if (isCombatPhase) {
            if (this.qKeyHeld) {
                this.qKeyHoldTimer += deltaTime;
                if (this.qKeyHoldTimer >= this.KEY_HOLD_DURATION) {
                    console.log('Q key held for 800ms - restarting game');
                    if (this.onRestart) this.onRestart();
                    this.qKeyHeld = false;
                    this.qKeyHoldTimer = 0;
                }
            }
            if (this.eKeyHeld) {
                this.eKeyHoldTimer += deltaTime;
                if (this.eKeyHoldTimer >= this.KEY_HOLD_DURATION) {
                    console.log('E key held for 800ms - ending wave');
                    if (this.onEndWave) this.onEndWave();
                    this.eKeyHeld = false;
                    this.eKeyHoldTimer = 0;
                }
            }
        }
    }

    private setupKeyListeners() {
        window.addEventListener('keydown', (e) => {
            // ===== DEBUG KEY HOLD DETECTION =====
            // Start hold timers for "q" and "e" keys
            if (e.code === 'KeyQ' && !this.qKeyHeld) {
                this.qKeyHeld = true;
                this.qKeyHoldTimer = 0;
                console.log('Q key pressed - hold timer started');
            }
            if (e.code === 'KeyE' && !this.eKeyHeld) {
                this.eKeyHeld = true;
                this.eKeyHoldTimer = 0;
                console.log('E key pressed - hold timer started');
            }
        });

        window.addEventListener('keyup', (e) => {
            // ===== DEBUG KEY HOLD RESET =====
            // Reset hold timers when keys are released
            if (e.code === 'KeyQ') {
                this.qKeyHeld = false;
                this.qKeyHoldTimer = 0;
            }
            if (e.code === 'KeyE') {
                this.eKeyHeld = false;
                this.eKeyHoldTimer = 0;
            }
        });
    }
} 