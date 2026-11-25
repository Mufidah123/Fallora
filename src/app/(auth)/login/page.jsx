import LoginForm from "./LoginForm";

export const metadata = { title: "Login | Fallora" };

export default async function LoginPage({ searchParams }) {
    const { role } = await searchParams;
    return <LoginForm variant={role === "seller" ? "seller" : "buyer"} />;
}
