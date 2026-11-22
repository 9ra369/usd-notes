---
title: Metadata — Learn OpenUSD
source: https://docs.nvidia.com/learn-openusd/latest/stage-setting/metadata.html
author:
published:
created: 2026-11-21
description:
tags:
  - resources
---
## Metadata

## What Is Metadata?

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Metadata_Definition.webm" type="video/webm"> Your browser does not support the video tag.</video>

[Metadata](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Metadata) in OpenUSD refers to a set of name-value pairs that provide additional, non-animatable information attached to [prims](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Prim), [properties](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Property), or [layers](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Layer). The concept is similar to properties, but it allows us to add custom information or annotations to scene description elements via a dictionary without modifying the underlying schema or data model.

### How Does It Work?

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Metadata_UseCase.webm" type="video/webm"> Your browser does not support the video tag.</video>

Metadata is stored separately from the primary data and can be accessed and modified independently. It is typically used to store additional information that is not directly related to the geometry or rendering of an object, such as:

- Author information
- Creation/modification dates
- Project-specific data
- Annotations or notes
- Rendering hints or flags

Metadata can be set at different levels of the scene hierarchy, allowing for both global and localized metadata.

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Metadata_vsAttributes.webm" type="video/webm"> Your browser does not support the video tag.</video>

While both metadata and [attributes](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Attribute) allow us to store additional data, there are some key differences:

- Metadata is separate from the core schema and data model, while attributes are part of the schema definition.
- Metadata is typically used for supplementary information, while attributes are often used for data directly related to the object’s properties or behavior.
- Metadata cannot be sampled over time (i.e. time samples), allowing it to be evaluated and stored more efficiently than attribute values.

### Working With Python

 <video controls="" width="100%"><source src="https://docs.nvidia.com/learn-openusd/latest/_images/Metadata_Python.webm" type="video/webm"> Your browser does not support the video tag.</video>

Here are a few ways we can interact with metadata via the Python API:

```python
1
# Retrieve the metadata value associated with the given key for a USD Object
 2
usdobject.GetMetadata('key')
 3

 4
# Set the metadata value for the given key on a USD Object
 5
usdobject.SetMetadata('key', value)
 6

 7
# Retrieve the metadata value associated with the given key for the stage
 8
stage.GetMetadata('key')
 9

10
# Set the metadata value for the given key on the stage
11
stage.SetMetadata('key', value) 
12

13
# Use for better performance if accessing a single value and not all the metadata within a key
14
GetMetadataByDictKey()
```

It’s worth noting that `key` will typically be either `assetInfo`, which can be used to set [asset](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Asset) related data or `customData`, which can be used for everything else. We can also create additional metadata keys by adding a new [schema](https://docs.nvidia.com/learn-openusd/latest/glossary.html#term-Schema).