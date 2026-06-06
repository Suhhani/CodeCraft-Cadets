import { SignIn, SignUp } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center py-12 px-4 bg-muted/40">
      <div className="w-full max-w-md space-y-5 mb-6 text-center">
        <div className="flex justify-center">
          <div className="bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-sm">
            VB
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in to VendorBridge</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Access your procurement management platform.
          </p>
        </div>
      </div>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

export function SignUpPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center py-12 px-4 bg-muted/40">
      <div className="w-full max-w-md space-y-5 mb-6 text-center">
        <div className="flex justify-center">
          <div className="bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-sm">
            VB
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Join VendorBridge to manage procurement end-to-end.
          </p>
        </div>
      </div>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}
