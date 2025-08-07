import { StatsPanel } from './StatsPanel'
import { Player } from '../../game/Player'

export enum UIScreen {
  PAUSE = 'pause',
  LEVELUP = 'levelup',
  SHOP = 'shop'
}

export class UnifiedUI {
  private container: HTMLElement | null = null
  private dynamicContent: HTMLElement | null = null
  private statsPanel: StatsPanel
  private currentScreen: UIScreen | null = null
  
  // Content templates (loaded once)
  private contentTemplates: Map<UIScreen, string> = new Map()
  
  // Event callbacks (to be set by Game)
  public onLevelUpSelection: ((statBonus: Record<string, number>) => void) | null = null
  public onGoWave: (() => void) | null = null
  public onResume: (() => void) | null = null

  constructor() {
    this.statsPanel = StatsPanel.getInstance()
    this.initializeAsync()
  }

  private async initializeAsync(): Promise<void> {
    await this.initializeContainer()
    await this.loadContentTemplates()
  }

  private async loadCSS(): Promise<void> {
    try {
      // Check if CSS is already loaded
      if (document.querySelector('link[href="/src/ui/components/UnifiedUI.css"]')) {
        console.log('✅ UnifiedUI CSS already loaded')
        return
      }

      // Create link element for CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.type = 'text/css'
      link.href = '/src/ui/components/UnifiedUI.css'
      
      // Add to document head
      document.head.appendChild(link)
      
      // Wait for CSS to load
      await new Promise<void>((resolve, reject) => {
        link.onload = () => {
          console.log('✅ UnifiedUI CSS loaded successfully')
          resolve()
        }
        link.onerror = () => {
          console.error('❌ Failed to load UnifiedUI CSS')
          reject(new Error('Failed to load UnifiedUI CSS'))
        }
      })
    } catch (error) {
      console.error('Failed to load UnifiedUI CSS:', error)
    }
  }

  private async initializeContainer(): Promise<void> {
    // Load CSS first
    await this.loadCSS()
    
    // Load main container HTML
    try {
      const response = await fetch('/src/ui/components/UnifiedUI.html')
      const html = await response.text()
      
      // Find the canvas element to position relative to it
      const canvas = document.querySelector('canvas')
      if (!canvas) {
        console.error('Canvas not found - cannot position UnifiedUI')
        return
      }
      
      // Get canvas parent container
      const canvasParent = canvas.parentElement
      if (!canvasParent) {
        console.error('Canvas parent not found')
        return
      }
      
      // Add to canvas parent so it overlays the canvas
      canvasParent.insertAdjacentHTML('beforeend', html)
      
      // Get references
      this.container = document.getElementById('unified-ui-container')
      this.dynamicContent = document.getElementById('dynamic-content')
      
      // Position container to match canvas exactly
      if (this.container && canvas) {
        const canvasRect = canvas.getBoundingClientRect()
        const parentRect = canvasParent.getBoundingClientRect()
        
        this.container.style.position = 'absolute'
        this.container.style.left = `${canvasRect.left - parentRect.left}px`
        this.container.style.top = `${canvasRect.top - parentRect.top}px`
        this.container.style.width = `${canvas.width}px`
        this.container.style.height = `${canvas.height}px`
      }
      
      // Make sure container is hidden by default
      if (this.container) {
        this.container.classList.add('hidden')
      }
      
      // Initialize stats panel
      const statsContainer = document.getElementById('stats-panel-container')
      if (statsContainer && this.statsPanel) {
        await this.statsPanel.initialize()
        this.statsPanel.registerContainer(statsContainer, true)
      }
      
      console.log('✅ UnifiedUI container initialized and positioned over canvas')
    } catch (error) {
      console.error('Failed to initialize UnifiedUI container:', error)
    }
  }

  private async loadContentTemplates(): Promise<void> {
    // Load all content templates once
    const templates = [
      { screen: UIScreen.PAUSE, file: '/src/ui/components/content/PauseContent.html' },
      { screen: UIScreen.LEVELUP, file: '/src/ui/components/content/LevelUpContent.html' },
      { screen: UIScreen.SHOP, file: '/src/ui/components/content/ShopContent.html' }
    ]

    for (const template of templates) {
      try {
        const response = await fetch(template.file)
        const html = await response.text()
        this.contentTemplates.set(template.screen, html)
        console.log(`✅ Loaded ${template.screen} content template`)
      } catch (error) {
        console.error(`Failed to load ${template.file}:`, error)
        this.contentTemplates.set(template.screen, `<div class="${template.screen}-content"><h2>${template.screen.toUpperCase()}</h2><p>Content loading failed</p></div>`)
      }
    }
  }

  // Main method for switching UI content
  public switchUI(screen: UIScreen): void {
    if (!this.container || !this.dynamicContent) {
      console.error('UnifiedUI not initialized yet')
      return
    }

    console.log(`🔄 Switching UI to: ${screen}`)
    
    // Update dynamic content
    const template = this.contentTemplates.get(screen)
    if (template) {
      this.dynamicContent.innerHTML = template
      this.setupScreenEventListeners(screen)
    }
    
    // Show container
    this.container.classList.remove('hidden')
    this.currentScreen = screen
  }

  public hide(): void {
    if (this.container) {
      this.container.classList.add('hidden')
      this.currentScreen = null
    }
  }

  public showHUD(): void {
    // For now, HUD is just hiding the unified UI
    this.hide()
  }

  // Update methods for different data types
  public updateStats(player: Player): void {
    this.statsPanel.update(player)
  }

  public updateWaveInfo(waveNumber: number, timer: number): void {
    // Wave info will be shown in HUD, not in unified UI
    console.log(`Wave ${waveNumber}, Timer: ${timer}`)
  }

  public updateWaveTimer(timer: number): void {
    // Wave timer will be shown in HUD
    // console.log(`Wave timer: ${timer}`)
  }

  public updateLevelUpInfo(credits: number): void {
    if (this.currentScreen === UIScreen.LEVELUP && this.dynamicContent) {
      const creditsElement = this.dynamicContent.querySelector('#credits-remaining')
      if (creditsElement) {
        creditsElement.textContent = `Choose a stat to improve (${credits} remaining)`
      }
    }
  }

  public updateShopInfo(waveNumber: number, soma: number): void {
    if (this.currentScreen === UIScreen.SHOP && this.dynamicContent) {
      const waveElement = this.dynamicContent.querySelector('#wave-number')
      const somaElement = this.dynamicContent.querySelector('#soma-amount')
      
      if (waveElement) waveElement.textContent = waveNumber.toString()
      if (somaElement) somaElement.textContent = soma.toString()
    }
  }

  private setupScreenEventListeners(screen: UIScreen): void {
    if (!this.dynamicContent) return

    // Setup event listeners based on current screen
    switch (screen) {
      case UIScreen.PAUSE:
        this.setupPauseListeners()
        break
      case UIScreen.LEVELUP:
        this.setupLevelUpListeners()
        break
      case UIScreen.SHOP:
        this.setupShopListeners()
        break
    }
  }

  private setupPauseListeners(): void {
    const resumeBtn = this.dynamicContent?.querySelector('#resume-btn')
    resumeBtn?.addEventListener('click', () => {
      if (this.onResume) {
        this.onResume()
      }
    })
  }

  private setupLevelUpListeners(): void {
    const statButtons = this.dynamicContent?.querySelectorAll('.stat-choice-btn')
    statButtons?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const statType = (e.target as HTMLElement).dataset.stat
        if (statType && this.onLevelUpSelection) {
          // Create stat bonus object based on stat type
          const statBonus: Record<string, number> = {}
          switch (statType) {
            case 'damage':
              statBonus.attack = 5
              break
            case 'health':
              statBonus.maxHP = 10
              break
            case 'speed':
              statBonus.moveSpeed = 3
              break
            case 'armor':
              statBonus.armor = 2
              break
          }
          this.onLevelUpSelection(statBonus)
        }
      })
    })
  }

  private setupShopListeners(): void {
    const goWaveBtn = this.dynamicContent?.querySelector('#go-wave-btn')
    goWaveBtn?.addEventListener('click', () => {
      if (this.onGoWave) {
        this.onGoWave()
      }
    })
  }
}