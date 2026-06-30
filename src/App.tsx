import { Grid } from './components/Grid'
import { homepageConfig } from './config/homepage'

export default function App() {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-cyan/10 blur-[120px]" />
      <div className="relative mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-medium tracking-tight text-text-primary">
            {greeting}
          </h1>
          <p className="mt-1 text-text-muted">{homepageConfig.title}</p>
        </header>
        <Grid />
      </div>
    </div>
  )
}
