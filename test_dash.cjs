const habitsData = {
  habits: [
    {
      id: 1,
      checks: {
        "2026-03-26": true,
        "2026-03-27": true,
        "2026-03-28": true
      }
    }
  ]
};

let globalMaxStreak = 0;
let globalActiveStreak = 0;

habitsData.habits.forEach((h) => {
  if (!h.checks) return;

  const checkedDates = Object.keys(h.checks)
    .filter((k) => h.checks[k] && /^\d{4}-\d{2}-\d{2}$/.test(k))
    .map((k) => {
      const [y, m, d] = k.split("-");
      return new Date(Number(y), Number(m) - 1, Number(d));
    })
    .sort((a, b) => a - b); // sort chronologically

  console.log("Checked dates:", checkedDates.map(d => d.toISOString()));

  let currentHabitStreak = 0;
  let maxHabitStreak = 0;

  if (checkedDates.length > 0) {
    let tempStreak = 1;
    maxHabitStreak = 1;

    for (let i = 1; i < checkedDates.length; i++) {
      const diffTime = Math.abs(checkedDates[i] - checkedDates[i - 1]);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > maxHabitStreak) {
          maxHabitStreak = tempStreak;
        }
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
  }

  console.log("Max Habit Streak:", maxHabitStreak);

  // Calculate Current Streak
  let tempCurrent = 0;
  let streakActive = true;
  let safetyCounter = 0;
  let backDate = new Date();
  
  function getLocalISOString(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  while (streakActive && safetyCounter < 10000) {
    const k = getLocalISOString(backDate);
    if (h.checks[k]) {
      tempCurrent++;
    } else {
      if (safetyCounter !== 0) {
        streakActive = false;
      }
    }
    backDate.setDate(backDate.getDate() - 1);
    safetyCounter++;
  }
  currentHabitStreak = tempCurrent;

  console.log("Current Habit Streak:", currentHabitStreak);

  if (maxHabitStreak > globalMaxStreak) globalMaxStreak = maxHabitStreak;
  if (currentHabitStreak > globalActiveStreak) globalActiveStreak = currentHabitStreak;
});

console.log("Global Max:", globalMaxStreak);
console.log("Global Active:", globalActiveStreak);
