import path = require("node:path");
import fs = require("node:fs/promises");
import generateTranslationKeys from "./translation_keys";

(async () => {
	const GEN_DIR = path.join(".", "src", "generated");
	await fs.mkdir(GEN_DIR, { recursive: true });

	await Promise.all([
		generateTranslationKeys(path.join(GEN_DIR, "translation_keys.ts")),
	]);
	
})();