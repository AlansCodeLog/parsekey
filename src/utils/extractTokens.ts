import { unreachable } from "@utils/utils"

import { ChainNode, ComboNode, KeyNode, Node, Token } from "@/ast/classes"
import type { AST_TYPE } from "@/types"


/**
 * Extract a list of all the tokens (which might or might not be valid).
 */
export function extractTokens(ast: Node<AST_TYPE> | Token): Token<boolean>[] {
	if (ast instanceof ChainNode) {
		return ast.combos.map(combo => extractTokens(combo)).flat()
	}
	if (ast instanceof ComboNode) {
		const keys = ast.keys.map(key => extractTokens(key)).flat()
		return [...keys, ...ast.seps].sort((a, b) => a.start - b.start)
	}
	if (ast instanceof KeyNode) {
		return [ast.value, ...(ast.note ? [ast.note.left, ast.note.content, ast.note.right].filter(token => token !== undefined) : [])]
	}
	if (ast instanceof Token) { return [ast] }
	unreachable()
}
