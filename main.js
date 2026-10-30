// ======================================================
//  لغز آينشتاين المنطقي — main.js
//  - حذف تلقائي للعنصر المؤكَّد من باقي خلايا نفس الصف
//  - نافذة منبثقة بشاشة واحدة
//  - مقارنة sort على مستوى الأعمدة
//  - أزرار الإغلاق عبر addEventListener (موثوقة)
// ======================================================

import {
  getRowItemsByColumn,
  restoreRowStates,
  shuffleRowItems,
  snapshotRowStates,
} from "./row-distribution.mjs";

// ---------- State ----------
let rowNamePlayer = [];
const categoryIconMarkup = {
  Personal: '<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  Animals: '<circle cx="7" cy="8" r="1.4"/><circle cx="12" cy="6" r="1.4"/><circle cx="17" cy="8" r="1.4"/><path d="M6 15c0-2 2.7-4 6-4s6 2 6 4-2.5 4-6 4-6-2-6-4Z"/>',
  HouseColors: '<path d="m3 11 9-8 9 8v9h-6v-6H9v6H3z"/>',
  FoodAndDrinks: '<path d="M4 4h13v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM17 6h2a2 2 0 0 1 0 4h-2M8 21h9"/>',
  Professions: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
  Sports: '<circle cx="12" cy="12" r="9"/><path d="m8.5 4 2 4 4-.5 2.5 3-2 4 2 3M4 9l4 1 2-2M7 19l1-4-3-3M16 4l-1 3"/>',
  Vehicles: '<path d="m5 11 2-5h10l2 5M3 11h18v7H3zM6 18v2m12-2v2M6 14h2m8 0h2"/>',
  FruitsAndVegetables: '<path d="M12 8c-5-5-10 0-8 6 2 7 8 8 8 4 0 4 6 3 8-4 2-6-3-11-8-6ZM12 8c0-3 2-5 5-5-1 3-2 5-5 5Z"/>',
  Nature: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  Music: '<path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-2a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z"/>',
  Countries: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  Devices: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
};
let level = [];
let shortLevel = [];
let levelResult = [];
let clues = [];
let allClues = [];

let allCells = document.getElementById("allCells");
let bigCell = document.getElementById("bigCell");

let selectedClueId = null;
let clueGlobalIdCounter = 0;
let cluePageIndex = 0;
let cluePages = [];
let cluePaginationObserver = null;
let clueFilter = {};
let clueFilterDraft = {};

let selectedCellIndex = null;
let cellStates = {};
let rowDistributionSnapshots = {};
let imgDataMap = {};

let gridRows = 2;
let gridCols = 2;
let mobileGridZoom = 1;
let gridInitId = 0;
let useCustomSize = false;
let customSize = { rows: 3, cols: 3 };

let stopwatchSeconds = 0;
let stopwatchTimer = null;
let soundEnabled = true;
let winShown = false;

let currentClueId = null;
let currentSelectionCellIdx = null;
let cdmShowAllCandidates = false;

const CONFETTI_COLORS = [
  "#f6b84b",
  "#62e6aa",
  "#ff6b9d",
  "#8ab899",
  "#ff8a3c",
  "#7dd3fc",
  "#f87171",
  "#c084fc",
];

// ---------- Helpers ----------
function extractFileName(src) {
  if (!src) return "";
  let s = String(src);
  s = s.split("?")[0].split("#")[0];
  const parts = s.split("/");
  return parts[parts.length - 1] || "";
}

const modalReturnFocus = new WeakMap();
const dialogFocusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getModalDialog(modal) {
  return modal?.querySelector('[role="dialog"]') || null;
}

function openAccessibleDialog(modal, initialFocus, trigger = document.activeElement) {
  const dialog = getModalDialog(modal);
  if (!modal || !dialog) return;

  modalReturnFocus.set(modal, trigger);
  modal.removeAttribute("aria-hidden");
  modal.style.display = "flex";
  dialog.setAttribute("aria-modal", "true");

  if (dialog.dataset.focusTrapBound !== "1") {
    dialog.dataset.focusTrapBound = "1";
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;

      const focusable = [...dialog.querySelectorAll(dialogFocusableSelector)].filter(
        (element) => !element.hidden && element.getClientRects().length > 0,
      );
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  const target =
    typeof initialFocus === "string"
      ? modal.querySelector(initialFocus)
      : initialFocus;
  const focusTarget =
    target || dialog.querySelector(dialogFocusableSelector) || dialog;
  focusTarget.focus({ preventScroll: true });
}

function closeAccessibleDialog(modal, { restoreFocus = true } = {}) {
  if (!modal) return;
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");

  const trigger = modalReturnFocus.get(modal);
  modalReturnFocus.delete(modal);
  if (restoreFocus && trigger?.isConnected && !trigger.closest('[aria-hidden="true"]')) {
    trigger.focus({ preventScroll: true });
  }
}

function closeTopmostAccessibleDialog() {
  const modal = [...document.querySelectorAll(".modal-overlay")]
    .reverse()
    .find((overlay) => overlay.style.display === "flex");
  if (!modal) return false;
  const closeButton =
    getModalDialog(modal)?.querySelector("[data-dialog-close]");
  if (!closeButton) return false;
  closeButton.click();
  return true;
}

// ---------- Sound ----------
let audioCtx = null;
function playSound(type) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain).connect(audioCtx.destination);
    const freq =
      type === "confirm"
        ? 660
        : type === "strike"
          ? 220
          : type === "win"
            ? 880
            : 440;
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.22);
  } catch (_) {}
}

// ---------- Confetti ----------
function launchConfetti() {
  const container = document.getElementById("confettiContainer");
  if (!container) return;
  container.innerHTML = "";
  const PIECE_COUNT = 90;
  for (let i = 0; i < PIECE_COUNT; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.width = 6 + Math.random() * 10 + "px";
    piece.style.height = 8 + Math.random() * 14 + "px";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background =
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    piece.style.animationDuration = 2.2 + Math.random() * 2.8 + "s";
    piece.style.animationDelay = Math.random() * 0.9 + "s";
    container.appendChild(piece);
  }
}
function clearConfetti() {
  const c = document.getElementById("confettiContainer");
  if (c) c.innerHTML = "";
}

// ---------- Stopwatch ----------
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}
function updateStopwatchDisplay() {
  const txt = formatTime(stopwatchSeconds);
  const a = document.getElementById("stopwatchHeader");
  const b = document.getElementById("stopwatchVictory");
  if (a) a.textContent = txt;
  if (b) b.textContent = txt;
}
function startStopwatch() {
  stopStopwatch();
  const status = document.getElementById("stopwatchStatus");
  if (status) status.textContent = "العداد مستمر";
  stopwatchTimer = setInterval(() => {
    if (winShown) {
      stopStopwatch();
      return;
    }
    stopwatchSeconds++;
    updateStopwatchDisplay();
  }, 1000);
}
function stopStopwatch() {
  if (stopwatchTimer) {
    clearInterval(stopwatchTimer);
    stopwatchTimer = null;
  }
}

// ---------- Toast ----------
function showToast(msg) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ---------- Auto-strike derivation ----------
function isAutoStruck(cellIdx, imgId) {
  const data = imgDataMap[imgId];
  if (!data) return false;
  const cellCol = cellIdx % gridCols;
  const total = gridRows * gridCols;
  for (let i = 0; i < total; i++) {
    if (i === cellIdx) continue;
    const st = cellStates[i];
    if (!st || !st.confirmed) continue;
    const otherData = imgDataMap[st.confirmed];
    if (!otherData) continue;
    if (otherData.row !== data.row) continue;
    const otherCol = i % gridCols;
    if (otherCol === cellCol) continue;
    if (otherData.file === data.file) return true;
  }
  return false;
}

// ---------- Grid init ----------
window.onSelectChange = () => {
  useCustomSize = false;
  rAndc();
};

window.rAndc = () => {
  const initId = ++gridInitId;
  const winEl = document.getElementById("win");
  if (winEl) closeAccessibleDialog(winEl, { restoreFocus: false });
  clearConfetti();
  winShown = false;
  currentClueId = null;
  currentSelectionCellIdx = null;

  allCells.innerHTML = "";
  bigCell.innerHTML = "";
  bigCell.style.border = "none";
  bigCell.className = "";
  selectedClueId = null;
  selectedCellIndex = null;
  const mobileLens = document.getElementById("lensPanel");
  if (mobileLens) {
    mobileLens.classList.remove("is-floating-open");
    const smallScreen = window.matchMedia(
      "(max-width: 560px), (max-width: 900px) and (max-height: 520px)",
    ).matches;
    if (smallScreen) mobileLens.setAttribute("aria-hidden", "true");
    else mobileLens.removeAttribute("aria-hidden");
  }
  clueGlobalIdCounter = 0;
  cellStates = {};
  rowDistributionSnapshots = {};
  imgDataMap = {};
  clearGridRowHighlight();
  closeClueDetail();
  rowNamePlayer = [];
  level = [];
  shortLevel = [];
  levelResult = [];
  clues = [];
  allClues = [];
  clueFilter = {};
  clueFilterDraft = {};
  const clueFilterModal = document.getElementById("clueFilterModal");
  if (clueFilterModal) closeAccessibleDialog(clueFilterModal, { restoreFocus: false });
  updateClueFilterButton();

  const cluesList = document.getElementById("cluesList");
  cluesList.style.display = "none";
  cluesList.innerHTML = "";
  cluesList.style.minHeight = "";
  cluePageIndex = 0;
  cluePages = [];
  document.getElementById("cluePagination").hidden = true;
  updateCluePageStatus();
  document.getElementById("addClueBtn").classList.remove("noMoreClue");
  document.getElementById("addClueBtn").disabled = false;
  document.getElementById("lensCellCoords").textContent = "(اختر خلية)";
  updateSolutionProgress(0);

  stopStopwatch();
  stopwatchSeconds = 0;
  updateStopwatchDisplay();

  let rows, columns;
  if (useCustomSize) {
    rows = customSize.rows;
    columns = customSize.cols;
  } else {
    const mySelect = document.getElementById("gridSizeSelect").value;
    [rows, columns] = mySelect.split("x").map(Number);
  }
  gridRows = rows;
  gridCols = columns;
  allCells.setAttribute("role", "grid");
  allCells.setAttribute("aria-label", `شبكة مين مع مين؟، ${rows} صفوف و${columns} أعمدة`);
  allCells.setAttribute("aria-rowcount", String(rows));
  allCells.setAttribute("aria-colcount", String(columns));
  mobileGridZoom = 1;
  allCells.style.removeProperty("--grid-zoom");
  document.querySelector(".matrix-container")?.classList.remove("grid-zoom-active");
  allCells.style.gridTemplate = `repeat(${rows}, minmax(0, 1fr)) / repeat(${columns}, minmax(0, 1fr))`;
  allCells.style.setProperty("--mobile-grid-width", `${columns * 76}px`);
  allCells.style.setProperty("--mobile-grid-height", `${rows * 76}px`);
  allCells.className = `matrix-scroll-wrapper matrix-grid size-${rows}x${columns}`;
  updateGridZoomControls();
  updateGridZoomHint();

  fetch("data.json")
    .then((res) => res.json())
    .then((data) => {
      if (initId !== gridInitId) return;
      let randomRows = [];
      for (let n = 0; n < rows; n++) {
        const randomRow = Math.floor(Math.random() * data.categories.length);
        rowNamePlayer.push(data.categories[randomRow].name);
        randomRows.push(data.categories[randomRow].items.slice());
        data.categories.splice(randomRow, 1);
      }

      for (let m = 0; m < randomRows.length; m++) {
        const pool = randomRows[m].slice();
        const rowCandidates = [];
        for (let l = 0; l < columns; l++) {
          const idx = Math.floor(Math.random() * pool.length);
          const origItem = pool[idx];
          origItem._origId = `cat_${rowNamePlayer[m]}_item_${origItem.file || l}_${m}`;
          rowCandidates.push(origItem);
          pool.splice(idx, 1);
        }
        level.push(rowCandidates);
      }

      for (let i = 0; i < rows * columns; i++) {
        const cellRow = Math.trunc(i / columns);
        const creatCell = document.createElement("div");
        creatCell.id = `c${i}`;
        creatCell.classList.add("cell", `candidate-count-${columns}`);
        creatCell.setAttribute("role", "gridcell");
        creatCell.setAttribute("aria-rowindex", String(cellRow + 1));
        creatCell.setAttribute("aria-colindex", String((i % columns) + 1));
        creatCell.setAttribute("aria-selected", "false");
        creatCell.tabIndex = i === 0 ? 0 : -1;
        creatCell.onclick = () => selectGridCell(i);
        cellStates[i] = { confirmed: null, struck: new Set() };

        for (let x = 0; x < columns; x++) {
          const itemData = level[cellRow][x];
          const thePic = document.createElement("img");
          const imgId = `p${i}_${x}`;
          thePic.id = imgId;
          thePic.src = `./images/${rowNamePlayer[cellRow]}/${itemData.file}`;
          thePic.alt = itemData.nameAr;
          thePic.setAttribute("data-orig-id", itemData._origId);
          creatCell.appendChild(thePic);
          imgDataMap[imgId] = {
            ...itemData,
            origId: itemData._origId,
            row: cellRow,
            col: x,
            cellIndex: i,
          };
        }
        creatCell.setAttribute(
          "aria-label",
          `الصف ${cellRow + 1}، العمود ${(i % columns) + 1}، المرشحون: ${level[cellRow]
            .map((item) => item.nameAr)
            .join("، ")}`,
        );
        if (i % columns === 0) {
          const category = rowNamePlayer[cellRow];
          const categoryIcon = document.createElement("button");
          const categoryName = getCategoryDisplayName(category);
          categoryIcon.className = "row-category-icon";
          categoryIcon.type = "button";
          categoryIcon.setAttribute("aria-pressed", "false");
          categoryIcon.setAttribute("aria-label", `وزّع عناصر ${categoryName} على خلايا الصف`);
          categoryIcon.title = `وزّع عناصر ${categoryName} على خلايا الصف`;
          categoryIcon.addEventListener("click", (event) => {
            event.stopPropagation();
            distributeCategoryRow(cellRow);
          });
          categoryIcon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${categoryIconMarkup[category] || categoryIconMarkup.Countries}</svg>`;
          creatCell.classList.add("row-category-start");
          creatCell.appendChild(categoryIcon);
        }
        allCells.appendChild(creatCell);
      }

      for (let f = 0; f < columns; f++) {
        const arrCol = [];
        for (let d = 0; d < rows; d++) {
          const element = Math.floor(Math.random() * level[d].length);
          arrCol.push(level[d][element]);
          level[d].splice(element, 1);
        }
        levelResult.push(arrCol);
      }
      for (let y = 0; y < levelResult.length; y++) {
        const playerCol = [];
        for (let p = 0; p < levelResult[y].length; p++) {
          playerCol.push(levelResult[y][p].file);
        }
        shortLevel.push(playerCol);
      }

      provideCluesForLevel(rows, columns);
      startStopwatch();
    })
    .catch((e) => {
      if (initId !== gridInitId) return;
      console.error(e);
      showToast("تعذّر تحميل البيانات");
    });
};

// ---------- Clues ----------
const pushClues = (percent) => {
  for (let t = 0; t < percent; t++) {
    if (allClues.length === 0) {
      document.getElementById("cluesList").style.display = "block";
      const btn = document.getElementById("addClueBtn");
      btn.classList.add("noMoreClue");
      btn.disabled = true;
      showToast("لا توجد أدلة إضافية");
      break;
    }
    const rand = Math.floor(Math.random() * allClues.length);
    const group = allClues[rand];
    const rand2 = Math.floor(Math.random() * group.length);
    clues.push(group[rand2]);
    allClues.splice(rand, 1);
  }
  displayClues(clues);
};

const generateClues = (r, c) => {
  const genClu = levelResult;
  for (let z = 0; z < c; z++) {
    for (let u = 0; u < r - 1; u++) {
      for (let q = 1; q < r - u; q++) {
        const smallClues = [];
        smallClues.push({
          text: `${genClu[z][u].nameAr} في مجموعة ${genClu[z][u + q].nameAr}`,
          type: "with",
          itemA: {
            ...genClu[z][u],
            origId: genClu[z][u]._origId,
            col: z,
            row: u,
          },
          itemB: {
            ...genClu[z][u + q],
            origId: genClu[z][u + q]._origId,
            col: z,
            row: u + q,
          },
        });
        for (let b = 0; b < c; b++) {
          if (b !== z) {
            smallClues.push({
              text: `${genClu[z][u].nameAr} ليس في مجموعة ${genClu[b][u + q].nameAr}`,
              type: "conflict",
              itemA: {
                ...genClu[z][u],
                origId: genClu[z][u]._origId,
                col: z,
                row: u,
              },
              itemB: {
                ...genClu[b][u + q],
                origId: genClu[b][u + q]._origId,
                col: b,
                row: u + q,
              },
            });
          }
        }
        allClues.push(smallClues);
      }
    }
  }

  if (r * c === 4) pushClues(1);
  else if (r * c === 6) pushClues(3);
  else if (r * c === 8) pushClues(5);
  else pushClues(Math.ceil(r * c * 0.6));

  return clues;
};

function getGridFilterOptions() {
  return rowNamePlayer
    .map((category, row) => {
      const items = [];
      const seenFiles = new Set();
      levelResult.forEach((column) => {
        const item = column[row];
        if (!item || !item.file || seenFiles.has(item.file)) return;
        seenFiles.add(item.file);
        items.push({ file: item.file, nameAr: item.nameAr || item.file });
      });
      return { category, row, items };
    })
    .filter((group) => group.items.length);
}

function getCategoryDisplayName(category) {
  const names = {
    Personal: "الأشخاص",
    Animals: "الحيوانات",
    HouseColors: "ألوان المنازل",
    FoodAndDrinks: "الأطعمة والمشروبات",
    Professions: "المهن",
    Sports: "الرياضة",
    Vehicles: "وسائل النقل",
    FruitsAndVegetables: "الفواكه والخضروات",
    Nature: "الطبيعة",
    Music: "الموسيقى",
    Countries: "الدول",
    Devices: "الأجهزة",
  };
  return names[category] || category;
}

function getFilteredClues(list) {
  const selectedCategories = Object.keys(clueFilter);
  if (!selectedCategories.length) return list;

  const activeOptions = getGridFilterOptions();
  const activeRows = new Map(
    activeOptions.map((group) => [group.category, group.row]),
  );
  return list.filter((clue) => {
    if (!clue || !clue.itemA || !clue.itemB) return false;
    return [clue.itemA, clue.itemB].some((item) => {
      const category = rowNamePlayer[item.row];
      if (!Object.prototype.hasOwnProperty.call(clueFilter, category)) return false;
      const row = activeRows.get(category);
      if (row == null || Number(item.row) !== row) return false;
      const selectedFiles = clueFilter[category];
      if (selectedFiles === null) return true;
      return Array.isArray(selectedFiles) && selectedFiles.includes(item.file);
    });
  });
}

function updateClueFilterButton() {
  const button = document.getElementById("clueFilterBtn");
  if (!button) return;
  const active = Object.keys(clueFilter).length > 0;
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-pressed", String(active));
}

function renderClueFilterOptions() {
  const container = document.getElementById("clueFilterOptions");
  if (!container) return;
  container.replaceChildren();
  const groups = getGridFilterOptions();
  if (!groups.length) {
    const empty = document.createElement("p");
    empty.className = "clue-filter-no-options";
    empty.textContent = "لا توجد تصنيفات أو عناصر متاحة في الشبكة حاليًا.";
    container.appendChild(empty);
    return;
  }

  groups.forEach((group, groupIndex) => {
    const selected = Object.prototype.hasOwnProperty.call(
      clueFilterDraft,
      group.category,
    );
    const groupValue = selected ? clueFilterDraft[group.category] : null;
    const allItems = groupValue === null;
    const section = document.createElement("section");
    section.className = "clue-filter-group";

    const heading = document.createElement("label");
    heading.className = "clue-filter-category";
    const categoryInput = document.createElement("input");
    categoryInput.type = "checkbox";
    categoryInput.checked = selected;
    const categoryName = document.createElement("span");
    categoryName.textContent = getCategoryDisplayName(group.category);
    heading.append(categoryInput, categoryName);
    section.appendChild(heading);

    const choices = document.createElement("div");
    choices.className = "clue-filter-choices";
    choices.hidden = !selected;
    const choiceName = `clue-filter-mode-${groupIndex}`;
    const addMode = (value, text, checked) => {
      const label = document.createElement("label");
      label.className = "clue-filter-mode";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = choiceName;
      input.value = value;
      input.checked = checked;
      const caption = document.createElement("span");
      caption.textContent = text;
      label.append(input, caption);
      choices.appendChild(label);
      return input;
    };
    const allRadio = addMode("all", "كل العناصر", allItems);
    const someRadio = addMode("some", "بعض العناصر", selected && !allItems);
    const itemsList = document.createElement("div");
    itemsList.className = "clue-filter-items";
    itemsList.hidden = !selected || allItems;
    group.items.forEach((item) => {
      const label = document.createElement("label");
      label.className = "clue-filter-item";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = item.file;
      input.checked =
        selected && Array.isArray(groupValue) && groupValue.includes(item.file);
      const caption = document.createElement("span");
      caption.textContent = item.nameAr;
      label.append(input, caption);
      itemsList.appendChild(label);
      input.addEventListener("change", () => {
        const files = Array.isArray(clueFilterDraft[group.category])
          ? clueFilterDraft[group.category].slice()
          : [];
        clueFilterDraft[group.category] = input.checked
          ? [...new Set([...files, item.file])]
          : files.filter((file) => file !== item.file);
      });
    });
    choices.appendChild(itemsList);
    section.appendChild(choices);

    categoryInput.addEventListener("change", () => {
      if (categoryInput.checked) clueFilterDraft[group.category] = null;
      else delete clueFilterDraft[group.category];
      renderClueFilterOptions();
    });
    allRadio.addEventListener("change", () => {
      if (allRadio.checked) {
        clueFilterDraft[group.category] = null;
        renderClueFilterOptions();
      }
    });
    someRadio.addEventListener("change", () => {
      if (someRadio.checked) {
        if (!Array.isArray(clueFilterDraft[group.category])) {
          clueFilterDraft[group.category] = [];
        }
        renderClueFilterOptions();
      }
    });
    container.appendChild(section);
  });
}

const displayClues = (list) => {
  const cluesList = document.getElementById("cluesList");
  if (!cluesList) return;
  const visibleClues = getFilteredClues(list);
  const clueCount = document.getElementById("clueCount");
  if (clueCount) clueCount.textContent = String(visibleClues.length);
  cluesList.style.display = list.length ? "flex" : "none";
  cluesList.innerHTML = "";
  selectedClueId = null;
  clearGridRowHighlight();

  visibleClues.forEach((clue, index) => {
    const clueObj =
      typeof clue === "string"
        ? {
            text: clue,
            type:
              clue.includes("ليس في مجموعة") || clue.includes("تعارض")
                ? "conflict"
                : "with",
          }
        : clue;

    const clueId = `clue-${clueGlobalIdCounter++}`;
    clueObj._id = clueId;
    clueObj._solved = !!clueObj._solved;

    const li = document.createElement("li");
    li.id = clueId;
    li.classList.add("clues-li");
    if (clueObj.type === "conflict") li.classList.add("clue-conflict");

    const leftWrap = document.createElement("div");
    leftWrap.className = "clue-left-wrap";

    const solvedBtn = document.createElement("button");
    solvedBtn.type = "button";
    solvedBtn.className =
      "clue-action-btn clue-solve-btn" + (clueObj._solved ? " is-solved" : "");
    solvedBtn.title = "تم حل هذا الدليل";
    solvedBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    solvedBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleClueSolved(clueId);
    });

    const textWrap = document.createElement("div");
    textWrap.className = "clue-text-wrap";
    renderClueText(textWrap, clueObj);

    leftWrap.appendChild(solvedBtn);
    const number = document.createElement("span");
    number.className = "clue-number";
    number.textContent = String(index + 1);
    number.setAttribute("aria-label", `الدليل رقم ${index + 1}`);
    leftWrap.appendChild(number);
    leftWrap.appendChild(textWrap);

    const rightWrap = document.createElement("div");
    rightWrap.className = "clue-right-wrap";

    const typeDot = document.createElement("span");
    typeDot.className = "clue-type-dot";

    const detailBtn = document.createElement("button");
    detailBtn.type = "button";
    detailBtn.className = "clue-action-btn clue-detail-btn";
    detailBtn.title = "تكبير عرض الدليل";
    detailBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.5" cy="9.5" r="6.5"/><line x1="14.3" y1="14.3" x2="21" y2="21"/><line x1="7" y1="9.5" x2="12" y2="9.5"/><line x1="9.5" y1="7" x2="9.5" y2="12"/></svg>';
    detailBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showClueDetail(clueId, e.currentTarget);
    });

    rightWrap.appendChild(typeDot);
    rightWrap.appendChild(detailBtn);

    li.appendChild(leftWrap);
    li.appendChild(rightWrap);

    li.addEventListener("click", () => selectClue(clueId));
    cluesList.appendChild(li);
  });
  if (list.length && !visibleClues.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "clue-filter-empty";
    emptyState.textContent = "لا توجد أدلة في الدفتر تطابق هذه التصفية.";
    emptyState.setAttribute("role", "status");
    cluesList.appendChild(emptyState);
  }
  cluePageIndex = 0;
  scheduleCluePagination();
};

function scheduleCluePagination() {
  window.requestAnimationFrame(updateCluePagination);
}

function updateCluePagination() {
  const cluesList = document.getElementById("cluesList");
  const pagination = document.getElementById("cluePagination");
  if (!cluesList || !pagination) return;

  const items = Array.from(cluesList.querySelectorAll(".clues-li"));
  if (!items.length || cluesList.clientHeight === 0) {
    cluePages = [];
    cluePageIndex = 0;
    pagination.hidden = true;
    updateCluePageStatus();
    return;
  }

  // Measure each complete clue at the current responsive width before splitting
  // them into pages; hidden clues are restored here so resizing can reflow them.
  items.forEach((item) => {
    item.hidden = false;
  });
  const styles = window.getComputedStyle(cluesList);
  const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
  const gap = parseFloat(styles.rowGap) || parseFloat(styles.gap) || 0;
  const availableHeight = Math.max(0, cluesList.clientHeight - padding - 4);
  const pages = [];
  let page = [];
  let pageHeight = 0;

  items.forEach((item) => {
    const itemHeight = item.getBoundingClientRect().height;
    const neededHeight = page.length ? gap + itemHeight : itemHeight;
    if (page.length && pageHeight + neededHeight > availableHeight) {
      pages.push(page);
      page = [];
      pageHeight = 0;
    }
    page.push(item);
    pageHeight += page.length > 1 ? gap + itemHeight : itemHeight;
  });
  if (page.length) pages.push(page);

  cluePages = pages;
  cluePageIndex = Math.min(cluePageIndex, Math.max(0, pages.length - 1));
  const paginationWasHidden = pagination.hidden;
  pagination.hidden = false;
  items.forEach((item) => {
    item.hidden = !pages[cluePageIndex].includes(item);
  });
  document.getElementById("previousCluesBtn").disabled = cluePageIndex === 0;
  document.getElementById("nextCluesBtn").disabled =
    cluePageIndex >= pages.length - 1;
  updateCluePageStatus();
  if (paginationWasHidden !== pagination.hidden) scheduleCluePagination();
}

function updateCluePageStatus() {
  const status = document.getElementById("cluePageStatus");
  if (!status) return;
  const pageCount = cluePages.length;
  const currentPage = pageCount ? cluePageIndex + 1 : 0;
  status.textContent = `${currentPage} / ${pageCount}`;
  status.setAttribute("aria-label", `صفحة ${currentPage} من ${pageCount}`);
}

function changeCluePage(direction) {
  if (!cluePages.length) return;
  const nextPage = Math.max(
    0,
    Math.min(cluePages.length - 1, cluePageIndex + direction),
  );
  if (nextPage === cluePageIndex) return;
  cluePageIndex = nextPage;
  const items = document.querySelectorAll("#cluesList .clues-li");
  items.forEach((item) => {
    item.hidden = !cluePages[cluePageIndex].includes(item);
  });
  document.getElementById("previousCluesBtn").disabled = cluePageIndex === 0;
  document.getElementById("nextCluesBtn").disabled =
    cluePageIndex >= cluePages.length - 1;
  updateCluePageStatus();
}
window.changeCluePage = changeCluePage;

function renderClueText(container, clue) {
  container.replaceChildren();

  const text = String(clue.text || "");
  const relation =
    clue.type === "conflict" ? "ليس في مجموعة" : "في مجموعة";
  const relationToken = ` ${relation} `;
  const relationIndex = text.indexOf(relationToken);
  if (relationIndex === -1) {
    container.appendChild(document.createTextNode(text));
    return;
  }

  container.appendChild(document.createTextNode(text.slice(0, relationIndex + 1)));
  const relationText = document.createElement("span");
  relationText.className = `clue-relation type-${clue.type}`;
  relationText.textContent = relation;
  container.appendChild(relationText);
  container.appendChild(
    document.createTextNode(text.slice(relationIndex + relationToken.length - 1)),
  );
}

function toggleClueSolved(clueId) {
  const clue = clues.find((c) => c._id === clueId);
  const li = document.getElementById(clueId);
  if (!clue || !li) return;
  clue._solved = !clue._solved;
  const btn = li.querySelector(".clue-solve-btn");
  if (btn) btn.classList.toggle("is-solved", clue._solved);
  li.classList.toggle("clue-solved", clue._solved);
}

function clearGridRowHighlight() {
  clearGridHighlightOnly();
  document
    .querySelectorAll(".clues-li.clue-selected")
    .forEach((el) => el.classList.remove("clue-selected"));
}

function clearGridHighlightOnly() {
  const arr = Array.from(allCells.getElementsByClassName("cell"));
  arr.forEach((c) => {
    c.classList.remove(
      "clue-highlight-row-a",
      "clue-highlight-row-b",
      "clue-target-with",
      "clue-target-conflict",
      "clue-has-item-a",
      "clue-has-item-b",
    );
    c.style.outline = "";
    c.style.outlineOffset = "";
  });
}

function applyCurrentClueHighlight() {
  if (!selectedClueId) return;
  const clue = clues.find((c) => c._id === selectedClueId);
  if (clue && clue.itemA && clue.itemB) {
    clearGridHighlightOnly();
    highlightRowsInGrid(clue, true);
  }
}

function cellHasItem(cellIdx, item) {
  if (!gridRows || !gridCols) return false;
  if (!item.origId) return false;
  const cell = document.getElementById(`c${cellIdx}`);
  if (!cell) return false;
  const img = cell.querySelector(`img[data-orig-id="${item.origId}"]`);
  if (!img) return false;
  if (img.classList.contains("displayMe")) return false;
  const st = cellStates[cellIdx];
  if (st && st.confirmed && st.confirmed !== img.id) return false;

  const cellCol = cellIdx % gridCols;
  const total = gridRows * gridCols;
  for (let i = 0; i < total; i++) {
    if (i === cellIdx) continue;
    const ost = cellStates[i];
    if (!ost || !ost.confirmed) continue;
    const ocol = i % gridCols;
    if (ocol === cellCol) continue;
    const odata = imgDataMap[ost.confirmed];
    if (!odata) continue;
    if (odata._origId === item.origId || odata.origId === item.origId)
      return false;
  }
  return true;
}

function selectClue(clueId) {
  const clue = clues.find((c) => c._id === clueId);
  const li = document.getElementById(clueId);
  if (!clue || !li) return;
  clearGridRowHighlight();
  if (selectedClueId === clueId) {
    selectedClueId = null;
    return;
  }
  selectedClueId = clueId;
  li.classList.add("clue-selected");
  highlightRowsInGrid(clue, true);
}

function highlightRowsInGrid(clue, withOutline) {
  if (!clue.itemA || !clue.itemB) return;
  if (!gridRows || !gridCols) return;
  const totalCells = gridRows * gridCols;

  const rowA = clue.itemA.row;
  const rowB = clue.itemB.row;
  const origIdA =
    clue.itemA.origId != null
      ? clue.itemA.origId
      : clue.itemA.id ||
        clue.itemA._origId ||
        `${clue.itemA.col}_${clue.itemA.row}`;
  const origIdB =
    clue.itemB.origId != null
      ? clue.itemB.origId
      : clue.itemB.id ||
        clue.itemB._origId ||
        `${clue.itemB.col}_${clue.itemB.row}`;

  const catIdxA = clue.itemA.row;
  const catIdxB = clue.itemB.row;

  const hitCellsA = [];
  const hitCellsB = [];

  for (let i = 0; i < totalCells; i++) {
    const cell = document.getElementById(`c${i}`);
    if (!cell) continue;
    const cellRow = Math.floor(i / gridCols);
    if (cellRow === rowA) {
      cell.classList.add("clue-highlight-row-a");
    }
    if (cellRow === rowB) {
      cell.classList.add("clue-highlight-row-b");
    }

    if (cellRow === catIdxA && origIdA) {
      if (cellHasItem(i, { origId: origIdA })) {
        cell.classList.add("clue-has-item-a");
        hitCellsA.push(i);
      }
    }
    if (cellRow === catIdxB && origIdB) {
      if (cellHasItem(i, { origId: origIdB })) {
        cell.classList.add("clue-has-item-b");
        hitCellsB.push(i);
      }
    }
  }

  if (withOutline) {
    const targetClass =
      clue.type === "conflict" ? "clue-target-conflict" : "clue-target-with";
    hitCellsA.forEach((idx) => {
      const cc = document.getElementById(`c${idx}`);
      if (cc) cc.classList.add(targetClass);
    });
    hitCellsB.forEach((idx) => {
      const cc = document.getElementById(`c${idx}`);
      if (cc) cc.classList.add(targetClass);
    });
  }
}

// ---------- Clue Detail Modal ----------
function buildItemImage(clueItem) {
  const folder = rowNamePlayer[clueItem.row];
  return folder && clueItem.file ? `./images/${folder}/${clueItem.file}` : "";
}

function renderRelationLens(clue) {
  const la = document.getElementById("cdmLensA");
  const lb = document.getElementById("cdmLensB");
  la.innerHTML = "";
  lb.innerHTML = "";
  const srcA = buildItemImage(clue.itemA);
  const srcB = buildItemImage(clue.itemB);
  if (srcA) {
    const img = document.createElement("img");
    img.src = srcA;
    img.alt = clue.itemA.nameAr;
    la.appendChild(img);
  } else la.textContent = clue.itemA.nameAr;
  if (srcB) {
    const img = document.createElement("img");
    img.src = srcB;
    img.alt = clue.itemB.nameAr;
    lb.appendChild(img);
  } else lb.textContent = clue.itemB.nameAr;

  const conn = document.getElementById("cdmLensConnectorText");
  if (conn) {
    conn.textContent = clue.type === "conflict" ? "✕" : "↔";
    conn.className =
      "cdm-relation-connector " +
      (clue.type === "conflict" ? "type-conflict" : "type-with");
  }

  const tagA = document.getElementById("cdmRowTagA");
  const tagB = document.getElementById("cdmRowTagB");
  if (tagA) tagA.textContent = `صف: ${clue.itemA.nameAr}`;
  if (tagB) tagB.textContent = `صف: ${clue.itemB.nameAr}`;
}

function renderClueGridRows(clue) {
  const rowAEl = document.getElementById("cdmGridRowA");
  const rowBEl = document.getElementById("cdmGridRowB");
  if (!rowAEl || !rowBEl) return;
  rowAEl.innerHTML = "";
  rowBEl.innerHTML = "";

  const allCellsArr = Array.from(allCells.getElementsByClassName("cell"));
  const cols = parseInt((allCells.className.match(/x(\d+)$/) || [])[1], 10);
  if (!cols) return;
  rowAEl.style.setProperty("--cdm-columns", cols);
  rowBEl.style.setProperty("--cdm-columns", cols);
  rowAEl.style.setProperty("--cdm-mobile-columns", Math.min(cols, 6));
  rowBEl.style.setProperty("--cdm-mobile-columns", Math.min(cols, 6));
  rowAEl.classList.toggle("cdm-all-candidates", cdmShowAllCandidates);
  rowBEl.classList.toggle("cdm-all-candidates", cdmShowAllCandidates);

  const addCDMSelectedDecor = (cellEl) => {
    const glow = document.createElement("span");
    glow.className = "cdm-selected-glow";
    glow.setAttribute("aria-hidden", "true");
    cellEl.appendChild(glow);
  };

  const renderRow = (rowIdx, clueItem, container) => {
    const targetFile = clueItem.file;
    for (let col = 0; col < cols; col++) {
      const cellIdx = rowIdx * cols + col;
      const srcCell = allCellsArr[cellIdx];
      if (!srcCell) continue;

      const st = cellStates[cellIdx];
      if (!st) continue;

      const cellEl = document.createElement("button");
      cellEl.type = "button";
      cellEl.className = "cdm-mini-cell";
      cellEl.dataset.cellIndex = String(cellIdx);
      cellEl.setAttribute(
        "aria-label",
        `${clueItem.nameAr}\u060c \u0639\u0645\u0648\u062f ${col + 1}`,
      );
      cellEl.setAttribute(
        "aria-pressed",
        String(cellIdx === currentSelectionCellIdx),
      );

      if (cdmShowAllCandidates) {
        cellEl.classList.add("cdm-multi-candidates");
        const allImgs = [...srcCell.querySelectorAll("img")];
        const visibleImgs = allImgs.filter((im) => {
          const id = im.id;
          const isStruckManual = st.struck.has(id);
          const isAuto = isAutoStruck(cellIdx, id);
          const hiddenByOther = st.confirmed && st.confirmed !== id;
          return !isStruckManual && !isAuto && !hiddenByOther;
        });
        const targetImg = allImgs.find(
          (im) => extractFileName(im.src) === targetFile,
        );
        const targetIsVisible =
          targetImg && visibleImgs.some((i) => i.id === targetImg.id);

        if (visibleImgs.length) {
          const candidateColumns = Math.min(
            4,
            Math.max(1, Math.ceil(Math.sqrt(visibleImgs.length))),
          );
          const candidateRows = Math.ceil(visibleImgs.length / candidateColumns);
          cellEl.style.setProperty('--cdm-candidate-columns', candidateColumns);
          cellEl.style.setProperty('--cdm-candidate-rows', candidateRows);
          cellEl.style.gridTemplateColumns =
            `repeat(${candidateColumns}, minmax(0, 1fr))`;
          cellEl.style.gridTemplateRows =
            `repeat(${candidateRows}, minmax(0, 1fr))`;
        }

        if (visibleImgs.length === 0) {
          cellEl.classList.add("cdm-hl-eliminated");
        } else {
          if (targetIsVisible) {
            cellEl.classList.add(
              clue.type === "conflict" ? "cdm-hl-conflict" : "cdm-hl-with",
            );
          }
          const isConfirmed =
            st.confirmed && targetImg && st.confirmed === targetImg.id;
          if (isConfirmed) cellEl.classList.add("cdm-hl-confirmed");
        }

        visibleImgs.forEach((im) => {
          const img = document.createElement("img");
          img.src = im.src;
          img.alt = im.alt || "";
          if (targetImg && im.id === targetImg.id) {
            img.classList.add("cdm-target-candidate");
          }
          cellEl.appendChild(img);
        });
      } else {
        const targetImg = [...srcCell.querySelectorAll("img")].find(
          (im) => extractFileName(im.src) === targetFile,
        );
        if (!targetImg) continue;

        const isConfirmed = st.confirmed === targetImg.id;
        const isStruckManual = st.struck.has(targetImg.id);
        const isAutoStruckItem = isAutoStruck(cellIdx, targetImg.id);
        const hiddenByOther = st.confirmed && !isConfirmed;
        const targetVisible =
          !isStruckManual && !isAutoStruckItem && !hiddenByOther;

        if (targetVisible) {
          cellEl.classList.add(
            clue.type === "conflict" ? "cdm-hl-conflict" : "cdm-hl-with",
          );
          if (isConfirmed) cellEl.classList.add("cdm-hl-confirmed");
        } else {
          cellEl.classList.add("cdm-hl-eliminated");
        }

        const img = document.createElement("img");
        img.src = targetImg.src;
        img.alt = targetImg.alt || "";
        cellEl.appendChild(img);
      }

      if (cellIdx === currentSelectionCellIdx) {
        cellEl.classList.add("cdm-cell-selected");
        addCDMSelectedDecor(cellEl);
      }

      cellEl.addEventListener("click", () => {
        selectCell(cellIdx);
        showSelectionLens(cellIdx);
        document
          .querySelector(`.cdm-mini-cell[data-cell-index="${cellIdx}"]`)
          ?.focus({ preventScroll: true });
      });
      container.appendChild(cellEl);
    }
  };

  renderRow(clue.itemA.row, clue.itemA, rowAEl);
  renderRow(clue.itemB.row, clue.itemB, rowBEl);
}

function syncCdmViewToggleUI() {
  const sw = document.getElementById("cdmViewSwitch");
  if (!sw) return;
  sw.classList.toggle("is-on", !!cdmShowAllCandidates);
  sw.setAttribute("aria-checked", String(!!cdmShowAllCandidates));
}

function attachCdmViewToggle() {
  const sw = document.getElementById("cdmViewSwitch");
  if (!sw) return;
  if (sw.dataset.bound === "1") return;
  sw.dataset.bound = "1";
  const toggle = () => {
    cdmShowAllCandidates = !cdmShowAllCandidates;
    syncCdmViewToggleUI();
    if (currentClueId) {
      const clue = clues.find((c) => c._id === currentClueId);
      if (clue) renderClueGridRows(clue);
    }
  };
  sw.addEventListener("click", toggle);
  sw.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  });
}

function setClueSelectionLensOpen(open) {
  const lens = document.getElementById("cdmSelectionLens");
  const toggle = document.getElementById("cdmSelectionLensToggle");
  const hint = document.getElementById("cdmSelectionLensHint");
  const modal = document.getElementById("clueDetailModal");
  if (!lens || !toggle) return;

  const hasEligibleCell = currentSelectionCellIdx !== null;
  const isOpen = !!open && hasEligibleCell;
  lens.classList.toggle("is-floating-open", isOpen);
  lens.setAttribute("aria-hidden", String(!isOpen));
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.disabled = !hasEligibleCell;
  if (hint) {
    hint.hidden = hasEligibleCell;
    if (hasEligibleCell) toggle.removeAttribute("aria-describedby");
    else toggle.setAttribute("aria-describedby", hint.id);
  }
  const toggleLabel = hasEligibleCell
    ? isOpen
      ? "إخفاء عدسة الخلية المحددة"
      : "إظهار عدسة الخلية المحددة"
    : "عدسة الخلية المحددة غير متاحة. اختر خلية من أحد صفّي الدليل لتفعيلها.";
  toggle.setAttribute(
    "aria-label",
    toggleLabel,
  );
  toggle.title = toggleLabel;

  if (
    !isOpen &&
    currentSelectionCellIdx !== null &&
    modal?.style.display === "flex"
  ) {
    toggle.focus({ preventScroll: true });
  }
}

function wireClueSelectionLens() {
  const lens = document.getElementById("cdmSelectionLens");
  const toggle = document.getElementById("cdmSelectionLensToggle");
  const close = document.getElementById("cdmSelectionLensClose");
  const dragHandle = lens?.querySelector(".cdm-selection-header");
  if (!lens || !toggle || !close || !dragHandle) return;

  if (toggle.dataset.bound !== "1") {
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", () => {
      setClueSelectionLensOpen(!lens.classList.contains("is-floating-open"));
    });
  }

  if (close.dataset.bound !== "1") {
    close.dataset.bound = "1";
    close.addEventListener("click", () => setClueSelectionLensOpen(false));
  }

  if (dragHandle.dataset.dragBound === "1") return;
  dragHandle.dataset.dragBound = "1";
  let dragState = null;

  dragHandle.addEventListener("pointerdown", (event) => {
    if (!lens.classList.contains("is-floating-open") || event.target.closest("button")) return;

    const panelRect = lens.getBoundingClientRect();
    const card = lens.closest(".clue-detail-card");
    const cardRect = card?.getBoundingClientRect();
    if (!card || !cardRect) return;

    lens.style.left = `${panelRect.left - cardRect.left}px`;
    lens.style.top = `${panelRect.top - cardRect.top}px`;
    lens.style.right = "auto";
    lens.style.bottom = "auto";
    lens.style.transform = "none";
    dragState = {
      pointerId: event.pointerId,
      offsetX: event.clientX - panelRect.left,
      offsetY: event.clientY - panelRect.top,
    };
    try {
      dragHandle.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers and older browsers may not support pointer capture.
    }
    event.preventDefault();
  });

  document.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const card = lens.closest(".clue-detail-card");
    if (!card) return;
    const cardRect = card.getBoundingClientRect();
    const left = Math.min(
      card.clientWidth - lens.offsetWidth - 6,
      Math.max(6, event.clientX - cardRect.left - dragState.offsetX),
    );
    const top = Math.min(
      card.clientHeight - lens.offsetHeight - 6,
      Math.max(6, event.clientY - cardRect.top - dragState.offsetY),
    );
    lens.style.left = `${left}px`;
    lens.style.top = `${top}px`;
  });

  const finishDrag = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if (dragHandle.hasPointerCapture?.(event.pointerId)) {
      dragHandle.releasePointerCapture(event.pointerId);
    }
    dragState = null;
  };
  document.addEventListener("pointerup", finishDrag);
  document.addEventListener("pointercancel", finishDrag);
  window.addEventListener("resize", () => {
    if (!lens.classList.contains("is-floating-open") || !lens.style.left || !lens.style.top) return;
    const card = lens.closest(".clue-detail-card");
    if (!card) return;
    const maxLeft = Math.max(6, card.clientWidth - lens.offsetWidth - 6);
    const maxTop = Math.max(6, card.clientHeight - lens.offsetHeight - 6);
    lens.style.left = `${Math.min(maxLeft, Math.max(6, Number.parseFloat(lens.style.left)))}px`;
    lens.style.top = `${Math.min(maxTop, Math.max(6, Number.parseFloat(lens.style.top)))}px`;
  });
}

function showSelectionLens(cellIdx) {
  const itemsEl = document.getElementById("cdmSelectionItems");
  const coordsEl = document.getElementById("cdmSelectionCoords");
  if (!itemsEl || !coordsEl) return;

  currentSelectionCellIdx = cellIdx;
  setClueSelectionLensOpen(cellIdx !== null && cellIdx !== undefined);
  itemsEl.innerHTML = "";

  if (cellIdx === null || cellIdx === undefined) {
    coordsEl.textContent = "لم تختر خلية";
    const ph = document.createElement("div");
    ph.className = "cdm-sel-placeholder";
    ph.textContent = "انقر على أي خلية من الصفوف أدناه للتحكم بها";
    itemsEl.appendChild(ph);
    return;
  }

  const row = Math.floor(cellIdx / gridCols);
  const col = cellIdx % gridCols;
  coordsEl.textContent = `عمود ${col + 1} ، فئة ${row + 1}`;

  const srcCell = document.getElementById(`c${cellIdx}`);
  if (!srcCell) return;
  const st = cellStates[cellIdx];
  if (!st) return;

  const selectionImages = [...srcCell.querySelectorAll("img")];
  let selectionRow = null;
  const maxSelectionColumns = window.matchMedia("(max-width: 360px)").matches ? 3 : 4;
  const refocusClueSelectionAction = (origId, selector) => {
    const modal = document.getElementById("clueDetailModal");
    const win = document.getElementById("win");
    if (modal?.style.display !== "flex" || win?.style.display === "flex") return;

    const item = [...document.querySelectorAll("#cdmSelectionItems .cdm-sel-item")]
      .find((candidate) => candidate.dataset.origId === origId);
    const action = item?.querySelector(selector);
    if (action && !action.disabled) action.focus({ preventScroll: true });
  };

  selectionImages.forEach((orig, index) => {
    if (index % maxSelectionColumns === 0) {
      selectionRow = document.createElement("div");
      selectionRow.className = "cdm-sel-row";
      const rowColumns = Math.min(maxSelectionColumns, selectionImages.length - index);
      selectionRow.style.setProperty("--cdm-selection-columns", rowColumns);
      selectionRow.style.setProperty(
        "--cdm-selection-item-size",
        `${Math.min(100, 400 / rowColumns)}px`,
      );
      itemsEl.appendChild(selectionRow);
    }

    const data = imgDataMap[orig.id] || {};
    const wrapper = document.createElement("div");
    wrapper.className = "cdm-sel-item";
    wrapper.dataset.origId = orig.id;

    const img = document.createElement("img");
    img.src = orig.src;
    img.alt = orig.alt || data.nameAr || "";
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      strikeItemInCell(cellIdx, orig.id);
      refocusClueSelectionAction(orig.id, ".lens-mini-strike");
    });

    const itemName = document.createElement("span");
    itemName.className = "cdm-sel-name";
    itemName.textContent = data.nameAr || "";

    const isConfirmed = st.confirmed === orig.id;
    const isStruckManual = st.struck.has(orig.id);
    const isAutoStruckItem = isAutoStruck(cellIdx, orig.id);
    const targetVisible = st.confirmed
      ? isConfirmed
      : !isStruckManual && !isAutoStruckItem;

    if (!targetVisible) img.classList.add("opacityMe");
    if (isConfirmed) wrapper.classList.add("is-confirmed");
    if (isStruckManual || isAutoStruckItem) wrapper.classList.add("is-struck");

    const actions = document.createElement("div");
    actions.className = "cdm-sel-actions";

    const [btnC, btnS] = createCandidateActionButtons(
      cellIdx,
      orig.id,
      st,
      data.nameAr,
      `تأكيد ${data.nameAr || ""}`,
      () => {
        confirmItemInCell(cellIdx, orig.id);
        refocusClueSelectionAction(orig.id, ".lens-mini-confirm");
      },
      () => {
        strikeItemInCell(cellIdx, orig.id);
        refocusClueSelectionAction(orig.id, ".lens-mini-strike");
      },
    );
    actions.appendChild(btnC);
    actions.appendChild(btnS);

    wrapper.appendChild(img);
    wrapper.appendChild(itemName);
    wrapper.appendChild(actions);
    selectionRow.appendChild(wrapper);
  });

  if (currentClueId) {
    const clue = clues.find((c) => c._id === currentClueId);
    if (clue) renderClueGridRows(clue);
  }
}

function showClueDetail(clueId, trigger = document.activeElement) {
  const clue = clues.find((c) => c._id === clueId);
  if (!clue || !clue.itemA || !clue.itemB) return;
  if (selectedClueId !== clueId) selectClue(clueId);

  currentClueId = clueId;
  const selectedRow =
    selectedCellIndex === null ? null : Math.floor(selectedCellIndex / gridCols);
  currentSelectionCellIdx = [clue.itemA.row, clue.itemB.row].includes(selectedRow)
    ? selectedCellIndex
    : null;

  const modal = document.getElementById("clueDetailModal");
  if (!modal) return;

  const badge = document.getElementById("cdmTypeBadge");
  badge.className = "cdm-type-badge";
  badge.textContent = "الدليل:";

  renderClueText(document.getElementById("cdmClueText"), clue);

  attachCdmViewToggle();
  syncCdmViewToggleUI();
  renderRelationLens(clue);
  renderClueGridRows(clue);
  showSelectionLens(currentSelectionCellIdx);

  openAccessibleDialog(
    modal,
    document.getElementById("cdmGotoBtn"),
    trigger,
  );
}

// ✅ أزرار الإغلاق تُربط في wireUI عبر addEventListener
window.closeClueDetail = function () {
  const modal = document.getElementById("clueDetailModal");
  if (modal) closeAccessibleDialog(modal);
  currentClueId = null;
  currentSelectionCellIdx = null;
  setClueSelectionLensOpen(false);
  const selectionLens = document.getElementById("cdmSelectionLens");
  selectionLens?.style.removeProperty("left");
  selectionLens?.style.removeProperty("top");
  selectionLens?.style.removeProperty("right");
  selectionLens?.style.removeProperty("bottom");
  selectionLens?.style.removeProperty("transform");
};
window.showClueDetail = showClueDetail;

// ---------- Cells & Lens ----------
function provideCluesForLevel(r, c) {
  const cl = generateClues(r, c);
  displayClues(cl);
}

function clearAllCellSelectionDecor() {
  const theCells = document.getElementsByClassName("cell");
  for (let j = 0; j < theCells.length; j++) {
    theCells[j].classList.remove("cell-selected");
    const glow = theCells[j].querySelector(":scope > .cell-selected-glow");
    if (glow) glow.remove();
  }
}

function selectGridCell(idx) {
  updateGridCellRovingFocus(idx);
  selectCell(idx);
  const smallScreen = window.matchMedia(
    "(max-width: 560px), (max-width: 900px) and (max-height: 520px)",
  ).matches;
  if (!smallScreen) return;

  const lensPanel = document.getElementById("lensPanel");
  if (lensPanel) {
    lensPanel.classList.add("is-floating-open");
    lensPanel.setAttribute("aria-hidden", "false");
  }
}

function updateGridCellRovingFocus(activeIndex, { focus = false } = {}) {
  if (!allCells) return;
  const cells = allCells.querySelectorAll(".cell");
  cells.forEach((cell, index) => {
    cell.tabIndex = index === activeIndex ? 0 : -1;
    cell.setAttribute("aria-selected", String(index === selectedCellIndex));
  });
  if (focus) document.getElementById(`c${activeIndex}`)?.focus({ preventScroll: true });
}

function handleGridCellKeydown(event) {
  const cell = event.target.closest?.(".cell");
  if (!cell || event.target !== cell) return;

  const index = Number(cell.id.slice(1));
  if (!Number.isInteger(index)) return;
  const row = Math.floor(index / gridCols);
  const column = index % gridCols;
  const rtl = window.getComputedStyle(allCells).direction === "rtl";
  let nextIndex = index;

  switch (event.key) {
    case "ArrowRight":
      nextIndex += rtl ? -1 : 1;
      break;
    case "ArrowLeft":
      nextIndex += rtl ? 1 : -1;
      break;
    case "ArrowDown":
      nextIndex += gridCols;
      break;
    case "ArrowUp":
      nextIndex -= gridCols;
      break;
    case "Home":
      nextIndex = event.ctrlKey ? 0 : row * gridCols;
      break;
    case "End":
      nextIndex = event.ctrlKey
        ? gridRows * gridCols - 1
        : row * gridCols + gridCols - 1;
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      selectGridCell(index);
      return;
    default:
      return;
  }

  event.preventDefault();
  if (
    nextIndex < 0 ||
    nextIndex >= gridRows * gridCols ||
    ((event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      Math.floor(nextIndex / gridCols) !== row)
  ) return;

  updateGridCellRovingFocus(nextIndex, { focus: true });
}

function setMobileGridZoom(nextZoom, focusX, focusY) {
  const matrix = document.querySelector(".matrix-container");
  if (!matrix || !allCells) return;

  const zoom = Math.min(2, Math.max(0.7, nextZoom));
  if (Math.abs(zoom - mobileGridZoom) < 0.005) return;

  const rect = matrix.getBoundingClientRect();
  const x = focusX ?? rect.width / 2;
  const y = focusY ?? rect.height / 2;
  const oldWidth = Math.max(matrix.scrollWidth, 1);
  const oldHeight = Math.max(matrix.scrollHeight, 1);
  const contentXFromRight = -matrix.scrollLeft + matrix.clientWidth - x;
  const contentY = matrix.scrollTop + y;

  mobileGridZoom = zoom;
  if (zoom === 1) allCells.style.removeProperty("--grid-zoom");
  else allCells.style.setProperty("--grid-zoom", String(zoom));
  matrix.classList.toggle("grid-zoom-active", zoom !== 1);

  const widthScale = matrix.scrollWidth / oldWidth;
  const heightScale = matrix.scrollHeight / oldHeight;
  const nextLeft = -(
    contentXFromRight * widthScale - (matrix.clientWidth - x)
  );
  const nextTop = contentY * heightScale - y;
  matrix.scrollLeft = Math.max(
    matrix.clientWidth - matrix.scrollWidth,
    Math.min(0, nextLeft),
  );
  matrix.scrollTop = Math.max(
    0,
    Math.min(matrix.scrollHeight - matrix.clientHeight, nextTop),
  );
  updateGridZoomControls();
}

function updateGridZoomControls() {
  const value = document.getElementById("gridZoomValue");
  const zoomIn = document.getElementById("gridZoomIn");
  const zoomOut = document.getElementById("gridZoomOut");
  if (value) {
    const percentage = Math.round(mobileGridZoom * 100);
    value.textContent = `${percentage}%`;
    value.setAttribute("aria-label", `مستوى تكبير الشبكة ${percentage}٪`);
  }
  if (zoomIn) zoomIn.disabled = mobileGridZoom >= 2;
  if (zoomOut) zoomOut.disabled = mobileGridZoom <= 0.7;
}

function updateGridZoomHint() {
  const hint = document.getElementById("gridZoomHint");
  const matrix = document.querySelector(".matrix-container");
  if (!hint || !matrix) return;
  const dismissed = matrix.classList.contains("grid-zoom-hint-dismissed");
  hint.classList.toggle("is-visible", gridCols >= 9 && !dismissed);
}

function selectCell(idx) {
  selectedCellIndex = idx;
  updateGridCellRovingFocus(idx);

  clearAllCellSelectionDecor();
  const cell = document.getElementById(`c${idx}`);
  if (cell) {
    cell.classList.add("cell-selected");

    const glow = document.createElement("span");
    glow.className = "cell-selected-glow";
    glow.setAttribute("aria-hidden", "true");
    cell.appendChild(glow);
  }
  bigCell.style.border = "solid var(--border-confirm) 0.25vw";

  const row = Math.floor(idx / gridCols);
  const col = idx % gridCols;
  document.getElementById("lensCellCoords").textContent =
    `(عمود ${col + 1} ، فئة ${row + 1})`;

  buildLens(idx);
  checkWin();
}

function buildLens(cellIdx) {
  bigCell.innerHTML = "";
  bigCell.className = `candidate-count-${gridCols}`;
  const cell = document.getElementById(`c${cellIdx}`);
  if (!cell) return;

  const imgs = [...cell.querySelectorAll("img")];
  const st = cellStates[cellIdx];

  imgs.forEach((orig) => {
    const data = imgDataMap[orig.id] || {};

    const wrapper = document.createElement("div");
    wrapper.className = "lens-item-wrapper";
    wrapper.dataset.origId = orig.id;
    wrapper.title = data.nameAr || "";

    const clone = document.createElement("img");
    clone.src = orig.src;
    clone.alt = orig.alt || data.nameAr || "";
    clone.className = "lens-item";
    clone.dataset.origId = orig.id;

    clone.addEventListener("click", (e) => {
      e.stopPropagation();
      meOrNotToggle(orig.id);
    });

    const itemName = document.createElement("span");
    itemName.className = "lens-item-name";
    itemName.textContent = data.nameAr || "";

    const actions = document.createElement("div");
    actions.className = "lens-item-actions";

    const [btnC, btnS] = createCandidateActionButtons(
      cellIdx,
      orig.id,
      st,
      data.nameAr,
      `تأكيد "${data.nameAr || ""}"`,
      () => confirmItem(orig.id),
      () => strikeItem(orig.id),
    );
    actions.appendChild(btnC);
    actions.appendChild(btnS);

    wrapper.appendChild(clone);
    wrapper.appendChild(itemName);
    wrapper.appendChild(actions);
    bigCell.appendChild(wrapper);
  });

  applyCellState(cellIdx);
}

// ---------- Actions ----------
function meOrNotToggle(origId) {
  if (selectedCellIndex === null) return;
  const st = cellStates[selectedCellIndex];
  if (!st) return;
  let restoredCandidate = false;

  if (st.confirmed === origId) {
    st.confirmed = null;
    playSound("strike");
  } else if (st.confirmed) {
    if (isAutoStruck(selectedCellIndex, origId)) return;
    restoreCandidateBesideConfirmed(selectedCellIndex, origId, st);
    restoredCandidate = true;
    playSound("confirm");
  } else {
    if (st.struck.has(origId)) {
      st.struck.delete(origId);
      restoredCandidate = true;
      playSound("confirm");
    } else {
      st.struck.add(origId);
      playSound("strike");
    }
  }

  afterCellChange(selectedCellIndex, restoredCandidate);
}

function confirmItem(origId) {
  if (selectedCellIndex === null) return;
  confirmItemInCell(selectedCellIndex, origId);
}

function strikeItem(origId) {
  if (selectedCellIndex === null) return;
  strikeItemInCell(selectedCellIndex, origId);
}

function restoreCandidateBesideConfirmed(cellIdx, origId, st) {
  const previousConfirmed = st.confirmed;
  if (!previousConfirmed || previousConfirmed === origId) return false;

  const cell = document.getElementById(`c${cellIdx}`);
  if (!cell) return false;

  [...cell.querySelectorAll("img")].forEach((img) => {
    const id = img.id;
    if (id === origId || id === previousConfirmed || st.struck.has(id)) return;
    if (!isAutoStruck(cellIdx, id)) st.struck.add(id);
  });

  st.confirmed = null;
  st.struck.delete(previousConfirmed);
  st.struck.delete(origId);
  return true;
}

function confirmItemInCell(cellIdx, origId) {
  const st = cellStates[cellIdx];
  if (!st) return;
  st.confirmed = origId;
  st.struck.delete(origId);
  playSound("confirm");
  afterCellChange(cellIdx);
}

function strikeItemInCell(cellIdx, origId) {
  const st = cellStates[cellIdx];
  if (!st) return;
  const hiddenByLocalState =
    st.struck.has(origId) || (st.confirmed && st.confirmed !== origId);
  const autoStruck = isAutoStruck(cellIdx, origId);

  const restoredCandidate = hiddenByLocalState && !autoStruck;
  if (restoredCandidate) {
    if (!restoreCandidateBesideConfirmed(cellIdx, origId, st)) {
      st.struck.delete(origId);
    }
    playSound("confirm");
  } else {
    if (st.confirmed === origId) st.confirmed = null;
    st.struck.add(origId);
    playSound("strike");
  }
  afterCellChange(cellIdx, restoredCandidate);
}

function createCandidateActionButtons(cellIdx, origId, st, nameAr, confirmTitle, onConfirm, onStrike) {
  const btnC = document.createElement("button");
  btnC.type = "button";
  btnC.className = "lens-mini-btn lens-mini-confirm";
  btnC.textContent = "✓";
  btnC.title = confirmTitle;
  btnC.setAttribute("aria-label", btnC.title);
  btnC.addEventListener("click", (e) => {
    e.stopPropagation();
    onConfirm();
  });

  const btnS = document.createElement("button");
  btnS.type = "button";
  btnS.className = "lens-mini-btn lens-mini-strike";
  setStrikeButtonState(btnS, cellIdx, origId, st, nameAr);
  btnS.addEventListener("click", (e) => {
    e.stopPropagation();
    onStrike();
  });
  return [btnC, btnS];
}

function setStrikeButtonState(button, cellIdx, origId, st, name) {
  const hiddenByLocalState =
    st.struck.has(origId) || (st.confirmed && st.confirmed !== origId);
  const autoStruck = isAutoStruck(cellIdx, origId);
  const canRestore = hiddenByLocalState && !autoStruck;

  button.classList.toggle("lens-mini-restore", canRestore);
  button.textContent = canRestore ? "⟲" : "✕";
  button.title = canRestore
    ? `استرجاع ${name || ""}`
    : autoStruck
      ? `مستبعد تلقائياً: ${name || ""}`
      : `شطب ${name || ""}`;
  button.setAttribute("aria-label", button.title);
  button.disabled = autoStruck;
}

function autoConfirmSingleCandidates(skipCellIdx = null) {
  const total = gridRows * gridCols;
  let changed = true;
  let safety = 0;
  while (changed && safety < 30) {
    changed = false;
    safety++;
    for (let i = 0; i < total; i++) {
      if (i === skipCellIdx) continue;
      const st = cellStates[i];
      if (!st || st.confirmed) continue;
      const cell = document.getElementById(`c${i}`);
      if (!cell) continue;
      applyCellState(i);
      const imgs = [...cell.querySelectorAll("img")];
      const visible = imgs.filter((im) => !im.classList.contains("displayMe"));
      if (visible.length === 1) {
        st.confirmed = visible[0].id;
        st.struck.delete(visible[0].id);
        changed = true;
      }
    }
  }
}

function refreshAllCells() {
  const total = gridRows * gridCols;
  for (let i = 0; i < total; i++) {
    applyCellState(i);
  }
}

function afterCellChange(cellIdx, restoredCandidate = false) {
  refreshAllCells();
  autoConfirmSingleCandidates(restoredCandidate ? cellIdx : null);
  refreshAllCells();
  updateSolutionProgress(computeSolvedCount());
  setTimeout(() => {
    applyCurrentClueHighlight();
  }, 0);

  if (currentClueId) {
    const cdm = document.getElementById("clueDetailModal");
    if (cdm && cdm.style.display === "flex") {
      const clue = clues.find((c) => c._id === currentClueId);
      if (clue) {
        renderClueGridRows(clue);
        if (currentSelectionCellIdx !== null) {
          showSelectionLens(currentSelectionCellIdx);
        } else {
          showSelectionLens(null);
        }
      }
    }
  }

  checkWin();
}

window.meOrNot = meOrNotToggle;

function applyCellState(cellIdx) {
  const st = cellStates[cellIdx];
  if (!st) return;
  const cell = document.getElementById(`c${cellIdx}`);
  if (!cell) return;

  [...cell.querySelectorAll("img")].forEach((img) => {
    const id = img.id;
    img.classList.remove("displayMe", "confirmedMe", "struckMe");
    const autoStruck = isAutoStruck(cellIdx, id);
    const visible = st.confirmed
      ? id === st.confirmed
      : !st.struck.has(id) && !autoStruck;
    if (!visible) img.classList.add("displayMe");
    if (st.confirmed === id) img.classList.add("confirmedMe");
    if (st.struck.has(id) || autoStruck) img.classList.add("struckMe");
  });
  cell.classList.toggle("has-confirmed", !!st.confirmed);

  if (selectedCellIndex === cellIdx) {
    [...bigCell.querySelectorAll(".lens-item-wrapper")].forEach((wrap) => {
      const origId = wrap.dataset.origId;
      const img = wrap.querySelector("img.lens-item");
      if (!img) return;

      wrap.classList.remove("is-confirmed", "is-struck", "is-dim");
      img.classList.remove("opacityMe", "lens-confirmed");

      const autoStruck = isAutoStruck(cellIdx, origId);
      const dim = st.confirmed
        ? origId !== st.confirmed
        : st.struck.has(origId) || autoStruck;

      if (dim) {
        img.classList.add("opacityMe");
        wrap.classList.add("is-dim");
      }
      if (st.confirmed === origId) {
        img.classList.add("lens-confirmed");
        wrap.classList.add("is-confirmed");
      }
      if (st.struck.has(origId) || autoStruck) {
        wrap.classList.add("is-struck");
      }
      const strikeButton = wrap.querySelector(".lens-mini-strike");
      if (strikeButton) {
        setStrikeButtonState(
          strikeButton,
          cellIdx,
          origId,
          st,
          imgDataMap[origId] && imgDataMap[origId].nameAr,
        );
      }
    });
  }
}

// ---------- Progress ----------
function computeSolvedCount() {
  let solved = 0;
  const total = gridRows * gridCols;
  for (let i = 0; i < total; i++) {
    const st = cellStates[i];
    if (!st) continue;
    if (st.confirmed) {
      solved++;
      continue;
    }
    const cell = document.getElementById(`c${i}`);
    if (!cell) continue;
    const visible = [...cell.querySelectorAll("img")].filter(
      (im) => !im.classList.contains("displayMe"),
    );
    if (visible.length === 1) solved++;
  }
  return solved;
}

function updateSolutionProgress(solved) {
  const total = gridRows * gridCols;
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const el = document.getElementById("solutionPercent");
  if (el) el.textContent = pct + "%";
}

// ======================================================
//  WIN DETECTION — sort على مستوى الأعمدة
// ======================================================

function getCellAnswer(cellIdx) {
  const st = cellStates[cellIdx];
  if (!st) return null;

  if (st.confirmed) {
    const data = imgDataMap[st.confirmed];
    return data ? data.file : null;
  }

  const cell = document.getElementById(`c${cellIdx}`);
  if (!cell) return null;
  const imgs = [...cell.querySelectorAll("img")];
  const visible = imgs.filter((im) => !im.classList.contains("displayMe"));
  if (visible.length !== 1) return null;
  const data = imgDataMap[visible[0].id];
  return data ? data.file : null;
}

function checkWin() {
  if (winShown) return;
  if (!Array.isArray(shortLevel) || shortLevel.length === 0) return;

  try {
    const playerResult = [];
    for (let c = 0; c < gridCols; c++) {
      const col = [];
      for (let r = 0; r < gridRows; r++) {
        const idx = r * gridCols + c;
        const ans = getCellAnswer(idx);
        if (ans === null) return;
        col.push(ans);
      }
      playerResult.push(col);
    }

    const pClone = playerResult.map((col) => [...col]);
    const sClone = shortLevel.map((col) => [...col]);

    const pStr = pClone.sort().join(",");
    const sStr = sClone.sort().join(",");

    if (pStr === sStr) showWin();
  } catch (err) {
    console.error("[checkWin] error:", err);
  }
}

window.forceWinCheck = checkWin;

function showWin() {
  if (winShown) return;
  winShown = true;
  stopStopwatch();
  updateStopwatchDisplay();
  const stopwatchStatus = document.getElementById("stopwatchStatus");
  if (stopwatchStatus) stopwatchStatus.textContent = "العداد متوقف";

  try {
    const cdm = document.getElementById("clueDetailModal");
    if (cdm) closeAccessibleDialog(cdm, { restoreFocus: false });
  } catch (_) {}
  currentClueId = null;
  currentSelectionCellIdx = null;

  const winEl = document.getElementById("win");
  if (!winEl) {
    console.error("[showWin] #win element not found");
    return;
  }

  openAccessibleDialog(
    winEl,
    document.getElementById("closeWinBtn"),
  );

  try {
    const gs = document.getElementById("winGridSize");
    const cc = document.getElementById("winCluesCount");
    const rt = document.getElementById("winRankTitle");
    if (gs) gs.textContent = `${gridRows}×${gridCols}`;
    if (cc)
      cc.textContent = `${clues.length} ${
        clues.length === 1 ? "دليل" : "أدلة"
      }`;
    if (rt) rt.textContent = getRankTitle();
    updateStopwatchDisplay();
  } catch (e) {
    console.error("[showWin] stats error:", e);
  }

  try {
    playSound("win");
  } catch (_) {}
  try {
    launchConfetti();
  } catch (_) {}
}

function getRankTitle() {
  const total = gridRows * gridCols;
  if (total <= 4) return "مبتدئ واعد ✨";
  if (total <= 9) return "محقق ماهر 🔍";
  if (total <= 16) return "عبقري منطق 🧠";
  if (total <= 36) return "خبير استنتاج 🎯";
  if (total <= 81) return "أسطورة ألغاز 👑";
  return "آينشتاين العصر 🌟";
}

window.closeME = function () {
  clearConfetti();
  const win = document.getElementById("win");
  if (win) closeAccessibleDialog(win);
  winShown = false;
};

function hideWin({ restoreFocus = true } = {}) {
  clearConfetti();
  const win = document.getElementById("win");
  if (win) closeAccessibleDialog(win, { restoreFocus });
  winShown = false;
}

// ---------- Share ----------
async function shareResult() {
  const txt =
    `🧠 حللت لغز "مين مع مين؟" بشبكة ${gridRows}×${gridCols} ` +
    `في ${formatTime(stopwatchSeconds)} باستخدام ${clues.length} دليل!`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "مين مع مين؟", text: txt });
    } else {
      await navigator.clipboard.writeText(txt);
      showToast("تم نسخ النتيجة!");
    }
  } catch (_) {}
}

// ---------- UI Wiring ----------
function wireUI() {
  const matrixContainer = document.querySelector(".matrix-container");
  const mobileMenu = document.querySelector(".header-menu");
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mobileMenuPanel = document.getElementById("mobileMenuPanel");
  const closeMobileMenu = () => {
    if (!mobileMenuPanel || !mobileMenuToggle) return;
    mobileMenuPanel.classList.remove("is-open");
    mobileMenuToggle.setAttribute("aria-expanded", "false");
    mobileMenuToggle.setAttribute("aria-label", "فتح قائمة أدوات اللعبة");
  };
  if (
    mobileMenu &&
    mobileMenuToggle &&
    mobileMenuPanel &&
    mobileMenuToggle.dataset.bound !== "1"
  ) {
    mobileMenuToggle.dataset.bound = "1";
    mobileMenuToggle.addEventListener("click", () => {
      const isOpen = mobileMenuPanel.classList.toggle("is-open");
      mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
      mobileMenuToggle.setAttribute(
        "aria-label",
        isOpen ? "إغلاق قائمة أدوات اللعبة" : "فتح قائمة أدوات اللعبة",
      );
    });
    mobileMenuPanel.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button) {
        const opensDialog = button.getAttribute("aria-haspopup") === "dialog";
        closeMobileMenu();
        if (!opensDialog) mobileMenuToggle.focus({ preventScroll: true });
      }
    });
    mobileMenuPanel.addEventListener("change", (event) => {
      if (event.target.matches("select")) {
        closeMobileMenu();
        mobileMenuToggle.focus({ preventScroll: true });
      }
    });
    document.addEventListener("click", (event) => {
      if (
        mobileMenuPanel.classList.contains("is-open") &&
        !mobileMenu.contains(event.target)
      ) {
        closeMobileMenu();
      }
    });
  }
  if (allCells && allCells.dataset.keyboardGridBound !== "1") {
    allCells.dataset.keyboardGridBound = "1";
    allCells.addEventListener("keydown", handleGridCellKeydown);
  }
  const zoomControls = document.querySelector(".matrix-zoom-controls");
  if (zoomControls && zoomControls.dataset.bound !== "1") {
    zoomControls.dataset.bound = "1";
    zoomControls.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.id === "gridZoomIn") setMobileGridZoom(mobileGridZoom + 0.1);
      else if (button.id === "gridZoomOut") setMobileGridZoom(mobileGridZoom - 0.1);
    });
    updateGridZoomControls();
  }
  const zoomReset = document.getElementById("gridZoomReset");
  if (zoomReset && zoomReset.dataset.bound !== "1") {
    zoomReset.dataset.bound = "1";
    zoomReset.addEventListener("click", () => setMobileGridZoom(1));
  }
  const zoomHintClose = document.getElementById("gridZoomHintClose");
  if (zoomHintClose && zoomHintClose.dataset.bound !== "1") {
    zoomHintClose.dataset.bound = "1";
    zoomHintClose.addEventListener("click", () => {
      const hint = document.getElementById("gridZoomHint");
      if (hint) hint.classList.remove("is-visible");
      if (matrixContainer) matrixContainer.classList.add("grid-zoom-hint-dismissed");
    });
  }
  if (matrixContainer && matrixContainer.dataset.touchZoomBound !== "1") {
    matrixContainer.dataset.touchZoomBound = "1";
    const activeTouches = new Map();
    let panGesture = null;
    let pinchGesture = null;
    let suppressCellClickUntil = 0;

    matrixContainer.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".matrix-zoom-controls")) return;
      if (
        event.pointerType !== "touch" ||
        !window.matchMedia(
          "(max-width: 560px), (max-width: 900px) and (max-height: 520px), (orientation: landscape) and (min-width: 901px) and (max-width: 1200px) and (max-height: 520px)",
        ).matches
      ) return;

      activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activeTouches.size === 1) {
        panGesture = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startLeft: matrixContainer.scrollLeft,
          startTop: matrixContainer.scrollTop,
          moved: false,
        };
        return;
      }

      if (activeTouches.size === 2) {
        const points = [...activeTouches.values()];
        const dx = points[1].x - points[0].x;
        const dy = points[1].y - points[0].y;
        pinchGesture = {
          startDistance: Math.hypot(dx, dy),
          startZoom: mobileGridZoom,
        };
        panGesture = null;
        suppressCellClickUntil = Date.now() + 500;
      }
    });

    document.addEventListener("pointermove", (event) => {
      const point = activeTouches.get(event.pointerId);
      if (!point) return;
      point.x = event.clientX;
      point.y = event.clientY;

      if (activeTouches.size >= 2 && pinchGesture) {
        const points = [...activeTouches.values()].slice(0, 2);
        const dx = points[1].x - points[0].x;
        const dy = points[1].y - points[0].y;
        const distance = Math.hypot(dx, dy);
        const rect = matrixContainer.getBoundingClientRect();
        const focusX = (points[0].x + points[1].x) / 2 - rect.left;
        const focusY = (points[0].y + points[1].y) / 2 - rect.top;
        if (pinchGesture.startDistance > 0) {
          setMobileGridZoom(
            pinchGesture.startZoom * (distance / pinchGesture.startDistance),
            focusX,
            focusY,
          );
        }
        return;
      }

      if (activeTouches.size === 1 && panGesture?.pointerId === event.pointerId) {
        const dx = event.clientX - panGesture.startX;
        const dy = event.clientY - panGesture.startY;
        if (Math.hypot(dx, dy) > 6) panGesture.moved = true;
        if (panGesture.moved) {
          matrixContainer.scrollLeft = panGesture.startLeft + dx;
          matrixContainer.scrollTop = panGesture.startTop - dy;
        }
      }
    });

    const finishGridTouch = (event) => {
      if (!activeTouches.has(event.pointerId)) return;
      if (pinchGesture || panGesture?.moved) {
        suppressCellClickUntil = Date.now() + 120;
      }
      activeTouches.delete(event.pointerId);
      if (activeTouches.size < 2) pinchGesture = null;
      if (activeTouches.size === 0) panGesture = null;
    };
    document.addEventListener("pointerup", finishGridTouch);
    document.addEventListener("pointercancel", finishGridTouch);

    matrixContainer.addEventListener(
      "click",
      (event) => {
        if (
          Date.now() < suppressCellClickUntil &&
          event.target.closest(".cell")
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  }

  const mobileLens = document.getElementById("lensPanel");
  const lensCloseBtn = document.getElementById("lensCloseBtn");
  const lensDragHandle = mobileLens?.querySelector(".lens-header");
  if (mobileLens && lensCloseBtn && lensCloseBtn.dataset.bound !== "1") {
    lensCloseBtn.dataset.bound = "1";
    lensCloseBtn.addEventListener("click", () => {
      mobileLens.classList.remove("is-floating-open");
      mobileLens.setAttribute("aria-hidden", "true");
    });
  }
  if (mobileLens && lensDragHandle && lensDragHandle.dataset.dragBound !== "1") {
    lensDragHandle.dataset.dragBound = "1";
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    lensDragHandle.addEventListener("pointerdown", (event) => {
      if (
        !window.matchMedia(
          "(max-width: 560px), (max-width: 900px) and (max-height: 520px)",
        ).matches ||
        event.target.closest("button")
      ) return;
      const rect = mobileLens.getBoundingClientRect();
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      mobileLens.style.left = `${rect.left}px`;
      mobileLens.style.top = `${rect.top}px`;
      mobileLens.style.right = "auto";
      mobileLens.style.bottom = "auto";
      mobileLens.style.transform = "none";
      lensDragHandle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    lensDragHandle.addEventListener("pointermove", (event) => {
      if (!lensDragHandle.hasPointerCapture(event.pointerId)) return;
      const rect = mobileLens.getBoundingClientRect();
      const left = Math.min(
        window.innerWidth - rect.width - 4,
        Math.max(4, event.clientX - dragOffsetX),
      );
      const top = Math.min(
        window.innerHeight - rect.height - 4,
        Math.max(4, event.clientY - dragOffsetY),
      );
      mobileLens.style.left = `${left}px`;
      mobileLens.style.top = `${top}px`;
    });
    lensDragHandle.addEventListener("pointerup", (event) => {
      if (lensDragHandle.hasPointerCapture(event.pointerId)) {
        lensDragHandle.releasePointerCapture(event.pointerId);
      }
    });
    lensDragHandle.addEventListener("pointercancel", (event) => {
      if (lensDragHandle.hasPointerCapture(event.pointerId)) {
        lensDragHandle.releasePointerCapture(event.pointerId);
      }
    });
  }

  document.querySelectorAll(".panel-collapse-toggle").forEach((button) => {
    if (button.dataset.bound === "1") return;
    button.dataset.bound = "1";
    button.addEventListener("click", () => {
      const panel = button.closest(".lens-panel, .clues-panel");
      if (!panel) return;
      const isOpen = panel.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute(
        "aria-label",
        isOpen ? "إخفاء اللوحة" : "إظهار اللوحة",
      );
      if (panel.classList.contains("clues-panel")) {
        scheduleCluePagination();
      }
    });
  });

  let wasSmallScreen = window.matchMedia(
    "(max-width: 560px), (max-width: 900px) and (max-height: 520px)",
  ).matches;
  window.addEventListener("resize", () => {
    const smallScreen = window.matchMedia(
      "(max-width: 560px), (max-width: 900px) and (max-height: 520px)",
    ).matches;
    if (smallScreen && !wasSmallScreen) {
      const cluesPanel = document.querySelector(".clues-panel");
      if (cluesPanel?.classList.contains("is-open")) {
        cluesPanel.classList.remove("is-open");
        const toggle = cluesPanel.querySelector(".panel-collapse-toggle");
        toggle?.setAttribute("aria-expanded", "false");
        toggle?.setAttribute("aria-label", "إظهار اللوحة");
        scheduleCluePagination();
      }
    }
    wasSmallScreen = smallScreen;
  });

  if (!cluePaginationObserver) {
    const cluesPanel = document.querySelector(".clues-panel");
    if (window.ResizeObserver && cluesPanel) {
      cluePaginationObserver = new ResizeObserver(scheduleCluePagination);
      cluePaginationObserver.observe(cluesPanel);
    } else {
      window.addEventListener("resize", scheduleCluePagination);
    }
  }

  const lensInfoWrap = document.querySelector(".lens-info-wrap");
  const lensInfoBtn = document.getElementById("lensInfoBtn");
  if (lensInfoWrap && lensInfoBtn && lensInfoBtn.dataset.bound !== "1") {
    lensInfoBtn.dataset.bound = "1";
    lensInfoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = lensInfoWrap.classList.toggle("is-open");
      lensInfoBtn.setAttribute("aria-expanded", String(isOpen));
    });
    document.addEventListener("pointerdown", (e) => {
      if (lensInfoWrap.contains(e.target)) return;
      lensInfoWrap.classList.remove("is-open");
      lensInfoBtn.setAttribute("aria-expanded", "false");
    });
  }

  const soundBtn = document.getElementById("soundToggle");
  soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    document.getElementById("soundIconOn").style.display = soundEnabled
      ? ""
      : "none";
    document.getElementById("soundIconOff").style.display = soundEnabled
      ? "none"
      : "";
    showToast(soundEnabled ? "الصوت مفعّل" : "الصوت مكتوم");
  });

  document.getElementById("resetBtn").addEventListener("click", () => rAndc());

  const clueFilterBtn = document.getElementById("clueFilterBtn");
  const clueFilterModal = document.getElementById("clueFilterModal");
  const closeClueFilter = () => {
    if (clueFilterModal) closeAccessibleDialog(clueFilterModal);
  };
  if (clueFilterBtn && clueFilterModal && clueFilterBtn.dataset.bound !== "1") {
    clueFilterBtn.dataset.bound = "1";
    clueFilterBtn.addEventListener("click", () => {
      clueFilterDraft = Object.fromEntries(
        Object.entries(clueFilter).map(([category, files]) => [
          category,
          Array.isArray(files) ? files.slice() : null,
        ]),
      );
      renderClueFilterOptions();
      openAccessibleDialog(
        clueFilterModal,
        document.getElementById("closeClueFilterBtn"),
        clueFilterBtn,
      );
    });
    document
      .getElementById("closeClueFilterBtn")
      .addEventListener("click", closeClueFilter);
    document
      .getElementById("applyClueFilterBtn")
      .addEventListener("click", () => {
        clueFilter = Object.fromEntries(
          Object.entries(clueFilterDraft).map(([category, files]) => [
            category,
            Array.isArray(files) ? files.slice() : null,
          ]),
        );
        updateClueFilterButton();
        displayClues(clues);
        closeClueFilter();
      });
    document
      .getElementById("clearClueFilterBtn")
      .addEventListener("click", () => {
        clueFilter = {};
        clueFilterDraft = {};
        updateClueFilterButton();
        displayClues(clues);
        closeClueFilter();
      });
    clueFilterModal.addEventListener("click", (event) => {
      if (event.target === clueFilterModal) closeClueFilter();
    });
  }

  const gameGuideBtn = document.getElementById("gameGuideBtn");
  const gameGuideModal = document.getElementById("gameGuideModal");
  const closeGameGuideBtn = document.getElementById("closeGameGuideBtn");
  const closeGameGuide = () => {
    if (gameGuideModal) closeAccessibleDialog(gameGuideModal);
    gameGuideBtn?.setAttribute("aria-expanded", "false");
  };
  if (
    gameGuideBtn &&
    gameGuideModal &&
    closeGameGuideBtn &&
    gameGuideBtn.dataset.bound !== "1"
  ) {
    gameGuideBtn.dataset.bound = "1";
    gameGuideBtn.setAttribute("aria-expanded", "false");
    gameGuideBtn.addEventListener("click", () => {
      const trigger = mobileMenuPanel?.classList.contains("is-open")
        ? mobileMenuToggle
        : gameGuideBtn;
      openAccessibleDialog(gameGuideModal, closeGameGuideBtn, trigger);
      gameGuideBtn.setAttribute("aria-expanded", "true");
    });
    closeGameGuideBtn.addEventListener("click", closeGameGuide);
    gameGuideModal.addEventListener("click", (event) => {
      if (event.target === gameGuideModal) closeGameGuide();
    });
  }

  // زر إغلاق النافذة والعودة إلى الشبكة
  wireClueSelectionLens();
  const cdmGoto = document.getElementById("cdmGotoBtn");
  if (cdmGoto) {
    cdmGoto.addEventListener("click", (e) => {
      e.stopPropagation();
      window.closeClueDetail();
      const wrapper = document.querySelector(
        ".matrix-scroll-wrapper.matrix-grid",
      );
      if (wrapper)
        wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // النقر على الخلفية يُغلق النافذة
  const cdmOverlay = document.getElementById("clueDetailModal");
  if (cdmOverlay) {
    cdmOverlay.addEventListener("click", (e) => {
      if (e.target === cdmOverlay) window.closeClueDetail();
    });
  }

  // 4) زر Escape يُغلق النافذة
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (mobileMenuPanel?.classList.contains("is-open")) {
        closeMobileMenu();
        e.preventDefault();
        mobileMenuToggle?.focus({ preventScroll: true });
        return;
      }
      if (closeTopmostAccessibleDialog()) {
        e.preventDefault();
        return;
      }
      lensInfoWrap?.classList.remove("is-open");
      lensInfoBtn?.setAttribute("aria-expanded", "false");
    }
  });

  // ======================================================
  //  Custom Size Modal
  // ======================================================
  const csm = document.getElementById("customSizeModal");
  const rIn = document.getElementById("customRowsInput");
  const cIn = document.getElementById("customColsInput");
  const rVal = document.getElementById("customRowsVal");
  const cVal = document.getElementById("customColsVal");
  const total = document.getElementById("customTotalCells");

  function refresh() {
    rVal.textContent = rIn.value;
    cVal.textContent = cIn.value;
    total.textContent = +rIn.value * +cIn.value;
  }

  const customSizeBtn = document.getElementById("customSizeBtn");
  customSizeBtn.addEventListener("click", () => {
    const trigger = mobileMenuPanel?.classList.contains("is-open")
      ? mobileMenuToggle
      : customSizeBtn;
    openAccessibleDialog(csm, rIn, trigger);
    refresh();
  });
  document
    .getElementById("closeCustomModalBtn")
    .addEventListener("click", () => {
      closeAccessibleDialog(csm);
    });
  csm.addEventListener("click", (event) => {
    if (event.target === csm) closeAccessibleDialog(csm);
  });
  rIn.addEventListener("input", refresh);
  cIn.addEventListener("input", refresh);
  document
    .getElementById("applyCustomSizeBtn")
    .addEventListener("click", () => {
      customSize = { rows: +rIn.value, cols: +cIn.value };
      useCustomSize = true;
      closeAccessibleDialog(csm);
      rAndc();
    });

  // ======================================================
  //  Win Modal buttons
  // ======================================================
  document.getElementById("newChallengeBtn").addEventListener("click", () => {
    hideWin({ restoreFocus: false });
    if (mobileMenuPanel && mobileMenuToggle) {
      mobileMenuPanel.classList.add("is-open");
      mobileMenuToggle.setAttribute("aria-expanded", "true");
      mobileMenuToggle.setAttribute("aria-label", "إغلاق قائمة أدوات اللعبة");
    }
    document.getElementById("gridSizeSelect")?.focus({ preventScroll: true });
    rAndc();
  });
  document
    .getElementById("inspectGridBtn")
    .addEventListener("click", () => hideWin());
  document.getElementById("shareBtn").addEventListener("click", shareResult);
  document
    .getElementById("closeWinBtn")
    .addEventListener("click", () => window.closeME());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireUI, { once: true });
} else {
  wireUI();
}

function distributeCategoryRow(rowIndex) {
  const icon = document.querySelectorAll(".row-category-icon")[rowIndex];
  if (rowDistributionSnapshots[rowIndex]) {
    restoreRowStates(cellStates, rowDistributionSnapshots[rowIndex]);
    delete rowDistributionSnapshots[rowIndex];
    if (icon) {
      const categoryName = getCategoryDisplayName(rowNamePlayer[rowIndex]);
      icon.setAttribute("aria-label", `وزّع عناصر ${categoryName} على خلايا الصف`);
      icon.title = `وزّع عناصر ${categoryName} على خلايا الصف`;
      icon.setAttribute("aria-pressed", "false");
      icon.classList.remove("is-distributed");
    }
  } else {
    const solutionItems = getRowItemsByColumn(levelResult, rowIndex);
    const rowItems = shuffleRowItems(solutionItems);
    if (rowItems.length !== gridCols || rowItems.some((item) => !item)) return;
    rowDistributionSnapshots[rowIndex] = snapshotRowStates(cellStates, rowIndex, gridCols);

    rowItems.forEach((item, columnIndex) => {
      const cellIndex = rowIndex * gridCols + columnIndex;
      const correctCandidate = [...document.getElementById(`c${cellIndex}`).querySelectorAll("img")]
        .find((image) => image.dataset.origId === item._origId);
      if (!correctCandidate) return;
      cellStates[cellIndex].confirmed = correctCandidate.id;
      cellStates[cellIndex].struck.delete(correctCandidate.id);
    });

    if (icon) {
      const categoryName = getCategoryDisplayName(rowNamePlayer[rowIndex]);
      icon.setAttribute("aria-label", `تراجع عن توزيع عناصر ${categoryName}`);
      icon.title = `تراجع عن توزيع عناصر ${categoryName}`;
      icon.setAttribute("aria-pressed", "true");
      icon.classList.add("is-distributed");
    }
  }

  refreshAllCells();
  updateSolutionProgress(computeSolvedCount());
  applyCurrentClueHighlight();
  checkWin();
}

window.pushClues = pushClues;
window.rAndc = window.rAndc;
