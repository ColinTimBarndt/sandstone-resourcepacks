import fs = require("fs");
import path = require("path");
export * from "./model";
export * from "./translation";
export * as GameData from "./gamedata/index";

/**
 * Call this in your sandstone.config.ts file.
 * @deprecated This is temporary and will be removed once sandstone gains
 * the necessary features.
 */
export function setup(resourcepackPath: string) {
	fs.mkdirSync(resourcepackPath, { recursive: true });
	fs.readdirSync(resourcepackPath).forEach((entry) => {
		fs.rmSync(path.join(resourcepackPath, entry), { recursive: true });
	});
}