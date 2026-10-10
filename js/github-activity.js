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
        const level = count === 0
          ? 0
          : Math.min(4, Math.ceil((count / maxCount) * 4));
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
        : `Last synced ${formattedUpdate}.`;
    }

    panel.hidden = false;
    status.textContent = data.cacheStatus === "stale"
      ? "GitHub is temporarily unavailable, so saved activity is being shown."
      : "GitHub activity loaded.";
  }

  async function loadActivity() {
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

      renderCalendar(data);
    } catch (_error) {
      status.textContent = "GitHub activity is temporarily unavailable. You can still view my GitHub profile above.";
    }
  }

  loadActivity();
});
