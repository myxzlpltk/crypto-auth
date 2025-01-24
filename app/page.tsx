import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Link className="btn btn-primary" href="/login">Login</Link>
    </div>
  );
}
