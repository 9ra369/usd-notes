---
title: Specifiers — Learn OpenUSD
source: https://docs.nvidia.com/learn-openusd/latest/composition-basics/specifiers.html
author:
published:
created: 2026-11-19
description:
tags:
  - resources
---
## Specifiers

## What Are Specifiers?

[Specifiers](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Specifier) in OpenUSD convey the intent for how a [prim](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Prim) or a [prim spec](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Prim-Spec) should be interpreted in the composed scene. The specifier can be one of three values: `def`, `over` or `class`.

### How Does It Work?

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Specifiers_Def.webm" type="video/webm"> Your browser does not support the video tag.</video>

`def`, which is short for *[define](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Def)*, defines the prim in the current [layer](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Layer). `def` indicates a prim exists and concretely defined on the [stage](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Stage).

The resolved specifier of a prim–essentially, which specifier wins when the [composition](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Composition) is completed–determines which stage traversals (like rendering) will visit that prim. Default traversals will only visit defined (`def`), non-abstract prims. Abstract prims are those that resolve to the `class` specifiers. `over`, the weakest specifier, will resolve to either a `def` or `class` specifier.

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Specifiers_Over.webm" type="video/webm"> Your browser does not support the video tag.</video>

`over`, which is short for *[override](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Over)*, holds overrides for [opinions](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Opinions) that already exist in the composed scene on another layer. The `over` will not translate back to the original prim, and is what enables non-destructive editing workflows, such as changing a [property](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Property) of a prim, like its color, in another layer.

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Specifiers_Class.webm" type="video/webm"> Your browser does not support the video tag.</video>

A `class` prim essentially signals that it is a blueprint. `class` prims abstract and contain opinions that are meant to be composed onto other prims. It’s worth noting that `class` prims are intended as the target of a [reference](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Reference), [payload](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Payload), [inherit](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Inherit), or [specialize](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Specialize) [composition arc](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Composition-Arcs) or as a [relationship](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Relationship) target for a PointInstancer. These are concepts we’ll cover in a later lesson.

Prims that resolve to `class` specifiers will also be present and composed on a stage, but won’t be visited by default stage traversals, meaning it will be ignored by traversals such as those used for rendering.

### Working With Python

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Specifiers_Python.webm" type="video/webm"> Your browser does not support the video tag.</video>

Below is an example of how we can get or set a prim’s specifier using Python.

```python
1
# Get a prim’s specifier
2
prim.GetSpecifier()
3

4
# Set a prim’s specifier
5
prim.SetSpecifier(specifier)
```

It’s helpful to look at USDA files to understand how USD encodes specifiers in a USD layer. In this example, we’re defining a new prim called “Box” with the type Cube and a `size` property set to `4`. The `def` specifier indicates that box is being concretely defined on the stage.

```
1
def Cube "Box" {
2
    double size = 4
3
}
```

The `over` specifier sparsely modifies the `size` property without defining anything else about the prim; in this case, `size` is overriden to have a value of `10`. With an override like this, we may be trusting that the box has been defined in another layer, for example.

```
1
over "Box" {
2
    double size = 10
3
}
```

Lastly, we’re authoring a new prim as a `class` called `"_box"`. This can be used as a reusable template in the USD scene.

```
1
class "_box" {
2
    double size = 4
3
}
```

## Examples

> [!tip] Tip
> You can run these examples locally as Jupyter notebooks. See [How to Run Notebooks Locally](https://docs.nvidia.com/learn-openusd/latest/jupyter-notebook-setup.html) for setup instructions.

> [!note] Note
> Examples on this page use `create_new_stage()`, a notebook helper imported in a hidden setup cell. In your own scripts, use `Usd.Stage.CreateNew()` in its place. If you’re running the lessons from a clone of this repository, you can import the helper instead: `from lousd.utils.helperfunctions import create_new_stage`. See [How to Run Notebooks Locally](https://docs.nvidia.com/learn-openusd/latest/jupyter-notebook-setup.html) for why.

### Example 1: Authoring defs and a class in a base layer

This script defines two concrete cubes (specifier **def**) and a reusable **[class](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Class)** prim that holds a `displayColor` opinion for inheritance. The output contrasts the composed specifiers for each, showing **def** for scene geometry and **class** for abstract Prim.

```
1
from pxr import Usd, UsdGeom, Sdf, Gf
 2

 3
base_file_path = "_assets/specifiers_base.usda"
 4

 5
stage = create_new_stage(base_file_path)
 6

 7
# Create a simple scene with two cubes
 8
world = UsdGeom.Xform.Define(stage, "/World")
 9
stage.SetDefaultPrim(world.GetPrim())
10

11
box_prim_cube = UsdGeom.Cube.Define(stage, world.GetPath().AppendChild("Box"))
12
box_prim_cube.GetSizeAttr().Set(2.0)
13

14
box_2_prim_cube = UsdGeom.Cube.Define(stage, world.GetPath().AppendChild("Box_2"))
15
box_2_prim_cube.GetSizeAttr().Set(2.0)
16
box_2_api = UsdGeom.XformCommonAPI(box_2_prim_cube)
17
box_2_api.SetTranslate(Gf.Vec3d(5, 0, 0))
18

# Define a class prim with a displayColor primvar
20
class_prim = stage.CreateClassPrim(world.GetPath().AppendPath("_Look/_green"))
21
class_prim_primvar_api = UsdGeom.PrimvarsAPI(class_prim)
22
class_prim_primvar_api.CreatePrimvar("displayColor", Sdf.ValueTypeNames.Color3fArray).Set([Gf.Vec3f(0.1, 0.8, 0.2)])
23

# Inspect specifiers
25
print("box specifier:", box_prim_cube.GetPrim().GetSpecifier())  # Sdf.SpecifierDef
26
print("box_2 specifier:", box_2_prim_cube.GetPrim().GetSpecifier())  # Sdf.SpecifierDef
27
print("class_prim specifier:", class_prim.GetSpecifier())  # e.g. Sdf.SpecifierClass
28

29
stage.Save()
```

```
box specifier: Sdf.SpecifierDef
box_2 specifier: Sdf.SpecifierDef
class_prim specifier: Sdf.SpecifierClass
```

```python
#usda 1.0
(
    defaultPrim = "World"
)

def Xform "World"
{
    def Cube "Box"
    {
        double size = 2
    }

    def Cube "Box_2"
    {
        double size = 2
        double3 xformOp:translate = (5, 0, 0)
        uniform token[] xformOpOrder = ["xformOp:translate"]
    }

    def "_Look"
    {
        class "_green"
        {
            color3f[] primvars:displayColor = [(0.1, 0.8, 0.2)]
        }
    }
}
```

### Example 2: Non‑destructive over edits and class inherit

This script sublayers the base file, authors an [over](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Over) on `/World/Box` to change `size`, and adds an **inherits** arc so the box picks up the class color. The prim‑stack printout makes it clear that the strong layer contributes over while the base contributes def, and the class opinions are applied via the inherit.

```
1
from pxr import Usd, UsdGeom, Sdf
 2

 3
new_file_path = "_assets/specifiers_over_base.usda"
 4
base_file_path = "specifiers_base.usda"  # path relative to the new file
 5

 6
stage = create_new_stage(new_file_path)
 7

 8
# Base is weaker than the root layer (root opinions are strongest)
 9
stage.GetRootLayer().subLayerPaths = [base_file_path]
10

11
prim_path = "/World/Box"
12

# Author an override for the same prim
14
stage.OverridePrim(prim_path)
15

# Get the cube and change its size
17
box_prim_cube = UsdGeom.Cube.Get(stage, prim_path)
18
box_prim_cube.GetSizeAttr().Set(4.0)
19

# Compose the class onto the box using an inherit arc
21
box_prim_cube.GetPrim().GetInherits().AddInherit(Sdf.Path("/World/_Look/_green"))
22

# SdfPrimSpec handles, ordered strong to weak
24
for prim_spec in box_prim_cube.GetPrim().GetPrimStack():
25
    print(" - layer:", prim_spec.layer.identifier.split('/')[-1], "specifier:", prim_spec.specifier)
26

27
stage.Save()
```

```
- layer: specifiers_over_base.usda specifier: Sdf.SpecifierOver
- layer: specifiers_base.usda specifier: Sdf.SpecifierDef
- layer: specifiers_base.usda specifier: Sdf.SpecifierClass
```

```python
#usda 1.0
(
    subLayers = [
        @specifiers_base.usda@
    ]
)

over "World"
{
    over "Box" (
        prepend inherits = </World/_Look/_green>
    )
    {
        double size = 4
    }
}
```