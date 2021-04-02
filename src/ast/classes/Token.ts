import { ShortcutsParserLibraryError } from "@/helpers/errors"
import { ERROR_CODES, FullParserOptions, Nodes, TOKEN_TYPE } from "@/types"

/**
 * The base class from which {@link ValidToken} and {@link ErrorToken} extend.
 *
 * Mostly for internal use or for checking something is any type of token.
 * ```ts
 * if (token instanceof Token) {
 * 	//...
 * }
 * ```
 * Only really takes care of setting the start/end position.
 */

export class Token<
	TValid extends boolean = boolean,
	TType extends
		TValid extends true ? TOKEN_TYPE : never =
		TValid extends true ? TOKEN_TYPE : never,
	TValue extends
		TValid extends true ? string : never =
		TValid extends true ? string : never,
	TExpected extends
		TValid extends false ? any[] : never =
		TValid extends false ? TOKEN_TYPE[] : never,
> {
	type!: TType
	readonly value!: TValue
	readonly expected!: TExpected
	readonly start!: number
	readonly end!: number
	#parent: any
	get parent(): Nodes {
		return this.#parent
	}
	set parent(value: Nodes) {
		if (this.#parent) { throw new Error("parent property is readonly") }
		this.#parent = value
	}
	constructor(start: number, end: number) {
		if (start === undefined || end === undefined) {
			throw new ShortcutsParserLibraryError(ERROR_CODES.PARSER_POSITION_ERROR, { start, end })
		}
		this.start = start
		this.end = end
	}
	// tocheck {@link ParserOptions}.keyNote doc link not working
	/**
	 * Returns the canonical string version of the token (for valid tokens).
	 *
	 * For example, say the separators are ["-"] and the user inputs `key\\-`, the canonical version is the same because the `-` required escaping. But, say they inputted `key\\+` thinking the `+` is a separator that needed to be escaped. This function will correctly return `key+` in this situation.
	 *
	 * The main purpose is to provide some definitive string versions of tokens so at the higher node levels, the string versions of shortcuts can be used for normalizing shortcuts to check for equality. See {@link Node.stringify} for more.
	 *
	 * So it should also be specified when extending from this class to customize the canonical version of key notes {@link ParserOptions}.keyNote since you probably don't want something like `key(note)` to not be equal to `key( note)`.
	 *
	 * The default implementation only needs to take care of how key and separator tokens are stringified.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	stringify(_opts: Pick<FullParserOptions<any, any>, "separators" | "keyNote">): string {
		throw new Error("The base Token class does not implement this method. It must be implemented for any classes extending from it. If you're getting this error, you probably tried extending from the base Token class without implementing the stringify method. I recommend extending from Valid/ErrorToken instead.")
	}
}
