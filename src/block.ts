import { VectorClass } from "sandstone";

export type BlockFaceName = "north" | "east" | "south" | "west" | "up" | "down";
export type BlockAxisName = "x" | "y" | "z";

export class BlockFace {
	public static readonly North = new BlockFace("north", 0, [0, 0, -1], "South");
	public static readonly East = new BlockFace("east", 1, [1, 0, 0], "West");
	public static readonly South = new BlockFace("south", 2, [0, 0, 1], "North");
	public static readonly West = new BlockFace("west", 3, [-1, 0, 0], "East");
	public static readonly Up = new BlockFace("up", 4, [0, 1, 0], "Down");
	public static readonly Down = new BlockFace("down", 5, [0, -1, 0], "Up");

	public static fromName(name: BlockFaceName): BlockFace;
	public static fromName(name: string): BlockFace | null;
	public static fromName(name: string): BlockFace | null {
		switch (name) {
			case "north": return this.North;
			case "east": return this.East;
			case "south": return this.South;
			case "west": return this.West;
			case "up": return this.Up;
			case "down": return this.Down;
			default: return null;
		}
	}
	public static get [Symbol.iterator]() {
		return BLOCK_FACES[Symbol.iterator];
	}
	public static get filter() {
		return BLOCK_FACES.filter;
	}
	public static forEach(callback: (face: BlockFace, id: number) => void) {
		BLOCK_FACES.forEach((face, id) => callback(face, id));
	}

	public readonly opposite!: BlockFace;
	public readonly normal: VectorClass<[number, number, number]>;
	public readonly isSide: boolean;
	public readonly axis: BlockAxisName;

	private constructor(
		public readonly name: BlockFaceName,
		public readonly id: 0 | 1 | 2 | 3 | 4 | 5,
		normal: [number, number, number],
		opposite: keyof typeof BlockFace,
	) {
		this.normal = new VectorClass(normal);
		if (normal[0] !== 0) this.axis = "x";
		else if (normal[1] !== 0) this.axis = "y";
		else this.axis = "z";
		this.isSide = this.axis !== "y";
		// temporary
		(this as any).opposite = opposite;
	}

	public toString(): string {
		return this.name;
	}
	public toJSON(): string {
		return this.name;
	}
}

const BLOCK_FACES = Object.freeze([
	BlockFace.North,
	BlockFace.East,
	BlockFace.South,
	BlockFace.West,
	BlockFace.Up,
	BlockFace.Down,
] as const);

BlockFace.forEach(face => {
	const opp: keyof typeof BlockFace = face.opposite as any;
	(face as any).opposite = BlockFace[opp];
});