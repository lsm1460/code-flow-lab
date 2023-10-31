import { ChartItem, ChartItemType, ChartItems, PointPos } from '@/consts/types/codeFlowLab';
import { Operation } from '@/reducers/contentWizard/mainDocument';
import _ from 'lodash';

const getConnectionIds = (_connectionIds: ChartItem['connectionIds'], _aPos: PointPos, _bPos: PointPos) => {
  return {
    ..._connectionIds,
    [_aPos.connectDir]: [
      ..._connectionIds[_aPos.connectDir],
      {
        parentId: _aPos.parentId,
        connectParentId: _bPos.parentId,
      },
    ],
  };
};

const getDisconnectIds = (_connectionIds: ChartItem['connectionIds'], _aPos: PointPos, _bPos: PointPos) => {
  return {
    ..._connectionIds,
    [_aPos.connectDir]: _connectionIds[_aPos.connectDir].filter((_point) => _point.connectParentId !== _bPos.parentId),
  };
};

const getChangeConnectIds = (
  _connectionIds: ChartItem['connectionIds'],
  _aPos: PointPos,
  _bPos: PointPos,
  _cPos: PointPos
) => {
  const deletedIdList = _connectionIds[_aPos.connectDir].filter((_point) => _point.connectParentId !== _cPos.parentId);

  return {
    ..._connectionIds,
    [_aPos.connectDir]: [
      ...deletedIdList,
      {
        parentId: _aPos.parentId,
        connectParentId: _bPos.parentId,
      },
    ],
  };
};

const getConnectionVariables = (
  _connectionVariables: ChartItem['connectionVariables'],
  _aPos: PointPos,
  _bPos: PointPos
) => {
  const { typeIndex: variableIndex, connectType, index } = _aPos.el.dataset;
  const _variableIndex = parseInt(variableIndex);

  const _variablesSize =
    _connectionVariables.length > _variableIndex + 1 ? _connectionVariables.length : _variableIndex + 1;

  return new Array(_variablesSize).fill(undefined).map((_v, _i) => {
    if (_variableIndex === _i) {
      return {
        parentId: _aPos.parentId,
        connectParentId: _bPos.parentId,
        connectType: connectType as ChartItemType,
        index: parseInt(index, 10),
      };
    } else {
      return _connectionVariables[_i];
    }
  });
};

const getDisconnectVariables = (_connectionVariables: ChartItem['connectionVariables'], _variablePos: PointPos) => {
  return _connectionVariables.map((_point) => (_point?.connectParentId === _variablePos.parentId ? undefined : _point));
};

const getChangeConnectVariables = (
  _connectionVariables: ChartItem['connectionVariables'],
  _aPos: PointPos,
  _bPos: PointPos,
  _cPos: PointPos
) => {
  const { typeIndex: variableIndex, connectType, index } = _aPos.el.dataset;
  const _variableIndex = parseInt(variableIndex);

  const _variablesSize =
    _connectionVariables.length > _variableIndex + 1 ? _connectionVariables.length : _variableIndex + 1;

  const { typeIndex: deletePosIndex } = _cPos.el.dataset;
  const _deletePosIndex = parseInt(deletePosIndex);

  return new Array(_variablesSize).fill(undefined).map((__, _i) => {
    if (_i === _variableIndex) {
      return {
        parentId: _aPos.parentId,
        connectParentId: _bPos.parentId,
        connectType: connectType as ChartItemType,
        index: parseInt(index, 10),
      };
    } else if (_i === _deletePosIndex) {
      return undefined;
    } else {
      return _connectionVariables[_i];
    }
  });
};

export const getConnectOperationsForCondition = (
  selectedChartItem: _.Dictionary<ChartItems>,
  _prevPos: PointPos,
  _nextPos?: PointPos,
  _deletePos?: PointPos
): Operation[] => {
  let newTargetItems: _.Dictionary<ChartItems>;
  let operations: Operation[];

  const targetEltypeList = _.compact([
    selectedChartItem[_prevPos.parentId].elType,
    selectedChartItem[_nextPos?.parentId]?.elType,
    selectedChartItem[_deletePos?.parentId]?.elType,
  ]);
  const ifPosIndex = targetEltypeList.indexOf(ChartItemType.if);
  const _targetPosList = _.compact([_prevPos, _nextPos, _deletePos]);
  const ifPos = _targetPosList[ifPosIndex];
  const targetPos = _targetPosList[Number(!ifPosIndex)];

  /**connect..**/ if (_prevPos && _nextPos && !_deletePos) {
    const { connectType, index } = ifPos.el.dataset;

    operations = [
      {
        key: `items.${targetPos.parentId}.connectionIds`,
        value: getConnectionIds(selectedChartItem[targetPos.parentId].connectionIds, targetPos, ifPos),
      },
      {
        key: `items.${ifPos.parentId}.connectionVariables`,
        value: [
          ..._.compact(selectedChartItem[ifPos.parentId].connectionVariables),
          {
            parentId: ifPos.parentId,
            connectParentId: targetPos.parentId,
            connectType: connectType as ChartItemType,
            index: parseInt(index, 10),
          },
        ],
      },
    ];
  } /** disconnect..**/ else if (_prevPos && !_nextPos && _deletePos) {
    operations = [
      {
        key: `items.${targetPos.parentId}.connectionIds`,
        value: getDisconnectIds(selectedChartItem[targetPos.parentId].connectionIds, targetPos, ifPos),
      },
      {
        key: `items.${ifPos.parentId}.connectionVariables`,
        value: _.compact(selectedChartItem[ifPos.parentId].connectionVariables).filter(
          (_var) => _var.connectParentId !== targetPos.parentId
        ),
      },
    ];
  } /** change.. **/ else if (_prevPos && _nextPos && _deletePos) {
    const targetItems = _.pickBy(selectedChartItem, (_item) =>
      [_prevPos.parentId, _deletePos.parentId, _nextPos.parentId].includes(_item.id)
    );

    newTargetItems = _.mapValues(targetItems, (_item) => {
      if (_item.id === _nextPos.parentId) {
        const { connectType, index } = ifPos.el.dataset;

        return {
          ..._item,
          connectionIds: getConnectionIds(_item.connectionIds, _nextPos, _prevPos),
          ...(_item.connectionVariables && {
            connectionVariables: [
              ..._item.connectionVariables,
              {
                parentId: _nextPos.parentId,
                connectParentId: _prevPos.parentId,
                connectType: connectType as ChartItemType,
                index: parseInt(index, 10),
              },
            ].filter((_var) => _var.connectParentId !== _deletePos.parentId),
          }),
        };
      } else if (_item.id === _deletePos.parentId) {
        return {
          ..._item,
          connectionIds: getDisconnectIds(_item.connectionIds, _deletePos, _prevPos),
          ...(_item.connectionVariables && {
            connectionVariables: _item.connectionVariables.filter((_var) => _var.connectParentId !== _prevPos.parentId),
          }),
        };
      } else if (_item.id === _prevPos.parentId) {
        const { connectType, index } = _nextPos.el.dataset;

        return {
          ..._item,
          connectionIds: getChangeConnectIds(_item.connectionIds, _prevPos, _nextPos, _deletePos),
          ...(_item.connectionVariables && {
            connectionVariables: [
              ..._item.connectionVariables,
              {
                parentId: _prevPos.parentId,
                connectParentId: _nextPos.parentId,
                connectType: connectType as ChartItemType,
                index: parseInt(index, 10),
              },
            ].filter((_var) => _var.connectParentId !== _deletePos.parentId),
          }),
        };
      } else {
        return _item;
      }
    });

    if (newTargetItems) {
      operations = Object.values(newTargetItems).map((_item) => {
        let _changeKey = 'connectionVariables';

        if (_deletePos && _deletePos.parentId === _item.id && !_deletePos.isSlave) {
          _changeKey = 'connectionIds';
        } else if (_nextPos && _nextPos.parentId === _item.id && !_nextPos.isSlave) {
          _changeKey = 'connectionIds';
        } else if (_prevPos.parentId === _item.id && !_prevPos.isSlave) {
          _changeKey = 'connectionIds';
        }

        return {
          key: `items.${_item.id}.${_changeKey}`,
          value: _item[_changeKey],
        };
      });
    }
  }

  return operations;
};

export const getConnectOperationsForVariable = (
  selectedChartItem: _.Dictionary<ChartItems>,
  _prevPos: PointPos,
  _nextPos?: PointPos,
  _deletePos?: PointPos
): Operation[] => {
  let newTargetItems: _.Dictionary<ChartItems>;

  const _targetPosList = _.compact([_prevPos, _nextPos, _deletePos]);

  // 블록과 변수 간 연결상황일 때
  let variablePosIndex = -1;

  for (let _i = 0; _i < _targetPosList.length; _i++) {
    if (!_targetPosList[_i].isSlave) {
      variablePosIndex = _i;
      break;
    }
  }

  if (variablePosIndex < 0) {
    return;
  }

  const variablePos = _targetPosList[variablePosIndex];
  const targetPos = _targetPosList[Number(!variablePosIndex)];

  /**connect..**/ if (_prevPos && _nextPos && !_deletePos) {
    const targetItems = _.pickBy(selectedChartItem, (_item) =>
      [_prevPos.parentId, _nextPos.parentId].includes(_item.id)
    );

    // 변수 아이템은 connectionIds에 할당
    newTargetItems = _.mapValues(targetItems, (_item) => ({
      ..._item,
      ...(_item.id === variablePos.parentId && {
        connectionIds: getConnectionIds(_item.connectionIds, variablePos, targetPos),
      }),
      // 변수를 입력받는 아이템은 connectionVariables에 할당
      // 할당 시 인덱스에 유의해서 넣어야 함
      ...(_item.id === targetPos.parentId && {
        connectionVariables: getConnectionVariables(_item.connectionVariables, targetPos, variablePos),
      }),
    }));
  } /** disconnect..**/ else if (_prevPos && !_nextPos && _deletePos) {
    const targetItems = _.pickBy(selectedChartItem, (_item) =>
      [_prevPos.parentId, _deletePos.parentId].includes(_item.id)
    );

    newTargetItems = _.mapValues(targetItems, (_item) => ({
      ..._item,
      ...(_item.id === variablePos.parentId && {
        connectionIds: getDisconnectIds(_item.connectionIds, variablePos, targetPos),
      }),
      ...(_item.id === targetPos.parentId && {
        connectionVariables: getDisconnectVariables(_item.connectionVariables, variablePos),
      }),
    }));
  } /** change.. **/ else if (_prevPos && _nextPos && _deletePos) {
    const targetItems = _.pickBy(selectedChartItem, (_item) =>
      [_prevPos.parentId, _deletePos.parentId, _nextPos.parentId].includes(_item.id)
    );

    newTargetItems = _.mapValues(targetItems, (_item) => {
      if (_item.id === variablePos.parentId) {
        return {
          ..._item,
          connectionIds: getChangeConnectIds(_item.connectionIds, variablePos, targetPos, _deletePos),
        };
      } else if (_item.id !== targetPos.parentId && _item.id === _deletePos.parentId) {
        // 변수 블록을 바꾸었을 때의 연결관계를 삭제하는 변수 블록

        return {
          ..._item,
          connectionIds: getDisconnectIds(_item.connectionIds, _deletePos, _prevPos),
          ...(_item.connectionVariables && {
            connectionVariables: getDisconnectVariables(_item.connectionVariables, variablePos),
          }),
        };
      } else if (_item.id === targetPos.parentId && _item.id !== _deletePos.parentId) {
        // 변수 연결점을 변경했을 때의 타겟 블록
        return {
          ..._item,
          connectionVariables: getChangeConnectVariables(_item.connectionVariables, targetPos, variablePos, _deletePos),
        };
      } else {
        return _item;
      }
    });
  }

  if (newTargetItems) {
    return Object.values(newTargetItems).map((_item) => {
      let _changeKey;

      if (_item.id === variablePos.parentId) {
        _changeKey = 'connectionIds';
      } else if (_deletePos && _item.id === _deletePos.parentId && !_deletePos.isSlave) {
        _changeKey = 'connectionIds';
      } else if (_item.connectionVariables) {
        _changeKey = 'connectionVariables';
      } else {
        _changeKey = 'connectionIds';
      }

      return {
        key: `items.${_item.id}.${_changeKey}`,
        value: _item[_changeKey],
      };
    });
  }
};

export const getConnectOperationsForBlockToBlock = (
  selectedChartItem: _.Dictionary<ChartItems>,
  _prevPos: PointPos,
  _nextPos?: PointPos,
  _deletePos?: PointPos
): Operation[] => {
  let newTargetItems: _.Dictionary<ChartItems>;

  // 일반적인 블록 간 연결상황일 때
  /**connect..**/ if (_prevPos && _nextPos && !_deletePos) {
    const targetItems = _.pickBy(selectedChartItem, (_item) =>
      [_prevPos.parentId, _nextPos.parentId].includes(_item.id)
    );

    newTargetItems = _.mapValues(targetItems, (_item) => ({
      ..._item,
      ...(_item.id === _prevPos.parentId && {
        connectionIds: getConnectionIds(_item.connectionIds, _prevPos, _nextPos),
      }),
      ...(_item.id === _nextPos.parentId && {
        connectionIds: getConnectionIds(_item.connectionIds, _nextPos, _prevPos),
      }),
    }));
  } /** disconnect..**/ else if (_prevPos && !_nextPos && _deletePos) {
    const targetItems = _.pickBy(selectedChartItem, (_item) =>
      [_prevPos.parentId, _deletePos.parentId].includes(_item.id)
    );

    newTargetItems = _.mapValues(targetItems, (_item) => ({
      ..._item,
      ...(_item.id === _prevPos.parentId && {
        connectionIds: getDisconnectIds(_item.connectionIds, _prevPos, _deletePos),
      }),
      ...(_item.id === _deletePos.parentId && {
        connectionIds: getDisconnectIds(_item.connectionIds, _deletePos, _prevPos),
      }),
    }));
  } /** change.. **/ else if (_prevPos && _nextPos && _deletePos) {
    const targetItems = _.pickBy(selectedChartItem, (_item) =>
      [_prevPos.parentId, _deletePos.parentId, _nextPos.parentId].includes(_item.id)
    );
    newTargetItems = _.mapValues(targetItems, (_item) => {
      if (_item.id === _prevPos.parentId) {
        return {
          ..._item,
          connectionIds: getChangeConnectIds(_item.connectionIds, _prevPos, _nextPos, _deletePos),
        };
      } else if (_item.id === _deletePos.parentId) {
        return {
          ..._item,
          connectionIds: getDisconnectIds(_item.connectionIds, _deletePos, _prevPos),
        };
      } else if (_item.id === _nextPos.parentId) {
        return {
          ..._item,
          connectionIds: getConnectionIds(_item.connectionIds, _nextPos, _prevPos),
        };
      } else {
        return _item;
      }
    });
  }

  if (newTargetItems) {
    return Object.values(newTargetItems).map((_item) => ({
      key: `items.${_item.id}.connectionIds`,
      value: _item.connectionIds,
    }));
  }
};
