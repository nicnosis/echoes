// ===== DEBUG SYSTEM =====
// Handles debug hotkeys and global debug variables
// To disable debugging, comment out or remove this entire file

export class DebugSystem {
    private onAddXP: ((amount: number) => void) | null = null;
    private onSetWaveTimer: ((time: number) => void) | null = null;

    // Visual debug options - modular structure
    public display = {
        bounds: false,      // Show hitboxes, weapon ranges, pickup radius
        grid: true,        // Show coordinate grid
        playerBreathe: true // Enable player breathing animation
    };

    constructor() {
        this.setupKeyListeners();
        this.createDebugUI();
    }

    // Initialize debug callbacks
    initialize(onAddXP: (amount: number) => void, onSetWaveTimer: (time: number) => void) {
        this.onAddXP = onAddXP;
        this.onSetWaveTimer = onSetWaveTimer;
    }

    // Setup global debug variables
    setupGlobalDebug(player: any, game: any) {
        (window as any).myPlayer = player;
        (window as any).myGame = game;
    }

    // Update zoom indicator display
    updateZoomIndicator(zoomLevel: number) {
        const zoomIndicator = document.getElementById('zoom-indicator');
        if (zoomIndicator) {
            zoomIndicator.textContent = `Zoom: ${zoomLevel.toFixed(1)}x`;
        }
    }


    private setupKeyListeners() {
        window.addEventListener('keydown', (e) => {
            // ===== DEBUG TOGGLE HOTKEYS =====
            if (e.code === 'KeyB') {
                this.display.bounds = !this.display.bounds;
                const checkbox = document.getElementById('showBounds') as HTMLInputElement;
                if (checkbox) checkbox.checked = this.display.bounds;
                // console.log('Debug bounds toggled:', this.display.bounds);
            }
            if (e.code === 'KeyG') {
                this.display.grid = !this.display.grid;
                const checkbox = document.getElementById('showGrid') as HTMLInputElement;
                if (checkbox) checkbox.checked = this.display.grid;
                // console.log('Debug grid toggled:', this.display.grid);
            }
            if (e.code === 'Semicolon') {
                this.display.playerBreathe = !this.display.playerBreathe;
                const checkbox = document.getElementById('playerBreathe') as HTMLInputElement;
                if (checkbox) checkbox.checked = this.display.playerBreathe;
                // console.log('Debug playerBreathe toggled:', this.display.playerBreathe);
            }
            if (e.code === 'Digit1') {
                if (this.onAddXP) {
                    this.onAddXP(50);
                }
            }
            if (e.code === 'KeyE') {
                if (this.onSetWaveTimer) {
                    this.onSetWaveTimer(0);
                    console.log('Debug: Wave timer set to 0');
                }
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
            bottom: 10px;
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
        showBoundsCheckbox.checked = this.display.bounds;
        
        // Update debug state when checkbox changes
        showBoundsCheckbox.addEventListener('change', (e) => {
            this.display.bounds = (e.target as HTMLInputElement).checked;
            console.log('Debug display.bounds:', this.display.bounds);
        });

        const showBoundsText = document.createTextNode('Show Bounds');
        
        showBoundsLabel.appendChild(showBoundsCheckbox);
        showBoundsLabel.appendChild(showBoundsText);
        debugPanel.appendChild(showBoundsLabel);

        // Create showGrid checkbox
        const showGridLabel = document.createElement('label');
        showGridLabel.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            margin-top: 4px;
        `;

        const showGridCheckbox = document.createElement('input');
        showGridCheckbox.type = 'checkbox';
        showGridCheckbox.id = 'showGrid';
        showGridCheckbox.checked = this.display.grid;
        
        // Update debug state when checkbox changes
        showGridCheckbox.addEventListener('change', (e) => {
            this.display.grid = (e.target as HTMLInputElement).checked;
            console.log('Debug display.grid:', this.display.grid);
        });

        const showGridText = document.createTextNode('Show Grid');
        
        showGridLabel.appendChild(showGridCheckbox);
        showGridLabel.appendChild(showGridText);
        debugPanel.appendChild(showGridLabel);

        // Create playerBreathe checkbox
        const playerBreatheLabel = document.createElement('label');
        playerBreatheLabel.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            margin-top: 4px;
        `;

        const playerBreatheCheckbox = document.createElement('input');
        playerBreatheCheckbox.type = 'checkbox';
        playerBreatheCheckbox.id = 'playerBreathe';
        playerBreatheCheckbox.checked = this.display.playerBreathe;
        
        // Update debug state when checkbox changes
        playerBreatheCheckbox.addEventListener('change', (e) => {
            this.display.playerBreathe = (e.target as HTMLInputElement).checked;
            console.log('Debug display.playerBreathe:', this.display.playerBreathe);
        });

        const playerBreatheText = document.createTextNode('Player Breathe');
        
        playerBreatheLabel.appendChild(playerBreatheCheckbox);
        playerBreatheLabel.appendChild(playerBreatheText);
        debugPanel.appendChild(playerBreatheLabel);

        // Create zoom indicator
        const zoomIndicator = document.createElement('div');
        zoomIndicator.id = 'zoom-indicator';
        zoomIndicator.style.cssText = `
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.3);
            color: #aaa;
        `;
        zoomIndicator.textContent = 'Zoom: 1.5x';
        debugPanel.appendChild(zoomIndicator);

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