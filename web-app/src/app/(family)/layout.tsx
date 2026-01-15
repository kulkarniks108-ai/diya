import { FamilyTabs } from "@/components/family-tabs";


export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FamilyTabs />
    </>
  );
}
