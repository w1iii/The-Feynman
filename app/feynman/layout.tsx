import { UserProvider } from "../lib/context/user-context";
import "./page.css";
import "./settings/page.css";

export default function FeynmanLayout({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
