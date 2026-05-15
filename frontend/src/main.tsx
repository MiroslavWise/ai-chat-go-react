import { createRoot } from 'react-dom/client'
import { NuqsAdapter } from 'nuqs/adapters/react'

import '~/index.css'
import App from '~/App.tsx'

createRoot(document.getElementById('root')!).render(
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
)
