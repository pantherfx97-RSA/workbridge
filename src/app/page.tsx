
const features = [
  {
    number: "01",
    title: "Know your strengths",
    description:
      "Understand your existing skills and how they connect to your career goals.",
  },
  {
    number: "02",
    title: "Close your skills gaps",
    description:
      "Discover what you need to learn and follow a practical development plan.",
  },
  {
    number: "03",
    title: "Prove your abilities",
    description:
      "Build a portfolio of projects, certificates and practical experience.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080d18] text-white">
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm text-blue-300">Your next chapter starts here</span>
          <h1 className="mt-7 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">Your potential deserves an <span className="text-blue-400">opportunity.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">Turn what you can do into your next opportunity. Discover your strengths, close your skills gaps and build a practical path towards work.</p>
          <div id="get-started" className="mt-8 flex flex-wrap gap-4">
            <a href="/assessment" className="rounded-xl bg-blue-500 px-6 py-4 font-semibold hover:bg-blue-400">Explore your potential -&gt;</a>
            <a href="/assessment" className="rounded-xl border border-slate-700 px-6 py-4 font-semibold hover:bg-slate-800">Discover WorkBridge</a>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-400">
            <span>&#10003; Skills-first approach</span>
            <span>&#10003; Practical career pathways</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-[#101827] p-6 shadow-2xl shadow-blue-950/30 sm:p-8">
          <p className="text-sm text-slate-400">YOUR CAREER JOURNEY</p>
          <h2 className="mt-2 text-2xl font-bold">Make your next move.</h2>
          <div className="mt-7 rounded-2xl border border-slate-700 bg-[#0b1220] p-5">
            <p className="text-sm text-slate-400">EXAMPLE CAREER PATHWAY</p>
            <h3 className="mt-2 text-lg font-semibold">IT Support Technician</h3>
            <div className="mt-6 space-y-4">
              {["Identify your strengths", "Discover skills to develop", "Build your action plan"].map((item, index) => (
                <div key={item} className="flex items-center gap-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-sm text-blue-300">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-sm text-slate-200">{item}</span>
                  <span className="ml-auto text-slate-500">-&gt;</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-700 bg-[#0b1220] p-4">
              <p className="text-sm text-slate-400">Your skills</p>
              <p className="mt-2 font-bold">Discover</p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-[#0b1220] p-4">
              <p className="text-sm text-slate-400">Your next step</p>
              <p className="mt-2 font-bold">Take action</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Explore your skills, follow a personalised learning roadmap, and build evidence of your progress.</p>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-800 bg-[#0b1220] px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
          {[
            ["01", "Understand", "Discover what you can already do."],
            ["02", "Develop", "Build the skills you still need."],
            ["03", "Move forward", "Prepare for relevant opportunities."],
          ].map(([number, title, description]) => (
            <div key={number} className="flex gap-4">
              <span className="text-sm font-bold text-blue-400">{number}</span>
              <div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">A better way forward</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-bold sm:text-4xl">More than finding a job. Building your future.</h2>
        <p className="mt-5 max-w-2xl leading-7 text-slate-400">Understand your abilities, demonstrate your potential and take meaningful steps towards employment.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="rounded-2xl border border-slate-800 bg-[#101827] p-7 transition hover:-translate-y-1 hover:border-blue-400/50">
              <span className="text-sm font-semibold text-blue-400">{feature.number}</span>
              <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl rounded-3xl border border-blue-400/20 bg-blue-500/10 px-7 py-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Your future is worth building</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold sm:text-5xl">You have potential. Let us turn it into progress.</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-400">Start by understanding where you are. Then take the next step towards where you want to be.</p>
          <a href="/assessment" className="mt-8 inline-block rounded-xl bg-blue-500 px-6 py-4 font-semibold hover:bg-blue-400">Start your journey -&gt;</a>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        &#169; {new Date().getFullYear()} WorkBridge. Turn what you can do into your next opportunity.
      </footer>
    </main>
  );
}
