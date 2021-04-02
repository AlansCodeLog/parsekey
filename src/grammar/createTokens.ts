/* eslint-disable camelcase */
import { escapeRegex } from "@utils/utils"
import { createToken, Lexer, TokenType } from "chevrotain"

import type { FullParserOptions } from "@/types"


/**
 * Makes it easier to rename the tokens while still returning a properly typed record of them.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
enum $T {
	_ = "WHITESPACE",
	KEY = "KEY",
	SEPARATOR = "SEPARTOR",
	NOTE_DELIM_START = "NOTE_DELIM_START",
	NOTE_DELIM_END = "NOTE_DELIM_END",
	NOTE_CONTENT = "NOTE_CONTENT",
	NOTE = "NOTE",
}

/** @internal */
export function createTokens<TValidationItem>(opts: FullParserOptions<TValidationItem>): {
	tokens: Record<$T, TokenType>
	lexer: Lexer
} {
	const $: Record<$T, TokenType> = {} as any
	const seps = opts.separators.map(sep => escapeRegex(sep)).join("")
	const startDelim = opts.keyNote ? escapeRegex(opts.keyNote.left) : undefined
	const endDelim = opts.keyNote ? escapeRegex(opts.keyNote.right) : undefined
	const delims = opts.keyNote ? `${startDelim!}${endDelim!}` : ""

	$[$T.NOTE] = createToken({
		name: $T.NOTE,
	})
	$[$T._] = createToken({
		name: $T._,
		pattern: /\s+/,
		line_breaks: true,
		push_mode: "main",
	})

	$[$T.KEY] = createToken({
		name: $T.KEY,
		push_mode: "main",
		pattern: new RegExp(`([^\\s\\\\${seps}${delims}]|\\\\.)+`),
	})


	$[$T.SEPARATOR] = createToken({
		name: $T.SEPARATOR,
		push_mode: "main",
		pattern: new RegExp(`[${seps}]`),
	})
	$[$T.NOTE_DELIM_START] = createToken({
		name: $T.NOTE_DELIM_START,
		categories: [$[$T.NOTE]],
		pattern: new RegExp(`${startDelim ?? "UNUSED"}`),
		push_mode: "delims",
	})
	$[$T.NOTE_DELIM_END] = createToken({
		name: $T.NOTE_DELIM_END,
		categories: [$[$T.NOTE]],
		pattern: new RegExp(`${endDelim ?? "UNUSED2"}`),
		push_mode: "main",
	})
	$[$T.NOTE_CONTENT] = createToken({
		name: $T.NOTE_CONTENT,
		line_breaks: true,
		categories: [$[$T.NOTE]],
		pattern: new RegExp(`([^${endDelim!}]|\\\\.)+`),
	})
	const lexerOptions = {
		modes: {
			main: [
				$[$T.SEPARATOR],
				$[$T._],
				$[$T.KEY],
				...(opts.keyNote ? [$[$T.NOTE_DELIM_START], $[$T.NOTE_DELIM_END]] : []),
			],
			...(opts.keyNote ? {
				delims: [
					$[$T.NOTE_CONTENT],
					$[$T.NOTE_DELIM_END],
					$[$T._],
					$[$T.SEPARATOR],
					$[$T.KEY],
				],
			} : {}),
		},
		defaultMode: "main",
	}

	const lexer = new Lexer(lexerOptions)
	return { tokens: $, lexer }
}

