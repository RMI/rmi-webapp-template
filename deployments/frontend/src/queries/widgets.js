export async function getWidgets(config, fetcher) {
  const response = await fetcher(`${config.apiBaseUrl}/widgets/`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function createWidget(config, fetcher, payload) {
  const response = await fetcher(`${config.apiBaseUrl}/widgets/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}
