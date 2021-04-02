import { testName } from "@utils/testing"
import type { DeepPartial } from "@utils/types"

import { expect } from "./chai"

import type { ChainNode, ValidToken } from "@/ast/classes"
import { Parser } from "@/parser"
import { CursorInfo, Position, Suggestion, SUGGESTION_TYPE } from "@/types"
import { getCursorInfo } from "@/utils"


const emptyCursor: Omit<CursorInfo, "index"> = Object.freeze({
	at: undefined,
	next: undefined,
	prev: undefined,
	valid: {
		next: undefined,
		prev: undefined,
	},
	whitespace: {
		prev: false,
		next: false,
	},
})

function createCursor(cursor: DeepPartial<CursorInfo>): CursorInfo {
	const res = {
		...emptyCursor,
		...cursor,
		valid: {
			...emptyCursor.valid,
			...cursor.valid,
		},
		whitespace: {
			...emptyCursor.whitespace,
			...cursor.whitespace,
		},
	}
	if (res.index === undefined) throw new Error("missing cursor index")
	return res as unknown as CursorInfo
}
/** Remove the cursorInfo from the suggestions list. It is always the same for all entries and it is checked separately for 99% of tests anyways. */
const simplify = (suggestions: Suggestion[]): Omit<Suggestion, "cursorInfo">[] => suggestions.map(suggestion => {
	const clone = { ...suggestion }
	// @ts-expect-error we need to actually delete the key, not just set it undefined
	delete clone.cursorInfo
	return clone
})
const suggest = (
	type: SUGGESTION_TYPE | string,
	range: Position,
	requiresSeparator: Suggestion["requiresSeparator"] = false,
	requiresDelimiters: Suggestion["requiresDelimiters"] = false
): Omit<Suggestion, "cursorInfo"> => ({
	type: (type.includes("ERROR.") ? type.replace("ERROR.", "") : type) as SUGGESTION_TYPE,
	range: { start: range.start, end: range.end },
	requiresSeparator,
	requiresDelimiters,
	isError: !!type.includes("ERROR."),
})
const contents = ["content"]
const completionOpts: Parameters<Parser["autocomplete"]>[1] = {
	keys: ["key", "keyRequiresEscape+"],
	notes: contents,
}

const keys = ["key", "keyRequiresEscape\\+"]
const genExpectedKeyValues = (suggestion: Suggestion) => keys.map((value, i) => ({ suggestion, value: (suggestion.requiresSeparator ? "+" : "") + value, rawValue: completionOpts.keys![i] }))

const genExpectedContentValues = (suggestion: Suggestion) => contents.map(value => ({
	suggestion,
	value: (["both", "left"].includes(suggestion.requiresDelimiters as string) ? "(" : "") +
		value +
		(["both", "right"].includes(suggestion.requiresDelimiters as string) ? ")" : ""),
	rawValue: value,
}))
describe(testName(), () => {
	describe(" ctrl1+key1 ctrl2+ +key2 ctrl3 + ", () => {
		it("| ctrl1+key1 ctrl2+ +key2 ctrl3 + ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 0
			const parser = new Parser()
			const ast = parser.parse(input)
			const info = getCursorInfo(input, ast, index)
			const expected = createCursor({
				index,
				next: (ast as ChainNode).combos[0].keys[0].value,
				valid: {
					next: (ast as ChainNode).combos[0].keys[0].value as ValidToken,
				},
				whitespace: { prev: false, next: true },
			})
			expect(info).to.deep.equal(expected)


			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, { start: index, end: index }),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: `${key} ctrl1+key1 ctrl2+ +key2 ctrl3 + `,
						cursor: `${key}| ctrl1+key1 ctrl2+ +key2 ctrl3 + `.lastIndexOf("|"),
					})),
				])
		})
		it(" |ctrl1+key1 ctrl2+ +key2 ctrl3 + ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 1
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, (ast as ChainNode).combos[0].keys[0]),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ${key}+key1 ctrl2+ +key2 ctrl3 + `,
						cursor: ` ${key}|+key1 ctrl2+ +key2 ctrl3 + `.lastIndexOf("|"),
					})),
				])
		})
		it(" ct|rl1+key1 ctrl2+ +key2 ctrl3 + ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 3
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, (ast as ChainNode).combos[0].keys[0]),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ${key}+key1 ctrl2+ +key2 ctrl3 + `,
						cursor: ` ${key}|+key1 ctrl2+ +key2 ctrl3 + `.lastIndexOf("|"),
					})),
				])
		})
		it(" ctrl1|+key1 ctrl2+ +key2 ctrl3 + ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 6
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, (ast as ChainNode).combos[0].keys[0]),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ${key}+key1 ctrl2+ +key2 ctrl3 + `,
						cursor: ` ${key}|+key1 ctrl2+ +key2 ctrl3 + `.lastIndexOf("|"),
					})),
				])
		})
		it(" ctrl1+|key1 ctrl2+ +key2 ctrl3 + ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 7
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, (ast as ChainNode).combos[0].keys[1]),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ctrl1+${key} ctrl2+ +key2 ctrl3 + `,
						cursor: ` ctrl1+${key}| ctrl2+ +key2 ctrl3 + `.lastIndexOf("|"),
					})),
				])
		})
		it(" ctrl1+key1| ctrl2+ +key2 ctrl3 + ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 11
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, (ast as ChainNode).combos[0].keys[1]),
				suggest(SUGGESTION_TYPE.KEY, { start: index, end: index }, true),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ctrl1+${key} ctrl2+ +key2 ctrl3 + `,
						cursor: ` ctrl1+${key}| ctrl2+ +key2 ctrl3 + `.lastIndexOf("|"),
					})),
					...keys.map(key => ({
						replacement: ` ctrl1+key1+${key} ctrl2+ +key2 ctrl3 + `,
						cursor: ` ctrl1+key1+${key}| ctrl2+ +key2 ctrl3 + `.lastIndexOf("|"),
					})),
				])
		})
		it(" ctrl1+key1 ctrl2+| +key2 ctrl3 + ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 18
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(`ERROR.${SUGGESTION_TYPE.KEY}`, { start: index, end: index }),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ctrl1+key1 ctrl2+${key} +key2 ctrl3 + `,
						cursor: ` ctrl1+key1 ctrl2+${key}| +key2 ctrl3 + `.lastIndexOf("|"),
					})),
				])
		})
		it(" ctrl1+key1 ctrl2+ |+key2 ctrl3 + ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 19
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(`ERROR.${SUGGESTION_TYPE.KEY}`, { start: index, end: index }),
			])
			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ctrl1+key1 ctrl2+ ${key}+key2 ctrl3 + `,
						cursor: ` ctrl1+key1 ctrl2+ ${key}|+key2 ctrl3 + `.lastIndexOf("|"),
					})),
				])
		})
		it(" ctrl1+key1 ctrl2+ +key2 |ctrl3 + ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 25
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, (ast as ChainNode).combos[3].keys[0]),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ctrl1+key1 ctrl2+ +key2 ${key} + `,
						cursor: ` ctrl1+key1 ctrl2+ +key2 ${key}| + `.lastIndexOf("|"),
					})),
				])
		})
		it(" ctrl1+key1 ctrl2+ +key2 ctrl3| + ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 30
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, (ast as ChainNode).combos[3].keys[0]),
				suggest(SUGGESTION_TYPE.KEY, { start: index, end: index }, true),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ctrl1+key1 ctrl2+ +key2 ${key} + `,
						cursor: ` ctrl1+key1 ctrl2+ +key2 ${key}| + `.lastIndexOf("|"),
					})),
					...keys.map(key => ({
						replacement: ` ctrl1+key1 ctrl2+ +key2 ctrl3+${key} + `,
						cursor: ` ctrl1+key1 ctrl2+ +key2 ctrl3+${key}| + `.lastIndexOf("|"),
					})),
				])
		})
		it(" ctrl1+key1 ctrl2+ +key2 ctrl3 |+ ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 31
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(`ERROR.${SUGGESTION_TYPE.KEY}`, { start: index, end: index }),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ctrl1+key1 ctrl2+ +key2 ctrl3 ${key}+ `,
						cursor: ` ctrl1+key1 ctrl2+ +key2 ctrl3 ${key}|+ `.lastIndexOf("|"),
					})),
				])
		})
		it(" ctrl1+key1 ctrl2+ +key2 ctrl3 +| ", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 32
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(`ERROR.${SUGGESTION_TYPE.KEY}`, { start: index, end: index }),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ctrl1+key1 ctrl2+ +key2 ctrl3 +${key} `,
						cursor: ` ctrl1+key1 ctrl2+ +key2 ctrl3 +${key}| `.lastIndexOf("|"),
					})),
				])
		})
		it(" ctrl1+key1 ctrl2+ +key2 ctrl3 + |", () => {
			const input = " ctrl1+key1 ctrl2+ +key2 ctrl3 + "
			const index = 33
			const parser = new Parser()
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, { start: index, end: index }),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: ` ctrl1+key1 ctrl2+ +key2 ctrl3 + ${key}`,
						cursor: ` ctrl1+key1 ctrl2+ +key2 ctrl3 + ${key}|`.lastIndexOf("|"),
					})),
				])
		})
	})
	describe("key(note) key) key() key key(", () => {
		it("key|(note) key) key() key key(", () => {
			const input = "key(note) key) key() key key("
			const index = 3
			const parser = new Parser({ keyNote: true })
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, { start: 0, end: index }),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: `${key}(note) key) key() key key(`,
						cursor: `${key}|(note) key) key() key key(`.lastIndexOf("|"),
					})),
				])
		})
		it("key(|note) key) key() key key(", () => {
			const input = "key(note) key) key() key key("
			const index = 4
			const parser = new Parser({ keyNote: true })
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.NOTE_CONTENT, { start: index, end: index + 4 }),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedContentValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...contents.map(content => ({
						replacement: `key(${content}) key) key() key key(`,
						cursor: `key(${content}|) key) key() key key(`.lastIndexOf("|"),
					})),
				])
		})
		it("key(no|te) key) key() key key(", () => {
			const input = "key(note) key) key() key key("
			const index = 6
			const parser = new Parser({ keyNote: true })
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.NOTE_CONTENT, { start: 4, end: 4 + 4 }),
			])
			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedContentValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...contents.map(content => ({
						replacement: `key(${content}) key) key() key key(`,
						cursor: `key(${content}|) key) key() key key(`.lastIndexOf("|"),
					})),
				])
		})
		it("key(note|) key) key() key key(", () => {
			const input = "key(note) key) key() key key("
			const index = 8
			const parser = new Parser({ keyNote: true })
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.NOTE_CONTENT, { start: 4, end: 8 }),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedContentValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...contents.map(content => ({
						replacement: `key(${content}) key) key() key key(`,
						cursor: `key(${content}|) key) key() key key(`.lastIndexOf("|"),
					})),
				])
		})
		it("key(note)| key) key() key key(", () => {
			const input = "key(note) key) key() key key("
			const index = 9
			const parser = new Parser({ keyNote: true })
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, { start: index, end: index }, true),
			])
			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedKeyValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: `key(note)+${key} key) key() key key(`,
						cursor: `key(note)+${key}| key) key() key key(`.lastIndexOf("|"),
					})),
				])
		})
		it("key(note) key|) key() key key(", () => {
			const input = "key(note) key) key() key key("
			const index = 13
			const parser = new Parser({ keyNote: true })
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)


			expect(simplify(suggestions)).to.deep.equal([
				suggest(`ERROR.${SUGGESTION_TYPE.NOTE_DELIM_LEFT}`, { start: index, end: index }),
				suggest(`ERROR.${SUGGESTION_TYPE.NOTE_CONTENT}`, { start: index, end: index }, false, "left"),
				suggest(SUGGESTION_TYPE.KEY, { start: index - 3, end: index }),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal([
				{ suggestion: suggestions[0], value: "(", rawValue: "(" },
				...genExpectedContentValues(suggestions[1]),
				...genExpectedKeyValues(suggestions[2]),
			])

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					{
						replacement: `key(note) key() key() key key(`,
						cursor: `key(note) key(|) key() key key(`.lastIndexOf("|"),
					},
					...contents.map(content => ({
						replacement: `key(note) key(${content}) key() key key(`,
						cursor: `key(note) key(${content}|) key() key key(`.lastIndexOf("|"),
					})),
					...keys.map(key => ({
						replacement: `key(note) ${key}) key() key key(`,
						cursor: `key(note) ${key}|) key() key key(`.lastIndexOf("|"),
					})),
				])
		})
		it("key(note) key) key(|) key key(", () => {
			const input = "key(note) key) key() key key("
			const index = 19
			const parser = new Parser({ keyNote: true })
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(`ERROR.${SUGGESTION_TYPE.NOTE_CONTENT}`, { start: index, end: index }),
			])
			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal(suggestions.map(suggestion => genExpectedContentValues(suggestion)).flat())

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...contents.map(content => ({
						replacement: `key(note) key) key(${content}) key key(`,
						cursor: `key(note) key) key(${content}|) key key(`.lastIndexOf("|"),
					})),
				])
		})
		it("key(note) key) key() key| key(", () => {
			const input = "key(note) key) key() key key("
			const index = 24
			const parser = new Parser({ keyNote: true })
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(SUGGESTION_TYPE.KEY, { start: index - 3, end: index }),
				suggest(SUGGESTION_TYPE.KEY, { start: index, end: index }, true),
				suggest(SUGGESTION_TYPE.NOTE_CONTENT, { start: index, end: index }, false, "both"),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal([
				...genExpectedKeyValues(suggestions[0]),
				...genExpectedKeyValues(suggestions[1]),
				...genExpectedContentValues(suggestions[2]),
			])

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...keys.map(key => ({
						replacement: `key(note) key) key() ${key} key(`,
						cursor: `key(note) key) key() ${key}| key(`.lastIndexOf("|"),
					})),
					...keys.map(key => ({
						replacement: `key(note) key) key() key+${key} key(`,
						cursor: `key(note) key) key() key+${key}| key(`.lastIndexOf("|"),
					})),
					...contents.map(content => ({
						replacement: `key(note) key) key() key(${content}) key(`,
						cursor: `key(note) key) key() key(${content}|) key(`.lastIndexOf("|"),
					})),
				])
		})
		it("key(note) key) key() key key(|", () => {
			const input = "key(note) key) key() key key("
			const index = 29
			const parser = new Parser({ keyNote: true })
			const ast = parser.parse(input)

			const suggestions = parser.autosuggest(input, ast, index)

			expect(simplify(suggestions)).to.deep.equal([
				suggest(`ERROR.${SUGGESTION_TYPE.NOTE_CONTENT}`, { start: index, end: index }, false),
				suggest(`ERROR.${SUGGESTION_TYPE.NOTE_DELIM_RIGHT}`, { start: index, end: index }),
				suggest(SUGGESTION_TYPE.NOTE_CONTENT, { start: index, end: index }, false, "right"),
			])

			const completions = parser.autocomplete(suggestions, completionOpts)
			expect(completions).to.deep.equal([
				...genExpectedContentValues(suggestions[0]),
				{ rawValue: ")", value: ")", suggestion: suggestions[1] },
				...genExpectedContentValues(suggestions[2]),
			])

			expect(completions.map(completion => parser.autoreplace(input, completion)))
				.to.deep.equal([
					...contents.map(content => ({
						replacement: `key(note) key) key() key key(${content}`,
						cursor: `key(note) key) key() key key(${content}|`.lastIndexOf("|"),
					})),
					{
						replacement: "key(note) key) key() key key()",
						cursor: "key(note) key) key() key key()|".lastIndexOf("|"),
					},
					...contents.map(content => ({
						replacement: `key(note) key) key() key key(${content})`,
						cursor: `key(note) key) key() key key(${content}|)`.lastIndexOf("|"),
					})),
				])
		})
	})
})
