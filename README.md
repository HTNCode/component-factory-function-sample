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

## カスケードアンマウント（子のアンマウントに親を連動させる）へ拡張させる

### 課題

複数のHoistをネストした場合（例: メニューボタンを開いて「編集」「削除」などのセレクターを表示し、その中でさらにサブメニューをHoistしたい場合）、子のHoistがアンマウントされたときに親のHoistもアンマウントしたいケースがある。

### 解決策: `createCascadableHoistableComponent`

Contextを拡張して、子のアンマウント時に親のアンマウント関数を呼び出す仕組みを追加。

```tsx
// lib/hoistable-component.tsx に追加
export function createCascadableHoistableComponent() {
  const HoistContext = createContext<{
    content: ReactNode;
    setContent: (content: ReactNode) => void;
    registerParentUnmount?: (unmount: () => void) => void; // 親のアンマウント関数を登録
  } | null>(null);

  function Hoist({
    children,
    cascadeUnmount = false,
  }: {
    children: ReactNode;
    cascadeUnmount?: boolean; // trueなら子のアンマウント時に親も連動
  }) {
    const parentUnmountRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      if (cascadeUnmount) {
        // 子に親のアンマウント関数を渡せるContextを提供
        context.setContent(
          <HoistContext.Provider
            value={{
              ...context,
              registerParentUnmount: (unmount) => {
                parentUnmountRef.current = unmount;
              },
            }}
          >
            {children}
          </HoistContext.Provider>,
        );
      }

      // 親に自分のアンマウント関数を登録
      context.registerParentUnmount?.(() => context.setContent(null));

      return () => {
        context.setContent(null);
        parentUnmountRef.current?.(); // 子がアンマウント → 親もアンマウント
      };
    }, [children, context, cascadeUnmount]);
  }
}
```

### 使い方

```tsx
import { CascadeAction } from "@/components/cascade-action";

<CascadeAction.Provider>
  <CascadeAction.Slot />

  {showParentMenu && (
    <CascadeAction.Hoist cascadeUnmount={true}>
      {" "}
      {/* 親: cascadeUnmount=true */}
      <div>親メニュー</div>
      {showChildMenu && (
        <CascadeAction.Hoist>
          {" "}
          {/* 子 */}
          <div>子メニュー</div>
          <button onClick={() => setShowChildMenu(false)}>
            閉じる（親も連動して閉じる）
          </button>
        </CascadeAction.Hoist>
      )}
    </CascadeAction.Hoist>
  )}
</CascadeAction.Provider>;
```

### デモ

`/sample3` でカスケードアンマウントの動作を確認できる。
