import { insert } from "@utils/utils"

import type { Completion } from "@/types"


export class AutoreplaceMixin {
	/**
	 * Given the input string and a {@link Completion} consisting of the value of the replacement and a {@link Suggestion} entry, returns the replacement string and the new position of the cursor.
	 *
	 * The value passed should be escaped if it's needed. {@link autocomplete} already takes care of this if you're using it.
	 */
	autoreplace(
		input: string,
		{ value, suggestion }: Completion
	): { replacement: string, cursor: number } {
		const replacement = insert(value, input, [suggestion.range.start, suggestion.range.end])
		let cursor = suggestion.range.start + value.length
		if (["both", "right"].includes(suggestion.requiresDelimiters as string)) {
			cursor--
		}
		return { replacement, cursor }
	}
}
