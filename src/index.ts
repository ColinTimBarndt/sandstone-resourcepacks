export * from "./model";
export * as GameData from "./gamedata/index";

import { GameData } from ".";

GameData.VersionManifest.load().then(async manifest => {
	const data = await manifest.downloadData("1.17.1");
	console.log(data);
});