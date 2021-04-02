import type { Position } from "@/types"

/** @internal */
type ChevrotainLocation = {
	startOffset?: number
	endOffset?: number
}

/** @internal */
export function extractPosition(loc: ChevrotainLocation): Position {
	return {
		start: loc.startOffset!,
		end: loc.endOffset! + 1,
	}
}
