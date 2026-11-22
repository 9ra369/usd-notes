Schema を当てると次の3つが決まります。

何であるか（意味）：typeName が Xform なら「transform を持つノード」、SphereLight なら「光源」と解釈されます
どんな property を持つか（構造）：radius、intensity、xformOpOrder などの attribute 名、型、fallback value
どう扱うか（API）：UsdGeom.Xform、UsdLux.SphereLight のような C++/Python のクラス。property を安全に読み書きするメソッドが付いてきます

Schema は「強制」ではなく「解釈の約束」です。Schema に無い attribute も prim には自由に足せますし、typeName が無い prim（untyped prim）も合法です。Schema は、決まった意味で読める部分を保証するもの

Houdini が書いた UsdLux.RectLight を Omniverse や usdview が同じライトとして読めるのは、Schema という約束を全員が共有しているからです。データモデルの説明というより、「データの解釈の仕方を標準化する仕組み」と捉えると USD らしさが見えてきます。

Schema は、3D や非3D の概念を OpenUSD で表現（encode）し、アプリ間でやり取り（interchange）するための data model と、任意の API を定義する

data model は「ある概念を、どんな property の組み合わせで表すかの取り決め」

data model は「構造＋意味」

