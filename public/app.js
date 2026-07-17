const plannedCoursesByUser = {
  u1: { "1": ["c2", "c5"], "2": ["c1", "c3"], "3": ["c4", "c6"] },
  u2: { "1": ["c2"], "2": ["c3"], "3": ["c6"] },
  u3: { "1": ["c5"], "2": ["c1", "c3"], "3": ["c4"] },
  u4: { "1": ["c2"], "2": ["c1"], "3": ["c4", "c6"] }
}

const degreeRequirements = ["c2", "c5", "c1", "c3", "c4", "c6"]

const state = {
  courses: [],
  users: [],
  currentUserId: "u1",
  selectedTerm: "1",
  activeTab: "search",
  friendSearchResults: [],
  friendData: { friends: [], incoming: [], outgoing: [], friendIds: [] },
  serviceError: "",
  friendActionPending: false
}

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
  userDatabase: document.getElementById("user-database"),
  courseSearch: document.getElementById("course-search"),
  searchMeta: document.getElementById("search-meta"),
  searchResults: document.getElementById("search-results"),
  recommendUser: document.getElementById("recommend-user"),
  recommendations: document.getElementById("recommendations"),
  termSelect: document.getElementById("term-select"),
  heatmapGrid: document.getElementById("heatmap-grid"),
  progressUser: document.getElementById("progress-user"),
  progressText: document.getElementById("progress-text"),
  progressCount: document.getElementById("progress-count"),
  progressFill: document.getElementById("progress-fill"),
  degreeGrid: document.getElementById("degree-grid"),
  planTimeline: document.getElementById("plan-timeline")
}

init()

async function init() {
  const data = await loadData()
  state.courses = data.courses
  state.users = data.users
  state.friendData = data.friendData ?? { friends: [], incoming: [], outgoing: [], friendIds: [] }
  state.serviceError = data.error || ''

  if (!state.users.find((u) => u.id === state.currentUserId) && state.users.length > 0) {
    state.currentUserId = state.users[0].id
  }

  bindEvents()
  populateUserSelects()
  renderAll()
}

async function loadData() {
  const emptyFriendData = { friends: [], incoming: [], outgoing: [], friendIds: [] }

  try {
    const [coursesRes, usersRes] = await Promise.all([
      fetch('/api/courses'),
      fetch('/api/users')
    ])
    if (!coursesRes.ok || !usersRes.ok) throw new Error('Unable to load courses or users.')

    const [courses, users] = await Promise.all([coursesRes.json(), usersRes.json()])
    if (!users.some((user) => user.id === state.currentUserId)) {
      state.currentUserId = users[0]?.id ?? ''
    }

    if (!state.currentUserId) {
      return { courses, users, friendData: emptyFriendData, error: 'No users are available. Run npm run seed.' }
    }

    try {
      const friendsRes = await fetch('/api/friends', {
        headers: authHeaders()
      })
      if (!friendsRes.ok) throw new Error('Friend service unavailable. Check that DEV_AUTH=true.')
      return { courses, users, friendData: await friendsRes.json() }
    } catch (error) {
      return {
        courses,
        users,
        friendData: emptyFriendData,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  } catch (error) {
    return {
      courses: [],
      users: [],
      friendData: emptyFriendData,
      error: error instanceof Error ? error.message : String(error)
    }
  }
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

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeTab = tab.dataset.tab
      renderTabs()
    })
  })

  els.friendSearchBtn.addEventListener("click", async () => {
    const query = els.friendSearch.value.trim()
    if (query.length < 2) {
      state.friendSearchResults = []
      state.friendSearchMeta.textContent = 'Enter at least two characters.'
      renderSidebar()
      return
    }

    try {
      const resultsRes = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (!resultsRes.ok) throw new Error('Search request failed')
      state.friendSearchResults = await resultsRes.json()
      state.serviceError = ''
      state.friendSearchMeta.textContent = `${state.friendSearchResults.length} result${state.friendSearchResults.length === 1 ? '' : 's'}`
      renderSidebar()
    } catch (err) {
      console.error(err)
      state.serviceError = 'Unable to search users. Please try again.'
      renderSidebar()
    }
  })

  els.friendSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      els.friendSearchBtn.click()
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

  els.recommendUser.addEventListener("change", async () => {
    state.currentUserId = els.recommendUser.value
    els.progressUser.value = state.currentUserId
    state.friendSearchResults = []
    await refreshFriendData()
    renderAll()
  })

  els.termSelect.addEventListener("change", () => {
    state.selectedTerm = els.termSelect.value
    renderHeatmap()
  })

  els.progressUser.addEventListener("change", async () => {
    state.currentUserId = els.progressUser.value
    els.recommendUser.value = state.currentUserId
    state.friendSearchResults = []
    await refreshFriendData()
    renderAll()
  })
}

function populateUserSelects() {
  const options = state.users
    .map((u) => `<option value="${u.id}">${escapeHTML(u.name)}</option>`)
    .join("")

  els.recommendUser.innerHTML = options
  els.progressUser.innerHTML = options
  els.recommendUser.value = state.currentUserId
  els.progressUser.value = state.currentUserId
}

function renderAll() {
  renderTabs()
  renderSidebar()
  renderSearch()
  renderHeatmap()
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
              <div class="course-meta">Workload target: ${f.preferredWorkload} hrs/wk</div>
              <button class="danger-button" data-action="remove-friend" data-id="${escapeHTML(f.id)}" ${state.friendActionPending ? "disabled" : ""}>Remove</button>
            </div>
          `
        )
        .join("")
    : `<div class="friend-item">No friends yet.</div>`

  els.incomingRequests.innerHTML = incoming.length
    ? incoming
        .map((req) => {
          const sender = state.users.find((u) => u.id === req.senderId)
          return `
            <div class="friend-request-item">
              <strong>${escapeHTML(sender?.name || req.senderId)}</strong>
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
          const recipient = state.users.find((u) => u.id === req.recipientId)
          return `
            <div class="friend-request-item">
              <strong>${escapeHTML(recipient?.name || req.recipientId)}</strong>
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

  els.userDatabase.innerHTML = state.users.length
    ? state.users.map(
      (u) => `
        <div class="user-item">
          <strong>${escapeHTML(u.name)}</strong>
        </div>
      `
    )
    .join("")
    : `<div class="friend-item">No users available.</div>`
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
      return `
        <article class="course-card">
          <h4>${escapeHTML(course.code)} - ${escapeHTML(course.title)}</h4>
          <div class="course-meta">Term ${course.term} | Workload ${course.workload}/10 | Popularity ${course.popularity}</div>
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

function renderHeatmap() {
  const term = state.selectedTerm
  const coursesInTerm = state.courses.filter((c) => c.term === term)

  const counts = coursesInTerm.map((c) => {
    const count = getFriendsDoingCourse(c.id).length
    return { course: c, count }
  })

  const max = Math.max(...counts.map((c) => c.count), 1)

  els.heatmapGrid.innerHTML = counts.length
    ? counts.map(({ course, count }) => {
      const intensity = 0.2 + count / max
      const color = `rgba(14, 124, 97, ${Math.min(0.95, intensity).toFixed(2)})`
      return `
        <div class="heat-cell" style="background:${color}">
          <div>
            <strong>${escapeHTML(course.code)}</strong>
            <div>${escapeHTML(course.title)}</div>
          </div>
          <div>${count} friend${count === 1 ? "" : "s"}</div>
        </div>
      `
    })
    .join("")
    : `<div class="course-card">No courses are available for this term.</div>`
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
  const done = degreeRequirements.filter((id) => completed.has(id)).length
  const total = degreeRequirements.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  els.progressText.textContent = `${me.name}'s Degree Progress`
  els.progressCount.textContent = `${done}/${total} complete`
  els.progressFill.style.width = `${pct}%`

  els.degreeGrid.innerHTML = degreeRequirements
    .map((reqId) => {
      const course = state.courses.find((c) => c.id === reqId)
      if (!course) {
        return ""
      }
      const isDone = completed.has(reqId)
      return `
        <div class="degree-item ${isDone ? "complete" : ""}">
          <strong>${escapeHTML(course.code)} - ${escapeHTML(course.title)}</strong>
          <div class="course-meta">${isDone ? "Completed" : "Pending"}</div>
        </div>
      `
    })
    .join("")

  const plan = plannedCoursesByUser[me.id] ?? { "1": [], "2": [], "3": [] }
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
  const friendUsers = state.users.filter((u) => (me.friendIds ?? []).includes(u.id))

  return friendUsers
    .filter((friend) => {
      const hasCompleted = (friend.completedCourseIds ?? []).includes(courseId)
      const hasPlanned = Object.values(plannedCoursesByUser[friend.id] ?? {}).some((courses) =>
        courses.includes(courseId)
      )
      return hasCompleted || hasPlanned
    })
    .map((friend) => friend.name)
}

function getCurrentUser() {
  const user = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]
  return user ? { ...user, friendIds: state.friendData.friendIds ?? [] } : null
}

function friendlyError(code, fallback) {
  const messages = {
    already_friends: 'You are already friends.',
    cannot_friend_self: 'You cannot send a friend request to yourself.',
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
