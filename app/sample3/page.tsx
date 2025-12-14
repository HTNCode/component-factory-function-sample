"use client";

import { useState } from "react";
import { CascadeAction } from "@/components/cascade-action";
import Link from "next/link";

/**
 * カスケードアンマウントのデモページ
 *
 * 親メニュー → 子メニュー という階層で、
 * 子メニューを閉じると親メニューも連動して閉じる動作を確認できる
 */
const Sample3 = () => {
  const [showParentMenu, setShowParentMenu] = useState(false);
  const [showChildMenu, setShowChildMenu] = useState(false);

  const handleOpenParent = () => {
    setShowParentMenu(true);
  };

  // 子メニューを閉じるときに親も閉じる
  const handleCloseChild = () => {
    setShowChildMenu(false);
    setShowParentMenu(false); // カスケードで親も閉じる
  };

  return (
    <CascadeAction.Provider>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">
          Sample3: カスケードアンマウントのデモ
        </h2>

        <p className="mb-4 text-gray-600">
          子メニューを閉じると、親メニューも連動して閉じる動作を確認できます。
        </p>

        <div className="mb-4">
          <button
            onClick={handleOpenParent}
            className="bg-blue-600 text-white p-2 rounded mr-2"
          >
            親メニューを開く
          </button>
          <Link href="/" className="text-blue-600 underline">
            ホームに戻る
          </Link>
        </div>

        {/* Slot: Hoistされたコンテンツがここに表示される */}
        <div className="border-2 border-dashed border-gray-300 p-4 min-h-25">
          <p className="text-gray-400 mb-2">
            ↓ Slot（Hoistされた内容がここに表示）
          </p>
          <CascadeAction.Slot />
        </div>

        {/* 親メニュー */}
        {showParentMenu && (
          <CascadeAction.Hoist>
            <div className="bg-yellow-100 p-4 rounded border border-yellow-400">
              <p className="font-bold text-yellow-800">🟡 親メニュー</p>
              <p className="text-sm text-yellow-700 mb-2">
                子メニューを閉じると、親メニューも一緒に閉じます
              </p>
              <button
                onClick={() => setShowChildMenu(true)}
                className="bg-yellow-600 text-white p-2 rounded mr-2"
              >
                子メニューを開く
              </button>
              <button
                onClick={() => setShowParentMenu(false)}
                className="bg-gray-500 text-white p-2 rounded"
              >
                親メニューだけを閉じる
              </button>

              {/* 子メニュー: 親のHoistのchildren内に直接配置 */}
              {showChildMenu && (
                <div className="bg-green-100 p-4 rounded border border-green-400 mt-4">
                  <p className="font-bold text-green-800">🟢 子メニュー</p>
                  <p className="text-sm text-green-700 mb-2">
                    このメニューを閉じると、親メニューも一緒に閉じます
                  </p>
                  <button
                    onClick={handleCloseChild}
                    className="bg-green-600 text-white p-2 rounded"
                  >
                    子メニューを閉じる（親も連動して閉じる）
                  </button>
                </div>
              )}
            </div>
          </CascadeAction.Hoist>
        )}

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">動作説明</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>
              「親メニューを開く」をクリック → 親メニューがSlotに表示される
            </li>
            <li>
              「子メニューを開く」をクリック → 子メニューが親の中に表示される
            </li>
            <li>「子メニューを閉じる」をクリック → 親も連動して閉じる</li>
            <li>「親メニューだけを閉じる」をクリック → 親のみ閉じる</li>
          </ol>
        </div>
      </div>
    </CascadeAction.Provider>
  );
};

export default Sample3;
