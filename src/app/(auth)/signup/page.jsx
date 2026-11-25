import SignupForm from "./SignupForm";

export const metadata = { title: "Sign Up | Fallora" };

export default async function SignupPage({ searchParams }) {
    const { role } = await searchParams;
    return <SignupForm variant={role === "seller" ? "seller" : "buyer"} />;
}
