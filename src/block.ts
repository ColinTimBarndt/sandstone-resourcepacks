import { Vector, ArrayOfLength, EnumerateInt } from "./math";

export type BlockFaceName = "north" | "east" | "south" | "west" | "up" | "down";
export type BlockAxisName = "x" | "y" | "z";

type Unconst<A extends readonly unknown[], _S extends unknown[] = []> =
	A["length"] extends _S["length"]
	? _S
	: Unconst<A, [..._S, A[_S["length"]]]>;

export class BlockFace<
	Name extends BlockFaceName = BlockFaceName,
	Idx extends EnumerateInt<6> = EnumerateInt<6>,
	Normal extends Readonly<ArrayOfLength<3, -1 | 0 | 1>> = Readonly<ArrayOfLength<3, -1 | 0 | 1>>,
	OppositeName extends "North" | "East" | "South" | "West" | "Up" | "Down" = "North" | "East" | "South" | "West" | "Up" | "Down"
	> {
	public static readonly North = new BlockFace("north" as const, 0, [0, 0, -1] as const, "South" as const);
	public static readonly East = new BlockFace("east" as const, 1, [1, 0, 0] as const, "West" as const);
	public static readonly South = new BlockFace("south" as const, 2, [0, 0, 1] as const, "North" as const);
	public static readonly West = new BlockFace("west" as const, 3, [-1, 0, 0] as const, "East" as const);
	public static readonly Up = new BlockFace("up" as const, 4, [0, 1, 0] as const, "Down" as const);
	public static readonly Down = new BlockFace("down" as const, 5, [0, -1, 0] as const, "Up" as const);

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

	public readonly opposite!: (typeof BlockFace)[OppositeName];
	public readonly normal: Vector<Unconst<Normal>>;
	public readonly isSide: Name extends "north" | "east" | "south" | "west" ? true : false;
	public readonly axis: Name extends "east" | "west" ? "x" : Name extends "up" | "down" ? "y" : "z";

	private constructor(
		public readonly name: Name,
		public readonly id: Idx,
		normal: Normal,
		opposite: OppositeName,
	) {
		this.normal = new Vector(normal as Unconst<typeof normal>);
		if (normal[0] !== 0) this.axis = "x" as any;
		else if (normal[1] !== 0) this.axis = "y" as any;
		else this.axis = "z" as any;
		this.isSide = (this.axis !== "y") as any;
		// is set correctly later
		(this as any).opposite = opposite;
	}

	public toString(): Name {
		return this.name;
	}
	public toJSON(): Name {
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