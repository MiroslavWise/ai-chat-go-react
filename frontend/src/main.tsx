import { createRoot } from 'react-dom/client'

import App from '~/App.tsx'
import ProviderAuth from '~/provider/provider-auth'
import ProviderNuqs from '~/provider/provider-nuqs'

import '~/index.css'

createRoot(document.getElementById('root')!).render(
  <ProviderNuqs>
    <ProviderAuth>
      <App />
    </ProviderAuth>
  </ProviderNuqs>,
)
