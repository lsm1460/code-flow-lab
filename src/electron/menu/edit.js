const {
  REQUEST_UNDO,
  REQUEST_REDO,
  REQUEST_MAKE_GROUP,
  REQUEST_UNGROUP,
  REQUEST_EDIT_GROUP,
  REQUEST_CHANGE_ROOT,
} = require('../../consts/channel');

const requestUndo = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_UNDO);
};

const requestRedo = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_REDO);
};

const requestMakeGroup = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_MAKE_GROUP);
};

const requestUngroup = (_mainWindow, _groupId) => {
  _mainWindow.webContents.send(REQUEST_UNGROUP, _groupId);
};

const requestEditGroup = (_mainWindow, _groupId) => {
  _mainWindow.webContents.send(REQUEST_EDIT_GROUP, _groupId);
};

const requestChangeRoot = (_mainWindow, _groupId, _itemId) => {
  _mainWindow.webContents.send(REQUEST_CHANGE_ROOT, { groupId: _groupId, itemId: _itemId });
};

module.exports = {
  requestUndo,
  requestRedo,
  requestMakeGroup,
  requestUngroup,
  requestEditGroup,
  requestChangeRoot,
};
