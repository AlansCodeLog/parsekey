import { testName } from "@utils/testing"

import { expect } from "@tests/chai"


describe(testName(), () => {
	it("missing tests", () => {
		expect(true).to.equal(false)
	})
})
