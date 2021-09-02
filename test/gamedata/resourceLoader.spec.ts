import { expect } from "chai";
import path = require("node:path");
import { ResourceLoader } from "../../src/gamedata/index";

describe("Resource Loader", function() {
	describe("Network", function() {
		// Can't test speed here because depends on the individual network speed.
		this.timeout("30s");
		this.slow("30s");
		it("Should load vanilla Minecraft resources", async () => {
			const loader = new ResourceLoader({
				includePacks: [],
				loadPacks: [],
				loadVanilla: "1.17.1"
			});
			const modelRaw = await loader.readResourceFile(path.join(
				"assets", "minecraft", "models", "block", "cube.json"
			));
			expect(modelRaw).not.to.equal(null, "Cube block model must be loadable");
			const modelData = JSON.parse(modelRaw!.toString("utf8"));
		});
	});

	// Loading files is slow
	this.timeout("4s");
	this.slow("2s");
	it("Loads assets from specified resourcepacks in order", async () => {
		{
			const loader = new ResourceLoader({
				includePacks: [
					path.join(__dirname, "resourcepacks", "test-pack-1"),
					path.join(__dirname, "resourcepacks", "test-pack-zip.zip"),
				],
				loadPacks: [
					path.join(__dirname, "resourcepacks", "test-pack-2"),
				]
			});
			const testFileRaw = await loader.readResourceFile(path.join(
				"assets", "minecraft", "custom", "test.txt"
			));
			expect(testFileRaw).not.to.equal(null, "Test file must be loadable");
			expect(testFileRaw!.toString("utf8").trim()).to.equal("1");
		}
		{
			const loader = new ResourceLoader({
				includePacks: [
					path.join(__dirname, "resourcepacks", "test-pack-zip.zip"),
					path.join(__dirname, "resourcepacks", "test-pack-1"),
				],
				loadPacks: []
			});
			const testFileRaw = await loader.readResourceFile(path.join(
				"assets", "minecraft", "custom", "test.txt"
			));
			expect(testFileRaw).not.to.equal(null, "Test file must be loadable");
			expect(testFileRaw!.toString("utf8").trim()).to.equal("zip");
		}
	});
});