import * as http from "./http";
import path = require("node:path");

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
		const data = JSON.parse(
			(
				await http.get(
					"https://launchermeta.mojang.com/mc/game/version_manifest.json",
					"version_manifest.json"
				)
			).toString("utf8")
		);
		return new VersionManifest(data);
	}

	public getVersion(version: "1.17.1"): VersionManifest.VersionInfo;
	public getVersion(version: string): VersionManifest.VersionInfo | null;
	public getVersion(version: string): VersionManifest.VersionInfo | null {
		return this.versions.get(version) || null;
	}

	public async downloadClient(version: "1.17.1"): Promise<string>;
	public async downloadClient(version: string): Promise<string>;
	public async downloadClient(version: string): Promise<string> {
		if (!this.versions.has(version))
			throw new Error("Version does not exist: " + version);
		const { url } = this.versions.get(version)!;
		type DownloadEntry = {
			sha1: string;
			size: number;
			url: string;
		};
		const data: {
			downloads: {
				client: DownloadEntry;
				server: DownloadEntry;
				client_mappings: DownloadEntry;
				server_mappings: DownloadEntry;
				id: string;
			}
		} = JSON.parse(
			(
				await http.get(
					url,
					path.join("versions", version, "version.json"))
			).toString("utf8")
		);
		const JAR_FILE = path.join("versions", version, "client.jar");
		return await http.download(data.downloads.client.url, JAR_FILE);
	}
}

export namespace VersionManifest {
	export type VersionInfo = {
		id: string;
		type: "release" | "snapshot" | "old_alpha" | "old_beta";
		url: string;
	};
}