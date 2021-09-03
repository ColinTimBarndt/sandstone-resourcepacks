import path = require("node:path");
import fs = require("node:fs/promises");
import { VersionManifest, BlockData } from "../src/gamedata/index";

export default async function generate(resFile: string) {
	const mf = await VersionManifest.load();
	const { blocks: blocksFile, properties: propsFile } = await mf.downloadBlockData(mf.latestRelease);

	const blocks: BlockData = JSON.parse((await fs.readFile(blocksFile)).toString("utf8"));
	const properties: BlockData.PropertiesData = JSON.parse((await fs.readFile(propsFile)).toString("utf8"));

	const propkeys = Object.keys(properties).sort();

	let gid: number = 0;
	let groups = new Map<string, [string, number]>();

	let file = [
		"export type Blockstates = {",
		...Object.entries(blocks)
			.filter(([, data]) => data.properties.length > 0)
			.map(([blockId, data]) => {
				const guid = data.properties.sort().join(",");
				if (groups.has(guid)) return `\t"${blockId}": G_${groups.get(guid)![1]};`;
				const id = gid++;
				groups.set(guid, [
					[
						`{`,
						...data.properties.map(ename => {
							const e = properties[ename]!;
							return `\t"${e.key}": P_${ename};`;
						}),
						'};'
					].join("\n"),
					id
				])
				return `\t"${blockId}": G_${id};`;
			}),
		"};",
		...propkeys
			.map((ename) => {
				return `type P_${ename} = ${properties[ename]!.values.map(v => `"${v}"`.toLowerCase()).join(" | ")};`;
			}),
	].join("\n");

	let g: [string, number];
	for (g of groups.values()) {
		file += `\ntype G_${g[1]} = ${g[0]}`;
	}

	await fs.writeFile(resFile, file);
}