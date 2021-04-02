import { escapeRegex } from "@utils/utils"

import { Token } from "./Token"

import { unescape } from "@/helpers/parser"
import { FullParserOptions, TOKEN_TYPE } from "@/types"


/**
 * The class for all *valid* tokens.
 *
 * Valid tokens always have a value, even if it might be an empty string.
 */

export class ValidToken<
	TType extends TOKEN_TYPE = TOKEN_TYPE,
> extends Token<true, TType, string, never> {
	readonly type: TType
	readonly value: string
	constructor({ type, value, start, end }: {
		type: TType
		value: string
		start: number
		end: number
	}
	) {
		super(start, end)
		this.type = type
		this.value = value
	}
	stringify(opts: Pick<FullParserOptions<any, any>, "separators" | "keyNote">): string {
		switch (this.type) {
			case TOKEN_TYPE.KEY: {
				const symbols = [...opts.separators]
				if (opts.keyNote) {
					symbols.push(opts.keyNote.left)
					symbols.push(opts.keyNote.right)
				}

				return unescape(this.value).replace(new RegExp(`(${[...symbols.map(sym => escapeRegex(sym)), "\\s"].join("|")})`), "\\$1")
			}
			case TOKEN_TYPE.SEPARATOR: {
				return opts.separators[0]
			}
			default:
				return this.value
		}
	}
}
