/**
 * The parser's methods are often long and have a lot of documentation per method, so it's methods have been split into mixins. They can be found in the `./methods` folder.
 *
 * Writing from within any of these methods is like writing a method from here except:
 * - `this` calls are wrapped in `(this as any as Parser<T>)`
 * - private method/property access requires `// @ts-expect-error`.
 * - recursion with hidden parameters requires re-typing this (see evaluate/validate for examples) since otherwise if we only retyped the function it would become unbound from `this`.
 *
 * Docs work like normal (on methods). From the outside, users of the library cannot even tell the class is composed of mixins.
 */

import type { Mixin } from "@utils/types"
import { isWhitespace, mixin } from "@utils/utils"
import { createSyntaxDiagramsCode, ILexingResult, Lexer } from "chevrotain"

import type { Token } from "./ast/classes"
import { ShortcutsParserLibraryError } from "./helpers"
import { parseParserOptions, seal } from "./helpers/parser"
import { checkParserOpts } from "./helpers/parser/checkParserOpts"
import { AutocompleteMixin, AutoreplaceMixin, Autosuggest, ValidateMixin } from "./methods"
import { ERROR_CODES, FullParserOptions, ParserOptions, ParserResults, TOKEN_TYPE } from "./types"

import { token as tokenHandler } from "@/ast/handlers"
import { createTokens, ParserBase } from "@/grammar"


/**
 * Creates the main parser class which handles all functionality (evaluation, validation, etc).
 */
export class Parser<TValidationItem = {}, TNoteContent extends Token = Token<boolean, TOKEN_TYPE.NOTE_CONTENT>> {
	options: FullParserOptions<TValidationItem, TNoteContent>
	private readonly rawOptions: ParserOptions<TValidationItem, TNoteContent>
	parser: ParserBase<TValidationItem, TNoteContent>
	private readonly lexer: Lexer
	private readonly tokens: ReturnType<typeof createTokens>["tokens"]
	constructor(options?: ParserOptions<TValidationItem, TNoteContent>) {
		this.rawOptions = options ?? {}
		const opts = parseParserOptions(this.rawOptions)
		checkParserOpts<TValidationItem, TNoteContent>(opts)
		this.options = opts
		const { lexer, tokens } = createTokens(opts)
		this.lexer = lexer
		this.tokens = tokens
		this.parser = new ParserBase(opts, this.tokens)
	}
	/**
	 * Parses a string.
	 */
	parse(input: string): ParserResults {
		if (isWhitespace(input)) {
			return tokenHandler.key(undefined, { start: 0, end: 0 }) as any
		}

		const lexed = this._lex(input)

		this.parser.input = lexed.tokens

		this.parser.rawInput = input

		/**
		 * The parser can't handle unmatched right parens (i.e. left is missing) so we just insert them and shift the locations of all the tokens. Then the parser is designed to ignore parenthesis we added at the start and just return undefined for that rule as if the parenthesis didn't exist.
		 */
		try {
			if (lexed.errors.length > 0) throw new Error("Unexpected Lexer Errors")
			this.parser.input = lexed.tokens

			const res = this.parser.main()
			if (res === undefined) { throw new Error("throw") }
			// hidden param
			// eslint-disable-next-line prefer-rest-params
			if (!arguments[1]?.unsealed) seal(res)
			return res
		} catch (error: unknown) {
			// eslint-disable-next-line no-ex-assign
			if ((error as Error).message === "throw") error = undefined
			const err = new ShortcutsParserLibraryError(ERROR_CODES.PARSER_ERROR, {
				input,
				options: this.rawOptions,
				"parsed options": this.options,
				error: error as Error,
				"lexed tokens": lexed.tokens,
				"lexer errors": lexed.errors,
				"parser errors": this.parser.errors,
			})

			throw err
		}
	}
	// // needed for evaluate and validate so they are only checked on demand
	// private evaluationOptionsChecked: boolean = false
	// // eslint-disable-next-line @typescript-eslint/naming-convention
	// _checkEvaluationOptions(): void {
	// 	if (this.evaluationOptionsChecked) {
	// 		checkParserOpts(this.options, true)
	// 		this.evaluationOptionsChecked = true
	// 	}
	// }
	/**
	 * Generates a railroad diagram for debugging. Does not 100% represent how things are actually handled internally.
	 *
	 * Not exposed because it uses the raw chevrotain tokens.
	 *
	 * **Note: It is not 100% accurate. Some special cases are parsed one way but handled internally differently.**
	 */
	private _generateRailRoadDiagram(): string {
		const serialized = this.parser.getSerializedGastProductions()
		const html = createSyntaxDiagramsCode(serialized)
		return html
	}
	/**
	 * For debugging.
	 * Not exposed because it returns the raw chevrotain tokens.
	 */
	private _lex(input: string): ILexingResult {
		return this.lexer.tokenize(input)
	}
}

export interface Parser<TValidationItem = {}> extends Mixin<
	| AutocompleteMixin<TValidationItem>
	| AutoreplaceMixin
	| Autosuggest
	| ValidateMixin<TValidationItem>
>,
	AutocompleteMixin <TValidationItem>,
	AutoreplaceMixin,
	Autosuggest,
	ValidateMixin<TValidationItem>
{}

mixin(Parser, [
	AutocompleteMixin,
	AutoreplaceMixin,
	Autosuggest,
	ValidateMixin,
])
// export const Parser = Parser
