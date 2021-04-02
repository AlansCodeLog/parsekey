### 🚧 WORK IN PROGRESS 🚧

![Docs](https://github.com/alanscodelog/parsekey/workflows/Docs/badge.svg)
![Build](https://github.com/alanscodelog/parsekey/workflows/Build/badge.svg)
<!-- [![Release](https://github.com/alanscodelog/parsekey/workflows/Release/badge.svg)](https://www.npmjs.com/package/parsekey) -->

# Parsekey (name ideas welcome)

Parsekey is blazing fast, customizable, error-tolerant shortcuts parser.

# [Docs](https://alanscodelog.github.io/parsekey)
# Features
- **Shortcut Chains**
- **Custom Separators**
- **Key Notes**
	- Allows specifying things like holds, toggle states, multiple clicks or whatever other extra states you can think of:
		- Examples: `Capslock(on)`, `Capslock(off)`, `SomeKey(Hold:5000)` (hold for 5 seconds), `RButton(2:200)` (2 clicks within 200ms).
	- Delimiters are customizable.
	- Basic ones will be compatible with my shortcuts manager library.
- **Error Recovery**
	- The parser is designed to recover from ALL errors, even **multiple** errors, making it easy to provide things like syntax highlighting.
- **Batteries (Partially) Included**
	- Can `validate` (for syntax highlighting) ASTs according to custom rules.
	- It cannot "evaluate" ASTs, that functionality will be in my [shortcuts manager library](https://github.com/alanscodelog/shortcuts-manager) as it is not as simple as it seems.
- **Autosuggest/complete/replace Helpers**
	- Never think about autocompletion ever again!
- **Other Useful Utility Functions:**
	- `extractTokens`, `getCursorInfo`, `getSurroundingErrors` - useful for adding custom syntax highlighting.
	- `prettyAst` - pretty prints a compact version of the ast for debugging
- **Lots of Docs and Tests**

# Usage
```ts
	import { Parser, ErrorToken, SUGGESTION_TYPE } from "parsekey"

	const parser = new Parser({/* opts */})

	// USER INPUT
	const input = "Ctrl+key a b"
	const cursor = 2 //Ctrl+key a| b

	const ast = parser.parse(input)

	if (ast instanceof ErrorToken || !ast.valid) {
		// ...show regular errors (no input, missing tokens, etc)
	} else {
		// validation can be controlled by parser options
		const errors = parser.validate(ast)
		// ...show more complex errors
		// e.g. unknown keys, unparsable key notes, etc
	}

	// ON AUTOCOMPLETE
	let suggestions = parser.autosuggest(input, ast, cursor)
	// filter out unwanted suggestion types if you want
	suggestions = suggestions
		.filter(suggestion => ![unwantedSuggestionType].includes(SUGGESTION_TYPE.KEY))

	let completions = parser.autocomplete(suggestions, {
		// known possible suggestions
		keys: ["a", "b", "c", "d", "e"],
		// can also be key note suggestions
		notes: ["on", "off", "hold:5000"]
	})
	// ...filter out unwanted completions
	// e.g. say you wanted to have note suggestions only for certain keys
	completions = completions.filter(completion => {
		// not a token, I name it token to make the conditions easier to read
		const token = completion.suggestion.cursorInfo
		if (
			completion.suggestion.type == SUGGESTION_TYPE.NOTE_CONTENT &&
			token.prev?.type === TOKEN_TYPE.KEY &&
			token.prev?.value.toLowerCase() === "capslock" &&
			!["on", "off"].find(completion.rawValue)
		) return false
		return true
	}) // "hold:5000" is removed for input like `Capslock(|)`
	// ...show completions


	// ON ENTER/SUBMIT
	// use my shortcut manager library to handle creating/managing the shortcut
```

Many more examples can be found in the [tests](https://github.com/AlansCodeLog/parsekey/blob/master/tests).

## [Development](./docs-src/DEVELOPMENT.md)

## Related

[Shortcuts Manager](https://github.com/alanscodelog/shortcuts-manager)

[Expressit (boolean parser)](https://github.com/alanscodelog/expressit)
