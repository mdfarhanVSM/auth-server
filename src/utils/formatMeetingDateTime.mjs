export const formatMeetingDateTime = (input) => {
  if (!input) return { date: '', time: '' };

  const dateObj = new Date(input.replace(' ', 'T'));

  return {
    date: dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    time: dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
};