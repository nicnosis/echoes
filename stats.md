# StatsManager.ts

The role of our stats manager and how we approach stats. (I will also have another file that is the ‘stats dictionary’ which lays out the order, etc.)

## ROLES

### → LOAD STATS from CSV or other source

- I think it might make sense to manage the stats in a table especially given the number of fields. It will be easier to drag them around, reorder etc.

### → STORE STATS
- There are three categories of stats:
    - Primary stats such as moveSpeed and armor,
    - Secondary stats (not implemented yet; leave blank)
    - Core stats: 
        - XP
        - Level
        - hp (current HP, not max)
        - Soma (amount of currency available)
        - These core stats do not have multiple layers (e.g. there is no bonus to them from gear or level ups etc.)   
        - These should be stored directly in player.stats

- Eventually we will have the StatsPanel with two buttons (primary and secondary) so we can click through to see which set we want to look at.
- These are the composite parts:
    - base: the amount that the player starts with
    - fromLevelUp: stat increases from Level Up selections
    - fromGear: stat increases from items/equipment
    - total: calculated sum of stats from base amount, from level up, and from gear

### → SET DEFAULT STATS at the start of the game

### → XP
- Eventually, I will have a table of experience points necessary to progress.

### → LEVEL UP

- Called in Game.ts by checkSomaPickup which calls statsManager.gainXP

### → UPDATE STATS

- (called by Game.ts)
- When to update stats:
  - On Wave End
  - On Wave Start
  - On Pause
  - On Level Up selections
  - On Equipment changes
  - On Shop End

### → DISPLAY STATS

- Stats are displayed in a StatsPanel. There will be three StatPanels displayed in the UI. One of them is the “master” stats panel that has its data updated, and the other two are cloned from it on every update
  - StatsPanel 1 (master): in ShopScreen
  - StatsPanel 2: PauseScreen
  - StatsPanel 3: LevelUpScreen
- Every time stats are updated:
  - Master StatsPanel DOM is updated (the one in ShopScreen)
  - PauseScreen and LevelUpScreen’s respective StatPanels will be replaced by the content of the Master StatsPanel

# stats.csv

## CSV Field Descriptions

The `stats.csv` file defines the structure and properties of all player statistics in the game. Each row represents a single stat with the following columns:

### **category** (string)
- **Purpose**: Groups stats into logical categories
- **Values**: `primary` (combat/character stats), `secondary` (supportive stats)
- **Usage**: Determines how stats are organized and displayed in the UI

### **order** (integer)
- **Purpose**: Defines the display order of stats in the UI
- **Values**: 0-based index, lower numbers appear first
- **Usage**: Ensures consistent stat ordering across all screens

### **key** (string)
- **Purpose**: Internal identifier used in code to reference the stat
- **Values**: camelCase identifiers (e.g., `maxHP`, `attackSpeed`)
- **Usage**: Used in game logic, data storage, and API calls

### **displayName** (string)
- **Purpose**: Human-readable name shown in the UI
- **Values**: User-friendly labels (e.g., "Max HP", "Attack Speed")
- **Usage**: Displayed in stats panels and tooltips

### **hideInStatsPanel** (boolean)
- **Purpose**: Controls whether the stat is visible in the stats panel
- **Values**: `TRUE` (hidden), `FALSE` or empty (visible)
- **Usage**: Hides internal stats like current HP or XP from the main display

### **description** (string)
- **Purpose**: Explains what the stat does
- **Values**: Brief descriptions of stat effects
- **Usage**: Tooltips and help text

### **isPercent** (boolean)
- **Purpose**: Indicates if the stat value should be displayed or calculated as a percentage
- **Values**: `TRUE` (show as %), `FALSE` or empty (show as raw number)
- **Usage**: Affects UI formatting (e.g., "15%" vs "15"). Also affects calculation. For example, critChance will be stored as 5 but the chance of a critical hit will be calculated as critChance/100.

### **baseValue** (number)
- **Purpose**: Starting value for the stat when the game begins
- **Values**: Numeric starting values
- **Usage**: Initial stat values for new players

### **minValue** (number)
- **Purpose**: Minimum allowed value for the stat
- **Values**: Numeric minimums (can be empty for no minimum)
- **Usage**: Prevents stats from going below reasonable bounds

### **maxValue** (number)
- **Purpose**: Maximum allowed value for the stat
- **Values**: Numeric maximums (can be empty for no maximum)
- **Usage**: Prevents stats from exceeding reasonable bounds

## Current Stats Structure

The CSV currently defines **17 primary stats**:

1. **Level** - Current player level (starts at 1)
2. **XP** - Total accumulated experience (hidden from display)
3. **Max HP** - Maximum health points (starts at 10)
4. **HP** - Current health points (hidden from display)
5. **HP Regeneration** - Health recovery rate (starts at 5)
6. **Lifesteal** - Chance to heal when hitting enemies (starts at 0)
7. **Damage** - Percent damage increase (starts at 0, displayed as %)
8. **Red** - Red element value (starts at 0)
9. **Green** - Green element value (starts at 0)
10. **Blue** - Blue element value (starts at 0)
11. **Yellow** - Yellow element value (starts at 0)
12. **Attack Speed** - Percent attack speed increase (starts at 0, displayed as %)
13. **Crit** - Critical hit chance (starts at 0)
14. **Range** - Attack radius (starts at 0)
15. **Armor** - Damage reduction (starts at 0)
16. **Dodge** - Percent dodge chance (starts at 0, displayed as %)
17. **Speed** - Percent movement speed increase (starts at 0, displayed as %)

## Usage in Code

The StatsManager loads this CSV to:
- Initialize player stats with base values
- Validate stat ranges during updates
- Format display values (percentages vs raw numbers)
- Control UI visibility and ordering
- Provide descriptions for tooltips and help text

# To-do:
