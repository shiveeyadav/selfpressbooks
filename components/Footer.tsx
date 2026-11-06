import Link from 'next/link';
import { siteConfig } from '@/config/site';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <nav aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/delivery">Delivery</Link>
          <Link href="/returns">Returns</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/signup">Publish with us</Link>
        </nav>
        <div>
          {siteConfig.siteName} is operated by {siteConfig.companyName}. Books are printed to order in India and posted to
          the UK by India Post.
        </div>
      </div>
    </footer>
  );
}
