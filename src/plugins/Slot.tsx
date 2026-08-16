import { useSlotItems } from './hooks'

/** Renders all plugin-registered items for a named UI slot, in order. */
export function Slot({ name }: { name: string }) {
  const items = useSlotItems(name)
  return (
    <>
      {items.map((item) => {
        const Component = item.component
        return <Component key={item.id} />
      })}
    </>
  )
}
