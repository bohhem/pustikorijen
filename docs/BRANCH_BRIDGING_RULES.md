# Branch, Bridge & Partnership Rules

Zbir pravila i najboljih praksi za grane, mostove i veze između različitih porodičnih grana.

## 1. Kako kreirati novu granu

| Korak | Radnja | Napomena |
| --- | --- | --- |
| 1 | **Provjeri da li imaš pravo** | Samo prijavljeni korisnici mogu kreirati granu. Osnivač (kreator) automatski postaje Guru te grane. |
| 2 | **Definiši kontekst** | Odluči koje prezime/linija, grad i administrativni region pripadaju novoj grani. Provjeri da ne postoji duplikat. |
| 3 | **Prođi kroz čarobnjak** (`Branches → "Create Branch"`) | Unesi naziv grane, lokaciju, vidljivost i kratak opis. Po kreiranju dobijaš rolu Gurua. |
| 4 | **Pozovi saradnike** | Otvori stranicu grane → karticu **Members** → klikni **"Invite member"**. Pošalji poziv na e-mail i po prihvatanju možeš promovisati člana u Gurua. |
| 5 | **Unesi kanonske osobe** | Dodaj precizne podatke o precima/grani koja zaista pripada toj grani. Popuni roditelje gdje je poznato kako bi se generacije automatski računale. |

> **Važno**: Svaka osoba ima tačno _jednu_ “matičnu” granu. Ne kreiraj duplikate u drugim granama – za to postoje mostovi.

---

## 2. Mostovi (bridges) između dvije grane

1. **Nađi kanonsku osobu** u njenoj matičnoj grani – tamo gdje su joj roditelji i kompletno porijeklo.
2. U grani koja treba da “vidi” tu osobu odaberi `People → "Link existing person"`, pretraži ime i podnesi **bridge request**.
3. Guru matične grane pregledava zahtjev (Pending) i odobrava ili odbija.
4. Kada oba Gurua potvrde, most postaje aktivan – osoba je vidljiva kao “bridge node” u drugoj grani.
5. **SuperGuru** (ili Admin) pregleda sve mostove:
   - Postavlja **jedan primarni most** po paru grana.
   - Po potrebi dodaje **override generacije** za prikaz u drugoj grani (vidi §4).
   - Odbacuje višak mostova kako bi veza ostala čista.

**Podsjetnik**: Most nije nova osoba – to je prozor ka originalnom kanonskom zapisu. Sve izmjene i dalje rade matične grane.

---

## 3. Partnerstva preko granica

1. **Provjeri da su osobe kreirane** u svojim matičnim granama.
2. **Kreiraj most** za partnera koji dolazi iz druge grane (npr. Elvir iz Isovića u Kahviće).
3. **Postavi primarni most** nakon odobrenja – SuperGuru osigurava da baš taj most veže dvije grane.
4. **(Po želji)** postavi vizuelni override generacije za osobu koja dolazi kao most, da se poravna s partnerom.
5. **Unesi partnerstvo** u grani koja vodi evidenciju o toj vezi (obično grana gdje su zajednički potomci ili gdje par živi). Prilikom unosa odaberi kanonsku osobu + bridged partnera, dodaj datume, napomene itd.

> ✅ Vezu unosimo Tek **nakon** što most funkcioniše i primarni most je postavljen. U suprotnom, par može završiti u različitim generacijama ili izgubimo kontekst ako se most kasnije odbaci.

---

## 4. Generacije i Override

| Koncept | Pravilo |
| --- | --- |
| **Kanonska generacija** | Čuva se u matičnoj grani (matični zapis). Računa se automatski, ili je ručno namještaju Gurui matične grane. |
| **Override generacije** | Čuva se u bridge zapisu. SuperGuru ga može postaviti prema grani koja prikazuje osobu, ako treba da bude u istom redu s partnerom/porodicom. |
| **Rekalkulacija** | Nakon promjene roditelja ili ručnog setovanja generacije u matičnoj grani, pokreni opciju “Recalculate generations” da grana ostane dosljedna. |
| **Šta NE raditi** | Ne mijenjaj generaciju kanonske osobe unutar tuđe grane – koristi override na mostu. |

---

## 5. Primarni mostovi

- Svaki par grana mora imati samo **jedan** primarni most.
- Primarni most dobija naglašenu isprekidanu liniju i ⭐ u grafu.
- Za postavljanje novog primarnog mosta:
  1. Odbij ostale mostove u tom paru (ili ih skloni iz primarnog statusa).
  2. Dodijeli primarni flag željenom mostu putem SuperGuru konzole.
  3. Ako treba, namjesti override generacije.

### Šta uraditi s neprimarnim mostovima?
- Razloga za više mostova može biti (rodbina, kumstvo), ali u grafu ostavljaj samo jedan aktivan.
- SuperGuru treba da klikne **Reject** na redundantnim mostovima. Time se most arhivira (ostaje u istoriji), ali ne zagušuje prikaz. Po potrebi ga je lako ponovo aktivirati.

---

## 6. Prikaz više grana u porodičnom stablu

1. U grani koju trenutno posmatraš provjeri da su svi relevantni mostovi **approved**.
2. Na **Family Tree** stranici uključi opciju “Connected branches”.
3. Primarni mostovi će se prikazati kao isprekidane žute linije (sa strelicom ako postoji override generacije).
4. Partneri iz drugih grana prikazuju se s bilo kakvim override generacijama koje si postavio.

> Savjet: Periodično provjeri SuperGuru “Bridge issues” stranicu da počistiš suvišne mostove – uredan ulaz znači uredan graf.

---

## 7. Kratki workflow podsjetnik

1. **Kreiraj granu** → dodaj matične članove i rodoslov.
2. **Kreiraj most** → odobri ga u matičnoj grani → SuperGuru postavlja primarni most.
3. **(Opcionalno) Override generacije** → zbog vizuelne usklađenosti u drugoj grani.
4. **Unesi partnerstvo** tek kad most funkcioniše.
5. **Pregledaj više grana** preko Family Tree prikaza.

Slijedeći ova pravila čuvamo tačnost matičnih zapisa, a i dalje prikazujemo kako različite porodice (grane) ostaju povezane.
