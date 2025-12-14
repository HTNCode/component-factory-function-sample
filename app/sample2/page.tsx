import { HeaderAction } from "@/components/header-action";
import Link from "next/link";

const Sample2 = () => {
  return (
    <>
      <HeaderAction.Hoist>
        <button className="bg-red-600 text-white p-2 rounded">
          <Link href="/">Sample2 to home</Link>
        </button>
      </HeaderAction.Hoist>
      <h2>This Page is Sample2</h2>
    </>
  );
};

export default Sample2;
