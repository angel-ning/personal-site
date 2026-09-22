import { InlineScript } from "@/components/inline-script";
import Link from "next/link";

// "/" has no content of its own: send visitors to their language, remembered or from the browser.
const redirect = `(function(){var l;try{l=localStorage.getItem('lang')}catch(e){}if(l!=='en'&&l!=='zh'){l=/^zh/i.test(navigator.language||'')?'zh':'en'}location.replace('/'+l+'/'+location.hash)})();`;

export default function RootPage() {
  return (
    <>
      <InlineScript html={redirect} />
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/en/" />
      </noscript>
      <p style={{ fontFamily: "system-ui", padding: 24 }}>
        <Link href="/en/">English</Link> · <Link href="/zh/">中文</Link>
      </p>
    </>
  );
}
