import type { Position } from "./ast"

import type { Token, ValidToken } from "@/ast/classes"


/**
 * Contains information regarding the tokens around a cursor position. Mostly for internally use by {@link autosuggest} .
 *
 * Notes:
 *
 * - There are no whitespace tokens because whitespace is not tokenized. `prev`, `at`, `next` properties that contain tokens are set looking only at the list of tokens extracted from the ast by {@link extractTokens}. This is why there is an extra `whitespace` property to tell us whether there is whitespace (i.e. a hole) between the cursor and the next/prev **valid** tokens or if it can't find any, the start/end of the input.
 * - If next/prev are invalid tokens, note that there are cases where more invalid tokens might follow them. To get them we can use {@link getSurroundingErrors} or we can just find their index in the tokens list and go forward/backward as needed:
 * ```ts
 * let i =  tokens.findIndex(t => t === info.next)
 * while (tokens[i] instanceof ErrorToken) {...}
 * ```
 *
 * Examples:
 *
 * ```js
 * Ctrl+| A // tokens: ["Ctrl", "+", TokenError(Key), "A"]
 *     ^
 * {
 * 	index: 5, // cursor position
 * 	at: undefined, // it's not inside a token
 * 	prev: "+",
 * 	next: TokenError, // key is missing to the right
 * 	// closest valid tokens to either side
 * 	valid: {
 * 		prev: "+",
 * 		next: "A",
 * 	},
 * 	// whether there is whitespace between the cursor and the next/prev valid tokens or start/end of input
 * 	whitespace: {
 * 		prev: false,
 * 		next: true,
 * 	}
 * }
 * ```
 * ```js
 * Ctrl+Sh|ift+A
 *        ^
 * {
 * 	index: 7,
 * 	at: "Shift", // it's inside a token
 * 	prev: "+",
 * 	next: "+",
 * 	valid: {
 * 		prev: "+",
 * 		next: "-",
 * 	},
 * 	whitespace: {
 * 		prev: false,
 * 		next: false,
 * 	}
 * }
 * ```
 */
export type CursorInfo = {
	index: number
	/**
	 * The token the cursor is inside of. By "inside", we mean the ends of the token are before/after the cursor respectively (e.g. `a|a`, but NOT `|aa` or `aa|`). This token, if defined, is always a valid token, since error tokens have no length.
	 */
	at?: ValidToken
	/** The first token, valid or invalid, that starts at or after the index position. */
	next?: Token
	/** The first token (going backwards), valid or invalid, that ends at or before the index position. */
	prev?: Token
	/** Closest valid tokens. */
	valid: {
		/** Closest prev valid token. */
		next?: ValidToken
		/** Closest next valid token. */
		prev?: ValidToken
	}
	/** Whether there is whitespace between the cursor and the next/prev valid tokens or start/end of the input. */
	whitespace: {
		/** Whether there is whitespace between the cursor and the next valid token or the end of the input. */
		next: boolean
		/** Whether there is whitespace between the cursor and the prev valid token or the start of the input. */
		prev: boolean
	}
}

export enum SUGGESTION_TYPE {
	KEY = "KEY",
	SEPARATOR = "SEPARATOR",
	NOTE_CONTENT = "NOTE_CONTENT",
	NOTE_DELIM_LEFT = "NOTE_DELIM_LEFT",
	NOTE_DELIM_RIGHT = "NOTE_DELIM_RIGHT",
}

/**
 * A suggestion entry that describes a type of suggestion.
 */
export type Suggestion = {
	type: SUGGESTION_TYPE
	/** The range the suggestion should replace / be inserted at. */
	range: Position
	/** {@link CursorInfo} */
	cursorInfo: CursorInfo
	/**
	 * Whether the suggestion was created because there was an error token there and it would fix it.
	 */
	isError: boolean
	/**
	 * Whether the suggestion would require a separator be inserted immediately before.
	 *
	 * For example, if a cursor is here `Ctrl|`, suggestions both to replace the `Ctrl` key and to insert a key would be provided, but the insert would require a separator. i.e. `Replaced|` vs `Ctrl+Insert`
	 */
	requiresSeparator: boolean
	/**
	 * When key notes are enabled, whether the suggestion would require inserting the delimiters and which ones.
	 *
	 * Examples:
	 *
	 * `key|` require inserting both delimiters.
	 *
	 * `key|)` requires inserting the left delimiter.
	 */
	requiresDelimiters: "both" | "left" | "right" | false
}


export type Completion = {
	suggestion: Suggestion
	value: string
	rawValue: string
}
