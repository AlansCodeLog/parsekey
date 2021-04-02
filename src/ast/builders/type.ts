import { ExtractTokenType, TOKEN_TYPE } from "@/types"

/**
 * Given a the string value of an operator or single delimiter token, returns the corresponding {@link ValidToken_TYPE} .
 */

export function type<T extends string>(
	operatorSymbol: T
): ExtractTokenType<T> {
	switch (operatorSymbol) {
		case "+": return TOKEN_TYPE.SEPARATOR as any
		case `-`: return TOKEN_TYPE.SEPARATOR as any
		default:
			return TOKEN_TYPE.KEY as any
	}
}

