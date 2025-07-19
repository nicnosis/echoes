export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  attack: boolean
}

export class InputManager {
  private keys: { [key: string]: boolean } = {}
  public inputState: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false
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
  }

  private updateInputState() {
    this.inputState.up = this.keys['KeyW'] || this.keys['ArrowUp'] || false
    this.inputState.down = this.keys['KeyS'] || this.keys['ArrowDown'] || false
    this.inputState.left = this.keys['KeyA'] || this.keys['ArrowLeft'] || false
    this.inputState.right = this.keys['KeyD'] || this.keys['ArrowRight'] || false
    this.inputState.attack = this.keys['Space'] || false
  }

  isKeyPressed(key: string): boolean {
    return this.keys[key] || false
  }
}