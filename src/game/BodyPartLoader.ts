import { BodyPart } from './BodyPart'

// CSV parser for bodyparts.csv
export class BodyPartLoader {
    private static bodyParts: Map<string, BodyPart> = new Map()
    private static loaded: boolean = false
    
    // Load and parse bodyparts.csv
    static async loadBodyParts(): Promise<void> {
        if (this.loaded) return
        
        try {
            const response = await fetch('/bodyparts.csv')
            const csvText = await response.text()
            
            const lines = csvText.trim().split('\n')
            const headers = lines[0].split(',')
            
            // Find the start of stats columns (after imgFileName, which should be column D)
            const statsStartIndex = headers.indexOf('hp') // Column E should be hp
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',')
                
                const id = values[0]
                const displayName = values[1] 
                const type = values[2]
                const imgFileName = values[3]
                
                // Parse stats from column E onward
                const stats: Record<string, number> = {}
                for (let j = statsStartIndex; j < headers.length; j++) {
                    const statName = headers[j]
                    const statValue = values[j]
                    
                    // Only add non-empty values
                    if (statValue && statValue.trim() !== '') {
                        const numValue = parseFloat(statValue)
                        if (!isNaN(numValue)) {
                            stats[statName] = numValue
                        }
                    }
                }
                
                const bodyPart = new BodyPart(type, imgFileName, stats)
                this.bodyParts.set(id, bodyPart)
                
                console.log(`Loaded ${type} (${id}):`, stats)
            }
            
            this.loaded = true
            console.log(`Loaded ${this.bodyParts.size} body parts from CSV`)
            
        } catch (error) {
            console.error('Failed to load bodyparts.csv:', error)
        }
    }
    
    // Get a body part by ID
    static getBodyPart(id: string): BodyPart | undefined {
        return this.bodyParts.get(id)
    }
    
    // Get all body parts
    static getAllBodyParts(): BodyPart[] {
        return Array.from(this.bodyParts.values())
    }
    
    // Check if body parts are loaded
    static isLoaded(): boolean {
        return this.loaded
    }
}