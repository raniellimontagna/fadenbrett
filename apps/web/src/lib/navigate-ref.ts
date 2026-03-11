/** Shared ref for navigateToNode — set by InvestigationCanvas, read by CommandPalette */
export const navigateRef: { current: ((nodeId: string) => void) | null } = { current: null }
