interface XPTableEntry {
  level: number
  xpRequired: number
  totalXP: number
}

export class XPTable {
  private static xpTable: Map<number, XPTableEntry> = new Map()
  private static isLoaded = false

  /**
   * Load XP table from data/xptable.csv
   */
  static async loadXPTable(): Promise<void> {
    if (this.isLoaded) return

    try {
      const response = await fetch('/data/xptable.csv')
      const csvText = await response.text()
      this.parseCSV(csvText)
      this.isLoaded = true
    } catch (error) {
      console.warn('Failed to load XP table from CSV, using fallback calculation:', error)
      this.isLoaded = true // Mark as loaded to prevent infinite retries
    }
  }

  private static parseCSV(csvText: string): void {
    const lines = csvText.trim().split('\n')
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const [levelStr, xpRequiredStr, totalXPStr] = line.split(',')
      const level = parseInt(levelStr)
      const xpRequired = parseInt(xpRequiredStr)
      const totalXP = parseInt(totalXPStr)
      
      if (!isNaN(level) && !isNaN(xpRequired) && !isNaN(totalXP)) {
        this.xpTable.set(level, { level, xpRequired, totalXP })
      }
    }
  }

  /**
   * Get XP required to reach the next level from current level
   * Uses table lookup for common levels, calculates for gaps
   */
  static getXPRequiredForNextLevel(currentLevel: number): number {
    // Check if we have the value in our table
    const entry = this.xpTable.get(currentLevel)
    if (entry) {
      return entry.xpRequired
    }

    // Calculate using formula: (Level + 3)²
    return Math.pow(currentLevel + 3, 2)
  }

  /**
   * Get total XP required to reach a specific level
   * Uses table lookup for common levels, calculates for gaps
   */
  static getTotalXPForLevel(targetLevel: number): number {
    // Check if we have the value in our table
    const entry = this.xpTable.get(targetLevel)
    if (entry) {
      return entry.totalXP
    }

    // Calculate cumulative XP for levels not in table
    let totalXP = 0
    for (let level = 0; level < targetLevel; level++) {
      totalXP += this.getXPRequiredForNextLevel(level)
    }
    return totalXP
  }

  /**
   * Get the level that would be achieved with a given total XP
   */
  static getLevelFromTotalXP(totalXP: number): number {
    let level = 0
    let cumulativeXP = 0

    while (cumulativeXP <= totalXP) {
      const xpForNextLevel = this.getXPRequiredForNextLevel(level)
      if (cumulativeXP + xpForNextLevel > totalXP) {
        break
      }
      cumulativeXP += xpForNextLevel
      level++
    }

    return level
  }

  /**
   * Get XP progress within current level (0-100%)
   */
  static getXPProgressInLevel(currentLevel: number, currentXP: number): number {
    const totalXPForCurrentLevel = this.getTotalXPForLevel(currentLevel)
    const totalXPForNextLevel = this.getTotalXPForLevel(currentLevel + 1)
    const xpRequiredForNextLevel = totalXPForNextLevel - totalXPForCurrentLevel
    
    const xpInCurrentLevel = currentXP - totalXPForCurrentLevel
    return Math.max(0, Math.min(100, (xpInCurrentLevel / xpRequiredForNextLevel) * 100))
  }
} 