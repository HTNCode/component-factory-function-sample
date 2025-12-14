/**
 * HeaderActionを名前空間としてエクスポート
 *
 * これにより、使用側で以下のように記述できる：
 * import { HeaderAction } from '@/components/header-action';
 *
 * <HeaderAction.Provider>
 *   <HeaderAction.Slot />
 *   <HeaderAction.Hoist>...</HeaderAction.Hoist>
 * </HeaderAction.Provider>
 */
export * as HeaderAction from "./header-actions";
