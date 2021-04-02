import type { ChainNode, ComboNode, ErrorToken, KeyNode, ValidToken } from "@/ast/classes"


export enum TOKEN_TYPE {
	KEY = "KEY",
	SEPARATOR = "SEPARATOR",
	NOTE_DELIM_RIGHT = "NOTE_DELIM_RIGHT",
	NOTE_DELIM_LEFT = "NOTE_DELIM_LEFT",
	NOTE_CONTENT = "NOTE_CONTENT",
}

/**
 * @internal
 * Note if the negation operator, `!`, is used as a propertyOperator, this will return the wrong type.
 */
export type ExtractTokenType<T extends string> =
	T extends "+"
	? TOKEN_TYPE.SEPARATOR
	: T extends "-"
	? TOKEN_TYPE.SEPARATOR
	: TOKEN_TYPE.KEY

// export type EmptyObj = Record<"start"|"end", undefined>
export type EmptyObj = Record<any, never>
export type FirstConstructorParam<T extends new (...args: any) => any> = ConstructorParameters<T>["0"]

export type Position = {
	start: number
	end: number
}

export enum AST_TYPE {
	CHAIN = "CHAIN",
	COMBO = "COMBO",
	KEY = "KEY",
}

// #region AST nodes

/**
 * For more easily typing tokens that might or might not be valid.
 *
 * Using {@link Token} does not work well in certain situations and is also more complex because it has so many generics.
 */
export type AnyToken<
	TType extends TOKEN_TYPE = TOKEN_TYPE,
> =
	| ValidToken<TType>
	| ErrorToken<TType>

export type Nodes = ChainNode | ComboNode | KeyNode

export type ParserResults = Nodes | ErrorToken<TOKEN_TYPE.KEY>

