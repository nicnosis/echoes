import { Player } from '../../game/Player'
import { loadHTMLTemplate, injectTemplate } from '../utils/templateLoader'
import { StatsPanel } from './StatsPanel'

export class PauseScreen {
    private pauseOverlay!: HTMLElement
    private weaponSlots: HTMLElement[] = []
    private statsPanel!: StatsPanel
    private resumeBtn!: HTMLElement
    private restartBtn!: HTMLElement
    private mainMenuBtn!: HTMLElement

    constructor() {
        this.initializePauseScreen()
    }

    private async initializePauseScreen() {
        await this.createPauseOverlay()
        this.setupEventListeners()
    }

    private async createPauseOverlay() {
        try {
            // Load the HTML template
            const templateHTML = await loadHTMLTemplate('/src/ui/components/PauseScreen.html')

            // Create a temporary container to hold the template
            const tempContainer = document.createElement('div')
            injectTemplate(templateHTML, tempContainer)

            // Get the pause overlay element
            this.pauseOverlay = tempContainer.querySelector('#pause-overlay') as HTMLElement
            if (!this.pauseOverlay) {
                throw new Error('Could not find pause-overlay element in template')
            }

            // Add to the UI overlay
            const uiOverlay = document.getElementById('ui-overlay')
            if (uiOverlay) {
                uiOverlay.appendChild(this.pauseOverlay)
            } else {
                throw new Error('Could not find ui-overlay element')
            }

            // Get references to elements by ID (after they're in the DOM)
            this.resumeBtn = document.getElementById('resume-btn') as HTMLElement
            this.restartBtn = document.getElementById('restart-btn') as HTMLElement
            this.mainMenuBtn = document.getElementById('main-menu-btn') as HTMLElement

            // Get weapon slots
            this.weaponSlots = Array.from(document.querySelectorAll('.weapon-slot'))

            // Initialize StatsPanel with the stats section container
            const statsContainer = document.querySelector('.pause.stats-panel') as HTMLElement
            if (!statsContainer) {
                throw new Error('Stats section not found in pause overlay')
            }

            // Get StatsPanel instance and register this container
            this.statsPanel = StatsPanel.getInstance()
            await this.statsPanel.initialize()
            this.statsPanel.registerContainer(statsContainer)

            // Verify all elements were found
            if (!this.pauseOverlay || !this.resumeBtn || !this.restartBtn || !this.mainMenuBtn) {
                throw new Error('Could not find required elements in pause template')
            }

        } catch (error) {
            console.error('Failed to create pause overlay:', error)
            throw error
        }
    }



    private setupEventListeners() {
        this.resumeBtn.addEventListener('click', () => {
            this.hide()
        })

        this.restartBtn.addEventListener('click', () => {
            // This will be handled by the Game class
            this.hide()
            // Dispatch custom event for restart
            window.dispatchEvent(new CustomEvent('gameRestart'))
        })

        this.mainMenuBtn.addEventListener('click', () => {
            // This will be handled later
            console.log('Main menu clicked')
        })
    }

    show() {
        this.pauseOverlay.classList.add('active')
    }

    hide() {
        this.pauseOverlay.classList.remove('active')
    }

    update(player: Player) {
        // Update weapon slots
        this.updateWeaponSlots(player)

        // Update stats
        this.updateStats(player)
    }

    private updateWeaponSlots(player: Player) {
        // Clear all slots
        this.weaponSlots.forEach((slot, index) => {
            if (index < player.weapons.length) {
                const weapon = player.weapons[index]
                slot.textContent = weapon.name
                slot.classList.add('filled')
            } else {
                slot.textContent = 'Empty'
                slot.classList.remove('filled')
            }
        })
    }

    private updateStats(player: Player) {
        this.statsPanel.update(player)
    }

    isVisible(): boolean {
        return this.pauseOverlay.classList.contains('active')
    }
} 