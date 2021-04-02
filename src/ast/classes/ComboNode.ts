import type { ChainNode } from "./ChainNode"
import type { KeyNode } from "./KeyNode"
import { Node } from "./Node"
import type { Token } from "./Token"
import { ValidToken } from "./ValidToken"

import { ShortcutsParserLibraryError } from "@/helpers"
import { AST_TYPE, ERROR_CODES, FullParserOptions, TOKEN_TYPE } from "@/types"


export class ComboNode<
	TValid extends boolean = boolean,
	TNoteContent extends Token = Token<boolean, TOKEN_TYPE.NOTE_CONTENT>,
> extends Node<AST_TYPE.COMBO> {
	readonly keys: KeyNode<boolean, TNoteContent>[]
	/** The separators. They're always valid. */
	readonly seps: Token<boolean, TOKEN_TYPE.SEPARATOR>[]
	#parent: any
	#setParent: boolean = false
	get parent(): ChainNode | undefined {
		return this.#parent
	}
	set parent(value: ChainNode | undefined) {
		if (this.#setParent) { throw new Error("parent property is readonly") }
		this.#parent = value
		this.#setParent = true
	}
	get lastKey(): KeyNode<boolean, TNoteContent> {
		return this.keys[this.keys.length - 1]
	}
	get lastValidKey(): KeyNode<true, TNoteContent> | undefined {
		for (let i = this.keys.length; i > 0; i--) {
			const key = this.keys[i]
			if (key instanceof ValidToken) return key as KeyNode<true, TNoteContent>
		}
		return undefined
	}
	get firstKey(): KeyNode<boolean, TNoteContent> {
		return this.keys[0]
	}
	get firstValidKey(): Token<true, TOKEN_TYPE.KEY> | undefined {
		for (const key of this.keys) {
			if (key instanceof ValidToken) return key
		}
		return undefined
	}
	constructor({ keys, seps, start, end }: {
		keys: KeyNode<boolean, TNoteContent>[]
		seps: ComboNode<TValid>["seps"]
		start: number
		end: number
	}) {
		super(AST_TYPE.COMBO, start, end)
		this.keys = keys
		this.seps = seps

		// @ts-expect-error ignore readonly
		this.valid = (
			this.keys.every(key => key.valid) &&
			this.seps.every(token => token instanceof ValidToken)
		) as TValid
	}
	stringify(opts: Pick<FullParserOptions<any, any>, "separators" | "keyNote">): string {
		if (!this.valid) {
			throw new ShortcutsParserLibraryError(ERROR_CODES.INVALID_INSTANCE, {
				instance: this,
			}, "Only valid nodes can be stringified.")
		}
		return [...this.keys, ...this.seps]
			.sort((a, b) => a.start - b.start)
			.map(keyOrSep => keyOrSep.stringify(opts))
			.join("")
	}
}
