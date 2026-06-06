import { SignIn, SignUp } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="w-full max-w-md space-y-8 mb-8 text-center">
        <div className="flex justify-center">
          <div className="bg-primary p-3 rounded-xl shadow-sm">
            <img src={`${basePath}/logo.svg`} alt="Logo" className="w-8 h-8 text-primary-foreground stroke-current" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in to your account</h2>
        <p className="text-muted-foreground text-sm">
          Access the procurement management system.
        </p>
      </div>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

export function SignUpPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="w-full max-w-md space-y-8 mb-8 text-center">
        <div className="flex justify-center">
          <div className="bg-primary p-3 rounded-xl shadow-sm">
            <img src={`${basePath}/logo.svg`} alt="Logo" className="w-8 h-8 text-primary-foreground stroke-current" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h2>
        <p className="text-muted-foreground text-sm">
          Join the procurement management platform.
        </p>
      </div>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}
