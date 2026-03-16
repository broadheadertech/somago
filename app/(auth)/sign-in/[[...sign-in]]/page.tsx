import { SignUp } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignUp forceRedirectUrl="/" signInUrl="/sign-in" />;
}
