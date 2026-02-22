const toastEl = document.getElementById('toast');
const kpiFields = document.querySelectorAll('[data-field]');
const recentUsersList = document.getElementById('recent-users');
const topRoutesList = document.getElementById('top-routes');
const usersTableBody = document.getElementById('users-table-body');
const searchInput = document.getElementById('user-search');
const refreshBtn = document.getElementById('refresh-users');
const routeForm = document.getElementById('route-form');
const sourceInput = document.getElementById('route-source');
const destinationInput = document.getElementById('route-destination');
const sourceHidden = document.getElementById('route-source-id');
const destinationHidden = document.getElementById('route-destination-id');
const sourceSuggestions = document.getElementById('source-suggestions');
const destinationSuggestions = document.getElementById('destination-suggestions');
const transportSelect = document.getElementById('route-transport');
const distanceInput = document.getElementById('route-distance');
const routeCodeInput = document.getElementById('route-code');
const scheduleForm = document.getElementById('schedule-form');
const scheduleRouteInput = document.getElementById('schedule-route');
const scheduleRouteHidden = document.getElementById('schedule-route-id');
const routeSuggestions = document.getElementById('route-suggestions');
const scheduleOperatorInput = document.getElementById('schedule-operator');
const scheduleDepartureInput = document.getElementById('schedule-departure');
const scheduleArrivalInput = document.getElementById('schedule-arrival');
const scheduleDaysInput = document.getElementById('schedule-days');
const scheduleDateInput = document.getElementById('schedule-date');
const scheduleSeatsTotalInput = document.getElementById('schedule-seats-total');
const scheduleSeatsBookedInput = document.getElementById('schedule-seats-booked');

const numberFormat = new Intl.NumberFormat('en-IN');

function showToast(message, type = 'success') {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => toastEl.classList.remove('show'), 2600);
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
    ...options,
  });
  if (!response.ok) {
    let msg = 'Request failed';
    try {
      const err = await response.json();
      msg = err.error || msg;
    } catch (e) {
      // ignore
    }
    throw new Error(msg);
  }
  return response.json();
}

async function loadMetrics() {
  try {
    const data = await fetchJSON('/api/admin/metrics');
    if (data.counts) {
      kpiFields.forEach((field) => {
        const key = field.dataset.field;
        const value = data.counts[key] ?? 0;
        field.textContent = numberFormat.format(value);
      });
    }
    renderRecentUsers(data.recent_users || []);
    renderTopRoutes(data.top_routes || []);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderRecentUsers(users) {
  if (!users.length) {
    recentUsersList.innerHTML = '<li class="empty-state">No recent sign-ups.</li>';
    return;
  }
  recentUsersList.innerHTML = users
    .map((user) => {
      const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : '—';
      const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : 'Never';
      const statusClass = user.is_active ? 'active' : 'inactive';
      const statusLabel = user.is_active ? 'Active' : 'Disabled';
      return `
        <li>
          <strong>${user.name}</strong>
          <span>${user.email}</span>
          <div class="item-meta">
            <span>Signed up: ${created}</span>
            <span>Last login: ${lastLogin}</span>
            <span class="status-pill ${statusClass}">${statusLabel}</span>
          </div>
        </li>
      `;
    })
    .join('');
}

function renderTopRoutes(routes) {
  if (!routes.length) {
    topRoutesList.innerHTML = '<li class="empty-state">No route data available.</li>';
    return;
  }
  topRoutesList.innerHTML = routes
    .map((route) => {
      const label = `${route.source} → ${route.destination}`;
      return `
        <li>
          <strong>${label}</strong>
          <div class="item-meta">
            <span>${route.transport_type.toUpperCase()}</span>
            <span>${route.schedule_count} schedules</span>
            <span>${route.seats_available} seats open</span>
          </div>
        </li>
      `;
    })
    .join('');
}

async function loadUsers(force = false) {
  const query = searchInput?.value.trim();
  const url = new URL('/api/admin/users', window.location.origin);
  if (query) {
    url.searchParams.set('search', query);
  }
  if (!force && usersTableBody.dataset.loading === 'true') return;
  usersTableBody.dataset.loading = 'true';
  usersTableBody.innerHTML = `
    <tr><td colspan="8" class="empty-state">Loading users…</td></tr>
  `;
  try {
    const data = await fetchJSON(url.toString());
    renderUsersTable(data.users || []);
  } catch (error) {
    usersTableBody.innerHTML = `
      <tr><td colspan="8" class="empty-state">Failed to load users.</td></tr>
    `;
    showToast(error.message, 'error');
  } finally {
    usersTableBody.dataset.loading = 'false';
  }
}

function renderUsersTable(users) {
  if (!users.length) {
    usersTableBody.innerHTML = `
      <tr><td colspan="8" class="empty-state">No users match this filter.</td></tr>
    `;
    return;
  }

  usersTableBody.innerHTML = users
    .map((user) => {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || '—';
      const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : '—';
      const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : 'Never';
      const statusClass = user.is_active ? 'active' : 'inactive';
      const statusLabel = user.is_active ? 'Active' : 'Disabled';
      const actionLabel = user.is_active ? 'Disable' : 'Activate';

      return `
        <tr data-user-id="${user.user_id}">
          <td>${user.user_id}</td>
          <td>${name}</td>
          <td>${user.email}</td>
          <td>${user.phone_number || '—'}</td>
          <td>${created}</td>
          <td>${lastLogin}</td>
          <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
          <td><button class="toggle-btn" data-new-status="${!user.is_active}">${actionLabel}</button></td>
        </tr>
      `;
    })
    .join('');
}

async function toggleUserStatus(row, newStatus) {
  const userId = row?.dataset.userId;
  if (!userId) return;
  const btn = row.querySelector('.toggle-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    await fetchJSON(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: newStatus }),
    });
    showToast('User status updated');
    await loadUsers(true);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = newStatus ? 'Disable' : 'Activate';
  }
}

function setupStationSearch(inputEl, hiddenEl, suggestionsEl) {
  if (!inputEl || !hiddenEl || !suggestionsEl) {
    return;
  }
  let debounce;
  const fetchSuggestions = async (term) => {
    try {
      const data = await fetchJSON(`/api/admin/stations?search=${encodeURIComponent(term)}`);
      const stations = data.stations || [];
      if (!stations.length) {
        suggestionsEl.innerHTML = '<li class="empty-state">No stations found</li>';
        suggestionsEl.classList.remove('hidden');
        return;
      }
      suggestionsEl.innerHTML = stations
        .map(
          (station) =>
            `<li data-id="${station.station_id}" data-name="${station.station_name}">${station.station_name}</li>`
        )
        .join('');
      suggestionsEl.classList.remove('hidden');
    } catch (error) {
      suggestionsEl.innerHTML = '<li class="empty-state">Lookup failed</li>';
      suggestionsEl.classList.remove('hidden');
    }
  };

  inputEl.addEventListener('input', () => {
    hiddenEl.value = '';
    const term = inputEl.value.trim();
    if (term.length < 2) {
      suggestionsEl.classList.add('hidden');
      suggestionsEl.innerHTML = '';
      return;
    }
    clearTimeout(debounce);
    debounce = setTimeout(() => fetchSuggestions(term), 250);
  });

  inputEl.addEventListener('focus', () => {
    if (suggestionsEl.children.length) {
      suggestionsEl.classList.remove('hidden');
    }
  });

  suggestionsEl.addEventListener('click', (event) => {
    const item = event.target.closest('li[data-id]');
    if (!item) return;
    hiddenEl.value = item.dataset.id;
    inputEl.value = item.dataset.name;
    suggestionsEl.classList.add('hidden');
  });
}

function hideAllSuggestions() {
  [sourceSuggestions, destinationSuggestions, routeSuggestions].forEach((ul) => {
    if (ul) {
      ul.classList.add('hidden');
    }
  });
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('.station-search')) {
    hideAllSuggestions();
  }
});

setupStationSearch(sourceInput, sourceHidden, sourceSuggestions);
setupStationSearch(destinationInput, destinationHidden, destinationSuggestions);

function setupRouteSearch() {
  if (!scheduleRouteInput || !scheduleRouteHidden || !routeSuggestions) {
    return;
  }
  let debounce;
  const fetchRoutes = async (term) => {
    try {
      const data = await fetchJSON(`/api/admin/routes/search?search=${encodeURIComponent(term)}`);
      const routes = data.routes || [];
      if (!routes.length) {
        routeSuggestions.innerHTML = '<li class="empty-state">No routes found</li>';
        routeSuggestions.classList.remove('hidden');
        return;
      }
      routeSuggestions.innerHTML = routes
        .map((route) => {
          const label = `${route.route_code || route.route_id} · ${route.source} → ${route.destination} (${route.transport_type.toUpperCase()})`;
          return `<li data-id="${route.route_id}" data-label="${label}">${label}</li>`;
        })
        .join('');
      routeSuggestions.classList.remove('hidden');
    } catch (error) {
      routeSuggestions.innerHTML = '<li class="empty-state">Lookup failed</li>';
      routeSuggestions.classList.remove('hidden');
    }
  };

  scheduleRouteInput.addEventListener('input', () => {
    scheduleRouteHidden.value = '';
    const term = scheduleRouteInput.value.trim();
    if (term.length < 2) {
      routeSuggestions.classList.add('hidden');
      routeSuggestions.innerHTML = '';
      return;
    }
    clearTimeout(debounce);
    debounce = setTimeout(() => fetchRoutes(term), 250);
  });

  scheduleRouteInput.addEventListener('focus', () => {
    if (routeSuggestions.children.length) {
      routeSuggestions.classList.remove('hidden');
    }
  });

  routeSuggestions.addEventListener('click', (event) => {
    const item = event.target.closest('li[data-id]');
    if (!item) return;
    scheduleRouteHidden.value = item.dataset.id;
    scheduleRouteInput.value = item.dataset.label;
    routeSuggestions.classList.add('hidden');
  });
}

setupRouteSearch();

async function submitRouteForm(event) {
  event.preventDefault();
  const payload = {
    source_station_id: Number(sourceHidden?.value || 0),
    destination_station_id: Number(destinationHidden?.value || 0),
    transport_type: transportSelect?.value || 'bus',
    distance_km: distanceInput?.value,
    route_code: routeCodeInput?.value?.trim().toUpperCase() || '',
  };
  if (!payload.source_station_id || !payload.destination_station_id) {
    showToast('Select both source and destination stations', 'error');
    return;
  }
  if (payload.source_station_id === payload.destination_station_id) {
    showToast('Source and destination must differ', 'error');
    return;
  }
  if (!payload.distance_km || Number(payload.distance_km) <= 0) {
    showToast('Provide a valid distance', 'error');
    return;
  }
  if (!payload.route_code) {
    showToast('Route code is required', 'error');
    return;
  }
  try {
    await fetchJSON('/api/admin/routes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    showToast('Route created');
    routeForm?.reset();
    if (sourceHidden) sourceHidden.value = '';
    if (destinationHidden) destinationHidden.value = '';
    hideAllSuggestions();
    loadMetrics();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

routeForm?.addEventListener('submit', submitRouteForm);

async function submitScheduleForm(event) {
  event.preventDefault();
  const payload = {
    route_id: Number(scheduleRouteHidden?.value || 0),
    operator: scheduleOperatorInput?.value?.trim(),
    departure_time: scheduleDepartureInput?.value,
    arrival_time: scheduleArrivalInput?.value,
    days_of_week: scheduleDaysInput?.value?.trim() || 'Daily',
    availability_date: scheduleDateInput?.value || undefined,
    seats_total: scheduleSeatsTotalInput?.value ? Number(scheduleSeatsTotalInput.value) : undefined,
    seats_booked: scheduleSeatsBookedInput?.value ? Number(scheduleSeatsBookedInput.value) : undefined,
  };

  if (!payload.route_id) {
    showToast('Select a route', 'error');
    return;
  }
  if (!payload.operator) {
    showToast('Operator is required', 'error');
    return;
  }
  if (!payload.departure_time || !payload.arrival_time) {
    showToast('Provide both departure and arrival times', 'error');
    return;
  }

  if (payload.seats_total !== undefined && payload.seats_total < 0) {
    showToast('Seats total must be non-negative', 'error');
    return;
  }
  if (payload.seats_booked !== undefined && payload.seats_booked < 0) {
    showToast('Seats booked must be non-negative', 'error');
    return;
  }
  if (
    payload.seats_total !== undefined &&
    payload.seats_booked !== undefined &&
    payload.seats_booked > payload.seats_total
  ) {
    showToast('Booked seats cannot exceed total seats', 'error');
    return;
  }

  try {
    await fetchJSON('/api/admin/schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    showToast('Schedule created');
    scheduleForm?.reset();
    if (scheduleRouteHidden) scheduleRouteHidden.value = '';
    if (scheduleRouteInput) scheduleRouteInput.value = '';
    if (routeSuggestions) routeSuggestions.innerHTML = '';
    hideAllSuggestions();
    loadMetrics();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

scheduleForm?.addEventListener('submit', submitScheduleForm);

let searchDebounce;
searchInput?.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => loadUsers(true), 400);
});

refreshBtn?.addEventListener('click', () => loadUsers(true));

usersTableBody?.addEventListener('click', (event) => {
  if (event.target.matches('.toggle-btn')) {
    const row = event.target.closest('tr');
    const newStatus = event.target.dataset.newStatus === 'true';
    toggleUserStatus(row, newStatus);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadMetrics();
  loadUsers(true);
});

