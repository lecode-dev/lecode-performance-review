interface RatingInputProps {
  value: number | null
  onChange: (value: number) => void
}

export function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <div className="rating">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          className={'rating-opt ' + (value === v ? 'sel-' + v : '')}
          onClick={() => onChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  )
}
