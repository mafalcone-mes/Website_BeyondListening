import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/sections/site-header";
import { copy } from "@/content/copy";
import { GlobalPlayer } from "@/features/player/global-player";
import { SearchBox } from "@/features/search/search-box";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader
        siteName={copy.site.name}
        skipLabel={copy.nav.skipToContent}
        shareLabel={copy.nav.share}
        nav={[
          { href: "/archive", label: copy.nav.archive },
          { href: "/playlists", label: copy.nav.playlists },
          { href: "/about", label: copy.nav.about },
        ]}
        search={<SearchBox mode="navigate" />}
      />
      <main id="content" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter
        siteName={copy.site.name}
        note={copy.footer.note}
        links={[
          { href: "/about", label: copy.nav.about },
          { href: "/privacy", label: copy.footer.privacy },
          { href: "/terms", label: copy.footer.terms },
          { href: "/license", label: copy.footer.license },
          { href: "/manage", label: copy.footer.manage },
        ]}
      />
      <GlobalPlayer />
    </>
  );
}
