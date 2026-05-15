import type { PropsWithChildren } from 'react'
import { NuqsAdapter } from 'nuqs/adapters/react'

export default function ProviderNuqs({ children }: PropsWithChildren) {
  return <NuqsAdapter>{children}</NuqsAdapter>
}
