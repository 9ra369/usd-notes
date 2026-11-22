# スキーマの分類：IsA と API

## 要点

- `Xform` や `Scope` は API スキーマではなく IsA（型付き）スキーマ
- 「API」という言葉は二重の意味で使われる
  - プログラミング上の API（`UsdStage` などのクラス群）
  - prim に後から付ける「API スキーマ」

## 分類図

```mermaid
flowchart TB
  BASE["UsdSchemaBase"]
  BASE --> ISA["IsA スキーマ（型付き）<br/>prim の型・1つだけ"]
  BASE --> APIS["API スキーマ<br/>Apply で後付け・複数可"]

  ISA --> ABS["抽象（基底）<br/>Imageable<br/>Xformable<br/>Boundable<br/>Gprim<br/>PointBased"]
  ISA --> CON["具象<br/>Xform / Scope / Mesh<br/>Camera / Material<br/>Shader / SphereLight"]

  APIS --> SAPI["単一 Apply<br/>MaterialBindingAPI<br/>GeomModelAPI<br/>SkelBindingAPI<br/>RigidBodyAPI<br/>LightAPI"]
  APIS --> MAPI["複数 Apply（:名前 で区別）<br/>CollectionAPI<br/>PhysicsDriveAPI<br/>PhysicsLimitAPI"]

  SUM["1つの UsdPrim<br/>IsA 型は1つ ＋ API スキーマは0個以上"]

  classDef isa fill:#EEEDFE,stroke:#534AB7,color:#26215C
  classDef api fill:#E1F5EE,stroke:#0F6E56,color:#04342C
  classDef infra fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
  class ISA,ABS,CON isa
  class APIS,SAPI,MAPI api
  class BASE,SUM infra
```

## UsdGeom の継承関係（Xform と Scope の違い）

```mermaid
flowchart TB
  IMG["Imageable（抽象）"] --> SCOPE["Scope<br/>トランスフォームを持たない"]
  IMG --> XFA["Xformable（抽象）"]
  XFA --> XFORM["Xform"]
  XFA --> CAM["Camera"]
  XFA --> BND["Boundable（抽象）"]
  BND --> GP["Gprim（抽象）"]
  GP --> PB["PointBased（抽象）"]
  PB --> MESH["Mesh"]
```

- 抽象スキーマは直接 def できないが、継承元として機能を配る
- `Xform` も `Mesh` も `Xformable` を継承しているのでトランスフォームを持てる
- `Scope` は `Imageable` しか継承していないので、トランスフォームを持たない

## IsA と API の比較

| | IsA スキーマ | API スキーマ |
|---|---|---|
| 記録される場所 | prim の typeName | `apiSchemas` メタデータ |
| 1つの prim に | 1つだけ | 0個以上 |
| 書き方 | `def Xform "foo"` | `prepend apiSchemas = [...]` |
| 種類 | 抽象 / 具象 | 単一 Apply / 複数 Apply（ほかに非 Applied のヘルパーもある） |

## usda での例

```
def Xform "Robot" (
    prepend apiSchemas = ["MaterialBindingAPI", "CollectionAPI:lights"]
)
{
}
```

- IsA 型は `Xform`
- API スキーマは `MaterialBindingAPI`（単一）と `CollectionAPI:lights`（複数 Apply、インスタンス名 lights）

## もう1つの分類軸：ドメイン

スキーマは IsA / API とは別に、ドメインでも分類できる。

| ドメイン | IsA の例 | API の例 |
|---|---|---|
| UsdGeom | Xform, Scope, Mesh, Camera | GeomModelAPI, PrimvarsAPI |
| UsdShade | Material, Shader | MaterialBindingAPI |
| UsdLux | SphereLight, DomeLight | LightAPI, ShadowAPI |
| UsdSkel | SkelRoot, Skeleton | SkelBindingAPI |
| UsdPhysics | Scene, Joint | RigidBodyAPI, CollisionAPI, DriveAPI |
