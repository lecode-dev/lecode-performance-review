import type { ReactNode } from 'react'

export interface Person {
  name: string
  role?: string
  color?: string
}

/** Cor determinística a partir do nome — usada quando a pessoa não tem `color` definida no banco. */
function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return `oklch(0.55 0.13 ${hash % 360})`
}

export function Avatar({ person, size = '' }: { person: Person; size?: string }) {
  const initials = person.name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  return (
    <div className={`avatar ${size}`} style={{ background: person.color ?? colorFromName(person.name) }}>
      {initials}
    </div>
  )
}

export function PersonRow({ person, sub }: { person: Person; sub?: ReactNode }) {
  return (
    <div className="person">
      <Avatar person={person} />
      <div className="col" style={{ minWidth: 0 }}>
        <span className="pn">{person.name}</span>
        <span className="pr">{sub ?? person.role}</span>
      </div>
    </div>
  )
}
