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

/**
 * @see https://minecraft.fandom.com/wiki/Resource_location#Java_Edition
 */
export const NAMESPACED_ID_REGEX = /^(?:(?<namespace>[a-z0-9_.\-]+):)?(?<path>[^:/]+(?:\/[^:/]+)*)$/;

export type NamespacedIdParsed = {
	namespace: string;
	path: string[];
};

export const parseNamespacedId = (
	nsid: string,
	defaultNamespace: string = "minecraft"
): NamespacedIdParsed => {
	const match = NAMESPACED_ID_REGEX.exec(nsid);
	if (!match) throw new Error(`Invalid namespaced id: '${nsid}'`);
	return {
		namespace: match.groups!.namespace || defaultNamespace,
		path: match.groups!.path!.split("/"),
	};
}

export const getResourcePath = (id: NamespacedIdParsed, dir: string, ext: string) => {
	return path.join("assets", id.namespace, dir, ...id.path) + (ext ? `.${ext}` : "");
}

// https://github.com/TheMrZZ/sandstone/issues/100
// export const TextureResource = CustomResource("texture", {
// 	dataType: "binary",
// 	extension: "png",
// 	save: saveResourcepackResource("assets", "textures")
// });