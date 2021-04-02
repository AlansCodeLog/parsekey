import { pos } from "@/ast/builders"
import { ErrorToken } from "@/ast/classes"
import type { Parser } from "@/parser"
import { ParserResults, Suggestion, SUGGESTION_TYPE, TOKEN_TYPE } from "@/types"
import { extractTokens, getCursorInfo, getSurroundingErrors } from "@/utils"


export class Autosuggest /* <T> */ {
	/**
	 * Returns a list of suggestions ( {@link Suggestion} ). These are not a list of autocomplete entries (with values), but more a list of entries describing possible suggestions. This list can then be passed to {@link Parser.autocomplete} to build a list to show users, from which you can then pick an entry to pass to {@link Parser.autoreplace} .
	 *
	 * The list returned is "unsorted", but there is still some logic to the order. Fixes for errors are suggested first, in the order returned by {@link getSurroundingErrors}. Regular suggestions come after.
	 */
	autosuggest(input: string, ast: ParserResults, index: number): Suggestion[] {
		// wrapped like this because the function is HUGE
		const opts = (this as any as Parser).options
		const tokens = extractTokens(ast)
		const token = getCursorInfo(input, tokens, index)

		const suggestions: Suggestion[] = []
		const errorSuggestion = {
			isError: true,
			cursorInfo: token,
			requiresSeparator: false,
			requiresDelimiters: false as any as false,
		}
		const baseSuggestion = {
			isError: false,
			cursorInfo: token,
			requiresSeparator: false,
			requiresDelimiters: false as any as false,
		}
		if (ast instanceof ErrorToken) {
			suggestions.push({
				...errorSuggestion,
				range: pos({ start: index }, { fill: true }),
				type: SUGGESTION_TYPE.KEY,
			})
		} else {
			const surroundingErrors = getSurroundingErrors(tokens, token).filter(error => error.start === index)

			const missingDelimLeft =
					token.next instanceof ErrorToken &&
					token.next.expected.includes(TOKEN_TYPE.NOTE_DELIM_LEFT)
			const missingDelimRight =
					token.next instanceof ErrorToken &&
					token.next.expected.includes(TOKEN_TYPE.NOTE_DELIM_RIGHT)
			// this reads weird, but it's correct since if both are missing, no note is ever parsed, no error tokens are ever produced
			const missingDelimBoth = !missingDelimLeft && !missingDelimRight &&
				token.next?.type !== TOKEN_TYPE.NOTE_DELIM_RIGHT &&
				token.prev?.type !== TOKEN_TYPE.NOTE_DELIM_LEFT

			const errorTypesHandled: TOKEN_TYPE[] = []
			for (const error of surroundingErrors) {
				for (const type of error.expected) {
					if (errorTypesHandled.includes(type)) continue
					errorTypesHandled.push(type)

					switch (type) {
						case TOKEN_TYPE.KEY:
						case TOKEN_TYPE.SEPARATOR:
						case TOKEN_TYPE.NOTE_DELIM_LEFT:
						{
							suggestions.push({
								...errorSuggestion,
								type: type as any as SUGGESTION_TYPE,
								range: pos({ start: index }, { fill: true }),
							})
							break
						}
						// key(note|
						// key(|
						case TOKEN_TYPE.NOTE_DELIM_RIGHT: {
							suggestions.push({
								...errorSuggestion,
								type: type as any as SUGGESTION_TYPE,
								range: pos({ start: index }, { fill: true }),
							})
							suggestions.push({
								...baseSuggestion,
								type: SUGGESTION_TYPE.NOTE_CONTENT,
								range: token.prev?.type === TOKEN_TYPE.NOTE_CONTENT
									? pos(token.prev)
									: pos({ start: index }, { fill: true }),
								requiresDelimiters: "right",
							})
							break
						}
						case TOKEN_TYPE.NOTE_CONTENT: {
							suggestions.push({
								...errorSuggestion,
								type: type as any as SUGGESTION_TYPE,
								range: pos(error),
								requiresDelimiters: missingDelimBoth
										? "both"
										: missingDelimRight
										? "right"
										: missingDelimLeft
										? "left"
										: false,
							})
							break
						}
					}
				}
			}

			if (token.at?.type === TOKEN_TYPE.KEY) {
				suggestions.push({
					...baseSuggestion,
					type: SUGGESTION_TYPE.KEY,
					range: pos(token.at),
				})
			}

			if (token.at?.type === TOKEN_TYPE.NOTE_CONTENT) {
				suggestions.push({
					...baseSuggestion,
					type: SUGGESTION_TYPE.NOTE_CONTENT,
					range: pos(token.at),
					// it would never be missing just the left in this case
					requiresDelimiters: missingDelimBoth ? "both" : missingDelimRight ? "right" : false,
				})
			}
			if (!token.at) {
				// key(note)|
				if (token.prev && token.prev.type === TOKEN_TYPE.NOTE_DELIM_RIGHT && !token.whitespace.prev) {
					suggestions.push({
						...baseSuggestion,
						type: SUGGESTION_TYPE.KEY,
						range: pos({ start: index }, { fill: true }),
						requiresSeparator: true,
					})
				} else if (
					// key|
					// key|+
					// key|(note)
					!token.whitespace.prev &&
					token.prev &&
					token.prev.type === TOKEN_TYPE.KEY
				) {
					suggestions.push({
						...baseSuggestion,
						type: SUGGESTION_TYPE.KEY,
						range: pos(token.prev),
					})
					// key| key
					// if we're at the end of a combo also suggest with separator so the next time the user triggers the autosuggest they'll be on a key error and more keys will be suggested
					if (token.whitespace.next) {
						suggestions.push({
							...baseSuggestion,
							type: SUGGESTION_TYPE.KEY,
							range: pos({ start: index }, { fill: true }),
							requiresSeparator: true,
						})
					}
					// key|) or key|
					if (opts.keyNote &&
						(!(token.next instanceof ErrorToken) || token.whitespace.next) &&
						token.next?.type !== TOKEN_TYPE.NOTE_DELIM_LEFT &&
						token.next?.type !== TOKEN_TYPE.NOTE_DELIM_RIGHT &&
						(missingDelimBoth || missingDelimLeft)
					) {
						suggestions.push({
							...baseSuggestion,
							type: SUGGESTION_TYPE.NOTE_CONTENT,
							range: pos({ start: index }, { fill: true }),
							requiresDelimiters: missingDelimLeft ? "left" : "both",
						})
					}
				} else if (
					// |key
					// key |key
					// key+|key
					// key(note)|key
					(!token.valid.prev || token.whitespace.prev || token.valid.prev.type === TOKEN_TYPE.SEPARATOR || token.valid.prev.type === TOKEN_TYPE.NOTE_DELIM_RIGHT) &&
					!token.whitespace.next && // not // key+| key (already handled by errors)
					token.next && token.next === token.valid.next &&
					token.next.type === TOKEN_TYPE.KEY
				) {
					suggestions.push({
						...baseSuggestion,
						type: SUGGESTION_TYPE.KEY,
						range: pos(token.next),
					})
				} else if (
					// key | key
					// | key
					// key |
					(token.whitespace.prev && token.whitespace.next) ||
					(!token.prev && token.whitespace.next) ||
					(!token.next && token.whitespace.prev) ||
					(!token.next && !token.prev) // should be unreachable because an error token exists and should have been handled
				) {
					suggestions.push({
						...baseSuggestion,
						type: SUGGESTION_TYPE.KEY,
						range: pos({ start: index }, { fill: true }),
					})
				} else if (
					opts.keyNote && (
						(
						// key(|note)
							token.next &&
							token.next === token.valid.next &&
							token.next?.type === TOKEN_TYPE.NOTE_CONTENT &&
							!missingDelimLeft
						) ||
						(
							// key(note|)
							token.prev &&
							token.prev === token.valid.prev &&
							token.prev?.type === TOKEN_TYPE.NOTE_CONTENT &&
							!missingDelimRight
						) ||
						(
						// key(|)
							token.prev &&
							token.prev === token.valid.prev &&
							token.prev.type === TOKEN_TYPE.NOTE_DELIM_LEFT &&
							token.next &&
							token.next === token.valid.next &&
							token.next.type === TOKEN_TYPE.NOTE_DELIM_RIGHT
						)
					)
				) {
					const range = token.next?.type === TOKEN_TYPE.NOTE_CONTENT
						? pos(token.next)
						: token.prev?.type === TOKEN_TYPE.NOTE_CONTENT
						? pos(token.prev)
						: pos({ start: index }, { fill: true })

					suggestions.push({
						...baseSuggestion,
						type: SUGGESTION_TYPE.NOTE_CONTENT,
						range,
					})
				}
			}
		}
		return suggestions
	}
}
