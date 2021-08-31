import * as path from "node:path";
import { CustomResource, CustomResourceSave } from "sandstone";

export const saveResourcepackResource =
	(assetPath: string): CustomResourceSave =>
		({ saveType, packName, saveLocation }): string => {
			if (saveType === "root") {
				return path.join(saveLocation!, "..", "resourcepacks", packName, "assets", assetPath);
			}
			if (saveType === "world") {
				return path.join(saveLocation!, "..", "..", "resourcepacks", packName, "assets", assetPath);
			}
			if (saveType === "custom-path") {
				return path.join(saveLocation!, "../", packName + "-resources", "assets", assetPath);
			}
			throw new Error("Invalid saveType: " + saveType);
		}

export const FontResource = CustomResource("font", {
	dataType: "json",
	extension: "json",
	save: saveResourcepackResource("font")
});

export const TextureResource = CustomResource("texture", {
	dataType: "raw",
	extension: "png",
	save: saveResourcepackResource("textures")
});