import { testName } from "@utils/testing"

import { key, note, sep } from "./utils"

import { chain, combo } from "@/ast/builders"
import { Parser } from "@/parser"
import { expect } from "@tests/chai"


describe(testName(), () => {
	it("ctrl+key", () => {
		const input = "ctrl+key(note)"
		const parser = new Parser<{ type: string }>({
			keyNote: true,
			// @ts-expect-error ??? type is partly void, should not require return
			// might be this issue https://github.com/Microsoft/TypeScript/issues/18319
			tokenValidator: token => {
				if (["ctrl", "+", "key", "(", "note", ")"].includes(token.value)) {
					return [{ start: token.start, end: token.end, type: "invalid" }]
				}
			},
		})
		const ast = parser.parse(input)

		const expected = chain([
			combo([
				key(input, "ctrl"),
				key(input, "key", 1, note(input, "note")),
			], [
				sep(input, "+"),
			]),
		])

		expect(ast).to.deep.equal(expected)
		const errors = parser.validate(ast)

		expect(errors).to.deep.equal([
			{ start: 0, end: 4, type: "invalid" },
			{ start: 4, end: 5, type: "invalid" },
			{ start: 5, end: 8, type: "invalid" },
			{ start: 8, end: 9, type: "invalid" },
			{ start: 9, end: 13, type: "invalid" },
			{ start: 13, end: 14, type: "invalid" },
		])
	})
})
