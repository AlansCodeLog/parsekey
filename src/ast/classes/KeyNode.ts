import type { ChainNode } from "./ChainNode"
import { ErrorToken } from "./ErrorToken"
import { Node } from "./Node"
import type { Token } from "./Token"
import { ValidToken } from "./ValidToken"

import { ShortcutsParserLibraryError } from "@/helpers"
import { AST_TYPE, ERROR_CODES, FullParserOptions, TOKEN_TYPE } from "@/types"


export class KeyNode<
	TValid extends boolean = boolean,
	TNoteContent extends Token = Token<boolean, TOKEN_TYPE.NOTE_CONTENT>,
> extends Node<AST_TYPE.KEY> {
	value: Token<boolean, TOKEN_TYPE.KEY>
	note: undefined | {
		left: Token<boolean, TOKEN_TYPE.NOTE_DELIM_LEFT | TOKEN_TYPE.NOTE_DELIM_RIGHT>
		right: Token<boolean, TOKEN_TYPE.NOTE_DELIM_LEFT | TOKEN_TYPE.NOTE_DELIM_RIGHT>
		content: TNoteContent
	}
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
	constructor({ value, note, start, end }: {
		value: KeyNode<TValid>["value"]
		note?: KeyNode<TValid>["note"]
		start: number
		end: number
	}) {
		super(AST_TYPE.KEY, start, end)
		this.value = value
		this.note = note as any
		// @ts-expect-error ignore readonly
		this.valid = (
			this.value instanceof ValidToken &&
			(!this.note ||
				(
					this.note.left instanceof ValidToken &&
					this.note.right instanceof ValidToken &&
					!(this.note.content instanceof ErrorToken)
				)
			)
		) as TValid
	}
	stringify(opts: Pick<FullParserOptions<any, any>, "separators" | "keyNote">): string {
		if (!this.valid) {
			throw new ShortcutsParserLibraryError(ERROR_CODES.INVALID_INSTANCE, {
				instance: this,
			}, "Only valid nodes can be stringified.")
		}
		const name = this.value.stringify(opts)
		return name + (
			this.note
				? this.note.left.stringify(opts) +
				(this.note.content).stringify(opts) +
				this.note.right.stringify(opts)
			: "")
	}
}
