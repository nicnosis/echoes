// BodyPart class for the transformation system
export class BodyPart {
    public type: string
    public imgFileName: string
    public stats: Record<string, number>
    
    // Sprite rendering
    private sprite: HTMLImageElement | null = null
    private spriteLoaded: boolean = false
    
    constructor(type: string, imgFileName: string, stats: Record<string, number>) {
        this.type = type
        this.imgFileName = imgFileName
        this.stats = stats
        
        // Load sprite
        this.loadSprite()
    }
    
    // Load sprite from bodyparts folder
    private loadSprite(): void {
        this.sprite = new Image()
        this.sprite.onload = () => {
            this.spriteLoaded = true
            console.log(`${this.type} sprite loaded: ${this.imgFileName}`)
        }
        this.sprite.onerror = () => {
            console.error(`Failed to load ${this.type} sprite: ${this.imgFileName}`)
            this.spriteLoaded = false
        }
        this.sprite.src = `/bodyparts/${this.imgFileName}`
    }
    
    // Check if sprite is ready to render
    public isLoaded(): boolean {
        return this.spriteLoaded && this.sprite !== null
    }
    
    // Get the loaded sprite
    public getSprite(): HTMLImageElement | null {
        return this.sprite
    }
}

// Hard-coded positions for body part debug nodes (relative to player center)
export const BODY_POSITIONS = {
    head: { x: 0, y: -20 },
    torso: { x: 0, y: 0 },
    legs: { x: 0, y: 15 },
    leftArm: { x: -15, y: -5 },
    rightArm: { x: 15, y: -5 }
}