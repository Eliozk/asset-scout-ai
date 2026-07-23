import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Terms",
  description: "AssetScout AI's privacy notice and terms of use.",
  alternates: { canonical: "/legal" },
};

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-text-muted">{children}</div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Privacy &amp; Terms</h1>
      <p className="mt-2 text-sm text-text-muted">
        AssetScout AI is an independent, personal portfolio project with no user accounts. This page
        explains, as accurately as possible, what that means in practice, what data is and isn&apos;t
        processed, and what this site does and doesn&apos;t take responsibility for. It is not a
        substitute for advice from a qualified lawyer in your jurisdiction, and nothing here is a
        promise about how this project will operate indefinitely into the future.
      </p>

      <Section title="Who operates this site">
        AssetScout AI is built and operated by Elioz Kolani as a personal, non-commercial project. For
        any question, correction, or concern (including a copyright/licensing concern about how a
        third-party result is displayed), open an issue on the{" "}
        <a
          href="https://github.com/Eliozk/asset-scout-ai/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring rounded font-medium text-accent-cyan underline"
        >
          GitHub repository
        </a>
        .
      </Section>

      <Section title="Cost to use">
        AssetScout AI does not require an account, a subscription, or any payment information, and
        nothing on this site sells anything, processes a payment, or stores payment details. It is
        currently built and operated to run on free tiers of its hosting, Gemini, and integrated-provider
        services at low traffic. That is a description of how it works today, not a permanent
        commitment — the quotas, availability, and pricing of the third-party services it depends on
        (hosting, Gemini, and every source on the{" "}
        <a href="/sources" className="focus-ring rounded font-medium text-accent-cyan underline">
          Sources
        </a>{" "}
        page) are set by those providers and may change without notice, and could in principle affect
        this project&apos;s ability to keep operating exactly as described. Google&apos;s free Gemini
        tier specifically is not promised to remain free or available forever — if it stops being
        available, AssetScout AI simply continues using its existing local search, as it always has.
      </Section>

      <Section title="What data this site processes">
        <p>
          <strong className="text-foreground">Favorites</strong> are saved only in your own browser&apos;s{" "}
          <code className="rounded bg-surface-elevated px-1 py-0.5 text-xs">localStorage</code>. They
          are not intentionally uploaded, transmitted, or stored by AssetScout AI anywhere else —
          clearing your browser data removes them.
        </p>
        <p>
          <strong className="text-foreground">Search queries</strong> you type are sent to AssetScout
          AI&apos;s own server routes, which forward the relevant part of that query to whichever
          integrated providers apply (e.g. Sketchfab, Pixabay, ambientCG) to retrieve results on your
          behalf.
        </p>
        <p>
          <strong className="text-foreground">Gemini query understanding</strong> is optional and only
          runs when you explicitly submit a search (never on every keystroke) and a Gemini API key is
          configured on the server. When it succeeds, the search phrase you submitted is sent to
          Google&apos;s Gemini API to be translated/interpreted into a structured search description —
          never your favorites, browsing history, IP address handling beyond what Google&apos;s own
          infrastructure sees as the request origin, or any other unrelated data. Google&apos;s own{" "}
          <a
            href="https://ai.google.dev/gemini-api/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded font-medium text-accent-cyan underline"
          >
            Gemini API Additional Terms of Service
          </a>{" "}
          apply to that request. On the free tier this app uses, Google&apos;s terms state that submitted
          content may be used to improve Google&apos;s products, and that de-identified input/output may
          be reviewed by human reviewers — please don&apos;t type personal, confidential, or sensitive
          information into the search box. If Gemini is unavailable, misconfigured, times out, or returns
          an error for any reason, AssetScout AI automatically falls back to its existing local
          keyword/semantic search with no interruption — this never produces an empty page. No API key or
          Gemini configuration detail is ever sent to your browser.
        </p>
        <p>
          AssetScout AI uses Vercel Web Analytics to collect anonymous, aggregate usage information,
          such as page views, referrers, approximate country, device, and browser type. Vercel Web
          Analytics does not use cookies and is not used here to identify individual visitors or build
          personal profiles. AssetScout AI does not run advertising scripts or non-essential tracking
          cookies. That said, request
          processing is not limited to this project&apos;s own code: Vercel (the hosting provider) and
          the upstream providers a query is forwarded to necessarily process standard web request data —
          things like IP address, user-agent, request contents, and operational logs — under their own
          policies, independent of this notice. See{" "}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded font-medium text-accent-cyan underline"
          >
            Vercel&apos;s privacy policy
          </a>{" "}
          and each provider&apos;s own policy (linked from the{" "}
          <a href="/sources" className="focus-ring rounded font-medium text-accent-cyan underline">
            Sources
          </a>{" "}
          page) for what each of them does with that data.
        </p>
      </Section>

      <Section title="Local AI ranking vs. optional cloud query understanding">
        <p>
          The semantic search <em>ranking</em> model runs entirely in your browser (via Transformers.js),
          downloaded once from Hugging Face&apos;s public model hub — your search text is never sent
          anywhere for ranking purposes.
        </p>
        <p>
          Gemini is a separate, optional step used only to <em>understand</em> what an explicitly-submitted
          search means (translating Hebrew into English, for example) — it never ranks or chooses results,
          never picks which providers to query, and never sees or returns provider names, URLs, prices, or
          licenses. See &quot;What data this site processes&quot; above for exactly when and what is sent
          to it, and what happens when it&apos;s unavailable.
        </p>
      </Section>

      <Section title="Integrated sources &amp; external links">
        <p>
          Search results are fetched live (or served from a periodically refreshed static snapshot) from
          each integrated source&apos;s official API/feed — see the{" "}
          <a href="/sources" className="focus-ring rounded font-medium text-accent-cyan underline">
            Sources
          </a>{" "}
          page for the complete current list and exactly what &quot;live&quot; means for each one. Each
          result links back to that source&apos;s own page, and its own license/terms govern actual use of
          that asset.
        </p>
        <p>
          The additional marketplace cards further down the Explore page (Unity Asset Store, Fab,
          itch.io, and others) are outbound links only — clicking one takes you to that marketplace&apos;s
          own site. AssetScout AI does not search, scrape, retrieve, or verify anything from them, and
          has no relationship with or endorsement from any of them. The Sources page also lists sources
          that were researched but are not integrated — either verified-eligible and simply not built
          yet, or explicitly excluded because their own terms don&apos;t permit this use.
        </p>
      </Section>

      <Section title="A discovery tool, not a seller or licensor">
        AssetScout AI is a search and discovery tool. It does not sell, license, host for download, or
        take any part in a transaction for any asset it shows or links to — every asset remains the
        property of, and is governed entirely by the terms of, its original source. Before using any
        asset, verify its actual license, price, availability, compatibility, and download rights
        directly at that source (or, for the external marketplace links, at the marketplace itself) —
        never rely on this site&apos;s labels alone.
      </Section>

      <Section title="No warranty">
        Results, match scores, license labels, and &quot;why it fits&quot; explanations are generated
        automatically from third-party data or a local heuristic/AI model — they may be incomplete,
        outdated, or wrong. This site is provided &quot;as is,&quot; without warranty of any kind, and
        without any guarantee of uptime, availability, or accuracy.
      </Section>

      <Section title="Limitation of liability">
        To the fullest extent permitted by law, the operator of AssetScout AI is not liable for any
        damages or losses arising from your use of this site, its search results, or any third-party
        site it links to.
      </Section>

      <Section title="Changes to this notice">
        This notice may be updated as the project changes. The current version always reflects what the
        site actually does — if you find a mismatch between this page and the site&apos;s real
        behavior, please report it via the GitHub link above.
      </Section>
    </div>
  );
}
