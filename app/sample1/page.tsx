import { HeaderAction } from "@/components/header-action";
import Link from "next/link";

const Sample1 = () => {
  return (
    <>
      <HeaderAction.Hoist>
        <button className="bg-green-600 text-white p-2 rounded">
          <Link href="/sample1">Sample1 to home</Link>
        </button>
      </HeaderAction.Hoist>
      <h2>This Page is Sample1</h2>
    </>
  );
};

export default Sample1;
