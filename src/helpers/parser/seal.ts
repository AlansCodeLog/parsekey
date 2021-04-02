import { assignParents } from "./assignParents"

import { Node } from "@/ast/classes"
import type { AnyToken, Nodes } from "@/types"


/**
 * set and "seals" all parent properties
 *
 * @internal
 */
export function seal(instance: Nodes | AnyToken): void {
	if (instance instanceof Node) assignParents(instance)
	instance.parent = undefined
}
