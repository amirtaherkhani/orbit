/** Shared brand image; its containing landmark supplies the accessible name. */
export function OrbitMark() {
  return (
    <img
      className="orbit-brand-symbol"
      src={`${import.meta.env.BASE_URL}brand/orbit-symbol-small.svg`}
      width={28}
      height={28}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}
