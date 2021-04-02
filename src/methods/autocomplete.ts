import type { Parser } from "@/parser"
import { Completion, Suggestion, SUGGESTION_TYPE } from "@/types"


export class AutocompleteMixin<T> {
	/**
	 * Given a list of {@link Suggestion} entries, and a list of keys and the preferred separator to use, returns a list of {@link Completion} entries.
	 *
	 * It takes care of escaping for keys if needed, but not note contents since a custom consume function can be defined and we would not know what to escape.
	 */
	autocomplete(
		suggestions: Suggestion[],
		{
			keys = [],
			separator = "+",
			notes = [],
		}: Partial<Record<"keys", string[]>> & {
			separator?: string
			notes?: string[]
		} = {}
	): Completion[] {
		const self = (this as any as Parser<T>)
		const opts = self.options
		return suggestions.map(suggestion => {
			const type = suggestion.type
			const delimRight = ["both", "right"].includes(suggestion.requiresDelimiters as string)
				? opts.keyNote.right
				: ""
			const delimLeft = ["both", "left"].includes(suggestion.requiresDelimiters as string)
				? opts.keyNote.left
				: ""

			switch (type) {
				case SUGGESTION_TYPE.KEY: {
					return keys.map(key => {
						const rawValue = key
						let isEscaped = false
						for (let i = 0; i < key.length; i++) {
							const char = key[i]
							if (char === "\\") {
								if (isEscaped) isEscaped = false
								else isEscaped = true
							} else if (self.options.separators.includes(char) && !isEscaped) {
								key = `${key.slice(0, i)}\\${key.slice(i, key.length)}`
								i++
							}
						}
						return {
							suggestion,
							value: (suggestion.requiresSeparator ? separator : "") + key,
							rawValue,
						}
					})
				}
				case SUGGESTION_TYPE.SEPARATOR: {
					return [{
						suggestion,
						value: separator,
						rawValue: separator,
					}]
				}
				case SUGGESTION_TYPE.NOTE_CONTENT: {
					return notes.map(content => ({
						suggestion,
						value: delimLeft + content + delimRight,
						rawValue: content,
					}))
				}
				case SUGGESTION_TYPE.NOTE_DELIM_LEFT: {
					return [{
						suggestion,
						value: opts.keyNote.left,
						rawValue: opts.keyNote.left,
					}]
				}
				case SUGGESTION_TYPE.NOTE_DELIM_RIGHT: {
					return [{
						suggestion,
						value: opts.keyNote.right,
						rawValue: opts.keyNote.right,
					}]
				}
			}
		}).flat()
	}
}
