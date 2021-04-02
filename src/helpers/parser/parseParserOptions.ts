import type { Token } from "@/ast/classes"
import type { FullParserOptions, KeyNoteOptions, ParserOptions } from "@/types/parser"


const defaultKeyNote: Omit<KeyNoteOptions<any>, "consume" | "parser"> = {
	left: "(",
	right: ")",
}
/** @internal */
export function parseParserOptions<TValidationItem, TNoteContent extends Token>(
	options: ParserOptions<TValidationItem, TNoteContent>
): FullParserOptions<TValidationItem, TNoteContent> {
	const opts: ParserOptions<TValidationItem, TNoteContent> = {
		separators: ["+", "-"],
		...options,
		keyNote: options.keyNote === true
			? { ...defaultKeyNote }
			: options.keyNote
			? {
				...defaultKeyNote,
				...options.keyNote,
			}
			: undefined,
	}

	return opts as any
}
