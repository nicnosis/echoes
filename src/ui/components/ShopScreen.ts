import { Player } from '../../game/Player'
import { loadHTMLTemplate, injectTemplate } from '../utils/templateLoader'

export class ShopScreen {
  private shopOverlay!: HTMLElement
  private shopTitle!: HTMLElement
  private shopGold!: HTMLElement
  private rerollButton!: HTMLElement
  private continueButton!: HTMLElement
  private statElements: { [key: string]: HTMLElement } = {}
  private onContinue: (() => void) | null = null

  constructor() {
    console.log(`🎯 ShopScreen constructor called`)
    this.initializeShopScreen()
    console.log(`🎯 ShopScreen constructor completed`)
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
        console.log(`🎯 Shop overlay added to UI overlay`)
      } else {
        console.error(`🎯 Could not find ui-overlay element!`)
        throw new Error('Could not find ui-overlay element')
      }
      
      // Now get references to elements by ID (after they're in the DOM)
      this.shopTitle = document.getElementById('shop-title') as HTMLElement
      this.shopGold = document.getElementById('shop-gold') as HTMLElement
      this.rerollButton = document.getElementById('shop-reroll-btn') as HTMLElement
      this.continueButton = document.getElementById('shop-continue-btn') as HTMLElement
      
      // Get specific stat value elements from within the shop stats section
      this.statElements = {
        maxHP: document.querySelector('#shop-stats .stat-item.maxHP .stat-value') as HTMLElement,
        level: document.querySelector('#shop-stats .stat-item.level .stat-value') as HTMLElement,
        moveSpeed: document.querySelector('#shop-stats .stat-item.moveSpeed .stat-value') as HTMLElement,
        critChance: document.querySelector('#shop-stats .stat-item.critChance .stat-value') as HTMLElement,
        attack: document.querySelector('#shop-stats .stat-item.attack .stat-value') as HTMLElement,
        armor: document.querySelector('#shop-stats .stat-item.armor .stat-value') as HTMLElement,
        luck: document.querySelector('#shop-stats .stat-item.luck .stat-value') as HTMLElement
      }
      
      console.log(`🎯 Found ${Object.keys(this.statElements).length} stat elements in shop stats`)
      
      // Debug: Check if shop-stats element exists
      const shopStatsElement = document.getElementById('shop-stats')
      console.log(`🎯 Shop stats element found:`, shopStatsElement)
      
      // Verify all elements were found
      if (!this.shopTitle || !this.shopGold || !this.rerollButton || !this.continueButton) {
        throw new Error('Could not find required elements in shop template')
      }
      
      // Verify stat elements were found
      const missingStats = Object.entries(this.statElements).filter(([key, element]) => !element)
      if (missingStats.length > 0) {
        console.warn(`🎯 Missing stat elements: ${missingStats.map(([key]) => key).join(', ')}`)
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
    
    // Update each stat element directly
    if (this.statElements.maxHP) {
      this.statElements.maxHP.textContent = player.maxHP.toString()
    }
    
    if (this.statElements.level) {
      this.statElements.level.textContent = player.level.toString()
    }
    
    if (this.statElements.moveSpeed) {
      this.statElements.moveSpeed.textContent = player.actualStats.moveSpeed.toString()
    }
    
    if (this.statElements.critChance) {
      this.statElements.critChance.textContent = `${player.critChance}%`
    }
    
    if (this.statElements.attack) {
      this.statElements.attack.textContent = player.attack.toString()
    }
    
    if (this.statElements.armor) {
      this.statElements.armor.textContent = player.armor.toString()
    }
    
    if (this.statElements.luck) {
      this.statElements.luck.textContent = player.luck.toString()
    }
    
    console.log(`🎯 Shop stats updated - Max HP: ${player.maxHP}, Level: ${player.level}`)
  }

  hide() {
    this.shopOverlay.classList.remove('active')
    this.onContinue = null
  }

  isVisible(): boolean {
    return this.shopOverlay.classList.contains('active')
  }
} 