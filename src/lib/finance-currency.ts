import { format, subDays } from 'date-fns';

export const FINANCE_CURRENCIES = ['ARS', 'USD'] as const;

export type FinanceCurrency = typeof FINANCE_CURRENCIES[number];

export interface BlueRateQuote {
  rate: number;
  effectiveDate: string;
  source: 'dolarapi-current-blue' | 'argentinadatos-blue' | 'argentinadatos-blue-fallback';
  updatedAt: string | null;
}

export interface ResolvedCurrencyAmount {
  amount_ars: number;
  exchange_rate: number | null;
  exchange_rate_date: string | null;
  exchange_source: string | null;
}

const BUENOS_AIRES_TIMEZONE = 'America/Argentina/Buenos_Aires';
const blueRateCache = new Map<string, Promise<BlueRateQuote>>();

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

function formatHistoricalPathDate(date: string) {
  return date.replace(/-/g, '/');
}

function parseStableDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

export function normalizeFinanceCurrency(currency: string | null | undefined): FinanceCurrency {
  return currency === 'USD' ? 'USD' : 'ARS';
}

export function getTodayInBuenosAires(reference = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUENOS_AIRES_TIMEZONE,
  }).format(reference);
}

export function formatFinanceCurrency(amount: number, currency: string = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: normalizeFinanceCurrency(currency),
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function fetchBlueRateForDate(requestedDate: string): Promise<BlueRateQuote> {
  const safeDate = requestedDate || getTodayInBuenosAires();

  if (!blueRateCache.has(safeDate)) {
    blueRateCache.set(safeDate, (async () => {
      const today = getTodayInBuenosAires();

      if (safeDate >= today) {
        const response = await fetch('https://dolarapi.com/v1/dolares/blue');
        if (!response.ok) {
          throw new Error('No se pudo obtener la cotizacion blue actual');
        }

        const data = await response.json();

        return {
          rate: Number(data.venta),
          effectiveDate: (data.fechaActualizacion || today).slice(0, 10),
          source: 'dolarapi-current-blue',
          updatedAt: data.fechaActualizacion || null,
        } satisfies BlueRateQuote;
      }

      const targetDate = parseStableDate(safeDate);

      for (let offset = 0; offset < 7; offset += 1) {
        const candidateDate = format(subDays(targetDate, offset), 'yyyy-MM-dd');
        const response = await fetch(
          `https://api.argentinadatos.com/v1/cotizaciones/dolares/blue/${formatHistoricalPathDate(candidateDate)}`,
        );

        if (!response.ok) {
          continue;
        }

        const data = await response.json();

        return {
          rate: Number(data.venta),
          effectiveDate: data.fecha || candidateDate,
          source: offset === 0 ? 'argentinadatos-blue' : 'argentinadatos-blue-fallback',
          updatedAt: data.fecha || candidateDate,
        } satisfies BlueRateQuote;
      }

      throw new Error('No se pudo obtener la cotizacion blue historica');
    })());
  }

  return blueRateCache.get(safeDate)!;
}

export async function resolveCurrencyAmount({
  amount,
  currency,
  date,
}: {
  amount: number;
  currency: string | null | undefined;
  date: string;
}): Promise<ResolvedCurrencyAmount> {
  const normalizedCurrency = normalizeFinanceCurrency(currency);

  if (normalizedCurrency === 'ARS') {
    return {
      amount_ars: roundToTwoDecimals(amount),
      exchange_rate: null,
      exchange_rate_date: null,
      exchange_source: null,
    };
  }

  const quote = await fetchBlueRateForDate(date || getTodayInBuenosAires());

  return {
    amount_ars: roundToTwoDecimals(amount * quote.rate),
    exchange_rate: quote.rate,
    exchange_rate_date: quote.effectiveDate,
    exchange_source: quote.source,
  };
}

export function getResolvedAmountArs({
  amount,
  currency,
  amountArs,
}: {
  amount: number;
  currency: string | null | undefined;
  amountArs: number | null | undefined;
}) {
  if (amountArs !== null && amountArs !== undefined) {
    return Number(amountArs);
  }

  return normalizeFinanceCurrency(currency) === 'ARS' ? Number(amount) : null;
}
