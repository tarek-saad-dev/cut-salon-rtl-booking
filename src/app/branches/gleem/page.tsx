import BranchPage from "@/components/branches/BranchPage";
import { branches } from "@/lib/branches";
import { publicPageMetadata } from "@/lib/seo";

const branch = branches.gleem;
export const metadata = publicPageMetadata(branch.path, branch.title, branch.description);

export default function Page() {
  return <BranchPage branch={branch} other={branches.campCaesar} />;
}
