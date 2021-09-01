import { VersionManifest } from "./game";
import Zip = require("adm-zip");
import fs = require("node:fs/promises");
import path = require("node:path");

export class ResourceLoader {
	private readonly _load: Promise<void>;
	private vanilla: Zip | null = null;
	private readonly includePacks: (string | Zip)[] = [];
	private readonly loadPacks: (string | Zip)[] = [];
	private readonly cache: {
		/**
		 * `string`: Path to file
		 * `[Zip, string]`: Path to file in zip
		 * `Promise<Buffer>`: Already reading this file
		 */
		[path: string]: string | [Zip, Zip.IZipEntry] | Promise<Buffer>
	} = {};
	private readonly loadOrder: (string | Zip)[] = [];

	public constructor(config: ResourceLoader.Config) {
		this._load = (async () => {
			// Load Minecraft data and resourcepacks
			await Promise.all([
				(async () => {
					if (config.loadVanilla) {
						const vman = await VersionManifest.load();
						const filename = await vman.downloadData(config.loadVanilla);
						this.vanilla = new Zip(filename);
					}
				})(),
				Promise.all((["includePacks", "loadPacks"] as const).map(async prop => {
					this[prop].push(...await Promise.all(config[prop].map(
						async path => {
							const stat = await fs.stat(path, { throwIfNoEntry: true });
							if (stat.isFile()) {
								return new Zip(path);
							} else {
								return path;
							}
						}
					)));
				})),
			]);
			this.loadOrder.push(...this.includePacks);
			this.loadOrder.push(...this.loadPacks);
			if (this.vanilla) this.loadOrder.push(this.vanilla);
		})();
	}

	/**
	 * Reads a file from the given resourcepacks in order
	 */
	public async readResourceFile(relPath: string): Promise<Readonly<Buffer> | null> {
		if (relPath in this.cache) {
			const cached = this.cache[relPath]!;
			if (cached instanceof Promise) {
				return await cached;
			} else if (typeof cached === "string") {
				return await fs.readFile(cached);
			} else {
				return await readZipFile(...cached);
			}
		}

		await this._load;

		for (const [index, entry] of this.loadOrder.entries()) {
			if (typeof entry === "string") {
				try {
					return await fs.readFile(path.join(entry, relPath));
				} catch (err: any) {
					if (err.code !== "ENOENT") throw err;
					continue;
				}
			} else {
				const zipEntry = entry.getEntry(relPath);
				if (zipEntry === null) continue;
				const prom = readZipFile(entry, zipEntry);
				this.cache[relPath] = prom;
				const buffer = await prom;
				this.cache[relPath] = [entry, zipEntry];
				return buffer;
			}
		}

		return null;
	}
}

export namespace ResourceLoader {
	export type Config = ({
		/**
		 * Loads assets from a version of vanilla Minecraft
		 */
		loadVanilla?: string;
	} | {
		/**
		 * Loads assets from vanilla Minecraft version 1.17.1
		 */
		loadVanilla: "1.17.1";
	}) & {
		/**
		 * Resource pack folders or zipped files relative to the project folder.
		 * These resourcepacks have a higher priority than the packs that are only
		 * loaded and are included in the generated resource pack when calling
		 * method `finish()`.
		 */
		includePacks: string[];
		/**
		 * Resource pack folders or zipped files relative to the project folder
		 */
		loadPacks: string[];
	};
}

function readZipFile(archive: Zip, entry: Zip.IZipEntry): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const buffer = archive.readFileAsync(entry, (data, err) => {
			if (data === null) reject(new Error(err));
			else resolve(data);
		});
	});
}