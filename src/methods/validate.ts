import type { AddParameters } from "@utils/types"

import { ChainNode, ComboNode, KeyNode, Token } from "@/ast/classes"
import type { Parser } from "@/parser"
import type { ParserResults, Position } from "@/types"


export class ValidateMixin<T> {
	/**
	 * Allows pre-validating ASTs for syntax highlighting purposes.
	 *
	 * Works similar to evaluate. Internally it will use the tokenValidator option.
	 */
	validate(ast: ParserResults | Token): (Position & T)[] {
		const self = (this as any as Parser<T>)
		const opts = self.options
		if (!opts.tokenValidator) {
			throw new Error("keyValidator option must be specified when creating parser instance to be able to use the validate method.")
		}

		/** Handle hidden recursive version of the function. */
		// eslint-disable-next-line prefer-rest-params
		const results: (Position & T)[] = arguments[1] ?? []
		const self_ = this as any as ValidateMixin<T> & { validate: AddParameters<ValidateMixin<T>["validate"], [typeof results]> }

		if (ast instanceof ChainNode) {
			for (const combo of ast.combos) {
				self_.validate(combo, results)
			}
		}
		if (ast instanceof ComboNode) {
			const parts = [...ast.keys, ...ast.seps].sort((a, b) => a.start - b.start)
			for (const key of parts) {
				self_.validate(key, results)
			}
		}
		if (ast instanceof KeyNode) {
			const tokens: Token[] = [ast.value, ...(ast.note ? [ast.note.left, ast.note.content, ast.note.right] : [])]
			for (const token of tokens) {
				self_.validate(token, results)
			}
		}
		if (ast instanceof Token) {
			const res = opts.tokenValidator(ast)
			if (res) {for (const entry of res) results.push(entry)}
		}
		return results
	}
}
