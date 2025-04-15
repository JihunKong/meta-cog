import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

export default function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await signOut();
    localStorage.clear();
    sessionStorage.clear();
    router.replace("/login");
  };
  return <button onClick={handleLogout}>로그아웃</button>;
}
