export function DatasetLimitations() {
  return (
    <section aria-labelledby="dataset-limitations-title" className="rounded-lg border p-4">
      <h2 id="dataset-limitations-title" className="font-semibold">Dataset limitations</h2>
      <p className="mt-2 text-sm">
        Metrics describe wireless infrastructure observed by this survey. They do not directly measure population,
        customer footfall, internet speed, sales, or property value. This is historical survey coverage, not live
        citywide coverage.
      </p>
      <p className="mt-2 text-sm">
        A minimum of five unique normalized network identifiers is required before a cell is published. This
        suppression rule is not an anonymity guarantee.
      </p>
    </section>
  );
}
