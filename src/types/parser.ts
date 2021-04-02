import type { MakeRequired } from "@utils/types"

import type { Position, TOKEN_TYPE } from "./ast"

import type { Token } from "@/ast/classes"


export type KeyNoteOptions<TNoteContent> = {
	left: string
	right: string
	parser: (input: Token<boolean, TOKEN_TYPE.NOTE_CONTENT>) => TNoteContent
}

export type FullParserOptions<TValidationItem, TNoteContent extends Token = Token> = MakeRequired<
	ParserOptions<TValidationItem, TNoteContent>,
	// makes required all except:
	Exclude<keyof ParserOptions<TValidationItem, TNoteContent>,
		""
	>
>
& {
	keyNote?: KeyNoteOptions<TNoteContent>
	// overrides
}

export type ParserOptions<TValidationItem = {}, TNoteContent extends Token = Token> = {
	/**
	 * A list of allowed key separators (`["+", "-"]` by default.)
	 *
	 * They can be escaped to be used as part of a key by escaping them (e.g. `key\+` means a key with the name `key+`).
	 *
	 * The first separator is used to stringify the separator token (e.g. given `separators = ["+", "-"]` and input like `key+key-key`, it will get stringified like `key+key+key`).
	 */
	separators?: string[]
	/**
	 * Keys can have "notes" attached which are stored in a key's note property. To enable them, you can just pass `true` or `{}`. Options are merged over the default `{ left: "(", right: ")", space: true }` will be used.
	 *
	 * They are useful for specifying things like holds, toggle states, multiple clicks or whatever other extra states you can think of: `Capslock(on)`, `Capslock(off)`, `SomeKey(Hold:5000)` (hold for 5 seconds), `RButton(2:200)` (2 clicks within 200ms).
	 *
	 * Note the lack of a space between the key and the start delimiter. `Capslock (on)` would NOT be parsed like you might expect, but like `[KEY] [MISSING KEY][...NOTE]` because a space always starts a new chain combo/chord.
	 *
	 * You can parse the note contents to something else by passing a parser function. You can additional properties to valid tokens by extending the {@link ValidToken} and {@link ErrorToken} classes respectively.
	 * ```ts
	 * class NoteToken extends ValidToken<TOKEN_TYPE.NOTE_CONTENT> {
	 * 	constructor(
	 * 		// for ValidToken
	 * 		token: { type: TOKEN_TYPE.NOTE_CONTENT, value: string, start: number, end: number }
	 * 		// extra properties you might want to add
	 * 		{ noteType, state }: { noteType: "toggle"|"hold", state: number }
	 * 	) {
	 * 		super(token)
	 * 		this.noteType = noteType
	 * 		this.state = state
	 * 	}
	 * 	// optionally also specify a custom stringify function (this does not need to escape any characters but the right delimiter, even though more options than that are passed)
	 * 	stringify(opts) {
	 * 		//...
	 * 	}
	 * }
	 * const parser = new Parser<{}, NoteToken | ErrorToken<TOKEN_TYPE.NOTE_CONTENT>>({
	 * 	keyNote: {
	 * 		left:"(", right:")",
	 * 		parser(token) {
	 * 			if (token instanceof ValidToken) {
	 * 				let match
	 * 				const input = token.value.toLowercase()
	 * 				if (match = input.match(/toggle:(?<type>on|off)/i)) {
	 * 					return new NoteToken(token, {noteType: "toggle", state: match.groups.type === "on" ? 1 : 0})
	 * 				} else if (match = input.match(/hold:(?<amount>[0-9]+)/)) {
	 * 					return new NoteToken(token, {noteType: "hold", state: parseInt(match.groups.amount)})
	 * 				}
	 * 				return new ErrorToken({start, end, expected: [TOKEN_TYPE.NOTE_CONTENT]})
	 * 				} else {
	 * 				return token
	 * 			}
	 * 		}
	 * 	}
	 * })
	 * // ... later when accessing some key:
	 * key.note.contents.noteType // hold | toggle
	 * key.note.contents.state // number
	 * key.note.contents.parent // key
	 * ```
	 */
	keyNote?: Partial<KeyNoteOptions<TNoteContent>> | true
	/**
	 * For validating the ast before it's evaluated using {@link Parser.validate} (e.g. for syntax highlighting purposes). For the moment the ast must be valid (without syntax errors) to be validated.
	 *
	 * The function is passed a {@link Token} and should return any positions of interest. These are collected and are returned as the result of the validate method. Basically it makes it easy to "tag" ranges. You're not restricted to returning just the position and you can use the generic argument to type additional properties you might return.
	 * ```ts
	 * const allowedKeys = ["a", "b", "c"]
	 * // ...
	 * tokenValidator(token) {
	 * 	let res = []
	 * 	if (token instanceof ErrorToken) {
	 * 		res.push({start:token.start, end:token.end, type: "MISSING " + (token.type === TOKEN_TYPE.KEY ? "KEY" : "SEPARATOR")})
	 * 	}
	 * 	if (token.type === TOKEN_TYPE.KEY) {
	 * 		if (!allowedKeys.includes(token.value)) {
	 * 			res.push({start:token.start, end:token.end, type: "INVALID_KEY"})
	 * 		}
	 * 	}
	 * 	if (token.note) {
	 * 		// validate token notes
	 * 	}
	 * 	// more complicated things:
	 * 	if (token.parent.lastKey === token) {// if is last key
	 *			// check key is not modifier
	 * 	}
	 * }
	 * // later
	 * const errors => parser.validate(ast)
	 * // ... use the information to highlight those locations accordingly
	 * ```
	 */
	tokenValidator?: TokenValidator<TValidationItem>

}

export type TokenValidator<T> = (token: Token) => (Position & T)[] | undefined | void

