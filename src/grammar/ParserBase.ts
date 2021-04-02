/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-namespace */
import { EmbeddedActionsParser, EOF, IToken, tokenMatcher } from "chevrotain"

import type { createTokens } from "./createTokens"

import { ChainNode, ComboNode, ErrorToken, KeyNode, Token } from "@/ast/classes"
import * as handle from "@/ast/handlers"
import { extractPosition } from "@/helpers/parser"
import { FullParserOptions, ParserResults, Position, TOKEN_TYPE } from "@/types"


function processToken<TDefined extends boolean = boolean>(token: IToken): [TDefined extends true ? string : string | undefined, Position] {
	let val: string | undefined = token.image
	if (token.isInsertedInRecovery) val = undefined
	return [val as any, extractPosition(token)]
}

/** @internal */
export class ParserBase<TValidationItem = any> extends EmbeddedActionsParser {
	rawInput!: string
	/** @internal */
	constructor(opts: FullParserOptions<TValidationItem>, t: ReturnType<typeof createTokens>["tokens"]) {
		super(t, {
			recoveryEnabled: true,
		})

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const $ = this

		$.RULE("main", () => {
			$.SUBRULE($.whitespace)
			const chain = $.SUBRULE($.chain)
			$.SUBRULE2($.whitespace)
			return $.ACTION(() => chain)
		})
		$.RULE("whitespace", () => { // extra leading/trailing whitespace
			$.OPTION({
				GATE: () => tokenMatcher($.LA(1), t.WHITESPACE),
				DEF: () => $.CONSUME(t.WHITESPACE),
			})
		})
		$.RULE("chain", () => {
			const combos: ReturnType<ParserBase["combo"]>[] = []
			$.MANY({
				DEF: () => {
					const combo = $.SUBRULE($.combo)
					if (combo) combos.push(combo as ComboNode)
					$.OPTION({
						GATE: () => !tokenMatcher($.LA(1), EOF),
						DEF: () => $.CONSUME(t.WHITESPACE),
					})
				},
			})
			return $.ACTION(() => handle.chain(combos))
		})
		$.RULE("combo", () => {
			const keys: KeyNode[] = []
			const seps: Token<boolean, TOKEN_TYPE.SEPARATOR>[] = []
			let last: string | undefined
			$.MANY({
				DEF: () => {
					const token = $.OR([
						{ ALT: () => $.SUBRULE($.key) },
						{ ALT: () => $.CONSUME2(t.SEPARTOR) },
					])
					$.ACTION(() => {
						if (token instanceof KeyNode) {
							const key = token
							if (last === "key") {
								seps.push(handle.token.sep(undefined, { start: key.start, end: key.start }))
							}
							keys.push(key)
							last = "key"
						} else if (token) {
							const sep = handle.token.sep(...processToken(token))
							if (!last || last === "sep") {
								keys.push(handle.key(handle.token.key(undefined, { start: sep.start, end: sep.start })))
							}
							seps.push(sep)
							last = "sep"
						}
					})
				},
			})
			return $.ACTION(() => {
				if (last === "sep") {
					const pos = seps[seps.length - 1]?.end ?? 0
					keys.push(handle.key(handle.token.key(undefined, { start: pos, end: pos })))
				}
				return (seps.length > 0 || keys.length > 0) ? handle.combo(keys, seps) : undefined
			})
		})
		$.RULE("key", () => {
			let val: any
			let value: any
			let note: ConstructorParameters<typeof KeyNode>[0]["note"] | undefined
			let left: any
			let right: any
			let content: any
			$.OR({
				DEF: [
					{
						GATE: () => tokenMatcher($.LA(1), t.KEY),
						ALT: () => {
							val = $.CONSUME(t.KEY)
							$.OPTION1(() => { left = $.CONSUME1(t.NOTE_DELIM_START) })
							$.OPTION2(() => { content = $.CONSUME2(t.NOTE_CONTENT) })
							$.OPTION3(() => { right = $.CONSUME3(t.NOTE_DELIM_END) })
						},
					},
					{
						GATE: () => opts.keyNote && !tokenMatcher($.LA(1), t.KEY),
						ALT: () => {
							left = $.CONSUME4(t.NOTE_DELIM_START)
							$.OPTION4(() => { content = $.CONSUME5(t.NOTE_CONTENT) })
							$.OPTION5(() => { right = $.CONSUME6(t.NOTE_DELIM_END) })
						},
					},
					{
						GATE: () => opts.keyNote && !tokenMatcher($.LA(1), t.KEY),
						ALT: () => {
							right = $.CONSUME7(t.NOTE_DELIM_END)
						},
					},
				],
			})

			return $.ACTION(() => {
				if (left || right || content) note = {} as any
				if (val) value = handle.token.key(...processToken(val))
				if (left) note!.left = handle.token.delimL(...processToken(left))
				if (content) note!.content = handle.token.note(...processToken(content))
				if (right) note!.right = handle.token.delimR(...processToken(right))
				if (note && note.content === undefined) {
					if (note.left || note.right) {
						const start = note.left?.end ?? value?.end ?? note.right?.start
						const end = note.right?.start ?? note.left?.end
						note.content = new ErrorToken({ expected: [TOKEN_TYPE.NOTE_CONTENT], start, end })
					}
				}
				if (opts.keyNote?.parser && note) {
					note.content = opts.keyNote.parser(note.content) as any
				}
				return handle.key(value, note)
			})
		})
		this.performSelfAnalysis()
	}
}
// it is used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ParserBase<TValidationItem = any, TNoteContent extends Token = Token<boolean, TOKEN_TYPE.NOTE_CONTENT>> {
	main: () => ParserResults
	whitespace: () => void
	chain: () => ChainNode<boolean, TNoteContent>
	combo: () => ComboNode<boolean, TNoteContent>
	key: () => KeyNode<boolean, TNoteContent>
}
