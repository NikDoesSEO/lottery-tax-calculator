import { useMemo, useState, type ReactNode } from 'react';

type TaxBracket = 'basic' | 'higher' | 'additional';

const BASIC_RATE = 0.2;
const HIGHER_RATE = 0.4;
const ADDITIONAL_RATE = 0.45;
const INHERITANCE_TAX_RATE = 0.4;
const INHERITANCE_TAX_THRESHOLD_INDIVIDUAL = 325_000;
const ANNUAL_GIFT_ALLOWANCE = 3_000;

const PERSONAL_SAVINGS_ALLOWANCE: Record<TaxBracket, number> = {
  basic: 1_000,
  higher: 500,
  additional: 0,
};

const TAX_RATE_BY_BRACKET: Record<TaxBracket, number> = {
  basic: BASIC_RATE,
  higher: HIGHER_RATE,
  additional: ADDITIONAL_RATE,
};

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const gbpWithDecimals = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-GB');

function formatCurrency(value: number) {
  return gbp.format(value);
}

function formatCurrencyWithDecimals(value: number) {
  return gbpWithDecimals.format(value);
}

function formatNumberWithCommas(value: number) {
  return numberFormatter.format(value);
}

interface InfoTooltipProps {
  text: string;
}

function InfoTooltip({ text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary-a30 text-[10px] font-bold text-black cursor-help hover:bg-brand-primary-a50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
      >
        i
      </button>
      {open && (
        <span className="absolute z-10 -right-2 top-6 w-52 p-2 text-xs leading-snug text-white bg-black rounded shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

interface CurrencyFieldProps {
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  id: string;
}

function CurrencyField({ label, value, onChange, id }: CurrencyFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-brand-fg-muted">£</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={formatNumberWithCommas(value)}
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, '');
            if (raw === '') {
              onChange(0);
              return;
            }
            const parsed = Number(raw);
            if (!Number.isNaN(parsed)) onChange(parsed);
          }}
          className="w-full rounded-brand border border-black/20 bg-white pl-7 pr-3 py-2.5 text-base focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
        />
      </div>
    </div>
  );
}

const TOOLTIPS = {
  winnings: 'The total amount you won from the lottery (tax-free in the UK).',
  interestRate: 'The annual interest rate you expect to earn on your winnings if deposited in a savings account.',
  taxBracket: 'Your income tax band, which affects your Personal Savings Allowance and tax rates.',
  giftAmount: 'Any amount you plan to give to family members or friends from your winnings.',
  currentEstate: 'The total value of your assets (property, investments, etc.) not including your lottery winnings.',
} as const;

export default function LotteryTaxCalculator() {
  const [winnings, setWinnings] = useState(1_000_000);
  const [interestRate, setInterestRate] = useState(3.5);
  const [taxBracket, setTaxBracket] = useState<TaxBracket>('basic');
  const [giftAmount, setGiftAmount] = useState(50_000);
  const [currentEstate, setCurrentEstate] = useState(100_000);
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    const annualInterest = (winnings * interestRate) / 100;

    const personalSavingsAllowance = PERSONAL_SAVINGS_ALLOWANCE[taxBracket];
    const taxableInterest = Math.max(0, annualInterest - personalSavingsAllowance);
    const taxOnInterest = taxableInterest * TAX_RATE_BY_BRACKET[taxBracket];

    const totalEstate = currentEstate + winnings;
    const taxableEstate = Math.max(0, totalEstate - INHERITANCE_TAX_THRESHOLD_INDIVIDUAL);
    const inheritanceTaxLiability = taxableEstate * INHERITANCE_TAX_RATE;

    const taxFreeGiftAmount = Math.min(giftAmount, ANNUAL_GIFT_ALLOWANCE);
    const taxableGiftAmount = giftAmount - taxFreeGiftAmount;
    const potentialGiftInheritanceTax = taxableGiftAmount * INHERITANCE_TAX_RATE;

    return {
      annualInterest,
      personalSavingsAllowance,
      taxOnInterest,
      totalEstate,
      inheritanceTaxLiability,
      taxFreeGiftAmount,
      taxableGiftAmount,
      potentialGiftInheritanceTax,
    };
  }, [winnings, interestRate, taxBracket, giftAmount, currentEstate]);

  return (
    <div className="w-full">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div className="rounded-brand bg-brand-bg-alt border border-black/10 p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-5">Your details</h2>

          <CurrencyField
            id="winnings"
            label={<>Lottery winnings <InfoTooltip text={TOOLTIPS.winnings} /></>}
            value={winnings}
            onChange={setWinnings}
          />

          <div className="mb-4">
            <label htmlFor="interestRate" className="block text-sm font-medium mb-1">
              Expected interest rate (%) <InfoTooltip text={TOOLTIPS.interestRate} />
            </label>
            <input
              id="interestRate"
              type="number"
              step="0.1"
              min="0"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
              className="w-full rounded-brand border border-black/20 bg-white px-3 py-2.5 text-base focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="taxBracket" className="block text-sm font-medium mb-1">
              Your tax bracket <InfoTooltip text={TOOLTIPS.taxBracket} />
            </label>
            <select
              id="taxBracket"
              value={taxBracket}
              onChange={(e) => setTaxBracket(e.target.value as TaxBracket)}
              className="w-full rounded-brand border border-black/20 bg-white px-3 py-2.5 text-base focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
            >
              <option value="basic">Basic rate (20%)</option>
              <option value="higher">Higher rate (40%)</option>
              <option value="additional">Additional rate (45%)</option>
            </select>
          </div>

          <CurrencyField
            id="giftAmount"
            label={<>Gift amount (if planning to give money away) <InfoTooltip text={TOOLTIPS.giftAmount} /></>}
            value={giftAmount}
            onChange={setGiftAmount}
          />

          <CurrencyField
            id="currentEstate"
            label={<>Value of your current estate (excluding lottery) <InfoTooltip text={TOOLTIPS.currentEstate} /></>}
            value={currentEstate}
            onChange={setCurrentEstate}
          />

          <button
            type="button"
            onClick={() => setShowResults(true)}
            className="w-full mt-2 inline-flex items-center justify-center rounded-brand bg-brand-primary hover:bg-brand-primary-hover text-brand-fg font-semibold py-3 px-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            Calculate your tax
          </button>
        </div>

        {/* Results */}
        {showResults ? (
          <div className="rounded-brand bg-brand-primary-a10 border border-brand-primary-a30 p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-5">Tax results</h2>

            <div className="space-y-4">
              <div className="bg-white rounded-brand p-4 border border-black/5">
                <h3 className="font-semibold mb-1">Interest on savings</h3>
                <p className="text-sm text-brand-fg-muted mb-3">
                  If you deposit your winnings in a savings account:
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-brand-fg-muted">Annual interest:</dt>
                  <dd className="text-right font-medium">{formatCurrencyWithDecimals(results.annualInterest)}</dd>
                  <dt className="text-brand-fg-muted">Tax-free allowance:</dt>
                  <dd className="text-right font-medium">{formatCurrency(results.personalSavingsAllowance)}</dd>
                  <dt className="text-brand-fg-muted">Annual tax on interest:</dt>
                  <dd className="text-right font-medium">{formatCurrencyWithDecimals(results.taxOnInterest)}</dd>
                </dl>
              </div>

              <div className="bg-white rounded-brand p-4 border border-black/5">
                <h3 className="font-semibold mb-1">Inheritance tax</h3>
                <p className="text-sm text-brand-fg-muted mb-3">
                  Potential liability if your estate includes the winnings:
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-brand-fg-muted">Total estate value:</dt>
                  <dd className="text-right font-medium">{formatCurrency(results.totalEstate)}</dd>
                  <dt className="text-brand-fg-muted">Tax-free threshold:</dt>
                  <dd className="text-right font-medium">{formatCurrency(INHERITANCE_TAX_THRESHOLD_INDIVIDUAL)}</dd>
                  <dt className="text-brand-fg-muted">Potential inheritance tax:</dt>
                  <dd className="text-right font-medium">{formatCurrency(results.inheritanceTaxLiability)}</dd>
                </dl>
              </div>

              <div className="bg-white rounded-brand p-4 border border-black/5">
                <h3 className="font-semibold mb-1">Gift tax implications</h3>
                <p className="text-sm text-brand-fg-muted mb-3">
                  If you gift {formatCurrency(giftAmount)} to someone:
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-brand-fg-muted">Immediate gift tax:</dt>
                  <dd className="text-right font-medium">{formatCurrency(0)} (none in UK)</dd>
                  <dt className="text-brand-fg-muted">Annual tax-free allowance:</dt>
                  <dd className="text-right font-medium">{formatCurrency(ANNUAL_GIFT_ALLOWANCE)}</dd>
                  <dt className="text-brand-fg-muted">Tax-free amount of gift:</dt>
                  <dd className="text-right font-medium">{formatCurrency(results.taxFreeGiftAmount)}</dd>
                  <dt className="text-brand-fg-muted">Potentially taxable amount:</dt>
                  <dd className="text-right font-medium">{formatCurrency(results.taxableGiftAmount)}</dd>
                </dl>
                <p className="mt-3 text-xs text-brand-fg-muted">
                  Note: If you die within 7 years, this gift may be subject to inheritance tax of up to{' '}
                  <span className="font-medium text-brand-fg">
                    {formatCurrency(results.potentialGiftInheritanceTax)}
                  </span>
                  .
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs text-brand-fg-muted bg-white rounded-brand p-3 border border-black/5">
              <strong className="text-brand-fg">Disclaimer:</strong> This calculator provides estimates only and
              should not be considered financial advice. Tax rules may change. Please consult with a qualified tax
              professional for advice specific to your situation.
            </p>
          </div>
        ) : (
          <div className="rounded-brand bg-white border border-dashed border-black/20 p-6 md:p-8 flex items-center justify-center min-h-[300px]">
            <p className="text-brand-fg-muted text-center max-w-xs">
              Fill in your details and click <strong className="text-brand-fg">Calculate your tax</strong> to see your
              results here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
