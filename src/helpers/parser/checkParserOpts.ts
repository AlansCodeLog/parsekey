import type { Token } from "@/ast/classes"
import { ShortcutsParserLibraryError } from "@/helpers/errors"
import { ERROR_CODES, FullParserOptions } from "@/types"

/** @internal */
export function checkParserOpts<TValidationItem, TNoteContent extends Token>(opts: FullParserOptions<TValidationItem, TNoteContent>): void {
	if (opts.keyNote !== undefined) {
		if (opts.keyNote.right === opts.keyNote.left) {
			throw new ShortcutsParserLibraryError(
				ERROR_CODES.PARSER_CONFLICTING_OPTIONS_ERROR,
				{ prohibited: [opts.keyNote.left], invalid: opts.keyNote.right },
				`The left note delimiter "${opts.keyNote.left}" cannot equal the right note delimiter "${opts.keyNote.right}".`
			)
		}
		if (opts.keyNote.left.length > 1) {
			throw new ShortcutsParserLibraryError(
				ERROR_CODES.PARSER_CONFLICTING_OPTIONS_ERROR,
				{ prohibited: [], invalid: opts.keyNote.left },
				`The left note delimiter "${opts.keyNote.left}" can only be one character long, but it's ${opts.keyNote.left.length}.`
			)
		}
		if (opts.keyNote.right.length > 1) {
			throw new ShortcutsParserLibraryError(
				ERROR_CODES.PARSER_CONFLICTING_OPTIONS_ERROR,
				{ prohibited: [], invalid: opts.keyNote.right },
				`The right note delimiter "${opts.keyNote.right}" can only be one character long, but it's ${opts.keyNote.right.length}.`
			)
		}
		if (opts.keyNote.left === "") {
			throw new ShortcutsParserLibraryError(
				ERROR_CODES.PARSER_CONFLICTING_OPTIONS_ERROR,
				{ prohibited: [""], invalid: opts.keyNote.left },
				`The left note delimiter "${opts.keyNote.left}" cannot be blank.`
			)
		}
		if (opts.keyNote.right === "") {
			throw new ShortcutsParserLibraryError(
				ERROR_CODES.PARSER_CONFLICTING_OPTIONS_ERROR,
				{ prohibited: [""], invalid: opts.keyNote.right },
				`The right note delimiter "${opts.keyNote.right}" cannot be blank.`
			)
		}
		if (opts.separators.includes(opts.keyNote.left)) {
			throw new ShortcutsParserLibraryError(
				ERROR_CODES.PARSER_CONFLICTING_OPTIONS_ERROR,
				{ prohibited: opts.separators, invalid: opts.keyNote.left },
				`The left note delimiter "${opts.keyNote.left}" cannot also be a key separator.`
			)
		}
		if (opts.separators.includes(opts.keyNote.right)) {
			throw new ShortcutsParserLibraryError(
				ERROR_CODES.PARSER_CONFLICTING_OPTIONS_ERROR,
				{ prohibited: opts.separators, invalid: opts.keyNote.right },
				`The right note delimiter "${opts.keyNote.right}" cannot also be a key separator.`
			)
		}
	}
}

