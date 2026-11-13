import { useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { listProducts, setProductStatus } from '../api'
import type { Product, ProductStatus } from '../types'

const LABEL: Record<ProductStatus, string> = {
  not_purchased: 'Not purchased', purchased: 'Purchased', running_low: 'Running low', unknown: 'Have it?',
}
const NEXT: Record<ProductStatus, ProductStatus> = {
  not_purchased: 'purchased', purchased: 'running_low', running_low: 'not_purchased', unknown: 'not_purchased',
}

const priceOf = (t: string | null) => { const m = t?.match(/\d+(\.\d+)?/); return m ? Number(m[0]) : 0 }

export default function Products() {
  const [items, setItems] = useState<Product[]>([])
  const [house, setHouse] = useState<'mom' | 'dad'>(() => (localStorage.getItem('skin.house') as 'mom' | 'dad') || 'mom')
  const [err, setErr] = useState('')

  useEffect(() => { listProducts().then(setItems).catch((e) => setErr(String(e.message ?? e))) }, [])
  useEffect(() => { localStorage.setItem('skin.house', house) }, [house])

  const list = useMemo(
    () => items.filter((p) => p.house === house).sort((a, b) => Number(b.status === 'running_low') - Number(a.status === 'running_low') || a.sort - b.sort),
    [items, house],
  )
  const total = list.filter((p) => p.status === 'not_purchased').reduce((s, p) => s + priceOf(p.price_text), 0)

  async function cycle(p: Product) {
    const status = NEXT[p.status]
    setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, status } : x)))
    try { await setProductStatus(p.id, status) } catch (e) { setErr(String((e as Error).message)); setItems((cur) => cur.map((x) => (x.id === p.id ? p : x))) }
  }

  return (
    <main className="screen">
      <h1 className="large-title">Products</h1>
      <p className="muted pad">${total.toFixed(2)} still to buy</p>

      <div className="segmented">
        {(['mom', 'dad'] as const).map((h) => (
          <button key={h} className={house === h ? 'on' : ''} onClick={() => setHouse(h)}>{h === 'mom' ? 'Mom’s House' : 'Dad’s House'}</button>
        ))}
      </div>

      {err && <p className="error pad">{err}</p>}
      <ul className="list">
        {list.map((p) => (
          <li key={p.id} className="row static prod">
            <span className="row-main">
              <b>{p.name}</b>
              <small>{p.use_note} · {p.price_text}</small>
              {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="link">Target <ChevronRight size={13} /></a>}
            </span>
            <button className={'status ' + p.status} onClick={() => cycle(p)}>{LABEL[p.status]}</button>
          </li>
        ))}
      </ul>
    </main>
  )
}
