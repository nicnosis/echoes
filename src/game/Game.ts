import { Renderer } from '../render/Renderer'
import { InputManager } from '../input/InputManager'

export class Game {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private inputManager: InputManager
  private running = false
  private lastTime = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.inputManager = new InputManager()
  }

  start() {
    if (this.running) return
    this.running = true
    this.gameLoop(0)
  }

  stop() {
    this.running = false
  }

  private gameLoop = (currentTime: number) => {
    if (!this.running) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    this.update(deltaTime)
    this.render()

    requestAnimationFrame(this.gameLoop)
  }

  private update(deltaTime: number) {
    // Game logic updates will go here
  }

  private render() {
    this.renderer.clear()
    // Render game objects here
    this.renderer.present()
  }
}