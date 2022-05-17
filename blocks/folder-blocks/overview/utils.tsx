import { timeDay, timeFormat, timeMonth, timeWeek, timeYear } from "d3";

const formatTime = timeFormat("%-I:%M %p");
export const getRelativeTime = (d: Date) => {
  const now = new Date();
  const today = timeDay.floor(now);
  if (d > today) {
    return formatTime(d);
  }
  const yesterday = timeDay.offset(today, -1);
  if (d > yesterday) {
    return `Yesterday, ${formatTime(d)}`;
  }
  const thisWeek = timeWeek.floor(now);
  if (d > thisWeek) {
    return timeFormat("%A")(d);
  }
  const lastWeek = timeWeek.offset(thisWeek, -1);
  if (d > lastWeek) {
    return `Last ${timeFormat("%A")(d)}`;
  }
  const daysAgo = timeDay.count(d, now);
  if (daysAgo < 30) {
    return `${daysAgo} days ago`;
  }
  const monthsAgo = timeMonth.count(d, now);
  if (monthsAgo < 12) {
    return `${monthsAgo} months ago`;
  }
  const yearsAgo = timeYear.count(d, now);
  return `${yearsAgo} year${yearsAgo === 1 ? "" : "s"} ago`;
};
