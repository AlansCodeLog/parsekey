import { ChainNode, ComboNode, KeyNode, Token } from "@/ast/classes"
import type { Nodes } from "@/types"

/** @internal */
export function assignParents(instance: Nodes): void {
	if (instance instanceof ChainNode) {
		for (const combo of instance.combos) {
			combo.parent = instance
			assignParents(combo)
		}
	}
	if (instance instanceof ComboNode) {
		for (const key of instance.keys) {
			assignParents(key)
		}
		for (const sep of instance.seps) {
			sep.parent = instance
		}
	}
	if (instance instanceof KeyNode) {
		instance.value.parent = instance
		if (instance.note) {
			if (instance.note.left) instance.note.left.parent = instance
			if (instance.note.right) instance.note.right.parent = instance
			// only assign parent if we can
			if (instance.note.content instanceof Token) instance.note.content.parent = instance
		}
	}
}
