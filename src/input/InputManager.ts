export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  attack: boolean
  zoomIn: boolean
  zoomOut: boolean
  zoomReset: boolean
}

export class InputManager {
  private keys: { [key: string]: boolean } = {}
  public inputState: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    zoomIn: false,
    zoomOut: false,
    zoomReset: false
  }

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      this.updateInputState()
    })

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
      this.updateInputState()
    })

    // Mouse wheel for zoom
    document.addEventListener('wheel', (e) => {
      e.preventDefault() // Prevent page scroll
      
      // Reset zoom flags
      this.inputState.zoomIn = false
      this.inputState.zoomOut = false
      
      // Set zoom direction based on wheel delta
      if (e.deltaY < 0) {
        this.inputState.zoomIn = true // Wheel up = zoom in
      } else if (e.deltaY > 0) {
        this.inputState.zoomOut = true // Wheel down = zoom out
      }
      
      // Reset zoom flags after a brief moment to make them "pulse" inputs
      setTimeout(() => {
        this.inputState.zoomIn = false
        this.inputState.zoomOut = false
      }, 50)
    }, { passive: false })
  }

  private updateInputState() {
    this.inputState.up = this.keys['KeyW'] || this.keys['ArrowUp'] || false
    this.inputState.down = this.keys['KeyS'] || this.keys['ArrowDown'] || false
    this.inputState.left = this.keys['KeyA'] || this.keys['ArrowLeft'] || false
    this.inputState.right = this.keys['KeyD'] || this.keys['ArrowRight'] || false
    this.inputState.attack = this.keys['Space'] || false
    this.inputState.zoomReset = this.keys['Digit0'] || false
  }

  isKeyPressed(key: string): boolean {
    return this.keys[key] || false
  }
}