import Link from "next/link";
import { HeaderAction } from "./header-action";

const Header = () => {
  return (
    <div className="p-4 bg-gray-200 flex items-center justify-between">
      <h1 className="text-2xl font-bold">Header Component</h1>
      <ul className="flex space-x-4">
        <li>
          <button className="bg-blue-600 text-white p-2 rounded">
            <Link href="/sample1">Sample 1</Link>
          </button>
        </li>
        <li>
          <button className="bg-blue-600 text-white p-2 rounded">
            <Link href="/sample2">Sample 2</Link>
          </button>
        </li>
        <li>
          <button className="bg-purple-600 text-white p-2 rounded">
            <Link href="/sample3">Sample 3 (Cascade)</Link>
          </button>
        </li>
        <li>
          {/* HoistでSlotに転送されたコンテンツがここに表示される */}
          <HeaderAction.Slot />
        </li>
      </ul>
    </div>
  );
};

export default Header;
