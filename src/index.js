import api, { route } from '@forge/api';

// ─── Shared helper: fetch active sprint for a board name ──────────────────────

async function fetchActiveSprint(boardName) {
  const boardsRes = await api.asApp().requestJira(
    route`/rest/agile/1.0/board?name=${boardName}&type=scrum`
  );
  const boardsData = await boardsRes.json();
  const board = boardsData.values?.find(
    b => b.name.toLowerCase() === boardName.toLowerCase()
  );
  if (!board) return null;

  const sprintRes = await api.asApp().requestJira(
    route`/rest/agile/1.0/board/${board.id}/sprint?state=active`
  );
  const sprintData = await sprintRes.json();
  const activeSprint = sprintData.values?.[0];
  if (!activeSprint) return null;

  return {
    boardId: board.id,
    boardName: board.name,
    startDate: activeSprint.startDate?.split('T')[0] ?? null,
    endDate: activeSprint.endDate?.split('T')[0] ?? null,
  };
}

// ─── Shared helper: update precomputations for a given function key ───────────

async function refreshPrecomputations(functionKey, boardName, newDate) {
  const listRes = await api.asApp().requestJira(
    route`/rest/api/3/jql/function/computation`
  );
  const listData = await listRes.json();

  const toUpdate = listData.values?.filter(
    p =>
      p.functionKey === functionKey &&
      p.arguments?.[0]?.toLowerCase() === boardName.toLowerCase()
  );

  if (!toUpdate?.length) {
    console.log(`No precomputations found for "${functionKey}" / board "${boardName}".`);
    return;
  }

  const updates = toUpdate.map(p => ({
    id: p.id,
    value: `"${newDate}"`,
  }));

  const updateRes = await api.asApp().requestJira(
    route`/rest/api/3/jql/function/computation`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: updates }),
    }
  );

  console.log(`Updated "${functionKey}" precomputations for board "${boardName}": ${updateRes.status}`);
}

// ─── JQL Function: sprintStartDate("Board Name") ─────────────────────────────

export const sprintStartDate = async (args) => {
  const [boardName] = args.clause.arguments;
  try {
    const sprint = await fetchActiveSprint(boardName);
    if (!sprint?.startDate) {
      return { errors: [`No active sprint start date found for board: "${boardName}"`] };
    }
    return { jql: `"${sprint.startDate}"` };
  } catch (err) {
    return { errors: [`sprintStartDate() error: ${err.message}`] };
  }
};

// ─── JQL Function: sprintEndDate("Board Name") ───────────────────────────────

export const sprintEndDate = async (args) => {
  const [boardName] = args.clause.arguments;
  try {
    const sprint = await fetchActiveSprint(boardName);
    if (!sprint?.endDate) {
      return { errors: [`No active sprint end date found for board: "${boardName}"`] };
    }
    return { jql: `"${sprint.endDate}"` };
  } catch (err) {
    return { errors: [`sprintEndDate() error: ${err.message}`] };
  }
};

// ─── Sprint event trigger: refreshes both functions on sprint start ───────────

export const onSprintUpdated = async (event) => {
  const { sprint } = event;

  if (sprint?.state?.toLowerCase() !== 'active') {
    console.log(`Sprint "${sprint?.name}" is "${sprint?.state}" — skipping.`);
    return;
  }

  const boardId = sprint.originBoardId;
  if (!boardId) {
    console.log('No originBoardId on event — skipping.');
    return;
  }

  try {
    const boardRes = await api.asApp().requestJira(
      route`/rest/agile/1.0/board/${boardId}`
    );
    const boardData = await boardRes.json();
    const boardName = boardData.name;

    const startDate = sprint.startDate?.split('T')[0];
    const endDate = sprint.endDate?.split('T')[0];

    if (!startDate || !endDate) {
      console.log('Sprint missing startDate or endDate — skipping.');
      return;
    }

    console.log(`Sprint "${sprint.name}" started on "${boardName}". Refreshing both precomputations...`);

    // Refresh both function precomputations in parallel
    await Promise.all([
      refreshPrecomputations('sprint-start-date-function', boardName, startDate),
      refreshPrecomputations('sprint-end-date-function', boardName, endDate),
    ]);

  } catch (err) {
    console.error(`Trigger error: ${err.message}`);
  }
};
