import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xs bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-xs tracking-wider border border-primary/20 shadow-none">
              SW
            </div>
            <span className="font-mono text-base font-bold uppercase tracking-wider text-foreground">
              SWGVI
            </span>
          </Link>
        </div>
        <LoginForm/>
    </div>
  );
}
