import assert = require("node:assert");
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

export type Vector4 = Vector<ArrayOfLength<4, number>>;
export type Vector3 = Vector<ArrayOfLength<3, number>>;
export type Vector2 = Vector<ArrayOfLength<2, number>>;
export class Vector<T extends number[]> {
	public readonly dimensions: T["length"];
	private readonly _values: Readonly<T>;
	constructor(
		values: T,
	) {
		this._values = values;
		this.dimensions = values.length;
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
		return this._values.slice() as T;
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

	/**
	 * Dot product
	 */
	public dot(...args: T | [Vector<T>]): number {
		if (args.length === 1) {
			const other = args[0] as Vector<T>;
			assert(other.dimensions === this.dimensions, "Vectors do not have a matching length");
			return this._values.map((n, i) => n * other._values[i as IndexOf<T>]).reduce((a, b) => a + b);
		} else {
			assert(args.length === this.dimensions, "Vectors do not have a matching length");
			return this._values.map((n, i) => n * (args as T)[i as IndexOf<T>]).reduce((a, b) => a + b);
		}
	}

	/**
	 * Applies a map function to each component
	 */
	public map(mapFn: (n: T[IndexOf<T>], i: IndexOf<T>) => number): Vector<T> {
		return new Vector(
			this._values.map(mapFn as (n: number, i: number) => number)
		) as Vector<T>;
	}

	public round(): Vector<T> {
		return this.map(Math.round);
	}
	public floor(): Vector<T> {
		return this.map(Math.floor);
	}
	public ceil(): Vector<T> {
		return this.map(Math.ceil);
	}
	public square(): Vector<T> {
		return this.map(n => n * n);
	}

	public add(vector: Vector<T>): Vector<T>;
	public add(...vector: T): Vector<T>;
	public add(all: number): Vector<T>;
	public add(...args: T | [Vector<T> | number]): Vector<T> {
		if (args.length === 1) {
			const other = args[0];
			if (other instanceof Vector) {
				assert(other.dimensions === this.dimensions, "Vectors do not have a matching length");
				return new Vector(this._values.map((n, i) => n + other._values[i as IndexOf<T>])) as Vector<T>;
			} else {
				return new Vector(this._values.map(n => n + other)) as Vector<T>;
			}
		} else {
			assert(args.length === this.dimensions, "Vectors do not have a matching length");
			return new Vector(this._values.map((n, i) => n + (args as T)[i as IndexOf<T>])) as Vector<T>;
		}
	}

	public sub(vector: Vector<T>): Vector<T>;
	public sub(...vector: T): Vector<T>;
	public sub(all: number): Vector<T>;
	public sub(...args: T | [Vector<T> | number]): Vector<T> {
		if (args.length === 1) {
			const other = args[0];
			if (other instanceof Vector) {
				assert(other.dimensions === this.dimensions, "Vectors do not have a matching length");
				return new Vector(this._values.map((n, i) => n - other._values[i as IndexOf<T>])) as Vector<T>;
			} else {
				return new Vector(this._values.map(n => n - other)) as Vector<T>;
			}
		} else {
			assert(args.length === this.dimensions, "Vectors do not have a matching length");
			return new Vector(this._values.map((n, i) => n - (args as T)[i as IndexOf<T>])) as Vector<T>;
		}
	}

	public mul(vector: Vector<T>): Vector<T>;
	public mul(...vector: T): Vector<T>;
	public mul(all: number): Vector<T>;
	public mul(...args: T | [Vector<T> | number]): Vector<T> {
		if (args.length === 1) {
			const other = args[0];
			if (other instanceof Vector) {
				assert(other.dimensions === this.dimensions, "Vectors do not have a matching length");
				return new Vector(this._values.map((n, i) => n * other._values[i as IndexOf<T>])) as Vector<T>;
			} else {
				return new Vector(this._values.map(n => n * other)) as Vector<T>;
			}
		} else {
			assert(args.length === this.dimensions, "Vectors do not have a matching length");
			return new Vector(this._values.map((n, i) => n * (args as T)[i as IndexOf<T>])) as Vector<T>;
		}
	}

	public div(vector: Vector<T>): Vector<T>;
	public div(...vector: T): Vector<T>;
	public div(all: number): Vector<T>;
	public div(...args: T | [Vector<T> | number]): Vector<T> {
		if (args.length === 1) {
			const other = args[0];
			if (other instanceof Vector) {
				assert(other.dimensions === this.dimensions, "Vectors do not have a matching length");
				return new Vector(this._values.map((n, i) => n / other._values[i as IndexOf<T>])) as Vector<T>;
			} else {
				return new Vector(this._values.map(n => n / other)) as Vector<T>;
			}
		} else {
			assert(args.length === this.dimensions, "Vectors do not have a matching length");
			return new Vector(this._values.map((n, i) => n / (args as T)[i as IndexOf<T>])) as Vector<T>;
		}
	}

	public toCoordsAbs(): VectorClass<ArrayOfLength<Length<T>, `${number}`>> {
		return new VectorClass(
			this._values.map(n => `${n}` as const) as ArrayOfLength<Length<T>, `${number}`>
		);
	}

	public toCoordsRel(): VectorClass<ArrayOfLength<Length<T>, `~${number}`>> {
		return new VectorClass(
			this._values.map(n => `~${n}` as const) as ArrayOfLength<Length<T>, `~${number}`>
		);
	}

	public toCoordsLoc(): VectorClass<ArrayOfLength<Length<T>, `^${number}`>> {
		return new VectorClass(
			this._values.map(n => `^${n}` as const) as ArrayOfLength<Length<T>, `^${number}`>
		);
	}
}