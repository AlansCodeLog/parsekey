/* eslint-disable prefer-rest-params */
import { blue, cyan, green, red, reset, yellow } from "@utils/colors"
import type { AddParameters } from "@utils/types"
import { isBlank, unreachable } from "@utils/utils"

import { extractTokens } from "./extractTokens"

import { ChainNode, ComboNode, ErrorToken, KeyNode, Token, ValidToken } from "@/ast/classes"
import { AnyToken, DebugColors, ParserResults, TOKEN_TYPE } from "@/types"


const defaultColors: DebugColors = {
	values: yellow,
	info: cyan,
	position: green,
	hint: blue,
	error: red,
	reset,
}
const disableColors: DebugColors = Object.fromEntries(Object.keys(defaultColors).map(key => [key, ""])) as DebugColors

const toRows = (rows: string[], opts: Required<NonNullable<Parameters<typeof prettyAst>[1]>>): string[] => {
	rows = rows.filter(child => child !== "")

	return [
		...rows.slice(0, rows.length - 1).map(child => `${opts.indent}${opts.children}${child}`),
		`${opts.indent}${opts.last}${rows[rows.length - 1]}`,
	]
}
/**
 * Returns a more compressed, color coded, string representation of the ast for debugging.
 *
 * There are options to change which symbols are used for tree and if the variables are surrounded by quotes (default false).
 *
 * Colors can changed by passing ansi codes (or whatever you want\*) to the third parameter. Or you can pass false instead of an object to disable them. Default colors are:
 * ```ts
 * {
 * 	values: // yellow,
 * 	position: // green,
 * 	info: // cyan,
 * 	hint: // blue,
 * 	error: // red,
 * 	reset: // ansi reset code
 * }
 * ```
 * \* For example, you could pass html tags to show this in the browser instead (this is how the demo works). This is why the reset color is exposed. For example, a color might be `<span class="error">` and reset can be `</span>`.
 */

export function prettyAst(
	ast: ParserResults | AnyToken | Token,
	{ indent = "   ", children = "├╴", last = "└╴", branch = "│", quote = "" }: Partial<Record<"indent" | "children" | "last" | "branch" | "quote", string>> = {},
	colors: Partial<DebugColors> | false = {},
): string {
	const opts = { indent, children, last, branch, quote }
	const c: DebugColors = colors ? { ...defaultColors, ...colors } : disableColors
	const pos = `${c.position}(${ast.start}, ${ast.end})${c.reset}`
	const _ = indent
	// accumulated indent
	const __: string = arguments[3] ?? ""
	let extra: string = arguments[4] ?? ""
	if (!isBlank(extra)) extra = ` ${c.hint}${extra}${c.reset}`
	// indent to add to children items
	const ___ = __ + _ + branch
	// indent to add to last child item
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const __L = __ + _ + indent[0]
	const prettyAst_ = prettyAst as any as AddParameters<typeof prettyAst, [
		typeof __,
		typeof extra,
	]>
	if (ast instanceof ValidToken) {
		const value = `${ast.value}`
		return `TOKEN ${pos} ${c.values}${quote}${value}${quote}${c.reset}${extra}`
	}
	if (ast instanceof ErrorToken) {
		const value = `[${ast.expected.join(", ")}]`
		return `ERROR ${pos} ${c.error}${value}${c.reset}${extra}`
	}
	if (ast instanceof ChainNode) {
		const header = `${c.hint}${ast.combos.length}${c.reset}`
		return [
			`CHAIN ${pos} ${header}${extra}`,
			...toRows(ast.combos.map((combo, i) =>
				prettyAst_(combo, opts, c, i === ast.combos.length - 1 ? __L : ___, "")), opts),
		].join(`\n${__}`)
	}
	if (ast instanceof ComboNode) {
		const header = `${c.hint}${ast.keys.length}${c.reset}`
		const parts = [...ast.keys, ...ast.seps].sort((a, b) => a.start - b.start)
		return [
			`COMBO ${pos} ${header}${extra}`,
			...toRows(parts.map((part, i) =>
				prettyAst_(part, opts, c, i === parts.length - 1 ? __L : ___, part instanceof Token ? getType(part.type) : "")), opts),
		].join(`\n${__}`)
	}
	if (ast instanceof KeyNode) {
		const header = `${c.hint}${ast.value.value ?? ""}${c.reset}`
		const tokens = extractTokens(ast)
		return [
			`KEY ${pos} ${header}${extra}`,
			...toRows(tokens.map((token, i) =>
				prettyAst_(token, opts, c, i === tokens.length - 1 ? __L : ___, getType(token.type))), opts),
		].join(`\n${__}`)
	}
	unreachable()
}

function getType(type: TOKEN_TYPE): string {
	switch (type) {
		case TOKEN_TYPE.KEY: return "(key)"
		case TOKEN_TYPE.SEPARATOR: return "(sep)"
		case TOKEN_TYPE.NOTE_CONTENT: return "(note)"
		case TOKEN_TYPE.NOTE_DELIM_LEFT: return "(note L)"
		case TOKEN_TYPE.NOTE_DELIM_RIGHT: return "(note R)"
		default: return ""
	}
}
