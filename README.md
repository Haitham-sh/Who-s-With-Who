# Who’s With Who? | مين مع مين؟ 🧠🔍

An interactive Arabic logic puzzle game inspired by **Einstein's Riddle (Zebra Puzzle)**, built with pure **Vanilla HTML, CSS, and JavaScript (ES Modules)** with zero runtime dependencies. The game combines a tactical deduction grid, a magnified cell inspection lens, and an interactive clue journal with visual relationship breakdowns.

---

## ✨ Key Features

- **Flexible & Custom Grid Sizes**:
  - Supports all square grid sizes from `2×2` up to `12×12`.
  - Includes a **Custom Dimensions** modal to configure non-square boards (`rows × columns`).
- **Dynamic Puzzle & Clue Generation**:
  - Randomly selects categories and items each round and generates logical clues (direct association, adjacency, left/right ordering, negative constraints, and positional bounds).
  - Request extra clues on demand (`+ Extra Clue`) or randomly distribute an entire category row with full `Undo` support.
- **Cell Inspection Lens**:
  - Magnified view of the selected cell’s candidates with Arabic labels and quick action buttons to **Confirm (`✓`)**, **Strike (`✕`)**, or **Restore (`↺`)** candidates.
  - Smart auto-elimination: confirming an item in a cell automatically strikes it from the remaining cells in the same row, and auto-confirms when only a single candidate remains.
- **Interactive Clue Journal & Visual Clue Detail Modal**:
  - Paginated clue list, category/item filtering, and solved-state toggling.
  - **Clue Detail Modal** with a visual explanation of the clue relationship, a toggle between "Clue Rows Only" and "Full Grid" views, and a draggable floating selection lens to edit cells directly inside the modal.
- **Fully Responsive & Accessible (A11y)**:
  - Responsive layout tailored for phones, tablets, and desktops in both portrait and landscape orientations.
  - Built-in grid zoom controls (`+` / `-` / `1:1` reset) and two-finger **Pinch-to-Zoom** support for large boards on compact screens.
  - Full roving-tabindex keyboard navigation across the grid (`Arrow Keys`, `Home`, `End`, `Enter`, `Space`) and accessible modal focus trapping.
- **Synthesized Audio & Win Celebration**:
  - Sound effects synthesized in real time via the **Web Audio API** (no external audio assets required) with a mute/unmute toggle.
  - Celebration modal displaying elapsed time, clue count, performance rank, confetti animation, and result sharing.

---

## 📂 Project Structure

```text
.
├── index.html                  # Main application markup and modal dialogs
├── style.css                   # Styling, theme variables, and responsive breakpoints
├── main.js                     # Core game logic, clue generator, state management, and UI wiring
├── row-distribution.mjs        # Helper module for row candidate distribution and state snapshots
├── data.json                   # Dataset of 12 categories and 168 items (Arabic & English names)
├── images/                     # Optimized WebP item icons across 12 category folders (14 per category)
│   ├── Animals/                # Animal icons
│   ├── Countries/              # Country flag icons
│   ├── Devices/                # Device & tool icons
│   ├── FoodAndDrinks/          # Food & drink icons
│   ├── FruitsAndVegetables/    # Fruit & vegetable icons
│   ├── HouseColors/            # Colored house icons
│   ├── Music/                  # Musical instrument icons
│   ├── Nature/                 # Nature element icons
│   ├── Personal/               # Character/letter avatars
│   ├── Professions/            # Profession icons
│   ├── Sports/                 # Sport icons
│   └── Vehicles/               # Vehicle icons
```

---

## 🚀 Getting Started

Because the game uses native JavaScript `ES Modules` and loads `data.json` via `fetch`, it must be served over a local **HTTP server** rather than opened directly via `file://`.

### Option 1: VS Code Live Server
1. Open the project folder in **VS Code**.
2. Start the **Live Server** extension on [index.html](file:///e:/web%20development/tester/game/index.html).

### Option 2: Node.js or Python
Run one of the following commands from the project root:

```powershell
# Using Node.js (npx)
npx serve .

# Or using Python 3
python -m http.server 8080
```

Then open the local URL in your browser (e.g., `http://localhost:8080`).

---

## 🎮 How to Play & Shortcuts

1. **Select a Cell**: Click or tap any cell in the grid to inspect its candidates in the **Selected Cell Lens**.
2. **Inspect Clues**: Read clues in the **Clue Journal**, or click the eye icon next to any clue to open its **Visual Clue Detail** modal.
3. **Eliminate & Confirm Candidates**:
   - Click **`✕`** to strike out an impossible candidate in the selected cell.
   - Click **`↺`** to restore a struck candidate.
   - Click **`✓`** to confirm the final answer for that cell (automatically eliminating that item from other columns in the same row).
4. **Keyboard Shortcuts**:
   - `Arrow Keys (↑ ↓ ← →)`: Move focus between grid cells (RTL-aware).
   - `Home` / `End`: Jump to the first or last cell in the current row.
   - `Enter` or `Space`: Select the focused cell and load it into the inspection lens.
   - `Escape`: Close the active modal dialog or mobile menu.

---

## 🛠️ Tech Stack

- **HTML5**: Semantic RTL markup with `ARIA` attributes for screen readers.
- **CSS3**: Custom Properties, CSS Grid & Flexbox layouts, and multi-breakpoint responsive design.
- **Vanilla JavaScript (ES6 Modules)**: Zero external runtime dependencies.
- **Web Audio API**: Procedural sound synthesis for UI feedback and victory fanfare.
- **Google Fonts**: `Tajawal` and `Cairo` for Arabic typography, `Space Grotesk` for counters and timers.
