import assert = require("assert");
import { VectorClass } from "sandstone";

/**
 * All possible values of an index for a specific array as a type.
 * @example
 * ```ts
 * const array = [2, 3, 6, 9, "f"] as const;
 * type Index = 0 | 1 | 2 | 3 | 4;
 * type Index = IndexOf<typeof array>;
 * ```
 */
export type IndexOf<A extends unknown[] | readonly unknown[]> = _IndexOf<A>;
type _IndexOf<A extends unknown[] | readonly unknown[], _S extends number[] = []> =
	_S["length"] extends A["length"]
	? _S[number]
	: _IndexOf<A, [_S["length"], ..._S]>;
/**
 * An array of type T with length L.
 * This is a short way of writing homogenous array types with a fixed length
 * and is at the same time more readable.
 * @example
 * ```ts
 * type Vec4 = [number, number, number, number];
 * type Vec4 = ArrayOfLength<4, number>;
 * ```
 */
export type ArrayOfLength<L extends number, T> = _ArrayOfLength<L, T>;
type _ArrayOfLength<L extends number, T, _S extends T[] = []> =
	_S["length"] extends L
	? _S
	: _ArrayOfLength<L, T, [..._S, T]>;

/**
 * Enumerates all numbers from 0 to exlusively A as a type.
 * @example
 * ```ts
 * type Digits = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
 * type Digits = EnumerateInt<10>;
 * ```
 */
export type EnumerateInt<A extends number> = _EnumerateInt<A>;
type _EnumerateInt<A extends number, _S extends number[] = []> =
	A extends _S["length"] ? _S[number] : _EnumerateInt<A, [..._S, _S["length"]]>;

/**
 * Enumerates all numbers from A to exclusively B as a type.
 * @example
 * ```
 * type Nums = 2 | 3 | 4 | 5;
 * type Nums = EnumerateRange<2, 6>;
 * ```
 */
export type EnumerateRange<A extends number, B extends number> = _EnumerateRange<B, ArrayOfLength<A, 0>>;
type _EnumerateRange<A extends number, B extends number[], C extends number[] = []> =
	A extends B["length"]
	? C[number]
	: _EnumerateRange<A, [...B, 0], [...C, B["length"]]>;

/**
 * Get the length of an array as a type.
 */
export type Length<A extends unknown[] | readonly unknown[]> = A["length"];

type Stringifyable = string | number | bigint | boolean | null | undefined;
type StringifyList<L extends Stringifyable[] | readonly Stringifyable[]> = _StringifyList<L>;
type _StringifyList<L extends Stringifyable[] | readonly Stringifyable[], R extends string[] = []> =
	L["length"] extends R["length"]
	? R
	: _StringifyList<L, [...R, `${L[R["length"]]}`]>;
type PrefixStrings<P extends Stringifyable, S extends Stringifyable[] | readonly Stringifyable[]> = _PrefixStrings<P, S>;
type _PrefixStrings<P extends Stringifyable, S extends Stringifyable[] | readonly Stringifyable[], R extends string[] = []> =
	S["length"] extends R["length"]
	? R
	: _PrefixStrings<P, S, [...R, `${P}${S[R["length"]]}`]>;

// Compatible vector / array
type CArray<T extends readonly number[]> = ArrayOfLength<T["length"], number>;
type CVector<T extends readonly number[]> = Vector<CArray<T>>;

export type Vector4 = Vector<ArrayOfLength<4, number>>;
export type Vector3 = Vector<ArrayOfLength<3, number>>;
export type Vector2 = Vector<ArrayOfLength<2, number>>;
export class Vector<T extends number[]> {
	public readonly dimensions: T["length"];
	private readonly _values: Readonly<T>;

	/**
	 * This is a strict vector constructor. In some cases it is useful because
	 * Typescript knows the exact inner values, though this may lead to some type
	 * incompatibility issues. Prefer to use the dedicated `vec2/3/4/N` functions.
	 */
	public constructor(vector: Readonly<T> | Vector<T>);
	public constructor(...vector: T);
	public constructor(...args: T | [T] | [Vector<T>]) {
		if (typeof args[0] === "number") {
			this._values = args.slice() as T;
		} else {
			const arg = args[0] as T | Vector<T>;
			if (arg instanceof Vector) {
				this._values = arg._values;
			} else {
				this._values = arg;
			}
		}
		this.dimensions = args.length;
		Object.freeze(this._values);
		Object.freeze(this);
	}

	/**
	 * Gets a component of this vector
	 */
	public get<I extends IndexOf<T>>(idx: I): T[I];
	public get(idx: number): T[number] | undefined;
	public get(idx: number): T[number] | undefined {
		return this._values[idx];
	}
	public get components(): T {
		return Object.freeze(this._values.slice()) as T;
	}

	public get lengthSquared() {
		return this._values.reduce((a, b) => a + b * b, 0);
	}

	public get length() {
		return Math.sqrt(this.lengthSquared);
	}

	public [Symbol.iterator]() {
		return this._values[Symbol.iterator]();
	}
	public every(predicate: (value: T[IndexOf<T>], index: IndexOf<T>) => boolean): boolean {
		return this._values.every(predicate as any);
	}

	/**
	 * Dot product
	 */
	public dot(...vector: CArray<T>): number;
	public dot(...vector: [CVector<T>]): number;
	public dot(...args: CArray<T> | [CVector<T>]): number {
		// @ts-ignore TS is broken here
		if (typeof args[0] === "number") {
			// @ts-ignore TS is broken here
			assert(args.length === this.dimensions, "Vectors do not have a matching length");
			return this._values.map((n, i) => n * (args as T)[i as IndexOf<T>]).reduce((a, b) => a + b);
		} else {
			// @ts-ignore TS is broken here
			const other = args[0] as Vector<T>;
			assert(other.dimensions === this.dimensions, "Vectors do not have a matching length");
			return this._values.map((n, i) => n * other._values[i as IndexOf<T>]).reduce((a, b) => a + b);
		}
	}

	/**
	 * Applies a map function to each component
	 */
	public map(mapFn: (n: T[IndexOf<T>], i: IndexOf<T>) => number): CVector<T> {
		// @ts-ignore TS can't handle the types
		return new Vector(
			this._values.map(mapFn as (n: number, i: number) => number)
		) as CVector<T>;
	}

	public round(): Vector<T> {
		// @ts-ignore TS broken https://github.com/Microsoft/TypeScript/issues/29112
		return this.map(Math.round);
	}
	public floor(): Vector<T> {
		// @ts-ignore TS broken https://github.com/Microsoft/TypeScript/issues/29112
		return this.map(Math.floor);
	}
	public ceil(): Vector<T> {
		// @ts-ignore TS broken https://github.com/Microsoft/TypeScript/issues/29112
		return this.map(Math.ceil);
	}
	public square(): Vector<T> {
		// @ts-ignore TS broken https://github.com/Microsoft/TypeScript/issues/29112
		return this.map(n => n * n);
	}

	public add(vector: CVector<T>): CVector<T>;
	public add(...vector: CArray<T>): CVector<T>;
	public add(all: number): CVector<T>;
	public add(...args: CArray<T> | [CVector<T>] | [number]): CVector<T> {
		// @ts-ignore TS is broken here
		if (typeof args[0] === "number") {
			// @ts-ignore TS is broken here
			assert(args.length === this.dimensions, "Vectors do not have a matching length");
			// @ts-ignore TS can't handle the types
			return new Vector(
				Object.freeze(this._values.map((n, i) => n + (args as any)[i]))
			) as Vector<T>;
		} else {
			// @ts-ignore TS is broken here
			const other = args[0];
			if (other instanceof Vector) {
				assert(other.dimensions === this.dimensions, "Vectors do not have a matching length");
				return new Vector<CArray<T>>(
					Object.freeze(this._values.map<number>((n, i) => n + other._values[i]!) as any)
				) as unknown as CVector<T>;
			} else {
				return new Vector(
					Object.freeze(this._values.map(n => n + other))
				) as unknown as CVector<T>;
			}
		}
	}

	public sub(vector: CVector<T>): CVector<T>;
	public sub(...vector: CArray<T>): CVector<T>;
	public sub(all: number): CVector<T>;
	public sub(...args: CArray<T> | [CVector<T>] | [number]): CVector<T> {
		// @ts-ignore TS is broken here
		if (typeof args[0] === "number") {
			// @ts-ignore TS is broken here
			assert(args.length === this.dimensions, "Vectors do not have a matching length");
			// @ts-ignore TS can't handle the types
			return new Vector(
				Object.freeze(this._values.map((n, i) => n - (args as any)[i]))
			) as Vector<T>;
		} else {
			// @ts-ignore TS is broken here
			const other = args[0];
			if (other instanceof Vector) {
				assert(other.dimensions === this.dimensions, "Vectors do not have a matching length");
				return new Vector<CArray<T>>(
					Object.freeze(this._values.map<number>((n, i) => n - other._values[i]!) as any)
				) as unknown as CVector<T>;
			} else {
				return new Vector(
					Object.freeze(this._values.map(n => n - other))
				) as unknown as CVector<T>;
			}
		}
	}

	public mul(vector: CVector<T>): CVector<T>;
	public mul(...vector: CArray<T>): CVector<T>;
	public mul(all: number): CVector<T>;
	public mul(...args: CArray<T> | [CVector<T>] | [number]): CVector<T> {
		// @ts-ignore TS is broken here
		if (typeof args[0] === "number") {
			// @ts-ignore TS is broken here
			assert(args.length === this.dimensions, "Vectors do not have a matching length");
			// @ts-ignore TS can't handle the types
			return new Vector(
				Object.freeze(this._values.map((n, i) => n * (args as any)[i]))
			) as Vector<T>;
		} else {
			// @ts-ignore TS is broken here
			const other = args[0];
			if (other instanceof Vector) {
				assert(other.dimensions === this.dimensions, "Vectors do not have a matching length");
				return new Vector<CArray<T>>(
					Object.freeze(this._values.map<number>((n, i) => n * other._values[i]!) as any)
				) as unknown as CVector<T>;
			} else {
				return new Vector(
					Object.freeze(this._values.map(n => n * other))
				) as unknown as CVector<T>;
			}
		}
	}

	public div(vector: CVector<T>): CVector<T>;
	public div(...vector: CArray<T>): CVector<T>;
	public div(all: number): CVector<T>;
	public div(...args: CArray<T> | [CVector<T>] | [number]): CVector<T> {
		// @ts-ignore TS is broken here
		if (typeof args[0] === "number") {
			// @ts-ignore TS is broken here
			assert(args.length === this.dimensions, "Vectors do not have a matching length");
			// @ts-ignore TS can't handle the types
			return new Vector(
				Object.freeze(this._values.map((n, i) => n / (args as any)[i]))
			) as Vector<T>;
		} else {
			// @ts-ignore TS is broken here
			const other = args[0];
			if (other instanceof Vector) {
				assert(other.dimensions === this.dimensions, "Vectors do not have a matching length");
				return new Vector<CArray<T>>(
					Object.freeze(this._values.map<number>((n, i) => n / other._values[i]!) as any)
				) as unknown as CVector<T>;
			} else {
				return new Vector(
					Object.freeze(this._values.map(n => n / other))
				) as unknown as CVector<T>;
			}
		}
	}

	public toCoordsAbs(): VectorClass<StringifyList<T>> {
		return new VectorClass(
			this._values.map(n => `${n}` as const) as StringifyList<T>
		);
	}

	public toCoordsRel(): VectorClass<PrefixStrings<"~", T>> {
		return new VectorClass(
			this._values.map(n => `~${n}` as const) as PrefixStrings<"~", T>
		);
	}

	public toCoordsLoc(): VectorClass<PrefixStrings<"^", T>> {
		return new VectorClass(
			this._values.map(n => `^${n}` as const) as PrefixStrings<"^", T>
		);
	}
}

export namespace Vector2 {
	export const ZERO: Vector2 = new Vector(0, 0);
	export const ONE: Vector2 = new Vector(1, 1);
}

export function vec2(x: number, y: number): Vector2;
export function vec2(array: ArrayOfLength<2, number>): Vector2;
export function vec2(vector: Vector2): Vector2;
export function vec2(x: number | ArrayOfLength<2, number> | Vector2, y?: number): Vector2 {
	if (typeof x === "number")
		return new Vector(x, y!);
	return new Vector(x);
}

export namespace Vector3 {
	export const ZERO: Vector3 = new Vector(0, 0, 0);
	export const ONE: Vector3 = new Vector(1, 1, 1);
}

export function vec3(x: number, y: number, z: number): Vector3;
export function vec3(array: ArrayOfLength<3, number>): Vector3;
export function vec3(vector: Vector3): Vector3;
export function vec3(x: number | ArrayOfLength<3, number> | Vector3, y?: number, z?: number): Vector3 {
	if (typeof x === "number")
		return new Vector(x, y!, z!);
	return new Vector(x);
}

export namespace Vector4 {
	export const ZERO: Vector4 = new Vector(0, 0, 0, 0);
	export const ONE: Vector4 = new Vector(1, 1, 1, 1);
}

export function vec4(x: number, y: number, z: number, w: number): Vector4;
export function vec4(array: ArrayOfLength<4, number>): Vector4;
export function vec4(vector: Vector4): Vector4;
export function vec4(x: number | ArrayOfLength<4, number> | Vector4, y?: number, z?: number, w?: number): Vector4 {
	if (typeof x === "number")
		return new Vector(x, y!, z!, w!);
	return new Vector(x);
}

export function vecN<N extends number>(...comps: ArrayOfLength<N, number>): Vector<ArrayOfLength<N, number>>;
export function vecN<N extends number>(array: ArrayOfLength<N, number>): Vector<ArrayOfLength<N, number>>;
export function vecN<N extends number>(vector: ArrayOfLength<N, number>): Vector<ArrayOfLength<N, number>>;
export function vecN<N extends number>(...args: ArrayOfLength<N, number> | [ArrayOfLength<N, number> | Vector<ArrayOfLength<N, number>>]): Vector<ArrayOfLength<N, number>> {
	if (typeof (args as unknown[])[0] === "number")
		return new Vector(args as ArrayOfLength<N, number>);
	return new Vector((args as unknown[])[0] as ArrayOfLength<N, number> | Vector<ArrayOfLength<N, number>>);
}
