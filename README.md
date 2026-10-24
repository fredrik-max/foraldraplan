# Föräldraplan

En webbapp för att planera föräldraledighet och hushållsbudget enligt svenska regler.
Allt är tomt från början och fylls i av användaren under fliken **Inställningar**.

## Funktioner
- **Inställningar:** namn, månadslöner, ny lön, SGI, arbetsgivarens tillägg (kr/dag, max dagar, slutdatum), kommunal skattesats, beräknat födelsedatum, barn sedan tidigare, perioder och förskola.
- **Tidslinje och årshjul:** inkomster netto, utgifter, resultat och föräldradagar per månad.
- **Budget:** stafflat uttag av föräldradagar med automatisk utjämning av inkomsten (max antal dagar), egna inkomster, utgifter och scenarier (sämre/normal/bättre).
- **Inköp:** saker med flera länkar, beskrivning, nypris, begagnatpris, andrahandsvärde och automatisk produktbild.
- **Om:** hur beräkningen fungerar och källor.

## Beräkning
- Föräldrapenning: 80 % × 0,97 av SGI / 365, tak 10 prisbasbelopp (Försäkringskassan).
- Skatt: Skatteverkets tekniska beskrivning (SKV 433) – grundavdrag, kommunal och statlig skatt, public service, begravnings- och kyrkoavgift, jobbskatteavdrag på lön och skattereduktion för förvärvsinkomst. Lön dras enligt tabell per månad, resten av årsskatten läggs på föräldrapenning och tillägg. Kontrollerad mot Skatteverkets räkneexempel 2026.
- Barnbidrag 1 250 kr/barn och månad, halvt vid växelvis boende, plus flerbarnstillägg.

## Data
Allt sparas lokalt i webbläsaren (localStorage). Exportera/importera som JSON-fil under Inställningar.

## Drift
Statisk sida på Vercel. `api/og.js` är en serverlös funktion som hämtar produktbilder (og:image) från länkar.
