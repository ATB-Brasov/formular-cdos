/** @import { AfiseazaCimp } from "@content/cestionare/types.js" */
import { uniq } from "$lib/ds_helpers.js";
import lista from "./lista_facultati_unitbv_2026.js";

/**
 * @typedef {object} OptiuniDanu
 * @property {string | null} [desc=null]
 * @property {boolean} [obligatoriu=true]
 * @property {import("@content/cestionare/types.js").AfiseazaCimp | null} [filtru_afisare=null]
 * @property {() => ({ optiuni: string[]; eroare: string? })} [optiuni=() => ({ optiuni: ["da", "nu", "nu știu"], eroare: null })]
 */

/**
 * @param {string} nume
 * @param {string} titlu
 * @param {OptiuniDanu} [optiuni_obj={}]
 * @returns {import("@content/cestionare/types.js").Cimp}
 */
function danu(nume, titlu, optiuni_obj = {}) {
    const {
        desc = null,
        obligatoriu = true,
        filtru_afisare = null,
        optiuni = () => ({ optiuni: ["da", "nu", "nu știu"], eroare: null }),
    } = optiuni_obj;

    return {
        nume,
        titlu,
        desc,
        obligatoriu,
        filtru_afisare,
        tip: "selecție-radio",
        optiuni,
    };
}

/**@type{import("@content/cestionare/types.js").Cestionar}*/
export default {
    id: "atb-cdos-2026",
    titlu: "Sondaj CDOS 2026",
    validare_posta: (posta) =>
        (!posta.endsWith("@student.unitbv.ro"))
            ? "Folosește adresa instituțională de student `@student.unitbv.ro`"
            : null,
    descriere:
        "Sondaj pentru evaluarea respectării Codului de Drepturi și Obligații a Studenților din Universitatea Transilvania din Brașov.",
    pagini: [
        {
            titlu: "Date Academice",
            descriere: "",
            cimpuri: [
                {
                    tip: "selecție-cautare",
                    nume: "facultatea",
                    titlu: "Facultatea",
                    obligatoriu: true,
                    optiuni: () => ({
                        optiuni: lista.facultati.map((o) => o.fac).filter(uniq),
                        eroare: null,
                    }),
                },
                {
                    tip: "selecție-radio",
                    nume: "ciclu",
                    titlu: "Ciclu de Studii",
                    obligatoriu: true,
                    filtru_afisare: (rspi) =>
                        rspi["facultatea"] != null &&
                        rspi["facultatea"]?.trim() !== "",
                    optiuni: (rspi) => ({
                        optiuni: ["LICENȚĂ", "MASTER"],
                        eroare: null,
                    }),
                },
                {
                    tip: "selecție-radio",
                    nume: "forma",
                    titlu: "Forma de Învățămînt",
                    obligatoriu: true,
                    optiuni: (rspi) => {
                        const filtered = lista.facultati
                            .filter(
                                (o) =>
                                    o.fac === rspi["facultatea"] &&
                                    o.cic === rspi["ciclu"],
                            )
                            .map((o) => o.frm)
                            .filter(uniq);
                        const optiuni = lista.facultati
                            .map((o) => o.frm)
                            .filter(uniq)
                            .map((text) => ({
                                text,
                                exista: filtered.includes(text),
                            }));

                        return {
                            optiuni,
                            eroare: optiuni.length === 0
                                ? "Nu au fost găsite forme de învățămînt pentru selecția curentă."
                                : null,
                        };
                    },
                },
                {
                    tip: "selecție-radio",
                    nume: "programul",
                    titlu: "Programul de Învățămînt",
                    obligatoriu: true,
                    optiuni: (rspi) => {
                        if (!rspi["facultatea"]) {
                            return {
                                optiuni: [],
                                eroare: "Selectează mai întâi facultatea.",
                            };
                        }
                        if (!rspi["ciclu"]) {
                            return {
                                optiuni: [],
                                eroare:
                                    "Selectează mai întâi ciclul de studii.",
                            };
                        }
                        if (!rspi["forma"]) {
                            return {
                                optiuni: [],
                                eroare:
                                    "Selectează mai întâi forma de învățămînt.",
                            };
                        }
                        const optiuni = lista.facultati
                            .filter(
                                (o) =>
                                    o.fac === rspi["facultatea"] &&
                                    o.cic === rspi["ciclu"] &&
                                    o.frm === rspi["forma"],
                            )
                            .map((o) => o.prg)
                            .filter(uniq)
                            .map((text) => ({ text, exista: true }));
                        return {
                            optiuni,
                            eroare: optiuni.length === 0
                                ? "Nu au fost găsite programe pentru selecția curentă."
                                : null,
                        };
                    },
                },
        // Mai adăugăm următoarele întrebări:
        // "Te încadrezi în categoria studenților cu dizabilități?" (implicit nu)
        // "Ai desfășurat practica de specialitate?" (implicit da)
        // "Ai participat în cadrul taberelor studențești?" (implicit nu)
            ],
        },
        {
            titlu: "Reguli Generale și Drepturi Contractuale",
            descriere:
                "Această secțiune vizează respectarea principiilor de bază privind nediscriminarea, stabilitatea contractului de studii și gratuitatea serviciilor administrative oferite de Universitate.",
            cimpuri: [
                danu(
                    "gen_nediscrim_did",
                    "Ai simțit discriminare sau tratamente inechitabile din partea cadrelor didactice? [art. 1]",
                ),
                danu(
                    "gen_mod_contract_s",
                    "Contractele de studii au fost modificate în timpul anului? [art. 3 (3)] [LÎS 199/2023 art. 34 (1)]",
                    { desc: "Contractul de studii încheiat între Universitate și student nu poate fi modificat pe parcursul anului universitar. Un an universitar începe de pe 1 octombrie până pe 29 septembrie conform Legii Învățământului Superior. Contractul conține obiectul contractului, drepturile și obligațiile părților, cuantumul taxei de școlarizare și modalitatea de plata, după caz, răspunderea părților și termenul de valabilitate a contractului." },
                ),
                danu(
                    "gen_acces_org_std",
                    "Ți-a fost restricționat accesul la structuri sau organizații studențești? [art. 4 (1)]",
                ),
                danu(
                    "gen_gratuit_acte_s",
                    "Ai fost taxat pentru eliberarea actelor de studii? [art. 11 (2)]",
                    "Toate actele de studii eliberate de Unitbv, precum și cele care atestă statutul de student, precum adeverințele, carnetele sau legitimațiile, se eliberează în mod gratuit. În cazul eliberării duplicatelor actelor de studii se poate percepe o taxă.",
                ),
                danu(
                    "gen_transp_faci_st",
                    "Ți-au fost restricționate facilitățile de transport de care dispui conform prevederilor legale? [art. 11 (3)]",
                    "Studenții înmatriculați la forma de învățământ cu frecvență beneficiază de facilități de transport conform prevederilor legale.",
                ),
            ],
        },

        {
            titlu: "Calitatea Procesului Educațional",
            descriere:
                "Această secțiune analizează drepturile academice fundamentale",
            cimpuri: [
                danu(
                    "acad_info_fisa_dis",
                    "Ai primit în primele 2 săptămâni de semestru informații complete despre fiecare disciplină (conținut, evaluare, bibliografie, cerințe)? [art. 7 (1) g)]",
                    "Fișa disciplinei este un document care trebuie prezentată de profesor la începutul semestrului, și conține toate informațiile relevante despre desfășurarea cursului (date despre program, date despre disciplină, timp total estimat, competențe, evaluare, etc.)",
                ),
                danu(
                    "acad_suport_curs_g",
                    "Ai acces gratuit la suport de curs și materiale didactice pentru disciplinele tale? [art. 7 (1) e)]",
                    "Suportul de curs explică conținutul unui curs universitar. Conține teoria predată, exemple, uneori exerciții și bibliografie",
                ),
                danu(
                    "acad_mobil_erasmu_s",
                    "Ți s-au prezentat oportunitățile de mobilitate (Erasmus etc.) și ai avut acces la consiliere gratuită pentru acestea? [art. 7 (1) b)]",
                ),
                danu(
                    "acad_eval_prof_ano",
                    "Ai posibilitatea reală de a evalua anonim cadrele didactice și cursurile urmate? [art. 7 (1) j)]",
                ),
                danu(
                    "acad_feedback_prof",
                    "Ai primit mereu un feedback de la profesor, când l-ai cerut? [art. 7 (1) p)]",
                ),
                danu(
                    "acad_eval_obiectiv",
                    "Consideri că ai fost evaluat(ă) obiectiv? [art. 7 (1) q)]",
                    "O evaluare obiectivă presupune respectarea baremului de corectare anunțat la începutul semestrului în fișa disciplinei, lipsa subiectivismului și aplicarea acelorași criterii pentru toți studenții examinați."
                ),
                danu(
                    "acad_rezult_exam_t",
                    "Ți-au fost comunicate rezultatele examenelor în decurs de 2–3 zile? (mai mult de 24h) [art. 7 (1) q)]",
                ),
                danu(
                    "acad_acces_sit_sco",
                    "Ai acces la situația ta școlară și la documentele universitare relevante? [art. 7 (1) k)]",
                    "Deciziile luate în cadrul structurilor universitare, regulamente sau rapoarte ",
                ),
                danu(
                    "acad_consult_progr",
                    "Ai fost consultat(ă) în stabilirea datelor de examinare? [art. 7 (1) u)]",
                ),
                danu(
                    "acad_consiliere_gr",
                    "Beneficiezi de servicii gratuite de consiliere (academic, psihologic, profesional)? [art. 7 (1) m)]",
                ),
                danu(
                    "acad_limit_ore_zi_8",
                    "Programul tău zilnic de cursuri respectă limita de maximum 8 ore [art. 7 (4)]",
                ),
                danu(
                    "acad_modific_evalu",
                    "Modalitatea de evaluare a fost schimbată fără acordul tău? [art. 7 g)]",
                ),
                danu(
                    "acad_contesta_note",
                    "Ai avut posibilitatea să contești notele primite? [art. 7 r)]",
                ),
                danu(
                    "acad_ore_suprapuse",
                    "Ai avut ore suprapuse și ești nevoit să lipsești de la un un curs pentru a participa la altul?",
                ),
                danu(
                    "acad_tutore_indrum",
                    "Ai beneficiat de un tutore sau îndrumător de an? [art. 7 i)]",
                ),
            ],
        },
        {
            titlu: "Transparența Taxelor Universitare",
            descriere:
                "Evaluarea modului în care Universitatea comunică mecanismele de stabilire a taxelor, cuantumul acestora și termenele de plată, conform principiului transparenței financiare.",
            cimpuri: [
                danu(
                    "taxe_inform_stabi",
                    "Ai fost informat(ă) despre modul în care se stabilesc taxele universitare? [art. 8 (1)]",
                ),
                danu(
                    "taxe_detalii_clar",
                    "Ai primit informații clare despre toate tipurile de taxe (număr, cuantum, termene)? [art. 8 (2)]",
                ),
                danu(
                    "taxe_publ_termen_3",
                    "Au fost taxele publicate cu cel puțin 3 luni înainte de începerea anului universitar? [art. 8 (2)]",
                ),
                danu(
                    "taxe_suplim_nejust",
                    "Ți s-au perceput taxe suplimentare nejustificate (ex: pentru reclasificare între locuri cu taxă/buget)? [art.8]",
                ),
            ],
        },
        {
            titlu: "Reprezentarea Studenților",
            descriere:
                "Se urmărește evaluarea modului în care studenții sunt implicați în procesul decizional și eficiența canalelor de comunicare dintre reprezentanți și comunitatea academică.",
            cimpuri: [
                danu(
                    "repr_info_hotariri",
                    "Ești informat și consultat de către studenții reprezentanți în legătură cu hotărârile votate în structurile de conducere? [art. 10 (2) e)]",
                ),
                danu(
                    "repr_alegeri_liber",
                    "Consideri că procesul de alegere a studenților reprezentanți a fost direct, secret și universal, fără implicarea cadrelor didactice? [art. 10 (3), (6), (11)]",
                ),
                danu(
                    "repr_eval_anuala_s",
                    "Ai participat la evaluarea anuală anonimă a activității studenților reprezentanți?",
                ),
                danu(
                    "repr_disem_statis",
                    "Rezultatele statistice ale evaluării reprezentanților ți-au fost diseminate prin canalele oficiale?",
                ),
            ],
        },
        {
            titlu: "Drepturi Sociale și Mediul Universitar",
            descriere:
                "Evaluăm accesul la serviciile de asistență medicală, facilitățile sportive și respectarea termenelor administrative pentru asigurarea unui mediu sigur și sănătos.",
            cimpuri: [
                danu(
                    "soc_asist_med_psi",
                    "Ai avut acces gratuit la asistență medicală, stomatologică și psihologică în cabinetele universității? [art. 12 (1) a)]",
                ),
                danu(
                    "soc_acces_spatii_u",
                    "Ai avut acces gratuit în spațiile universitare pentru organizarea de proiecte studențești (în afara orarului)? [art. 12 (1) d)]",
                ),
                danu(
                    "soc_baze_sport_gr",
                    "Ai avut acces gratuit la bazele sportive ale universității în afara orarului didactic? [art. 12 (1) j)]",
                ),
                danu(
                    "soc_termen_concurs",
                    "S-a respectat termenul de cel puțin 5 zile lucrătoare pentru înscrierea la concursurile organizate? [art. 12 (1) g)]",
                ),
                danu(
                    "soc_raspuns_scris",
                    "Ai primit răspuns scris (fizic sau electronic) la cererile semnate și depuse către universitate? [art. 12 (1) f)]",
                ),
                danu(
                    "soc_gratuit_cazare",
                    "Ți s-a respectat dreptul la gratuitate la cazare în cămine (pentru categorii defavorizate)? [art. 12 (4)]*",
                ),
                danu(
                    "soc_mediu_sigur_st",
                    "Consideri că universitatea îți oferă un mediu de învățare sigur și sănătos? [art. 12 (1) i)]",
                ),
            ],
        },
        {
            // afișăm numai dacă studentul răspunde că a făcut practica de specialitate în prima secțiune
            titlu: "Practica de Specialitate",
            descriere:
                "Această secțiune analizează calitatea stagiilor de practică",
            cimpuri: [
                danu(
                    "prac_parteneri_li",
                    "Ti-a fost prezentată lista partenerilor de practică ai universității din domeniul tău de studiu pe parcursul anului universitar? [art. 9 (1) c)]",
                ),
                danu(
                    "prac_cost_deplas_s",
                    "În cazul practicii desfășurate în afara Brașovului, ți-au fost acoperite costurile de masă, cazare și transport? [art. 9 (1) b)]",
                    "dreptul de a beneficia de acoperirea costurilor necesare pentru efectuarea practicii comasate, pentru perioada prevăzută în planurile de învătământ, inclusiv cheltuieli de masă, cazare și transport, in situațiile in care practica se desfășoara in afara centrului universitar respectiv, conform prevederilor art. 128 alin. (25) din Legea nr. 199/2023, cu modificările și completarile ulterioare;"
                ),
                danu(
                    "prac_cazare_camin",
                    "Ai beneficiat de cazare în căminele universității pe perioada practicii obligatorii? [art. 9 (1) d)]",
                ),
                danu(
                    "prac_tutore_indru",
                    "Ai beneficiat de un tutore de practică care să îți îndrume activitatea? [art. 9 (1) e)]",
                ),
                danu(
                    "prac_eval_calitat",
                    "Ai avut posibilitatea de a evalua calitatea stagiului de practică și de a sesiza eventuale deficiențe? [art. 9 (1) f)]",
                ),
                danu(
                    "prac_recuno_indiv",
                    "Ti-a fost recunoscută practica efectuată individual după evaluarea îndeplinirii obiectivelor? [art. 9 (1) g)]",
                ),
            ],
        },
        {
            // afișăm numai în cazul dacă studentul a răspuns că a participat în cadrul taberelor studențești
            titlu: "Tabere Studențești",
            descriere:
                "Această secțiune evaluează accesul studenților la programele de tabere",
            cimpuri: [
                danu(
                    "tab_acces_restrict",
                    "Ți-a fost restricționat accesul la taberele studențești? [art. 14 (1)]",
                ),
                danu(
                    "tab_credite_sesiun",
                    "Ai putut beneficia de creditele oferite în cadrul sesiunilor de formare profesională organizate la tabere conforme cu carta? [art. 14 (2)]",
                ),
                danu(
                    "tab_formare_ec_ect",
                    "În urma participării la activități de formare profesională în cadrul taberelor tematice, ai putut primi credite de tip ECVET sau ECTS? [art. 14 (3)]",
                    "Creditele ECVET (Sistemul European de Credite pentru Învățare și Formare) și ECTS (sistemul european de transfer și acumulare a creditelor) sunt sisteme de calificare a volumului de învățare și a volumului de lucru asociat. ECTS se concentrează pe ciclurile academice (licență, master, doctorat), iar ECVET se aplică în contextul formării profesionale pe parcursul vieții.",
                ),
            ],
        },
        {
            // afișăm numai dacă studentul răspunde că se încadrează în categoria studențîlor cu dizabilități în prima secțiune
            titlu: "Studenți cu Dizabilități",
            descriere:
                "Urmărim evaluarea gradului de accesibilitate și a condițiilor specifice oferite studenților cu nevoi speciale pentru a asigura un proces educațional incluziv și echitabil.",
            cimpuri: [
                danu(
                    "dizab_conditii_ade",
                    "Consideri că ți s-au asigurat condiții adecvate pentru desfășurarea studiilor cu dizabilități? [art. 6 (1)]",
                    "Studenții cu dizabilități fizice au dreptul la acces adaptat în spațiile universitare, la asigurarea unui interpret mimico-gestual, precum și la condiții adecvate pentru desfășurarea a activităților academice, cum ar fi materiale educaționale și suport de curs personalizate în funcție de dizabilitate, adaptarea metodelor de evaluare în acord cu dizabilitatea, însoțitor în timpul susținerii examenului, etc.",
                ),
                danu(
                    "dizab_practic_spri",
                    "Ai putut beneficia de sprijin pentru identificare și derularea practicii de specialitate? [art. 6 (3) b)]",
                ),
                danu(
                    "dizab_info_comun_s",
                    "Ai beneficiat de servicii de informare și comunicații adecvate? [art. 6 (3) c)]",
                ),
                danu(
                    "dizab_tabere_acces",
                    "Ți-a fost restricționat dreptul de a participa la tabere studențești? [art. 6 (3) d)]",
                ),
            ],
        },
    ],
};
