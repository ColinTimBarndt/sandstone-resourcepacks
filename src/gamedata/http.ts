import * as https from "node:https";
import * as fs from "node:fs/promises";
import * as fssync from "node:fs";
import path = require("node:path");
import { URL } from "node:url";

export const CACHE_DIR = path.join(__dirname, ".." , "..", "cache");
const CACHE_MANIFEST = path.join(CACHE_DIR, "cache_manifest.json");

let CACHE: {
	[file: string]: {
		etag: string;
		date: string;
	};
} = {};
const loadingCache = fs.mkdir(CACHE_DIR, { recursive: true })
	.then(() => fs.readFile(CACHE_MANIFEST))
	.then(f => {
		CACHE = JSON.parse(f.toString("utf8"));
	}).catch(e => {
		if (e.code !== "ENOENT") throw e;
	});

const DEFAULT_HEADERS = {
	"User-Agent": `${process.env.npm_package_name || "DatapackTools"}/${process.env.npm_package_version || "1.0"}`,
	"Accept": "application/json,text/json,text/plain",
};

/**
 * Loads a network resource using a cache and returns the file content.
 * @param href
 * @param cacheFilename
 * @returns
 */
export function get(href: string, cacheFilename: string): Promise<Buffer> {
	return download(href, cacheFilename)
		.then(file => fs.readFile(file));
}

/**
 * Loads a network resource.
 * @param href
 * @param cacheFilename
 */
export async function download(href: string, cacheFilename: string): Promise<string> {
	await loadingCache;
	const file = path.join(CACHE_DIR, cacheFilename);
	const url = new URL(href);
	const options: https.RequestOptions = {
		host: url.host,
		path: url.pathname,
		headers: {
			...DEFAULT_HEADERS,
		}
	};
	if (cacheFilename in CACHE) {
		const cached = CACHE[cacheFilename]!;
		if (Date.now() - new Date(cached.date).getTime() >= 24 * 60 * 60 * 1000) {
			await tryAccessFromCache(href, cacheFilename);
			return file;
		} else {
			options.headers!["If-None-Match"] = cached.etag;
			options.headers!["If-Modified-Since"] = cached.date;
		}
	}
	return new Promise<string>((resolve, reject) => {
		https.get(options, async res => {
			if (res.statusCode === 304) {
				await tryAccessFromCache(href, cacheFilename);
				resolve(file);
			} else if (res.statusCode! >= 200 && res.statusCode! < 400) {
				fssync.mkdirSync(path.dirname(file), { recursive: true });
				const fstream = fssync.createWriteStream(file);
				res.pipe(fstream);
				if (res.headers.etag && res.headers.date) {
					CACHE[cacheFilename] = {
						etag: res.headers.etag,
						date: res.headers.date,
					}
				}
				res.on("close", async () => {
					await saveCache();
					await tryAccessFromCache(href, cacheFilename);
					resolve(file);
				});
			} else reject(new Error(`Server responded with ${res.statusCode} (${res.statusMessage})`));
		});
	});
}

async function tryAccessFromCache(href: string, cacheFilename: string): Promise<void> {
	try {
		await fs.access(path.join(CACHE_DIR, cacheFilename), fssync.constants.R_OK);
	} catch (e: any) {
		if (e.code !== "ENOENT") throw e;
		delete CACHE[cacheFilename];
		await saveCache();
		await download(href, cacheFilename);
	}
}

async function saveCache() {
	await fs.mkdir(CACHE_DIR, { recursive: true });
	await fs.writeFile(
		CACHE_MANIFEST,
		JSON.stringify(CACHE, undefined, "\t"),
	);
}