const SESSION_USER_KEY = 'pfcUserId'

const mode = document.body.dataset.authMode
const errorEl = document.getElementById('auth-error')

const loginForm = document.getElementById('login-form')
const signupForm = document.getElementById('signup-form')

const messages = {
  email_in_use: 'That email address is already registered.',
  invalid_credentials: 'Incorrect email or password.',
  invalid_degree: 'Please choose a valid degree.',
  invalid_email: 'Please enter a valid email address.',
  invalid_name: 'Please enter your full name.',
  invalid_password: 'Password must be at least 8 characters.',
  user_not_found: 'The account could not be found.'
}

function setSessionUser(userId) {
  window.localStorage.setItem(SESSION_USER_KEY, userId)
}

function showError(message) {
  errorEl.textContent = message
  errorEl.classList.remove('hidden')
}

function clearError() {
  errorEl.textContent = ''
  errorEl.classList.add('hidden')
}

function friendlyError(code, fallback) {
  return messages[code] ?? fallback
}

async function parseOrNull(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

let degreePlans = []

async function initSignupForm() {
  const planSelect = document.getElementById('signup-degree-plan')

  try {
    const plansRes = await fetch('/api/degree-plans')
    if (!plansRes.ok) {
      throw new Error('Unable to load degree options.')
    }

    degreePlans = await plansRes.json()

    const planOptions = degreePlans
      .map((plan) => `<option value="${escapeHTML(plan.id)}">${escapeHTML(plan.label)}</option>`)
      .join('')

    planSelect.innerHTML = `
      <option value="">Choose your degree</option>
      ${planOptions}
    `
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Unable to load degree options.')
  }
}

if (mode === 'login' && loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    clearError()

    const submitButton = document.getElementById('login-submit')
    submitButton.disabled = true

    try {
      const payload = {
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const body = await parseOrNull(response)
      if (!response.ok) {
        throw new Error(friendlyError(body?.error, 'Login failed.'))
      }

      if (!body?.user?.id) {
        throw new Error('Login failed.')
      }

      setSessionUser(body.user.id)
      window.location.href = '/'
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Login failed.')
    } finally {
      submitButton.disabled = false
    }
  })
}

if (mode === 'signup' && signupForm) {
  void initSignupForm()

  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    clearError()

    const submitButton = document.getElementById('signup-submit')
    submitButton.disabled = true

    try {
      const password = document.getElementById('signup-password').value
      const confirmPassword = document.getElementById('signup-password-confirm').value
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.')
      }

      const planSelect = document.getElementById('signup-degree-plan')
      if (!planSelect.value) {
        throw new Error('Choose your degree.')
      }

      const payload = {
        name: document.getElementById('signup-name').value.trim(),
        email: document.getElementById('signup-email').value.trim(),
        password,
        degree: planSelect.value
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const body = await parseOrNull(response)
      if (!response.ok) {
        throw new Error(friendlyError(body?.error, 'Signup failed.'))
      }

      if (!body?.user?.id) {
        throw new Error('Signup failed.')
      }

      setSessionUser(body.user.id)
      window.location.href = '/'
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Signup failed.')
    } finally {
      submitButton.disabled = false
    }
  })
}
