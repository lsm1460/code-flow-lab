import _ from 'lodash';
const MAX_HISTORY = 50;

export const clearHistory = () => {
  sessionStorage.removeItem('code-flow-history');
};

export const getHistory = () => {
  const historyString = sessionStorage.getItem('code-flow-history') || '{"now": -1, "history": []}';

  return JSON.parse(historyString);
};

const setHistoryNow = (_now) => {
  let historyManger = getHistory();

  historyManger = {
    ...historyManger,
    now: _now,
  };

  sessionStorage.setItem('code-flow-history', JSON.stringify(historyManger));
};

export const addHistory = (_operations) => {
  if (_operations[0].isSkip) {
    return;
  }

  const historyManger = getHistory();

  let history = [...historyManger.history];

  if (history.length > 0 && historyManger.now + 1 < history.length) {
    history.splice(historyManger.now + 1, history.length);
  }

  history = [...history, _.map(_operations, (op) => ({ ...op }))];

  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  const newHistoryManger = {
    now: history.length - 1,
    history,
  };

  sessionStorage.setItem('code-flow-history', JSON.stringify(newHistoryManger));
};

export const getPrevHistory = () => {
  const historyManger = getHistory();

  const targetHistory = Math.max(historyManger.now - 1, -1);

  let prevOp = historyManger.history[targetHistory + 1];

  setHistoryNow(targetHistory);

  return _.map(prevOp, (op) => ({
    ...op,
    value: op.beforeValue,
    isSkip: true,
  }));
};

export const getNextHistory = () => {
  const historyManger = getHistory();
  const historySize = historyManger.history.length;

  const targetHistory = Math.min(historyManger.now + 1, historySize - 1);
  setHistoryNow(targetHistory);

  let nextOp = historyManger.history[targetHistory];

  return _.map(nextOp, (op) => ({
    ...op,
    isSkip: true,
  }));
};
