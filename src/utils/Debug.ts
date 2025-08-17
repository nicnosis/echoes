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

    // Visual debug options
    public showBounds: boolean = true;

    constructor() {
        this.setupKeyListeners();
        this.createDebugUI();
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

    // Create debug UI elements
    private createDebugUI() {
        // Create debug panel container
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        `;

        // Create showBounds checkbox
        const showBoundsLabel = document.createElement('label');
        showBoundsLabel.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
        `;

        const showBoundsCheckbox = document.createElement('input');
        showBoundsCheckbox.type = 'checkbox';
        showBoundsCheckbox.id = 'showBounds';
        showBoundsCheckbox.checked = this.showBounds;
        
        // Update debug state when checkbox changes
        showBoundsCheckbox.addEventListener('change', (e) => {
            this.showBounds = (e.target as HTMLInputElement).checked;
            console.log('Debug showBounds:', this.showBounds);
        });

        const showBoundsText = document.createTextNode('Show Bounds');
        
        showBoundsLabel.appendChild(showBoundsCheckbox);
        showBoundsLabel.appendChild(showBoundsText);
        debugPanel.appendChild(showBoundsLabel);

        // Add to body when DOM is ready
        if (document.body) {
            document.body.appendChild(debugPanel);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(debugPanel);
            });
        }
    }
} 

// Export singleton instance for easy access
export const debug = new DebugSystem();