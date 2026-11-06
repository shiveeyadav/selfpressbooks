'use client';

import { useMemo, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { BINDINGS, PAPER_TYPES, TRIM_SIZES, pricingConfig, type Binding, type PaperType, type TrimSize } from '@/config/pricing';
import { calculatePrice } from '@/lib/pricing';
import { formatGbp, parseGbpToPence } from '@/lib/money';
import { createBookAction, type WizardState } from './actions';

const STEPS = ['Book details', 'Print format', 'Files', 'Price & submit'];
const LANGUAGES = ['English', 'Hindi', 'Portuguese', 'Spanish', 'French', 'German', 'Punjabi', 'Urdu', 'Bengali', 'Tamil', 'Welsh'];

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending}>
      {pending ? 'Uploading…' : 'Submit for review'}
    </button>
  );
}

export default function BookWizard({ defaultAuthorName, maxUploadMb }: { defaultAuthorName: string; maxUploadMb: number }) {
  const [state, formAction] = useFormState<WizardState, FormData>(createBookAction, { errors: [] });
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [trimSize, setTrimSize] = useState<TrimSize>('A5');
  const [paper, setPaper] = useState<PaperType>('bw');
  const [binding, setBinding] = useState<Binding>('paperback');
  const [pages, setPages] = useState('200');
  const [retail, setRetail] = useState('');

  const retailPence = parseGbpToPence(retail);
  const price = useMemo(
    () => calculatePrice({ trimSize, paper, binding, pageCount: Number(pages), retailPence: retailPence ?? 0 }),
    [trimSize, paper, binding, pages, retailPence],
  );

  /** Checks the native validity of inputs inside the current step before moving on. */
  function validateStep(i: number): boolean {
    const section = formRef.current?.querySelector<HTMLElement>(`[data-step="${i}"]`);
    if (!section) return true;
    for (const el of Array.from(section.querySelectorAll<HTMLInputElement>('input, select, textarea'))) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
      if (el.type === 'file' && el.files?.[0] && el.files[0].size > maxUploadMb * 1048576) {
        setStepError(`"${el.files[0].name}" is larger than ${maxUploadMb} MB.`);
        return false;
      }
    }
    if (i === 1 && price.errors.some((e) => !e.toLowerCase().includes('retail'))) {
      setStepError(price.errors.filter((e) => !e.toLowerCase().includes('retail')).join(' '));
      return false;
    }
    setStepError(null);
    return true;
  }

  const go = (to: number) => {
    if (to > step && !validateStep(step)) return;
    setStepError(null);
    setStep(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const show = (i: number) => ({ 'data-step': i, hidden: step !== i });

  return (
    <form ref={formRef} action={formAction} encType="multipart/form-data" noValidate={false}>
      <ol className="steps" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'active' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {state.errors.length > 0 && (
        <div className="notice error" role="alert">
          Please fix the following:
          <ul>{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}
      {stepError && <div className="notice error" role="alert">{stepError}</div>}

      <section {...show(0)}>
        <fieldset>
          <legend>Book details</legend>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required maxLength={200} />
          <label htmlFor="author_name">Author name (as printed on the book)</label>
          <input id="author_name" name="author_name" type="text" required maxLength={160} defaultValue={defaultAuthorName} />
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" required minLength={20} maxLength={5000} />
          <div className="hint">Shown on the book's page in the shop. 20–5000 characters.</div>
          <div className="grid-2">
            <div>
              <label htmlFor="language">Language</label>
              <input id="language" name="language" type="text" list="languages" required maxLength={60} defaultValue="English" />
              <datalist id="languages">{LANGUAGES.map((l) => <option key={l} value={l} />)}</datalist>
            </div>
            <div>
              <label htmlFor="isbn">ISBN (optional)</label>
              <input id="isbn" name="isbn" type="text" inputMode="numeric" maxLength={30} pattern="[0-9Xx\- ]{10,17}" />
              <div className="hint">ISBN-10 or ISBN-13. Leave blank if you don't have one.</div>
            </div>
          </div>
        </fieldset>
      </section>

      <section {...show(1)}>
        <fieldset>
          <legend>Trim size</legend>
          <div className="radio-row">
            {TRIM_SIZES.map((t) => (
              <label key={t.value}>
                <input type="radio" name="trim_size" value={t.value} checked={trimSize === t.value} onChange={() => setTrimSize(t.value)} />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Interior paper</legend>
          <div className="radio-row">
            {PAPER_TYPES.map((t) => (
              <label key={t.value}>
                <input type="radio" name="paper" value={t.value} checked={paper === t.value} onChange={() => setPaper(t.value)} />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Binding</legend>
          <div className="radio-row">
            {BINDINGS.map((t) => (
              <label key={t.value}>
                <input type="radio" name="binding" value={t.value} checked={binding === t.value} onChange={() => setBinding(t.value)} />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Page count</legend>
          <label htmlFor="page_count">Number of pages in the interior PDF</label>
          <input
            id="page_count" name="page_count" type="number" required step={1}
            min={binding === 'hardback' ? pricingConfig.hardbackMinPages : pricingConfig.minPages}
            max={pricingConfig.maxPages} value={pages} onChange={(e) => setPages(e.target.value)}
          />
          <div className="hint">
            {pricingConfig.minPages}–{pricingConfig.maxPages} pages
            {binding === 'hardback' ? ` (hardback: at least ${pricingConfig.hardbackMinPages})` : ''}. Count every page, including blank ones.
          </div>
        </fieldset>
      </section>

      <section {...show(2)}>
        <fieldset>
          <legend>Files</legend>
          <label htmlFor="interior">Interior (print-ready PDF)</label>
          <input id="interior" name="interior" type="file" accept="application/pdf,.pdf" required />
          <div className="hint">Must match the trim size and page count you chose. Max {maxUploadMb} MB.</div>
          <label htmlFor="cover">Cover (JPG, PNG or PDF)</label>
          <input id="cover" name="cover" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" required />
          <div className="hint">
            A JPG or PNG front cover is shown in the shop. A PDF full-wrap cover is sent to the printer but cannot be
            previewed in the shop. Max {maxUploadMb} MB.
          </div>
        </fieldset>
      </section>

      <section {...show(3)}>
        <div className="split">
          <fieldset>
            <legend>Retail price</legend>
            <label htmlFor="retail_price">Price to readers in the UK (£, including UK delivery)</label>
            <input
              id="retail_price" name="retail_price" type="text" inputMode="decimal" required
              pattern="£?[0-9]{1,6}(\.[0-9]{1,2})?" placeholder="e.g. 9.99" value={retail} onChange={(e) => setRetail(e.target.value)}
            />
            <div className="hint">Minimum for this format: {formatGbp(price.minimumRetailPence)} (gives a royalty of £0).</div>
            <label className="checkbox" style={{ marginTop: 18 }}>
              <input type="checkbox" name="rights" required />
              <span>I own the rights to this book and its cover, or have permission to publish them.</span>
            </label>
          </fieldset>
          <div className="card pricebox" aria-live="polite">
            <h3 style={{ marginTop: 0 }}>Per copy sold</h3>
            <table>
              <tbody>
                <tr><td>Retail price</td><td>{retailPence ? formatGbp(retailPence) : '—'}</td></tr>
                <tr><td>Printing</td><td>−{formatGbp(price.printCostPence)}</td></tr>
                <tr><td>UK delivery (India Post)</td><td>−{formatGbp(price.shippingPence)}</td></tr>
                <tr><td>Platform fee ({pricingConfig.platformMarginPercent}%)</td><td>−{formatGbp(price.platformMarginPence)}</td></tr>
                <tr className="total">
                  <td>Your royalty</td>
                  <td className={price.royaltyPence < 0 ? 'neg' : ''}>{retailPence ? formatGbp(price.royaltyPence) : '—'}</td>
                </tr>
              </tbody>
            </table>
            <p className="hint" style={{ marginBottom: 0 }}>
              Rates are provisional and may be updated before launch.
            </p>
          </div>
        </div>
        {retailPence !== null && !price.ok && (
          <div className="notice error" role="alert"><ul>{price.errors.map((e) => <li key={e}>{e}</li>)}</ul></div>
        )}
        <p className="muted small">
          After you submit, we review the book before it appears in the shop. You can see its status on your dashboard.
        </p>
      </section>

      <div className="actions">
        {step > 0 && <button type="button" className="secondary" onClick={() => go(step - 1)}>Back</button>}
        {step < STEPS.length - 1 && <button type="button" onClick={() => go(step + 1)}>Next</button>}
        {step === STEPS.length - 1 && <SubmitButton disabled={!price.ok} />}
      </div>
    </form>
  );
}
