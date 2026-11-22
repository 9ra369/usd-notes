---
type: concept
date: 2026-11-19
tags: [USD, API, Python, pipeline]
aliases: [USD API, Usd API, Sdf API, pxr]
status: learning
---

# USDのAPI（Usd と Sdf）

## 一言で

USD の Python API（`pxr`）には、**合成された結果を扱う `Usd`** と、**layer に書かれた spec を直接扱う `Sdf`** がある。概念の2つのレベルが、そのまま API の2つのモジュールに対応している。

---

## API とは

API（Application Programming Interface）は、あるソフトやライブラリが「プログラムからはこの窓口を通して操作してください」と用意している決まった呼び出し口のこと。Houdini の `hou`、Maya の `cmds`、Nuke の `nuke` モジュールと同じ立ち位置で、USD では Pixar のライブラリ `pxr` がそれにあたる。

API がなければ、usda のテキストや usdc のバイナリを自分で解析し、コンポジションの規則（LIVRPS など）も自前で実装する必要がある。API を使えば、ファイル形式や合成の中身を知らなくても「この prim の radius を取得する」と頼むだけで済む。

---

## 概念と API の対応

| 概念 | レベル | API |
|---|---|---|
| layer | 書かれたもの | `Sdf.Layer` |
| prim spec | 書かれたもの | `Sdf.PrimSpec` |
| property spec | 書かれたもの | `Sdf.AttributeSpec` / `Sdf.RelationshipSpec` |
| Stage | 合成された結果 | `Usd.Stage` |
| prim | 合成された結果 | `Usd.Prim` |
| attribute / relationship | 合成された結果 | `Usd.Attribute` / `Usd.Relationship` |

- `Sdf` ＝ 書かれたもの（authoring レベル）
- `Usd` ＝ 合成された結果（composed レベル）

---

## 書き込みの違い

Usd API で `Set()` すると、現在の Edit Target（通常はルートレイヤー）に spec が作られ、そこに opinion が書き込まれる。Sdf API を使うと、合成を介さずに layer へ直接 spec を作れる。合成の再計算が走らないので、大量に書き込むツールでは Sdf API が速い（`Sdf.ChangeBlock` と併用する）。

```python
from pxr import Sdf

layer = Sdf.Layer.CreateAnonymous(".usda")
ball = Sdf.PrimSpec(layer, "Ball", Sdf.SpecifierDef, "Sphere")             # prim spec
radius = Sdf.AttributeSpec(ball, "radius", Sdf.ValueTypeNames.Double)    # property spec
radius.default = 1.0                                                      # opinion

print(layer.ExportToString())
# def Sphere "Ball"
# {
#     double radius = 1
# }

print(ball.ListInfoKeys())    # ['typeName', 'specifier']
print(radius.ListInfoKeys())  # ['custom', 'typeName', 'variability', 'default']
```

`ListInfoKeys()` で、その spec に書かれているフィールド（＝ opinion）の一覧が見られる。

---

## 読み取り：なぜこの値になっているかを調べる

```python
from pxr import Usd, Sdf

# shot.usda = base.usda と lighting.usda を合成したStage（例は [[USDのコンポジションとopinion]]、繋ぎ方は [[USDのコンポジションアーク]]）
stage = Usd.Stage.Open("shot.usda")
prim = stage.GetPrimAtPath("/Ball")      # Usd.Prim：合成済みの結果
attr = prim.GetAttribute("radius")
print(attr.Get())                        # 2.0

# 寄与している property spec を強い順に列挙
for spec in attr.GetPropertyStack():
    print(spec.layer.identifier, spec.default)

layer = Sdf.Layer.FindOrOpen("base.usda")
spec = layer.GetPrimAtPath("/Ball")      # Sdf.PrimSpec：このレイヤー内の spec
```

`GetPropertyStack()` / `GetPrimStack()` で「なぜこの値になっているか」を確認できる。

---

## 確認問題

> [!question]- `Usd.Prim` と `Sdf.PrimSpec` の違いは？
> > [!note]- 答え
> > `Usd.Prim` は Stage 上で合成された結果の prim。`Sdf.PrimSpec` は特定の layer に書かれた spec で、1つの prim に対して layer の数だけ存在しうる。

> [!question]- ある属性の値が「どのレイヤーのどの opinion から来ているか」を Python で確かめるには？
> > [!note]- 答え
> > `attr.GetPropertyStack()` で、寄与している property spec を強い順に列挙する（prim なら `GetPrimStack()`）。

---

関連：[[USDのコンポジションとopinion]] / [[USDのコンポジションアーク]] / [[USD Stage]] / [[Edit Target]]
