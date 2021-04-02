import { testName } from "@utils/testing"

import { ValidToken } from "@/ast/classes"
import { Parser } from "@/parser"
import type { TOKEN_TYPE } from "@/types"
import { expect } from "@tests/chai"


describe(testName(), () => {
	it("key\\+ key\\=    key+key     key-key   key(note)", () => {
		const input = "key\\+ key\\=    key+key     key-key   key(note)"
		const parser = new Parser({ keyNote: true })
		const ast = parser.parse(input)
		expect(ast.stringify(parser.options)).to.deep.equal(`key\\+ key= key+key key+key key(note)`)
	})
	it("key(note) => key(custom note)", () => {
		const input = "key(note)"
		class NoteToken extends ValidToken<TOKEN_TYPE.NOTE_CONTENT> {
			constructor(token: ConstructorParameters<typeof ValidToken>) { super(token as any) }
			stringify() { return "custom note" }
		}
		const parser = new Parser({
			keyNote: {
				parser: token => token instanceof ValidToken ? new NoteToken(token as any) : token,
			},
		})

		const ast = parser.parse(input)
		expect(ast.stringify(parser.options)).to.deep.equal(`key(custom note)`)
	})
})
