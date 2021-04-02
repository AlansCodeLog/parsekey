import { ChainNode, ComboNode, ErrorToken, KeyNode, Token, ValidToken } from "./classes"

import { Position, TOKEN_TYPE } from "@/types"


/* #region HELPERS */
function error<T extends TOKEN_TYPE>(pos: number, expected: T[]): ErrorToken<T> {
	if (pos === undefined) throw new Error("should never happen, passed undefined position for error token")
	return new ErrorToken({ expected, start: pos, end: pos })
}
/* #regionend */

/* #region TOKENS */

export const maybeToken = <T extends TOKEN_TYPE>(type: T) => (value: string | undefined, pos: Position,): Token<boolean, T> => {
	if (value === undefined) {
		return error(pos.end, [type])
	} else {
		return new ValidToken({ value, type, ...pos })
	}
}

export const token = {
	key: maybeToken(TOKEN_TYPE.KEY),
	sep: maybeToken(TOKEN_TYPE.SEPARATOR),
	delimL: maybeToken(TOKEN_TYPE.NOTE_DELIM_LEFT),
	delimR: maybeToken(TOKEN_TYPE.NOTE_DELIM_RIGHT),
	note: maybeToken(TOKEN_TYPE.NOTE_CONTENT),
}
/* #regionend */

/* #region AST NODES */
/* #regionend */
export function combo(keys: KeyNode[], seps: Token<boolean, TOKEN_TYPE.SEPARATOR>[] = []): ComboNode {
	const start = Math.min(keys[0].start, seps[0]?.start ?? Infinity)
	const end = Math.max(keys[keys.length - 1].end, seps[seps.length - 1]?.end ?? -Infinity)
	const instance = new ComboNode({ keys, seps, start, end })
	return instance
}

export function chain(combos: ComboNode[]): ChainNode {
	const start = combos[0].start
	const end = combos[combos.length - 1].end
	const instance = new ChainNode({ combos, start, end })
	return instance
}

/**
 * **Careful, note should be an object with at least one of the properties defined or completely undefined!**
 */
export function key(value: Token<boolean, TOKEN_TYPE.KEY> | undefined, note?: ConstructorParameters<typeof KeyNode>[0]["note"]): KeyNode<boolean, any> {
	const start = (value?.start ?? note?.left?.start ?? note?.right?.start)!
	const end = (note ? (note.right?.end ?? note.content?.end ?? note.left?.end) : value?.end)!
	if (note) {
		if (!note.left) {
			const pos = note.content?.start ?? note.right?.start
			note.left = new ErrorToken({ expected: [TOKEN_TYPE.NOTE_DELIM_LEFT], start: pos, end: pos })
		}

		if (!note.right) {
			const pos = note.content?.end ?? note.left?.end ?? value?.end
			note.right = new ErrorToken({ expected: [TOKEN_TYPE.NOTE_DELIM_RIGHT], start: pos, end: pos })
		}
	}
	if (value === undefined) value = new ErrorToken({ expected: [TOKEN_TYPE.KEY], start, end: start })
	return new KeyNode({ value, note, start, end })
}
/* #regionend */
