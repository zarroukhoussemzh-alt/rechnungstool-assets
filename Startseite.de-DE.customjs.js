// ==========================================
// DRK Form Application - Complete JavaScript
// ==========================================

// ==========================================
// API Configuration
// ==========================================

const API_BASE = 'https://digi-funktion-gbc9edbce9exfxej.westeurope-01.azurewebsites.net/api';

// Warm-up API
(function warmUp() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    fetch(`${API_BASE}/health?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        keepalive: true
    })
        .catch(() => {})
        .finally(() => clearTimeout(timer));
})();

// ==========================================
// Session State
// ==========================================

const session = {
    email: '',
    token: ''
};

let pendingRegistration = null;

// ==========================================
// File Storage
// ==========================================

const uploadedFiles = [];

// ==========================================
// Utility Functions
// ==========================================
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));


// ==========================================
// API Helper Functions
// ==========================================

async function apiPost(action, body, timeoutMs = 15000) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
        const res = await fetch(`${API_BASE}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body || {}),
            signal: ac.signal
        });
        const json = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data: json };
    } finally {
        clearTimeout(t);
    }
}

async function apiPostAuth(action, body, timeoutMs = 15000) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
        const res = await fetch(`${API_BASE}/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`
            },
            body: JSON.stringify(body || {}),
            signal: ac.signal
        });
        const json = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data: json };
    } finally {
        clearTimeout(t);
    }
}

// ==========================================
// File Helper Functions
// ==========================================

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
            const base64 = String(r.result).split(',')[1] || '';
            resolve({
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size || 0,
                dataBase64: base64
            });
        };
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}

async function filesToBase64List(files) {
    if (!files || !files.length) return [];
    return Promise.all(Array.from(files).map(fileToBase64));
}

// ==========================================
// Modal Functions
// ==========================================

function showModal(id) {
    const modal = qs(id);
    if (!modal) return;

    modal.style.display = 'flex';
    modal.classList.add('active');
    setTimeout(() => modal.style.opacity = '1', 10);
    document.body.classList.add('modal-open');
}

function hideModal(id) {
    const modal = qs(id);
    if (!modal) return;

    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }, 250);
}

function showWaiting(on = true) {
    if (on) {
        showModal('#waiting-overlay');
    } else {
        hideModal('#waiting-overlay');
    }
}

function showError(message) {
    const errorMessage = qs('#error-modal-message');
    if (errorMessage) errorMessage.textContent = message;
    showModal('#error-overlay');
}

function showSuccess(message) {
    const successCode = qs('#success-code');
    if (successCode) successCode.textContent = message;
    showModal('#success-overlay');
}

// ==========================================
// Disable Button Helper
// ==========================================

function disableBtn(btn, on = true) {
    if (!btn) return;
    btn.disabled = !!on;
    btn.style.opacity = on ? '0.6' : '1';
    btn.style.pointerEvents = on ? 'none' : '';
}

async function withDisabled(btn, fn) {
    disableBtn(btn, true);
    try {
        return await fn();
    } finally {
        disableBtn(btn, false);
    }
}

// ==========================================
// Set Current Date
// ==========================================

function setCurrentDate() {
    const today = new Date();
    const datumInput = qs('#Datum');
    if (datumInput) {
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        datumInput.value = `${day}.${month}.${year}`;
    }
}

// ==========================================
// IBAN Bank Database
// ==========================================

const ibanBankDatabase = {
    '10000000': 'Bundesbank',
    '10010010': 'Postbank',
    '10010111': 'SEB',
    '10010424': 'Aareal Bank',
    '10020890': 'UniCredit Bank - HypoVereinsbank',
    '10030000': 'Bankhaus Hallbaum',
    '10033300': 'Santander Consumer Bank',
    '10040000': 'Commerzbank',
    '10050000': 'Berliner Sparkasse',
    '10060237': 'Isbank',
    '10070000': 'Deutsche Bank',
    '10070024': 'Deutsche Bank Privat und Geschäftskunden',
    '10080000': 'Commerzbank vormals Dresdner Bank',
    '10090000': 'Berliner Volksbank',
    '10120760': 'Mizuho Bank',

    // Hamburg
    '20000000': 'Bundesbank',
    '20010020': 'Postbank',
    '20030000': 'Bankhaus Wölbern & Co',
    '20040000': 'Commerzbank',
    '20050000': 'Hamburger Sparkasse',
    '20050550': 'Hamburger Sparkasse',
    '20060000': 'DZ HYP',
    '20070000': 'Deutsche Bank',
    '20070024': 'Deutsche Bank Privat und Geschäftskunden',
    '20080000': 'Commerzbank vormals Dresdner Bank',
    '20090500': 'Sparda-Bank Hamburg',
    '20090900': 'PSD Bank Nord',
    '21000000': 'Bundesbank',
    '21010111': 'SEB',
    '21020086': 'UniCredit Bank - HypoVereinsbank',
    '21040080': 'Commerzbank',
    '21050000': 'Sparkasse Harburg-Buxtehude',
    '21060237': 'Isbank',
    '21070020': 'Deutsche Bank',
    '21070024': 'Deutsche Bank Privat und Geschäftskunden',
    '21080050': 'Commerzbank vormals Dresdner Bank',

    // Munich
    '70000000': 'Bundesbank',
    '70010080': 'Postbank',
    '70010111': 'SEB',
    '70020001': 'BHF-BANK',
    '70020270': 'UniCredit Bank - HypoVereinsbank',
    '70020500': 'Bank für Sozialwirtschaft',
    '70030400': 'LfA Förderbank Bayern',
    '70033100': 'Santander Consumer Bank',
    '70040041': 'Commerzbank',
    '70050000': 'Bayerische Landesbank',
    '70060000': 'DZ HYP',
    '70070010': 'Deutsche Bank',
    '70070024': 'Deutsche Bank Privat und Geschäftskunden',
    '70080000': 'Commerzbank vormals Dresdner Bank',
    '70090100': 'Volksbank Raiffeisenbank Bayern Mitte',
    '70090500': 'Sparda-Bank München',
    '70090900': 'PSD Bank München',
    '70120700': 'LBBW Landesbank Baden-Württemberg',
    '70130100': 'Bayerische Landesbank',
    '70140041': 'Commerzbank Gf-W10',
    '70150000': 'Stadtsparkasse München',
    '70220300': 'UniCredit Bank - HypoVereinsbank',
    '70230500': 'Merkur Bank',

    // Cologne/Bonn
    '37000000': 'Bundesbank',
    '37010050': 'Postbank',
    '37010111': 'SEB',
    '37010600': 'Postbank',
    '37010800': 'Postbank',
    '37010900': 'Postbank',
    '37020090': 'UniCredit Bank - HypoVereinsbank',
    '37020500': 'Bank für Sozialwirtschaft',
    '37030300': 'PSD Bank Köln',
    '37040044': 'Commerzbank',
    '37050198': 'Sparkasse KölnBonn',
    '37050299': 'Kreissparkasse Köln',
    '37060120': 'DZ HYP',
    '37060193': 'Volksbank Köln Bonn',
    '37060590': 'Raiffeisenbank Frechen-Hürth',
    '37060692': 'Volksbank Rhein-Erft-Köln',
    '37070024': 'Deutsche Bank',
    '37080040': 'Commerzbank vormals Dresdner Bank',
    '37090900': 'PSD Bank Köln',
    '38000000': 'Bundesbank',
    '38010111': 'SEB',
    '38020090': 'UniCredit Bank - HypoVereinsbank',
    '38040007': 'Commerzbank',
    '38050000': 'Sparkasse Aachen',
    '38060186': 'Volksbank Aachen',
    '38070024': 'Deutsche Bank',
    '38080040': 'Commerzbank vormals Dresdner Bank',
    '39000000': 'Bundesbank',
    '39010111': 'SEB',
    '39020000': 'UniCredit Bank - HypoVereinsbank',
    '39040013': 'Commerzbank',
    '39050000': 'Sparkasse Neuss',
    '39060180': 'Volksbank Mönchengladbach',
    '39070020': 'Deutsche Bank',
    '39080005': 'Commerzbank vormals Dresdner Bank',
    '39090000': 'PSD Bank Köln',

    // Frankfurt
    '50000000': 'Bundesbank',
    '50010060': 'Postbank',
    '50010111': 'SEB',
    '50010400': 'Aareal Bank',
    '50010424': 'Aareal Bank',
    '50010517': 'Postbank',
    '50010900': 'Postbank',
    '50020000': 'BHF-BANK',
    '50020200': 'UniCredit Bank - HypoVereinsbank',
    '50020500': 'Bank für Sozialwirtschaft',
    '50030000': 'Baader Bank',
    '50030600': 'KfW',
    '50033300': 'Santander Consumer Bank',
    '50040000': 'Commerzbank',
    '50040050': 'Commerzbank Gf PCC DCC-ITGK 2',
    '50050000': 'Landesbank Hessen-Thüringen Girozentrale (Helaba)',
    '50050201': 'Frankfurter Sparkasse',
    '50060000': 'DZ BANK',
    '50070010': 'Deutsche Bank Frankfurt/Main',
    '50070024': 'Deutsche Bank Privat und Geschäftskunden Frankfurt',
    '50080000': 'Commerzbank vormals Dresdner Bank',
    '50089400': 'Commerzbank, Gf Web-K',
    '50090500': 'Sparda-Bank Hessen (Frankfurt region)',
    '50092100': 'Volksbank Frankfurt Rhein/Main',
    '50110200': 'SEB',
    '50120383': 'BW-Bank',
    '50130100': 'Landesbank Hessen-Thüringen Girozentrale (Helaba office)',
    '50210900': 'Postbank',
    '50220200': 'UniCredit Bank - HypoVereinsbank (Frankfurt)',

    // Darmstadt
    '50850049': 'Sparkasse Darmstadt',
    '50851952': 'Kreissparkasse Groß-Gerau',
    '50852553': 'Sparkasse Odenwaldkreis',
    '50890000': 'Volksbank Darmstadt-Südhessen',
    '50891200': 'VR Bank Darmstadt-Südhessen',

    // Stuttgart
    '60000000': 'Bundesbank',
    '60010070': 'Postbank',
    '60010111': 'SEB',
    '60010424': 'Aareal Bank',
    '60020290': 'UniCredit Bank - HypoVereinsbank',
    '60040071': 'Commerzbank',
    '60050000': 'Landesbank Baden-Württemberg',
    '60050101': 'Landesbank Baden-Württemberg',
    '60060000': 'DZ BANK',
    '60060396': 'VR Bank Neckar-Enz',
    '60070070': 'Deutsche Bank',
    '60070024': 'Deutsche Bank Privat und Geschäftskunden',
    '60080000': 'Commerzbank vormals Dresdner Bank',
    '60089450': 'Commerzbank, Gf Web-K',
    '60090100': 'Volksbank Stuttgart',
    '60090500': 'Sparda-Bank Baden-Württemberg',
    '60090900': 'PSD Bank Karlsruhe-Neustadt',
    '60120200': 'BW-Bank',
    '60120500': 'BW-Bank',
    '60130100': 'Landesbank Baden-Württemberg',
    '60150020': 'Kreissparkasse Esslingen-Nürtingen',
    '60220200': 'UniCredit Bank - HypoVereinsbank',

    // Karlsruhe
    '66000000': 'Bundesbank',
    '66010075': 'Postbank',
    '66010111': 'SEB',
    '66020020': 'UniCredit Bank - HypoVereinsbank',
    '66020286': 'Baden-Württembergische Bank',
    '66040018': 'Commerzbank',
    '66050000': 'Landesbank Baden-Württemberg',
    '66050101': 'Sparkasse Karlsruhe',
    '66060000': 'DZ BANK',
    '66069103': 'Volksbank Karlsruhe',
    '66070024': 'Deutsche Bank',
    '66080052': 'Commerzbank vormals Dresdner Bank',
    '66090800': 'Volksbank Karlsruhe',
    '66090900': 'PSD Bank Karlsruhe-Neustadt',
    '66120200': 'BW-Bank',

    // Nuremberg
    '76000000': 'Bundesbank',
    '76010085': 'Postbank',
    '76010111': 'SEB',
    '76020070': 'UniCredit Bank - HypoVereinsbank',
    '76030080': 'Raiffeisenbank',
    '76040061': 'Commerzbank',
    '76050000': 'Sparkasse Nürnberg',
    '76050101': 'Sparkasse Nürnberg',
    '76060000': 'DZ BANK',
    '76060618': 'Raiffeisenbank Heroldsberg',
    '76070012': 'Deutsche Bank',
    '76070024': 'Deutsche Bank Privat und Geschäftskunden',
    '76080040': 'Commerzbank vormals Dresdner Bank',
    '76090500': 'Sparda-Bank Nürnberg',
    '76090900': 'VR Bank Nürnberg',
    '77000000': 'Bundesbank',
    '77010111': 'SEB',
    '77020070': 'UniCredit Bank - HypoVereinsbank',
    '77040047': 'Commerzbank',
    '77050000': 'Sparkasse Mittelfranken-Süd',
    '77060000': 'DZ BANK',
    '77070024': 'Deutsche Bank',
    '77080040': 'Commerzbank vormals Dresdner Bank',
    '77090000': 'VR Bank Mittelfranken',

    // Leipzig
    '86000000': 'Bundesbank',
    '86010090': 'Postbank',
    '86010111': 'SEB',
    '86020086': 'UniCredit Bank - HypoVereinsbank',
    '86030600': 'Raiffeisenbank',
    '86040000': 'Commerzbank',
    '86050000': 'Landesbank Hessen-Thüringen Girozentrale',
    '86055592': 'Sparkasse Leipzig',
    '86060000': 'DZ BANK',
    '86069050': 'Leipziger Volksbank',
    '86070024': 'Deutsche Bank',
    '86080000': 'Commerzbank vormals Dresdner Bank',
    '86095554': 'Volksbank Leipzig',

    // Dresden
    '85000000': 'Bundesbank',
    '85010111': 'SEB',
    '85020086': 'UniCredit Bank - HypoVereinsbank',
    '85030300': 'Raiffeisenbank',
    '85040000': 'Commerzbank',
    '85050000': 'Landesbank Hessen-Thüringen Girozentrale',
    '85050300': 'Ostsächsische Sparkasse Dresden',
    '85055000': 'Sparkasse Meißen',
    '85060000': 'DZ BANK',
    '85065011': 'Volksbank Dresden-Bautzen',
    '85070024': 'Deutsche Bank',
    '85080000': 'Commerzbank vormals Dresdner Bank',
    '85090000': 'Volksbank Dresden-Bautzen',

    // Additional Sparkassen
    '10050500': 'Mittelbrandenburgische Sparkasse in Potsdam',
    '10060000': 'DZ BANK',
    '12050000': 'Sparkasse Barnim',
    '12053000': 'Sparkasse Elbe-Elster',
    '12054000': 'Sparkasse Havelland',
    '12055000': 'Sparkasse Märkisch-Oderland',
    '13050000': 'Sparkasse Uckermark',
    '14050000': 'Sparkasse Vorpommern',
    '15050000': 'Sparkasse Mecklenburg-Schwerin',
    '16050000': 'Sparkasse Mecklenburg-Nordwest',
    '17050000': 'Hansestadt Rostock',
    '20050555': 'Haspa Finanzholding',

    // Volksbanken
    '30060010': 'Volksbank',
    '30060601': 'Volksbank Raiffeisenbank',
    '31060181': 'Volksbank',
    '32060362': 'Volksbank',
    '33060098': 'Volksbank',
    '34060094': 'Volksbank',
    '35060386': 'Volksbank',
    '40060000': 'DZ BANK',
    '41060000': 'DZ BANK',
    '42060000': 'DZ BANK',
    '43060000': 'DZ BANK',
    '44060000': 'DZ BANK',
    '45060000': 'DZ BANK',
    '46060000': 'DZ BANK',
    '47060000': 'DZ BANK',
    '48060000': 'DZ BANK',
    '49060000': 'DZ BANK',

    // More regional banks
    '25050000': 'Bremer Landesbank',
    '25050180': 'Sparkasse Bremen',
    '26050000': 'Landessparkasse zu Oldenburg',
    '27050000': 'Sparkasse Osnabrück',
    '28050000': 'Nord/LB Norddeutsche Landesbank Girozentrale',
    '28250110': 'Sparkasse Hannover',
    '29050000': 'Sparkasse Hildesheim Goslar Peine',
    '31050000': 'Sparkasse Göttingen',
    '32050000': 'Norddeutsche Landesbank Girozentrale',
    '33050000': 'Sparkasse Paderborn-Detmold',
    '34050000': 'Stadtsparkasse Düsseldorf',
    '35050000': 'Nassauische Sparkasse',
    '36050000': 'Kreissparkasse Köln',
    '41050000': 'Sparkasse Mainfranken Würzburg',
    '42050000': 'Sparkasse Schweinfurt',
    '43050000': 'Sparkasse Ansbach',
    '44050000': 'Sparkasse Fürth',
    '45050000': 'Stadtsparkasse Augsburg',
    '46050000': 'Sparkasse Ingolstadt Eichstätt',
    '47050000': 'Sparkasse Regensburg',
    '48050000': 'Sparkasse Passau',
    '51050015': 'Taunus Sparkasse',
    '52050000': 'Kreissparkasse Weilburg (region)',
    '52050353': 'Sparkasse Wetzlar',
    '52250030': 'Sparkasse Langen-Seligenstadt',
    '53050000': 'Sparkasse Marburg-Biedenkopf',
    '53250030': 'Kreis- und Stadtsparkasse Erding-Dorfen (note: verify regionally if needed)',
    '54050220': 'Kreissparkasse Schlüchtern',
    '54250094': 'Stadtsparkasse Bad Vilbel',
    '54350010': 'Sparkasse Hanau',
    '54450094': 'Kreissparkasse Gelnhausen',
    '54550020': 'Sparkasse Oberhessen',
    '54650023': 'Sparkasse Grünberg',
    '54750094': 'Sparkasse Laubach-Hungen',

    // Savings banks continuation
    '55000000': 'Bundesbank eh Kassel',
    '55050000': 'Kasseler Sparkasse',
    '56050000': 'Sparkasse Waldeck-Frankenberg',
    '57050000': 'Sparkasse Fulda',
    '58050000': 'Sparkasse Hersfeld-Rotenburg',
    '61050000': 'Kreissparkasse Böblingen',
    '61150020': 'Kreissparkasse Ludwigsburg',
    '61250010': 'Kreissparkasse Waiblingen',
    '61350010': 'Kreissparkasse Reutlingen',
    '61450050': 'Kreissparkasse Tübingen',
    '61650010': 'Kreissparkasse Göppingen',
    '61850050': 'Stadtsparkasse Schwäbisch Gmünd - Heubach',
    '64050000': 'Sparkasse Zollernalb',
    '64150020': 'Kreissparkasse Rottweil',
    '64250040': 'Sparkasse Schwarzwald-Baar',
    '64350070': 'Sparkasse Hochrhein',
    '64450070': 'Sparkasse Markgräflerland',
    '64650050': 'Sparkasse Lörrach-Rheinfelden',
    '65050000': 'Sparkasse Pforzheim Calw',
    '65250030': 'Sparkasse Baden-Baden Gaggenau',
    '66250030': 'Sparkasse Ettlingen',
    '66650085': 'Sparkasse Rastatt-Gernsbach',
    '67000000': 'Bundesbank',
    // More Postbank branches
    '10010010': 'Postbank',
    '44010046': 'Postbank',
    '66010075': 'Postbank',
    '79010050': 'Postbank',

    // ING-DiBa
    '50010517': 'ING-DiBa',

    // N26
    '10011001': 'N26 Bank',

    // Revolut
    '12345000': 'Revolut Ltd',

    // Wise (TransferWise)
    '83062563': 'Wise',
// Hessen
    '50000000': 'Bundesbank',
    '50010060': 'Postbank',
    '50010111': 'SEB',
    '50010400': 'Aareal Bank',
    '50010424': 'Aareal Bank',
    '50010517': 'Postbank',
    '50010900': 'Postbank',
    '50020000': 'BHF-BANK',
    '50020200': 'UniCredit Bank - HypoVereinsbank',
    '50020500': 'Bank für Sozialwirtschaft',
    '50030000': 'Baader Bank',
    '50030600': 'KfW',
    '50033300': 'Santander Consumer Bank',
    '50040000': 'Commerzbank',
    '50040050': 'Commerzbank Gf PCC DCC-ITGK 2',
    '50050000': 'Landesbank Hessen-Thüringen Girozentrale (Helaba)',
    '50050201': 'Frankfurter Sparkasse',
    '50060000': 'DZ BANK',
    '50070010': 'Deutsche Bank Frankfurt/Main',
    '50070024': 'Deutsche Bank Privat und Geschäftskunden Frankfurt',
    '50080000': 'Commerzbank vormals Dresdner Bank',
    '50089400': 'Commerzbank, Gf Web-K',
    '50090500': 'Sparda-Bank Hessen (Frankfurt region)',
    '50092100': 'Volksbank Frankfurt Rhein/Main',
    '50110200': 'SEB',
    '50120383': 'BW-Bank',
    '50130100': 'Landesbank Hessen-Thüringen Girozentrale (Helaba office)',
    '50210900': 'Postbank',
    '50220200': 'UniCredit Bank - HypoVereinsbank (Frankfurt)',

// Darmstadt & Südhessen
    '50850049': 'Sparkasse Darmstadt',
    '50851952': 'Kreissparkasse Groß-Gerau',
    '50852553': 'Sparkasse Odenwaldkreis',
    '50890000': 'Volksbank Darmstadt-Südhessen',
    '50891200': 'VR Bank Darmstadt-Südhessen',

// Weitere hessische Sparkassen & Banken
    '51050015': 'Taunus Sparkasse',
    '52050000': 'Kreissparkasse Weilburg (region)',
    '52050353': 'Sparkasse Wetzlar',
    '52250030': 'Sparkasse Langen-Seligenstadt',
    '53050000': 'Sparkasse Marburg-Biedenkopf',
    '54050220': 'Kreissparkasse Schlüchtern',
    '54250094': 'Stadtsparkasse Bad Vilbel',
    '54350010': 'Sparkasse Hanau',
    '54450094': 'Kreissparkasse Gelnhausen',
    '54550020': 'Sparkasse Oberhessen',
    '54650023': 'Sparkasse Grünberg',
    '54750094': 'Sparkasse Laubach-Hungen',

// Nordhessen
    '55000000': 'Bundesbank eh Kassel',
    '55050000': 'Kasseler Sparkasse',
    '56050000': 'Sparkasse Waldeck-Frankenberg',
    '57050000': 'Sparkasse Fulda',
    '58050000': 'Sparkasse Hersfeld-Rotenburg',

};

function formatIBAN(iban) {
    iban = iban.replace(/\s/g, '').toUpperCase();
    return iban.match(/.{1,4}/g)?.join(' ') || iban;
}

function getBankFromIBAN(iban) {
    iban = iban.replace(/\s/g, '').toUpperCase();
    if (!iban.startsWith('DE') || iban.length < 12) return '';
    const blz = iban.substring(4, 12);
    return ibanBankDatabase[blz] || '';
}

function setupIBANLookup(ibanInputId, bankInputId) {
    const ibanInput = qs(ibanInputId);
    const bankInput = qs(bankInputId);

    if (!ibanInput || !bankInput) return;

    ibanInput.addEventListener('input', function() {
        this.value = formatIBAN(this.value);

        const bank = getBankFromIBAN(this.value);
        if (bank) {
            bankInput.value = bank;
            bankInput.style.background = '#4CAF50';
            bankInput.style.color = 'white';
            bankInput.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                bankInput.style.background = '';
                bankInput.style.color = '';
            }, 2000);
        } else if (this.value.replace(/\s/g, '').length >= 12) {
            bankInput.placeholder = 'Bank nicht gefunden - bitte manuell eingeben';
        }
    });
}

// ==========================================
// Address Autocomplete
// ==========================================

let addressTimeout;

async function searchAddress(query) {
    if (query.length < 3) return [];

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
                q: query + ', Deutschland',
                format: 'json',
                addressdetails: 1,
                limit: 5,
                countrycodes: 'de'
            }),
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'DRK-Form-Application'
                }
            }
        );

        return await response.json();
    } catch (error) {
        console.error('Address search error:', error);
        return [];
    }
}

function setupAddressAutocomplete(inputId, dropdownId, plzInputId, ortInputId) {
    const input = qs(inputId);
    const dropdown = qs(dropdownId);
    const plzInput = qs(plzInputId);
    const ortInput = qs(ortInputId);

    if (!input || !dropdown) return;

    input.addEventListener('input', function() {
        clearTimeout(addressTimeout);
        const query = this.value.trim();

        if (query.length < 3) {
            dropdown.classList.remove('active');
            dropdown.innerHTML = '';
            return;
        }

        addressTimeout = setTimeout(async () => {
            const results = await searchAddress(query);
            displayAddressSuggestions(results, dropdown, input, plzInput, ortInput);
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (!dropdown.matches(':hover')) {
                dropdown.classList.remove('active');
            }
        }, 200);
    });
}

function displayAddressSuggestions(results, dropdown, input, plzInput, ortInput) {
    if (!results || results.length === 0) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
    }

    dropdown.innerHTML = results.map(result => {
        const address = result.address || {};
        const road = address.road || '';
        const houseNumber = address.house_number || '';
        const postcode = address.postcode || '';
        const city = address.city || address.town || address.village || '';

        return `
            <div class="autocomplete-item" data-result='${JSON.stringify(result)}'>
                <div class="autocomplete-item-main">${road} ${houseNumber}</div>
                <div class="autocomplete-item-sub">${postcode} ${city}</div>
            </div>
        `;
    }).join('');

    dropdown.classList.add('active');

    qsa('.autocomplete-item', dropdown).forEach(item => {
        item.addEventListener('click', function() {
            const result = JSON.parse(this.getAttribute('data-result'));
            selectAddress(result, input, plzInput, ortInput, dropdown);
        });
    });
}

function selectAddress(result, input, plzInput, ortInput, dropdown) {
    const address = result.address || {};
    const road = address.road || '';
    const houseNumber = address.house_number || '';
    const postcode = address.postcode || '';
    const city = address.city || address.town || address.village || '';

    if (input) {
        input.value = `${road}${houseNumber ? ' ' + houseNumber : ''}`;
    }

    if (plzInput) {
        if (plzInput.id === 'PLZ') {
            plzInput.value = `${postcode} ${city}`;
        } else {
            plzInput.value = postcode;
        }

        plzInput.style.background = '#4CAF50';
        plzInput.style.color = 'white';
        plzInput.style.transition = 'all 0.3s ease';

        setTimeout(() => {
            plzInput.style.background = '';
            plzInput.style.color = '';
        }, 1500);
    }

    if (ortInput && plzInput && plzInput.id !== 'PLZ') {
        ortInput.value = city;

        ortInput.style.background = '#4CAF50';
        ortInput.style.color = 'white';
        ortInput.style.transition = 'all 0.3s ease';

        setTimeout(() => {
            ortInput.style.background = '';
            ortInput.style.color = '';
        }, 1500);
    }

    dropdown.classList.remove('active');
    dropdown.innerHTML = '';
}

// ==========================================
// Password Toggle
// ==========================================

function setupPasswordToggles() {
    qsa('.password-toggle').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const input = qs(`#${targetId}`);

            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
            } else {
                input.type = 'password';
            }
        });
    });
}

// ==========================================
// File Upload
// ==========================================

function setupFileUpload() {
    const fileInput = qs('#uploadedfile');

    if (!fileInput) return;

    fileInput.addEventListener('change', function(e) {
        const maxSize = 20 * 1024 * 1024; // 20MB

        for (const file of e.target.files) {
            if (file.size > maxSize) {
                showError(`Die Datei "${file.name}" ist zu groß (max. 20 MB)`);
                e.target.value = '';
                return;
            }
        }

        for (const file of e.target.files) {
            if (!uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
                uploadedFiles.push(file);
            }
        }

        e.target.value = '';
        renderFileList();
    });
}

function renderFileList() {
    const fileList = qs('#file-list');
    if (!fileList) return;

    if (uploadedFiles.length === 0) {
        fileList.innerHTML = 'Keine Dateien ausgewählt';
        return;
    }

    fileList.innerHTML = '';
    uploadedFiles.forEach((file, index) => {
        const fileTag = document.createElement('span');
        fileTag.className = 'file-tag';

        const truncatedName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;

        fileTag.innerHTML = `
            ${truncatedName}
            <span class="file-tag-remove" onclick="removeFile(${index})">×</span>
        `;
        fileList.appendChild(fileTag);
    });
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    renderFileList();
}

window.removeFile = removeFile;

// ==========================================
// Number to German Words
// ==========================================

const germanNumbers = {
    0: "null", 1: "eins", 2: "zwei", 3: "drei", 4: "vier", 5: "fünf",
    6: "sechs", 7: "sieben", 8: "acht", 9: "neun", 10: "zehn",
    11: "elf", 12: "zwölf", 13: "dreizehn", 14: "vierzehn", 15: "fünfzehn",
    16: "sechzehn", 17: "siebzehn", 18: "achtzehn", 19: "neunzehn",
    20: "zwanzig", 30: "dreißig", 40: "vierzig", 50: "fünfzig",
    60: "sechzig", 70: "siebzig", 80: "achtzig", 90: "neunzig"
};

function numberToGerman(n) {
    n = parseInt(n, 10);
    if (isNaN(n) || n < 0) return "";
    if (germanNumbers[n]) return germanNumbers[n];

    if (n < 100) {
        const ones = n % 10;
        const tens = n - ones;
        return (ones === 1 ? "ein" : germanNumbers[ones]) + "und" + germanNumbers[tens];
    }

    if (n < 1000) {
        const hundreds = Math.floor(n / 100);
        const rest = n % 100;
        let result = (hundreds === 1 ? "ein" : germanNumbers[hundreds]) + "hundert";
        if (rest > 0) result += numberToGerman(rest);
        return result;
    }

    if (n < 1000000) {
        const thousands = Math.floor(n / 1000);
        const rest = n % 1000;
        let result = (thousands === 1 ? "ein" : numberToGerman(thousands)) + "tausend";
        if (rest > 0) result += numberToGerman(rest);
        return result;
    }

    return "";
}

function euroCentToGerman(input) {
    if (!input) return "";

    const sanitized = input.replace(",", ".");
    const [euroStr, centStr] = sanitized.split(".");
    const euro = parseInt(euroStr || "0", 10);
    const cent = parseInt((centStr || "0").padEnd(2, "0").slice(0, 2), 10);

    let result = "";
    if (euro > 0) result += numberToGerman(euro) + " Euro";
    if (cent > 0) result += (result ? " " : "") + numberToGerman(cent) + " Cent";
    if (euro === 0 && cent === 0) return "null Euro";

    return result;
}

function setupBetragConverter() {
    const betragInput = qs('#betrag2');
    const wortenInput = qs('#betragimworten');

    if (!betragInput || !wortenInput) return;

    betragInput.addEventListener('input', function() {
        const val = this.value.replace(/[^0-9,]/g, '');
        this.value = val;
        wortenInput.value = euroCentToGerman(val);
    });
}

// ==========================================
// Code Input Management
// ==========================================

function setupCodeInputs() {
    const codeInputs = qsa('.code-digit');

    codeInputs.forEach((input, idx) => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 1);

            if (this.value && idx < codeInputs.length - 1) {
                codeInputs[idx + 1].focus();
            }
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && idx > 0) {
                codeInputs[idx - 1].focus();
            }
        });

        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

            paste.split('').forEach((char, i) => {
                if (codeInputs[i]) {
                    codeInputs[i].value = char;
                }
            });

            if (codeInputs[paste.length]) {
                codeInputs[paste.length].focus();
            }
        });
    });
}

// ==========================================
// Login System
// ==========================================

function setupLogin() {
    const loginBtn = qs('#login-btn');
    const loginEmail = qs('#login-email');
    const loginPassword = qs('#login-password');
    const loginError = qs('#login-error');

    if (!loginBtn) return;

    loginBtn.addEventListener('click', async () => {
        const email = loginEmail?.value?.trim();
        const password = loginPassword?.value;

        if (loginError) {
            loginError.style.display = 'none';
            loginError.textContent = '';
        }

        if (!email || !password) {
            if (loginError) {
                loginError.textContent = 'Bitte E-Mail und Passwort eingeben';
                loginError.style.display = 'block';
            }
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>Anmelden...</span>';
        showWaiting(true);

        try {
            const r = await apiPost('login', { email, password }, 15000);
            showWaiting(false);

            if (r.ok && r.data?.status === 'success') {
                session.email = email;
                session.token = '';
                hideModal('#login-overlay');
                showModal('#code-overlay');

                qsa('.code-digit').forEach(input => input.value = '');
                qsa('.code-digit')[0]?.focus();
            } else {
                if (loginError) {
                    loginError.textContent = r.data?.message || 'Anmeldedaten ungültig.';
                    loginError.style.display = 'block';
                }
            }
        } catch (err) {
            showWaiting(false);
            if (loginError) {
                loginError.textContent = 'Netzwerkfehler beim Anmelden.';
                loginError.style.display = 'block';
            }
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Anmelden</span>';
        }
    });
}

// ==========================================
// 2FA Verification
// ==========================================

function setup2FA() {
    const confirmBtn = qs('#confirm-code-btn');
    const codeError = qs('#code-error');

    if (!confirmBtn) return;

    confirmBtn.addEventListener('click', async () => {
        const code = qsa('.code-digit').map(i => i.value).join('');

        if (codeError) {
            codeError.style.display = 'none';
            codeError.textContent = '';
        }

        if (!/^\d{6}$/.test(code)) {
            if (codeError) {
                codeError.textContent = 'Bitte geben Sie den vollständigen 6-stelligen Code ein';
                codeError.style.display = 'block';
            }
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span>Überprüfe...</span>';
        showWaiting(true);

        try {
            const r = await apiPost('verify', { email: session.email, code }, 15000);
            showWaiting(false);

            if (r.ok && r.data?.status === 'success') {
                session.token = r.data.token || '';
                hideModal('#code-overlay');

                const emailField = qs('#Email');
                if (emailField) emailField.value = session.email;

                if (r.data.user) {
                    prefillFromUser(r.data.user);
                } else {
                    await fetchAndPrefillUserData();
                }
            } else {
                if (codeError) {
                    codeError.textContent = r.data?.message || 'Ungültiger Code.';
                    codeError.style.display = 'block';
                }
            }
        } catch (err) {
            showWaiting(false);
            if (codeError) {
                codeError.textContent = 'Netzwerkfehler bei der Verifizierung.';
                codeError.style.display = 'block';
            }
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<span>Bestätigen</span>';
        }
    });
}

// ==========================================
// Prefill User Data
// ==========================================

function prefillFromUser(u) {
    const map = [
        ['#Name', 'name_vorname'],
        ['#adresse', 'strasse_hausnummer'],
        ['#PLZ', 'plz'],
        ['#Unterschrift', 'unterschrift'],
        ['#iban', 'iban'],
        ['#kreditinstitut', 'kreditinstitut'],
        ['#empfanger', 'empfaenger'],
        ['#tatigkeit', 'taetigkeit']
    ];

    map.forEach(([sel, key]) => {
        const el = qs(sel);
        if (el && u[key] != null) el.value = u[key];
    });
}

async function fetchAndPrefillUserData() {
    if (!session.token) return;

    showWaiting(true);
    const r = await apiPostAuth('get-user', {}, 15000);
    showWaiting(false);

    if (r.ok && r.data?.status === 'success' && r.data.user) {
        prefillFromUser(r.data.user);
    }
}

// ==========================================
// Registration
// ==========================================

function setupRegistration() {
    const openRegisterBtn = qs('#open-register');
    const cancelBtn = qs('#register-cancel');
    const registerForm = qs('#register-form');
    const registerError = qs('#register-error');

    if (openRegisterBtn) {
        openRegisterBtn.addEventListener('click', () => {
            hideModal('#login-overlay');
            showModal('#register-overlay');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            hideModal('#register-overlay');
            showModal('#login-overlay');
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (registerError) {
                registerError.style.display = 'none';
                registerError.textContent = '';
            }

            const data = {
                name: qs('#reg-name')?.value?.trim(),
                adresse: qs('#reg-adresse')?.value?.trim(),
                plz: qs('#reg-plz')?.value?.trim(),
                ort: qs('#reg-ort')?.value?.trim(),
                unterschrift: qs('#reg-unterschrift')?.value?.trim(),
                iban: qs('#reg-iban')?.value?.trim(),
                institut: qs('#reg-institut')?.value?.trim(),
                empfanger: qs('#reg-empfanger')?.value?.trim(),
                taetigkeit: qs('#reg-taetigkeit')?.value?.trim(),
                email: qs('#reg-email')?.value?.trim(),
                pass: qs('#reg-pass')?.value || '',
                pass2: qs('#reg-pass2')?.value || ''
            };

            if (!data.email || !data.pass || !data.pass2) {
                if (registerError) {
                    registerError.textContent = 'Bitte E-Mail und beide Passwörter angeben.';
                    registerError.style.display = 'block';
                }
                return;
            }

            if (data.pass !== data.pass2) {
                if (registerError) {
                    registerError.textContent = 'Passwörter stimmen nicht überein.';
                    registerError.style.display = 'block';
                }
                return;
            }

            // Store pending registration and open privacy modal
            pendingRegistration = data;
            hideModal('#register-overlay');
            showModal('#privacy-overlay');
        });
    }
}

// ==========================================
// Privacy Modal
// ==========================================

function setupPrivacyModal() {
    const privacyAcceptBtn = qs('#privacy-accept-btn');
    const privacyCancelBtn = qs('#privacy-cancel');

    if (privacyCancelBtn) {
        privacyCancelBtn.addEventListener('click', () => {
            hideModal('#privacy-overlay');
            showModal('#register-overlay');
        });
    }

    if (privacyAcceptBtn) {
        privacyAcceptBtn.addEventListener('click', async () => {
            if (!pendingRegistration) return;

            privacyAcceptBtn.disabled = true;
            privacyAcceptBtn.innerHTML = '<span>Registriere...</span>';
            showWaiting(true);

            try {
                const r = await apiPost('register', pendingRegistration, 20000);
                showWaiting(false);

                if (r.ok && r.data?.status === 'success') {
                    hideModal('#privacy-overlay');
                    pendingRegistration = null;
                    showModal('#login-overlay');

                    const loginError = qs('#login-error');
                    if (loginError) {
                        loginError.style.background = 'rgba(76, 175, 80, 0.1)';
                        loginError.style.color = '#4CAF50';
                        loginError.style.borderColor = 'rgba(76, 175, 80, 0.2)';
                        loginError.textContent = 'Registrierung erfolgreich! Bitte melden Sie sich an.';
                        loginError.style.display = 'block';

                        setTimeout(() => {
                            loginError.textContent = '';
                            loginError.style.display = 'none';
                            loginError.style.background = '';
                            loginError.style.color = '';
                            loginError.style.borderColor = '';
                        }, 5000);
                    }
                } else {
                    hideModal('#privacy-overlay');
                    showModal('#register-overlay');

                    const registerError = qs('#register-error');
                    if (registerError) {
                        registerError.textContent = r.data?.message || 'Registrierung fehlgeschlagen.';
                        registerError.style.display = 'block';
                    }
                }
            } catch (err) {
                showWaiting(false);
                hideModal('#privacy-overlay');
                showModal('#register-overlay');

                const registerError = qs('#register-error');
                if (registerError) {
                    registerError.textContent = 'Netzwerkfehler bei der Registrierung.';
                    registerError.style.display = 'block';
                }
            } finally {
                privacyAcceptBtn.disabled = false;
                privacyAcceptBtn.innerHTML = '<span>Bestätigen</span>';
            }
        });
    }
}

// ==========================================
// Form Submission
// ==========================================

function setupFormSubmission() {
    const submitBtn = qs('#buttone');

    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
        const email = qs('#Email')?.value?.trim();
        const checkbox = qs('#checked')?.checked;
        const iban = qs('#iban')?.value?.trim();
        const institut = qs('#kreditinstitut')?.value?.trim();
        const tatigkeit = qs('#tatigkeit')?.value?.trim();

        if (!checkbox) {
            showError('Bitte bestätigen Sie die Hinweise');
            return;
        }

        if (!email || !email.includes('@')) {
            showError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
            return;
        }

        if (!iban || !iban.startsWith('DE')) {
            showError('Bitte geben Sie eine gültige deutsche IBAN ein');
            return;
        }

        if (!institut) {
            showError('Bitte geben Sie das Kreditinstitut an');
            return;
        }

        if (!tatigkeit) {
            showError('Bitte geben Sie Ihre Tätigkeit an');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Wird übermittelt...</span>';
        showWaiting(true);

        const payload = {
            name_vorname: qs('#Name')?.value?.trim(),
            strasse_hausnummer: qs('#adresse')?.value?.trim(),
            plz_ort: qs('#PLZ')?.value?.trim(),
            vom: qs('#vom')?.value?.trim(),
            bis: qs('#bis')?.value?.trim(),
            taetigkeit: qs('#tatigkeit')?.value?.trim(),
            betrag: qs('#betrag')?.value?.trim(),
            ort: qs('#Ort')?.value?.trim(),
            datum: qs('#Datum')?.value?.trim(),
            unterschrift: qs('#Unterschrift')?.value?.trim(),
            iban: qs('#iban')?.value?.trim(),
            kreditinstitut: qs('#kreditinstitut')?.value?.trim(),
            empfaenger: qs('#empfanger')?.value?.trim(),
            zahlungsgrund: qs('#zahlungsgrund')?.value?.trim(),
            betrag_in_eur: qs('#betrag2')?.value?.trim(),
            betrag_in_worten: qs('#betragimworten')?.value?.trim(),
            kommentar: qs('#kommentar')?.value?.trim()
        };

        try {
            const files = await filesToBase64List(uploadedFiles);
            const r = await apiPostAuth('submit', { payload, files }, 60000);
            showWaiting(false);

            if (r.ok && r.data?.status === 'success') {
                const codeElement = qs('#confirmation-code');
                if (codeElement) {
                    codeElement.textContent = r.data.antrags_nummer || 'Kein Referenzcode gefunden. Diesen erhalten Sie in Ihrer E-Mail.';
                }
                showModal('#confirmation-modal');
            } else {
                showError(r.data?.message || 'Übermittlung fehlgeschlagen.');
            }
        } catch (err) {
            showWaiting(false);
            showError('Übermittlung fehlgeschlagen (Datei oder Netzwerk).');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">Daten übermitteln</span><svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        }
    });
}

// ==========================================
// Modal Close Handlers
// ==========================================

function setupModalCloseHandlers() {
    qsa('.modal-overlay').forEach(overlay => {
        if (!overlay.dataset.persistent) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    hideModal(`#${overlay.id}`);
                }
            });
        }
    });

    const closeSuccessBtn = qs('#close-success-modal');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            hideModal('#success-overlay');
        });
    }
}

// ==========================================
// Initialization
// ==========================================

function init() {
    setCurrentDate();

    setupIBANLookup('#iban', '#kreditinstitut');
    setupIBANLookup('#reg-iban', '#reg-institut');

    setupAddressAutocomplete('#adresse', '#address-dropdown', '#PLZ', null);
    setupAddressAutocomplete('#reg-adresse', '#reg-address-dropdown', '#reg-plz', '#reg-ort');

    setupPasswordToggles();
    setupFileUpload();
    setupBetragConverter();
    setupCodeInputs();
    setupLogin();
    setup2FA();
    setupRegistration();
    setupPrivacyModal();
    setupFormSubmission();
    setupModalCloseHandlers();

    showModal('#login-overlay');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
(function bootstrapPowerPagesSafe() {
    function init() {
        // guards — do NOT crash portal scripts
        if (!document.body) return;

        setCurrentDate();
        setupPasswordToggles();
        setupIBANLookup('#iban', '#kreditinstitut');
        setupIBANLookup('#reg-iban', '#reg-institut');

        setupAddressAutocomplete(
            '#adresse',
            '#address-dropdown',
            '#PLZ',
            null
        );

        setupAddressAutocomplete(
            '#reg-adresse',
            '#reg-address-dropdown',
            '#reg-plz',
            '#reg-ort'
        );
    }

    // run once DOM is really stable
    if (document.readyState === 'complete') {
        setTimeout(init, 0);
    } else {
        window.addEventListener('load', () => setTimeout(init, 0));
    }
})();
