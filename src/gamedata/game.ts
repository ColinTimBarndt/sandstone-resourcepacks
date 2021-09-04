import * as http from "./http";
import path = require("path");
import Zip = require("adm-zip");
import fs = require("fs/promises");
import type { BLOCKS } from "sandstone";

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
		} catch (err: any) {
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

	public async downloadBlockData(version: "1.17.1"): Promise<{ properties: string; blocks: string; }>;
	public async downloadBlockData(version: string): Promise<{ properties: string; blocks: string; }>;
	public async downloadBlockData(version: string): Promise<{ properties: string; blocks: string; }> {
		if (!this.versions.has(version))
			throw new Error("Version does not exist: " + version);
		const VER_PREFIX = version.replace(/\./g, "_");
		const DL_DIR = path.join("versions", version);
		const PROP_URL = `https://raw.githubusercontent.com/Articdive/ArticData/${version}/${VER_PREFIX}_block_properties.json`;
		const BLOCKS_URL = `https://raw.githubusercontent.com/Articdive/ArticData/${version}/${VER_PREFIX}_blocks.json`;

		const res = await Promise.all([
			http.download(PROP_URL, path.join(DL_DIR, "block_properties.json")),
			http.download(BLOCKS_URL, path.join(DL_DIR, "blocks.json"))
		]);

		return {
			properties: res[0],
			blocks: res[1],
		};
	}
}

export namespace VersionManifest {
	export type VersionInfo = {
		id: string;
		type: "release" | "snapshot" | "old_alpha" | "old_beta";
		url: string;
	};
}

export type BlockData = {
	[Block in BLOCKS]: {
		id: number;
		mojangName: string;
		translationKey: string;
		explosionResistance: number;
		friction: number;
		speedFactor: number;
		jumpFactor: number;
		dynamicShape: boolean;
		defaultStateId: number;
		lootTableLocation: string;
		correspondingItem: string;
		blockEntity: boolean;
		gravity: boolean;
		canRespawnIn: boolean;
		/**
		 * Block state property types
		 */
		properties: string[];
		states: BlockData.BlockState[];
	};
};

export namespace BlockData {
	export type BlockState = {
		properties: { [propertyName: string]: string | number };
		stateId: number;
		hardness: number;
		lightEmission: number;
		occludes: boolean;
		useShapeForLightOcclusion: boolean;
		propagatesSkylightDown: boolean;
		lightBlock: number;
		conditionallyFullyOpaque: boolean;
		opacity: number;
		pushReaction: PushReaction;
		mapColorId: number;
		blocksMotion: boolean;
		flammable: boolean;
		air: boolean;
		liquid: boolean;
		replaceable: boolean;
		solid: boolean;
		solidBlocking: boolean;
		toolRequired: boolean;
		largeCollisionShape: boolean;
		collisionShapeFullBlock: boolean;
		solidRender: boolean;
		shape: string;
		collisionShape: string;
		interactionShape: string;
		occlusionShape: string;
		visualShape: string;
		renderShape: RenderShape;
	};

	export const enum PushReaction {
		Normal = "NORMAL",
		Block = "BLOCK",
		Destroy = "DESTROY",
		PushOnly = "PUSH_ONLY",
	}

	export const enum RenderShape {
		Invisible = "INVISIBLE",
		Model = "MODEL",
		EntityBlockAnimated = "ENTITYBLOCK_ANIMATED",
	}

	export type PropertiesData = {
		[propType: string]: {
			key: string;
			values: (string | number | boolean)[];
		}
	}
}