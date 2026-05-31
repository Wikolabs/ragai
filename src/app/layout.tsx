import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
const jakarta = Plus_Jakarta_Sans({ subsets:["latin"], variable:"--font-body", display:"swap", weight:["400","500","600","700","800"] });
export const metadata: Metadata = { title:"RagAI — Agent IA de Q&A documentaire", description:"Interrogez vos documents, PDF, wikis et bases de connaissance en langage naturel avec l'IA RAG. Réponses précises avec sources citées." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin:0, fontFamily:"var(--font-body),'Plus Jakarta Sans',sans-serif", background:"#04080F" }}>
        {children}
        <Script id="cal-embed" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `(function(C,A,L){var p=function(a,ar){a.q.push(ar);};var d=C.document;C.Cal=C.Cal||function(){var cal=C.Cal;var ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];d.head.appendChild(d.createElement("script")).src=A;cal.loaded=true;}if(ar[0]===L){const api=function(){p(api,arguments);};const namespace=ar[1];api.q=api.q||[];if(typeof namespace==="string"){cal.ns[namespace]=cal.ns[namespace]||api;p(cal.ns[namespace],ar);p(cal,["-",namespace,ar[2]]);}else p(cal,ar);return;}p(cal,ar);};})(window,"https://app.cal.com/embed/embed.js","init");Cal("init","wk30min",{origin:"https://app.cal.com"});Cal.ns["wk30min"]("ui",{"theme":"dark","hideEventTypeDetails":false,"layout":"month_view"});` }} />
      </body>
    </html>
  );
}
