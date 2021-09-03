import { BLOCKS, CustomResource } from "sandstone";
import { ResourceLoader } from "./gamedata";
import { getResourcePath, parseNamespacedId, saveResourcepackResource } from "./resource";
import { Blockstates } from "./generated/blockstates"

export const BlockstateResource = CustomResource("blockstate", {
	dataType: "json",
	extension: "json",
	save: saveResourcepackResource("assets", "blockstates")
});

export type BlockstateData = {
	variants: BlockstateData.Variants;
} | {
	multipart: BlockstateData.MultipartCase[];
};

export namespace BlockstateData {
	export async function load(loader: ResourceLoader, id: string): Promise<BlockstateData | null> {
		const parsedId = parseNamespacedId(id);
		const rPath = getResourcePath(parsedId, "blockstates", "json");
		const data = await loader.readResourceFile(rPath);
		if (data === null) return null;
		else return JSON.parse(data.toString("utf8"));
	}

	export type Variants = {
		[name: string]: Variant | WeightedVariant[];
	};
	
	export type Variant = {
		model: string;
		x?: 0 | 90 | 180 | 270;
		y?: 0 | 90 | 180 | 270;
		/**
		 * If set to `true`, the textures are not rotated with the block.
		 */
		uvlock?: boolean;
	};
	
	export type WeightedVariant = Variant & {
		weight?: number;
	};

	export type MultipartCase = {
		/**
		 * One condition or an array where at least one condition
		 * must apply
		 */
		when: Condition | Condition[];
		apply: Variant | WeightedVariant[];
	};

	export type Condition = {
		[state: string]: string;
	};
}

export function blockWithState<B extends BLOCKS>(
	block: B,
	state?: B extends keyof Blockstates ? Blockstates[B] : never
): string;
export function blockWithState(
	block: string,
	state?: {
		[name: string]: string;
	} | Blockstates[keyof Blockstates]
): string;
export function blockWithState(
	block: string,
	state?: { [name: string]: string; }
): string {
	let id: string = block;
	if (state) {
    id += "[" + Object.entries(state).map(([name, val]) => `${name}=${val}`).join(",") + "]";
  }
  return id;
}

blockWithState("minecraft:grass_block", {snowy: "true"});