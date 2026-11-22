---
title: Schemas — Learn OpenUSD
source: https://docs.nvidia.com/learn-openusd/latest/scene-description-blueprints/schemas.html
author:
published:
created: 2026-11-21
description:
tags:
  - resources
---
## Schemas

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Schema_Definition.webm" type="video/webm"> Your browser does not support the video tag.</video>

[Schemas](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Schema) give meaning to [prims](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Prim) in OpenUSD, i.e., “What is this element? What capabilities does it have?”. Schemas define the data models and optional API for encoding and interchanging 3D and non-3D concepts through OpenUSD.

We’ll explore the different types of schemas, their characteristics, and how they enable the creation of sophisticated virtual worlds and digital twins.

## What Are Schemas?

Schemas serve as blueprints that author and retrieve data, like [attributes](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Attribute) and [relationships](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Relationship) that govern behaviors of elements in a USD scene.

Each prim in a scene is an element that implicitly contains the [properties](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Property) and [fallback](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Fallback) values of the typed schema that’s telling the prim what it is. For example, the `radius` attribute for the `Sphere` schema is defined as `double radius = 1` meaning that all Sphere prims have a radius represented by a double-precision floating point number with a value of `1` by default.

Schemas are primarily data models with documented rules on how the data should be interpreted. While schemas define the structure and rules, they do not necessarily include the implementation of behaviors. For example, the `UsdPhysics` schemas does not come with a physics engine. Developers may provide behaviors in the schema API, but this is not a requirement.

There is a trend toward codeless schemas for easier distribution, suggesting that schemas might become more lightweight, focusing on data modeling rather than behavior implementation.

Actual behavior enforcement can be managed by other subsystems within the runtime ecosystem. This allows for flexibility and performance optimization based on different use cases.

There are two types of schemas used with OpenUSD: [IsA schemas](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-IsA-Schema) and [API schemas](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-API-Schema). Let’s talk about IsA schemas first.

### IsA Schemas

IsA schemas, also known as Typed schemas or Prim schemas, essentially tell a prim what it is. Because of this, each prim can only subscribe to one IsA schema at a time.

We use the `typeName` metadata to assign an IsA schema to a prim.

IsA schemas are derived from the core class `UsdTyped`, the base class for all typed schemas, which is why we hear IsA schemas referred to as “typed” schemas.

These schemas can either be concrete (instantiable) or abstract (non-concrete, serve as base classes). We refer to a schema as concrete when the schema can be instantiated as prims in the USD scene, as we see with `UsdGeomMesh` and `UsdGeomScope`. Concrete schemas provide both a name and a typeName in the schema definition.

Meanwhile, abstract, or non-concrete schemas, provide a name but no typeName in the schema definition. This enables them to serve as a base class for related sets of concrete schemas, the way `UsdGeomPointBased` serves as a base class for geometric objects that contain points, like meshes (`UsdGeomMesh`), or basis curves (`UsdGeomBasisCurves`).

### API Schemas

In addition to IsA schemas, we have API schemas. API schemas are similar to IsA schemas except it does not specify a typeName. Since it does not have a typeName they are considered to be non-concrete.

API schemas are typically named with the suffix “API” in their C++ or Python class name, such as `UsdShadeConnectableAPI`. Properties that belong to an API schema are namespaced with the schemas base name and camelCased. For example, `UsdPhysics.RigidBodyAPI.CreateVelocityAttr()` will create an attribute named `physics:velocity`.

API schemas can be classified as non-applied or applied schemas, and single-apply or multiple-apply, where single-apply API schemas are applied to only a single instance of a prim, and multiple-apply API schemas can be applied multiple times to the same prim with different instance names.

Unlike IsA schemas, API schemas do not assign a typeName to a prim. Instead, are list-edited in the `apiSchemas` metadata and queryable via the `HasAPI` method. API schemas are assigned to already-typed prims to annotate them with additional properties that govern behaviors.

### Working With Python

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Schema_Main.webm" type="video/webm"> Your browser does not support the video tag.</video>

In Python, we can work with schemas using the following methods:

```python
1
# Retrieve the schema info for a registered schema
2
Usd.SchemaRegistry.FindSchemaInfo()
3

4
# Retrieve the schema typeName
5
Usd.SchemaRegistry.GetSchemaTypeName()
```

These methods allow us to interact with and manipulate schemas programmatically, enabling us to create, modify, and validate USD [assets](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Asset) based on predefined rules and conventions.

Let’s look at some common built-in schemas that will come up as we are learning about OpenUSD.

#### IsA Schemas

##### UsdGeomSphere

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Schema_UsdGeom.webm" type="video/webm"> Your browser does not support the video tag.</video>

`UsdGeom` defines schemas for representing geometric objects, such as meshes, cameras, and curves as mentioned above. It also includes schemas for transformations, [visibility](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Visibility), and other common [properties](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Property).

```python
1
# Import related classes
2
from pxr import UsdGeom
3

4
# Define a sphere in the stage
5
sphere = UsdGeom.Sphere.Define(stage, "/World/Sphere")
6
    
7
# Get and Set the radius attribute of the sphere
8
sphere.GetRadiusAttr().Set(10)
```

##### UsdLuxDiskLight

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Schema_UsdLux.webm" type="video/webm"> Your browser does not support the video tag.</video>

`UsdLux` defines schemas for representing light sources in a scene. It includes schemas such as sphere lights, disk lights, and distant lights, which were discussed in the lesson on USD lights.

Examples include `UsdLuxDiskLight`, `UsdLuxRectLight`, and `UsdLuxSphereLight`. These schemas bring properties relevant to each light type (e.g. radius for UsdLuxDiskLight). These attributes in combination with the attributes defined by the LightAPI schema (e.g. Intensity) allow us to fully define a light.

```python
1
# Import related classes
 2
from pxr import UsdLux
 3

 4
# Define a disk light in the stage
 5
disk_light = UsdLux.DiskLight.Define(stage, "/World/Lights/DiskLight")
 6
    
 7
# Get all Attribute names that are a part of the DiskLight schema
 8
dl_attribute_names = disk_light.GetSchemaAttributeNames()
 9
    
10
# Get and Set the radius and intensity of the disk light prim
11
disk_light.GetRadiusAttr().Set(0.4)  # from DiskLight typed schema
12
disk_light.GetIntensityAttr().Set(1000)  # from LightAPI
```

#### API Schemas

##### UsdPhysicsRigidBodyAPI

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Schema_UsdPhysics.webm" type="video/webm"> Your browser does not support the video tag.</video>

`UsdPhysicsRigidBodyAPI` adds physics properties to any `UsdGeomXformable` object for simulation such as rigid body dynamics.

```python
1
# Import related classes
 2
from pxr import Gf, Usd, UsdGeom, UsdPhysics
 3

 4
# Create a stage and define a cube prim
 5
stage = Usd.Stage.CreateInMemory()
 6
cube = UsdGeom.Cube.Define(stage, "/World/Cube")
 7

 8
# Apply a UsdPhysics Rigidbody API on the cube prim
 9
cube_rb_api = UsdPhysics.RigidBodyAPI.Apply(cube.GetPrim())
10

11
# Get the Kinematic Enabled Attribute
12
cube_rb_api.GetKinematicEnabledAttr()
13

14
# Create a linear velocity attribute of value (5, 0, 0)
15
cube_rb_api.CreateVelocityAttr(Gf.Vec3f(5, 0, 0))
```

This example shows how API schemas can be applied to prims to add specific properties that govern behaviors, such as adding rigid body capabilities to an object hierarchy.