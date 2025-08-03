import { Player } from '../../game/Player'
import { loadHTMLTemplate, injectTemplate } from '../utils/templateLoader'

export interface LevelUpChoice {
    name: string
    emoji: string
    stat: 'maxHP' | 'damage' | 'armor' | 'moveSpeed'
    value: number
}

export class LevelUpScreen {
    private levelUpOverlay!: HTMLElement
    private titleElement!: HTMLElement
    private choicesContainer!: HTMLElement
    private continueButton!: HTMLElement
    private onChoiceSelected: ((choice: LevelUpChoice) => void) | null = null
    private onContinue: (() => void) | null = null

    private levelChoices: LevelUpChoice[] = [
        { name: 'Max HP', emoji: '❤️', stat: 'maxHP', value: 5 },
        { name: 'Damage', emoji: '⚔️', stat: 'damage', value: 5 },
        { name: 'Armor', emoji: '🛡️', stat: 'armor', value: 5 },
        { name: 'Move Speed', emoji: '🏃', stat: 'moveSpeed', value: 5 }
    ]

    constructor() {
        // console.log(`🎯 LevelUpScreen constructor called`);
        this.initializeLevelUpScreen();
        // console.log(`🎯 LevelUpScreen constructor completed`);
    }

    private async initializeLevelUpScreen() {
        await this.createLevelUpOverlay()
        this.setupEventListeners()
    }

    private async createLevelUpOverlay() {
        try {
            // Load the HTML template
            const templateHTML = await loadHTMLTemplate('/src/ui/components/LevelUpScreen.html')

            // Create a temporary container to hold the template
            const tempContainer = document.createElement('div')
            injectTemplate(templateHTML, tempContainer)

            // Get the level up overlay element
            this.levelUpOverlay = tempContainer.querySelector('#levelup-overlay') as HTMLElement
            if (!this.levelUpOverlay) {
                throw new Error('Could not find levelup-overlay element in template')
            }

            // Add to the UI overlay first
            const uiOverlay = document.getElementById('ui-overlay')
            if (uiOverlay) {
                uiOverlay.appendChild(this.levelUpOverlay)
                console.log(`🎯 Level up overlay added to UI overlay`);
            } else {
                console.error(`🎯 Could not find ui-overlay element!`);
                throw new Error('Could not find ui-overlay element')
            }

            // Now get references to elements by ID (after they're in the DOM)
            this.titleElement = document.getElementById('levelup-title') as HTMLElement
            this.choicesContainer = document.querySelector('.levelup-choices') as HTMLElement
            this.continueButton = document.getElementById('levelup-continue-btn') as HTMLElement

            // Verify all elements were found
            if (!this.titleElement || !this.choicesContainer || !this.continueButton) {
                throw new Error('Could not find required elements in level up template')
            }

        } catch (error) {
            console.error('Failed to create level up overlay:', error)
            throw error
        }
    }

    private setupEventListeners() {
        this.choicesContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            if (target.classList.contains('choice-select-btn')) {
                const stat = target.dataset.stat as 'maxHP' | 'damage' | 'armor' | 'moveSpeed'
                const choice = this.levelChoices.find(c => c.stat === stat)
                if (choice && this.onChoiceSelected) {
                    this.onChoiceSelected(choice)
                }
            }
        })

        this.continueButton.addEventListener('click', () => {
            if (this.onContinue) {
                this.onContinue()
            }
        })
    }

    show(levelsGained: number, onChoiceSelected: (choice: LevelUpChoice) => void, onContinue: () => void) {
        // console.log(`🎯 LevelUpScreen.show() called with ${levelsGained} levels`);
        this.onChoiceSelected = onChoiceSelected
        this.onContinue = onContinue
        this.levelUpOverlay.classList.add('active')
        this.continueButton.style.display = 'none' // Hide continue button initially

        // Update title to show selection progress
        if (levelsGained > 1) {
            this.titleElement.textContent = `Make selection (1/${levelsGained}):`
        } else {
            this.titleElement.textContent = 'Make selection:'
        }
        // console.log(`🎯 Level up overlay classes: ${this.levelUpOverlay.className}`);
    }

    updateTitle(currentSelection: number, totalSelections: number) {
        if (totalSelections > 1) {
            this.titleElement.textContent = `Make selection (${currentSelection}/${totalSelections}):`
        } else {
            this.titleElement.textContent = 'Make selection:'
        }
    }

    showContinueButton() {
        this.continueButton.style.display = 'block'
    }

    hide() {
        this.levelUpOverlay.classList.remove('active')
        this.onChoiceSelected = null
    }

    isVisible(): boolean {
        return this.levelUpOverlay.classList.contains('active')
    }
} 