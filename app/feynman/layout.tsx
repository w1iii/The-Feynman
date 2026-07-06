import { UserProvider } from "../lib/context/user-context";

export default function FeynmanLayout({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
