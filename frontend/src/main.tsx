import { createRoot } from 'react-dom/client'

import App from '~/App.tsx'
import ProviderAuth from '~/provider/provider-auth'
import ProviderNuqs from '~/provider/provider-nuqs'
import ProviderQuery from '~/provider/provider-query'

createRoot(document.getElementById('root')!).render(
  <ProviderQuery>
    <ProviderNuqs>
      <ProviderAuth>
        <App />
      </ProviderAuth>
    </ProviderNuqs>
  </ProviderQuery>
)
