export async function loadHTMLTemplate(templatePath: string): Promise<string> {
  try {
    const response = await fetch(templatePath)
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`)
    }
    return await response.text()
  } catch (error) {
    console.error(`Error loading template from ${templatePath}:`, error)
    throw error
  }
}

export function injectTemplate(templateHTML: string, targetElement: HTMLElement): void {
  targetElement.innerHTML = templateHTML
} 