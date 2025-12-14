"use client";
import { createHoistableComponent } from "@/lib/hoistable-component";

/**
 * HeaderAction用のコンポーネント群を生成
 *
 * モジュールのトップレベルでFactory関数を呼び出すことで
 * - アプリケーションのライフサイクルを通じてコンポーネント関数の参照は不変
 * - Reactから見れば通常のfunction Component() {}と同じ
 * - クロージャで特定のスコープを共有しているだけ
 */
export const { Provider, Slot, Hoist } = createHoistableComponent();
