/** @import { AscundeCimp, Cimp } from "@content/cestionare/types.js" */
import { uniq } from "$lib/ds_helpers.js";
import lista from "./lista_facultati_unitbv_2026.js";

/**
 * @typedef {object} OptiuniDanu
 * @property {string | null} [desc=null]
 * @property {boolean} [obligatoriu=true]
 * @property {AscundeCimp | null} [ascunde=null]
 * @property {() => ({ optiuni: string[]; eroare: string? })} [optiuni=() => ({ optiuni: ["da", "nu", "nu știu"], eroare: null })]
 */

 /** @typedef {(nume:string, titlu:string, optiuni_obj?: OptiuniDanu) => Cimp} RadioConstructor */

/**
 * Base function for creating radio selection fields.
 * @param {string} nume
 * @param {string} titlu
 * @param {string[]} valori_implicite
 * @param {OptiuniDanu} [optiuni_obj={}]
 * @returns {Cimp}
 */
function _radio(nume, titlu, valori_implicite, optiuni_obj = {}) {
    const {
        desc = null,
        obligatoriu = true,
        ascunde = null,
        optiuni = () => ({ optiuni: valori_implicite, eroare: null }),
    } = optiuni_obj;

    return {
        nume,
        titlu,
        desc,
        obligatoriu,
        ascunde,
        tip: "selecție-radio",
        optiuni,
    };
}

/** @type {RadioConstructor} */
function da_nu(nume, titlu, optiuni_obj = {}) {
    return _radio(nume, titlu, ["da", "nu"], optiuni_obj);
}

/** @type {RadioConstructor} */
function da_nustiu(nume, titlu, optiuni_obj = {}) {
    return _radio(nume, titlu, ["da", "nu", "nu știu"], optiuni_obj);
}

/** @type {RadioConstructor} */
function da_nu_caz(nume, titlu, optiuni_obj = {}) {
    return _radio(nume, titlu, ["da", "nu", "nu e cazul"], optiuni_obj);
}

/** @type {RadioConstructor} */
function grad(nume, titlu, optiuni_obj = {}) {
     const {
         desc = null,
         obligatoriu = true,
         ascunde = null,
         optiuni = () => ({ optiuni: ["da, în toate cazurile", "da, în majoritatea cazurilor","da, uneori","nu","nu știu"], eroare: null }),
     } = optiuni_obj;

     return {
         nume,
         titlu,
         desc,
         obligatoriu,
         ascunde,
         tip: "selecție-radio",
         optiuni,
     };
}

/** @type {RadioConstructor} */
function grad_p(nume, titlu, optiuni_obj = {}) {
    return _radio(nume, titlu, [
        "da, mereu",
        "da, des",
        "uneori",
        "nu",
    ], optiuni_obj);
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
                    optiuni: () => ({
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
                {
                    tip: "selecție-radio",
                    nume: "anul",
                    titlu: "Anul de studiu",
                    horizontal: true,
                    obligatoriu: true,
                    optiuni: (rspi) => {
                        const ani = lista.facultati
                            .filter(
                                (o) =>
                                    o.fac === rspi["facultatea"] &&
                                    o.cic === rspi["ciclu"] &&
                                    o.prg === rspi["programul"] &&
                                    o.frm === rspi["forma"],
                            )
                            .map((o) => o.ani);

                        let an = ani.at(0)
                        if (an == null) {
                            return {
                                optiuni: [],
                                eroare: "Eroare internă: nu au fost găsite ani de studiu pentru selecția curentă.",
                            };
                        }

                        const optiuni = Array.from({ length: an }, (_, i) => i + 1).map(String)

                        return {
                            optiuni,
                            eroare: null,
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
            titlu: "Cazuri speciale",
            descriere:
                "Această secțiune vizează respectarea principiilor de bază privind nediscriminarea, stabilitatea contractului de studii și gratuitatea serviciilor administrative oferite de Universitate.",
            cimpuri: [
                da_nustiu(
                    "participare-tabere",
                    "Ai participat în cadrul taberelor studențești?",
                    {
                        optiuni: () => {
                            return {
                                optiuni: ["da", "nu"],
                                eroare: null,
                            };
                        },
                    },
                ),
                da_nustiu(
                    "student-cu-dizabilități",
                    "Te încadrezi în categoria studenților cu dizabilități?",
                    {
                        optiuni: () => {
                            return {
                                optiuni: ["da", "nu"],
                                eroare: null,
                            };
                        },
                    },
                ),
                da_nustiu(
                    "practica-de-specialitate",
                    "Ai desfășurat practica de specialitate?",
                    {
                        optiuni: () => {
                            return {
                                optiuni: ["da", "nu"],
                                eroare: null,
                            };
                        },
                    },
                ),
            ]
        },
        {
            titlu: "Reguli Generale și Drepturi Contractuale",
            descriere:
                "Această secțiune vizează respectarea principiilor de bază privind nediscriminarea, stabilitatea contractului de studii și gratuitatea serviciilor administrative oferite de Universitate.",
            cimpuri: [
                da_nustiu(
                    "gen_nediscrim_did",
                    "Ai simțit discriminare sau tratamente inechitabile din partea cadrelor didactice? [art. 1]",
                    {
                        optiuni: () => {
                            return {
                                optiuni: ["da, deseori", "da, rareori", "nu"],
                                eroare: null,
                            };
                        },
                    },
                ),
                da_nustiu(
                    "gen_mod_contract_s",
                    "Contractele de studii au fost modificate în timpul anului? [art. 3 (3)] [LÎS 199/2023 art. 34 (1)]",
                    {
                        desc:
                            "Contractul de studii încheiat între Universitate și student nu poate fi modificat pe parcursul anului universitar. Un an universitar începe de pe 1 octombrie până pe 29 septembrie conform Legii Învățământului Superior. Contractul conține obiectul contractului, drepturile și obligațiile părților, cuantumul taxei de școlarizare și modalitatea de plata, după caz, răspunderea părților și termenul de valabilitate a contractului.",
                    },
                ),
                da_nu_caz(
                    "gen_acces_org_std",
                    "Ți-a fost restricționat accesul la structuri sau organizații studențești? [art. 4 (1)]",
                ),
                da_nu(
                    "gen_gratuit_acte_s",
                    "Ai fost taxat pentru eliberarea actelor de studii? [art. 11 (2)]",
                    {
                        desc:
                            "Toate actele de studii eliberate de Unitbv, precum și cele care atestă statutul de student, precum adeverințele, carnetele sau legitimațiile, se eliberează în mod gratuit. În cazul eliberării duplicatelor actelor de studii se poate percepe o taxă.",
                    },
                ),
                da_nu_caz(
                    "gen_transp_faci_st",
                    "Ți-au fost restricționate facilitățile de transport de care dispui conform prevederilor legale? [art. 11 (3)]",
                    {
                        desc:
                            "Studenții înmatriculați la forma de învățământ cu frecvență beneficiază de facilități de transport conform prevederilor legale.",
                    },
                ),
            ],
        },

        {
            titlu: "Calitatea Procesului Educațional",
            descriere:
                "Această secțiune analizează drepturile academice fundamentale",
            cimpuri: [
                grad(
                    "acad_info_fisa_dis",
                    "Ai primit în primele 2 săptămâni de semestru informații complete despre fiecare disciplină (conținut, evaluare, bibliografie, cerințe)? [art. 7 (1) g)]",
                    {
                        desc:
                            "Fișa disciplinei este un document care trebuie prezentată de profesor la începutul semestrului, și conține toate informațiile relevante despre desfășurarea cursului (date despre program, date despre disciplină, timp total estimat, competențe, evaluare, etc.)",
                    },
                ),
                grad(
                    "acad_suport_curs_g",
                    "Ai acces gratuit la suport de curs și materiale didactice pentru disciplinele tale? [art. 7 (1) e)]",
                    {
                        desc:
                            "Suportul de curs explică conținutul unui curs universitar. Conține teoria predată, exemple, uneori exerciții și bibliografie",
                    },
                ),
                da_nustiu(
                    "acad_mobil_erasmu_s",
                    "Ți s-au prezentat oportunitățile de mobilitate (Erasmus etc.) și ai avut acces la consiliere gratuită pentru acestea? [art. 7 (1) b)]",
                ),
                da_nustiu(
                    "acad_eval_prof_ano",
                    "Ai posibilitatea reală de a evalua anonim cadrele didactice și cursurile urmate? [art. 7 (1) j)]",
                ),
                grad_p(
                    "acad_feedback_prof",
                    "Ai primit mereu un feedback de la profesor, când l-ai cerut? [art. 7 (1) p)]",
                ),
                grad(
                    "acad_eval_obiectiv",
                    "Consideri că ai fost evaluat(ă) obiectiv? [art. 7 (1) q)]",
                    {
                        desc:
                            "O evaluare obiectivă presupune respectarea baremului de corectare anunțat la începutul semestrului în fișa disciplinei, lipsa subiectivismului și aplicarea acelorași criterii pentru toți studenții examinați.",
                    },
                ),
                grad(
                    "acad_rezult_exam_t",
                    "Ți-au fost comunicate rezultatele examenelor în decurs de 2–3 zile? (mai mult de 24h) [art. 7 (1) q)]",
                ),
                da_nustiu(
                    "acad_acces_sit_sco",
                    "Ai acces la situația ta școlară și la documentele universitare relevante? [art. 7 (1) k)]",
                    {
                        desc:
                            "Prin documente universitare relevante se înțelege: deciziile luate în cadrul structurilor universitare, regulamente sau rapoarte ",
                    },
                ),
                grad(
                    "acad_consult_progr",
                    "Ai fost consultat(ă) în stabilirea datelor de examinare? [art. 7 (1) u)]",
                ),
                da_nustiu(
                    "acad_consiliere_gr",
                    "Beneficiezi de servicii gratuite de consiliere (academic, psihologic, profesional)? [art. 7 (1) m)]",
                ),
                grad_p(
                    "acad_limit_ore_zi_8",
                    "Programul tău zilnic de cursuri respectă limita de maximum 8 ore [art. 7 (4)]",
                ),
                grad(
                    "acad_modific_evalu",
                    "Modalitatea de evaluare a fost schimbată fără acordul tău? [art. 7 g)]",
                ),
                da_nu_caz(
                    "acad_contesta_note",
                    "Ți s-a restricționat dreptul de a contesta notele primite? [art. 7 r)]",
                ),
                // danu(
                //     "acad_ore_suprapuse",
                //     "Ai avut ore suprapuse ca să fii nevoit să lipsești de la un un curs pentru a participa la altul? (care articol??)",
                // ),
                da_nustiu(
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
                da_nustiu(
                    "taxe_inform_stabi",
                    "Ai fost informat(ă) despre modul în care se stabilesc taxele universitare? [art. 8 (1)]",
                ),
                da_nustiu(
                    "taxe_detalii_clar",
                    "Ai primit informații clare despre toate tipurile de taxe (număr, cuantum, termene)? [art. 8 (2)]",
                ),
                da_nustiu(
                    "taxe_publ_termen_3",
                    "Au fost taxele publicate cu cel puțin 3 luni înainte de începerea anului universitar? [art. 8 (2)]",
                ),
                da_nustiu(
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
                da_nustiu(
                    "repr_info_hotariri",
                    "Ești informat și consultat de către studenții reprezentanți în legătură cu hotărârile votate în structurile de conducere? [art. 10 (2) e)]",
                ),
                da_nustiu(
                    "repr_alegeri_liber",
                    "Consideri că procesul de alegere a studenților reprezentanți a fost direct, secret și universal, fără implicarea cadrelor didactice? [art. 10 (3), (6), (11)]",
                ),
                da_nustiu(
                    "repr_eval_anuala_s",
                    "Ai participat la evaluarea anuală anonimă a activității studenților reprezentanți?",
                ),
                da_nustiu(
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
                da_nu_caz(
                    "soc_asist_med_psi",
                    "Ai avut acces gratuit la asistență medicală, stomatologică și psihologică în cabinetele universității? [art. 12 (1) a)]",
                ),
                da_nu_caz(
                    "soc_acces_spatii_u",
                    "Ai avut acces gratuit în spațiile universitare pentru organizarea de proiecte studențești (în afara orarului)? [art. 12 (1) d)]",
                ),
                da_nu_caz(
                    "soc_baze_sport_gr",
                    "Ai avut acces gratuit la bazele sportive ale universității în afara orarului didactic? [art. 12 (1) j)]",
                ),
                da_nustiu(
                    "soc_termen_concurs",
                    "S-a respectat termenul de cel puțin 5 zile lucrătoare pentru înscrierea la concursurile organizate? [art. 12 (1) g)]",
                    {
                        desc:
                            "Exemplu concurs: De făcut! Afco, Crosul Universitar...",
                    },
                ),
                da_nu_caz(
                    "soc_raspuns_scris",
                    "Ai primit răspuns scris (fizic sau electronic) la cererile semnate și depuse către universitate? [art. 12 (1) f)]",
                ),
                da_nu_caz(
                    "soc_gratuit_cazare",
                    "Ți s-a respectat dreptul la gratuitate la cazare în cămine (pentru categorii defavorizate)? [art. 12 (4)]*",
                ),
                grad_p(
                    "soc_mediu_sigur_st",
                    "Consideri că universitatea îți oferă un mediu de învățare sigur și sănătos? [art. 12 (1) i)]",
                    {
                        optiuni: () => {
                            return {
                                optiuni: [
                                    "da",
                                    "în marea parte",
                                    "mai puțin",
                                    "nu",
                                ],
                                eroare: null,
                            };
                        },
                    },
                ),
            ],
        },
        {
            // afișăm numai dacă studentul răspunde că a făcut practica de specialitate în prima secțiune
            titlu: "Practica de Specialitate",
            ascunde: (rspi) => rspi["practica-de-specialitate"] !== "da",
            descriere:
                "Această secțiune analizează calitatea stagiilor de practică",
            cimpuri: [
                da_nustiu(
                    "prac_parteneri_li",
                    "Ți-a fost prezentată lista partenerilor de practică ai universității din domeniul tău de studiu pe parcursul anului universitar? [art. 9 (1) c)]",
                ),
                da_nu_caz(
                    "prac_cost_deplas_s",
                    "În cazul practicii desfășurate în afara Brașovului, ți-au fost acoperite costurile de masă, cazare și transport? [art. 9 (1) b)]",
                    {
                        desc:
                            "Studenții au dreptul de a beneficia de acoperirea costurilor necesare pentru efectuarea practicii comasate, pentru perioada prevăzută în planurile de învătământ, inclusiv cheltuieli de masă, cazare și transport, in situațiile in care practica se desfășoara in afara centrului universitar respectiv (institutului), conform prevederilor art. 128 alin. (25) din Legea nr. 199/2023, cu modificările și completarile ulterioare;",
                    },
                ),
                da_nu_caz(
                    "prac_cazare_camin",
                    "Ai beneficiat de cazare în căminele universității pe perioada practicii obligatorii? [art. 9 (1) d)]",
                ),
                da_nustiu(
                    "prac_tutore_indru",
                    "Ai beneficiat de un tutore de practică care să îți îndrume activitatea? [art. 9 (1) e)]",
                ),
                da_nustiu(
                    "prac_eval_calitat",
                    "Ai avut posibilitatea de a evalua calitatea stagiului de practică și de a sesiza eventuale deficiențe? [art. 9 (1) f)]",
                ),
                da_nu_caz(
                    "prac_recuno_indiv",
                    "Ti-a fost recunoscută practica efectuată individual după evaluarea îndeplinirii obiectivelor? [art. 9 (1) g)]",
                ),
            ],
        },
        {
            // afișăm numai în cazul dacă studentul a răspuns că a participat în cadrul taberelor studențești
            titlu: "Tabere Studențești",
            ascunde: (rspi) => rspi["participare-tabere"] !== "da",
            descriere:
                "Această secțiune evaluează accesul studenților la programele de tabere",
            cimpuri: [
                da_nu(
                    "tab_acces_restrict",
                    "Ți-a fost restricționat accesul la taberele studențești? [art. 14 (1)]",
                ),
                da_nustiu(
                    "tab_credite_sesiun",
                    "Ai putut beneficia de creditele oferite în cadrul sesiunilor de formare profesională organizate la tabere conforme cu Carta Universității? [art. 14 (2)]",
                    {
                        optiuni: () => {
                            return {
                                optiuni: ["da", "nu", "nu e cazul", "nu știu"],
                                eroare: null,
                            };
                        },
                    },
                ),
                da_nu_caz(
                    "tab_formare_ec_ect",
                    "În urma participării la activități de formare profesională în cadrul taberelor tematice, ai putut primi credite de tip ECVET sau ECTS? [art. 14 (3)]",
                    {
                        desc:
                            "Creditele ECVET (Sistemul European de Credite pentru Învățare și Formare) și ECTS (sistemul european de transfer și acumulare a creditelor) sunt sisteme de calificare a volumului de învățare și a volumului de lucru asociat. ECTS se concentrează pe ciclurile academice (licență, master, doctorat), iar ECVET se aplică în contextul formării profesionale pe parcursul vieții.",
                    },
                ),
            ],
        },
        {
            // afișăm numai dacă studentul răspunde că se încadrează în categoria studențîlor cu dizabilități în prima secțiune
            titlu: "Studenți cu Dizabilități",
            ascunde: (rspi) => rspi["student-cu-dizabilități"] !== "da",
            descriere:
                "Urmărim evaluarea gradului de accesibilitate și a condițiilor specifice oferite studenților cu nevoi speciale pentru a asigura un proces educațional incluziv și echitabil.",
            cimpuri: [
                da_nu(
                    "dizab_info_comun_s",
                    "Ai beneficiat de servicii de informare și comunicații adecvate? [art. 6 (3) c)]",
                ),
                grad_p(
                    "dizab_conditii_ade",
                    "Consideri că ți s-au asigurat condiții adecvate pentru desfășurarea studiilor cu dizabilități? [art. 6 (1)]",
                    {
                        desc:
                            "Studenții cu dizabilități fizice au dreptul la acces adaptat în spațiile universitare, la asigurarea unui interpret mimico-gestual, precum și la condiții adecvate pentru desfășurarea a activităților academice, cum ar fi materiale educaționale și suport de curs personalizate în funcție de dizabilitate, adaptarea metodelor de evaluare în acord cu dizabilitatea, însoțitor în timpul susținerii examenului, etc.",
                    },
                ),
                da_nu(
                    "dizab_practic_spri",
                    "Ai putut beneficia de sprijin pentru identificare și derularea practicii de specialitate? [art. 6 (3) b)]",
                    {
                        ascunde: (rspi) =>
                            rspi["practica-de-specialitate"] === "da",
                    },
                ),
            ],
        },
    ],
};
