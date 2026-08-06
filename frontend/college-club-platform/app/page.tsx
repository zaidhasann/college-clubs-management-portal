import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Logo />
        <nav>
          <Link href="/login">
            <Button variant="primary" size="md">Login</Button>
          </Link>
        </nav>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 z-20 animate-fadeInUp">
          <span className="inline-block bg-red-900/30 text-red-300 px-3 py-1 rounded-full text-sm">All Your Clubs. One Platform.</span>
          <h1 className="text-5xl font-extrabold leading-tight">
            Manage.
            <br />
            Connect.
            <br />
            <span className="hero-gradient-text">Grow Together.</span>
          </h1>
          <p className="text-zinc-400 max-w-xl">
            Clubमंच is your all-in-one platform to manage clubs, organize events, and build an engaged community.
          </p>

          <div className="flex gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-[#7c3aed] to-[#ef4444] hover:from-[#6b21a8] hover:to-[#dc2626] text-white cta-raise animate-pulse">Continue</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" size="lg" className="cta-raise">Register</Button>
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg animate-pan">
            <Image
              src="/landing-hero.svg"
              alt="Campus fair illustration"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              style={{ objectFit: "cover" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/60 via-transparent to-zinc-900/70" />
          </div>

          {/* decorative glows */}
          <div className="glow-dot glow-1 animate-float" style={{ top: 40, left: 48, width: 22, height: 22, animationDelay: '0s' }} />
          <div className="glow-dot glow-2 animate-float" style={{ top: 120, left: 220, width: 30, height: 30, animationDelay: '0.6s' }} />
          <div className="glow-dot glow-3 animate-float" style={{ top: 220, left: 380, width: 26, height: 26, animationDelay: '1s' }} />

          <Card className="relative bg-transparent p-6 glass-card">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Choose Your Path</h3>
              <p className="text-zinc-400">Select how you want to get started with Clubमंच</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-zinc-900/60 rounded-xl p-4 hover:scale-[1.02] transition-transform duration-300" style={{ animationDelay: '120ms' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#7c3aed] to-[#ef4444] flex items-center justify-center text-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15 8H9L12 2Z" fill="white"/><path d="M4 22H20V18H4V22Z" fill="white"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold">I'm an Admin</h4>
                      <p className="text-zinc-400 text-sm mt-2">Create and manage clubs, organize events, approve members, and oversee activities.</p>
                    </div>
                  </div>
                    <div className="mt-4">
                    <Link href="/login">
                      <Button className="w-full bg-gradient-to-r from-[#7c3aed] to-[#ef4444] hover:from-[#6b21a8] hover:to-[#dc2626] text-white cta-raise" size="md">Continue as Admin</Button>
                    </Link>
                  </div>
                </div>

                <div className="bg-zinc-900/60 rounded-xl p-4 hover:scale-[1.02] transition-transform duration-300" style={{ animationDelay: '240ms' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#ef4444] to-[#7c3aed] flex items-center justify-center text-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3C8 3 5 6 5 10C5 14 12 21 12 21C12 21 19 14 19 10C19 6 16 3 12 3Z" fill="white"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold">I'm a Member</h4>
                      <p className="text-zinc-400 text-sm mt-2">Join clubs, participate in events, connect with others, and track activities.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href="/login">
                      <Button variant="secondary" className="w-full" size="md">Continue as Member</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}