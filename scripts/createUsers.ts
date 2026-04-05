import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

type SeedUser = {
  email: string
  password: string
  email_confirm?: boolean
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

// 1) Rellena esta lista con los usuarios que necesites crear.
//    Ejemplo:
//    {
//      email: 'admin@example.com',
//      password: 'SuperSecret123',
//      email_confirm: true,
//      user_metadata: { role: 'admin' }
//    }
const USERS: SeedUser[] = [
  {
    email: 'admin@cnci.com',
    password: 'Admin.cnci.26',
    email_confirm: true,
    user_metadata: { role: 'admin' }
  }
]

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan variables de entorno SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (USERS.length === 0) {
  console.error('Agrega al menos un usuario en el arreglo USERS antes de ejecutar el script.')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function createUsers() {
  for (const user of USERS) {
    const email = user.email.trim().toLowerCase()

    const exists = await userExists(email)
    if (exists) {
      console.log(`Skip (exists): ${email}`)
      continue
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: user.password,
      email_confirm: user.email_confirm ?? false,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    })

    if (error) {
      throw error
    }

    console.log(`Created: ${email} -> ${data.user.id}`)
  }
}

async function userExists(email: string): Promise<boolean> {
  const perPage = 200
  let page = 1

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const found = data?.users?.some((u) => u.email?.toLowerCase() === email)
    if (found) return true

    if (!data || data.users.length < perPage) return false
    page += 1
  }
}

createUsers().catch((err) => {
  console.error(err)
  process.exit(1)
})
