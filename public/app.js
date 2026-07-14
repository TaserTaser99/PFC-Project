const fallbackCourses = [
  {
    id: "c1",
    code: "MATH1081",
    title: "Discrete Mathematics",
    workload: 8,
    popularity: 120,
    term: "2"
  },
  {
    id: "c2",
    code: "COMP1511",
    title: "Programming Fundamentals",
    workload: 9,
    popularity: 210,
    term: "1"
  },
  {
    id: "c3",
    code: "COMP1531",
    title: "Software Engineering Fundamentals",
    workload: 8,
    popularity: 185,
    term: "2"
  },
  {
    id: "c4",
    code: "COMP2521",
    title: "Data Structures and Algorithms",
    workload: 9,
    popularity: 170,
    term: "3"
  },
  {
    id: "c5",
    code: "MATH1231",
    title: "Mathematics 1B",
    workload: 7,
    popularity: 150,
    term: "1"
  },
  {
    id: "c6",
    code: "COMP3311",
    title: "Database Systems",
    workload: 7,
    popularity: 155,
    term: "3"
  }
]

const fallbackUsers = [
  {
    id: "u1",
    name: "You",
    friendIds: ["u2", "u3"],
    preferredWorkload: 18,
    completedCourseIds: ["c1", "c2"]
  },
  {
    id: "u2",
    name: "Alex",
    friendIds: ["u1", "u4"],
    preferredWorkload: 16,
    completedCourseIds: ["c2", "c5"]
  },
  {
    id: "u3",
    name: "Jordan",
    friendIds: ["u1"],
    preferredWorkload: 15,
    completedCourseIds: ["c1", "c3"]
  },
  {
    id: "u4",
    name: "Mina",
    friendIds: ["u2"],
    preferredWorkload: 20,
    completedCourseIds: ["c4"]
  }
]

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
  activeTab: "search"
}

const els = {
  tabs: document.querySelectorAll(".tab"),
  panels: {
    search: document.getElementById("tab-search"),
    heatmap: document.getElementById("tab-heatmap"),
    progression: document.getElementById("tab-progression")
  },
  friendName: document.getElementById("friend-name"),
  addFriendBtn: document.getElementById("add-friend-btn"),
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

  if (!state.users.find((u) => u.id === state.currentUserId) && state.users.length > 0) {
    state.currentUserId = state.users[0].id
  }

  bindEvents()
  populateUserSelects()
  renderAll()
}

async function loadData() {
  try {
    const [coursesRes, usersRes] = await Promise.all([fetch("/api/courses"), fetch("/api/users")])
    if (!coursesRes.ok || !usersRes.ok) {
      throw new Error("API not ready")
    }
    return {
      courses: await coursesRes.json(),
      users: await usersRes.json()
    }
  } catch {
    return {
      courses: fallbackCourses,
      users: fallbackUsers
    }
  }
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeTab = tab.dataset.tab
      renderTabs()
    })
  })

  els.addFriendBtn.addEventListener("click", () => {
    const value = els.friendName.value.trim()
    if (!value) {
      return
    }

    const newUserId = `u${Date.now()}`
    const me = getCurrentUser()

    state.users.push({
      id: newUserId,
      name: value,
      friendIds: [me.id],
      preferredWorkload: 16,
      completedCourseIds: []
    })

    me.friendIds = Array.from(new Set([...me.friendIds, newUserId]))
    plannedCoursesByUser[newUserId] = { "1": [], "2": [], "3": [] }

    els.friendName.value = ""
    populateUserSelects()
    renderSidebar()
    renderSearch()
    renderHeatmap()
  })

  els.courseSearch.addEventListener("input", renderSearch)

  els.recommendUser.addEventListener("change", () => {
    state.currentUserId = els.recommendUser.value
    els.progressUser.value = state.currentUserId
    renderSidebar()
    renderSearch()
    renderHeatmap()
    renderProgression()
  })

  els.termSelect.addEventListener("change", () => {
    state.selectedTerm = els.termSelect.value
    renderHeatmap()
  })

  els.progressUser.addEventListener("change", () => {
    state.currentUserId = els.progressUser.value
    els.recommendUser.value = state.currentUserId
    renderSidebar()
    renderSearch()
    renderHeatmap()
    renderProgression()
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
  })

  Object.entries(els.panels).forEach(([key, panel]) => {
    panel.classList.toggle("active", key === state.activeTab)
  })
}

function renderSidebar() {
  const me = getCurrentUser()
  const friends = state.users.filter((u) => me.friendIds.includes(u.id))

  els.friendsList.innerHTML = friends.length
    ? friends
        .map(
          (f) => `
            <div class="friend-item">
              <strong>${escapeHTML(f.name)}</strong>
              <div class="course-meta">Workload target: ${f.preferredWorkload} hrs/wk</div>
            </div>
          `
        )
        .join("")
    : `<div class="friend-item">No friends added yet.</div>`

  els.userDatabase.innerHTML = state.users
    .map(
      (u) => `
        <div class="user-item">
          <strong>${escapeHTML(u.name)}</strong>
          <div class="course-meta">ID: ${u.id}</div>
          <div class="course-meta">Completed: ${u.completedCourseIds.length}</div>
        </div>
      `
    )
    .join("")
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

  els.searchResults.innerHTML = results
    .map((course) => {
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

  const recs = recommendCourses(state.currentUserId)
  els.recommendations.innerHTML = recs
    .map(
      (r) => `
        <article class="course-card">
          <h4>${escapeHTML(r.course.code)} - ${escapeHTML(r.course.title)}</h4>
          <div class="course-meta">Recommendation score: ${r.score.toFixed(1)}</div>
          <div class="course-meta">${r.friendCount} friend(s) are taking this course.</div>
        </article>
      `
    )
    .join("")
}

function recommendCourses(userId) {
  const me = state.users.find((u) => u.id === userId)
  if (!me) {
    return []
  }

  return state.courses
    .filter((course) => !me.completedCourseIds.includes(course.id))
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

  els.heatmapGrid.innerHTML = counts
    .map(({ course, count }) => {
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
}

function renderProgression() {
  const me = getCurrentUser()
  const completed = new Set(me.completedCourseIds)
  const done = degreeRequirements.filter((id) => completed.has(id)).length
  const total = degreeRequirements.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  els.progressText.textContent = `${escapeHTML(me.name)}'s Degree Progress`
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
  const friendUsers = state.users.filter((u) => me.friendIds.includes(u.id))

  return friendUsers
    .filter((friend) => {
      const hasCompleted = friend.completedCourseIds.includes(courseId)
      const hasPlanned = Object.values(plannedCoursesByUser[friend.id] ?? {}).some((courses) =>
        courses.includes(courseId)
      )
      return hasCompleted || hasPlanned
    })
    .map((friend) => friend.name)
}

function getCurrentUser() {
  return state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]
}

function escapeHTML(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
