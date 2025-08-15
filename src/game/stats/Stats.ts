// =============================================================================
// SIMPLE STATS SYSTEM - JUST ADD NUMBERS!
// =============================================================================
// Core Principle: base + levelUp + gear = total
// No complex validation, no over-engineering, just simple addition

interface StatDefinition {
    key: string
    displayName: string
    baseValue: number
    minValue?: number
    maxValue?: number
    isPercent: boolean
    hideInStatsPanel: boolean
    emoji: string
}

export class Stats {
    // =============================================================================
    // THE THREE LAYERS (this is all we need!)
    // =============================================================================
    base: Record<string, number> = {}      // From data/stats.csv
    levelUp: Record<string, number> = {}   // From level up selections
    gear: Record<string, number> = {}      // From body parts and items
    
    // Stat definitions for UI and validation (loaded from CSV)
    private definitions: Record<string, StatDefinition> = {}
    
    // =============================================================================
    // CORE CALCULATION - JUST ADD THE THREE LAYERS
    // =============================================================================
    get total(): Record<string, number> {
        const result: Record<string, number> = {}
        
        // Get all possible stat names from all three layers
        const allStats = new Set([
            ...Object.keys(this.base),
            ...Object.keys(this.levelUp), 
            ...Object.keys(this.gear)
        ])
        
        // Add them up: base + levelUp + gear = total
        for (const stat of allStats) {
            let total = (this.base[stat] || 0) + 
                       (this.levelUp[stat] || 0) + 
                       (this.gear[stat] || 0)
            
            // Apply bounds checking from CSV (minValue/maxValue)
            const def = this.definitions[stat]
            if (def) {
                if (def.minValue !== undefined) {
                    total = Math.max(total, def.minValue)
                }
                if (def.maxValue !== undefined) {
                    total = Math.min(total, def.maxValue)
                }
                // Round percentage stats to whole numbers
                if (def.isPercent) {
                    total = Math.round(total)
                }
            }
            
            result[stat] = total
        }
        
        return result
    }
    
    // =============================================================================
    // GEAR MANAGEMENT (BODY PARTS + ITEMS)
    // =============================================================================
    // Recalculate gear stats from body parts
    updateGear(bodyParts: any[]) {
        this.gear = {} // Clear existing gear stats
        
        // Add stats from each body part
        for (const part of bodyParts) {
            if (part.stats) {
                for (const [stat, value] of Object.entries(part.stats)) {
                    if (typeof value === 'number') {
                        this.gear[stat] = (this.gear[stat] || 0) + value
                    }
                }
            }
        }
    }
    
    // =============================================================================
    // CSV LOADING (INITIALIZATION)
    // =============================================================================
    
    // Parse a CSV line handling quoted fields with commas
    private parseCSVLine(line: string): string[] {
        const fields: string[] = []
        let currentField = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim())
                currentField = ''
            } else {
                currentField += char
            }
        }
        
        // Add the last field
        fields.push(currentField.trim())
        
        return fields
    }
    // Load base stats and definitions from data/stats.csv
    async loadFromCSV(): Promise<void> {
        try {
            const response = await fetch('/data/stats.csv')
            const text = await response.text()
            const lines = text.split('\n').slice(1) // Skip header
            
            // Parse each line of the CSV
            for (const line of lines) {
                if (line.trim()) {
                    // Parse CSV properly handling quoted values with commas
                    const fields = this.parseCSVLine(line)
                    const [category, order, key, displayName, hideInStatsPanel,
                           description, isPercent, baseValue, minValue, maxValue, emoji] = fields
                    
                    // Create stat definition
                    const def: StatDefinition = {
                        key,
                        displayName,
                        baseValue: parseFloat(baseValue) || 0,
                        minValue: minValue && minValue !== '""' ? parseFloat(minValue) : undefined,
                        maxValue: maxValue && maxValue !== '""' ? parseFloat(maxValue) : undefined,
                        isPercent: isPercent === 'TRUE',
                        hideInStatsPanel: hideInStatsPanel === 'TRUE',
                        emoji: emoji && emoji !== '""' ? emoji.replace(/"/g, '') : ''
                    }
                    
                    // Store definition and initialize base stat
                    this.definitions[key] = def
                    this.base[key] = def.baseValue
                }
            }
            
            console.log(`Loaded ${Object.keys(this.base).length} base stats`)
        } catch (error) {
            console.error('Failed to load data/stats.csv:', error)
            // Fallback to minimal default stats
            this.base = {
                level: 0,
                xp: 0,
                maxHP: 10,
                hp: 10,
                damage: 0,
                armor: 0,
                moveSpeed: 0
            }
        }
    }
    
    // =============================================================================
    // SIMPLE STAT ACCESS
    // =============================================================================
    // Get single stat value (uses computed total)
    getStat(name: string): number {
        return this.total[name] || 0
    }
    
    // Set base stat directly (for core stats like current HP, XP)
    setBaseStat(name: string, value: number): void {
        this.base[name] = value
    }
    
    // Add to level up stats (for level up bonuses)
    addLevelUpStat(name: string, amount: number): void {
        this.levelUp[name] = (this.levelUp[name] || 0) + amount
    }
    
    // =============================================================================
    // UI DISPLAY HELPERS
    // =============================================================================
    // Get formatted stats for the UI stats panel
    getDisplayStats(): Array<{
        key: string
        displayName: string
        value: number
        formattedValue: string
        isPercent: boolean
        emoji: string
    }> {
        const stats: Array<any> = []
        const totals = this.total
        
        // Convert definitions to display format
        Object.values(this.definitions).forEach(def => {
            if (!def.hideInStatsPanel) {
                const value = totals[def.key] || 0
                const formattedValue = def.isPercent ? `${value}%` : value.toString()
                
                stats.push({
                    key: def.key,
                    displayName: def.displayName,
                    value,
                    formattedValue,
                    isPercent: def.isPercent,
                    emoji: def.emoji
                })
            }
        })
        
        return stats
    }

    // Update stats panel HTML (for single container approach)
    updateStatsPanel(container: HTMLElement): void {
        const displayStats = this.getDisplayStats()
        
        // Clear existing content
        container.innerHTML = ''
        
        // Generate HTML dynamically based on stats
        displayStats.forEach(stat => {
            const statElement = document.createElement('div')
            statElement.className = `stat-item ${stat.key}`
            statElement.innerHTML = `
                <span class="stat-name">${stat.emoji} ${stat.displayName}</span>
                <span class="stat-value">${stat.formattedValue}</span>
            `
            container.appendChild(statElement)
        })
    }

    // Legacy method for backward compatibility (calls the new method)
    updateMasterStatsPanel(container: HTMLElement): void {
        this.updateStatsPanel(container)
    }
    
    // =============================================================================
    // CONVENIENCE GETTERS/SETTERS
    // =============================================================================
    // XP and leveling helpers
    get level(): number { return this.getStat('level') }
    get xp(): number { return this.getStat('xp') }
    set xp(value: number) { this.setBaseStat('xp', value) }
    
    // HP helpers
    getCurrentHP(): number { return this.getStat('hp') }
    getMaxHP(): number { return this.getStat('maxHP') }
    setCurrentHP(value: number): void { this.setBaseStat('hp', value) }
}