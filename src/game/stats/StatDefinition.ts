export interface StatDefinition {
  category: 'primary' | 'secondary' | 'core'
  order: number
  key: string
  displayName: string
  hideInStatsPanel: boolean
  description: string
  isPercent: boolean
  baseValue: number
  minValue?: number
  maxValue?: number
  emoji: string
} 