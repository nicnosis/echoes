// Wave configuration data interface
export interface WaveData {
    wave: number
    duration: number
}

// CSV loader for data/wavetimes.csv
export class WaveDataLoader {
    private static waveData: WaveData[] = []
    private static loaded: boolean = false
    
    // Load and parse data/wavetimes.csv
    static async loadWaveData(): Promise<void> {
        if (this.loaded) return
        
        try {
            const response = await fetch('/data/wavetimes.csv')
            const csvText = await response.text()
            
            const lines = csvText.trim().split('\n')
            const headers = lines[0].split(',')
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',')
                
                // Create a map for semantic column access
                const row: Record<string, string> = {}
                for (let j = 0; j < headers.length; j++) {
                    row[headers[j]] = values[j] || ''
                }
                
                const wave = parseInt(row['wave'])
                const duration = parseInt(row['duration'])
                
                if (!isNaN(wave) && !isNaN(duration)) {
                    this.waveData.push({ wave, duration })
                }
            }
            
            this.loaded = true
            console.log(`Loaded ${this.waveData.length} wave configurations from CSV`)
            
        } catch (error) {
            console.error('Failed to load data/wavetimes.csv:', error)
        }
    }
    
    // Get wave data by index (0-based)
    static getWaveData(waveIndex: number): WaveData | undefined {
        return this.waveData[waveIndex]
    }
    
    // Get all wave data
    static getAllWaveData(): WaveData[] {
        return [...this.waveData]
    }
    
    // Check if wave data is loaded
    static isLoaded(): boolean {
        return this.loaded
    }
    
    // Get duration for a specific wave index
    static getWaveDuration(waveIndex: number): number {
        const waveData = this.getWaveData(waveIndex)
        if (waveData) {
            return waveData.duration
        }
        // Fallback formula: 30 seconds base + 5 seconds per wave
        return 30 + (waveIndex * 5)
    }
}