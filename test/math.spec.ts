import { expect } from "chai";
import { VectorClass } from "sandstone";
import { vec3, Vector, Vector3 } from "../src/math";

describe("Math", () => {
	describe("Vector", () => {
		it("Can be initialized", () => {
			let arr: [number, number, number] = [5, 5, 5];
			let a = new Vector(arr) as Vector3;
			let b = new Vector(5, 5, 5);
			new Vector(a);
			new Vector(b);
		});
		it("Can be converted to coordinates", () => {
			const arr = new Vector(1, 2, 3);
			const abs: VectorClass<["1", "2", "3"]> = arr.toCoordsAbs();
			const rel: VectorClass<["~1", "~2", "~3"]> = arr.toCoordsRel();
			const loc: VectorClass<["^1", "^2", "^3"]> = arr.toCoordsLoc();
		});
		it("Can be perfomed vector operations on", () => {
			const v1 = vec3(60, 0, 120);
			const v2 = vec3(0, 30, 0);
			expect(v1.dot(v2)).to.equal(0);
			expect(v1.length).to.equal(Math.sqrt(60*60 + 120*120));
			expect(v2.length).to.equal(30);
		});
	});
});