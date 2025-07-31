import { Player } from '../../game/Player'
import { loadHTMLTemplate, injectTemplate } from '../utils/templateLoader'
import { StatsPanel } from './StatsPanel'

export class ShopScreen {
    private shopOverlay!: HTMLElement
    private shopTitle!: HTMLElement
    private shopGold!: HTMLElement
    private rerollButton!: HTMLElement
    private continueButton!: HTMLElement
    private statsPanel!: StatsPanel
    private onContinue: (() => void) | null = null

    constructor() {
        // console.log(`🎯 ShopScreen constructor called`)
        this.initializeShopScreen()
        // console.log(`🎯 ShopScreen constructor completed`)
    }

    private async initializeShopScreen() {
        await this.createShopOverlay()
        this.setupEventListeners()
    }

    private async createShopOverlay() {
        try {
            // Load the HTML template
            const templateHTML = await loadHTMLTemplate('/src/ui/components/ShopScreen.html')

            // Create a temporary container to hold the template
            const tempContainer = document.createElement('div')
            injectTemplate(templateHTML, tempContainer)

            // Get the shop overlay element
            this.shopOverlay = tempContainer.querySelector('#shop-overlay') as HTMLElement
            if (!this.shopOverlay) {
                throw new Error('Could not find shop-overlay element in template')
            }

            // Add to the UI overlay first
            const uiOverlay = document.getElementById('ui-overlay')
            if (uiOverlay) {
                uiOverlay.appendChild(this.shopOverlay)
                // console.log(`🎯 Shop overlay added to UI overlay`)
            } else {
                // console.error(`🎯 Could not find ui-overlay element!`)
                throw new Error('Could not find ui-overlay element')
            }

            // Now get references to elements by ID (after they're in the DOM)
            this.shopTitle = document.getElementById('shop-title') as HTMLElement
            this.shopGold = document.getElementById('shop-gold') as HTMLElement
            this.rerollButton = document.getElementById('shop-reroll-btn') as HTMLElement
            this.continueButton = document.getElementById('shop-continue-btn') as HTMLElement

            // Initialize StatsPanel component with the shop-stats container
            const shopStatsContainer = document.getElementById('shop-stats') as HTMLElement
            if (!shopStatsContainer) {
                throw new Error('Could not find shop-stats container')
            }

            // Clear the existing stats content and load the new StatsPanel
            shopStatsContainer.innerHTML = ''
            this.statsPanel = new StatsPanel(shopStatsContainer)
            await this.statsPanel.load()

            console.log(`🎯 StatsPanel loaded in shop stats container`)

            // Verify all elements were found
            if (!this.shopTitle || !this.shopGold || !this.rerollButton || !this.continueButton) {
                throw new Error('Could not find required elements in shop template')
            }

        } catch (error) {
            console.error('Failed to create shop overlay:', error)
            throw error
        }
    }

    private setupEventListeners() {
        this.continueButton.addEventListener('click', () => {
            if (this.onContinue) {
                this.onContinue()
            }
        })

        this.rerollButton.addEventListener('click', () => {
            // TODO: Implement reroll functionality
            console.log('Reroll clicked')
        })
    }

    show(waveNumber: number, onContinue: () => void) {
        console.log(`🎯 ShopScreen.show() called for wave ${waveNumber}`)
        this.onContinue = onContinue
        this.shopOverlay.classList.add('active')

        // Update wave number in title and continue button
        this.shopTitle.textContent = `Shop (Wave ${waveNumber})`
        this.continueButton.textContent = `Go (Wave ${waveNumber + 1})`

        console.log(`🎯 Shop overlay classes: ${this.shopOverlay.className}`)
    }

    update(player: Player) {
        console.log(`🎯 Shop update called - Player Max HP: ${player.maxHP}, Level: ${player.level}`)
        // Update gold/soma
        this.shopGold.textContent = `Soma: ${player.gold}`

        // Update stats using the StatsPanel component
        this.statsPanel.update(player)

        console.log(`🎯 Shop stats updated via StatsPanel`)
    }

    hide() {
        this.shopOverlay.classList.remove('active')
        this.onContinue = null
    }

    isVisible(): boolean {
        return this.shopOverlay.classList.contains('active')
    }
} 