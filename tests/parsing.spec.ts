import { testName } from "@utils/testing"

import { key, note, sep } from "./utils"

import { chain, combo } from "@/ast/builders"
import { Parser } from "@/parser"
import { expect } from "@tests/chai"


describe(testName(), () => {
	it("+key", () => {
		const input = "+key"
		const parser = new Parser()
		const ast = parser.parse(input)


		const expected = chain([
			combo([
				key({ start: 0 }, undefined),
				key(input, "key"),
			], [
				sep(input, "+"),
			]),
		])

		expect(ast).to.deep.equal(expected)
	})
	it("key+", () => {
		const input = "key+"
		const parser = new Parser()
		const ast = parser.parse(input)

		const expected = chain([
			combo([
				key(input, "key"),
				key({ start: input.length }, undefined),
			], [
				sep(input, "+"),
			]),
		])

		expect(ast).to.deep.equal(expected)
	})
	it("key\\+", () => {
		const input = "key\\+"
		const parser = new Parser()
		const ast = parser.parse(input)

		const expected = chain([
			combo([
				key(input, "key\\+"),
			]),
		])
		expect(ast).to.deep.equal(expected)
	})
	it("key++", () => {
		const input = "key++"
		const parser = new Parser()
		const ast = parser.parse(input)

		const expected = chain([
			combo([
				key(input, "key"),
				key({ start: 4 }, undefined),
				key({ start: 5 }, undefined),
			], [
				sep(input, "+"),
				sep(input, "+", 2),
			]),
		])
		expect(ast).to.deep.equal(expected)
	})
	it("++", () => {
		const input = "++"
		const parser = new Parser()
		const ast = parser.parse(input)

		const expected = chain([
			combo([
				key({ start: 0 }, undefined),
				key({ start: 1 }, undefined),
				key({ start: 2 }, undefined),
			], [
				sep(input, "+"),
				sep(input, "+", 2),
			]),
		])

		expect(ast).to.deep.equal(expected)
	})
	it("++key", () => {
		const input = "++key"
		const parser = new Parser()
		const ast = parser.parse(input)

		const expected = chain([
			combo([
				key({ start: 0 }, undefined),
				key({ start: 1 }, undefined),
				key(input, "key"),
			], [
				sep(input, "+"),
				sep(input, "+", 2),
			]),
		])

		expect(ast).to.deep.equal(expected)
	})
	it("key(note)", () => {
		const input = "key(note)"
		const parser = new Parser({ keyNote: {} })
		const ast = parser.parse(input)


		const expected = chain([
			combo([
				key(input, "key", 1, note(input, "note")),
			], []),
		])

		expect(ast).to.deep.equal(expected)
	})
	it("key()", () => {
		const input = "key()"
		const parser = new Parser({ keyNote: {} })
		const ast = parser.parse(input)


		const expected = chain([
			combo([
				key(input, "key", 1, note(input, undefined)),
			], []),
		])

		expect(ast).to.deep.equal(expected)
	})
	it("key(note", () => {
		const input = "key(note"
		const parser = new Parser({ keyNote: {} })
		const ast = parser.parse(input)


		const expected = chain([
			combo([
				key(input, "key", 1, note(input, "note", 1, 1, 0)),
			], []),
		])

		expect(ast).to.deep.equal(expected)
	})
	it("key(", () => {
		const input = "key("
		const parser = new Parser({ keyNote: {} })
		const ast = parser.parse(input)


		const expected = chain([
			combo([
				key(input, "key", 1, note(input, undefined, 0, 1, 0)),
			], []),
		])

		expect(ast).to.deep.equal(expected)
	})
	it("key)", () => {
		const input = "key)"
		const parser = new Parser({ keyNote: {} })
		const ast = parser.parse(input)


		const expected = chain([
			combo([
				key(input, "key", 1, note(input, undefined, 0, 0)),
			], []),
		])

		expect(ast).to.deep.equal(expected)
	})
	it("()", () => {
		const input = "()"
		const parser = new Parser({ keyNote: {} })
		const ast = parser.parse(input)


		const expected = chain([
			combo([
				key({ start: 0, end: 0 }, undefined, 0, note(input, undefined, 0)),
			], []),
		])
		expect(ast).to.deep.equal(expected)
	})
	it(")", () => {
		const input = ")"
		const parser = new Parser({ keyNote: {} })
		const ast = parser.parse(input)


		const expected = chain([
			combo([
				key({ start: 0, end: 0 }, undefined, 0, note(input, undefined, 0, 0, 1)),
			], []),
		])
		expect(ast).to.deep.equal(expected)
	})
	it("key)", () => {
		const input = "key)"
		const parser = new Parser({ keyNote: {} })
		const ast = parser.parse(input)


		const expected = chain([
			combo([
				key(input, "key", 1, note(input, undefined, 0, 0, 1)),
			], []),
		])

		expect(ast).to.deep.equal(expected)
	})
	it("\"key(note note note \" (consumes all)", () => {
		const input = "key(note note note "
		const parser = new Parser({ keyNote: { } })
		const ast = parser.parse(input)


		const expected = chain([
			combo([
				key(input, "key", 1, note(input, "note note note ", 1, 1, 0)),
			], []),
		])

		expect(ast).to.deep.equal(expected)
	})
})
