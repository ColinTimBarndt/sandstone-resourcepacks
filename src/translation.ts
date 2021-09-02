import { CustomResource } from "sandstone";
import { getResourcePath, parseNamespacedId, saveResourcepackResource } from "./resource";
import { TRANSLATION_KEY } from "./generated/translation_keys";
import { ResourceLoader } from "./gamedata";

export * from "./generated/translation_keys";
export const TranslationResource = CustomResource("translation", {
	dataType: "json",
	extension: "json",
	save: saveResourcepackResource("assets", "lang")
});


export type TranslationData =
	| Partial<Record<TRANSLATION_KEY, string>>
	| { [key: string]: string; };

export namespace TranslationData {
	export async function load(loader: ResourceLoader, id: string): Promise<TranslationData | null> {
		const parsedId = parseNamespacedId(id);
		const rPath = getResourcePath(parsedId, "lang", "json");
		const data = await loader.readResourceFile(rPath);
		if (data === null) return null;
		else return JSON.parse(data.toString("utf8"));
	}
}