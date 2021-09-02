import * as path from "node:path";
import { CustomResource, CustomResourceSave } from "sandstone";

export const saveResourcepackResource =
	(...assetPath: string[]): CustomResourceSave =>
		({ saveType, packName, saveLocation }): string => {
			if (saveType === "root") {
				return path.join(saveLocation!, "..", "resourcepacks", packName, ...assetPath);
			}
			if (saveType === "world") {
				return path.join(saveLocation!, "..", "..", "resourcepacks", packName, ...assetPath);
			}
			if (saveType === "custom-path") {
				return path.join(saveLocation!, "../", packName + "-resources", ...assetPath);
			}
			throw new Error("Invalid saveType: " + saveType);
		}

export const FontResource = CustomResource("font", {
	dataType: "json",
	extension: "json",
	save: saveResourcepackResource("assets", "font")
});

// https://github.com/TheMrZZ/sandstone/issues/100
// export const TextureResource = CustomResource("texture", {
// 	dataType: "binary",
// 	extension: "png",
// 	save: saveResourcepackResource("assets", "textures")
// });