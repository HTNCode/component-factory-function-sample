# Component Factory関数の実装サンプル

- じょうげんさんの下記記事を参考に実際に実装してみたサンプル
  - https://zenn.dev/bmth/articles/component-factory

## 仕組み

- `HoistableComponentFactory`関数は、`Provider`、`Slot`、`Hoist`の3つのコンポーネントを生成する。
- `Provider`は状態を管理し、`Slot`と`Hoist`にContextを提供。
- `Slot`は`Hoist`されたコンテンツを表示する場所を示す。
- `Hoist`は子要素をContextに登録し、`Slot`に転送する。
- これにより、`Provider`内の任意の場所に`Slot`を配置し、`Hoist`で指定したコンテンツを表示できる。
- `Composition Pattern`を使用しているため、サーバーコンポーネントが`children`に渡されても問題ない。
- Reactの`Context`と`useEffect`を活用して、コンポーネント間で状態を共有し、動的にコンテンツを表示する仕組みを実現する。

## 流れ（例）

1. Sample1ページがマウント
2. Hoist が children（ボタン）を context.setContent() で登録
3. Provider の state が更新される
4. Slot が context.content を読み取り、ボタンを表示

結果: Sample1 で定義したボタンが Header 内の Slot の位置に表示される

## 実装手順

1. `HoistableComponentFactory`関数を定義し、`Provider`、`Slot`、`Hoist`コンポーネントを生成。
2. `Provider`コンポーネントで状態管理とContextの提供を実装。
3. `Slot`コンポーネントでContextからコンテンツを取得して表示。
4. `Hoist`コンポーネントで子要素をContextに登録。
5. サンプルページで`Provider`、`Slot`、`Hoist`を使用して動作確認。

## サンプルコード構成

```
lib/
  hoistable-component.tsx    # Factory関数の本体（createHoistableComponent）

components/
  header-action/
    header-actions.tsx       # Factory関数を呼び出し、Provider/Slot/Hoistを生成
    index.ts                 # HeaderAction名前空間としてエクスポート
  Header.tsx                 # Slotを配置（Hoistされたコンテンツの表示場所）

app/
  layout.tsx                 # Providerで全体を囲む
  sample1/
    page.tsx                 # Hoistでボタンを登録（緑）
  sample2/
    page.tsx                 # Hoistでボタンを登録（青）
```

| ファイル                                        | 役割                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `lib/hoistable-component.tsx`                   | Factory関数。Context を内包した Provider/Slot/Hoist を生成                |
| `components/header-action/header-actions.tsx`   | Factory関数を呼び出し、HeaderAction用のコンポーネント群を生成             |
| `components/Header.tsx`                         | `HeaderAction.Slot` を配置。Hoistされたコンテンツがここに表示される       |
| `app/layout.tsx`                                | `HeaderAction.Provider` で Header と children を囲む                      |
| `app/sample1/page.tsx` / `app/sample2/page.tsx` | `HeaderAction.Hoist` でボタンを登録。ページ固有のアクションをHeaderに表示 |

## 何が嬉しいか？

### 1. `"use client"` を1箇所にまとめられる

- Factory関数内で `"use client"` を宣言するだけで、生成される Provider/Slot/Hoist すべてが Client Component になる
- 使用側（ページコンポーネント等）で毎回 `"use client"` を書く必要がない
- つまり、使用側はサーバーコンポーネントのまま、Provider/Slot/Hoist を利用できる

### 2. Context がカプセル化される

- Context は Factory関数内のクロージャに閉じ込められ、外部から直接アクセスできない
- `Provider`、`Slot`、`Hoist` のみが Context にアクセスでき、誤用を防げる

### 3. 型情報が自動的に共有される

- Factory関数内で定義された型が、生成されるコンポーネント間で自動的に共有される
- 型定義を別途 export する必要がない

### 4. 関連コンポーネントを名前空間でまとめられる

```tsx
// 使用側で直感的に使える
<HeaderAction.Provider>
  <HeaderAction.Slot />
  <HeaderAction.Hoist>...</HeaderAction.Hoist>
</HeaderAction.Provider>
```

### 5. 再利用性が高い

- 同じ Factory関数を呼び出すだけで、異なる用途のコンポーネント群を複数生成できる
- 例: `HeaderAction`、`SidebarAction`、`ModalContent` など

## 補足

- `Hoist` コンポーネントや `Slot` コンポーネントは `Provider` の子孫である必要がある（React ツリー上で）
- 複数の `Provider` をネストする場合も、各 `Hoist` と `Slot` は対応する `Provider` の子孫である必要がある

## カスケードアンマウント（子を閉じたら親も連動して閉じる）

### 課題

メニューボタンを開いて子メニューを表示し、子メニューを閉じたときに親メニューも連動して閉じたいケースがある。

### Hoistのネストは親を上書きする

Hoistをネストすると、子のHoistが親のcontentを**上書き**してしまう：

```tsx
// ❌ これは期待通りに動かない
<CascadeAction.Hoist>
  <div>
    親メニュー
    <CascadeAction.Hoist>
      {/* これが親のcontentを上書きする */}
      <div>子メニュー</div>
    </CascadeAction.Hoist>
  </div>
</CascadeAction.Hoist>
```

### Providerもネストすると別コンテキストになるので子メニューを閉じたときに親を閉じられない

```tsx
// ❌ これも期待通りに動かない
<Action.Provider>
  {/* Provider A */}
  <Action.Slot />
  <Action.Hoist>
    {/* Hoist A */}
    <div>
      親メニュー
      <Action.Provider>
        {/* Provider B（独立した state） */}
        <Action.Slot />
        <Action.Hoist>
          {/* Hoist B */}
          <div>子メニュー</div>
        </Action.Hoist>
      </Action.Provider>
    </div>
  </Action.Hoist>
</Action.Provider>
```

### じゃあProviderをネストすればいいのでは？

```tsx
// ❌ これも期待通りに動かない
<Provider>
  {" "}
  {/* Provider A */}
  <Slot /> {/* ← Provider A の content を表示 */}
  <Hoist>
    {" "}
    {/* → Provider A に登録 */}
    <div>
      親メニュー
      {/* 子用に Provider B が自動生成されたとする */}
      <Provider>
        {" "}
        {/* Provider B */}
        <Hoist>
          {" "}
          {/* → Provider B に登録 */}
          <div>子メニュー</div>
        </Hoist>
        {/* ❌ Provider B の Slot がない！ */}
        {/* → 「子メニュー」の表示先がないので、子メニューが表示されない */}
      </Provider>
    </div>
  </Hoist>
</Provider>
```

### Hoistの中に自動でSlotを差し込めればいける？

Hoist が children をラップして、子用の Provider + Slot を自動挿入する実装を考える：

```tsx
function Hoist({ children }: { children: ReactNode }) {
  const context = use(HoistContext);

  // 子Hoist用の独立した state
  const [childContent, setChildContent] = useState<ReactNode>(null);

  useEffect(() => {
    context.setContent(
      <HoistContext.Provider
        value={{ content: childContent, setContent: setChildContent }}
      >
        {children}
        {childContent} {/* ← 子Hoist用の Slot を自動挿入 */}
      </HoistContext.Provider>,
    );

    return () => context.setContent(null);
  }, [children, childContent, context]);

  return null;
}
```

しかし、これも期待通りに動かない：

```tsx
<Hoist>
  <div>親メニュー</div>
  <Hoist>子メニュー</Hoist> {/* ← 子Hoist はここにある */}
</Hoist>

// 自動挿入される childContent は children の「後ろ」に追加される
// → 子メニューが親メニューの「外側」に表示されてしまう
// → 子コンテンツの表示位置を制御できない
```

### 解決策: 子メニューはHoistのchildren内に直接配置

- 子メニューは親Hoistの`children`として直接配置し、カスケードアンマウントは状態管理で実現する。
- これが最もシンプルで要件を満たすことができそう

```tsx
const [showParentMenu, setShowParentMenu] = useState(false);
const [showChildMenu, setShowChildMenu] = useState(false);

// 子を閉じるときに親も閉じる
const handleCloseChild = () => {
  setShowChildMenu(false);
  setShowParentMenu(false);
};

<CascadeAction.Provider>
  <CascadeAction.Slot />

  {showParentMenu && (
    <CascadeAction.Hoist>
      <div>
        親メニュー
        <button onClick={() => setShowChildMenu(true)}>子を開く</button>
        {/* 子メニューはHoistではなく直接配置 */}
        {showChildMenu && (
          <div>
            子メニュー
            <button onClick={handleCloseChild}>
              閉じる（親も連動して閉じる）
            </button>
          </div>
        )}
      </div>
    </CascadeAction.Hoist>
  )}
</CascadeAction.Provider>;
```

### デモ

`/sample3` でカスケードアンマウントの動作を確認できる。
