import { StatDefinition } from './StatDefinition'
import { XPTable } from './XPTable'

export class StatsManager {
    private statDefinitions: Map<string, StatDefinition> = new Map()

    // Layered stats storage - ALL stats go here (including level, XP, HP)
    private baseStats: Map<string, number> = new Map()
    private levelUpStats: Map<string, number> = new Map()
    private gearStats: Map<string, number> = new Map()
    private totalStats: Map<string, number> = new Map()

    constructor() {
        this.loadStatsFromCSV()
        XPTable.loadXPTable() // Load XP table
    }

    // CSV Loading
    private async loadStatsFromCSV(): Promise<void> {
        try {
            const response = await fetch('/stats.csv')
            const csvText = await response.text()
            this.parseCSV(csvText)
            this.initializeStats()
        } catch (error) {
            console.error('Failed to load stats.csv:', error)
            this.initializeDefaultStats()
        }
    }

    private parseCSV(csvText: string): void {
        const lines = csvText.split('\n').slice(1) // Skip header

        lines.forEach(line => {
            if (line.trim()) {
                const [category, order, key, displayName, hideInStatsPanel,
                    description, isPercent, baseValue, minValue, maxValue, emoji] =
                    line.split(',').map(cell => cell.trim())

                const statDef: StatDefinition = {
                    category: category as 'primary' | 'secondary' | 'core',
                    order: parseInt(order),
                    key,
                    displayName,
                    hideInStatsPanel: hideInStatsPanel === 'TRUE',
                    description,
                    isPercent: isPercent === 'TRUE',
                    baseValue: parseFloat(baseValue) || 0,
                    minValue: minValue ? parseFloat(minValue) : undefined,
                    maxValue: maxValue ? parseFloat(maxValue) : undefined,
                    emoji: emoji || ''
                }

                this.statDefinitions.set(key, statDef)
            }
        })
    }

    private initializeStats(): void {
        // Initialize ALL stats with base values from CSV
        this.statDefinitions.forEach((statDef, key) => {
            this.baseStats.set(key, statDef.baseValue)

            // Core stats don't have level up or gear bonuses
            if (statDef.category !== 'core') {
                this.levelUpStats.set(key, 0)
                this.gearStats.set(key, 0)
            }
        })
        this.recalculateStats()
    }

    private initializeDefaultStats(): void {
        // Fallback if CSV fails to load
        const defaultStats = [
            { key: 'level', baseValue: 0 },
            { key: 'xp', baseValue: 0 },
            { key: 'maxHP', baseValue: 10 },
            { key: 'hp', baseValue: 10 },
            { key: 'hpRegen', baseValue: 0 },
            { key: 'lifeSteal', baseValue: 0 },
            { key: 'damage', baseValue: 0 },
            { key: 'red', baseValue: 0 },
            { key: 'green', baseValue: 0 },
            { key: 'blue', baseValue: 0 },
            { key: 'yellow', baseValue: 0 },
            { key: 'attackSpeed', baseValue: 0 },
            { key: 'critChance', baseValue: 0 },
            { key: 'range', baseValue: 0 },
            { key: 'armor', baseValue: 0 },
            { key: 'dodge', baseValue: 0 },
            { key: 'moveSpeed', baseValue: 0 },
            { key: 'interest', baseValue: 0 },
            { key: 'luck', baseValue: 0 }
        ]

        defaultStats.forEach(stat => {
            this.baseStats.set(stat.key, stat.baseValue)
            this.levelUpStats.set(stat.key, 0)
            this.gearStats.set(stat.key, 0)
        })
        this.recalculateStats()
    }

    // Unified Stats API - ALL stats accessible through these getters
    get base(): Record<string, number> {
        const result: Record<string, number> = {}
        this.statDefinitions.forEach((statDef, key) => {
            result[key] = this.baseStats.get(key) || 0
        })
        return result
    }

    get fromLevelUp(): Record<string, number> {
        const result: Record<string, number> = {}
        this.statDefinitions.forEach((statDef, key) => {
            // Core stats don't have level up bonuses
            if (statDef.category !== 'core') {
                result[key] = this.levelUpStats.get(key) || 0
            }
        })
        return result
    }

    get fromGear(): Record<string, number> {
        const result: Record<string, number> = {}
        this.statDefinitions.forEach((statDef, key) => {
            // Core stats don't have gear bonuses
            if (statDef.category !== 'core') {
                result[key] = this.gearStats.get(key) || 0
            }
        })
        return result
    }

    // Calculate gear stats from body parts (called during stat recalculation)
    calculateGearStatsFromBodyParts(bodyParts: any[]): Record<string, number> {
        const bodyStats: Record<string, number> = {}
        
        // Initialize all stat keys to 0
        this.statDefinitions.forEach((statDef, key) => {
            if (statDef.category !== 'core') {
                bodyStats[key] = 0
            }
        })
        
        // Add stats from each body part
        bodyParts.forEach(bodyPart => {
            if (bodyPart.stats) {
                Object.entries(bodyPart.stats).forEach(([key, value]) => {
                    if (this.statDefinitions.has(key) && typeof value === 'number') {
                        bodyStats[key] = (bodyStats[key] || 0) + value
                        console.log(`Added ${value} ${key} from ${bodyPart.type}`)
                    }
                })
            }
        })
        
        return bodyStats
    }

    get total(): Record<string, number> {
        const result: Record<string, number> = {}
        this.statDefinitions.forEach((statDef, key) => {
            result[key] = this.totalStats.get(key) || 0
        })
        return result
    }

    // Helper methods for category filtering (when needed)
    getPrimaryStats(): Record<string, number> {
        const result: Record<string, number> = {}
        this.statDefinitions.forEach((statDef, key) => {
            if (statDef.category === 'primary') {
                result[key] = this.totalStats.get(key) || 0
            }
        })
        return result
    }

    getSecondaryStats(): Record<string, number> {
        const result: Record<string, number> = {}
        this.statDefinitions.forEach((statDef, key) => {
            if (statDef.category === 'secondary') {
                result[key] = this.totalStats.get(key) || 0
            }
        })
        return result
    }

    // Stat modification methods
    addLevelUpStats(stats: Record<string, number>): void {
        Object.entries(stats).forEach(([key, value]) => {
            if (this.statDefinitions.has(key)) {
                const current = this.levelUpStats.get(key) || 0
                this.levelUpStats.set(key, current + value)
            }
        })
        this.recalculateStats()
    }

    addGearStats(stats: Record<string, number>): void {
        Object.entries(stats).forEach(([key, value]) => {
            if (this.statDefinitions.has(key)) {
                const current = this.gearStats.get(key) || 0
                this.gearStats.set(key, current + value)
            }
        })
        this.recalculateStats()
    }

    // Equipment management
    equipItem(itemStats: Record<string, number>): void {
        this.addGearStats(itemStats)
    }

    unequipItem(itemStats: Record<string, number>): void {
        const negativeStats: Record<string, number> = {}
        Object.entries(itemStats).forEach(([key, value]) => {
            negativeStats[key] = -value
        })
        this.addGearStats(negativeStats)
    }

    // Body parts management (body parts are treated as gear)
    addBodyPartStats(bodyPartStats: Record<string, number>): void {
        this.addGearStats(bodyPartStats)
        console.log(`Added body part stats to gear:`, bodyPartStats)
    }

    removeBodyPartStats(bodyPartStats: Record<string, number>): void {
        const negativeStats: Record<string, number> = {}
        Object.entries(bodyPartStats).forEach(([key, value]) => {
            negativeStats[key] = -value
        })
        this.addGearStats(negativeStats)
        console.log(`Removed body part stats from gear:`, bodyPartStats)
    }

    // =============================================================================
    // XP AND LEVELING
    // =============================================================================
    
    gainXP(amount: number): boolean {
        const currentXP = this.xp
        const currentLevel = this.level
        const newXP = currentXP + amount

        // Update XP directly
        this.xp = newXP

        // Check for level up using XP table
        const xpRequired = XPTable.getTotalXPForLevel(currentLevel + 1)

        if (newXP >= xpRequired) {
            this.levelUp()
            return true // Level up occurred
        }

        return false
    }

    private levelUp(): void {
        // Increase level
        const currentLevel = this.level
        this.setBaseStat('level', currentLevel + 1)

        // XP is already at the correct level, no need to reset
        // The XP table handles the progression correctly
    }

    // Update gear stats from body parts and recalculate
    updateGearFromBodyParts(bodyParts: any[]): void {
        const bodyStats = this.calculateGearStatsFromBodyParts(bodyParts)
        this.gearStats.clear()
        Object.entries(bodyStats).forEach(([key, value]) => {
            this.gearStats.set(key, value)
        })
        this.recalculateStats()
    }

    // Stat calculation with bounds checking
    private recalculateStats(): void {
        this.statDefinitions.forEach((statDef, key) => {
            const base = this.baseStats.get(key) || 0

            let total: number

            if (statDef.category === 'core') {
                // Core stats only use base value
                total = base
            } else {
                // Primary and secondary stats use layered system
                const levelUp = this.levelUpStats.get(key) || 0
                const gear = this.gearStats.get(key) || 0
                total = base + levelUp + gear
            }

            // Apply bounds checking from CSV
            if (statDef.minValue !== undefined) {
                total = Math.max(total, statDef.minValue)
            }
            if (statDef.maxValue !== undefined) {
                total = Math.min(total, statDef.maxValue)
            }

            // Round percentage stats to nearest whole number
            if (statDef.isPercent) {
                total = Math.round(total)
            }

            this.totalStats.set(key, total)
        })
    }

    // Display helpers for UI
    getDisplayStats(category?: 'primary' | 'secondary'): Array<{
        key: string
        displayName: string
        value: number
        formattedValue: string
        description: string
        emoji: string
    }> {
        const stats: Array<any> = []

        this.statDefinitions.forEach((statDef, key) => {
            if (statDef.hideInStatsPanel) return
            if (category && statDef.category !== category) return

            const value = this.totalStats.get(key) || 0
            const formattedValue = statDef.isPercent ?
                `${value}%` :
                value.toString()

            stats.push({
                key,
                displayName: statDef.displayName,
                value,
                formattedValue,
                description: statDef.description,
                emoji: statDef.emoji
            })
        })

        return stats.sort((a, b) => {
            const orderA = this.statDefinitions.get(a.key)?.order || 0
            const orderB = this.statDefinitions.get(b.key)?.order || 0
            return orderA - orderB
        })
    }

    // =============================================================================
    // MASTER PANEL MANAGEMENT FOR UI
    // =============================================================================
    updateMasterStatsPanel(masterContainer: HTMLElement): void {

        const displayStats = this.getDisplayStats()
        // console.log('StatsManager: displayStats', displayStats)

        // Clear existing content
        masterContainer.innerHTML = ''

        // Generate HTML dynamically based on CSV order
        displayStats.forEach(stat => {
            const statElement = document.createElement('div')
            statElement.className = `stat-item ${stat.key}`
            statElement.innerHTML = `
        <span class="stat-name">${stat.emoji} ${stat.displayName}</span>
        <span class="stat-value">${stat.formattedValue}</span>
      `
            masterContainer.appendChild(statElement)
            //   console.log(`StatsManager: Added stat ${stat.key} = ${stat.formattedValue}`)
        })
    }

    cloneStatsToContainer(targetContainer: HTMLElement, masterContainer: HTMLElement): void {
        targetContainer.innerHTML = masterContainer.innerHTML
    }

    // Direct stat access methods for convenience
    getStat(key: string): number {
        return this.totalStats.get(key) || 0
    }

    setBaseStat(key: string, value: number): void {
        if (this.statDefinitions.has(key)) {
            this.baseStats.set(key, value)
            this.recalculateStats()
        }
    }

    // Direct access for core stats (no layering)
    get level(): number {
        return this.getStat('level')
    }

    get xp(): number {
        return this.getStat('xp')
    }

    set xp(value: number) {
        this.setBaseStat('xp', value)
    }

    // HP management (special case since HP can change during gameplay)
    setCurrentHP(value: number): void {
        this.setBaseStat('hp', value)
    }

    getCurrentHP(): number {
        return this.getStat('hp')
    }

    getMaxHP(): number {
        return this.getStat('maxHP')
    }

    // Check if stats are loaded
    isLoaded(): boolean {
        return this.statDefinitions.size > 0
    }
} 