# 従来のパイプラインと USD のパイプライン

## 比較図

```mermaid
flowchart LR
  subgraph OLD["従来：バケツリレー"]
    direction TB
    M["モデル"] --> LA["レイアウト"] --> AN["アニメ"] --> LI["ライティング"]
    LI -.- N1["上流の修正で全部やり直し<br/>下流は順番待ち"]
  end

  subgraph NEW["USD：レイヤーを重ねる"]
    direction TB
    subgraph STACK["レイヤースタック（上ほど強い）"]
      direction TB
      S1["ライティング · light.usda"] ~~~ S2["FX · fx.usda"] ~~~ S3["アニメ · anim.usda"] ~~~ S4["レイアウト · layout.usda"] ~~~ S5["モデル（参照）· model.usd"]
    end
    STACK --> SHOT["shot（合成結果）"]
    SHOT -.- N2["各部署が同時に編集<br/>自分のレイヤーだけ触る"]
  end

  classDef data fill:#EEEDFE,stroke:#534AB7,color:#26215C
  classDef api fill:#E1F5EE,stroke:#0F6E56,color:#04342C
  classDef infra fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
  class S1,S2,S3,S4,S5 data
  class SHOT,N2 api
  class M,LA,AN,LI,N1 infra
```

## 従来型

- 各部署が前の部署の出力（キャッシュ）を受け取り、自分の成果を焼き込んで次へ渡す
- モデルが1か所直るだけで、レイアウト以降が全部再出力になる
- 作業は直列になる

## USD 型

- 各部署が自分のレイヤーにだけ書く
- ショットはそれらを重ねた結果として、毎回その場で合成される
- モデルが更新されれば、参照している全ショットに次に開いた瞬間から反映される
- 誰も再出力する必要がない

## ショットのレイヤー構成の例

```
#usda 1.0
(
    subLayers = [
        @./light.usda@,
        @./fx.usda@,
        @./anim.usda@,
        @./layout.usda@
    ]
)
```

- subLayers は先に書いたものほど強い
- モデルは layout.usda の中から reference / payload で参照する
