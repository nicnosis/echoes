# Unified UI Container Architecture

## Current Problem 🚨
- Multiple separate DOM elements for each screen (PauseScreen, LevelUpScreen, ShopScreen)
- Three separate StatsPanel instances that need synchronization
- Complex DOM management and potential inconsistencies

## Solution: Unified Container with Dynamic Content 🎯

### **Core Concept:**
One main UI container with horizontal flexbox layout:
- **Left side:** Dynamic content area (changes based on current screen)
- **Right side:** Single StatsPanel (always visible, always consistent)

### **Benefits:**
- ✅ Single StatsPanel instance (no synchronization issues)
- ✅ Clean content switching with simple method calls
- ✅ Consistent layout and styling
- ✅ Easy to maintain and extend

## Architecture Overview 🏗️

### **File Structure:**
```
src/ui/
├── components/
│   ├── UnifiedUI.ts          // Main UI manager
│   ├── UnifiedUI.html        // Main container structure
│   ├── content/
│   │   ├── PauseContent.html     // Pause screen content only
│   │   ├── LevelUpContent.html   // Level up screen content only
│   │   └── ShopContent.html      // Shop screen content only
│   ├── StatsPanel.ts         // Single stats panel (existing)
│   └── StatsPanel.html       // Single stats panel (existing)
```

### **HTML Structure:**
```html
<!-- UnifiedUI.html -->
<div id="unified-ui-container" class="hidden">
  <div class="ui-content">
    <!-- Left side: Dynamic content area -->
    <div id="dynamic-content">
      <!-- Content gets loaded here dynamically -->
    </div>
    
    <!-- Right side: Single stats panel -->
    <div id="stats-panel-container">
      <!-- StatsPanel.html content loaded here -->
    </div>
  </div>
</div>
```

### **CSS Structure:**
```css
/* UnifiedUI.css */
#unified-ui-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
}

.ui-content {
  display: flex;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  gap: 20px;
}

#dynamic-content {
  flex: 1;
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
}

#stats-panel-container {
  width: 300px;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
}

.hidden {
  display: none;
}
```

## Implementation 🔧

### **1. UnifiedUI.ts (Main Manager)**
```typescript
enum UIScreen {
  PAUSE = 'pause',
  LEVELUP = 'levelup',
  SHOP = 'shop'
}

export class UnifiedUI {
  private container: HTMLElement
  private dynamicContent: HTMLElement
  private statsPanel: StatsPanel
  private currentScreen: UIScreen | null = null
  
  // Content templates (loaded once)
  private contentTemplates: Map<UIScreen, string> = new Map()

  constructor() {
    this.initializeContainer()
    this.loadContentTemplates()
    this.statsPanel = new StatsPanel()
  }

  private async initializeContainer(): Promise<void> {
    // Load main container HTML
    const response = await fetch('/src/ui/components/UnifiedUI.html')
    const html = await response.text()
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', html)
    
    // Get references
    this.container = document.getElementById('unified-ui-container')!
    this.dynamicContent = document.getElementById('dynamic-content')!
    
    // Initialize stats panel
    const statsContainer = document.getElementById('stats-panel-container')!
    this.statsPanel.initialize(statsContainer)
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
      } catch (error) {
        console.error(`Failed to load ${template.file}:`, error)
        this.contentTemplates.set(template.screen, `<p>Error loading ${template.screen} content</p>`)
      }
    }
  }

  // Main method for switching UI content
  public switchUI(screen: UIScreen): void {
    console.log(`🔄 Switching UI to: ${screen}`)
    
    // Update dynamic content
    const template = this.contentTemplates.get(screen)
    if (template) {
      this.dynamicContent.innerHTML = template
      this.setupScreenEventListeners(screen)
    }
    
    // Update stats panel (always the same instance)
    this.statsPanel.update()
    
    // Show container
    this.container.classList.remove('hidden')
    this.currentScreen = screen
  }

  public hide(): void {
    this.container.classList.add('hidden')
    this.currentScreen = null
  }

  public updateStats(): void {
    // Update the single stats panel
    this.statsPanel.update()
  }

  private setupScreenEventListeners(screen: UIScreen): void {
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
    const resumeBtn = this.dynamicContent.querySelector('#resume-btn')
    resumeBtn?.addEventListener('click', () => {
      this.hide()
      // Emit resume event or call game method
    })
  }

  private setupLevelUpListeners(): void {
    const statButtons = this.dynamicContent.querySelectorAll('.stat-choice-btn')
    statButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const statType = (e.target as HTMLElement).dataset.stat
        // Handle level up selection
        this.onLevelUpSelection(statType!)
      })
    })
  }

  private setupShopListeners(): void {
    const goWaveBtn = this.dynamicContent.querySelector('#go-wave-btn')
    goWaveBtn?.addEventListener('click', () => {
      this.hide()
      // Emit go wave event or call game method
    })
  }

  // Event handlers (to be connected to game)
  private onLevelUpSelection(statType: string): void {
    // This will be connected to game.onLevelUpSelection()
    console.log(`Selected stat: ${statType}`)
  }
}
```

### **2. Content Templates (Simple HTML)**

**PauseContent.html:**
```html
<div class="pause-content">
  <h2>Game Paused</h2>
  <div class="pause-buttons">
    <button id="resume-btn" class="btn-primary">Resume</button>
    <button id="settings-btn" class="btn-secondary">Settings</button>
    <button id="quit-btn" class="btn-danger">Quit</button>
  </div>
</div>
```

**LevelUpContent.html:**
```html
<div class="levelup-content">
  <h2>Level Up!</h2>
  <p id="credits-remaining">Choose a stat to improve (X remaining)</p>
  
  <div class="stat-choices">
    <button class="stat-choice-btn" data-stat="damage">
      <span class="stat-name">Damage</span>
      <span class="stat-bonus">+5</span>
    </button>
    <button class="stat-choice-btn" data-stat="health">
      <span class="stat-name">Health</span>
      <span class="stat-bonus">+10</span>
    </button>
    <button class="stat-choice-btn" data-stat="speed">
      <span class="stat-name">Speed</span>
      <span class="stat-bonus">+3</span>
    </button>
    <button class="stat-choice-btn" data-stat="armor">
      <span class="stat-name">Armor</span>
      <span class="stat-bonus">+2</span>
    </button>
  </div>
</div>
```

**ShopContent.html:**
```html
<div class="shop-content">
  <h2>Shop - Wave <span id="wave-number">X</span></h2>
  <p>Soma: <span id="soma-amount">0</span></p>
  
  <div class="shop-items">
    <!-- Shop items will be populated dynamically -->
    <p>Shop items coming soon...</p>
  </div>
  
  <div class="shop-actions">
    <button id="reroll-btn" class="btn-secondary">Reroll (Cost: 10)</button>
    <button id="go-wave-btn" class="btn-primary">Start Next Wave</button>
  </div>
</div>
```

## Integration with Game.ts 🎮

### **Game.ts Integration:**
```typescript
export class Game {
  private unifiedUI: UnifiedUI

  constructor(canvas: HTMLCanvasElement) {
    // ... existing initialization
    this.unifiedUI = new UnifiedUI()
    
    // Connect UI callbacks
    this.unifiedUI.onLevelUpSelection = (statBonus) => this.onLevelUpSelection(statBonus)
    this.unifiedUI.onGoWave = () => this.onGoWaveClicked()
    this.unifiedUI.onResume = () => this.onPauseToggle()
  }

  // Phase transition methods
  private beginLevelUp(): void {
    this.gamePhase = GamePhase.LEVELUP
    this.unifiedUI.switchUI(UIScreen.LEVELUP)
  }

  private beginShop(): void {
    this.gamePhase = GamePhase.SHOP
    this.unifiedUI.switchUI(UIScreen.SHOP)
  }

  public onPauseToggle(): void {
    if (this.paused) {
      this.paused = false
      this.unifiedUI.hide()
    } else {
      this.paused = true
      this.unifiedUI.switchUI(UIScreen.PAUSE)
    }
  }

  // Update stats across all UI
  private updateAllStats(): void {
    this.unifiedUI.updateStats()
  }
}
```

## Migration Strategy 📋

### **Phase 1: Create Unified Structure**
1. Create `UnifiedUI.ts` and `UnifiedUI.html`
2. Create content template files
3. Test basic switching functionality

### **Phase 2: Extract Content**
4. Copy content from existing `PauseScreen.html` → `PauseContent.html`
5. Copy content from existing `LevelUpScreen.html` → `LevelUpContent.html`
6. Copy content from existing `ShopScreen.html` → `ShopContent.html`

### **Phase 3: Connect to Game**
7. Replace individual screen calls with `unifiedUI.switchUI()`
8. Connect event handlers
9. Test all transitions

### **Phase 4: Cleanup**
10. Remove old `PauseScreen.ts`, `LevelUpScreen.ts`, `ShopScreen.ts`
11. Remove old HTML files
12. Update imports in Game.ts

## Benefits Summary ✅

### **Immediate Benefits:**
- ✅ Single StatsPanel instance (no sync issues)
- ✅ Consistent layout and styling
- ✅ Simple `switchUI(screen)` method
- ✅ Easy to add new screens

### **Long-term Benefits:**
- ✅ Easier maintenance and debugging
- ✅ Better performance (less DOM manipulation)
- ✅ Consistent user experience
- ✅ Perfect foundation for animations/transitions

This architecture gives you exactly what you wanted: super simple UI switching with a single stats panel that never gets out of sync! 🚀

