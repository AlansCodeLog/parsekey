import type { ComboNode } from "./ComboNode"
import { Node } from "./Node"
import type { Token } from "./Token"

import { ShortcutsParserLibraryError } from "@/helpers"
import { AST_TYPE, ERROR_CODES, FullParserOptions, TOKEN_TYPE } from "@/types"


export class ChainNode<
	TValid extends boolean = boolean,
	TNoteContent extends Token = Token<boolean, TOKEN_TYPE.NOTE_CONTENT>,
> extends Node<AST_TYPE.CHAIN> {
	readonly combos: ComboNode<boolean, TNoteContent>[]
	#parent: any
	#setParent: boolean = false
	get parent(): undefined {
		return this.#parent
	}
	set parent(value: undefined) {
		if (this.#setParent) { throw new Error("parent property is readonly") }
		this.#parent = value
		this.#setParent = true
	}
	constructor({ combos, start, end }: {
		combos: ComboNode<boolean, TNoteContent>[]
		start: number
		end: number
	}) {
		super(AST_TYPE.CHAIN, start, end)
		this.combos = combos
		// @ts-expect-error ignore readonly
		this.valid = (
			this.combos.every(val => val.valid)
		) as TValid
	}
	stringify(opts: Pick<FullParserOptions<any, any>, "separators" | "keyNote">): string {
		if (!this.valid) {
			throw new ShortcutsParserLibraryError(ERROR_CODES.INVALID_INSTANCE, {
				instance: this,
			}, "Only valid nodes can be stringified.")
		}
		return this.combos.map(combo => combo.stringify(opts)).join(" ")
	}
}
