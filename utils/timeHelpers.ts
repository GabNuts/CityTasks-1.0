
// utils/timeHelpers.ts

// --- PHASE CALCULATION ---
// Simple implementation based on synodic month
export const getMoonPhase = (date: Date) => {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (month < 3) {
    year--;
    month += 12;
  }

  ++month;

  let c = 365.25 * year;
  let e = 30.6 * month;
  let jd = c + e + day - 694039.09; // jd is total days elapsed
  jd /= 29.5305882; // divide by the moon cycle
  let b = parseInt(jd.toString()); // int(jd) -> b
  jd -= b; 
  b = Math.round(jd * 8); 

  if (b >= 8) b = 0; 

  const phases = [
    { name: 'Lua Nova', icon: 'new', id: 'new', emoji: '🌑' },
    { name: 'Lua Crescente', icon: 'waxing_crescent', id: 'wax_c', emoji: '🌒' },
    { name: 'Quarto Crescente', icon: 'first_quarter', id: 'first_q', emoji: '🌓' },
    { name: 'Crescente Gibosa', icon: 'waxing_gibbous', id: 'wax_g', emoji: '🌔' },
    { name: 'Lua Cheia', icon: 'full', id: 'full', emoji: '🌕' },
    { name: 'Minguante Gibosa', icon: 'waning_gibbous', id: 'wan_g', emoji: '🌖' },
    { name: 'Quarto Minguante', icon: 'last_quarter', id: 'last_q', emoji: '🌗' },
    { name: 'Lua Minguante', icon: 'waning_crescent', id: 'wan_c', emoji: '🌘' }
  ];

  return phases[b];
};

export const getSeasonSouthernHemisphere = (date: Date) => {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  // Londrina (Southern Hemisphere)
  // Summer: Dec 21 - Mar 20
  // Autumn: Mar 21 - Jun 20
  // Winter: Jun 21 - Sep 22
  // Spring: Sep 23 - Dec 20

  if (month < 2 || (month === 2 && day < 21) || (month === 11 && day >= 21)) {
    return { name: 'Verão', icon: 'sun' };
  } else if (month < 5 || (month === 5 && day < 21)) {
    return { name: 'Outono', icon: 'leaf' };
  } else if (month < 8 || (month === 8 && day < 23)) {
    return { name: 'Inverno', icon: 'snowflake' };
  } else {
    return { name: 'Primavera', icon: 'flower' };
  }
};

// --- SUNSET/SUNRISE CALCULATION ---
export const getSunTimes = (date: Date) => {
    const season = getSeasonSouthernHemisphere(date).name;
    let sunrise = 6.0; // 06:00
    let sunset = 18.5; // 18:30 (Default Spring/Autumn)

    if (season === 'Verão') {
        sunrise = 5.5;  // 05:30
        sunset = 19.5;  // 19:30
    } else if (season === 'Inverno') {
        sunrise = 7.0;  // 07:00
        sunset = 17.5;  // 17:30
    }
    
    return { sunrise, sunset };
};

export const isNightTime = (date: Date = new Date()): boolean => {
    const { sunrise, sunset } = getSunTimes(date);
    const currentHour = date.getHours() + (date.getMinutes() / 60);
    return currentHour < sunrise || currentHour >= sunset;
};

// --- PRECISE ASTRONOMY (SOLSTICE/EQUINOX) ---
const getJDE = (year: number) => {
    return (year - 2000) / 1000;
};

// Formulas from Jean Meeus "Astronomical Algorithms"
const calcSolarEvent = (year: number, type: 'mar' | 'jun' | 'sep' | 'dec') => {
    const Y = getJDE(year);
    let jde = 0;

    if (type === 'mar') { // March Equinox
        jde = 2451623.80984 + 365242.37404 * Y + 0.05169 * Y*Y - 0.00411 * Y*Y*Y - 0.00057 * Y*Y*Y*Y;
    } else if (type === 'jun') { // June Solstice
        jde = 2451716.56775 + 365242.37404 * Y + 0.05169 * Y*Y - 0.00411 * Y*Y*Y - 0.00057 * Y*Y*Y*Y;
    } else if (type === 'sep') { // Sept Equinox
        jde = 2451810.21715 + 365242.37404 * Y + 0.05169 * Y*Y - 0.00411 * Y*Y*Y - 0.00057 * Y*Y*Y*Y;
    } else { // Dec Solstice
        jde = 2451900.05952 + 365242.37404 * Y + 0.05169 * Y*Y - 0.00411 * Y*Y*Y - 0.00057 * Y*Y*Y*Y;
    }

    // Convert Julian Date to Date
    const timestamp = (jde - 2440587.5) * 86400000;
    return new Date(timestamp);
};

export const getAstronomicalEvents = (year: number) => {
    // Events for Southern Hemisphere labels
    return [
        { name: 'Equinócio de Outono', date: calcSolarEvent(year, 'mar'), icon: 'leaf', emoji: '🍂' },
        { name: 'Solstício de Inverno', date: calcSolarEvent(year, 'jun'), icon: 'snowflake', emoji: '❄️' },
        { name: 'Equinócio de Primavera', date: calcSolarEvent(year, 'sep'), icon: 'flower', emoji: '🌻' },
        { name: 'Solstício de Verão', date: calcSolarEvent(year, 'dec'), icon: 'sun', emoji: '☀️' }
    ];
};

// Algoritmo de Gauss para calcular a Páscoa
const getEasterDate = (year: number) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed month
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    return new Date(year, month, day);
};

export type EventType = 'none' | 'christmas' | 'new_year' | 'carnival' | 'easter' | 'junina' | 'independence' | 'halloween';

export const getCurrentHoliday = (date: Date): EventType => {
    const d = date.getDate();
    const m = date.getMonth(); // 0-11
    const y = date.getFullYear();

    // 1. Natal: 01 Dez - 26 Dez
    if (m === 11 && d >= 1 && d <= 26) return 'christmas';

    // 2. Ano Novo: 31 Dez - 02 Jan
    if ((m === 11 && d === 31) || (m === 0 && d <= 2)) return 'new_year';

    // 3. Festa Junina: Junho inteiro
    if (m === 5) return 'junina';

    // 4. Independência: 07 Setembro
    if (m === 8 && d === 7) return 'independence';

    // 5. Halloween: 31 Outubro
    if (m === 9 && d === 31) return 'halloween';

    // Datas Móveis (Páscoa e Carnaval)
    const easter = getEasterDate(y);
    const easterDay = easter.getDate();
    const easterMonth = easter.getMonth();

    // Páscoa: Véspera + Dia (2 dias)
    const easterEve = new Date(easter);
    easterEve.setDate(easter.getDate() - 1);
    
    // Check Easter (ignoring strict time, just day match)
    if ( (m === easterMonth && d === easterDay) || (m === easterEve.getMonth() && d === easterEve.getDate()) ) {
        return 'easter';
    }

    // Carnaval: Semana (Domingo a Sábado, sendo Terça o feriado)
    // Terça de Carnaval = Páscoa - 47 dias
    const carnivalTue = new Date(easter);
    carnivalTue.setDate(easter.getDate() - 47);
    
    // Semana do carnaval: Começa no Domingo antes (Terça - 2) e vai até Sábado (Terça + 4) -> 7 dias
    const carnivalStart = new Date(carnivalTue);
    carnivalStart.setDate(carnivalTue.getDate() - 2);
    const carnivalEnd = new Date(carnivalTue);
    carnivalEnd.setDate(carnivalTue.getDate() + 4);

    const checkDate = new Date(date);
    checkDate.setHours(0,0,0,0);
    // Ajuste simples para range de datas móveis
    if (checkDate >= carnivalStart && checkDate <= carnivalEnd) {
        return 'carnival';
    }

    return 'none';
};

export const checkHoliday = (date: Date): string | null => {
    const d = date.getDate();
    const m = date.getMonth(); // 0-11
    const y = date.getFullYear();

    // Datas Fixas
    if (d === 1 && m === 0) return '🥂'; // Ano Novo
    if (d === 21 && m === 3) return '🗡️'; // Tiradentes
    if (d === 1 && m === 4) return '👷'; // Dia do Trabalho
    if (d === 12 && m === 5) return '💘'; // Dia dos Namorados
    if (d === 7 && m === 8) return '🇧🇷'; // Independência
    if (d === 12 && m === 9) return '🙏'; // N. Sra. Aparecida
    if (d === 2 && m === 10) return '🪦'; // Finados
    if (d === 15 && m === 10) return '🗳️'; // Proclamação da República
    if (d === 25 && m === 11) return '🎄'; // Natal
    if (d === 31 && m === 11) return '🎆'; // Véspera Ano Novo

    // Datas Móveis
    const easter = getEasterDate(y);
    if (d === easter.getDate() && m === easter.getMonth()) return '🍫'; // Páscoa

    const carnival = new Date(easter);
    carnival.setDate(easter.getDate() - 47);
    if (d === carnival.getDate() && m === carnival.getMonth()) return '🎭'; // Carnaval (Terça)

    const corpus = new Date(easter);
    corpus.setDate(easter.getDate() + 60);
    if (d === corpus.getDate() && m === corpus.getMonth()) return '✝️'; // Corpus Christi

    return null;
};

export const getMonthlyMoonPhases = (year: number, month: number) => {
    // Generate an array of days for the month with their moon phase
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendar = [];
    const events = getAstronomicalEvents(year);

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        
        // Verifica Eventos Astronômicos no dia (ignorando hora)
        const astroEvent = events.find(e => 
            e.date.getDate() === d && e.date.getMonth() === month
        );

        calendar.push({
            day: d,
            phase: getMoonPhase(date),
            isToday: new Date().toDateString() === date.toDateString(),
            holidayEmoji: checkHoliday(date),
            astroEmoji: astroEvent ? astroEvent.emoji : null,
            astroName: astroEvent ? astroEvent.name : null
        });
    }
    return calendar;
};

// --- GENERAL UTILS ---

// NOVA LÓGICA: O dia do jogo só vira as 07:00 AM.
const GAME_DAY_START_HOUR = 7;

/**
 * Retorna um objeto Date ajustado para a lógica do jogo.
 * Se for antes das 7 da manhã, retorna o dia anterior.
 */
export const getAdjustedDate = (date: Date = new Date()): Date => {
    const adjusted = new Date(date);
    adjusted.setHours(adjusted.getHours() - GAME_DAY_START_HOUR);
    return adjusted;
};

/**
 * Retorna string YYYY-MM-DD baseada no dia ajustado (Virtual Day).
 * Use isso para salvar/filtrar tarefas.
 */
export const getGameDateString = (date: Date = new Date()): string => {
    const adjusted = getAdjustedDate(date);
    const y = adjusted.getFullYear();
    const m = String(adjusted.getMonth() + 1).padStart(2, '0');
    const d = String(adjusted.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const getGameDay = (createdAt: number) => {
  // Ajusta também a data de criação para comparar laranjas com laranjas
  const startDate = getAdjustedDate(new Date(createdAt));
  const now = getAdjustedDate(new Date());

  // Reset to midnight to calculate calendar days passed relative to Game Day Start
  startDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diff = now.getTime() - startDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days + 1; // Day 1 is the creation day
};

export const formatTime = (date: Date) => {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateFull = (date: Date) => {
  // Ex: "terça, 23 de Dezembro de 2025"
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
  const day = date.getDate();
  const month = date.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  const year = date.getFullYear();

  return `${weekday}, ${day} de ${capitalizedMonth} de ${year}`;
};

export const getWorldTime = (offset: number) => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const nd = new Date(utc + (3600000 * offset));
  return nd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
