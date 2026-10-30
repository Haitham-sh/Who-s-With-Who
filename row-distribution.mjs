/** Return the solution item for a row in each column, from column-major data. */
export function getRowItemsByColumn(solutionColumns, rowIndex) {
  if (!Array.isArray(solutionColumns) || !Number.isInteger(rowIndex) || rowIndex < 0) {
    return [];
  }

  return solutionColumns.map((column) =>
    Array.isArray(column) ? column[rowIndex] ?? null : null,
  );
}

export function shuffleRowItems(items, random = Math.random) {
  if (!Array.isArray(items)) return [];
  const shuffled = items.slice();

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  // Do not let the assist accidentally reveal the real left-to-right solution.
  if (shuffled.length > 1 && shuffled.every((item, index) => item === items[index])) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

export function snapshotRowStates(cellStates, rowIndex, columnCount) {
  const snapshot = {};
  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const cellIndex = rowIndex * columnCount + columnIndex;
    const state = cellStates[cellIndex];
    if (!state) continue;
    snapshot[cellIndex] = {
      confirmed: state.confirmed,
      struck: [...state.struck],
    };
  }
  return snapshot;
}

export function restoreRowStates(cellStates, snapshot) {
  for (const [cellIndex, state] of Object.entries(snapshot || {})) {
    if (!cellStates[cellIndex]) continue;
    cellStates[cellIndex].confirmed = state.confirmed;
    cellStates[cellIndex].struck = new Set(state.struck);
  }
}
