import { Renderer } from "../render/Renderer";

export class Soma {
  public x: number;
  public y: number;
  public radius: number = 10;
  public somaValue: number;
  public collected: boolean = false;

  private floatOffset: number = 0;
  private floatSpeed: number = 0.002;
  // Appearance properties
  private aspect: number;
  private rotation: number;
  private alpha: number;
  private appearanceType: number; // 1-5 for different soma images
  private static somaImages: HTMLImageElement[] = [];
  private static imagesLoaded: boolean = false;

  // Scatter animation properties
  private targetX: number;
  private targetY: number;
  private startX: number;
  private startY: number;
  private scatterProgress: number = 0;
  private scatterDuration: number = 150; // 150ms
  private scattering: boolean = false;

  constructor(
    x: number,
    y: number,
    somaValue: number = 1,
    targetX?: number,
    targetY?: number
  ) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.targetX = targetX || x;
    this.targetY = targetY || y;
    this.somaValue = somaValue;
    this.floatOffset = Math.random() * Math.PI * 2;
    // Assign static appearance
    this.aspect = 1 + Math.random(); // 1 to 2
    // Random rotation in 30-degree increments (0°, 30°, 60°, 90°, 120°, 150°, 180°, 210°, 240°, 270°, 300°, 330°)
    const rotationSteps = Math.floor(Math.random() * 12); // 0-11
    this.rotation = rotationSteps * 30 * (Math.PI / 180); // Convert to radians
    this.alpha = 0.4 + Math.random() * 0.3; // 0.4 to 0.7

    // Load images if not already loaded (must happen before assigning type)
    Soma.loadImages();

    // Randomly assign appearance type (programmatically based on available images)
    this.appearanceType =
      Math.floor(Math.random() * Soma.somaImages.length) + 1;

    // Start scatter animation if target position is different
    if (
      targetX !== undefined &&
      targetY !== undefined &&
      (targetX !== x || targetY !== y)
    ) {
      this.scattering = true;
    }
  }

  // Static method to load soma images dynamically
  private static async loadImages() {
    if (Soma.imagesLoaded) return;

    try {
      // Use Vite's import.meta.glob to get all files in the soma directory
      const somaFiles = import.meta.glob("/public/soma/*", {
        eager: false,
        as: "url",
      });

      const imageFiles = Object.keys(somaFiles).filter((path) => {
        const extension = path.toLowerCase().split(".").pop();
        return ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "");
      });

      if (imageFiles.length === 0) {
        console.warn("No soma images found, using fallback method");
        this.loadImagesFallback();
        return;
      }

      // Load each discovered image
      for (const filePath of imageFiles) {
        const filename = filePath.split("/").pop() || "";
        const img = new Image();

        img.onload = () => {
          console.log("Successfully loaded soma image:", filename);
        };

        img.onerror = () => {
          console.warn("Failed to load soma image:", filename);
        };

        img.src = `soma/${filename}`;
        Soma.somaImages.push(img);
      }

      console.log(`Dynamically loaded ${imageFiles.length} soma images`);
    } catch (error) {
      console.warn("Dynamic loading failed, using fallback:", error);
      this.loadImagesFallback();
    }

    Soma.imagesLoaded = true;
  }

  // Fallback: try sequential numbered loading
  private static loadImagesFallback() {
    const maxTries = 50;
    let loadedCount = 0;

    for (let i = 1; i <= maxTries; i++) {
      const img = new Image();

      img.onload = () => {
        loadedCount++;
        console.log(`Loaded soma image ${i}`);
      };

      img.onerror = () => {
        // Silent fail for non-existent numbered files
      };

      // Try the most common pattern: number + any extension
      img.src = `soma/${i}`; // Let browser handle extension detection
      Soma.somaImages.push(img);
    }

    console.log(`Fallback: trying up to ${maxTries} numbered images`);
  }

  update(deltaTime: number) {
    // Handle scatter animation only
    if (this.scattering) {
      this.scatterProgress += deltaTime;

      if (this.scatterProgress >= this.scatterDuration) {
        // Animation complete
        this.scattering = false;
        this.x = this.targetX;
        this.y = this.targetY;
      } else {
        // Interpolate position with easing
        const t = this.scatterProgress / this.scatterDuration;
        const easedT = 1 - Math.pow(1 - t, 3); // Ease out cubic for smooth deceleration

        this.x = this.startX + (this.targetX - this.startX) * easedT;
        this.y = this.startY + (this.targetY - this.startY) * easedT;
      }
    }
  }

  render(renderer: Renderer) {
    if (this.collected) return;

    // Get the appropriate image for this soma's appearance type
    const somaImage = Soma.somaImages[this.appearanceType - 1];

    // Check if image is properly loaded and not broken
    if (!somaImage || !somaImage.complete || somaImage.naturalWidth === 0) {
      // Fallback to rectangle if image not loaded or broken
      this.renderFallback(renderer);
      return;
    }

    // Use the image's natural width as the world size (assuming square images)
    const size = somaImage.naturalWidth * 0.5; // KEEPING THIS A LITTLE SMALLER

    // Render with rotation preserved
    const ctx = renderer.context;
    ctx.save();

    // Get screen coordinates for rotation transform
    const screen = (renderer as any).worldToScreen(
      this.x,
      this.y,
      (renderer as any).cam
    );
    const scaledSize = size * (renderer as any).cam.zoom;

    // Apply rotation at screen coordinates
    ctx.translate(screen.x, screen.y);
    ctx.rotate(this.rotation);

    try {
      // Draw image centered with preserved rotation
      ctx.drawImage(
        somaImage,
        -scaledSize / 2,
        -scaledSize / 2,
        scaledSize,
        scaledSize
      );
    } catch (error) {
      // If drawImage fails, restore context and use fallback
      ctx.restore();
      this.renderFallback(renderer);
      return;
    }

    ctx.restore();
  }

  // Fallback rendering method using rectangles
  private renderFallback(renderer: Renderer) {
    let width = this.radius * this.aspect;
    let height = this.radius * (2 - this.aspect);
    // Enforce a minimum width and height for visibility
    const minSize = 10;
    width = Math.max(width, minSize);
    height = Math.max(height, minSize);

    // Render with rotation but no expensive effects
    const ctx = renderer.context;
    ctx.save();

    // Get screen coordinates for rotation transform
    const screen = (renderer as any).worldToScreen(
      this.x,
      this.y,
      (renderer as any).cam
    );
    const scaledWidth = width * (renderer as any).cam.zoom;
    const scaledHeight = height * (renderer as any).cam.zoom;

    // Apply rotation at screen coordinates
    ctx.translate(screen.x, screen.y);
    ctx.rotate(this.rotation);

    // Draw rectangle with camera-scaled dimensions
    ctx.fillStyle = "#ff33cc";
    ctx.fillRect(
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    // Add stroke
    ctx.strokeStyle = "#9BE4F5";
    ctx.lineWidth = 1 * (renderer as any).cam.zoom;
    ctx.strokeRect(
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    ctx.restore();
  }

  isInRange(playerX: number, playerY: number, pickupRadius: number): boolean {
    if (this.collected) return false;

    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= pickupRadius;
  }

  collect(): { soma: number } {
    if (this.collected) return { soma: 0 };

    this.collected = true;
    return { soma: this.somaValue };
  }

  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }
}
