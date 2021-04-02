export type DebugColors = {
	/** Color used to highlight the actual text content of the token nodes. */
	values: string
	/** Color used to highlight the extra information some nodes contain in their headers for a quick overview (e.g. which operator for expression nodes, if a condition/group value is true, how long an array value is etc). */
	info: string
	position: string
	/** Color used to highlight the hints in parens that indicate how the node is being used (e.g. a variable node might be a property, or alone as a variable, etc) */
	hint: string
	error: string
	/** Color used to reset highlights. */
	reset: string
}
