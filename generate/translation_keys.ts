import path = require("node:path");
import fs = require("node:fs/promises");
import { VersionManifest, ResourceLoader } from "../src/gamedata/index";

export default async function generate(resFile: string) {
	const mf = await VersionManifest.load();
	const loader = new ResourceLoader({
		loadVanilla: mf.latestRelease,
	});
	const lang = await loader.readResourceFile(path.join("assets", "minecraft", "lang", "en_us.json"));
	if (lang === null) throw new Error("Could not find en_us language file");

	const file = [
		`import type {BLOCKS, ITEMS, BIOMES, GAMEMODES, GAMERULES, BASIC_COLORS, ENCHANTMENTS} from "sandstone";`,
		'export type TranslationKeyForNamespacedId<I extends string> =',
		'\tI extends `${infer N}:${infer P}`',
		'\t? `${N}.${P}`',
		'\t: `minecraft.${I}`',
		"export type TRANSLATION_KEY =",
		group(Object.keys(JSON.parse(lang.toString("utf8"))).filter(k => !/^(block|item|color|biome|enchantment|gameMode|gamerule)\./.test(k))),
		"\t| `gameMode.${GAMEMODES}`",
		"\t| `gamerule.${GAMERULES}`",
		'\t| `enchantment.${TranslationKeyForNamespacedId<ENCHANTMENTS>}`',
		'\t| `biome.${TranslationKeyForNamespacedId<BIOMES>}`',
		'\t| `color.${Exclude<BASIC_COLORS, "reset">}`',
		'\t| `block.${TranslationKeyForNamespacedId<BLOCKS>}`',
		'\t| `item.${TranslationKeyForNamespacedId<Exclude<ITEMS, BLOCKS>>}`'
		+ ";",
	].join("\n");

	await fs.writeFile(resFile, file);
}

function group(keys: string[]): string {
	let str = "";
	const subgroups = new Map<string, string[]>();
	const pushSubgroup = (name: string, sub: string) => {
		if (subgroups.has(name)) {
			subgroups.get(name)!.push(sub);
		} else {
			subgroups.set(name, [sub]);
		}
	};

	let i: number, l = keys.length, k: string, dot: number;
	for (i = 0; i < l; i++) {
		k = keys[i]!;
		if ((dot = k.indexOf(".")) >= 0) {
			pushSubgroup(k.substring(0, ++dot), k.substring(dot));
		} else {
			str += `|"${k}"`;
		}
	}

	let e: [string, string[]];
	for (e of subgroups.entries()) {
		str += "|`" + e[0] + "${";
		str += group(e[1]);
		str += "}`"
	}

	return str;
}