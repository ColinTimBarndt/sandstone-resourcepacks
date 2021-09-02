import * as http from "./http";
import path = require("node:path");
import Zip = require("adm-zip");
import fs = require("node:fs/promises");

let manifest: VersionManifest | null = null;

/**
 * Singleton class for the version manifest of Minecraft
 */
export class VersionManifest {
	private readonly versions: Map<string, VersionManifest.VersionInfo> = new Map();
	public readonly latestRelease: string;
	public readonly latestSnapshot: string;
	private constructor(
		data: {
			latest: {
				release: string,
				snapshot: string,
			};
			versions: {
				id: string;
				type: "release" | "snapshot" | "old_alpha" | "old_beta";
				url: string;
				time: string;
				releaseTime: string;
			}[];
		}
	) {
		this.latestRelease = data.latest.release;
		this.latestSnapshot = data.latest.snapshot;
		data.versions.forEach(v => {
			this.versions.set(v.id, {
				id: v.id,
				type: v.type,
				url: v.url,
			});
		});
	}

	public static async load(): Promise<VersionManifest> {
		if (manifest) return manifest;
		const data = JSON.parse(
			(
				await http.get(
					"https://launchermeta.mojang.com/mc/game/version_manifest.json",
					"version_manifest.json"
				)
			).toString("utf8")
		);
		return manifest = new VersionManifest(data);
	}

	public getVersion(version: "1.17.1"): VersionManifest.VersionInfo;
	public getVersion(version: string): VersionManifest.VersionInfo | null;
	public getVersion(version: string): VersionManifest.VersionInfo | null {
		return this.versions.get(version) || null;
	}

	public async downloadData(version: "1.17.1"): Promise<string>;
	public async downloadData(version: string): Promise<string>;
	public async downloadData(version: string): Promise<string> {
		if (!this.versions.has(version))
			throw new Error("Version does not exist: " + version);
		const DATA_ZIP = path.join("versions", version, "data.zip");
		const zipFile = await http.download(`https://codeload.github.com/InventivetalentDev/minecraft-assets/zip/refs/heads/${version}`, DATA_ZIP);
		const zip = new Zip(zipFile);
		const zipDir = path.dirname(zipFile);
		const resourcesDir = path.join(zipDir, `minecraft-assets-${version}`);
		try {
			const stat = await fs.stat(resourcesDir);
			if (!stat.isDirectory()) await fs.unlink(resourcesDir);
		} catch(err: any) {
			if (err.code !== "ENOENT") throw err;
			await new Promise<void>((resolve, reject) => {
				zip.extractAllToAsync(path.join(zipDir), false, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		}
		return resourcesDir;
	}
}

export namespace VersionManifest {
	export type VersionInfo = {
		id: string;
		type: "release" | "snapshot" | "old_alpha" | "old_beta";
		url: string;
	};
}