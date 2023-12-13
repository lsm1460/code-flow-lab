import { delay, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  EMIT_DOCUMENT_VALUE,
  SET_DELETE_ANIMATION_ID_LIST,
  SET_DELETE_TARGET_ID_LIST,
  SET_DOCUMENT_VALUE,
  SET_OPENED_GROUP_ID_LIST,
} from './actions';
import { Operation, SagaOperationParam } from './types';

import { ConnectPoint } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { filterDeleteTargetId, getSceneId } from '@/utils/content';
import { addHistory } from '@/utils/history';
import _ from 'lodash';

function* handleSetDocumentValue({ payload }: SagaOperationParam) {
  const { contentDocument }: RootState = yield select();

  let operations: Operation[] = [];

  if (!_.isArray(payload)) {
    operations = [{ ...payload }];
  } else {
    operations = _.map(payload, (operation) => ({
      ...operation,
    }));
  }

  operations = _.map(operations, (op) => {
    const beforeValue = op.key.split('.').reduce((acc, val) => (acc ? acc[val] : ''), contentDocument);

    return {
      ...op,
      beforeValue,
    };
  });

  yield put({ type: EMIT_DOCUMENT_VALUE, payload: operations });
}

function* handleEmitValue({ payload }: SagaOperationParam) {
  addHistory(payload);
}

function* handleDeleteBlock({ payload }: { type: string; payload: string[] }) {
  const {
    sceneOrder,
    deleteTargetIdList,
    selectedGroupId,
    openedGroupIdList,
    contentDocument: { items, itemsPos, scene, group },
  }: RootState = yield select();
  if (deleteTargetIdList.length > 0) {
    return;
  }

  yield put({ type: SET_DELETE_ANIMATION_ID_LIST, payload });

  const selectedSceneId = getSceneId(scene, sceneOrder, selectedGroupId);
  const sceneItemIds = scene[selectedSceneId]?.itemIds || [];

  yield delay((payload.length + 1) * 100);

  const ops = [];
  const _idList = filterDeleteTargetId(items, group, scene, payload);
  const filterPoint = (_point: ConnectPoint) => !_idList.includes(_point.connectParentId);

  let newChartItems = _.pickBy(items, (_item) => !_idList.includes(_item.id));
  newChartItems = _.mapValues(newChartItems, (_item) => ({
    ..._item,
    connectionIds: {
      ..._item.connectionIds,
      left: [...(_item.connectionIds?.left || []).filter(filterPoint)],
      right: [...(_item.connectionIds?.right || []).filter(filterPoint)],
    },
    ...(_item.connectionVariables && {
      connectionVariables: _item.connectionVariables.map((_point) =>
        _idList.includes(_point?.connectParentId) ? undefined : _point
      ),
    }),
  }));

  ops.push({
    key: 'items',
    value: newChartItems,
  });
  ops.push({
    key: 'itemsPos',
    value: _.mapValues(
      _.pickBy(itemsPos, (_v, _itemId) => !_idList.includes(_itemId)),
      (_v, _itemId) => _.pickBy(_v, (_pos, _sceneId) => !(payload.includes(_itemId) && selectedSceneId === _sceneId))
    ),
  });
  ops.push({
    key: `scene.${selectedSceneId}.itemIds`,
    value: sceneItemIds.filter((_id) => !payload.includes(_id)),
  });
  ops.push({
    key: `group`,
    value: _.mapValues(
      _.pickBy(group, (_v, _groupId) => !_idList.includes(_groupId)),
      (_list) => _list.filter((_itemId) => !_idList.includes(_itemId))
    ),
  });

  yield put({
    type: SET_OPENED_GROUP_ID_LIST,
    payload: openedGroupIdList.filter((_groupId) => !_idList.includes(_groupId)),
  });
  yield put({ type: SET_DELETE_ANIMATION_ID_LIST, payload: [] });
  yield put({ type: SET_DOCUMENT_VALUE, payload: ops });
}

export default function* documentSaga() {
  yield takeLatest(SET_DOCUMENT_VALUE, handleSetDocumentValue);
  yield takeLatest(EMIT_DOCUMENT_VALUE, handleEmitValue);
  yield takeEvery(SET_DELETE_TARGET_ID_LIST, handleDeleteBlock);
}
