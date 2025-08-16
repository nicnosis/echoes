import { Enemy } from './Enemy'
import { PreSpawnIndicator } from './PreSpawnIndicator'
import { Player } from './Player'
import { Renderer } from '../render/Renderer'

export class SpawnManager {
    private spawnTimer: number = 0
    private spawnInterval: number = 500 // 500ms
    private baseSpawnProbability: number = 0.3 // Base 30% chance per interval
    private currentSpawnProbability: number = 0.3 // Current probability (can be boosted)
    private preSpawnIndicators: PreSpawnIndicator[] = []
    private canvasWidth: number
    private canvasHeight: number
    private targetEnemyCount: number = 5 // Target number of enemies + prespawns
    private probabilityBoost: number = 0.5 // Boost when below target
    private missedSpawnBonus: number = 0 // Accumulated bonus for missed spawns
    private missedSpawnIncrement: number = 0.07 // Add 0.07 per missed spawn

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth
        this.canvasHeight = canvasHeight
    }

    update(deltaTime: number, player: Player, enemies: Enemy[]): { newEnemies: Enemy[], blockedSpawns: Array<{x: number, y: number}> } {
        const newEnemies: Enemy[] = []
        const blockedSpawns: Array<{x: number, y: number}> = []

        // Calculate total enemy count (current enemies + queued prespawns)
        const totalEnemyCount = this.getTotalEnemyCount(enemies)

        // Update spawn probability based on current count
        this.updateSpawnProbability(totalEnemyCount)

        // Update spawn timer
        this.spawnTimer += deltaTime

        // Check if it's time to consider spawning
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0

            // Roll for spawn probability using current probability
            if (Math.random() < this.currentSpawnProbability) {
                // Spawn successful - reset missed spawn bonus
                this.missedSpawnBonus = 0

                // Create a new pre-spawn indicator
                const location = this.generateRandomLocation(player)
                this.preSpawnIndicators.push(new PreSpawnIndicator(location.x, location.y))
            } else {
                // Spawn missed - add bonus if we're at target count
                if (totalEnemyCount >= this.targetEnemyCount) {
                    this.missedSpawnBonus += this.missedSpawnIncrement
                }
            }
        }

        // Update all pre-spawn indicators
        for (let i = this.preSpawnIndicators.length - 1; i >= 0; i--) {
            const indicator = this.preSpawnIndicators[i]

            // Update the indicator and check if it should spawn an enemy
            const result = indicator.update(deltaTime, player)

            if (result.shouldSpawn) {
                // Spawn enemy at indicator location
                newEnemies.push(new Enemy(result.x, result.y))
                this.preSpawnIndicators.splice(i, 1) // Remove the indicator
            } else if (result.blocked) {
                // Spawn was blocked by player - record for floating text
                blockedSpawns.push({ x: result.x, y: result.y })
            } else if (!indicator.isActive) {
                // Remove inactive indicators
                this.preSpawnIndicators.splice(i, 1)
            }
        }

        return { newEnemies, blockedSpawns }
    }

    private generateRandomLocation(player: Player): { x: number, y: number } {
        let x: number, y: number
        let attempts = 0
        const maxAttempts = 50

        do {
            x = 30 + Math.random() * (this.canvasWidth - 60) // Keep 30px from edges
            y = 30 + Math.random() * (this.canvasHeight - 60)
            attempts++
        } while (
            attempts < maxAttempts &&
            this.isTooCloseToPlayer(x, y, player) ||
            this.isTooCloseToEdge(x, y)
        )

        return { x, y }
    }

    private isTooCloseToPlayer(x: number, y: number, player: Player): boolean {
        const dx = x - player.x
        const dy = y - player.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance < 30 // 30px minimum distance from player
    }

    private isTooCloseToEdge(x: number, y: number): boolean {
        return x < 30 || x > this.canvasWidth - 30 || y < 30 || y > this.canvasHeight - 30
    }

    render(renderer: Renderer) {
        // Render all pre-spawn indicators
        for (const indicator of this.preSpawnIndicators) {
            indicator.render(renderer)
        }
    }

    // Method to update canvas dimensions if they change
    updateCanvasDimensions(width: number, height: number) {
        this.canvasWidth = width
        this.canvasHeight = height
    }

    // Calculate total enemy count (current enemies + queued prespawns)
    private getTotalEnemyCount(enemies: Enemy[]): number {
        const activeEnemies = enemies.filter(enemy => !enemy.isDying()).length
        const queuedEnemies = this.preSpawnIndicators.filter(indicator => indicator.isActive).length
        return activeEnemies + queuedEnemies
    }

    // Update spawn probability based on current enemy count
    private updateSpawnProbability(totalEnemyCount: number): void {
        if (totalEnemyCount < this.targetEnemyCount) {
            // Below target - boost probability (no missed spawn bonus)
            this.currentSpawnProbability = this.baseSpawnProbability + this.probabilityBoost
            this.missedSpawnBonus = 0 // Reset bonus when below target
        } else {
            // At or above target - use base probability + missed spawn bonus
            this.currentSpawnProbability = Math.min(1.0, this.baseSpawnProbability + this.missedSpawnBonus)
        }
    }

    // Get current spawn statistics
    getActiveIndicatorsCount(): number {
        return this.preSpawnIndicators.length
    }

    // Get current total enemy count for debugging
    getCurrentTotalEnemyCount(enemies: Enemy[]): number {
        return this.getTotalEnemyCount(enemies)
    }

    // Get current spawn probability for debugging
    getCurrentSpawnProbability(): number {
        return this.currentSpawnProbability
    }

    // Get current missed spawn bonus for debugging
    getMissedSpawnBonus(): number {
        return this.missedSpawnBonus
    }

    // Clear all pre-spawn indicators (called at wave end)
    cleanup(): void {
        this.preSpawnIndicators = []
        this.spawnTimer = 0
        this.missedSpawnBonus = 0
        this.currentSpawnProbability = this.baseSpawnProbability
    }
} 