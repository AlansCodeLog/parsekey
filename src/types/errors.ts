import type { DeepPartial } from "@utils/types"
import type { ILexingError, IRecognitionException, IToken } from "chevrotain"

import type { ParserOptions } from "./parser"

import type { Node, Token } from "@/ast/classes"


// TODO
export enum ERROR_CODES {
	"PARSER_ERROR" = "PARSER.ERROR",
	"PARSER_POSITION_ERROR" = "PARSER.POSITION",
	"PARSER_CONFLICTING_OPTIONS_ERROR" = "PARSER.OPTIONS.CONFLICTING",
	"INVALID_INSTANCE" = "PARSER.INVALID_INSTANCE",
}
export type ErrorInfo<T extends keyof ErrorInfos> = ErrorInfos[T]
export type ErrorInfos = {
	[ERROR_CODES.PARSER_ERROR]: {
		input: string
		options: DeepPartial<ParserOptions<any, any>> | undefined
		// eslint-disable-next-line @typescript-eslint/naming-convention
		"parsed options": ParserOptions<any, any>
		error: Error
		// eslint-disable-next-line @typescript-eslint/naming-convention
		"lexer errors": ILexingError[]
		// eslint-disable-next-line @typescript-eslint/naming-convention
		"lexed tokens": IToken[]
		// eslint-disable-next-line @typescript-eslint/naming-convention
		"parser errors": IRecognitionException[]
	}
	[ERROR_CODES.PARSER_POSITION_ERROR]: {
		start?: number
		end?: number
	}
	[ERROR_CODES.PARSER_CONFLICTING_OPTIONS_ERROR]: {
		prohibited: string[]
		invalid: string
	}
	[ERROR_CODES.INVALID_INSTANCE]: {
		instance: (Node | Token)
	}
}
