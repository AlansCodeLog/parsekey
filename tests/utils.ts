import { escapeRegex } from "@utils/utils"

import { key as keyBuilder, pos, token } from "@/ast/builders"
import type { KeyNode, Token } from "@/ast/classes"
import { Position, TOKEN_TYPE } from "@/types"


function indexOf(match: string, input: string, count: number = 1): number | undefined {
	if (count === 0) return undefined
	let i = 1
	for (const m of input.matchAll(new RegExp(escapeRegex(match), "g"))) {
		if (i === count) return m.index
		i++
	}
	return undefined
}


export const note = (
	input: string,
	value?: string,
	valueCount: number = 1,
	delimLeftCount: number = 1,
	delimRightCount: number = 1,
	delimL = "(", delimR = ")"
): ConstructorParameters<typeof KeyNode>[0]["note"] => {
	const hasLeft = indexOf(delimL, input, delimLeftCount) !== undefined
	const leftStart = hasLeft
		? indexOf(delimL, input, delimLeftCount)!
		: value
			? indexOf(value, input, valueCount)!
			: indexOf(delimR, input, delimRightCount)!
	const leftEnd = hasLeft ? leftStart + 1 : leftStart
	const left = token(TOKEN_TYPE.NOTE_DELIM_LEFT, hasLeft ? delimL : undefined, { start: leftStart, end: leftEnd })

	const hasRight = indexOf(delimR, input, delimRightCount) !== undefined

	const rightStart = hasRight
		? indexOf(delimR, input, delimRightCount)!
		: value
			? indexOf(value, input, valueCount)! + value.length
			: indexOf(delimL, input, delimLeftCount)! + 1
	const rightEnd = hasRight ? rightStart + 1 : rightStart
	const right = token(TOKEN_TYPE.NOTE_DELIM_RIGHT, hasRight ? delimR : undefined, { start: rightStart, end: rightEnd })

	const contentStart = value !== undefined ? indexOf(value, input, valueCount)! : leftEnd
	const contentEnd = value !== undefined ? contentStart + value.length : contentStart
	const content = token(TOKEN_TYPE.NOTE_CONTENT, value, { start: contentStart, end: contentEnd })

	return { left, right, content }
}

// eslint-disable-next-line @typescript-eslint/no-shadow
export const key = (input: string | Partial<Position>, value?: string, count: number = 1, note?: ConstructorParameters<typeof KeyNode>[0]["note"]): KeyNode => {
	if (typeof input === "string") {
		const index = indexOf(value!, input, count)!
		const t = token(TOKEN_TYPE.KEY, value, { start: index, end: index + value!.length })
		return keyBuilder(t, note)
	} else {
		const t = token(TOKEN_TYPE.KEY, value, pos(input, { fill: true }))
		return keyBuilder(t, note)
	}
}
export const sep = (input: string | Partial<Position>, name?: string, count: number = 1): Token<true, TOKEN_TYPE.SEPARATOR> => {
	if (typeof input === "string") {
		const index = indexOf(name!, input, count)!
		return token(TOKEN_TYPE.SEPARATOR, name, { start: index, end: index + name!.length }) as Token<true, TOKEN_TYPE.SEPARATOR>
	} else {
		return token(TOKEN_TYPE.SEPARATOR, name, pos(input, { fill: true })) as Token<true, TOKEN_TYPE.SEPARATOR>
	}
}
