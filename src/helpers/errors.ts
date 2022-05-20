import type { Keys } from "@utils/types"
import { crop, indent, pretty } from "@utils/utils"

import { name, repository, version } from "@/package"
import type { ERROR_CODES, ErrorInfo } from "@/types"


export class ShortcutsParserLibraryError<T extends ERROR_CODES> extends Error {
	name: string = name
	version: string = version
	repo: string = repository
	type: T
	info: ErrorInfo<T>
	constructor(type: T, info: ErrorInfo<T>, message?: string) {
		super(
			message
				? `${message}\n${pretty(info)}`
				: `This error should never happen, please file a bug report at ${repository}/issues with the following information: \n${crop`
					version: ${version}
					type: ${type}
					info: ${indent(JSON.stringify(info, forceStringifyErrors, "\t"), 5)}
				`}`)
		this.type = type
		this.info = info
	}
}

function forceStringifyErrors(_key: string, value: any): any {
	if (value instanceof Error) {
		return Object.fromEntries(
			(Object.getOwnPropertyNames(value) as Keys<Error>)
				.map(key => [
					key,
					key === "stack"
						? value[key]!.split(/\n/)
						: value[key],
				])
		)
	}
	return value
}
