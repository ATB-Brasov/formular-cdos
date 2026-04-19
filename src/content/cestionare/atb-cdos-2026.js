import { uniq } from "$lib/ds_helpers.js";
import lista from "./lista_facultati_unitbv_2026.js";

function danu(nume, titlu, desc = null, obligatoriu = true) {
    return {
        nume,
        titlu,
        desc,
        obligatoriu,
        tip: "selecție",
        optiuni: () => ["da", "nu"],
    };
}

/**@type{import("@content/cestionare/types.js").Cestionar}*/
export default {
    id: "atb-cdos-2026",
    titlu: "Sondaj CDOS 2026",
    descriere:
        "Sondaj pentru evaluarea respectării Codului de Drepturi și Obligații a Studenților din Universitatea Transilvania din Brașov.",
    pagini: [
        {
            titlu: "Date Academice",
            descriere: "",
            cimpuri: [
                {
                    tip: "selecție",
                    nume: "facultatea",
                    titlu: "Facultatea",
                    obligatoriu: true,
                    optiuni: () =>
                        lista.facultati.map((o) => o.fac).filter(uniq),
                },
                {
                    tip: "selecție",
                    nume: "ciclu",
                    titlu: "Ciclu de Studii",
                    optiuni: (rspi) =>
                        lista.facultati
                            .filter((o) => o.fac === rspi["facultatea"])
                            .map((o) => o.cic)
                            .filter(uniq),
                },
                {
                    tip: "selecție",
                    nume: "forma",
                    titlu: "Forma de Învățămînt",
                    optiuni: (rspi) =>
                        // TODO: Adaugă abilitatea de a întoarce un mesaj în caz că filtrul generează listă goală
                        lista.facultati
                            .filter(
                                (o) =>
                                    o.fac === rspi["facultatea"] &&
                                    o.cic === rspi["ciclu"],
                            )
                            .map((o) => o.frm)
                            .filter((e, i, self) => i === self.indexOf(e)),
                },
                {
                    tip: "selecție",
                    nume: "programul",
                    titlu: "Programul de Învățămînt",
                    optiuni: (rspi) =>
                        lista.facultati
                            .filter(
                                (o) =>
                                    o.fac === rspi["facultatea"] &&
                                    o.cic === rspi["ciclu"] &&
                                    o.frm === rspi["forma"],
                            )
                            .map((o) => o.prg)
                            .filter(uniq),
                },
            ],
        },
        {
            titlu: "Întrebări",
            descriere: "Întrebări pe baza Codului DOS",
            cimpuri: [
                danu(
                    "discriminarea",
                    "Ai simțit discriminare sau tratamente inechitabile din partea cadrelor didactice? [art. 1] ",
                ),
                danu(
                    "schim-contr-stud",
                    "Contractele de studii au fost modificate în timpul anului? [art. 3 (3)] [LÎS 199/2023 art. 34 (1)]",
                    "Contractul de studii încheiat între Universitate și student nu poate fi modificat pe parcursul anului universitar. Un an universitar începe de pe 1 octombrie până pe 29 septembrie conform Legii Învățământului Superior. Contractul conține obiectul contractului, drepturile și obligațiile părților, cuantumul taxei de școlarizare și modalitatea de plata, după caz, răspunderea părților și termenul de valabilitate a contractului.",
                ),
                danu(
"acces-org",
                    "Ți-a fost restricționat accesul la structuri sau organizații studențești? [art.4 (1)]",
                ),
                danu(
                    "diz-asig-stud","Consideri că ți s-au asigurat condiții adecvate pentru desfășurarea studiilor cu dizabilități?  [art. 6 (1)]",
                    "Studenții cu dizabilități fizice au dreptul la acces adaptat în spațiile universitare, la asigurarea unui interpret mimico-gestual, precum și la condiții adecvate pentru desfășurarea a activităților academice, cum ar fi materiale educaționale și suport de curs personalizate în funcție de dizabilitate, adaptarea metodelor de evaluare în acord cu dizabilitatea, însoțitor în timpul susținerii examenului, etc.",
                ),
                danu("diz-sprijin-practica",
                    "Ai putut beneficia de sprijin pentru identificare și derularea practicii de specialitate?  [art. 6 (3) b)]",
                ),
                danu("diz-benef-info",
                    "Ai beneficiat de servicii de informare și comunicații adecvate?  [art. 6 (3) c)]",
                ),
                danu("diz-rest-tab",
                    "Ți-a fost restricționat dreptul de a participa la tabere studențești?  [art. 6 (3) d)]",
                ),
                danu("fisa-disciplina",
                    "Ai primit fișa disciplinei în cadrul primelor 2 săptămâni de curs al semestrului? (toate informațiile esențiale despre o disciplină: denumirea, obiectivele, conținutul pe săptămâni, metodele de predare și evaluare, bibliografia și competențele urmărite.) [art. 7 g)]",
                ),
                danu("mod-eval",
                    "Modalitatea de evaluare a fost schimbată fără acordul tău? [art. 7 g)]",
                ),
                danu("suport-curs",
                    "Ți s-a acordat  suport de curs gratuit în format fizic sau electronic? [art. 7 e)]","Suportul de curs explică conținutul unui curs universitar. Conține teoria predată, exemple, uneori exerciții și bibliografie. ",
                ),
                danu("feedback-prof",
                    "Ai primit mereu un feedback de la profesor, când l-ai cerut ? [art. 7 p)]",
                ),
                danu("contestare-note",
                    "Ai avut posibilitatea să contești notele primite? [art. 7 r)]",
                ),
                danu("comunicare-rezultate-examene",
                    "Ți-au fost comunicate rezultatele examenelor în decurs de 2–3 zile? (mai mult de 24h) [art. 7 q)]",
                ),
                danu("ore-suprapuse",
                    "Ai avut ore suprapuse și ești nevoit să lipsești de la un un curs pentru a participa la altul?",
                ),
                danu("8-ore-activitate",
                    "Ai avut mai mult de 8 ore de activitatea academică pe zi? [art. 7 (4)]",
                ),
                danu("îndrumător-de-an","Ai avut un îndrumător de an activ? (???) [art. 7 i)]"),
                danu("publicarea-decizii-regulamente",
                    "Deciziile luate în cadrul structurilor universitare,  regulamentele sau rapoartele au fost publicate? [art. 7 k)]",
                ),
                danu("practica-finanțare",
                    "Ai primit finanțare pentru practică în alte localități? [art. 9 b)]",
                ),
                danu("practica-drepturi-info",
                    "Ai fost informat despre drepturile tale în timpul practicii?",
                ),
                danu("practica-lista-locuri",
                    "Universitatea ți-a acordat o listă cu posibile locuri de practică? [art. 9 (2)]",
                ),
                danu("taxă-pentru-eliberare-acte",
                    "Ai fost taxat pentru eliberarea actelor de studii? [art. 11 (2)]",
                    "Toate actele de studii eliberate de Unitbv, precum și cele care atestă statutul de student, precum adeverințele, carnetele sau legitimațiile, se eliberează în mod gratuit. În cazul eliberării duplicatelor actelor de studii se poate percepe o taxă.",
                ),
                danu("facilități-transport",
                    "Ți-au fost restricționate facilitățile de transport care le dispui conform prevederilor legale? [art. 11 (3)]",
                    "Studenții înmatriculați la formă de învățământ cu frecvență în Universitatea Transilvania beneficiază de facilități de transport conform prevederilor legale, pana la împlinirea vârstei de 30 de ani.",
                ),
                danu("medie-bursă-merit",
                    "A fost postată ultima medie pentru bursa de merit? (???)",),
                danu("info-servicii",
                    "Ai fost informat despre drepturile și serviciile disponibile (consiliere, medical etc.)? [art. 12 a)]",
                ),
                danu("acces-rapoarte-cadre-didactice",
                    "Rapoartele de evaluare a cadrelor didactice sunt accesibile și ușor de găsit?",
                ),
                danu("prob-nemenționate",
                    "Ai avut alte probleme care nu au fost menționate mai sus ?",
                ),
                {
                    tip: "text",
                    nume: "problema",
                    titlu:"Descrie problema întâmpinată:",
                },
                {
                    tip: "text",
                    nume: "propuneri",
                    titlu:"Ce soluții ai avea pentru a remedia această/aceste problemă/probleme?",
                },
            ],
        },
    ],
};
