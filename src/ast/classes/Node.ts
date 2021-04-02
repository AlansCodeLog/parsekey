import type { ChainNode } from "./ChainNode"
import type { ComboNode } from "./ComboNode"

import { ShortcutsParserLibraryError } from "@/helpers/errors"
import type { AST_TYPE } from "@/types"
import { ERROR_CODES } from "@/types/errors"


/**
 * The base AST node class all node types extend from. Can be used to check if an object is an ast node.
 * ```ts
 * if (token instanceof Node) {
 * 	//...
 * }
 * ```
 */

export class Node<
	TType extends AST_TYPE = AST_TYPE,
	TValid extends boolean = boolean,
> {
	readonly type: TType
	readonly start: number
	readonly end: number
	readonly valid!: TValid
	get parent(): ChainNode | ComboNode | undefined {
		return undefined as any
	}
	constructor(type: TType, start: number, end: number) {
		this.type = type
		if (start === undefined || end === undefined) {
			throw new ShortcutsParserLibraryError(ERROR_CODES.PARSER_POSITION_ERROR, { start, end })
		}
		this.start = start
		this.end = end
	}
	/**
	 * Returns the canonical version string version of the node.
	 *
	 * The main purpose is to provide some definitive string versions of nodes so that we can check the equality of two **shortcuts**. This should ideally be done at the {@link ChainNode} level since e.g. `key` parses to `Chain(Combo(Key(key)))` but all it's node's string versions equal each other (i.e. `Chain(Combo(Key(key)))` === `Key(key)`).
	 *
	 * The string returned should also parse back to exactly the same nodes (again, at the @ChainNode level).
	 *
	 * See {@link Token.stringify} for how this works at the token level.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	stringify(..._any: any[]): string {
		throw new Error("The base Node class does not implement this method. It must be implemented for any classes extending from it. ")
	}
}
