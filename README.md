<div align="center"><img src="./icon.png"/></div>

# Sandstone Resourcepacks

![License](https://img.shields.io/github/license/ColinTimBarndt/sandstone-resourcepacks)
![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/ColinTimBarndt/sandstone-resourcepacks/Run%20Tests/master?label=tests)

Sandstone Resourcepacks is an unofficial library for [Sandstone]. It allows
generation, modification and merging of Minecraft resource packs.

[Sandstone]: https://github.com/TheMrZZ/sandstone

## Features

This library is work in progress and requires Sandstone alpha.

- [x] Models
- [x] Blockstates (TODO: utility class)
- [x] Translations
- [x] Fonts
- [x] Translations
- [ ] Textures
- [ ] Sounds

### Models

#### Creating

It is possible to create `ModelData` using either a utility function or by
writing the data yourself as it is completely type-safe using Typescript.

```ts
// Generated model from the barrier texture
const modelData = ModelData.generatedItem("minecraft:item/barrier");
// Save it
const resource = ModelResource.create("my_pack:barrier", modelData);
```

```ts
// Block/Item model for oak planks
const modelData: ModelData = {
  parent: "minecraft:block/cube_all",
  textures: {
    all: "minecraft:oak_planks",
    particle: "minecraft:oak_planks"
  }
};
```

#### Loading

Assets can be loaded from vanilla minecraft and/or resourcepacks. Create a
`ResourceLoader` specify your resourcepacks and minecraft version.

```ts
// Load the barrel model from the vanilla assets
const loader = new ResourceLoader({
  loadVanilla: "1.17.1"
});
const modelData = await ModelData.load(loader, "minecraft:block/barrel");
```

### Strictly-typed vector math

This library includes a small but type-strong vector math library. Here are
some examples:

```ts
const v1 = vec3(5, 5, 4);
const v2 = vec3([1, 0, 1]);
const v3 = v1.mul(v2); // returns Vector(5, 0, 4)

const len = v3.length; // returns Math.sqrt(41)
const dot = v1.dot(v2); // returns 9

// Any dimensions of a vector supported
const uvxy = vecN<6>(0, 0, 16, 16, 0, 0)
    .add(1, 1, -1, -1, 10, 10)
    .mul(0.5);

uv.add(v1); // Error! (incompatible dimensions)

const constVec = new Vector(5, 5, 4);
// Typescript knows the exact value of this vector and computes the exact result
// of this function as a type
const rel: VectorClass<["~5", "~5", "~4"]> = constVec.toCoordsRel();
```