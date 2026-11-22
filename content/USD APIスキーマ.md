---
type: concept
date: 2026-11-20
tags: [usd, schema, api-schema, list-op, pipeline]
aliases: [APIスキーマ, apiSchemas, Applied API Schema, MaterialBindingAPI, CollectionAPI, prepend]
status: learning
---

# USD APIスキーマ

> [!info] そもそもスキーマとは
> - データの**中身ではなく形**を決める定義。USD固有の言葉ではなく、DBのテーブル定義や JSON Schema と同じ意味
> - USD では「この種類のPrim／この機能は、**どの名前・型・デフォルト値のプロパティを持つか**」を定義したもの
> - ただの規約（ドキュメントに書いた約束）との違いは、**USD自身が定義を知っていて実際に効かせる**こと
>   - 書かれていなければフォールバック値を返す
>   - `HasAPI()` などで判定できる
>   - `UsdGeom.Sphere(prim).GetRadiusAttr()` のような専用メソッドで触れる
>
> **ないとどうなるか**
> Primは「名前付きの属性を好きなだけ持てる箱」なので、球の大きさを `radius` / `size` / `r` と人によって書き分けられてしまい、Maya・Houdini・レンダラー間で同じデータを同じ意味で読めなくなる。型やデフォルト値もバラバラになる。
>
> ```usda
> def Sphere "Ball"
> {
> }
> ```
> 何も書いていなくても `radius` は 1.0 を返す。`Sphere` スキーマが「書かれていなければ 1.0」と決めているから。

## 一言で
Typed スキーマが「Primが**何であるか**」を決めるのに対して、API スキーマは「Primに**どんな機能を足すか**」を決める。
Primのメタデータ `apiSchemas` にリストとして記録され、1つのPrimにいくつでも付けられる。

## なぜ必要か（ないとどうなるか）
- 機能を型だけで表そうとすると、「マテリアル付きCube」「物理付きCube」「マテリアル＋物理付きMesh」…と**組み合わせの数だけ型が必要**になり破綻する
- 型と機能を分けたことで、`Cube` に `MaterialBindingAPI` と `PhysicsRigidBodyAPI` を**後付けで組み合わせられる**
- プロパティを手書きするだけだと「その機能を持つPrim」として認識されず、フォールバック値や判定（`HasAPI`）も効かない → APIとして**宣言**することで正式な機能になる

## Typed スキーマとの違い
| 種類 | 役割 | 書かれる場所 | 1つのPrimに |
|---|---|---|---|
| Typed スキーマ | Primが何であるか（職業） | `def Cube "..."` の型名 | 1つだけ |
| API スキーマ | Primに足す機能（資格） | `apiSchemas` メタデータ | いくつでも |

```usda
def Cube "Cube" (                                     ← ( ) = Primのメタデータ
    prepend apiSchemas = ["MaterialBindingAPI"]
)
{                                                     ← { } = Primの中身
    rel material:binding = </World/RedMaterial>
}
```

## API スキーマの3分類
| 分類 | `apiSchemas` に記録 | 例 |
|---|---|---|
| Non-applied（非適用型） | されない。既存プロパティを扱うラッパーのみ | `UsdGeom.PrimvarsAPI`、`Usd.ModelAPI`、`UsdShade.ConnectableAPI` |
| Single-apply（単一適用型） | 名前がそのまま入る。1Primに1回 | `MaterialBindingAPI`、`GeomModelAPI`、`SkelBindingAPI` |
| Multiple-apply（複数適用型） | `API名:インスタンス名` で入る。何度でも | `CollectionAPI:heroProps`、`PhysicsDriveAPI:angular` |

複数適用型はプロパティ名にもインスタンス名が入る。

```usda
prepend apiSchemas = ["CollectionAPI:heroProps", "CollectionAPI:bgProps"]
rel collection:heroProps:includes = [...]
rel collection:bgProps:includes = [...]
```

## 適用すると何が起きるか
- `apiSchemas` に名前が追記される
- `HasAPI()` で「この機能を持つPrim」と判定できる
- APIが定義するプロパティが、値を書いていなくても**フォールバック値付きで存在する**扱いになる
- `material:binding` のように、APIの適用が前提の機能が正式に効く（未適用だと警告・無視の対象）

## 記録のされ方：list op
`apiSchemas` はリストなので、レイヤーを重ねたときに**既存リストをどう編集するか**を指定する。

| 書き方 | 意味 |
|---|---|
| `prepend apiSchemas = [...]` | 既存リストの先頭に追加 |
| `append apiSchemas = [...]` | 既存リストの末尾に追加 |
| `delete apiSchemas = [...]` | 既存リストから取り除く |
| `apiSchemas = [...]`（キーワードなし＝explicit） | 「リストはこれで確定」と宣言し、**それより弱い意見を打ち切る** |

- 他レイヤーを壊さず自分の分だけ足すのが作法 → ツールの書き出しはほぼ `prepend`
- explicit は「消してから追加」ではなく**置き換えの宣言**。弱いレイヤーのファイル自体は書き換わらない（強いレイヤーを外せば元に戻る）
- explicit で区切った後も、さらに強いレイヤーの `prepend` は積み重なる

```
弱いレイヤー : prepend ["CollectionAPI"]
中間レイヤー : explicit ["MaterialBindingAPI"]   ← ここで一度リセット
強いレイヤー : prepend ["SkelBindingAPI"]
→ 合成結果   : ["SkelBindingAPI", "MaterialBindingAPI"]
```

同じ list op は `prepend references = @...@` などでも使われる（references ではリスト順＝強さの順）。

## 書かなくても付いているAPI
| 経路 | 内容 |
|---|---|
| Built-in | Typed スキーマの定義に組み込み済み。例：`SphereLight` は `LightAPI` を内蔵 |
| Auto-apply | プラグイン（plugInfo）が「この型には自動で付ける」と宣言。レンダラーや Omniverse 拡張の独自属性など |

→ `apiSchemas` に書いていないのに `HasAPI()` が True になることがある。実際に持っているAPIは `prim.GetAppliedSchemas()` で確認する。

## Pythonでの扱い
```python
from pxr import Usd, UsdShade

binding = UsdShade.MaterialBindingAPI.Apply(prim)   # 適用（apiSchemas に書き込む）
prim.HasAPI(UsdShade.MaterialBindingAPI)            # 適用済みか確認
coll = Usd.CollectionAPI.Apply(prim, "heroProps")   # 複数適用型はインスタンス名付き
prim.RemoveAPI(UsdShade.MaterialBindingAPI)         # 外す
prim.GetAppliedSchemas()                            # 合成後に持っているAPI一覧
```

- `UsdShade.MaterialBindingAPI(prim)` は**包むだけで何も書き込まない**。既存Primを操作する窓口を作っているだけ
- 書き込みが起きるのは `Apply` のとき
- Houdini Solaris では Assign Material LOP などが内部で自動適用している

## よく見るAPIスキーマ
| API | 分類 | 用途 |
|---|---|---|
| `MaterialBindingAPI` | single | マテリアル割り当て |
| `CollectionAPI` | multiple | Primの集合定義（ライトリンク、一括割り当て） |
| `GeomModelAPI` | single | 描画モード（bounds / cards）などモデル単位の表示設定 |
| `SkelBindingAPI` | single | スケルトンとメッシュの紐付け |
| `LightAPI` / `ShadowAPI` / `ShapingAPI` | single | ライトの基本・影・配光 |
| `PhysicsRigidBodyAPI` / `PhysicsCollisionAPI` | single | 剛体・コリジョン（Isaac Sim / Omniverse で多用） |

## つまずきポイント
- ファイル先頭や `def` の後ろの括弧を `{ }` と同じものだと思った → `( )` は**メタデータ**、`{ }` は**中身**。`apiSchemas` は Prim のメタデータなので `( )` に書かれる
- キーワードなしで書くと「元のAPIを消して今のAPIだけ追加する」と思った → 結果は近いが、実際は**それより弱い意見を無視してリストを確定させる宣言**。弱いレイヤーのデータは消えておらず、より強いレイヤーの追加はその後も効く

> [!question]- 確認問題1
> `UsdShade.MaterialBindingAPI(prim)` でバインドを設定したのに、`prim.HasAPI(UsdShade.MaterialBindingAPI)` が False になる。なぜか。
>
> > [!note]- 答え
> > コンストラクタは既存Primを包む窓口を作るだけで、`apiSchemas` には何も書き込まない。`UsdShade.MaterialBindingAPI.Apply(prim)` で適用する必要がある。

> [!question]- 確認問題2
> 弱いレイヤーで `prepend ["CollectionAPI"]`、中間レイヤーで `apiSchemas = ["MaterialBindingAPI"]`、強いレイヤーで `prepend ["SkelBindingAPI"]` と書いた。合成結果は？ また、弱いレイヤーのファイルから `CollectionAPI` は消えているか。
>
> > [!note]- 答え
> > `["SkelBindingAPI", "MaterialBindingAPI"]`。中間の explicit がそれより弱い `CollectionAPI` を打ち切り、強いレイヤーの prepend は上に積まれる。弱いレイヤーのファイルには `CollectionAPI` が残っている（消えるのは合成後の見え方だけ）。

> [!question]- 確認問題3
> 1つのPrimに「ヒーロー用」と「背景用」の2つのコレクションを持たせたい。`MaterialBindingAPI` と同じ書き方ではできないのはなぜか。どう書くか。
>
> > [!note]- 答え
> > `MaterialBindingAPI` は単一適用型で1回しか付けられない。`CollectionAPI` は複数適用型なので、`CollectionAPI:hero` と `CollectionAPI:bg` のようにインスタンス名を付けて適用する。

> [!question]- 確認問題4
> `SphereLight` の `apiSchemas` には何も書いていないのに `HasAPI(UsdLux.LightAPI)` が True になる。なぜか。
>
> > [!note]- 答え
> > `LightAPI` が `SphereLight` の型定義に Built-in で組み込まれているため。合成後に持っているAPIは `GetAppliedSchemas()` で確認できる。

## 関連
[[USDAのメタデータ]] | [[リスト編集 (list op)]] | [[コンポジション (LIVRPS)]] | [[Typed スキーマ]] | [[UsdShade マテリアルバインディング]] | [[usdGenSchema]]
