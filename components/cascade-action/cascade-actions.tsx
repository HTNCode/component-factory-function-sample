"use client";
import { createCascadableHoistableComponent } from "@/lib/hoistable-component";

/**
 * カスケードアンマウント対応版のコンポーネント群を生成
 */
export const { Provider, Slot, Hoist } = createCascadableHoistableComponent();
