import { Player } from '../../game/Player'

export interface LevelUpChoice {
  name: string
  emoji: string
  stat: 'maxHP' | 'attack' | 'armor' | 'moveSpeed'
  value: number
}

export class LevelUpScreen {
  private levelUpOverlay: HTMLElement
  private levelUpContainer: HTMLElement
  private choicesContainer: HTMLElement
  private titleElement: HTMLElement
  private continueButton: HTMLElement
  private onChoiceSelected: ((choice: LevelUpChoice) => void) | null = null
  private onContinue: (() => void) | null = null

  private levelChoices: LevelUpChoice[] = [
    { name: 'Max HP', emoji: '❤️', stat: 'maxHP', value: 2 },
    { name: 'Attack', emoji: '⚔️', stat: 'attack', value: 2 },
    { name: 'Armor', emoji: '🛡️', stat: 'armor', value: 2 },
    { name: 'Move Speed', emoji: '🏃', stat: 'moveSpeed', value: 5 }
  ]

  constructor() {
    console.log(`🎯 LevelUpScreen constructor called`);
    this.createLevelUpOverlay()
    this.setupEventListeners()
    console.log(`🎯 LevelUpScreen constructor completed`);
  }

  private createLevelUpOverlay() {
    // Create the overlay element
    this.levelUpOverlay = document.createElement('div')
    this.levelUpOverlay.id = 'levelup-overlay'
    this.levelUpOverlay.className = 'levelup-overlay'
    
    // Create the main container
    this.levelUpContainer = document.createElement('div')
    this.levelUpContainer.className = 'levelup-container'
    
    // Create the title
    this.titleElement = document.createElement('div')
    this.titleElement.className = 'levelup-title'
    this.titleElement.textContent = 'Level Up!'
    
    // Create the choices container
    this.choicesContainer = document.createElement('div')
    this.choicesContainer.className = 'levelup-choices'
    
    // Create choice elements
    this.levelChoices.forEach(choice => {
      const choiceElement = this.createChoiceElement(choice)
      this.choicesContainer.appendChild(choiceElement)
    })
    
    // Create continue button
    this.continueButton = document.createElement('button')
    this.continueButton.className = 'levelup-continue-btn'
    this.continueButton.textContent = 'Continue'
    this.continueButton.style.display = 'none' // Hidden initially
    
    // Assemble the structure
    this.levelUpContainer.appendChild(this.titleElement)
    this.levelUpContainer.appendChild(this.choicesContainer)
    this.levelUpContainer.appendChild(this.continueButton)
    this.levelUpOverlay.appendChild(this.levelUpContainer)
    
    // Add to the UI overlay
    const uiOverlay = document.getElementById('ui-overlay')
    if (uiOverlay) {
      uiOverlay.appendChild(this.levelUpOverlay)
      console.log(`🎯 Level up overlay added to UI overlay`);
    } else {
      console.error(`🎯 Could not find ui-overlay element!`);
    }
  }

  private createChoiceElement(choice: LevelUpChoice): HTMLElement {
    const choiceElement = document.createElement('div')
    choiceElement.className = 'levelup-choice'
    
    const emojiElement = document.createElement('div')
    emojiElement.className = 'choice-emoji'
    emojiElement.textContent = choice.emoji
    
    const nameElement = document.createElement('div')
    nameElement.className = 'choice-name'
    nameElement.textContent = choice.name
    
    const valueElement = document.createElement('div')
    valueElement.className = 'choice-value'
    valueElement.textContent = `+${choice.value}`
    
    const selectButton = document.createElement('button')
    selectButton.className = 'choice-select-btn'
    selectButton.textContent = 'Select'
    selectButton.dataset.stat = choice.stat
    
    choiceElement.appendChild(emojiElement)
    choiceElement.appendChild(nameElement)
    choiceElement.appendChild(valueElement)
    choiceElement.appendChild(selectButton)
    
    return choiceElement
  }

  private setupEventListeners() {
    this.choicesContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('choice-select-btn')) {
        const stat = target.dataset.stat as 'maxHP' | 'attack' | 'armor' | 'moveSpeed'
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
    console.log(`🎯 LevelUpScreen.show() called with ${levelsGained} levels`);
    this.onChoiceSelected = onChoiceSelected
    this.onContinue = onContinue
    this.levelUpOverlay.classList.add('active')
    this.continueButton.style.display = 'none' // Hide continue button initially
    
    // Update title to show how many levels gained
    if (levelsGained > 1) {
      this.titleElement.textContent = `Level Up! (+${levelsGained})`
    } else {
      this.titleElement.textContent = 'Level Up!'
    }
    console.log(`🎯 Level up overlay classes: ${this.levelUpOverlay.className}`);
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