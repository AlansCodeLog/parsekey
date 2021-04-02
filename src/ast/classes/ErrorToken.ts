import { Token } from "./Token"

import { ShortcutsParserLibraryError } from "@/helpers"
import { ERROR_CODES, TOKEN_TYPE } from "@/types"


/**
 * The class for invalid recovery tokens.
 *
 * Unlike valid tokens, error tokens:
 *
 * - Have no value.
 * - Contain an extra property, `expected` with an array of tokens *that would have fixed the issue* (NOT every possible token that could be there).
 * - The start end positions will always be equal. An invalid token has no length.
 */
export class ErrorToken<TExpected = TOKEN_TYPE,
> extends Token<false, never, never, TExpected[]> {
	readonly expected: TExpected[]
	constructor({ expected, start, end }: {
		expected: TExpected[]
		start: number
		end: number
	}) {
		super(start, end)
		this.expected = expected
	}
	stringify(): string {
		throw new ShortcutsParserLibraryError(ERROR_CODES.INVALID_INSTANCE, {
			instance: this as any,
		}, "Only valid nodes can be stringified.")
	}
}
