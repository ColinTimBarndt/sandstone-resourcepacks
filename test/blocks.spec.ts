import { assert, expect } from "chai";
import { BlockFace } from "../src/block";

describe("Block", () => {
	describe("BlockFace", () => {
		it("Should have 6 variants with lowercase names", () => {
			let i = 0;
			for (let face of BlockFace) {
				expect(face.name).to.match(/^[a-z]+$/, "Lowercase name");
				expect(face.id).to.equal(i++, `Id of ${face} is in order`);
				expect(face.isSide).to.equal(["up", "down"].indexOf(face.name) == -1, `Face ${face} is not a side if it is facing up or down`);
			}
		});
	});
});