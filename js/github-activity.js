// TODO: *************************************************************** GitHub Activity Widget **********************************************************************//
document.addEventListener("DOMContentLoaded", () => {
  const widget = document.querySelector("[data-github-activity]");
  if (!widget) return;

  const endpoint = widget.dataset.endpoint || "github-activity.php";
  const status = widget.querySelector("[data-github-status]");
  const panel = widget.querySelector("[data-github-panel]");
  const summary = widget.querySelector("[data-github-summary]");
  const months = widget.querySelector("[data-github-months]");
  const chart = widget.querySelector("[data-github-chart]");
  const updated = widget.querySelector("[data-github-updated]");
  const holidayNote = widget.querySelector("[data-github-holiday]");
  const refreshIntervalMs = 60 * 60 * 1000;
  let isLoading = false;
  let lastLoadedAt = 0;

  const numberFormat = new Intl.NumberFormat();
  const dateFormat = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  function addMonthLabels(weeks) {
    months.replaceChildren();
    months.style.setProperty("--week-count", String(weeks.length));

    const seenMonths = new Set();

    weeks.forEach((week, weekIndex) => {
      const days = Array.isArray(week.contributionDays)
        ? week.contributionDays
        : [];
      const firstOfMonth = days.find((day) => day.date?.slice(-2) === "01");
      const labelDay = firstOfMonth || (weekIndex === 0 ? days[0] : null);
      if (!labelDay || typeof labelDay.date !== "string") return;

      const monthKey = labelDay.date.slice(0, 7);
      if (seenMonths.has(monthKey)) return;
      seenMonths.add(monthKey);

      const label = document.createElement("span");
      label.textContent = new Intl.DateTimeFormat("en", {
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${labelDay.date}T00:00:00Z`));
      label.style.gridColumnStart = String(weekIndex + 1);
      months.append(label);
    });
  }

  function getGithubLogin() {
    const profileLink = widget.querySelector(".githubActivity__profileLink");
    if (!profileLink) return "";

    try {
      const profileUrl = new URL(profileLink.href, window.location.href);
      return profileUrl.hostname === "github.com"
        ? profileUrl.pathname.split("/").filter(Boolean)[0] || ""
        : "";
    } catch {
      return "";
    }
  }

  function normalisePublicCalendar(payload, login) {
    const sourceDays = Array.isArray(payload?.contributions) ? payload.contributions : [];
    const contributions = sourceDays
      .filter((day) => typeof day?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day.date))
      .map((day) => ({
        date: day.date,
        count: Math.max(0, Number(day.count) || 0),
        level: Math.min(4, Math.max(0, Math.floor(Number(day.level) || 0))),
      }))
      .sort((left, right) => left.date.localeCompare(right.date));

    if (!contributions.length) {
      throw new Error("The public contributions feed returned no daily data.");
    }

    const contributionByDate = new Map(contributions.map((day) => [day.date, day]));
    const firstDate = new Date(`${contributions[0].date}T00:00:00Z`);
    const lastDate = new Date(`${contributions[contributions.length - 1].date}T00:00:00Z`);
    if (Number.isNaN(firstDate.getTime()) || Number.isNaN(lastDate.getTime())) {
      throw new Error("The public contributions feed returned invalid dates.");
    }

    const rangeStart = new Date(firstDate);
    rangeStart.setUTCDate(rangeStart.getUTCDate() - rangeStart.getUTCDay());
    const rangeEnd = new Date(lastDate);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + (6 - rangeEnd.getUTCDay()));

    const weeks = [];
    for (const weekStart = new Date(rangeStart); weekStart <= rangeEnd; weekStart.setUTCDate(weekStart.getUTCDate() + 7)) {
      const contributionDays = [];
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const date = new Date(weekStart);
        date.setUTCDate(date.getUTCDate() + weekday);
        if (date < firstDate || date > lastDate) continue;

        const dateKey = date.toISOString().slice(0, 10);
        const contribution = contributionByDate.get(dateKey);
        contributionDays.push({
          date: dateKey,
          weekday: date.getUTCDay(),
          contributionCount: contribution?.count || 0,
          level: contribution?.level || 0,
        });
      }

      weeks.push({
        firstDay: weekStart.toISOString().slice(0, 10),
        contributionDays,
      });
    }

    const totalFromDays = contributions.reduce((total, day) => total + day.count, 0);
    const totalFromApi = Number(payload?.total?.lastYear ?? payload?.total?.last);

    return {
      login,
      totalContributions: Number.isFinite(totalFromApi) ? Math.max(0, totalFromApi) : totalFromDays,
      weeks,
      updatedAt: new Date().toISOString(),
      cacheStatus: "public-api",
    };
  }

  function renderCalendar(data) {
    const weeks = Array.isArray(data.weeks) ? data.weeks : [];
    if (weeks.length === 0) {
      throw new Error("No contribution weeks were returned.");
    }

    chart.replaceChildren();
    chart.style.setProperty("--week-count", String(weeks.length));
    chart.setAttribute(
      "aria-label",
      `GitHub contribution calendar for ${data.login}, covering the last year.`
    );
    addMonthLabels(weeks);

    const legendSwatches = widget.querySelectorAll(".githubActivity__legend [data-level]");
    if (Array.isArray(data.colors)) {
      legendSwatches.forEach((swatch, index) => {
        const color = data.colors[index];
        if (typeof color === "string" && /^#[\da-f]{6}$/i.test(color)) {
          swatch.style.setProperty("--github-day-color", color);
        }
      });
    }

    const allDays = weeks.flatMap((week) =>
      Array.isArray(week.contributionDays) ? week.contributionDays : []
    );
    const maxCount = Math.max(
      1,
      ...allDays.map((day) => Number(day.contributionCount) || 0)
    );

    weeks.forEach((week) => {
      const weekDays = Array.isArray(week.contributionDays)
        ? week.contributionDays
        : [];
      const daysByWeekday = new Map(
        weekDays.map((day) => [Number(day.weekday), day])
      );

      for (let weekday = 0; weekday < 7; weekday += 1) {
        const day = daysByWeekday.get(weekday);
        const cell = document.createElement("span");
        cell.className = "githubActivity__cell";
        cell.setAttribute("aria-hidden", "true");

        if (!day) {
          cell.classList.add("githubActivity__cell--empty");
          chart.append(cell);
          continue;
        }

        const count = Math.max(0, Number(day.contributionCount) || 0);
        const suppliedLevel = Number(day.level);
        const level = Number.isInteger(suppliedLevel) && suppliedLevel >= 0 && suppliedLevel <= 4
          ? suppliedLevel
          : count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCount) * 4));
        cell.dataset.level = String(level);

        if (typeof day.color === "string" && /^#[\da-f]{6}$/i.test(day.color)) {
          cell.style.setProperty("--github-day-color", day.color);
        }

        if (typeof day.date === "string") {
          const date = new Date(`${day.date}T00:00:00Z`);
          const contributionLabel = count === 1 ? "contribution" : "contributions";
          cell.title = `${numberFormat.format(count)} ${contributionLabel} on ${dateFormat.format(date)}`;
        }

        chart.append(cell);
      }
    });

    const total = Math.max(0, Number(data.totalContributions) || 0);
    summary.textContent = `${numberFormat.format(total)} contributions in the last year`;

    const updatedAt = new Date(data.updatedAt);
    if (Number.isNaN(updatedAt.getTime())) {
      updated.textContent = "Updated automatically from GitHub.";
    } else {
      const formattedUpdate = new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(updatedAt);
      updated.textContent = data.cacheStatus === "stale"
        ? `Showing saved data; last synced ${formattedUpdate}.`
        : data.cacheStatus === "public-api"
          ? `Checked ${formattedUpdate}; the contribution feed refreshes hourly.`
          : `Last synced ${formattedUpdate}.`;
    }

    panel.hidden = false;
    const today = new Date();
    const isHalloween = today.getUTCMonth() === 9 && today.getUTCDate() === 31;
    widget.classList.toggle("githubActivity--halloween", isHalloween);
    if (holidayNote) holidayNote.hidden = !isHalloween;
    if (updated) updated.hidden = isHalloween;
    status.hidden = data.cacheStatus !== "stale";
    if (data.cacheStatus === "stale") {
      status.textContent = "GitHub is temporarily unavailable, so saved activity is being shown.";
    }
  }

  async function loadActivity() {
    if (isLoading) return;
    isLoading = true;

    let savedData = null;
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "GitHub activity could not be loaded.");
      }

      savedData = data;
      if (data.cacheStatus !== "stale") {
        renderCalendar(data);
        lastLoadedAt = Date.now();
        isLoading = false;
        return;
      }
      console.warn("[GitHub Activity] The server returned saved data; checking the public contribution feed.");
    } catch (error) {
      console.warn("[GitHub Activity] The server endpoint failed; trying the public contribution feed.", error);
    }

    try {
      const login = getGithubLogin();
      if (!login) throw new Error("The GitHub profile link does not contain a valid username.");

      const publicUrl = `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(login)}?y=last`;
      const response = await fetch(publicUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "The public contribution feed could not be loaded.");
      }

      renderCalendar(normalisePublicCalendar(payload, login));
      lastLoadedAt = Date.now();
    } catch (error) {
      console.warn("[GitHub Activity] The public contribution feed failed.", error);
      if (savedData?.weeks?.length) {
        renderCalendar(savedData);
      }
      status.hidden = false;
      status.textContent = "GitHub activity could not be refreshed. The profile link is still available above.";
    } finally {
      lastLoadedAt = Date.now();
      isLoading = false;
    }
  }

  loadActivity();
  window.setInterval(() => {
    if (document.visibilityState === "visible") loadActivity();
  }, refreshIntervalMs);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - lastLoadedAt >= refreshIntervalMs) {
      loadActivity();
    }
  });
});
