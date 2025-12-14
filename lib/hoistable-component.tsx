"use client";
import {
  createContext,
  use,
  useState,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";

/**
 * Component Factory関数
 * 互いに関連し合う複数のコンポーネント（Provider, Slot, Hoist）を一括で生成する
 *
 * クロージャを活用して、同じContextインスタンスを共有するコンポーネント群を生成
 * これにより：
 * - "use client"を1箇所にまとめられる
 * - 型情報が自動的に共有される
 * - 実装の詳細（Context）がカプセル化される
 */
export function createHoistableComponent() {
  // このContextはFactory関数内で作成され、外部から直接アクセス不可（クロージャでカプセル化）
  const HoistContext = createContext<{
    content: ReactNode;
    setContent: (content: ReactNode) => void;
  } | null>(null);

  /**
   * Provider: 状態を管理し、子孫コンポーネントにContextを提供
   * Composition Patternを使用しているので、サーバーコンポーネントがchildrenに渡されても問題ない
   */
  function Provider({ children }: { children: ReactNode }) {
    const [content, setContent] = useState<ReactNode>(null);

    return (
      <HoistContext.Provider value={{ content, setContent }}>
        {children}
      </HoistContext.Provider>
    );
  }

  /**
   * Slot: Hoistされたコンテンツをここに表示してねを示す役割
   * Provider内のどこにでも配置可能
   */
  function Slot() {
    const context = use(HoistContext);
    if (!context) {
      throw new Error("Slot must be used within Provider");
    }
    return <>{context.content}</>;
  }

  /**
   * Hoist: 子要素をContextに登録し、Slotに転送する役割
   * マウント時にコンテンツを登録、アンマウント時にクリア
   */
  function Hoist({ children }: { children: ReactNode }) {
    const context = use(HoistContext);
    if (!context) {
      throw new Error("Hoist must be used within Provider");
    }

    useEffect(() => {
      context.setContent(children);
      return () => context.setContent(null);
    }, [children, context]);

    // Hoistは子要素をContextに登録するだけで、自身は何もレンダリングしない（コンテンツはSlotで表示される）
    return null;
  }

  // 生成された3つのコンポーネントを返す
  // すべて同じHoistContextインスタンスを参照している
  return { Provider, Slot, Hoist };
}

/**
 * カスケードアンマウント対応版 Component Factory関数
 *
 * 子のHoistがアンマウントされたとき、親のHoistも連動してアンマウントできる機能を追加
 * これにより、ネストしたメニューなどで子を閉じたときに親も閉じる動作が実現可能
 */
export function createCascadableHoistableComponent() {
  const HoistContext = createContext<{
    content: ReactNode;
    setContent: (content: ReactNode) => void;
    // 親のアンマウント関数を登録するためのコールバック
    registerParentUnmount?: (unmount: () => void) => void;
  } | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const [content, setContent] = useState<ReactNode>(null);
    // contextの参照を安定させるためにuseMemoを使用
    const contextValue = useMemo(
      () => ({ content, setContent }),
      [content], // setContentは安定しているので依存に含めなくてよい
    );

    return (
      <HoistContext.Provider value={contextValue}>
        {children}
      </HoistContext.Provider>
    );
  }

  function Slot() {
    const context = use(HoistContext);
    if (!context) {
      throw new Error("Slot must be used within Provider");
    }
    return <>{context.content}</>;
  }

  /**
   * Hoist: cascadeUnmount オプションで連鎖アンマウントに対応
   *
   * @param cascadeUnmount - trueの場合、子のHoistがアンマウントされると親もアンマウント
   */
  function Hoist({
    children,
    cascadeUnmount = false,
  }: {
    children: ReactNode;
    cascadeUnmount?: boolean;
  }) {
    const context = use(HoistContext);
    if (!context) {
      throw new Error("Hoist must be used within Provider");
    }

    const { setContent, registerParentUnmount } = context;

    // 親のアンマウント関数を保持するref
    const parentUnmountRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      if (cascadeUnmount) {
        // cascadeUnmountがtrueの場合、子に親のアンマウント関数を渡せるContextを提供
        setContent(
          <HoistContext.Provider
            value={{
              content: null,
              setContent,
              registerParentUnmount: (unmount: () => void) => {
                parentUnmountRef.current = unmount;
              },
            }}
          >
            {children}
          </HoistContext.Provider>,
        );
      } else {
        setContent(children);
      }

      // 親に自分のアンマウント関数を登録
      registerParentUnmount?.(() => {
        setContent(null);
      });

      return () => {
        setContent(null);
        // 子がアンマウントされたとき、登録された親のアンマウントも実行
        parentUnmountRef.current?.();
      };
      // registerParentUnmountは親から渡されるcallbackなので、初回マウント時のみ登録
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [children, setContent, cascadeUnmount]);

    return null;
  }

  return { Provider, Slot, Hoist };
}
