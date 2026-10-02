/** Shared brand mark; its containing landmark supplies the accessible name. */
export function OrbitMark() {
  const maskImage = `url(${import.meta.env.BASE_URL}brand/orbit-symbol-small.svg)`

  return (
    <span
      className="orbit-brand-symbol"
      style={{ maskImage, WebkitMaskImage: maskImage }}
      aria-hidden="true"
    />
  )
}
