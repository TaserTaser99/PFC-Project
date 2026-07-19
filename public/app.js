const degreeRequirements = ["c2", "c5", "c1", "c3", "c4", "c6"]

const SESSION_USER_KEY = 'pfcUserId'
const MAX_PLANNED_COURSES_PER_TERM = 4

function getStoredUserId() {
  try {
    return window.localStorage.getItem(SESSION_USER_KEY) ?? ''
  } catch {
    return ''
  }
}

function setStoredUserId(userId) {
  try {
    window.localStorage.setItem(SESSION_USER_KEY, userId)
  } catch {
    // Ignore storage quota/private mode failures in local prototype mode.
  }
}

function clearStoredUserId() {
  try {
    window.localStorage.removeItem(SESSION_USER_KEY)
  } catch {
    // Ignore storage quota/private mode failures in local prototype mode.
  }
}

function getDegreePlanForUser(user) {
  const degree = user?.degree?.trim().toLowerCase() ?? ''
  return state.degreePlans.find(
    (plan) =>
      plan.id === user?.degree ||
      plan.label === user?.degree ||
      (degree && degree.includes(plan.label.toLowerCase()))
  )
}

function getUserDegreeRequirementItems(user) {
  const degreePlan = getDegreePlanForUser(user)

  if (!degreePlan) {
    const requirementIds = user?.degreeCourseIds?.length
      ? user.degreeCourseIds
      : degreeRequirements
    return requirementIds.map((id) => ({ ids: [id] }))
  }

  const courseByCode = new Map(state.courses.map((course) => [course.code, course]))
  const requiredItems = (degreePlan.requiredCourses ?? [])
    .map((code) => courseByCode.get(code))
    .filter(Boolean)
    .map((course) => ({ ids: [course.id] }))
  const chooseOneItems = (degreePlan.chooseOne ?? [])
    .map((group) => group.map((code) => courseByCode.get(code)).filter(Boolean))
    .filter((courses) => courses.length > 0)
    .map((courses) => ({
      ids: courses.map((course) => course.id),
      label: courses.map((course) => course.code).join(' or ')
    }))

  return [...requiredItems, ...chooseOneItems]
}

function getUserDegreeLabel(user) {
  return user?.degree?.trim() || 'Degree'
}

function redirectToLogin() {
  window.location.href = '/login.html'
}

const state = {
  courses: [],
  users: [],
  degreePlans: [],
  currentUserId: getStoredUserId(),
  selectedTerm: "1",
  activeTab: "search",
  friendSearchResults: [],
  friendData: { friends: [], incoming: [], outgoing: [], friendIds: [] },
  serviceError: "",
  friendActionPending: false,
  heatmapRequestId: 0,
  heatmapPlannedCourseIds: [],
  courseActionPending: false
}

let friendSearchTimer
let friendSearchRequestId = 0

const els = {
  tabs: document.querySelectorAll(".tab"),
  panels: {
    search: document.getElementById("tab-search"),
    heatmap: document.getElementById("tab-heatmap"),
    progression: document.getElementById("tab-progression")
  },
  serviceError: document.getElementById("service-error"),
  friendSearch: document.getElementById("friend-search"),
  friendSearchBtn: document.getElementById("friend-search-btn"),
  friendSearchMeta: document.getElementById("friend-search-meta"),
  friendSearchResults: document.getElementById("friend-search-results"),
  incomingRequests: document.getElementById("incoming-requests"),
  outgoingRequests: document.getElementById("outgoing-requests"),
  friendsList: document.getElementById("friends-list"),
  courseSearch: document.getElementById("course-search"),
  searchMeta: document.getElementById("search-meta"),
  searchResults: document.getElementById("search-results"),
  recommendUser: document.getElementById("recommend-user"),
  recommendations: document.getElementById("recommendations"),
  topbarDegreeSelect: document.getElementById("topbar-degree-select"),
  logoutBtn: document.getElementById('logout-btn'),
  termSelect: document.getElementById("term-select"),
  heatmapGrid: document.getElementById("heatmap-grid"),
  progressText: document.getElementById("progress-text"),
  progressCount: document.getElementById("progress-count"),
  progressFill: document.getElementById("progress-fill"),
  degreeGrid: document.getElementById("degree-grid"),
  planTimeline: document.getElementById("plan-timeline")
}

init()

async function init() {
  if (!state.currentUserId) {
    redirectToLogin()
    return
  }

  const data = await loadData()
  state.courses = data.courses
  state.users = data.users
  state.degreePlans = data.degreePlans ?? []
  state.friendData = data.friendData ?? { friends: [], incoming: [], outgoing: [], friendIds: [] }
  state.serviceError = data.error || ''

  if (!state.users.find((u) => u.id === state.currentUserId)) {
    clearStoredUserId()
    redirectToLogin()
    return
  }

  bindEvents()
  populateUserSelects()
  renderAll()
}

async function loadData() {
  const emptyFriendData = { friends: [], incoming: [], outgoing: [], friendIds: [] }

  try {
    const [meRes, coursesRes, degreePlansRes] = await Promise.all([
      fetch('/api/me', { headers: authHeaders() }),
      fetch('/api/me/courses', { headers: authHeaders() }),
      fetch('/api/degree-plans')
    ])

    if (meRes.status === 401 || meRes.status === 403) {
      clearStoredUserId()
      redirectToLogin()
      return {
        courses: [],
        users: [],
        degreePlans: [],
        friendData: emptyFriendData,
        error: ''
      }
    }

    if (!meRes.ok || !coursesRes.ok || !degreePlansRes.ok) {
      throw new Error('Unable to load profile, courses, or degree plans.')
    }

    const [me, courses, degreePlans] = await Promise.all([
      meRes.json(),
      coursesRes.json(),
      degreePlansRes.json()
    ])

    if (!state.currentUserId) {
      return { courses, users: [], degreePlans, friendData: emptyFriendData, error: 'No user session found.' }
    }

    try {
      const friendsRes = await fetch('/api/friends', { headers: authHeaders() })
      if (!friendsRes.ok) {
        throw new Error('Friend service unavailable. Please log in again.')
      }

      const friendData = await friendsRes.json()

      return {
        courses,
        users: buildKnownUsers(me, friendData),
        degreePlans,
        friendData,
        error: ''
      }
    } catch (error) {
      return {
        courses,
        users: [me],
        degreePlans,
        friendData: emptyFriendData,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  } catch (error) {
    return {
      courses: [],
      users: [],
      degreePlans: [],
      friendData: emptyFriendData,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

function buildKnownUsers(me, friendData) {
  const byId = new Map()

  if (me?.id) {
    byId.set(me.id, me)
  }

  for (const friend of friendData.friends ?? []) {
    byId.set(friend.id, { ...byId.get(friend.id), ...friend })
  }

  return [...byId.values()]
}

function authHeaders(extraHeaders = {}) {
  return { ...extraHeaders, 'x-user-id': state.currentUserId }
}

async function refreshFriendData() {
  if (!state.currentUserId) {
    state.friendData = { friends: [], incoming: [], outgoing: [], friendIds: [] }
    return
  }

  try {
    const res = await fetch('/api/friends', { headers: authHeaders() })
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      throw new Error(friendlyError(payload?.error, 'Failed to load friend data.'))
    }
    state.friendData = await res.json()
    const me = state.users.find((user) => user.id === state.currentUserId)
    if (me) {
      state.users = buildKnownUsers(me, state.friendData)
    }
    state.serviceError = ''
  } catch (error) {
    state.friendData = { friends: [], incoming: [], outgoing: [], friendIds: [] }
    state.serviceError = error instanceof Error ? error.message : 'Friend service unavailable.'
  }
}

async function performFriendAction(url, options = {}) {
  if (state.friendActionPending) return
  state.friendActionPending = true
  renderSidebar()

  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      throw new Error(friendlyError(payload?.error, 'Friend action failed.'))
    }
    await refreshFriendData()
  } catch (error) {
    state.serviceError = error instanceof Error ? error.message : String(error)
  } finally {
    state.friendActionPending = false
    renderAll()
  }
}

async function applyDegreePlanSelection(degreePlanId) {
  const planId = degreePlanId.trim()
  if (!planId || !state.currentUserId) {
    return
  }

  try {
    const response = await fetch(`/api/users/${encodeURIComponent(state.currentUserId)}/degree`, {
      method: 'PATCH',
      headers: authHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify({ degreePlanId: planId })
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(friendlyError(payload?.error, 'Unable to update degree.'))
    }

    const updatedUser = await response.json()
    state.users = state.users.map((user) =>
      user.id === updatedUser.id ? { ...user, ...updatedUser } : user
    )
    state.serviceError = ''
  } catch (error) {
    state.serviceError = error instanceof Error ? error.message : 'Unable to update degree.'
  } finally {
    renderAll()
  }
}

function sendFriendRequest(targetId) {
  return performFriendAction('/api/friends/requests', {
    method: 'POST',
    headers: authHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ targetId })
  })
}

function acceptFriendRequest(requestId) {
  return performFriendAction(`/api/friends/requests/${encodeURIComponent(requestId)}/accept`, {
    method: 'POST',
    headers: authHeaders()
  })
}

function declineFriendRequest(requestId) {
  return performFriendAction(`/api/friends/requests/${encodeURIComponent(requestId)}/decline`, {
    method: 'POST',
    headers: authHeaders()
  })
}

function cancelFriendRequest(requestId) {
  return performFriendAction(`/api/friends/requests/${encodeURIComponent(requestId)}/cancel`, {
    method: 'POST',
    headers: authHeaders()
  })
}

function removeFriend(otherId) {
  return performFriendAction(`/api/friends/${encodeURIComponent(otherId)}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
}

async function searchStudents() {
  const query = els.friendSearch.value.trim()
  const requestId = ++friendSearchRequestId
  state.serviceError = ''

  if (query.length < 2) {
    state.friendSearchResults = []
    els.friendSearchMeta.textContent = query
      ? 'Enter at least two characters.'
      : 'Type a name to search.'
    renderSidebar()
    return
  }

  els.friendSearchMeta.textContent = 'Searching...'
  renderSidebar()

  try {
    const response = await fetch(
      `/api/users/search?q=${encodeURIComponent(query)}`,
      { headers: authHeaders() }
    )

    if (requestId !== friendSearchRequestId) return

    if (response.status === 401) {
      clearStoredUserId()
      redirectToLogin()
      return
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(
        payload?.message ||
          friendlyError(payload?.error, 'Unable to search users.')
      )
    }

    const results = await response.json()
    if (requestId !== friendSearchRequestId) return

    state.friendSearchResults = Array.isArray(results) ? results : []
    els.friendSearchMeta.textContent =
      `${state.friendSearchResults.length} result` +
      `${state.friendSearchResults.length === 1 ? '' : 's'}`
    renderSidebar()
  } catch (error) {
    if (requestId !== friendSearchRequestId) return

    state.friendSearchResults = []
    els.friendSearchMeta.textContent =
      error instanceof Error ? error.message : 'Unable to search users.'
    renderSidebar()
  }
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeTab = tab.dataset.tab
      renderTabs()
    })
  })

  els.friendSearchBtn.addEventListener("click", () => {
    clearTimeout(friendSearchTimer)
    void searchStudents()
  })

  els.friendSearch.addEventListener('input', () => {
    clearTimeout(friendSearchTimer)
    friendSearchTimer = setTimeout(() => {
      void searchStudents()
    }, 250)
  })

  els.friendSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      clearTimeout(friendSearchTimer)
      void searchStudents()
    }
  })

  function handleFriendAction(event) {
    const button = event.target.closest('button[data-action]')
    if (!button) return
    const action = button.dataset.action
    const id = button.dataset.id
    if (!action || !id) return

    event.preventDefault()
    if (action === 'send-request') return sendFriendRequest(id)
    if (action === 'accept-request') return acceptFriendRequest(id)
    if (action === 'decline-request') return declineFriendRequest(id)
    if (action === 'cancel-request') return cancelFriendRequest(id)
    if (action === 'remove-friend') return removeFriend(id)
  }

  els.friendSearchResults.addEventListener('click', handleFriendAction)
  els.incomingRequests.addEventListener('click', handleFriendAction)
  els.outgoingRequests.addEventListener('click', handleFriendAction)
  els.friendsList.addEventListener('click', handleFriendAction)

  els.courseSearch.addEventListener("input", renderSearch)
  els.searchResults.addEventListener('click', handleCourseCardClick)
  els.heatmapGrid.addEventListener('click', handleHeatmapCellClick)

  els.recommendUser.addEventListener("change", async () => {
    state.currentUserId = els.recommendUser.value
    setStoredUserId(state.currentUserId)
    if (els.topbarDegreeSelect) {
      els.topbarDegreeSelect.value = getCurrentUserDegreePlanId()
    }
    state.friendSearchResults = []
    await refreshFriendData()
    renderAll()
  })

  els.termSelect.addEventListener("change", () => {
    state.selectedTerm = els.termSelect.value
    void renderHeatmap()
  })

  els.topbarDegreeSelect?.addEventListener('change', async () => {
    await applyDegreePlanSelection(els.topbarDegreeSelect.value)
  })

  els.logoutBtn.addEventListener('click', () => {
    clearStoredUserId()
    redirectToLogin()
  })
}

function populateUserSelects() {
  const options = state.users
    .map((u) => `<option value="${u.id}">${escapeHTML(u.name)}</option>`)
    .join("")

  els.recommendUser.innerHTML = options
  els.recommendUser.value = state.currentUserId
}

function getCurrentUserDegreePlanId() {
  const me = getCurrentUser()
  if (!me) return ''
  return getDegreePlanForUser(me)?.id ?? ''
}

function populateDegreePlanSelect() {
  if (!els.topbarDegreeSelect) return

  const options = [
    '<option value="">Choose degree</option>',
    ...state.degreePlans.map(
      (plan) => `<option value="${escapeHTML(plan.id)}">${escapeHTML(plan.label)}</option>`
    )
  ]
  els.topbarDegreeSelect.innerHTML = options.join('')
  els.topbarDegreeSelect.value = getCurrentUserDegreePlanId()
}

function renderAll() {
  populateDegreePlanSelect()
  renderTabs()
  renderSidebar()
  renderSearch()
  void renderHeatmap()
  renderProgression()
}

function renderTabs() {
  els.tabs.forEach((t) => {
    const isActive = t.dataset.tab === state.activeTab
    t.classList.toggle("active", isActive)
    t.setAttribute('aria-selected', String(isActive))
  })

  Object.entries(els.panels).forEach(([key, panel]) => {
    panel.classList.toggle("active", key === state.activeTab)
  })
}

function renderSidebar() {
  const me = getCurrentUser()
  const friendIds = state.friendData.friendIds ?? []
  const friends = state.users.filter((u) => friendIds.includes(u.id))
  const incoming = state.friendData.incoming ?? []
  const outgoing = state.friendData.outgoing ?? []
  const searchResults = state.friendSearchResults

  els.serviceError.classList.toggle('hidden', !state.serviceError)
  els.serviceError.textContent = state.serviceError || ''
  els.friendSearchBtn.disabled = state.friendActionPending

  els.friendsList.innerHTML = friends.length
    ? friends
        .map(
          (f) => `
            <div class="friend-item">
              <strong>${escapeHTML(f.name)}</strong>
              <button class="danger-button" data-action="remove-friend" data-id="${escapeHTML(f.id)}" ${state.friendActionPending ? "disabled" : ""}>Remove</button>
            </div>
          `
        )
        .join("")
    : `<div class="friend-item">No friends yet.</div>`

  els.incomingRequests.innerHTML = incoming.length
    ? incoming
        .map((req) => {
          return `
            <div class="friend-request-item">
              <strong>${escapeHTML(req.senderName || req.senderId)}</strong>
              <div class="course-meta">Incoming request</div>
              <div class="item-actions">
                <button class="primary small-button" data-action="accept-request" data-id="${escapeHTML(req.id)}" ${state.friendActionPending ? "disabled" : ""}>Accept</button>
                <button class="secondary-button small-button" data-action="decline-request" data-id="${escapeHTML(req.id)}" ${state.friendActionPending ? "disabled" : ""}>Decline</button>
              </div>
            </div>
          `
        })
        .join("")
    : `<div class="friend-item">No incoming requests.</div>`

  els.outgoingRequests.innerHTML = outgoing.length
    ? outgoing
        .map((req) => {
          return `
            <div class="friend-request-item">
              <strong>${escapeHTML(req.recipientName || req.recipientId)}</strong>
              <div class="course-meta">Pending request</div>
              <button class="secondary-button small-button" data-action="cancel-request" data-id="${escapeHTML(req.id)}" ${state.friendActionPending ? "disabled" : ""}>Cancel</button>
            </div>
          `
        })
        .join("")
    : `<div class="friend-item">No outgoing requests.</div>`

  els.friendSearchResults.innerHTML = searchResults.length
    ? searchResults
        .map((u) => {
          const isSelf = u.id === me?.id
          const alreadyFriend = state.friendData.friendIds.includes(u.id)
          const hasIncoming = incoming.some((req) => req.senderId === u.id)
          const hasOutgoing = outgoing.some((req) => req.recipientId === u.id)
          let actionButton = ''

          if (isSelf) {
            actionButton = '<span class="course-meta">This is you</span>'
          } else if (alreadyFriend) {
            actionButton = '<span class="course-meta">Already friends</span>'
          } else if (hasOutgoing) {
            actionButton = '<span class="course-meta">Request sent</span>'
          } else if (hasIncoming) {
            actionButton = '<span class="course-meta">Request received</span>'
          } else {
            actionButton = `<button class="primary small-button" data-action="send-request" data-id="${escapeHTML(u.id)}" ${state.friendActionPending ? "disabled" : ""}>Send request</button>`
          }

          return `
            <div class="user-item">
              <strong>${escapeHTML(u.name)}</strong>
              ${actionButton}
            </div>
          `
        })
        .join("")
    : `<div class="friend-item">Search existing students to add as friends.</div>`
}

function renderSearch() {
  const q = els.courseSearch.value.trim().toLowerCase()
  const results = state.courses.filter((c) => {
    if (!q) {
      return true
    }
    return c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
  })

  els.searchMeta.textContent = `${results.length} course${results.length === 1 ? "" : "s"} found`

  els.searchResults.innerHTML = results.length
    ? results.map((course) => {
      const friendsDoing = getFriendsDoingCourse(course.id)
      const isCompleted = Boolean(course.completed)
      return `
        <article class="course-card clickable ${isCompleted ? 'completed' : ''}" data-course-id="${escapeHTML(course.id)}" role="button" tabindex="0" aria-pressed="${isCompleted}">
          <h4>${escapeHTML(course.code)} - ${escapeHTML(course.title)}</h4>
          <div class="course-meta">Terms ${course.terms.join(', ')} | Workload ${course.workload}/10 | Popularity ${course.popularity}</div>
          <div class="course-meta">${isCompleted ? 'Completed — click to unmark' : 'Click to mark as completed'}</div>
          <div class="course-meta">Friends taking this: ${friendsDoing.length}</div>
          <div class="friend-pills">
            ${
              friendsDoing.length
                ? friendsDoing.map((name) => `<span class="pill">${escapeHTML(name)}</span>`).join("")
                : "<span class=\"course-meta\">No friends in this one yet.</span>"
            }
          </div>
        </article>
      `
    })
    .join("")
    : `<div class="course-card">No matching courses found.</div>`

  const recs = recommendCourses(state.currentUserId)
  els.recommendations.innerHTML = recs.length
    ? recs.map(
      (r) => `
        <article class="course-card">
          <h4>${escapeHTML(r.course.code)} - ${escapeHTML(r.course.title)}</h4>
          <div class="course-meta">Recommendation score: ${r.score.toFixed(1)}</div>
          <div class="course-meta">${r.friendCount} friend(s) are taking this course.</div>
        </article>
      `
    )
    .join("")
    : `<div class="course-card">No recommendations available yet.</div>`
}

function recommendCourses(userId) {
  const me = state.users.find((u) => u.id === userId)
  if (!me) {
    return []
  }

  return state.courses
    .filter((course) => !(me.completedCourseIds ?? []).includes(course.id))
    .map((course) => {
      const friendCount = getFriendsDoingCourse(course.id).length
      const score = friendCount * 2 + course.popularity / 100 + (10 - course.workload)
      return { course, score, friendCount }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
}

async function renderHeatmap() {
  if (!state.currentUserId) {
    els.heatmapGrid.innerHTML = `<div class="course-card">No user selected for heatmap.</div>`
    return
  }

  const requestId = ++state.heatmapRequestId
  const term = state.selectedTerm

  els.heatmapGrid.innerHTML = `<div class="course-card">Loading heatmap...</div>`

  try {
    const response = await fetch(
      `/api/me/heatmap?term=${encodeURIComponent(term)}`,
      { headers: authHeaders() }
    )

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(friendlyError(payload?.error, 'Failed to load heatmap data.'))
    }

    const payload = await response.json()
    if (requestId !== state.heatmapRequestId) {
      return
    }

    const rows = Array.isArray(payload.courses) ? payload.courses : []
    const plannedCourseIds = new Set(payload.plannedCourseIds ?? [])
    state.heatmapPlannedCourseIds = [...plannedCourseIds]

    els.heatmapGrid.innerHTML = rows.length
      ? rows
          .map((row) => {
            const course = row.course ?? {}
            const friendCount = Number(row.friendCount ?? 0)
            const importance = Number(row.importanceScore ?? 0)
            const isPlanned = plannedCourseIds.has(course.id)
            const color = isPlanned ? 'hsl(210 75% 42%)' : String(row.color ?? 'hsl(120 75% 42%)')
            return `
              <div class="heat-cell ${isPlanned ? 'planned-by-me' : ''}" data-course-id="${escapeHTML(course.id)}" style="background:${color}" role="button" tabindex="0" aria-pressed="${isPlanned}">
                <div>
                  <strong>${escapeHTML(course.code)}</strong>
                  <div>${escapeHTML(course.title)}</div>
                  <div class="course-meta">${isPlanned ? 'In your plan' : 'Click to add to plan'} · Importance ${importance.toFixed(1)}</div>
                </div>
                <div>${friendCount} friend${friendCount === 1 ? "" : "s"}</div>
              </div>
            `
          })
          .join("")
      : `<div class="course-card">No courses are available for this term.</div>`
  } catch (error) {
    if (requestId !== state.heatmapRequestId) {
      return
    }
    const message = error instanceof Error ? error.message : 'Failed to load heatmap data.'
    els.heatmapGrid.innerHTML = `<div class="course-card">${escapeHTML(message)}</div>`
  }
}

function renderProgression() {
  const me = getCurrentUser()
  if (!me) {
    els.progressText.textContent = 'No student selected'
    els.progressCount.textContent = '0/0 complete'
    els.progressFill.style.width = '0%'
    els.degreeGrid.innerHTML = '<div class="degree-item">No degree data available.</div>'
    els.planTimeline.innerHTML = ''
    return
  }
  const completed = new Set(me.completedCourseIds ?? [])
  const requirements = getUserDegreeRequirementItems(me)
  const done = requirements.filter((requirement) =>
    requirement.ids.some((id) => completed.has(id))
  ).length
  const total = requirements.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  els.progressText.textContent = `${getUserDegreeLabel(me)} Progress`
  els.progressCount.textContent = `${done}/${total} complete`
  els.progressFill.style.width = `${pct}%`

  els.degreeGrid.innerHTML = requirements
    .map((requirement) => {
      const courses = requirement.ids
        .map((id) => state.courses.find((course) => course.id === id))
        .filter(Boolean)
      if (!courses.length) {
        return ""
      }
      const completedCourse = courses.find((course) => completed.has(course.id))
      const isDone = Boolean(completedCourse)
      const label =
        requirement.label ??
        `${courses[0].code} - ${courses[0].title}`
      const status = completedCourse
        ? `Completed with ${completedCourse.code}`
        : courses.length > 1
          ? 'Complete either course'
          : 'Pending'
      return `
        <div class="degree-item ${isDone ? "complete" : ""}">
          <strong>${escapeHTML(label)}</strong>
          <div class="course-meta">${escapeHTML(status)}</div>
        </div>
      `
    })
    .join("")

  const plan = me.plannedCourses ?? { "1": [], "2": [], "3": [] }
  els.planTimeline.innerHTML = ["1", "2", "3"]
    .map((term) => {
      const labels = (plan[term] ?? [])
        .map((courseId) => state.courses.find((c) => c.id === courseId))
        .filter(Boolean)
        .map((course) => course.code)
        .join(", ")
      return `
        <div class="timeline-item">
          <strong>Term ${term}</strong>
          <div class="course-meta">${labels || "No courses planned yet"}</div>
        </div>
      `
    })
    .join("")
}

function getFriendsDoingCourse(courseId) {
  const me = getCurrentUser()
  if (!me) return []
  const friendUsers = state.friendData.friends ?? []

  return friendUsers
    .filter((friend) => {
      const hasCompleted = (friend.completedCourseIds ?? []).includes(courseId)
      const hasPlanned = Object.values(friend.plannedCourses ?? {}).some((courses) =>
        courses.includes(courseId)
      )
      return hasCompleted || hasPlanned
    })
    .map((friend) => friend.name)
}

async function handleCourseCardClick(event) {
  const card = event.target.closest('[data-course-id]')
  if (!card || state.courseActionPending) return

  const courseId = card.dataset.courseId
  if (!courseId) return

  const course = state.courses.find((candidate) => candidate.id === courseId)
  if (!course) return

  const nextCompleted = !course.completed
  state.courseActionPending = true
  renderSearch()

  try {
    const response = await fetch(
      `/api/me/completed-courses/${encodeURIComponent(courseId)}`,
      {
        method: 'PATCH',
        headers: authHeaders({ 'content-type': 'application/json' }),
        body: JSON.stringify({ completed: nextCompleted })
      }
    )

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(friendlyError(payload?.error, 'Unable to update completed course.'))
    }

    const payload = await response.json()
    updateCurrentUserCourseState(payload)
    state.courses = state.courses.map((candidate) =>
      candidate.id === courseId
        ? { ...candidate, completed: nextCompleted }
        : candidate
    )
    state.serviceError = ''
  } catch (error) {
    state.serviceError = error instanceof Error ? error.message : 'Unable to update completed course.'
  } finally {
    state.courseActionPending = false
    renderAll()
  }
}

async function handleHeatmapCellClick(event) {
  const cell = event.target.closest('[data-course-id]')
  if (!cell || state.courseActionPending) return

  const courseId = cell.dataset.courseId
  if (!courseId) return

  const term = state.selectedTerm
  const isPlanned = state.heatmapPlannedCourseIds.includes(courseId)
  const nextPlanned = !isPlanned

  if (nextPlanned && state.heatmapPlannedCourseIds.length >= MAX_PLANNED_COURSES_PER_TERM) {
    state.serviceError = 'You can plan up to 4 courses per term.'
    renderSidebar()
    return
  }

  state.courseActionPending = true
  void renderHeatmap()

  try {
    const response = await fetch(
      `/api/me/planned-courses/${encodeURIComponent(term)}/${encodeURIComponent(courseId)}`,
      {
        method: 'PATCH',
        headers: authHeaders({ 'content-type': 'application/json' }),
        body: JSON.stringify({ planned: nextPlanned })
      }
    )

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(friendlyError(payload?.error, 'Unable to update planned course.'))
    }

    const payload = await response.json()
    updateCurrentUserPlannedCourses(term, payload.plannedCourseIds ?? [])
    state.serviceError = ''
  } catch (error) {
    state.serviceError = error instanceof Error ? error.message : 'Unable to update planned course.'
  } finally {
    state.courseActionPending = false
    renderAll()
  }
}

function updateCurrentUserCourseState(payload) {
  state.users = state.users.map((user) =>
    user.id === state.currentUserId
      ? {
          ...user,
          completedCourseIds: payload.completedCourseIds ?? user.completedCourseIds ?? [],
          plannedCourses: payload.plannedCourses ?? user.plannedCourses ?? {}
        }
      : user
  )
}

function updateCurrentUserPlannedCourses(term, plannedCourseIds) {
  state.heatmapPlannedCourseIds = plannedCourseIds
  state.users = state.users.map((user) =>
    user.id === state.currentUserId
      ? {
          ...user,
          plannedCourses: {
            ...(user.plannedCourses ?? {}),
            [term]: plannedCourseIds
          }
        }
      : user
  )
}

function getCurrentUser() {
  const user = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]
  return user ? { ...user, friendIds: state.friendData.friendIds ?? [] } : null
}

function friendlyError(code, fallback) {
  const messages = {
    already_friends: 'You are already friends.',
    cannot_friend_self: 'You cannot send a friend request to yourself.',
    invalid_user: 'Please select a valid user before loading the heatmap.',
    plan_limit_exceeded: 'You can plan up to 4 courses per term.',
    course_not_offered_in_term: 'That course is not offered in the selected term.',
    invalid_state: 'That request has already been handled.',
    not_authorised: 'You are not allowed to perform that action.',
    not_friends: 'That friendship no longer exists.',
    request_not_found: 'That friend request no longer exists.',
    unknown_user: 'The selected demonstration user no longer exists.',
    user_not_found: 'That user could not be found.'
  }
  return messages[code] ?? fallback
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
