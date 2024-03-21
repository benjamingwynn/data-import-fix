/** @format */

import crypto from "node:crypto"
import stream from "node:stream"

/** Converts a data url into a sha256 hash. Should save memory on large projects */
async function hash(url) {
	const [header, contents] = url.split(";")
	const [type, ...data] = contents.split(",")
	const string = data.join(",")
	const bufferStream = new stream.PassThrough()
	bufferStream.end(Buffer.from(string, type))
	const hash = crypto.createHash("sha256")
	bufferStream.pipe(hash)
	return new Promise((resolve, reject) => {
		hash.on("error", (err) => {
			reject(err)
		})
		bufferStream.on("error", (err) => {
			reject(err)
		})
		hash.on("readable", () => {
			const data = hash.read()
			if (data) {
				const hashValue = data.toString("hex")
				// console.log(`"${url}"`, "->", `"${hashValue}"`)
				resolve(hashValue)
			}
		})
	})
}

/** map of hash of b64 url to parent directory */
const b64Directory = new Map()

/** @public Receives data from `register`. */
export async function initialize(/*{number, port}*/) {}

/** @public Take an `import` or `require` specifier and resolve it to a URL. */
export async function resolve(specifier, context, nextResolve) {
	// console.log("[resolve]\t", specifier, context)

	if (specifier?.startsWith("data:")) {
		let parent = context.parentURL
		while (parent.startsWith("data:")) {
			const hashed = await hash(parent)
			parent = b64Directory.get(hashed)
		}
		if (!parent || parent.startsWith("data:")) throw new Error("unexpected")
		// console.error("\t[base64 url installed]", parent, "->", specifier)
		// console.error("***", hashed, "***")

		const hashed = await hash(specifier)
		b64Directory.set(hashed, parent)
	}

	if (context.parentURL?.startsWith("data:")) {
		try {
			const rtn = await nextResolve(specifier)
			return rtn
		} catch (err) {
			if (
				err?.code === "ERR_UNSUPPORTED_RESOLVE_REQUEST" || // node 21
				err?.cause?.code === "ERR_INVALID_URL" || // node 21
				err?.code === "ERR_INVALID_URL" // node 20
			) {
				const b64Package = context.parentURL
				const hashed = await hash(b64Package)
				const b64PackageParent = b64Directory.get(hashed)
				if (!b64PackageParent) {
					throw new Error(`failed to find parent of ${b64Package}`)
				}
				// console.error("\t[hit]", b64PackageParent)
				context.parentURL = b64PackageParent
			} else {
				throw err
			}
		}
	}

	return nextResolve(specifier)
}

/** @public Take a resolved URL and return the source code to be evaluated. */
export async function load(resolvedUrl, context, nextLoad) {
	// console.log("[load]\t", resolvedUrl, context)

	return nextLoad(resolvedUrl, context)
}
